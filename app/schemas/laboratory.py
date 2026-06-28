from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum

class TestStatus(str, Enum):
    PENDING = "Pending"
    SAMPLE_COLLECTED = "Sample Collected"
    PROCESSING = "Processing"
    COMPLETED = "Completed"

class LabTestBase(BaseModel):
    patient_id: str
    doctor_id: str
    test_name: str
    status: TestStatus = TestStatus.PENDING
    technician_id: Optional[str] = None
    report_url: Optional[str] = None
    notes: Optional[str] = None

class LabTestCreate(LabTestBase):
    pass

class LabTestInDB(LabTestBase):
    id: str
    tenant_id: str
    created_at: datetime
    updated_at: datetime
