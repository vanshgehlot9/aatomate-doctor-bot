from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict
from datetime import datetime, date

class PatientBase(BaseModel):
    name: str
    gender: str
    dob: date
    blood_group: Optional[str] = None
    mobile_number: str
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    family_members: List[str] = [] # List of patient IDs
    insurance_details: Optional[Dict] = None
    allergies: List[str] = []
    chronic_diseases: List[str] = []
    medical_history: List[str] = []
    current_medications: List[str] = []

class PatientCreate(PatientBase):
    pass

class PatientUpdate(BaseModel):
    name: Optional[str] = None
    gender: Optional[str] = None
    dob: Optional[date] = None
    blood_group: Optional[str] = None
    mobile_number: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    family_members: Optional[List[str]] = None
    insurance_details: Optional[Dict] = None
    allergies: Optional[List[str]] = None
    chronic_diseases: Optional[List[str]] = None
    medical_history: Optional[List[str]] = None
    current_medications: Optional[List[str]] = None

class PatientInDB(PatientBase):
    id: str
    tenant_id: str
    created_at: datetime
    updated_at: datetime
