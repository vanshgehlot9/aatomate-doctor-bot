from fastapi import APIRouter, HTTPException, Header
from typing import List
from app.schemas.doctor import DoctorCreate, DoctorInDB
from app.services.doctor_service import DoctorService

router = APIRouter()

@router.post("/", response_model=DoctorInDB)
def create_doctor(doctor_in: DoctorCreate, x_tenant_id: str = Header(...)):
    """
    Create a new doctor.
    """
    doctor = DoctorService.create_doctor(x_tenant_id, doctor_in)
    if not doctor:
        raise HTTPException(status_code=500, detail="Failed to create doctor")
    return doctor

@router.get("/{doctor_id}", response_model=DoctorInDB)
def get_doctor(doctor_id: str, x_tenant_id: str = Header(...)):
    """
    Get doctor by ID.
    """
    doctor = DoctorService.get_doctor(x_tenant_id, doctor_id)
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return doctor

@router.get("/", response_model=List[DoctorInDB])
def get_all_doctors(x_tenant_id: str = Header(...)):
    """
    List all doctors for a tenant.
    """
    return DoctorService.get_all_doctors(x_tenant_id)

@router.delete("/{doctor_id}")
def delete_doctor(doctor_id: str, x_tenant_id: str = Header(...)):
    """
    Delete doctor by ID.
    """
    success = DoctorService.delete_doctor(x_tenant_id, doctor_id)
    if not success:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return {"success": True, "message": "Doctor deleted successfully"}
