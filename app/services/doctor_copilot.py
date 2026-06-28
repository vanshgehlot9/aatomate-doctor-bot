from google import genai
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

if settings.GEMINI_API_KEY:
    client = genai.Client(api_key=settings.GEMINI_API_KEY)
else:
    client = None

class DoctorCopilotService:
    @staticmethod
    def generate_medical_summary(ocr_text: str, patient_history: str = "") -> str:
        """
        Takes raw OCR text from a medical report and generates a structured summary for the doctor.
        """
        if not client:
            return "AI services are currently unavailable."
        
        try:
            system_instruction = """
            You are a Doctor's AI Copilot.
            You will be provided with raw text extracted from a medical document (like a blood report, X-ray report, prescription) via OCR.
            Your job is to:
            1. Extract the structured data.
            2. Detect any abnormal values or critical findings.
            3. Generate a concise Doctor Brief Summary.
            4. Suggest possible follow-up actions or risk factors.
            
            Keep the response highly professional, structured using markdown, and concise.
            """
            
            full_prompt = f"{system_instruction}\n\nPatient History:\n{patient_history}\n\nRaw Report Text:\n{ocr_text}"
            
            response = client.models.generate_content(
                model='gemini-2.5-pro',
                contents=full_prompt
            )
            return response.text
            
        except Exception as e:
            logger.error(f"Error in Doctor Copilot: {e}")
            return "Failed to generate medical summary."
