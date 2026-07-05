from fastapi import APIRouter, HTTPException, Depends
from typing import List
from app.schemas.appointment import AppointmentCreate, AppointmentInDB, AppointmentStatus, AppointmentUpdate
from app.services.appointment_service import AppointmentService
from app.api.deps import get_current_user, CurrentUser

router = APIRouter()

@router.post("/", response_model=AppointmentInDB)
def create_appointment(appointment_in: AppointmentCreate, current_user: CurrentUser = Depends(get_current_user)):
    """
    Create a new appointment.
    """
    appointment = AppointmentService.create_appointment(current_user.tenant_id, appointment_in)
    if not appointment:
        raise HTTPException(status_code=500, detail="Failed to create appointment")
    return appointment

@router.get("/{appointment_id}", response_model=AppointmentInDB)
def get_appointment(appointment_id: str, current_user: CurrentUser = Depends(get_current_user)):
    """
    Get appointment by ID.
    """
    appointment = AppointmentService.get_appointment(current_user.tenant_id, appointment_id)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appointment

@router.patch("/{appointment_id}/status", response_model=AppointmentInDB)
def update_appointment_status(appointment_id: str, status: AppointmentStatus, current_user: CurrentUser = Depends(get_current_user)):
    """
    Update the status of an appointment.
    """
    appointment = AppointmentService.update_appointment_status(current_user.tenant_id, appointment_id, status)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found or failed to update")
    return appointment

@router.get("/", response_model=List[AppointmentInDB])
def get_all_appointments(current_user: CurrentUser = Depends(get_current_user)):
    """
    List all appointments for a tenant.
    """
    return AppointmentService.get_all_appointments(current_user.tenant_id)
