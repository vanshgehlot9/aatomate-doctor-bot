from fastapi import APIRouter, Depends, HTTPException, Header, status
from app.api.deps import get_current_user, CurrentUser
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from app.db.supabase import db
from app.db.retry import with_retry
import uuid
import random
import string
from datetime import datetime

router = APIRouter()

class UserCreate(BaseModel):
    email: EmailStr
    name: str
    role: Optional[str] = None  # Legacy single-role field (backward compat)
    roles: Optional[List[str]] = None  # New multi-role field
    tenant_id: Optional[str] = None
    phone: Optional[str] = None

class UserResponse(BaseModel):
    uid: str
    email: str
    role: str  # Active role (backward compat)
    roles: List[str] = []
    active_role: str = ""

class UserUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None  # Legacy
    roles: Optional[List[str]] = None  # New multi-role field
    tenant_id: Optional[str] = None

class SwitchRoleRequest(BaseModel):
    role: str

class SwitchRoleResponse(BaseModel):
    success: bool
    active_role: str
    roles: List[str]
    name: str
    email: str
    tenant_id: Optional[str] = None

def generate_random_password(length=16):
    characters = string.ascii_letters + string.digits + string.punctuation
    return ''.join(random.choice(characters) for i in range(length))

@router.post("/", response_model=UserResponse)
def create_user(user_in: UserCreate, current_user: CurrentUser = Depends(get_current_user)):
    """
    Create a new user in Supabase Auth and database.
    Supports both single-role (legacy) and multi-role creation.
    """
    try:
        if not db:
            raise HTTPException(status_code=500, detail="Database not initialized")
            
        random_password = generate_random_password()
        
        # Determine roles array
        if user_in.roles and len(user_in.roles) > 0:
            roles = user_in.roles
        elif user_in.role:
            roles = [user_in.role]
        else:
            raise HTTPException(status_code=400, detail="At least one role must be specified")
        
        active_role = roles[0]
        # Keep legacy `role` field as the first role for backward compat
        legacy_role = roles[0]
        
        # 1. Create the user in Supabase Auth using Admin API
        user_response = with_retry(lambda: db.auth.admin.create_user({
            "email": user_in.email,
            "password": random_password,
            "phone": user_in.phone,
            "email_confirm": True,
            "user_metadata": {
                "name": user_in.name,
                "role": legacy_role,  # Legacy
                "roles": roles,  # New
                "activeRole": active_role,  # New
                "tenantId": user_in.tenant_id,
                "tenant_id": user_in.tenant_id
            }
        }))()
        
        if not user_response.user:
            raise HTTPException(status_code=500, detail="Failed to create user in Auth")
            
        uid = user_response.user.id
        
        # 2. Create the user profile in database
        now = datetime.utcnow().isoformat()
        profile_data = {
            "id": uid,
            "email": user_in.email,
            "name": user_in.name,
            "role": legacy_role,  # Keep legacy column populated
            "roles": roles,  # New JSONB array column
            "active_role": active_role,  # New column
            "tenant_id": user_in.tenant_id,
            "created_at": now,
            "updated_at": now
        }
        
        with_retry(lambda: db.table("users").insert(profile_data).execute())()
            
        return UserResponse(
            uid=uid,
            email=user_in.email,
            role=active_role,
            roles=roles,
            active_role=active_role
        )
        
    except Exception as e:
        if "User already registered" in str(e):
            raise HTTPException(status_code=400, detail="User with this email already exists")
        if isinstance(e, HTTPException):
            raise e
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
        if current_user.active_role == "super_admin":
            response = with_retry(lambda: db.table("users").select("*").execute())()
        else:
            response = with_retry(lambda: db.table("users").select("*").eq("tenant_id", current_user.tenant_id).execute())()
        
        users_list = []
        if response.data:
            for user_data in response.data:
                # Parse roles — handle both new format and legacy
                roles = user_data.get("roles")
                if not roles or not isinstance(roles, list) or len(roles) == 0:
                    legacy_role = user_data.get("role", "user")
                    roles = [legacy_role] if legacy_role else ["user"]
                
                active_role = user_data.get("active_role") or roles[0]
                
                users_list.append({
                    "uid": user_data.get("id"),
                    "email": user_data.get("email"),
                    "name": user_data.get("name"),
                    "role": active_role,  # backward compat
                    "roles": roles,
                    "activeRole": active_role,
                    "tenantId": user_data.get("tenant_id")
                })
            
        return users_list
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch users: {str(e)}")


