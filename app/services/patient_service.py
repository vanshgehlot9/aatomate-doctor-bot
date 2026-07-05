from app.db.supabase import db
from app.schemas.patient import PatientCreate, PatientUpdate, PatientInDB
from typing import List, Optional
from datetime import datetime

class PatientService:
    @staticmethod
    def get_patient(tenant_id: str, patient_id: str) -> Optional[PatientInDB]:
        if not db: return None
        response = db.table("patients").select("*").eq("tenant_id", tenant_id).eq("id", patient_id).execute()
        if response.data:
            return PatientInDB(**response.data[0])
        return None

    @staticmethod
    def create_patient(tenant_id: str, patient: PatientCreate) -> Optional[PatientInDB]:
        if not db: return None
        
        patient_data = patient.model_dump()
        patient_data["dob"] = str(patient_data["dob"])
        patient_data["tenant_id"] = tenant_id
        
        response = db.table("patients").insert(patient_data).execute()
        if response.data:
            return PatientInDB(**response.data[0])
        return None

    @staticmethod
    def get_all_patients(tenant_id: str) -> List[PatientInDB]:
        if not db: return []
        
        response = db.table("patients").select("*").eq("tenant_id", tenant_id).execute()
        if response.data:
            return [PatientInDB(**row) for row in response.data]
        return []
