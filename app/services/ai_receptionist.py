from google import genai
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

if settings.GEMINI_API_KEY:
    client = genai.Client(api_key=settings.GEMINI_API_KEY)
else:
    client = None
    
class AIReceptionist:
    @staticmethod
    def generate_response(prompt: str, tenant_context: str) -> str:
        if not client:
            return "AI services are currently unavailable. Please contact the front desk."
        
        try:
            system_instruction = f"""
            You are a helpful, professional 24x7 Hospital Receptionist Bot for {tenant_context}.
            Your capabilities include: answering questions about doctor availability, department information,
            consultation fees, OPD timings, and emergency assistance routing.
            Always be empathetic and precise. Never provide final medical diagnoses.
            """
            
            full_prompt = f"{system_instruction}\n\nPatient: {prompt}\nReceptionist:"
            
            response = client.models.generate_content(
                model='gemini-2.5-pro',
                contents=full_prompt
            )
            return response.text
        except Exception as e:
            logger.error(f"Error generating Gemini response: {e}")
            return "I am currently experiencing technical difficulties. Please try again later."