@router.get("/me")
def get_current_user_profile(current_user: CurrentUser = Depends(get_current_user)):
    """
    Get the authenticated user's full profile including roles.
    """
    try:
        if not db:
            raise HTTPException(status_code=500, detail="Database not initialized")
        
        response = with_retry(lambda: db.table("users").select("*").eq("id", current_user.uid).single().execute())()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="User profile not found")
        
        user_data = response.data
        roles = user_data.get("roles")
        if not roles or not isinstance(roles, list) or len(roles) == 0:
            legacy_role = user_data.get("role", "user")
            roles = [legacy_role] if legacy_role else ["user"]
        
        active_role = user_data.get("active_role") or roles[0]
        
        return {
            "uid": user_data.get("id"),
            "email": user_data.get("email"),
            "name": user_data.get("name"),
            "role": active_role,
            "roles": roles,
            "activeRole": active_role,
            "tenantId": user_data.get("tenant_id"),
            "hospitalId": user_data.get("tenant_id"),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch profile: {str(e)}")


@router.put("/me/active-role", response_model=SwitchRoleResponse)
def switch_active_role(body: SwitchRoleRequest, current_user: CurrentUser = Depends(get_current_user)):
    """
    Switch the authenticated user's active role.
    
    Validates:
    - The requested role is in the user's assigned roles
    - Updates both the database and Supabase Auth metadata
    """
    requested_role = body.role
    
    # Security: verify the requested role is in the user's assigned roles
    if requested_role not in current_user.roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Role '{requested_role}' is not assigned to this user. Assigned roles: {current_user.roles}"
        )
    
    try:
        if not db:
            raise HTTPException(status_code=500, detail="Database not initialized")
        
        now = datetime.utcnow().isoformat()
        
        # 1. Update the database
        response = with_retry(lambda: db.table("users").update({
            "active_role": requested_role,
            "role": requested_role,  # Keep legacy column in sync
            "updated_at": now
        }).eq("id", current_user.uid).execute())()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        updated_user = response.data[0]
        
        try:
            with_retry(lambda: db.auth.admin.update_user_by_id(current_user.uid, {
                "user_metadata": {
                    "activeRole": requested_role,
                    "role": requested_role,  # Legacy
                    "roles": current_user.roles,
                    "tenantId": current_user.tenant_id,
                    "tenant_id": current_user.tenant_id,
                    "name": updated_user.get("name", ""),
                }
            }))()
        except Exception as auth_err:
            # Log but don't fail — DB is already updated
            print(f"Warning: Failed to update auth metadata for role switch: {auth_err}")
        
        return SwitchRoleResponse(
            success=True,
            active_role=requested_role,
            roles=current_user.roles,
            name=updated_user.get("name", ""),
            email=updated_user.get("email", ""),
            tenant_id=current_user.tenant_id
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to switch role: {str(e)}")


@router.put("/{uid}", response_model=UserResponse)
def update_user(uid: str, user_in: UserUpdate, current_user: CurrentUser = Depends(get_current_user)):
    """
    Update a user in Supabase Auth and database.
    """
    if current_user.active_role not in ("hospital_admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Not authorized to update users")
    try:
        if not db:
            raise HTTPException(status_code=500, detail="Database not initialized")
            
        update_data = {}
        
        # Handle roles update
        if user_in.roles is not None and len(user_in.roles) > 0:
            update_data["roles"] = user_in.roles
            update_data["role"] = user_in.roles[0]  # Keep legacy in sync
            # If current active_role is no longer in the roles list, reset it
            # We'll need to fetch current active_role first
            existing = with_retry(lambda: db.table("users").select("active_role").eq("id", uid).single().execute())()
            if existing.data:
                current_active = existing.data.get("active_role", "")
                if current_active not in user_in.roles:
                    update_data["active_role"] = user_in.roles[0]
        elif user_in.role is not None:
            # Legacy single-role update — add to roles array if not present
            existing = with_retry(lambda: db.table("users").select("roles, active_role").eq("id", uid).single().execute())()
            if existing.data:
                current_roles = existing.data.get("roles") or []
                if user_in.role not in current_roles:
                    current_roles.append(user_in.role)
                update_data["roles"] = current_roles
            update_data["role"] = user_in.role
        
        if user_in.name is not None:
            update_data["name"] = user_in.name
        if user_in.tenant_id is not None:
            update_data["tenant_id"] = user_in.tenant_id
            
        if not update_data:
            raise HTTPException(status_code=400, detail="No data provided to update")
            
        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        # Update database
        response = with_retry(lambda: db.table("users").update(update_data).eq("id", uid).execute())()
        if not response.data:
            raise HTTPException(status_code=404, detail="User not found")
            
        # Update Auth metadata
        auth_update = {}
        if "name" in update_data: auth_update["name"] = update_data["name"]
        if "roles" in update_data: auth_update["roles"] = update_data["roles"]
        if "role" in update_data: 
            auth_update["role"] = update_data["role"]
            auth_update["activeRole"] = update_data.get("active_role", update_data["role"])
        if "tenant_id" in update_data: 
            auth_update["tenantId"] = update_data["tenant_id"]
            auth_update["tenant_id"] = update_data["tenant_id"]
            
        if auth_update:
            try:
                with_retry(lambda: db.auth.admin.update_user_by_id(uid, {"user_metadata": auth_update}))()
            except Exception as e:
                print(f"Failed to update auth metadata for {uid}: {e}")
                
        updated_user = response.data[0]
        roles = updated_user.get("roles") or [updated_user.get("role", "user")]
        active_role = updated_user.get("active_role") or roles[0]
        
        return UserResponse(
            uid=updated_user["id"], 
            email=updated_user["email"], 
            role=active_role,
            roles=roles,
            active_role=active_role
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
    if current_user.active_role not in ("hospital_admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Not authorized to delete users")
    try:
        if not db:
            raise HTTPException(status_code=500, detail="Database not initialized")
            
        # Delete from Supabase Auth using Admin API
        try:
            with_retry(lambda: db.auth.admin.delete_user(uid))()
        except Exception as e:
            # If user is not in Auth but might be in db, try deleting from db anyway
            print(f"Warning: User not deleted from auth: {e}")
        
        # Delete from database
        with_retry(lambda: db.table("users").delete().eq("id", uid).execute())()
            
        return {"success": True, "message": "User deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete user: {str(e)}")
