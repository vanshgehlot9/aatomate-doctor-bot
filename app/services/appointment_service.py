from app.db.firebase import get_db, db
from app.schemas.appointment import AppointmentCreate, AppointmentUpdate, AppointmentInDB, AppointmentStatus
from google.cloud import firestore
from fastapi import HTTPException
from typing import List, Optional
from datetime import datetime
import uuid

@firestore.transactional
def book_appointment_transaction(transaction, slot_ref, appointment_ref, appointment_data):
    snapshot = slot_ref.get(transaction=transaction)
    
    if snapshot.exists:
        slot_data = snapshot.to_dict()
        if slot_data.get('status') != 'Available':
            raise ValueError("Slot Already Booked")
    
    # Lock the slot
    transaction.set(slot_ref, {
        "doctor_id": appointment_data["doctor_id"],
        "tenant_id": appointment_data["tenant_id"],
        "date": appointment_data["appointment_date"],
        "start_time": appointment_data["appointment_time"],
        "end_time": appointment_data["appointment_end"],
        "status": "Booked",
        "appointment_id": appointment_ref.id,
        "updated_at": datetime.utcnow()
    }, merge=True)
    
    # Create the appointment
    transaction.set(appointment_ref, appointment_data)

class AppointmentService:
    @staticmethod
    def get_collection(tenant_id: str):
        if not db:
            return None
        return db.collection("tenants").document(tenant_id).collection("appointments")

    @staticmethod
    def get_appointment(tenant_id: str, appointment_id: str) -> Optional[AppointmentInDB]:
        collection = AppointmentService.get_collection(tenant_id)
        if not collection: return None
        
        doc = collection.document(appointment_id).get()
        if doc.exists:
            data = doc.to_dict()
            data["id"] = doc.id
            data["tenant_id"] = tenant_id
            return AppointmentInDB(**data)
        return None

    @staticmethod
    def create_appointment(tenant_id: str, appointment: AppointmentCreate) -> Optional[AppointmentInDB]:
        collection = AppointmentService.get_collection(tenant_id)
        if not collection: return None
        
        appointment_id = str(uuid.uuid4())
        now = datetime.utcnow()
        
        appointment_data = appointment.model_dump()
        appointment_data["appointment_date"] = str(appointment_data["appointment_date"])
        if isinstance(appointment_data.get("status"), AppointmentStatus):
            appointment_data["status"] = appointment_data["status"].value

        # Calculate slot ID based on doctor, date, start_time
        slot_id = f"{appointment_data['doctor_id']}_{appointment_data['appointment_date']}_{appointment_data['appointment_time']}"
        appointment_data["slot_id"] = slot_id

        appointment_data.update({
            "tenant_id": tenant_id,
            "created_at": now,
            "updated_at": now
        })
        
        transaction = db.transaction()
        slot_ref = db.collection('appointment_slots').document(slot_id)
        appointment_ref = collection.document(appointment_id)
        
        try:
            book_appointment_transaction(transaction, slot_ref, appointment_ref, appointment_data)
        except ValueError as e:
            if str(e) == "Slot Already Booked":
                raise HTTPException(status_code=409, detail="Sorry, this slot has just been booked. Please choose another time.")
            raise HTTPException(status_code=500, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=500, detail="Failed to lock slot")

        appointment_data["id"] = appointment_id
        return AppointmentInDB(**appointment_data)

    @staticmethod
    def update_appointment_status(tenant_id: str, appointment_id: str, status: AppointmentStatus) -> Optional[AppointmentInDB]:
        collection = AppointmentService.get_collection(tenant_id)
        if not collection: return None
        
        doc_ref = collection.document(appointment_id)
        doc = doc_ref.get()
        if doc.exists:
            data = doc.to_dict()
            doc_ref.update({
                "status": status.value,
                "updated_at": datetime.utcnow()
            })
            
            # If cancelled or no_show, free up the slot
            if status in [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW]:
                if data.get("slot_id"):
                    slot_ref = db.collection('appointment_slots').document(data["slot_id"])
                    slot_ref.update({"status": "Available", "appointment_id": None})

            return AppointmentService.get_appointment(tenant_id, appointment_id)
        return None

    @staticmethod
    def get_all_appointments(tenant_id: str) -> List[AppointmentInDB]:
        collection = AppointmentService.get_collection(tenant_id)
        if not collection: return []
        
        docs = collection.stream()
        appointments = []
        for doc in docs:
            data = doc.to_dict()
            data["id"] = doc.id
            data["tenant_id"] = tenant_id
            appointments.append(AppointmentInDB(**data))
        return appointments
