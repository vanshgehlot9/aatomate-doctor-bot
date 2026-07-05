from app.db.supabase import db
from app.schemas.ipd import BedCreate, BedInDB, BedStatus, AdmissionCreate, AdmissionInDB
from typing import List, Optional
from datetime import datetime
import uuid

class IPDService:
    # Bed Management
    @staticmethod
    def create_bed(tenant_id: str, bed: BedCreate) -> Optional[BedInDB]:
        if not db: return None
        
        bed_data = bed.model_dump()
        bed_data["tenant_id"] = tenant_id
        
        response = db.table("beds").insert(bed_data).execute()
        if response.data:
            return BedInDB(**response.data[0])
        return None

    @staticmethod
    def get_all_beds(tenant_id: str) -> List[BedInDB]:
        if not db: return []
        
        response = db.table("beds").select("*").eq("tenant_id", tenant_id).execute()
        if response.data:
            return [BedInDB(**row) for row in response.data]
        return []

    # Admission Management
    @staticmethod
    def admit_patient(tenant_id: str, admission: AdmissionCreate) -> Optional[AdmissionInDB]:
        if not db: return None
        
        # Check bed availability
        bed_resp = db.table("beds").select("*").eq("tenant_id", tenant_id).eq("id", admission.bed_id).execute()
        
        if not bed_resp.data or bed_resp.data[0].get("status") != (BedStatus.AVAILABLE.value if hasattr(BedStatus.AVAILABLE, 'value') else "Available"):
            raise ValueError("Bed is not available.")
            
        # Update Bed Status
        bed_update = {
            "status": BedStatus.OCCUPIED.value if hasattr(BedStatus.OCCUPIED, 'value') else "Occupied",
            "current_patient_id": admission.patient_id,
            "updated_at": datetime.utcnow().isoformat()
        }
        db.table("beds").update(bed_update).eq("tenant_id", tenant_id).eq("id", admission.bed_id).execute()
        
        # Create Admission Record
        adm_data = admission.model_dump()
        adm_data["admission_date"] = str(adm_data["admission_date"])
        adm_data["tenant_id"] = tenant_id
        
        if hasattr(admission.status, 'value'):
            adm_data["status"] = admission.status.value
            
        adm_resp = db.table("admissions").insert(adm_data).execute()
        
        if adm_resp.data:
            return AdmissionInDB(**adm_resp.data[0])
        return None
