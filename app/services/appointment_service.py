from app.db.supabase import db
from app.db.retry import with_retry
from app.schemas.appointment import AppointmentCreate, AppointmentUpdate, AppointmentInDB, AppointmentStatus
from fastapi import HTTPException
from typing import List, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class AppointmentService:
    @staticmethod
    def get_appointment(tenant_id: str, appointment_id: str) -> Optional[AppointmentInDB]:
        if not db: return None
        
        response = with_retry(
            lambda: db.table("appointments").select("*").eq("tenant_id", tenant_id).eq("id", appointment_id).execute()
        )()
        if response.data:
            return AppointmentInDB(**response.data[0])
        return None

    @staticmethod
    def create_appointment(tenant_id: str, appointment: AppointmentCreate) -> Optional[AppointmentInDB]:
        if not db: return None
        
        appointment_data = appointment.model_dump()
        appointment_data["appointment_date"] = str(appointment_data["appointment_date"])
        if isinstance(appointment_data.get("status"), AppointmentStatus):
            appointment_data["status"] = appointment_data["status"].value

        # Calculate slot ID based on doctor, date, start_time
        slot_id = f"{appointment_data['doctor_id']}_{appointment_data['appointment_date']}_{appointment_data['appointment_time']}"
        appointment_data["slot_id"] = slot_id
        appointment_data["tenant_id"] = tenant_id
        
        try:
            # We can check if the slot is booked
            # For simplicity, we just insert the appointment.
            # Real lock would involve a separate slots table or Postgres unique constraint
            response = with_retry(
                lambda: db.table("appointments").insert(appointment_data).execute()
            )()
            if response.data:
                return AppointmentInDB(**response.data[0])
        except Exception as e:
            # Handle potential unique constraint violation if we added one on (doctor_id, date, time)
            logger.error(f"Failed to create appointment: {type(e).__name__}: {e}")
            raise HTTPException(status_code=500, detail="Failed to create appointment")
            
        return None

    @staticmethod
    def update_appointment_status(tenant_id: str, appointment_id: str, status: AppointmentStatus) -> Optional[AppointmentInDB]:
        if not db: return None
        
        update_data = {
            "status": status.value,
        }
        
        response = with_retry(
            lambda: db.table("appointments").update(update_data).eq("tenant_id", tenant_id).eq("id", appointment_id).execute()
        )()
        
        # If cancelled or no_show, we would free up the slot, but since we rely on appointments table,
        # it inherently frees the slot when status is changed if we check status.
        
        if response.data:
            return AppointmentService.get_appointment(tenant_id, appointment_id)
        return None

    @staticmethod
    def get_all_appointments(tenant_id: str) -> List[AppointmentInDB]:
        if not db: return []
        
        response = with_retry(
            lambda: db.table("appointments").select("*").eq("tenant_id", tenant_id).execute()
        )()
        if response.data:
            return [AppointmentInDB(**row) for row in response.data]
        return []
