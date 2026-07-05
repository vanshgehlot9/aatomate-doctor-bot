from fastapi import APIRouter, HTTPException, Depends
from typing import List
from app.schemas.laboratory import LabTestCreate, LabTestInDB, TestStatus
from app.services.lab_service import LabService
from pydantic import BaseModel
from app.api.deps import get_current_user, CurrentUser

router = APIRouter()

@router.post("/tests", response_model=LabTestInDB)
def create_lab_test(test_in: LabTestCreate, current_user: CurrentUser = Depends(get_current_user)):
    test = LabService.create_lab_test(current_user.tenant_id, test_in)
    if not test: raise HTTPException(status_code=500, detail="Failed to create lab test")
    return test

@router.get("/tests", response_model=List[LabTestInDB])
def get_all_tests(current_user: CurrentUser = Depends(get_current_user)):
    return LabService.get_all_tests(current_user.tenant_id)

class UpdateTestStatusRequest(BaseModel):
    status: TestStatus
    report_url: str = None

@router.patch("/tests/{test_id}/status", response_model=LabTestInDB)
def update_test_status(test_id: str, payload: UpdateTestStatusRequest, current_user: CurrentUser = Depends(get_current_user)):
    test = LabService.update_test_status(current_user.tenant_id, test_id, payload.status, payload.report_url)
    if not test: raise HTTPException(status_code=404, detail="Test not found")
    return test
