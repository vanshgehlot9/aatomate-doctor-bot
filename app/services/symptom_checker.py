from google import genai
from app.core.config import settings
import logging
import json

logger = logging.getLogger(__name__)

if settings.GEMINI_API_KEY:
    client = genai.Client(api_key=settings.GEMINI_API_KEY)
else:
    client = None

class SymptomCheckerService:
    @staticmethod
    def analyze_symptoms(symptoms_text: str) -> dict:
        """
        Analyzes symptoms using Gemini and returns a structured JSON response.
        """
        if not client:
            return {"error": "AI services are currently unavailable."}
        
        try:
            system_instruction = """
            You are an AI Symptom Checker for a hospital.
            Your task is to analyze the patient's symptoms and output a JSON response.
            
            Rules:
            1. Calculate a severity score from 1-10.
            2. Detect if it is an emergency condition (e.g., chest pain, stroke symptoms, unconsciousness, severe bleeding, heart attack indicators). Set "is_emergency" to true if so.
            3. Suggest a relevant hospital department.
            4. Provide follow-up questions to ask the patient if more context is needed.
            5. NEVER provide a final diagnosis.
            6. Always include a medical disclaimer.
            
            Output format MUST be valid JSON:
            {
                "severity_score": int,
                "is_emergency": bool,
                "suggested_department": "string",
                "follow_up_questions": ["string", "string"],
                "disclaimer": "This is an AI assessment and not a medical diagnosis. Please consult a doctor.",
                "action_recommended": "string"
            }
            """
            
            full_prompt = f"{system_instruction}\n\nPatient Symptoms: {symptoms_text}"
            
            response = client.models.generate_content(
                model='gemini-2.5-pro',
                contents=full_prompt
            )
            # Clean up the response to extract JSON if there are markdown blocks
            response_text = response.text.replace("```json", "").replace("```", "").strip()
            
            return json.loads(response_text)
            
        except Exception as e:
            logger.error(f"Error in symptom checker: {e}")
            return {"error": "Failed to analyze symptoms."}
