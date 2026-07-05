from app.db.supabase import db
from app.schemas.doctor import DoctorCreate, DoctorUpdate, DoctorInDB
from typing import List, Optional
from datetime import datetime

class DoctorService:
    @staticmethod
    def get_doctor(tenant_id: str, doctor_id: str) -> Optional[DoctorInDB]:
        if not db: return None
        response = db.table("doctors").select("*").eq("tenant_id", tenant_id).eq("id", doctor_id).execute()
        if response.data:
            return DoctorInDB(**response.data[0])
        return None

    @staticmethod
    def create_doctor(tenant_id: str, doctor: DoctorCreate) -> Optional[DoctorInDB]:
        if not db: return None
        
        doctor_data = doctor.model_dump()
        doctor_data["tenant_id"] = tenant_id
        
        response = db.table("doctors").insert(doctor_data).execute()
        if response.data:
            return DoctorInDB(**response.data[0])
        return None

    @staticmethod
    def get_all_doctors(tenant_id: str) -> List[DoctorInDB]:
        if not db: return []
        
        response = db.table("doctors").select("*").eq("tenant_id", tenant_id).execute()
        if response.data:
            return [DoctorInDB(**row) for row in response.data]
        return []

    @staticmethod
    def delete_doctor(tenant_id: str, doctor_id: str) -> bool:
        if not db: return False
        
        response = db.table("doctors").delete().eq("tenant_id", tenant_id).eq("id", doctor_id).execute()
        # In supabase-py, data might be returned on successful delete if configured, or just check count
        # Typically, if it doesn't throw an error, it succeeded.
        return True
