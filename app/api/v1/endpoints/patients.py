from fastapi import APIRouter, HTTPException, Header
from typing import List, Optional
from app.schemas.patient import PatientCreate, PatientInDB
from app.services.patient_service import PatientService

router = APIRouter()

def get_tenant_id(x_tenant_id: str = Header(..., description="Tenant ID from headers")):
    return x_tenant_id

@router.post("/", response_model=PatientInDB)
def create_patient(patient_in: PatientCreate, x_tenant_id: str = Header(...)):
    """
    Create a new patient.
    """
    patient = PatientService.create_patient(x_tenant_id, patient_in)
    if not patient:
        raise HTTPException(status_code=500, detail="Failed to create patient")
    return patient

@router.get("/{patient_id}", response_model=PatientInDB)
def get_patient(patient_id: str, x_tenant_id: str = Header(...)):
    """
    Get patient by ID.
    """
    patient = PatientService.get_patient(x_tenant_id, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

@router.get("/", response_model=List[PatientInDB])
def get_all_patients(x_tenant_id: str = Header(...)):
    """
    List all patients for a tenant.
    """
    return PatientService.get_all_patients(x_tenant_id)
