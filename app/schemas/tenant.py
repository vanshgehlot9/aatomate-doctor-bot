from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict
from datetime import datetime

class TenantBase(BaseModel):
    name: str
    hospital_name: str
    phone_number: str
    email: EmailStr
    address: Optional[str] = None
    whatsapp_number_id: Optional[str] = None
    is_active: bool = True
    clinic_address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    room_floor: Optional[str] = None

class TenantCreate(TenantBase):
    pass

class TenantUpdate(BaseModel):
    name: Optional[str] = None
    hospital_name: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    whatsapp_number_id: Optional[str] = None
    is_active: Optional[bool] = None
    clinic_address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    room_floor: Optional[str] = None

class TenantInDB(TenantBase):
    id: str
    created_at: datetime
    updated_at: datetime
