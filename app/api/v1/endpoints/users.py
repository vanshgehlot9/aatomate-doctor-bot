from fastapi import APIRouter, Depends, HTTPException, Header
from app.api.deps import get_current_user, CurrentUser
from pydantic import BaseModel, EmailStr
from typing import Optional
from app.db.supabase import db
import uuid
import random
import string
from datetime import datetime

router = APIRouter()

class UserCreate(BaseModel):
    email: EmailStr
    name: str
    role: str
    tenant_id: Optional[str] = None
    phone: Optional[str] = None

class UserResponse(BaseModel):
    uid: str
    email: str
    role: str

def generate_random_password(length=16):
    characters = string.ascii_letters + string.digits + string.punctuation
    return ''.join(random.choice(characters) for i in range(length))

@router.post("/", response_model=UserResponse)
def create_user(user_in: UserCreate, current_user: CurrentUser = Depends(get_current_user)):
    """
    Create a new user in Supabase Auth and database.
    """
    try:
        if not db:
            raise HTTPException(status_code=500, detail="Database not initialized")
            
        random_password = generate_random_password()
        
        # 1. Create the user in Supabase Auth using Admin API
        user_response = db.auth.admin.create_user({
            "email": user_in.email,
            "password": random_password,
            "phone": user_in.phone,
            "email_confirm": True,
            "user_metadata": {
                "name": user_in.name,
                "role": user_in.role,
                "tenantId": user_in.tenant_id,
                "tenant_id": user_in.tenant_id
            }
        })
        
        if not user_response.user:
            raise HTTPException(status_code=500, detail="Failed to create user in Auth")
            
        uid = user_response.user.id
        
        # 2. Create the user profile in database
        now = datetime.utcnow().isoformat()
        profile_data = {
            "id": uid,
            "email": user_in.email,
            "name": user_in.name,
            "role": user_in.role,
            "tenant_id": user_in.tenant_id,
            "created_at": now,
            "updated_at": now
        }
        
        db.table("users").insert(profile_data).execute()
            
        return UserResponse(uid=uid, email=user_in.email, role=user_in.role)
        
    except Exception as e:
        if "User already registered" in str(e):
            raise HTTPException(status_code=400, detail="User with this email already exists")
        raise HTTPException(status_code=500, detail=f"Failed to create user: {str(e)}")

@router.get("/")
def get_users(current_user: CurrentUser = Depends(get_current_user)):
    """
    Get all users from database for the current user's tenant.
    """
    try:
        if not db:
            return []
            
        # Filter by the authenticated user's tenantId — no cross-hospital data
        if current_user.role == "super_admin":
            response = db.table("users").select("*").execute()
        else:
            response = db.table("users").select("*").eq("tenant_id", current_user.tenant_id).execute()
        
        users_list = []
        if response.data:
            for user_data in response.data:
                users_list.append({
                    "uid": user_data.get("id"),
                    "email": user_data.get("email"),
                    "name": user_data.get("name"),
                    "role": user_data.get("role"),
                    "tenantId": user_data.get("tenant_id")
                })
            
        return users_list
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch users: {str(e)}")

class UserUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    tenant_id: Optional[str] = None

@router.put("/{uid}", response_model=UserResponse)
def update_user(uid: str, user_in: UserUpdate, current_user: CurrentUser = Depends(get_current_user)):
    """
    Update a user in Supabase Auth and database.
    """
    if current_user.role not in ("hospital_admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Not authorized to update users")
    try:
        if not db:
            raise HTTPException(status_code=500, detail="Database not initialized")
            
        update_data = {k: v for k, v in user_in.model_dump().items() if v is not None}
        if not update_data:
            raise HTTPException(status_code=400, detail="No data provided to update")
            
        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        # Update database
        response = db.table("users").update(update_data).eq("id", uid).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="User not found")
            
        # Update Auth metadata if necessary (admin API)
        # Note: changing tenant/role should ideally also update auth user_metadata
        auth_update = {}
        if "name" in update_data: auth_update["name"] = update_data["name"]
        if "role" in update_data: auth_update["role"] = update_data["role"]
        if "tenant_id" in update_data: 
            auth_update["tenantId"] = update_data["tenant_id"]
            auth_update["tenant_id"] = update_data["tenant_id"]
            
        if auth_update:
            try:
                db.auth.admin.update_user_by_id(uid, {"user_metadata": auth_update})
            except Exception as e:
                print(f"Failed to update auth metadata for {uid}: {e}")
                
        updated_user = response.data[0]
        return UserResponse(
            uid=updated_user["id"], 
            email=updated_user["email"], 
            role=updated_user["role"]
        )
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=f"Failed to update user: {str(e)}")

@router.delete("/{uid}")
def delete_user(uid: str, current_user: CurrentUser = Depends(get_current_user)):
    """
    Delete a user from Supabase Auth and database.
    Only admins within the same tenant can delete users.
    """
    if current_user.role not in ("hospital_admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Not authorized to delete users")
    try:
        if not db:
            raise HTTPException(status_code=500, detail="Database not initialized")
            
        # Delete from Supabase Auth using Admin API
        try:
            db.auth.admin.delete_user(uid)
        except Exception as e:
            # If user is not in Auth but might be in db, try deleting from db anyway
            print(f"Warning: User not deleted from auth: {e}")
        
        # Delete from database
        db.table("users").delete().eq("id", uid).execute()
            
        return {"success": True, "message": "User deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete user: {str(e)}")
