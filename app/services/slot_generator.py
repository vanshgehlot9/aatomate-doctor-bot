from datetime import datetime, timedelta, date
from typing import List, Optional
from app.schemas.schedule import (
    DoctorScheduleInDB, 
    DoctorHolidayInDB, 
    AppointmentSlotBase, 
    SlotStatus, 
    HolidayType
)

class SlotGeneratorService:
    @staticmethod
    def _time_str_to_timedelta(time_str: str) -> timedelta:
        """Convert 'HH:MM' to timedelta for easy math."""
        hours, minutes = map(int, time_str.split(':'))
        return timedelta(hours=hours, minutes=minutes)

    @staticmethod
    def _timedelta_to_time_str(td: timedelta) -> str:
        """Convert timedelta back to 'HH:MM'."""
        total_seconds = int(td.total_seconds())
        hours = total_seconds // 3600
        minutes = (total_seconds % 3600) // 60
        return f"{hours:02d}:{minutes:02d}"

    @staticmethod
    def _is_holiday_overlap(start_td: timedelta, end_td: timedelta, holidays: List[DoctorHolidayInDB]) -> bool:
        """Check if a generated slot overlaps with any holiday/leave on this date."""
        for holiday in holidays:
            if holiday.type == HolidayType.FULL_DAY:
                return True
            
            if holiday.start_time and holiday.end_time:
                h_start = SlotGeneratorService._time_str_to_timedelta(holiday.start_time)
                h_end = SlotGeneratorService._time_str_to_timedelta(holiday.end_time)
                
                # Overlap logic: Start is before holiday ends AND End is after holiday starts
                if start_td < h_end and end_td > h_start:
                    return True
        return False

    @staticmethod
    def _is_break_overlap(start_td: timedelta, end_td: timedelta, schedule: DoctorScheduleInDB) -> bool:
        """Check if slot overlaps with doctor's break time."""
        if not schedule.break_start or not schedule.break_end:
            return False
        
        b_start = SlotGeneratorService._time_str_to_timedelta(schedule.break_start)
        b_end = SlotGeneratorService._time_str_to_timedelta(schedule.break_end)
        
        if start_td < b_end and end_td > b_start:
            return True
            
        return False

    @staticmethod
    def generate_slots(
        schedule: DoctorScheduleInDB, 
        target_date: date, 
        holidays: List[DoctorHolidayInDB]
    ) -> List[AppointmentSlotBase]:
        """
        Generates available slots for a given schedule and date, excluding breaks and holidays.
        """
        # 1. Base check: Does the day of week match?
        if target_date.weekday() != schedule.day_of_week:
            return [] # No schedule for this day

        # 2. Check full day holidays
        if any(h.type == HolidayType.FULL_DAY for h in holidays):
            return []

        slots = []
        current_time = SlotGeneratorService._time_str_to_timedelta(schedule.start_time)
        end_time = SlotGeneratorService._time_str_to_timedelta(schedule.end_time)
        
        slot_td = timedelta(minutes=schedule.slot_duration_minutes)
        buffer_td = timedelta(minutes=schedule.buffer_minutes)

        while current_time + slot_td <= end_time:
            slot_end = current_time + slot_td
            
            # Check if it overlaps with break
            is_break = SlotGeneratorService._is_break_overlap(current_time, slot_end, schedule)
            # Check if it overlaps with partial day holiday
            is_holiday = SlotGeneratorService._is_holiday_overlap(current_time, slot_end, holidays)
            
            if not is_break and not is_holiday:
                slots.append(AppointmentSlotBase(
                    doctor_id=schedule.doctor_id,
                    tenant_id=schedule.tenant_id,
                    date=target_date,
                    start_time=SlotGeneratorService._timedelta_to_time_str(current_time),
                    end_time=SlotGeneratorService._timedelta_to_time_str(slot_end),
                    status=SlotStatus.AVAILABLE
                ))
            
            # Advance time by slot + buffer
            current_time = slot_end + buffer_td

        return slots
