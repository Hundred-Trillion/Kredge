from fastapi import APIRouter, HTTPException
from typing import List

from app.core.supabase_client import get_supabase
from app.schemas.reconciliation import ReconciliationRunResponse

router = APIRouter(prefix="/portal", tags=["Client Portal"])

@router.get("/{token}/summary")
async def get_portal_summary(token: str):
    """Retrieve high-level summary for the specific client using their public portal token."""
    supabase = get_supabase()
    
    if supabase is None:
        # Demo mode placeholder
        if token == "demo-token-123":
            return {
                "client_name": "Demo Client Inc.",
                "gstin": "27AAACR5678B1Z3",
                "total_itc_recovered": 450000.0,
                "total_runs": 12,
                "latest_period": "March 2026"
            }
        raise HTTPException(status_code=404, detail="Invalid token")
        
    # Get client via token
    client = supabase.table("clients").select("*").eq("portal_token", token).single().execute()
    if not client.data:
        raise HTTPException(status_code=404, detail="Invalid portal link")
        
    client_id = client.data["id"]
    
    # Calculate summary metrics safely
    runs_resp = supabase.table("reconciliation_runs").select("*").eq("client_id", client_id).execute()
    runs = runs_resp.data
    
    total_recovered = sum([float(r.get("total_matched", 0)) * 0.18 for r in runs if r.get("status") == "completed"])
    
    latest_run = max(runs, key=lambda x: x.get("run_date") or "") if runs else None
    
    return {
        "client_name": client.data["client_name"],
        "gstin": client.data["gstin"],
        "total_itc_recovered": total_recovered,
        "total_runs": len(runs),
        "latest_period": f"{latest_run['period_month']}-{latest_run['period_year']}" if latest_run else "None"
    }

@router.get("/{token}/runs", response_model=List[ReconciliationRunResponse])
async def get_portal_runs(token: str):
    """Retrieve all reconciliation runs for a specific client to display in the portal."""
    supabase = get_supabase()
    
    if supabase is None:
        return []
        
    client = supabase.table("clients").select("id").eq("portal_token", token).single().execute()
    if not client.data:
        raise HTTPException(status_code=404, detail="Invalid portal link")
        
    runs = supabase.table("reconciliation_runs").select("*").eq("client_id", client.data["id"]).order("run_date", desc=True).execute()
    return runs.data
