"""
FastAPI dependencies for auth verification and Supabase access.
"""

from fastapi import Depends, HTTPException, Header
from typing import Optional
import jwt

from app.core.config import settings
from app.core.supabase_client import get_supabase


async def get_current_user(
    authorization: Optional[str] = Header(None),
) -> dict:
    """
    Verify the Supabase JWT and return user info.
    In demo mode (no Supabase configured), returns a demo user.
    """
    if not settings.is_supabase_configured:
        # Demo mode
        return {
            "id": "demo-user-001",
            "email": "demo@kredge.in",
            "name": "Rajesh Sharma",
            "firm_name": "Sharma & Associates",
            "phone": "+919876543210",
        }

    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")

    token = authorization.replace("Bearer ", "")

    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
        )
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")

        return {
            "id": user_id,
            "email": payload.get("email", ""),
        }
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
