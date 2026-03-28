from fastapi import APIRouter, Depends, HTTPException, Body
from typing import List, Optional
from datetime import datetime

from app.dependencies import get_current_user
from app.core.supabase_client import get_supabase
from app.services.email_service import email_service
from pydantic import BaseModel

router = APIRouter(prefix="/suppliers", tags=["Suppliers"])

class ChaseEmailRequest(BaseModel):
    supplier_gstin: str
    email_to: str
    subject: str
    body: str

@router.get("/")
async def list_suppliers(user: dict = Depends(get_current_user)):
    """Get all suppliers monitored by this CA firm with their risk profiles."""
    supabase = get_supabase()
    if supabase is None:
        # Demo mode placeholder
        return [
            {
                "supplier_gstin": "27AAACR5678B1Z3",
                "supplier_name": "Reliance Steel Ltd.",
                "risk_level": "RED",
                "consecutive_defaults": 3,
                "total_itc_loss": 81000.0,
            },
            {
                "supplier_gstin": "24AAACT1234C1Z1",
                "supplier_name": "Tata Chemicals Pvt Ltd",
                "risk_level": "YELLOW",
                "consecutive_defaults": 1,
                "total_itc_loss": 54000.0,
            }
        ]

    user_id = user.get("id")
    result = supabase.table("supplier_profiles") \
        .select("*") \
        .eq("user_id", user_id) \
        .order("consecutive_defaults", desc=True) \
        .execute()
        
    return result.data

@router.post("/chase")
async def chase_supplier(request: ChaseEmailRequest, user: dict = Depends(get_current_user)):
    """Send an automated follow-up email to a supplier regarding mismatches."""
    
    # 1. Dispatch Email via Resend
    success = email_service.send_supplier_followup(
        to_email=request.email_to,
        subject=request.subject,
        body=request.body
    )
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to dispatch email via Resend.")
        
    # 2. Log to Database if configured
    supabase = get_supabase()
    if supabase is not None:
        # Find supplier profile
        user_id = user.get("id")
        prof = supabase.table("supplier_profiles") \
            .select("id") \
            .eq("user_id", user_id) \
            .eq("supplier_gstin", request.supplier_gstin) \
            .execute()
            
        prof_id = prof.data[0]['id'] if prof.data else None
        
        if prof_id:
            supabase.table("follow_up_emails").insert({
               # Note: normally we'd pass run_id, mapping this to the latest run
               "supplier_profile_id": prof_id,
               "email_to": request.email_to,
               "subject": request.subject,
               "body": request.body,
               "status": "SENT",
               "sent_at": datetime.utcnow().isoformat()
            }).execute()

    return {"status": "success", "message": "Email dispatched"}
