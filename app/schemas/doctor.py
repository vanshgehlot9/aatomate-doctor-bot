from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime

class DoctorBase(BaseModel):
    name: str
    specialization: str
    qualifications: List[str]
    experience_years: int
    languages: List[str]
    consultation_fee: float
    availability_schedule: Dict # E.g., {"monday": ["09:00-13:00", "15:00-18:00"]}
    is_active: bool = True

class DoctorCreate(DoctorBase):
    pass

class DoctorUpdate(BaseModel):
    name: Optional[str] = None
    specialization: Optional[str] = None
    qualifications: Optional[List[str]] = None
    experience_years: Optional[int] = None
    languages: Optional[List[str]] = None
    consultation_fee: Optional[float] = None
    availability_schedule: Optional[Dict] = None
    is_active: Optional[bool] = None

class DoctorInDB(DoctorBase):
    id: str
    tenant_id: str
    created_at: datetime
    updated_at: datetime
