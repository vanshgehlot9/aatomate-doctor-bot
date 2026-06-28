from fastapi import APIRouter, HTTPException, Header
from typing import List
from app.schemas.ipd import BedCreate, BedInDB, AdmissionCreate, AdmissionInDB
from app.services.ipd_service import IPDService

router = APIRouter()

@router.post("/beds", response_model=BedInDB)
def create_bed(bed_in: BedCreate, x_tenant_id: str = Header(...)):
    bed = IPDService.create_bed(x_tenant_id, bed_in)
    if not bed: raise HTTPException(status_code=500, detail="Failed to create bed")
    return bed

@router.get("/beds", response_model=List[BedInDB])
def get_beds(x_tenant_id: str = Header(...)):
    return IPDService.get_all_beds(x_tenant_id)

@router.post("/admit", response_model=AdmissionInDB)
def admit_patient(admission_in: AdmissionCreate, x_tenant_id: str = Header(...)):
    try:
        admission = IPDService.admit_patient(x_tenant_id, admission_in)
        if not admission: raise HTTPException(status_code=500, detail="Failed to admit patient")
        return admission
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
