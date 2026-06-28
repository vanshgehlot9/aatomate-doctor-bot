from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date
from enum import Enum

class SlotStatus(str, Enum):
    AVAILABLE = "Available"
    LOCKED = "Locked"
    BOOKED = "Booked"
    BLOCKED = "Blocked"

class HolidayType(str, Enum):
    FULL_DAY = "full_day"
    PARTIAL_DAY = "partial_day"

class DoctorScheduleBase(BaseModel):
    doctor_id: str
    tenant_id: str
    day_of_week: int  # 0 = Monday, 6 = Sunday
    start_time: str   # "HH:MM" 24h format
    end_time: str     # "HH:MM" 24h format
    break_start: Optional[str] = None
    break_end: Optional[str] = None
    slot_duration_minutes: int = 15
    buffer_minutes: int = 5

class DoctorScheduleCreate(DoctorScheduleBase):
    pass

class DoctorScheduleUpdate(BaseModel):
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    break_start: Optional[str] = None
    break_end: Optional[str] = None
    slot_duration_minutes: Optional[int] = None
    buffer_minutes: Optional[int] = None

class DoctorScheduleInDB(DoctorScheduleBase):
    id: str
    created_at: datetime
    updated_at: datetime


class DoctorHolidayBase(BaseModel):
    doctor_id: str
    tenant_id: str
    date: date
    reason: str
    type: HolidayType = HolidayType.FULL_DAY
    start_time: Optional[str] = None # For partial day
    end_time: Optional[str] = None   # For partial day

class DoctorHolidayCreate(DoctorHolidayBase):
    pass

class DoctorHolidayInDB(DoctorHolidayBase):
    id: str
    created_at: datetime
    updated_at: datetime


class AppointmentSlotBase(BaseModel):
    doctor_id: str
    tenant_id: str
    date: date
    start_time: str
    end_time: str
    status: SlotStatus = SlotStatus.AVAILABLE
    appointment_id: Optional[str] = None
    locked_at: Optional[datetime] = None

class AppointmentSlotInDB(AppointmentSlotBase):
    id: str # typically formatted as f"{doctor_id}_{date}_{start_time}"
    created_at: datetime
    updated_at: datetime
