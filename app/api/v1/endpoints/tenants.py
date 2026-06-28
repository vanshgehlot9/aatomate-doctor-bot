from fastapi import APIRouter, HTTPException
from typing import List
from app.schemas.tenant import TenantCreate, TenantInDB
from app.services.tenant_service import TenantService

router = APIRouter()

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
