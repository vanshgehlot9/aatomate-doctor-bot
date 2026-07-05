import os
from supabase import create_client, Client
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Initialize Supabase Client
def get_db() -> Client:
    try:
        url: str = settings.SUPABASE_URL
        key: str = settings.SUPABASE_KEY
        if not url or not key:
            logger.warning("Supabase URL or Key is missing. Database operations will fail.")
            return None
        return create_client(url, key)
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {e}")
        return None

# Export a global instance for convenience where needed
db = get_db()
