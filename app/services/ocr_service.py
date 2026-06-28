import boto3
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class OCRService:
    def __init__(self):
        self.client = None
        if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
            try:
                self.client = boto3.client(
                    'textract',
                    region_name=settings.AWS_REGION,
                    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
                )
            except Exception as e:
                logger.error(f"Failed to initialize AWS Textract client: {e}")

    def extract_text_from_document(self, document_bytes: bytes) -> str:
        """
        Extracts raw text from a document using AWS Textract.
        """
        if not self.client:
            return "AWS Textract is not configured."
            
        try:
            response = self.client.detect_document_text(
                Document={'Bytes': document_bytes}
            )
            
            extracted_text = []
            for item in response.get('Blocks', []):
                if item['BlockType'] == 'LINE':
                    extracted_text.append(item['Text'])
                    
            return "\n".join(extracted_text)
        except Exception as e:
            logger.error(f"Error extracting text with Textract: {e}")
            return "Failed to extract text from document."

ocr_service = OCRService()
