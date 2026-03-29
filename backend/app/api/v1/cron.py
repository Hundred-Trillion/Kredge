from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime, timedelta
import asyncio

from app.core.config import settings
from app.core.supabase_client import get_supabase
from app.services.telegram_service import format_inr, send_telegram_message

router = APIRouter(prefix="/cron", tags=["Cron Jobs"])
security = HTTPBearer()

def verify_cron_secret(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Authorize cron executions using a secret token."""
    if not settings.CRON_SECRET or credentials.credentials != settings.CRON_SECRET:
        raise HTTPException(status_code=401, detail="Invalid cron secret")
    return True

@router.post("/monthly-summary")
async def generate_monthly_summaries(authorized: bool = Depends(verify_cron_secret)):
    """
    Cron Job trigger: Generates the monthly summary for every active CA firm
    based on the previous month's reconciliation data, sending Telegram alerts.
    """
    supabase = get_supabase()
    if supabase is None:
        return {"status": "success", "message": "Demo Mode: Cron job skipped"}
        
    now = datetime.utcnow()
    # Find the previous month by subtracting config days
    first_day_this_month = now.replace(day=1)
    last_month_date = first_day_this_month - timedelta(days=1)
    target_month = last_month_date.month
    target_year = last_month_date.year

    # Get all users (CA firms) who have telegram alerts enabled
    users_resp = supabase.table("users").select("id, telegram_chat_id, name, telegram_alerts").eq("telegram_alerts", True).execute()
    users = users_resp.data

    if not users:
        return {"status": "success", "message": "No active users opted in for monthly summaries."}
        
    summary_count = 0
    
    for user in users:
        user_id = user["id"]
        chat_id = user.get("telegram_chat_id")
        ca_name = user.get("name", "CA")
        
        # We need to construct a summary
        runs_query = supabase.table("reconciliation_runs") \
            .select("total_matched, invoice_count, run_date, clients!inner(user_id)") \
            .gte("run_date", last_month_date.replace(day=1).isoformat()) \
            .lt("run_date", first_day_this_month.isoformat()) \
            .eq("clients.user_id", user_id) \
            .execute()
            
        runs = runs_query.data
        if not runs:
            continue
            
        total_itc_recovered = sum([float(r.get("total_matched", 0)) * 0.18 for r in runs])
        total_invoices_processed = sum([r.get("invoice_count", 0) for r in runs])
        total_clients = len(set([r["clients"]["id"] for r in runs if "id" in r["clients"]]))
        
        message_body = (
            f"📊 *Kredge Monthly Digest: {last_month_date.strftime('%B %Y')}*\n"
            f"Hello {ca_name},\n\n"
            f"Here is a summary of your automated ITC reconciliations for the past month:\n\n"
            f"✅ *ITC Recovered:* {format_inr(total_itc_recovered)}\n"
            f"🧾 *Invoices Processed:* {total_invoices_processed:,}\n"
            f"🏢 *Clients Managed:* {total_clients}\n\n"
            f"Log in to Kredge to view detailed supplier risk reports."
        )
        
        # 1. Log to DB
        supabase.table("monthly_summaries").insert({
            "user_id": user_id,
            "period_month": target_month,
            "period_year": target_year,
            "message_body": message_body,
            "sent_status": bool(chat_id)
        }).execute()
        
        # 2. Dispatch Telegram if chat_id exists
        if chat_id:
            await send_telegram_message(chat_id, message_body)
            
        summary_count += 1
        
    return {"status": "completed", "summaries_generated": summary_count}
