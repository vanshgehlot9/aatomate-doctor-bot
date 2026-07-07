import os
import threading
import logging
from supabase import create_client, Client
from app.core.config import settings

logger = logging.getLogger(__name__)

# ── Thread-local Supabase client ────────────────────────────────────────────
# The Supabase Python SDK uses a synchronous httpx client internally.  When
# FastAPI runs sync route handlers it dispatches them to a threadpool.  A single
# shared Client triggers httpx.ReadError / "[Errno 11] Resource temporarily
# unavailable" under concurrent load because the underlying connection pool is
# not thread-safe.  Using thread-local storage gives every worker thread its
# own Client + connection pool, eliminating the contention.
_local = threading.local()


def get_db() -> Client:
    """Return a per-thread Supabase client (created lazily)."""
    client: Client | None = getattr(_local, "client", None)
    if client is not None:
        return client

    try:
        url: str = settings.SUPABASE_URL
        key: str = settings.SUPABASE_KEY
        if not url or not key:
            logger.warning(
                "Supabase URL or Key is missing. Database operations will fail."
            )
            return None
        client = create_client(url, key)
        _local.client = client
        return client
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {e}")
        return None


def get_fresh_db() -> Client:
    """Force-create a brand-new client (useful after transient errors)."""
    _local.client = None
    return get_db()


# Backward-compat: `from app.db.supabase import db` still works.
# This is a lazy property so callers that import `db` at module level
# get the thread-local client when they actually *use* it.
class _LazyDB:
    """Proxy that resolves to the current thread's Supabase client on access."""

    def __getattr__(self, name):
        client = get_db()
        if client is None:
            raise RuntimeError(
                "Supabase client is not initialised – check SUPABASE_URL / SUPABASE_KEY"
            )
        return getattr(client, name)

    def __bool__(self):
        return get_db() is not None


db = _LazyDB()
