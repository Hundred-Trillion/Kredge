"""
WhatsApp alert API endpoint.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.dependencies import get_current_user
from app.core.supabase_client import get_supabase
from app.core.config import settings
from app.services.whatsapp_service import send_reconciliation_alert
from app.api.v1.reconciliation import _demo_runs, _demo_mismatches

router = APIRouter(prefix="/whatsapp", tags=["WhatsApp"])


class SendAlertRequest(BaseModel):
    run_id: str
    phone_override: Optional[str] = None  # Optional phone number override


@router.post("/send")
async def send_whatsapp_alert(
    request: SendAlertRequest,
    user: dict = Depends(get_current_user),
):
    """Send a WhatsApp summary alert for a reconciliation run."""

    if not settings.is_whatsapp_configured:
        return {
            "success": False,
            "message": "WhatsApp Cloud API is not configured. "
                       "Set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN.",
        }

    supabase = get_supabase()

    if supabase is None:
        # Demo mode
        run_data = _demo_runs.get(request.run_id)
        mismatches = _demo_mismatches.get(request.run_id, [])
        phone = request.phone_override or user.get("phone", "")
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

        # Get user phone
        if request.phone_override:
            phone = request.phone_override
        else:
            user_result = supabase.table("users") \
                .select("phone") \
                .eq("id", user["id"]) \
                .single() \
                .execute()
            phone = user_result.data.get("phone", "") if user_result.data else ""

    if not phone:
        raise HTTPException(
            status_code=400,
            detail="No phone number found. Please update your profile or provide a phone number.",
        )

    result = send_reconciliation_alert(
        to_phone=phone,
        run_data=run_data,
        mismatches=mismatches,
    )

    return result
