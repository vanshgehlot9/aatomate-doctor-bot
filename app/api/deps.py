from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.db.supabase import db
from pydantic import BaseModel
from typing import Optional, List, Callable

security = HTTPBearer()

class CurrentUser(BaseModel):
    uid: str
    tenant_id: str
    role: str  # Backward compat alias — same as active_role
    active_role: str
    roles: List[str] = []
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

        # --- Multi-role support ---
        # Try new multi-role fields first, fall back to legacy single role
        roles = metadata.get("roles")
        active_role = metadata.get("activeRole") or metadata.get("active_role")
        legacy_role = metadata.get("role", "user")

        # Normalize roles to a list
        if isinstance(roles, list) and len(roles) > 0:
            roles = roles
        elif legacy_role:
            roles = [legacy_role]
        else:
            roles = ["user"]

        # Determine active role
        if not active_role or active_role not in roles:
            active_role = roles[0]

        if not tenant_id:
            if "super_admin" in roles:
                tenant_id = "global"
            else:
                # Strictly enforce tenant isolation
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="User does not belong to any tenant."
                )

        return CurrentUser(
            uid=uid,
            tenant_id=tenant_id,
            role=active_role,  # backward compat
            active_role=active_role,
            roles=roles,
            email=email
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )

def get_super_admin(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    if current_user.active_role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Requires super admin privileges"
        )
    return current_user


def require_active_role(*allowed_roles: str) -> Callable:
    """
    Dependency factory: ensures the user's active_role is one of the allowed roles.
    
    Usage in endpoint:
        @router.get("/", dependencies=[Depends(require_active_role("hospital_admin", "super_admin"))])
    """
    def checker(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if current_user.active_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Active role '{current_user.active_role}' is not authorized. Required: {', '.join(allowed_roles)}"
            )
        return current_user
    return checker


def require_any_assigned_role(*allowed_roles: str) -> Callable:
    """
    Dependency factory: ensures the user has at least one of the allowed roles
    in their assigned roles list (regardless of which is currently active).
    """
    def checker(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if not any(r in current_user.roles for r in allowed_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"User does not have any of the required roles: {', '.join(allowed_roles)}"
            )
        return current_user
    return checker
