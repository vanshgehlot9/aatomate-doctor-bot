from fastapi import APIRouter, HTTPException, Header
from typing import List
from app.schemas.laboratory import LabTestCreate, LabTestInDB, TestStatus
from app.services.lab_service import LabService
from pydantic import BaseModel

router = APIRouter()

@router.post("/tests", response_model=LabTestInDB)
def create_lab_test(test_in: LabTestCreate, x_tenant_id: str = Header(...)):
    test = LabService.create_lab_test(x_tenant_id, test_in)
    if not test: raise HTTPException(status_code=500, detail="Failed to create lab test")
    return test

@router.get("/tests", response_model=List[LabTestInDB])
def get_all_tests(x_tenant_id: str = Header(...)):
    return LabService.get_all_tests(x_tenant_id)

class UpdateTestStatusRequest(BaseModel):
    status: TestStatus
    report_url: str = None

@router.patch("/tests/{test_id}/status", response_model=LabTestInDB)
def update_test_status(test_id: str, payload: UpdateTestStatusRequest, x_tenant_id: str = Header(...)):
    test = LabService.update_test_status(x_tenant_id, test_id, payload.status, payload.report_url)
    if not test: raise HTTPException(status_code=404, detail="Test not found")
    return test
