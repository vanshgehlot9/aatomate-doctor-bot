from app.db.supabase import db
from app.schemas.prescription import PrescriptionInDB, PrescriptionCreate, PrescriptionVersion, PrescriptionStatus
from typing import List, Optional
from datetime import datetime
import uuid

class PrescriptionService:
    @staticmethod
    def get_prescription(tenant_id: str, prescription_id: str) -> Optional[PrescriptionInDB]:
        if not db: return None
        response = db.table("prescriptions").select("*").eq("tenant_id", tenant_id).eq("id", prescription_id).execute()
        if response.data:
            return PrescriptionInDB(**response.data[0])
        return None

    @staticmethod
    def create_prescription(tenant_id: str, prescription_data: dict) -> Optional[PrescriptionInDB]:
        if not db: return None
        
        now = datetime.utcnow()
        
        initial_version = {
            "version": 1,
            "data": prescription_data.copy(),
            "modified_by": "AI_OCR",
            "modified_at": now.isoformat(),
            "changes_made": "Initial AI OCR Extraction"
        }
        
        prescription_data.update({
            "tenant_id": tenant_id,
            "status": PrescriptionStatus.NEEDS_VERIFICATION.value if hasattr(PrescriptionStatus.NEEDS_VERIFICATION, 'value') else "Needs Verification",
            "created_at": now.isoformat(),
            "updated_at": now.isoformat(),
            "versions": [initial_version]
        })
        
        response = db.table("prescriptions").insert(prescription_data).execute()
        if response.data:
            return PrescriptionInDB(**response.data[0])
        return None

    @staticmethod
    def update_prescription(tenant_id: str, prescription_id: str, update_data: dict, user_id: str, changes_summary: str) -> Optional[PrescriptionInDB]:
        if not db: return None
        
        current_resp = db.table("prescriptions").select("*").eq("tenant_id", tenant_id).eq("id", prescription_id).execute()
        if not current_resp.data:
            return None
            
        current_data = current_resp.data[0]
        now = datetime.utcnow()
        
        current_versions = current_data.get("versions", [])
        next_version_num = len(current_versions) + 1
        
        snapshot_data = current_data.copy()
        for k, v in update_data.items():
            if k not in ["status", "updated_at", "verified_by", "verified_at", "approved_by", "approved_at", "versions"]:
                snapshot_data[k] = v
                
        new_version = {
            "version": next_version_num,
            "data": snapshot_data,
            "modified_by": user_id,
            "modified_at": now.isoformat(),
            "changes_made": changes_summary
        }
        
        current_versions.append(new_version)
        update_data["versions"] = current_versions
        update_data["updated_at"] = now.isoformat()
        
        # Ensure status is unwrapped if it's an enum
        if "status" in update_data and hasattr(update_data["status"], "value"):
            update_data["status"] = update_data["status"].value
            
        response = db.table("prescriptions").update(update_data).eq("tenant_id", tenant_id).eq("id", prescription_id).execute()
        if response.data:
            return PrescriptionInDB(**response.data[0])
        return None

    @staticmethod
    def get_patient_prescriptions(tenant_id: str, patient_id: str) -> List[PrescriptionInDB]:
        if not db: return []
        
        response = db.table("prescriptions").select("*").eq("tenant_id", tenant_id).eq("patient_id", patient_id).execute()
        if response.data:
            results = [PrescriptionInDB(**row) for row in response.data]
            results.sort(key=lambda x: x.created_at, reverse=True)
            return results
        return []

    @staticmethod
    def get_active_prescriptions(tenant_id: str, patient_id: str) -> List[PrescriptionInDB]:
        all_prescriptions = PrescriptionService.get_patient_prescriptions(tenant_id, patient_id)
        active_prescriptions = []
        now = datetime.utcnow()
        
        for p in all_prescriptions:
            status_val = p.status.value if hasattr(p.status, "value") else p.status
            if status_val not in ("Verified", "Approved", "Needs Verification"):
                continue
                
            if not p.medicines:
                continue
                
            is_active = False
            created_date = p.created_at.replace(tzinfo=None) if isinstance(p.created_at, datetime) else now
            days_since_created = (now - created_date).days
            
            for med in p.medicines:
                duration_str = med.duration.value if med.duration else ""
                if not duration_str:
                    if days_since_created < 30:
                        is_active = True
                        break
                else:
                    import re
                    match = re.search(r'(\d+)', str(duration_str))
                    if match:
                        duration_days = int(match.group(1))
                        if "month" in str(duration_str).lower():
                            duration_days *= 30
                        elif "week" in str(duration_str).lower():
                            duration_days *= 7
                            
                        if days_since_created <= duration_days:
                            is_active = True
                            break
                    else:
                         if days_since_created < 30:
                             is_active = True
                             break
                             
            if is_active:
                active_prescriptions.append(p)
                
        return active_prescriptions

    @staticmethod
    def get_medicine_schedule(tenant_id: str, patient_id: str) -> dict:
        active_prescriptions = PrescriptionService.get_active_prescriptions(tenant_id, patient_id)
        
        schedule = {
            "Morning (8:00 AM)": [],
            "Afternoon (1:00 PM)": [],
            "Night (9:00 PM)": []
        }
        
        for p in active_prescriptions:
            for med in p.medicines:
                med_name = med.medicine_name.value if med.medicine_name else "Unknown Medicine"
                freq = med.frequency.value.lower() if med.frequency else ""
                instructions = med.instructions.value if med.instructions else ""
                
                if "1-" in freq or "morning" in freq or "od" in freq or "bd" in freq or "tds" in freq or "am" in freq:
                    schedule["Morning (8:00 AM)"].append(f"✓ {med_name} ({instructions})")
                
                if "-1-" in freq or "afternoon" in freq or "tds" in freq:
                    schedule["Afternoon (1:00 PM)"].append(f"✓ {med_name} ({instructions})")
                    
                if "-1" in freq or "night" in freq or "bd" in freq or "tds" in freq or "pm" in freq or "hs" in freq:
                    schedule["Night (9:00 PM)"].append(f"✓ {med_name} ({instructions})")
                    
        return schedule

    @staticmethod
    def format_prescription_for_whatsapp(prescription: PrescriptionInDB) -> str:
        lines = []
        doctor = prescription.doctor_name.value if prescription.doctor_name else "Doctor"
        
        date_val = prescription.prescription_date.value if prescription.prescription_date else None
        if date_val:
            date_str = date_val
        else:
            date_str = prescription.created_at.strftime("%d %b %Y") if isinstance(prescription.created_at, datetime) else str(prescription.created_at)
        
        lines.append(f"📋 *Prescription Summary*")
        lines.append(f"👨‍⚕️ *Doctor:* {doctor}")
        lines.append(f"📅 *Date:* {date_str}")
        lines.append(f"💊 *Medicines:* {len(prescription.medicines)}")
        lines.append("")
        
        for med in prescription.medicines:
            name = med.medicine_name.value if med.medicine_name else "Unknown"
            strength = f" {med.strength.value}" if med.strength else ""
            freq = f" - {med.frequency.value}" if med.frequency else ""
            dur = f" for {med.duration.value}" if med.duration else ""
            inst = f" ({med.instructions.value})" if med.instructions else ""
            
            lines.append(f"✅ *{name}{strength}*")
            if freq or dur or inst:
                lines.append(f"   _{freq.strip(' -')}{dur}{inst}_")
            
        return "\n".join(lines)
