from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class PrescriptionStatus(str, Enum):
    PROCESSING = "processing"          # Currently in OCR/AI pipeline
    NEEDS_VERIFICATION = "needs_verification" # OCR done, needs human review
    VERIFIED = "verified"              # Staff has corrected/verified
    APPROVED = "approved"              # Doctor has approved (optional)
    REJECTED = "rejected"              # Unreadable or invalid

class ConfidenceStatus(str, Enum):
    HIGH = "high"       # > 90%
    MEDIUM = "medium"   # 70% - 90%
    LOW = "low"         # < 70%
    VERIFIED = "verified" # Human reviewed

class FieldConfidence(BaseModel):
    value: Any
    confidence_score: float = Field(..., ge=0.0, le=100.0)
    status: ConfidenceStatus

    @classmethod
    def from_value(cls, val: Any, score: float):
        if score >= 90:
            status = ConfidenceStatus.HIGH
        elif score >= 70:
            status = ConfidenceStatus.MEDIUM
        else:
            status = ConfidenceStatus.LOW
        return cls(value=val, confidence_score=score, status=status)

class Medicine(BaseModel):
    medicine_name: FieldConfidence
    strength: Optional[FieldConfidence] = None
    dosage: Optional[FieldConfidence] = None
    frequency: Optional[FieldConfidence] = None
    duration: Optional[FieldConfidence] = None
    instructions: Optional[FieldConfidence] = None

class Diagnosis(BaseModel):
    condition: FieldConfidence
    abbreviation: Optional[str] = None
    notes: Optional[FieldConfidence] = None

class Investigation(BaseModel):
    test_name: FieldConfidence
    notes: Optional[FieldConfidence] = None

class PatientVitals(BaseModel):
    blood_pressure: Optional[FieldConfidence] = None
    temperature: Optional[FieldConfidence] = None
    pulse: Optional[FieldConfidence] = None
    weight: Optional[FieldConfidence] = None
    height: Optional[FieldConfidence] = None

class PrescriptionBase(BaseModel):
    appointment_id: str
    patient_id: str
    doctor_id: str
    
    # Metadata extracted by OCR
    hospital_name: Optional[FieldConfidence] = None
    doctor_name: Optional[FieldConfidence] = None
    doctor_registration: Optional[FieldConfidence] = None
    prescription_date: Optional[FieldConfidence] = None
    patient_name: Optional[FieldConfidence] = None
    patient_age: Optional[FieldConfidence] = None
    patient_gender: Optional[FieldConfidence] = None
    
    # Clinical Data
    chief_complaint: Optional[FieldConfidence] = None
    clinical_notes: Optional[FieldConfidence] = None
    vitals: Optional[PatientVitals] = None
    diagnoses: List[Diagnosis] = []
    medicines: List[Medicine] = []
    investigations: List[Investigation] = []
    
    # Automations & Follow-up
    follow_up_date: Optional[FieldConfidence] = None
    special_notes: Optional[FieldConfidence] = None

class PrescriptionVersion(BaseModel):
    version: int
    data: dict  # The entire snapshot of PrescriptionBase at this version
    modified_by: str  # User ID or "AI_OCR"
    modified_at: datetime
    changes_made: Optional[str] = None

class PrescriptionCreate(PrescriptionBase):
    pass

class PrescriptionInDB(PrescriptionBase):
    id: str
    tenant_id: str
    status: PrescriptionStatus = PrescriptionStatus.PROCESSING
    ocr_provider: Optional[str] = None # e.g. "gemini-1.5-pro", "aws-textract"
    overall_confidence: Optional[float] = None
    image_url: str
    original_text: Optional[str] = None # Raw OCR text dump
    
    versions: List[PrescriptionVersion] = []
    
    created_at: datetime
    updated_at: datetime
    verified_by: Optional[str] = None
    verified_at: Optional[datetime] = None
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
