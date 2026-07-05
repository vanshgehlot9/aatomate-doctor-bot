from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class ReportStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    PROCESSED = "processed"
    FAILED = "failed"


class ReportCategory(str, Enum):
    LABORATORY = "Laboratory"
    RADIOLOGY = "Radiology"
    PRESCRIPTION = "Prescription"
    CARDIOLOGY = "Cardiology"
    PATHOLOGY = "Pathology"
    OTHER = "Other"


class ReportType(str, Enum):
    CBC = "CBC"
    LFT = "LFT"
    KFT = "KFT"
    LIPID_PROFILE = "Lipid Profile"
    THYROID = "Thyroid"
    DIABETES = "Diabetes / Blood Sugar"
    VITAMIN = "Vitamin"
    MRI = "MRI"
    CT_SCAN = "CT Scan"
    XRAY = "X-Ray"
    ULTRASOUND = "Ultrasound"
    ECG = "ECG"
    ECHO = "ECHO"
    PRESCRIPTION = "Prescription"
    DISCHARGE_SUMMARY = "Discharge Summary"
    VACCINATION = "Vaccination"
    BIOPSY = "Biopsy"
    OTHER = "Other"


# Structured parameter for a single lab value
class LabParameter(BaseModel):
    value: Optional[Any] = None
    unit: Optional[str] = None
    reference: Optional[str] = None       # e.g. "13-17"
    status: Optional[str] = None          # "Normal" | "Low" | "High" | "Critical"


class MedicalReportBase(BaseModel):
    patient_id: str
    doctor_id: Optional[str] = None
    hospital_id: Optional[str] = None
    visit_id: Optional[str] = None

    report_type: str = ReportType.OTHER
    category: str = ReportCategory.OTHER

    # Report date (from document, if extractable)
    report_date: Optional[str] = None      # "YYYY-MM-DD"

    file_url: Optional[str] = None
    thumbnail_url: Optional[str] = None

    # Raw OCR output
    ocr_text: Optional[str] = None

    # Parsed structured data: { "Hemoglobin": { value, unit, reference, status } }
    structured_data: Optional[Dict[str, Dict[str, Any]]] = None

    # AI-generated fields
    ai_summary: Optional[str] = None
    ai_recommendation: Optional[str] = None

    # Searchable tags
    tags: List[str] = Field(default_factory=list)

    uploaded_by: str = "patient"   # "patient" | "doctor" | "staff"
    status: ReportStatus = ReportStatus.PENDING

    # WhatsApp media identifiers (used for async download)
    wa_media_id: Optional[str] = None
    wa_mime_type: Optional[str] = None


class MedicalReportCreate(MedicalReportBase):
    pass


class MedicalReportUpdate(BaseModel):
    report_type: Optional[str] = None
    category: Optional[str] = None
    report_date: Optional[str] = None
    file_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    ocr_text: Optional[str] = None
    structured_data: Optional[Dict[str, Dict[str, Any]]] = None
    ai_summary: Optional[str] = None
    ai_recommendation: Optional[str] = None
    tags: Optional[List[str]] = None
    status: Optional[ReportStatus] = None


class MedicalReportInDB(MedicalReportBase):
    id: str
    tenant_id: str
    created_at: datetime
    updated_at: datetime


class ReportSearchRequest(BaseModel):
    patient_id: Optional[str] = None
    query: str                             # keyword or tag
    limit: int = 10


class ReportCompareRequest(BaseModel):
    report_id_1: str
    report_id_2: str
