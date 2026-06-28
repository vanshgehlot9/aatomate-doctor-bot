from app.db.firebase import get_db
from app.schemas.ipd import BedCreate, BedInDB, BedStatus, AdmissionCreate, AdmissionInDB
from typing import List, Optional
from datetime import datetime
import uuid

class IPDService:
    @staticmethod
    def get_beds_collection(tenant_id: str):
        db = get_db()
        return db.collection("tenants").document(tenant_id).collection("beds") if db else None

    @staticmethod
    def get_admissions_collection(tenant_id: str):
        db = get_db()
        return db.collection("tenants").document(tenant_id).collection("admissions") if db else None

    # Bed Management
    @staticmethod
    def create_bed(tenant_id: str, bed: BedCreate) -> Optional[BedInDB]:
        collection = IPDService.get_beds_collection(tenant_id)
        if not collection: return None
        
        bed_id = str(uuid.uuid4())
        bed_data = bed.model_dump()
        now = datetime.utcnow()
        bed_data.update({"created_at": now, "updated_at": now})
        
        collection.document(bed_id).set(bed_data)
        bed_data["id"] = bed_id
        bed_data["tenant_id"] = tenant_id
        return BedInDB(**bed_data)

    @staticmethod
    def get_all_beds(tenant_id: str) -> List[BedInDB]:
        collection = IPDService.get_beds_collection(tenant_id)
        if not collection: return []
        
        beds = []
        for doc in collection.stream():
            data = doc.to_dict()
            data["id"] = doc.id
            data["tenant_id"] = tenant_id
            beds.append(BedInDB(**data))
        return beds

    # Admission Management
    @staticmethod
    def admit_patient(tenant_id: str, admission: AdmissionCreate) -> Optional[AdmissionInDB]:
        bed_col = IPDService.get_beds_collection(tenant_id)
        adm_col = IPDService.get_admissions_collection(tenant_id)
        if not bed_col or not adm_col: return None
        
        # Check bed availability
        bed_ref = bed_col.document(admission.bed_id)
        bed_doc = bed_ref.get()
        if not bed_doc.exists or bed_doc.to_dict().get("status") != BedStatus.AVAILABLE.value:
            raise ValueError("Bed is not available.")
            
        # Update Bed Status
        bed_ref.update({
            "status": BedStatus.OCCUPIED.value,
            "current_patient_id": admission.patient_id,
            "updated_at": datetime.utcnow()
        })
        
        # Create Admission Record
        adm_id = str(uuid.uuid4())
        adm_data = admission.model_dump()
        adm_data["admission_date"] = str(adm_data["admission_date"])
        now = datetime.utcnow()
        adm_data.update({"created_at": now, "updated_at": now})
        
        if hasattr(admission.status, 'value'):
            adm_data["status"] = admission.status.value
            
        adm_col.document(adm_id).set(adm_data)
        adm_data["id"] = adm_id
        adm_data["tenant_id"] = tenant_id
        
        return AdmissionInDB(**adm_data)
