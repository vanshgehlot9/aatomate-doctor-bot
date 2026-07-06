from fastapi import APIRouter, HTTPException, Depends
from typing import List
from app.api.deps import get_current_user, CurrentUser
from app.schemas.tenant import TenantCreate, TenantInDB, TenantUpdate
from app.services.tenant_service import TenantService

router = APIRouter()

@router.get("/me", response_model=TenantInDB)
def get_my_tenant(current_user: CurrentUser = Depends(get_current_user)):
    """
    Get the current user's tenant details.
    """
    tenant = TenantService.get_tenant(current_user.tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return tenant

@router.put("/me", response_model=TenantInDB)
def update_my_tenant(
    tenant_in: TenantUpdate,
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Update the current user's tenant details.
    """
    tenant = TenantService.update_tenant(current_user.tenant_id, tenant_in)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return tenant

@router.post("/", response_model=TenantInDB)
def create_tenant(tenant_in: TenantCreate):
    """
    Create a new tenant (Hospital/Clinic).
    """
    tenant = TenantService.create_tenant(tenant_in)
    if not tenant:
        raise HTTPException(status_code=500, detail="Failed to create tenant")
    return tenant

@router.get("/{tenant_id}", response_model=TenantInDB)
def get_tenant(tenant_id: str):
    """
    Get tenant by ID.
    """
    tenant = TenantService.get_tenant(tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return tenant

@router.get("/", response_model=List[TenantInDB])
def get_all_tenants():
    """
    List all tenants.
    """
    return TenantService.get_all_tenants()

@router.put("/{tenant_id}", response_model=TenantInDB)
def update_tenant(tenant_id: str, tenant_in: TenantUpdate):
    """
    Update tenant by ID.
    """
    tenant = TenantService.update_tenant(tenant_id, tenant_in)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return tenant

@router.delete("/{tenant_id}")
def delete_tenant(tenant_id: str):
    """
    Delete tenant by ID.
    """
    success = TenantService.delete_tenant(tenant_id)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to delete tenant")
    return {"message": "Tenant deleted successfully"}
