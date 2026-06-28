from app.db.firebase import get_db
from app.schemas.prescription import PrescriptionInDB, PrescriptionCreate, PrescriptionVersion, PrescriptionStatus
from typing import List, Optional
from datetime import datetime
import uuid

class PrescriptionService:
    @staticmethod
    def get_collection(tenant_id: str):
        db = get_db()
        if not db:
            return None
        return db.collection("tenants").document(tenant_id).collection("prescriptions")

    @staticmethod
    def get_prescription(tenant_id: str, prescription_id: str) -> Optional[PrescriptionInDB]:
        collection = PrescriptionService.get_collection(tenant_id)
        if not collection: return None
        
        doc = collection.document(prescription_id).get()
        if doc.exists:
            data = doc.to_dict()
            data["id"] = doc.id
            data["tenant_id"] = tenant_id
            return PrescriptionInDB(**data)
        return None

    @staticmethod
    def create_prescription(tenant_id: str, prescription_data: dict) -> Optional[PrescriptionInDB]:
        collection = PrescriptionService.get_collection(tenant_id)
        if not collection: return None
        
        presc_id = str(uuid.uuid4())
        now = datetime.utcnow()
        
        # Initial version 1 snapshot
        initial_version = {
            "version": 1,
            "data": prescription_data.copy(),
            "modified_by": "AI_OCR",
            "modified_at": now.isoformat(),
            "changes_made": "Initial AI OCR Extraction"
        }
        
        prescription_data.update({
            "status": PrescriptionStatus.NEEDS_VERIFICATION,
            "created_at": now,
            "updated_at": now,
            "versions": [initial_version]
        })
        
        collection.document(presc_id).set(prescription_data)
        
        prescription_data["id"] = presc_id
        prescription_data["tenant_id"] = tenant_id
        return PrescriptionInDB(**prescription_data)

    @staticmethod
    def update_prescription(tenant_id: str, prescription_id: str, update_data: dict, user_id: str, changes_summary: str) -> Optional[PrescriptionInDB]:
        collection = PrescriptionService.get_collection(tenant_id)
        if not collection: return None
        
        doc_ref = collection.document(prescription_id)
        doc = doc_ref.get()
        if not doc.exists:
            return None
            
        current_data = doc.to_dict()
        now = datetime.utcnow()
        
        # Calculate new version number
        current_versions = current_data.get("versions", [])
        next_version_num = len(current_versions) + 1
        
        # We need a snapshot of the base data (without metadata fields) to store in version history
        snapshot_data = current_data.copy()
        # Apply the new updates to the snapshot
        for k, v in update_data.items():
            if k not in ["status", "updated_at", "verified_by", "verified_at", "approved_by", "approved_at", "versions"]:
                snapshot_data[k] = v
                
        new_version = {
            "version": next_version_num,
            "data": snapshot_data,
            "modified_by": user_id,
            "modified_at": now.isoformat(),
            "changes_made": changes_summary
        }
        
        current_versions.append(new_version)
        update_data["versions"] = current_versions
        update_data["updated_at"] = now
        
        doc_ref.update(update_data)
        
        # Return updated object
        updated_doc = doc_ref.get().to_dict()
        updated_doc["id"] = doc_ref.id
        updated_doc["tenant_id"] = tenant_id
        return PrescriptionInDB(**updated_doc)
