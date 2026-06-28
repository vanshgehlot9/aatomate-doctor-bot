from fastapi import APIRouter, HTTPException, Header, UploadFile, File, Form
from app.services.symptom_checker import SymptomCheckerService
from app.services.ocr_service import ocr_service
from app.services.doctor_copilot import DoctorCopilotService
from pydantic import BaseModel

router = APIRouter()

class SymptomRequest(BaseModel):
    symptoms: str

@router.post("/symptom-checker")
def check_symptoms(request: SymptomRequest, x_tenant_id: str = Header(...)):
    """
    Analyzes patient symptoms and returns an emergency score and department suggestion.
    """
    result = SymptomCheckerService.analyze_symptoms(request.symptoms)
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    return result

@router.post("/document-analysis")
async def analyze_document(
    file: UploadFile = File(...),
    patient_history: str = Form(""),
    x_tenant_id: str = Header(...)
):
    """
    Upload a medical document (image/pdf), extract text via OCR, and generate a Doctor Brief.
    """
    try:
        content = await file.read()
        # 1. Extract text via AWS Textract
        raw_text = ocr_service.extract_text_from_document(content)
        
        if "Failed" in raw_text or "not configured" in raw_text:
             raise HTTPException(status_code=500, detail=raw_text)
             
        # 2. Analyze with Gemini Doctor Copilot
        summary = DoctorCopilotService.generate_medical_summary(raw_text, patient_history)
        
        return {
            "filename": file.filename,
            "raw_text_extracted": raw_text,
            "ai_summary": summary
        }
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))
