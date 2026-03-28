from supabase import create_client, Client
from app.core.config import settings
from typing import Optional

_supabase_client: Optional[Client] = None


def get_supabase() -> Optional[Client]:
    """Get or create Supabase client with service role key."""
    global _supabase_client

    if not settings.is_supabase_configured:
        return None

    if _supabase_client is None:
        _supabase_client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_KEY,
        )

    return _supabase_client
