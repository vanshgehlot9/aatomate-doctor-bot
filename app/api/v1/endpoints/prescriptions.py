from fastapi import APIRouter, Depends, Depends, HTTPException, UploadFile, File, Form, Header
from app.api.deps import get_current_user, CurrentUser
from app.services.ocr_engine import ocr_engine
from app.services.prescription_service import PrescriptionService
from app.schemas.prescription import PrescriptionInDB
import base64

router = APIRouter()

@router.post("/upload")
async def upload_prescription(
    file: UploadFile = File(...),
    appointment_id: str = Form(""),
    patient_id: str = Form(...),
    doctor_id: str = Form(...),
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Uploads a prescription image, runs OCR via Gemini Vision, and creates a structured 
    prescription record in 'needs_verification' status.
    """
    try:
        contents = await file.read()
        mime_type = file.content_type or "image/jpeg"
        
        # In a real system, you would upload `contents` to an S3/GCS bucket here 
        # and get a public/signed URL to store in `image_url`. 
        # For now, we will store a placeholder or base64 (not recommended for large files).
        image_url = "placeholder_url_until_storage_bucket_added"
        
        # 1. Run OCR
        ocr_result = ocr_engine.extract_prescription(image_bytes=contents, mime_type=mime_type)
        
        # 2. Add required base fields
        ocr_result["appointment_id"] = appointment_id
        ocr_result["patient_id"] = patient_id
        ocr_result["doctor_id"] = doctor_id
        ocr_result["image_url"] = image_url
        ocr_result["ocr_provider"] = "gemini-1.5-pro"
        
        # Calculate overall confidence (simple average of all confidence_score fields)
        def extract_scores(obj):
            scores = []
            if isinstance(obj, dict):
                if "confidence_score" in obj and isinstance(obj["confidence_score"], (int, float)):
                    scores.append(obj["confidence_score"])
                for k, v in obj.items():
                    scores.extend(extract_scores(v))
            elif isinstance(obj, list):
                for item in obj:
                    scores.extend(extract_scores(item))
            return scores
            
        scores = extract_scores(ocr_result)
        if scores:
            ocr_result["overall_confidence"] = sum(scores) / len(scores)
        else:
            ocr_result["overall_confidence"] = 0
            
        # 3. Save to DB (Service will handle versioning and status)
        saved_presc = PrescriptionService.create_prescription(current_user.tenant_id, ocr_result)
        
        if not saved_presc:
            raise HTTPException(status_code=500, detail="Failed to save prescription to DB")
            
        # 4. Link to Appointment if provided
        if appointment_id:
            from app.db.supabase import db
            from app.db.retry import with_retry
            if db:
                with_retry(lambda: db.table("appointments").update({
                    "prescription_id": saved_presc.id,
                    "status": "Completed" # Assuming uploading prescription completes the consultation
                }).eq("tenant_id", current_user.tenant_id).eq("id", appointment_id).execute())()
        
        return saved_presc
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{prescription_id}", response_model=PrescriptionInDB)
async def get_prescription(
    prescription_id: str,
    current_user: CurrentUser = Depends(get_current_user)
):
    presc = PrescriptionService.get_prescription(current_user.tenant_id, prescription_id)
    if not presc:
        raise HTTPException(status_code=404, detail="Prescription not found")
    return presc


@router.put("/{prescription_id}/verify")
async def verify_prescription(
    prescription_id: str,
    update_data: dict,
    user_id: str = Header("unknown_staff", alias="x-user-id"),
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Allows staff/doctors to correct OCR mistakes and save a new version.
    """
    # Force status to VERIFIED
    update_data["status"] = "verified"
    update_data["verified_by"] = user_id
    from datetime import datetime
    update_data["verified_at"] = datetime.utcnow().isoformat()
    
    updated = PrescriptionService.update_prescription(
        tenant_id=current_user.tenant_id,
        prescription_id=prescription_id,
        update_data=update_data,
        user_id=user_id,
        changes_summary="Staff verification and correction"
    )
    
    if not updated:
        raise HTTPException(status_code=404, detail="Prescription not found or failed to update")
        
    # TODO: In Phase 4, trigger WhatsApp notification here
    return updated
