from app.db.supabase import db
from app.schemas.laboratory import LabTestCreate, LabTestInDB, TestStatus
from typing import List, Optional
from datetime import datetime
import uuid

class LabService:
    @staticmethod
    def create_lab_test(tenant_id: str, lab_test: LabTestCreate) -> Optional[LabTestInDB]:
        if not db: return None
        
        test_data = lab_test.model_dump()
        test_data["tenant_id"] = tenant_id
        
        if hasattr(lab_test.status, 'value'):
            test_data["status"] = lab_test.status.value
            
        response = db.table("lab_tests").insert(test_data).execute()
        if response.data:
            return LabTestInDB(**response.data[0])
        return None

    @staticmethod
    def update_test_status(tenant_id: str, test_id: str, status: TestStatus, report_url: Optional[str] = None) -> Optional[LabTestInDB]:
        if not db: return None
        
        update_data = {
            "status": status.value,
            "updated_at": datetime.utcnow().isoformat()
        }
        if report_url:
            update_data["report_url"] = report_url
            
        response = db.table("lab_tests").update(update_data).eq("tenant_id", tenant_id).eq("id", test_id).execute()
        if response.data:
            return LabTestInDB(**response.data[0])
        return None

    @staticmethod
    def get_all_tests(tenant_id: str) -> List[LabTestInDB]:
        if not db: return []
        
        response = db.table("lab_tests").select("*").eq("tenant_id", tenant_id).execute()
        if response.data:
            return [LabTestInDB(**row) for row in response.data]
        return []
