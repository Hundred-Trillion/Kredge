"""
Telegram alert API endpoint.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.dependencies import get_current_user
from app.core.supabase_client import get_supabase
from app.core.config import settings
from app.services.telegram_service import send_reconciliation_alert

# Using local mock data structure for demo mode if needed
# We need to import these carefully or reference them directly
from app.api.v1.reconciliation import _demo_runs, _demo_mismatches

router = APIRouter(prefix="/telegram", tags=["Telegram"])


class SendAlertRequest(BaseModel):
    run_id: str
    chat_id_override: Optional[str] = None  # Optional Chat ID override


@router.post("/send")
async def send_telegram_alert(
    request: SendAlertRequest,
    user: dict = Depends(get_current_user),
):
    """Send a Telegram summary alert for a reconciliation run."""

    if not settings.is_telegram_configured:
        return {
            "success": False,
            "message": "Telegram Bot API is not configured. Set TELEGRAM_BOT_TOKEN.",
        }

    supabase = get_supabase()

    if supabase is None:
        # Demo mode
        run_data = _demo_runs.get(request.run_id)
        mismatches = _demo_mismatches.get(request.run_id, [])
        chat_id = request.chat_id_override or "demo_chat_id"
    else:
        # Fetch run data
        run_result = supabase.table("reconciliation_runs") \
            .select("*, clients(client_name, gstin)") \
            .eq("id", request.run_id) \
            .single() \
            .execute()

        if not run_result.data:
            raise HTTPException(status_code=404, detail="Run not found")

        run_data = run_result.data
        if "clients" in run_data:
            run_data["client_name"] = run_data["clients"].get("client_name")
            run_data["gstin"] = run_data["clients"].get("gstin")
            del run_data["clients"]

        mismatch_result = supabase.table("mismatches") \
            .select("*") \
            .eq("run_id", request.run_id) \
            .order("itc_at_risk", desc=True) \
            .execute()

        mismatches = mismatch_result.data

        # Get user Telegram Chat ID from metadata or a specific column
        # For now, we'll try to find it from the user's profile metadata
        if request.chat_id_override:
            chat_id = request.chat_id_override
        else:
            # We assume the CA has saved their chat_id in their user profile
            user_result = supabase.table("users") \
                .select("telegram_chat_id") \
                .eq("id", user["id"]) \
                .single() \
                .execute()
            chat_id = user_result.data.get("telegram_chat_id", "") if user_result.data else ""

    if not chat_id:
        raise HTTPException(
            status_code=400,
            detail="No Telegram Chat ID found. Please update your settings or provide a Chat ID.",
        )

    result = await send_reconciliation_alert(
        chat_id=chat_id,
        run_data=run_data,
        mismatches=mismatches,
    )

    return result
