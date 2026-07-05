from fastapi import APIRouter, Depends, HTTPException, Header
from app.api.deps import get_current_user, CurrentUser
from typing import List
from app.schemas.ipd import BedCreate, BedInDB, AdmissionCreate, AdmissionInDB
from app.services.ipd_service import IPDService

router = APIRouter()

@router.post("/beds", response_model=BedInDB)
def create_bed(bed_in: BedCreate, current_user: CurrentUser = Depends(get_current_user)):
    bed = IPDService.create_bed(current_user.tenant_id, bed_in)
    if not bed: raise HTTPException(status_code=500, detail="Failed to create bed")
    return bed

@router.get("/beds", response_model=List[BedInDB])
def get_beds(current_user: CurrentUser = Depends(get_current_user)):
    return IPDService.get_all_beds(current_user.tenant_id)

@router.post("/admit", response_model=AdmissionInDB)
def admit_patient(admission_in: AdmissionCreate, current_user: CurrentUser = Depends(get_current_user)):
    try:
        admission = IPDService.admit_patient(current_user.tenant_id, admission_in)
        if not admission: raise HTTPException(status_code=500, detail="Failed to admit patient")
        return admission
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
