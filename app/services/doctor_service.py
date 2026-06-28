from app.db.firebase import get_db
from app.schemas.doctor import DoctorCreate, DoctorUpdate, DoctorInDB
from typing import List, Optional
from datetime import datetime
import uuid

class DoctorService:
    @staticmethod
    def get_collection(tenant_id: str):
        db = get_db()
        if not db:
            return None
        return db.collection("tenants").document(tenant_id).collection("doctors")

    @staticmethod
    def get_doctor(tenant_id: str, doctor_id: str) -> Optional[DoctorInDB]:
        collection = DoctorService.get_collection(tenant_id)
        if not collection: return None
        
        doc = collection.document(doctor_id).get()
        if doc.exists:
            data = doc.to_dict()
            data["id"] = doc.id
            data["tenant_id"] = tenant_id
            return DoctorInDB(**data)
        return None

    @staticmethod
    def create_doctor(tenant_id: str, doctor: DoctorCreate) -> Optional[DoctorInDB]:
        collection = DoctorService.get_collection(tenant_id)
        if not collection: return None
        
        doctor_id = str(uuid.uuid4())
        now = datetime.utcnow()
        
        doctor_data = doctor.model_dump()
        doctor_data.update({
            "created_at": now,
            "updated_at": now
        })
        
        collection.document(doctor_id).set(doctor_data)
        
        doctor_data["id"] = doctor_id
        doctor_data["tenant_id"] = tenant_id
        return DoctorInDB(**doctor_data)

    @staticmethod
    def get_all_doctors(tenant_id: str) -> List[DoctorInDB]:
        collection = DoctorService.get_collection(tenant_id)
        if not collection: return []
        
        docs = collection.stream()
        doctors = []
        for doc in docs:
            data = doc.to_dict()
            data["id"] = doc.id
            data["tenant_id"] = tenant_id
            doctors.append(DoctorInDB(**data))
        return doctors

    @staticmethod
    def delete_doctor(tenant_id: str, doctor_id: str) -> bool:
        collection = DoctorService.get_collection(tenant_id)
        if not collection: return False
        
        doc_ref = collection.document(doctor_id)
        if doc_ref.get().exists:
            doc_ref.delete()
            return True
        return False
