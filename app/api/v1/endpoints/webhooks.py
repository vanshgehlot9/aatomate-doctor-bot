from fastapi import APIRouter, HTTPException, Header, Query
from typing import List, Dict
from datetime import datetime, timedelta
from app.db.supabase import db
from app.db.retry import with_retry
from app.schemas.appointment import AppointmentInDB

router = APIRouter()

@router.get("/appointments/upcoming", response_model=Dict[str, List[AppointmentInDB]])
def get_upcoming_appointments(x_tenant_id: str = Header(...)):
    """
    Webhook endpoint designed for n8n to poll upcoming appointments.
    Categorizes appointments into logical buckets for smart reminders:
    - '7_days': exactly 7 days from now
    - '3_days': exactly 3 days from now
    - '1_day': exactly 1 day from now
    - '5_mins': in exactly 5 minutes
    """
    if not db:
        raise HTTPException(status_code=500, detail="Database connection failed")
        
    response = with_retry(lambda: db.table("appointments").select("*").eq("tenant_id", x_tenant_id).in_("status", ["Confirmed", "Pending"]).execute())()
    docs = response.data if response.data else []
        
    now = datetime.utcnow()
    
    buckets = {
        "7_days": [],
        "3_days": [],
        "1_day": [],
        "3_hours": [],
        "30_mins": [],
        "5_mins": []
    }
    
    for row in docs:
        data = row
        # id and tenant_id are already in the row for Supabase
        
        appt_date_str = data.get("appointment_date")
        appt_time_str = data.get("appointment_time")
        
        if not appt_date_str or not appt_time_str:
            continue
            
        try:
            # Parse 'YYYY-MM-DD HH:MM'
            dt_str = f"{appt_date_str} {appt_time_str}"
            appt_dt = datetime.strptime(dt_str, "%Y-%m-%d %H:%M")
            
            diff = appt_dt - now
            
            # Bucket logic based on time difference (approximations)
            if timedelta(days=6.9) <= diff <= timedelta(days=7.1):
                buckets["7_days"].append(AppointmentInDB(**data))
            elif timedelta(days=2.9) <= diff <= timedelta(days=3.1):
                buckets["3_days"].append(AppointmentInDB(**data))
            elif timedelta(hours=23) <= diff <= timedelta(hours=25):
                buckets["1_day"].append(AppointmentInDB(**data))
            elif timedelta(hours=2.9) <= diff <= timedelta(hours=3.1):
                buckets["3_hours"].append(AppointmentInDB(**data))
            elif timedelta(minutes=29) <= diff <= timedelta(minutes=31):
                buckets["30_mins"].append(AppointmentInDB(**data))
            elif timedelta(minutes=4) <= diff <= timedelta(minutes=6):
                buckets["5_mins"].append(AppointmentInDB(**data))
                
        except Exception:
            continue
            
    return buckets
