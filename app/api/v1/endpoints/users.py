from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel, EmailStr
from typing import Optional
from app.db.firebase import get_db
import firebase_admin
from firebase_admin import auth
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
def create_user(user_in: UserCreate, x_tenant_id: str = Header(None)):
    """
    Create a new user in Firebase Auth and Firestore.
    Requires an existing valid auth context but since we don't have strict backend RBAC middleware yet,
    we just rely on the frontend sending the tenant_id or passing it in the body.
    """
    try:
        # 1. Create the user in Firebase Auth
        random_password = generate_random_password()
        
        firebase_user = auth.create_user(
            email=user_in.email,
            password=random_password,
            display_name=user_in.name,
            phone_number=user_in.phone
        )
        
        # 2. Set Custom Claims (Optional but good practice)
        auth.set_custom_user_claims(firebase_user.uid, {
            'role': user_in.role,
            'tenantId': user_in.tenant_id
        })
        
        # 3. Create the user profile in Firestore
        db = get_db()
        if db:
            now = datetime.utcnow()
            profile_data = {
                "uid": firebase_user.uid,
                "email": user_in.email,
                "name": user_in.name,
                "role": user_in.role,
                "tenantId": user_in.tenant_id,
                "createdAt": now,
                "updatedAt": now
            }
            db.collection("users").document(firebase_user.uid).set(profile_data)
            
        return UserResponse(uid=firebase_user.uid, email=user_in.email, role=user_in.role)
        
    except auth.EmailAlreadyExistsError:
        raise HTTPException(status_code=400, detail="User with this email already exists")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create user: {str(e)}")

@router.get("/")
def get_users():
    """
    Get all users from Firestore.
    """
    try:
        db = get_db()
        if not db:
            return []
            
        users_ref = db.collection("users")
        docs = users_ref.stream()
        
        users_list = []
        for doc in docs:
            user_data = doc.to_dict()
            users_list.append({
                "uid": user_data.get("uid"),
                "email": user_data.get("email"),
                "name": user_data.get("name"),
                "role": user_data.get("role"),
                "tenantId": user_data.get("tenantId")
            })
            
        return users_list
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch users: {str(e)}")

@router.delete("/{uid}")
def delete_user(uid: str):
    """
    Delete a user from Firebase Auth and Firestore.
    """
    try:
        # Delete from Firebase Auth
        auth.delete_user(uid)
        
        # Delete from Firestore
        db = get_db()
        if db:
            db.collection("users").document(uid).delete()
            
        return {"success": True, "message": "User deleted successfully"}
    except auth.UserNotFoundError:
        # If user is not in Auth but might be in Firestore, try deleting from Firestore anyway
        try:
            db = get_db()
            if db:
                db.collection("users").document(uid).delete()
            return {"success": True, "message": "User deleted from Firestore (not found in Auth)"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to delete user from Firestore: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete user: {str(e)}")
