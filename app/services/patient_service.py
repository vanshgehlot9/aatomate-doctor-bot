from app.db.firebase import get_db
from app.schemas.patient import PatientCreate, PatientUpdate, PatientInDB
from typing import List, Optional
from datetime import datetime
import uuid

class PatientService:
    @staticmethod
    def get_collection(tenant_id: str):
        db = get_db()
        if not db:
            return None
        return db.collection("tenants").document(tenant_id).collection("patients")

    @staticmethod
    def get_patient(tenant_id: str, patient_id: str) -> Optional[PatientInDB]:
        collection = PatientService.get_collection(tenant_id)
        if not collection: return None
        
        doc = collection.document(patient_id).get()
        if doc.exists:
            data = doc.to_dict()
            data["id"] = doc.id
            data["tenant_id"] = tenant_id
            return PatientInDB(**data)
        return None

    @staticmethod
    def create_patient(tenant_id: str, patient: PatientCreate) -> Optional[PatientInDB]:
        collection = PatientService.get_collection(tenant_id)
        if not collection: return None
        
        patient_id = str(uuid.uuid4())
        now = datetime.utcnow()
        
        patient_data = patient.model_dump()
        # Convert date to string or datetime for Firestore compatibility if needed
        # We'll rely on Pydantic's JSON encoding or manual dict conversion for datetimes
        patient_data["dob"] = str(patient_data["dob"])
        patient_data.update({
            "created_at": now,
            "updated_at": now
        })
        
        collection.document(patient_id).set(patient_data)
        
        patient_data["id"] = patient_id
        patient_data["tenant_id"] = tenant_id
        return PatientInDB(**patient_data)

    @staticmethod
    def get_all_patients(tenant_id: str) -> List[PatientInDB]:
        collection = PatientService.get_collection(tenant_id)
        if not collection: return []
        
        docs = collection.stream()
        patients = []
        for doc in docs:
            data = doc.to_dict()
            data["id"] = doc.id
            data["tenant_id"] = tenant_id
            patients.append(PatientInDB(**data))
        return patients
