from fastapi import APIRouter, HTTPException, Header, Query
from typing import List
from datetime import date
from app.schemas.schedule import (
    DoctorScheduleCreate,
    DoctorScheduleInDB,
    DoctorHolidayCreate,
    DoctorHolidayInDB,
    AppointmentSlotBase
)
from app.services.schedule_service import ScheduleService

router = APIRouter()

@router.post("/", response_model=DoctorScheduleInDB)
def create_schedule(schedule_in: DoctorScheduleCreate, x_tenant_id: str = Header(...)):
    """
    Create a new schedule rule for a doctor.
    """
    if schedule_in.tenant_id != x_tenant_id:
        raise HTTPException(status_code=403, detail="Tenant mismatch")
    return ScheduleService.create_schedule(schedule_in)

@router.get("/{doctor_id}", response_model=List[DoctorScheduleInDB])
def get_doctor_schedules(doctor_id: str, x_tenant_id: str = Header(...)):
    """
    Get all schedule rules for a doctor.
    """
    return ScheduleService.get_doctor_schedules(x_tenant_id, doctor_id)

@router.post("/holidays", response_model=DoctorHolidayInDB)
def create_holiday(holiday_in: DoctorHolidayCreate, x_tenant_id: str = Header(...)):
    """
    Create a new holiday/leave for a doctor.
    """
    if holiday_in.tenant_id != x_tenant_id:
        raise HTTPException(status_code=403, detail="Tenant mismatch")
    return ScheduleService.create_holiday(holiday_in)

@router.get("/{doctor_id}/slots", response_model=List[AppointmentSlotBase])
def get_available_slots(
    doctor_id: str, 
    target_date: date = Query(..., description="Target date in YYYY-MM-DD format"),
    x_tenant_id: str = Header(...)
):
    """
    Dynamically generates and returns available slots for a given doctor on a specific date,
    accounting for existing locked/booked appointments, breaks, and holidays.
    """
    return ScheduleService.get_available_slots(x_tenant_id, doctor_id, target_date)
