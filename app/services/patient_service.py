from app.db.supabase import db
from app.db.retry import with_retry
from app.schemas.patient import PatientCreate, PatientUpdate, PatientInDB
from typing import List, Optional
from datetime import datetime

class PatientService:
    @staticmethod
    def get_patient(tenant_id: str, patient_id: str) -> Optional[PatientInDB]:
        if not db: return None
        response = with_retry(
            lambda: db.table("patients").select("*").eq("tenant_id", tenant_id).eq("id", patient_id).execute()
        )()
        if response.data:
            return PatientInDB(**response.data[0])
        return None

    @staticmethod
    def create_patient(tenant_id: str, patient: PatientCreate) -> Optional[PatientInDB]:
        if not db: return None
        
        patient_data = patient.model_dump(exclude_none=True)
        patient_data["dob"] = str(patient_data["dob"])
        patient_data["tenant_id"] = tenant_id
        
        response = with_retry(
            lambda: db.table("patients").insert(patient_data).execute()
        )()
        if response.data:
            return PatientInDB(**response.data[0])
        return None

    @staticmethod
    def get_all_patients(tenant_id: str) -> List[PatientInDB]:
        if not db: return []
        
        response = with_retry(
            lambda: db.table("patients").select("*").eq("tenant_id", tenant_id).execute()
        )()
        if response.data:
            return [PatientInDB(**row) for row in response.data]
        return []

    @staticmethod
    def get_patients_by_phone(tenant_id: str, mobile_number: str) -> List[PatientInDB]:
        """Find all patients registered under a given phone number."""
        if not db: return []
        
        # Normalize: strip leading + and any spaces
        clean = mobile_number.replace("+", "").replace(" ", "").replace("-", "")
        
        # Try exact match first, then partial match with last 10 digits
        response = with_retry(
            lambda: db.table("patients").select("*").eq("tenant_id", tenant_id).execute()
        )()
        if not response.data:
            return []
        
        matches = []
        last10 = clean[-10:] if len(clean) >= 10 else clean
        for row in response.data:
            row_phone = (row.get("mobile_number") or "").replace("+", "").replace(" ", "").replace("-", "")
            if row_phone == clean or row_phone.endswith(last10):
                matches.append(PatientInDB(**row))
        return matches

    @staticmethod
    def get_all_patients_by_phone(mobile_number: str) -> List[PatientInDB]:
        """Find all patients registered under a given phone number across ALL tenants."""
        if not db: return []
        
        clean = mobile_number.replace("+", "").replace(" ", "").replace("-", "")
        
        # We fetch all patients and filter. In a real large app, we'd do a better query.
        response = with_retry(
            lambda: db.table("patients").select("*").execute()
        )()
        if not response.data:
            return []
            
        matches = []
        last10 = clean[-10:] if len(clean) >= 10 else clean
        for row in response.data:
            row_phone = (row.get("mobile_number") or "").replace("+", "").replace(" ", "").replace("-", "")
            if row_phone == clean or row_phone.endswith(last10):
                matches.append(PatientInDB(**row))
        return matches
