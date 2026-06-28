from app.db.firebase import get_db
from app.schemas.laboratory import LabTestCreate, LabTestInDB, TestStatus
from typing import List, Optional
from datetime import datetime
import uuid

class LabService:
    @staticmethod
    def get_collection(tenant_id: str):
        db = get_db()
        return db.collection("tenants").document(tenant_id).collection("lab_tests") if db else None

    @staticmethod
    def create_lab_test(tenant_id: str, lab_test: LabTestCreate) -> Optional[LabTestInDB]:
        collection = LabService.get_collection(tenant_id)
        if not collection: return None
        
        test_id = str(uuid.uuid4())
        test_data = lab_test.model_dump()
        now = datetime.utcnow()
        test_data.update({"created_at": now, "updated_at": now})
        
        if hasattr(lab_test.status, 'value'):
            test_data["status"] = lab_test.status.value
            
        collection.document(test_id).set(test_data)
        test_data["id"] = test_id
        test_data["tenant_id"] = tenant_id
        return LabTestInDB(**test_data)

    @staticmethod
    def update_test_status(tenant_id: str, test_id: str, status: TestStatus, report_url: Optional[str] = None) -> Optional[LabTestInDB]:
        collection = LabService.get_collection(tenant_id)
        if not collection: return None
        
        doc_ref = collection.document(test_id)
        doc = doc_ref.get()
        if not doc.exists: return None
        
        update_data = {
            "status": status.value,
            "updated_at": datetime.utcnow()
        }
        if report_url:
            update_data["report_url"] = report_url
            
        doc_ref.update(update_data)
        
        updated_doc = doc_ref.get().to_dict()
        updated_doc["id"] = doc_ref.id
        updated_doc["tenant_id"] = tenant_id
        return LabTestInDB(**updated_doc)

    @staticmethod
    def get_all_tests(tenant_id: str) -> List[LabTestInDB]:
        collection = LabService.get_collection(tenant_id)
        if not collection: return []
        
        tests = []
        for doc in collection.stream():
            data = doc.to_dict()
            data["id"] = doc.id
            data["tenant_id"] = tenant_id
            tests.append(LabTestInDB(**data))
        return tests
