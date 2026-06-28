import google.generativeai as genai
import json
import base64
import os
from typing import Dict, Any

class GeminiOCREngine:
    def __init__(self):
        # API key should ideally be loaded from environment variables
        self.api_key = os.environ.get("GEMINI_API_KEY")
        if self.api_key:
            genai.configure(api_key=self.api_key)
            
        self.generation_config = {
            "temperature": 0.1,  # Low temperature for extraction accuracy
            "response_mime_type": "application/json",
        }
        # Using Gemini 1.5 Pro for best multimodal extraction
        self.model = genai.GenerativeModel(
            model_name="gemini-1.5-pro",
            generation_config=self.generation_config,
        )

    def extract_prescription(self, image_bytes: bytes, mime_type: str) -> Dict[str, Any]:
        if not self.api_key:
            raise Exception("GEMINI_API_KEY not configured. Cannot perform OCR.")
            
        system_instruction = """
        You are an expert AI clinical data extractor. Your task is to extract information from the provided handwritten or printed medical prescription image.
        
        OUTPUT FORMAT (Strict JSON):
        You must return a JSON object containing the exact structure below. 
        For EVERY extracted field (except arrays themselves), you must provide it as an object with:
        - "value": the extracted value (string, number, or null if missing)
        - "confidence_score": your confidence level from 0.0 to 100.0 based on handwriting legibility
        - "status": "high" (>=90), "medium" (70-89), or "low" (<70).
        
        If a field is not present in the prescription, return null for its "value" and 0 for confidence.
        
        Structure:
        {
          "hospital_name": { "value": "", "confidence_score": 0, "status": "" },
          "doctor_name": { "value": "", "confidence_score": 0, "status": "" },
          "doctor_registration": { "value": "", "confidence_score": 0, "status": "" },
          "prescription_date": { "value": "YYYY-MM-DD", "confidence_score": 0, "status": "" },
          "patient_name": { "value": "", "confidence_score": 0, "status": "" },
          "patient_age": { "value": 0, "confidence_score": 0, "status": "" },
          "patient_gender": { "value": "", "confidence_score": 0, "status": "" },
          "chief_complaint": { "value": "", "confidence_score": 0, "status": "" },
          "clinical_notes": { "value": "", "confidence_score": 0, "status": "" },
          "vitals": {
            "blood_pressure": { "value": "", "confidence_score": 0, "status": "" },
            "temperature": { "value": "", "confidence_score": 0, "status": "" },
            "pulse": { "value": "", "confidence_score": 0, "status": "" },
            "weight": { "value": "", "confidence_score": 0, "status": "" },
            "height": { "value": "", "confidence_score": 0, "status": "" }
          },
          "diagnoses": [
             {
               "condition": { "value": "", "confidence_score": 0, "status": "" },
               "abbreviation": "",
               "notes": { "value": "", "confidence_score": 0, "status": "" }
             }
          ],
          "medicines": [
             {
               "medicine_name": { "value": "", "confidence_score": 0, "status": "" },
               "strength": { "value": "", "confidence_score": 0, "status": "" },
               "dosage": { "value": "", "confidence_score": 0, "status": "" },
               "frequency": { "value": "", "confidence_score": 0, "status": "" },
               "duration": { "value": "", "confidence_score": 0, "status": "" },
               "instructions": { "value": "", "confidence_score": 0, "status": "" }
             }
          ],
          "investigations": [
             {
               "test_name": { "value": "", "confidence_score": 0, "status": "" },
               "notes": { "value": "", "confidence_score": 0, "status": "" }
             }
          ],
          "follow_up_date": { "value": "", "confidence_score": 0, "status": "" },
          "special_notes": { "value": "", "confidence_score": 0, "status": "" }
        }
        
        Ensure you only return valid JSON. Do not return markdown ticks.
        """
        
        try:
            # Prepare image part for Gemini API
            image_part = {
                "mime_type": mime_type,
                "data": image_bytes
            }
            
            response = self.model.generate_content([system_instruction, image_part])
            
            # The response is JSON string because of response_mime_type
            result = json.loads(response.text)
            return result
        except Exception as e:
            raise Exception(f"Gemini OCR Failed: {str(e)}")

ocr_engine = GeminiOCREngine()
