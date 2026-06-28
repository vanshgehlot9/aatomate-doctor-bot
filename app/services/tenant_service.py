from app.db.firebase import get_db
from app.schemas.tenant import TenantCreate, TenantUpdate, TenantInDB
from typing import List, Optional
from datetime import datetime
import uuid

COLLECTION_NAME = "tenants"

class TenantService:
    @staticmethod
    def get_tenant(tenant_id: str) -> Optional[TenantInDB]:
        db = get_db()
        if not db:
            return None
        doc_ref = db.collection(COLLECTION_NAME).document(tenant_id)
        doc = doc_ref.get()
        if doc.exists:
            data = doc.to_dict()
            data["id"] = doc.id
            return TenantInDB(**data)
        return None

    @staticmethod
    def create_tenant(tenant: TenantCreate) -> Optional[TenantInDB]:
        db = get_db()
        if not db:
            return None
        
        tenant_id = str(uuid.uuid4())
        now = datetime.utcnow()
        
        tenant_data = tenant.model_dump()
        tenant_data.update({
            "created_at": now,
            "updated_at": now
        })
        
        db.collection(COLLECTION_NAME).document(tenant_id).set(tenant_data)
        
        tenant_data["id"] = tenant_id
        return TenantInDB(**tenant_data)

    @staticmethod
    def get_all_tenants() -> List[TenantInDB]:
        db = get_db()
        if not db:
            return []
        
        docs = db.collection(COLLECTION_NAME).stream()
        tenants = []
        for doc in docs:
            data = doc.to_dict()
            data["id"] = doc.id
            tenants.append(TenantInDB(**data))
        return tenants
