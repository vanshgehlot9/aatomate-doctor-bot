from typing import List, Optional
from datetime import datetime, date, timedelta
from app.db.firebase import db
from app.schemas.schedule import (
    DoctorScheduleCreate,
    DoctorScheduleInDB,
    DoctorScheduleUpdate,
    DoctorHolidayCreate,
    DoctorHolidayInDB,
    AppointmentSlotBase,
    SlotStatus,
    HolidayType
)
from app.services.slot_generator import SlotGeneratorService
import uuid

class ScheduleService:
    @staticmethod
    def get_schedule_collection():
        return db.collection('doctor_schedules')

    @staticmethod
    def get_holiday_collection():
        return db.collection('doctor_holidays')

    @staticmethod
    def create_schedule(schedule_in: DoctorScheduleCreate) -> DoctorScheduleInDB:
        doc_ref = ScheduleService.get_schedule_collection().document()
        data = schedule_in.dict()
        now = datetime.utcnow()
        data['id'] = doc_ref.id
        data['created_at'] = now
        data['updated_at'] = now
        doc_ref.set(data)
        return DoctorScheduleInDB(**data)

    @staticmethod
    def get_doctor_schedules(tenant_id: str, doctor_id: str) -> List[DoctorScheduleInDB]:
        docs = (
            ScheduleService.get_schedule_collection()
            .where('tenant_id', '==', tenant_id)
            .where('doctor_id', '==', doctor_id)
            .stream()
        )
        schedules = []
        for doc in docs:
            data = doc.to_dict()
            schedules.append(DoctorScheduleInDB(**data))
        return schedules
    
    @staticmethod
    def create_holiday(holiday_in: DoctorHolidayCreate) -> DoctorHolidayInDB:
        doc_ref = ScheduleService.get_holiday_collection().document()
        data = holiday_in.dict()
        now = datetime.utcnow()
        data['id'] = doc_ref.id
        # Convert date to string for firestore serialization
        data['date'] = data['date'].isoformat()
        data['created_at'] = now
        data['updated_at'] = now
        doc_ref.set(data)
        
        # Parse back to date for Pydantic
        data['date'] = holiday_in.date
        return DoctorHolidayInDB(**data)

    @staticmethod
    def get_doctor_holidays(tenant_id: str, doctor_id: str, target_date: date) -> List[DoctorHolidayInDB]:
        docs = (
            ScheduleService.get_holiday_collection()
            .where('tenant_id', '==', tenant_id)
            .where('doctor_id', '==', doctor_id)
            .where('date', '==', target_date.isoformat())
            .stream()
        )
        holidays = []
        for doc in docs:
            data = doc.to_dict()
            data['date'] = datetime.strptime(data['date'], "%Y-%m-%d").date()
            # Handle naive datetime conversion safely based on data types
            holidays.append(DoctorHolidayInDB(**data))
        return holidays

    @staticmethod
    def get_available_slots(tenant_id: str, doctor_id: str, target_date: date) -> List[AppointmentSlotBase]:
        """
        Dynamically calculates available slots for a given doctor on a given date.
        Falls back to the doctor's availability_schedule field when no schedule
        documents have been created yet.
        """
        # 1. Try structured schedule documents first
        day_of_week = target_date.weekday()
        schedules = ScheduleService.get_doctor_schedules(tenant_id, doctor_id)
        schedule_for_day = next((s for s in schedules if s.day_of_week == day_of_week), None)

        if schedule_for_day:
            # 2a. Use structured schedule (existing path)
            holidays = ScheduleService.get_doctor_holidays(tenant_id, doctor_id, target_date)
            generated_slots = SlotGeneratorService.generate_slots(schedule_for_day, target_date, holidays)
        else:
            # 2b. Fallback: read availability_schedule from the doctor document
            generated_slots = ScheduleService._slots_from_doctor_availability(
                tenant_id, doctor_id, target_date)

        if not generated_slots:
            return []

        # 3. Filter out already-booked slots
        slots_collection = db.collection('appointment_slots')
        booked_docs = (
            slots_collection
            .where('tenant_id', '==', tenant_id)
            .where('doctor_id', '==', doctor_id)
            .where('date', '==', target_date.isoformat())
            .where('status', 'in', ['Locked', 'Booked', 'Blocked'])
            .stream()
        )
        booked_times = {doc.to_dict()['start_time'] for doc in booked_docs}
        return [s for s in generated_slots if s.start_time not in booked_times]

    # ── Fallback slot generator ─────────────────────────────────────────────────
    DAY_NAMES = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

    @staticmethod
    def _slots_from_doctor_availability(
        tenant_id: str, doctor_id: str, target_date: date,
        slot_minutes: int = 30, buffer_minutes: int = 0
    ) -> List[AppointmentSlotBase]:
        """
        Generate slots from the doctor document's availability_schedule dict.
        Format: {"monday": ["09:00-17:00"], "wednesday": ["10:00-14:00"]}
        Each range produces 30-minute slots (configurable via slot_minutes).
        """
        from app.services.doctor_service import DoctorService
        doctor = DoctorService.get_doctor(tenant_id, doctor_id)
        if not doctor or not doctor.availability_schedule:
            return []

        day_name = ScheduleService.DAY_NAMES[target_date.weekday()]
        ranges = doctor.availability_schedule.get(day_name, [])
        if not ranges:
            return []

        slots: List[AppointmentSlotBase] = []
        slot_td   = timedelta(minutes=slot_minutes)
        buffer_td = timedelta(minutes=buffer_minutes)

        for time_range in ranges:
            try:
                start_str, end_str = time_range.split('-')
                start_h, start_m = map(int, start_str.strip().split(':'))
                end_h,   end_m   = map(int, end_str.strip().split(':'))
            except Exception:
                continue  # skip malformed entries

            current = timedelta(hours=start_h, minutes=start_m)
            end_td  = timedelta(hours=end_h,   minutes=end_m)

            while current + slot_td <= end_td:
                slot_end = current + slot_td
                start_s  = f"{int(current.total_seconds()//3600):02d}:{int((current.total_seconds()%3600)//60):02d}"
                end_s    = f"{int(slot_end.total_seconds()//3600):02d}:{int((slot_end.total_seconds()%3600)//60):02d}"
                slots.append(AppointmentSlotBase(
                    doctor_id=doctor_id,
                    tenant_id=tenant_id,
                    date=target_date,
                    start_time=start_s,
                    end_time=end_s,
                    status=SlotStatus.AVAILABLE,
                ))
                current = slot_end + buffer_td

        return slots
