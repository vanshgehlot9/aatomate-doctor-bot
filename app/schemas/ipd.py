from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date
from enum import Enum

class BedType(str, Enum):
    GENERAL = "General Ward"
    PRIVATE = "Private Room"
    SEMI_PRIVATE = "Semi-Private Room"
    ICU = "ICU"
    NICU = "NICU"

class BedStatus(str, Enum):
    AVAILABLE = "Available"
    OCCUPIED = "Occupied"
    MAINTENANCE = "Maintenance"

class BedBase(BaseModel):
    bed_number: str
    ward_name: str
    bed_type: BedType
    status: BedStatus = BedStatus.AVAILABLE
    current_patient_id: Optional[str] = None

class BedCreate(BedBase):
    pass

class BedInDB(BedBase):
    id: str
    tenant_id: str
    created_at: datetime
    updated_at: datetime

class AdmissionStatus(str, Enum):
    ADMITTED = "Admitted"
    TRANSFERRED = "Transferred"
    DISCHARGED = "Discharged"

class AdmissionBase(BaseModel):
    patient_id: str
    doctor_id: str
    admission_date: date
    reason: str
    bed_id: str
    status: AdmissionStatus = AdmissionStatus.ADMITTED
    discharge_date: Optional[date] = None

class AdmissionCreate(AdmissionBase):
    pass

class AdmissionInDB(AdmissionBase):
    id: str
    tenant_id: str
    created_at: datetime
    updated_at: datetime
