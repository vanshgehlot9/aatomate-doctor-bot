from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.db.supabase import db
from pydantic import BaseModel
from typing import Optional

security = HTTPBearer()

class CurrentUser(BaseModel):
    uid: str
    tenant_id: str
    role: str
    email: Optional[str] = None

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> CurrentUser:
    token = credentials.credentials
    try:
        # Use Supabase client to get the user based on the JWT
        user_response = db.auth.get_user(token)
        
        if not user_response or not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )
            
        user = user_response.user
        uid = user.id
        email = user.email
        
        # User metadata in Supabase
        metadata = user.user_metadata or {}
        tenant_id = metadata.get("tenant_id") or metadata.get("tenantId")
        role = metadata.get("role", "user")

        if not tenant_id:
            if role == "super_admin":
                tenant_id = "global"
            else:
                # Strictly enforce tenant isolation
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="User does not belong to any tenant."
                )

        return CurrentUser(uid=uid, tenant_id=tenant_id, role=role, email=email)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )

def get_super_admin(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    if current_user.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Requires super admin privileges"
        )
    return current_user
