import firebase_admin
from firebase_admin import credentials, firestore
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Initialize Firebase App
try:
    if settings.FIREBASE_CREDENTIALS_JSON:
        import json
        cred_dict = json.loads(settings.FIREBASE_CREDENTIALS_JSON)
        cred = credentials.Certificate(cred_dict)
        firebase_admin.initialize_app(cred)
    elif settings.FIREBASE_CREDENTIALS_PATH:
        cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
        firebase_admin.initialize_app(cred)
    else:
        # Fallback to default credentials (e.g. if GOOGLE_APPLICATION_CREDENTIALS is set)
        firebase_admin.initialize_app()
    logger.info("Firebase app initialized successfully.")
except ValueError:
    logger.warning("Firebase app already initialized.")
except Exception as e:
    logger.error(f"Failed to initialize Firebase app: {e}")

# Get Firestore Client
def get_db():
    try:
        return firestore.client()
    except Exception as e:
        logger.error(f"Failed to get Firestore client: {e}")
        return None

# Export a global instance for convenience where needed
db = get_db()
