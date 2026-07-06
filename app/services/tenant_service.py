from app.db.supabase import db
from app.schemas.tenant import TenantCreate, TenantUpdate, TenantInDB
from typing import List, Optional
from datetime import datetime

class TenantService:
    @staticmethod
    def get_tenant(tenant_id: str) -> Optional[TenantInDB]:
        if not db: return None
        response = db.table("tenants").select("*").eq("id", tenant_id).execute()
        if response.data:
            return TenantInDB(**response.data[0])
        return None

    @staticmethod
    def create_tenant(tenant: TenantCreate) -> Optional[TenantInDB]:
        if not db: return None
        
        tenant_data = tenant.model_dump()
        response = db.table("tenants").insert(tenant_data).execute()
        
        if response.data:
            return TenantInDB(**response.data[0])
        return None

    @staticmethod
    def update_tenant(tenant_id: str, tenant_in: TenantUpdate) -> Optional[TenantInDB]:
        if not db: return None
            
        update_data = {k: v for k, v in tenant_in.model_dump(exclude_unset=True).items() if v is not None}
        if not update_data:
            return TenantService.get_tenant(tenant_id)
            
        response = db.table("tenants").update(update_data).eq("id", tenant_id).execute()
        
        if response.data:
            return TenantService.get_tenant(tenant_id)
        return None

    @staticmethod
    def get_all_tenants() -> List[TenantInDB]:
        if not db: return []
        
        response = db.table("tenants").select("*").execute()
        if response.data:
            return [TenantInDB(**row) for row in response.data]
        return []

    @staticmethod
    def delete_tenant(tenant_id: str) -> bool:
        if not db: return False
        
        response = db.table("tenants").delete().eq("id", tenant_id).execute()
        # Supposing successful delete returns data or simply no error
        return True

    @staticmethod
    def get_tenant_by_phone_number_id(phone_number_id: str) -> Optional[TenantInDB]:
        """
        Resolve a tenant by their WhatsApp Business Phone Number ID.
        This is the authoritative multi-tenant lookup for the WhatsApp webhook.
        """
        if not db or not phone_number_id: return None
        
        response = db.table("tenants").select("*").eq("whatsapp_number_id", phone_number_id).limit(1).execute()
        
        if response.data:
            return TenantInDB(**response.data[0])
        return None
