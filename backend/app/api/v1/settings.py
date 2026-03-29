from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.dependencies import get_current_user
from app.core.supabase_client import get_supabase

router = APIRouter(prefix="/settings", tags=["Settings"])

class SettingsUpdate(BaseModel):
    firm_name: str
    telegram_chat_id: Optional[str] = None
    telegram_alerts: bool
    email_signature: str
    default_gst_rate: float
    deadline_buffer_days: int

@router.put("/me")
@router.put("/me/")
async def update_settings(settings: SettingsUpdate, user: dict = Depends(get_current_user)):
    """Update CA firm preferences and settings."""
    supabase = get_supabase()
    
    if supabase is None:
        # Demo mode — simulate success
        return {"status": "success", "message": "Settings updated (Demo Mode)"}
        
    user_id = user.get("id")
    
    try:
        supabase.table("users").update({
            "firm_name": settings.firm_name,
            "telegram_chat_id": settings.telegram_chat_id,
            "telegram_alerts": settings.telegram_alerts,
            "email_signature": settings.email_signature,
            "default_gst_rate": settings.default_gst_rate,
            "deadline_buffer_days": settings.deadline_buffer_days
        }).eq("id", user_id).execute()
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update settings: {str(e)}")
        
    return {"status": "success", "message": "Settings updated successfully"}
