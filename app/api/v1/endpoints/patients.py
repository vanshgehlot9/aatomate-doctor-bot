from fastapi import APIRouter, Depends, HTTPException, Header
from app.api.deps import get_current_user, CurrentUser
from typing import List, Optional
from app.schemas.patient import PatientCreate, PatientInDB
from app.services.patient_service import PatientService

router = APIRouter()

def get_tenant_id(current_user: CurrentUser = Depends(get_current_user)):
    return current_user.tenant_id

@router.post("/", response_model=PatientInDB)
def create_patient(patient_in: PatientCreate, current_user: CurrentUser = Depends(get_current_user)):
    """
    Create a new patient.
    """
    patient = PatientService.create_patient(current_user.tenant_id, patient_in)
    if not patient:
        raise HTTPException(status_code=500, detail="Failed to create patient")
    return patient

@router.get("/{patient_id}", response_model=PatientInDB)
def get_patient(patient_id: str, current_user: CurrentUser = Depends(get_current_user)):
    """
    Get patient by ID.
    """
    patient = PatientService.get_patient(current_user.tenant_id, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

@router.get("/", response_model=List[PatientInDB])
def get_all_patients(current_user: CurrentUser = Depends(get_current_user)):
    """
    List all patients for a tenant.
    """
    return PatientService.get_all_patients(current_user.tenant_id)
