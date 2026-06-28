from fastapi import APIRouter, HTTPException, Header
from typing import List
from app.schemas.appointment import AppointmentCreate, AppointmentInDB, AppointmentStatus, AppointmentUpdate
from app.services.appointment_service import AppointmentService

router = APIRouter()

@router.post("/", response_model=AppointmentInDB)
def create_appointment(appointment_in: AppointmentCreate, x_tenant_id: str = Header(...)):
    """
    Create a new appointment.
    """
    appointment = AppointmentService.create_appointment(x_tenant_id, appointment_in)
    if not appointment:
        raise HTTPException(status_code=500, detail="Failed to create appointment")
    return appointment

@router.get("/{appointment_id}", response_model=AppointmentInDB)
def get_appointment(appointment_id: str, x_tenant_id: str = Header(...)):
    """
    Get appointment by ID.
    """
    appointment = AppointmentService.get_appointment(x_tenant_id, appointment_id)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appointment

@router.patch("/{appointment_id}/status", response_model=AppointmentInDB)
def update_appointment_status(appointment_id: str, status: AppointmentStatus, x_tenant_id: str = Header(...)):
    """
    Update the status of an appointment.
    """
    appointment = AppointmentService.update_appointment_status(x_tenant_id, appointment_id, status)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found or failed to update")
    return appointment

@router.get("/", response_model=List[AppointmentInDB])
def get_all_appointments(x_tenant_id: str = Header(...)):
    """
    List all appointments for a tenant.
    """
    return AppointmentService.get_all_appointments(x_tenant_id)
