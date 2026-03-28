"""
Reconciliation API endpoints.
Handles file upload, reconciliation triggering, and results retrieval.
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from typing import List, Optional
import uuid
import asyncio
from datetime import datetime

from app.dependencies import get_current_user
from app.core.supabase_client import get_supabase
from app.services.reconciliation_engine import run_reconciliation
from app.services.risk_scorer import update_supplier_risk_scores
from app.schemas.reconciliation import ReconciliationRunResponse, MismatchResponse

router = APIRouter(prefix="/reconciliation", tags=["Reconciliation"])

# In-memory store for demo mode
_demo_runs = {}
_demo_mismatches = {}


@router.post("/run")
async def trigger_reconciliation(
    background_tasks: BackgroundTasks,
    purchase_register: UploadFile = File(...),
    gstr2b: UploadFile = File(...),
    client_id: str = Form(...),
    period_month: int = Form(...),
    period_year: int = Form(...),
    gst_rate: float = Form(default=18.0),
    user: dict = Depends(get_current_user),
):
    """
    Upload files and run ITC reconciliation.
    
    - purchase_register: Excel file (.xlsx/.xls) from Tally/Busy
    - gstr2b: JSON file from GST portal
    """
    # Read file contents
    try:
        pr_content = await purchase_register.read()
        gstr2b_content = await gstr2b.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading files: {str(e)}")

    # Validate file types
    if not purchase_register.filename.lower().endswith(('.xlsx', '.xls')):
        raise HTTPException(
            status_code=400,
            detail="Purchase register must be an Excel file (.xlsx or .xls)"
        )

    if not gstr2b.filename.lower().endswith('.json'):
        raise HTTPException(
            status_code=400,
            detail="GSTR-2B must be a JSON file (.json)"
        )

    # Run reconciliation
    try:
        rate_decimal = gst_rate / 100.0 if gst_rate > 1 else gst_rate
        result = run_reconciliation(pr_content, gstr2b_content, rate_decimal)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Reconciliation error: {str(e)}")

    run_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()

    supabase = get_supabase()

    if supabase is None:
        # Demo mode — store in memory
        run_data = {
            "id": run_id,
            "client_id": client_id,
            "run_date": now,
            "period_month": period_month,
            "period_year": period_year,
            "status": "completed",
            "total_purchases": result["total_purchases"],
            "total_matched": result["total_matched"],
            "total_itc_at_risk": result["total_itc_at_risk"],
            "mismatch_count": result["mismatch_count"],
            "invoice_count": result["invoice_count"],
            "created_at": now,
        }
        _demo_runs[run_id] = run_data

        # Store mismatches
        mismatches_with_run = []
        for m in result["mismatches"]:
            m["run_id"] = run_id
            mismatches_with_run.append(m)
        _demo_mismatches[run_id] = mismatches_with_run

        user_id = user.get("id") if user else "demo_user"
        background_tasks.add_task(update_supplier_risk_scores, user_id)

        return {"run_id": run_id, "status": "completed", **result}

    # Store in Supabase
    try:
        # Create run record
        run_record = supabase.table("reconciliation_runs").insert({
            "id": run_id,
            "client_id": client_id,
            "period_month": period_month,
            "period_year": period_year,
            "status": "completed",
            "total_purchases": result["total_purchases"],
            "total_matched": result["total_matched"],
            "total_itc_at_risk": result["total_itc_at_risk"],
            "mismatch_count": result["mismatch_count"],
            "invoice_count": result["invoice_count"],
        }).execute()

        # Insert mismatches
        if result["mismatches"]:
            mismatch_records = []
            for m in result["mismatches"]:
                mismatch_records.append({
                    "run_id": run_id,
                    "supplier_gstin": m.get("supplier_gstin"),
                    "supplier_name": m.get("supplier_name"),
                    "invoice_number": m.get("invoice_number"),
                    "invoice_date": m.get("invoice_date"),
                    "purchase_register_amount": m.get("purchase_register_amount"),
                    "gstr2b_amount": m.get("gstr2b_amount"),
                    "difference": m.get("difference"),
                    "mismatch_type": m.get("mismatch_type"),
                    "itc_at_risk": m.get("itc_at_risk"),
                })
            supabase.table("mismatches").insert(mismatch_records).execute()

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save results: {str(e)}")

    user_id = user.get("id") if user else "demo_user"
    background_tasks.add_task(update_supplier_risk_scores, user_id)
    return {"run_id": run_id, "status": "completed", **result}

@router.get("/runs/{run_id}")
async def get_run(run_id: str, user: dict = Depends(get_current_user)):
    """Get a reconciliation run by ID."""
    supabase = get_supabase()

    if supabase is None:
        run = _demo_runs.get(run_id)
        if not run:
            raise HTTPException(status_code=404, detail="Run not found")
        return run

    result = supabase.table("reconciliation_runs") \
        .select("*, clients(client_name, gstin)") \
        .eq("id", run_id) \
        .single() \
        .execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Run not found")

    data = result.data
    if "clients" in data:
        data["client_name"] = data["clients"].get("client_name")
        data["gstin"] = data["clients"].get("gstin")
        del data["clients"]

    return data


@router.get("/runs/{run_id}/mismatches", response_model=List[MismatchResponse])
async def get_mismatches(run_id: str, user: dict = Depends(get_current_user)):
    """Get all mismatches for a reconciliation run."""
    supabase = get_supabase()

    if supabase is None:
        mismatches = _demo_mismatches.get(run_id, [])
        return mismatches

    result = supabase.table("mismatches") \
        .select("*") \
        .eq("run_id", run_id) \
        .order("itc_at_risk", desc=True) \
        .execute()

    return result.data


@router.get("/runs", response_model=List[ReconciliationRunResponse])
async def list_runs(
    client_id: Optional[str] = None,
    user: dict = Depends(get_current_user),
):
    """List reconciliation runs, optionally filtered by client."""
    supabase = get_supabase()

    if supabase is None:
        runs = list(_demo_runs.values())
        if client_id:
            runs = [r for r in runs if r.get("client_id") == client_id]
        return runs

    query = supabase.table("reconciliation_runs") \
        .select("*, clients(client_name, gstin)") \
        .order("created_at", desc=True)

    if client_id:
        query = query.eq("client_id", client_id)

    result = query.execute()

    # Flatten client data
    runs = []
    for r in result.data:
        if "clients" in r:
            r["client_name"] = r["clients"].get("client_name")
            r["gstin"] = r["clients"].get("gstin")
            del r["clients"]
        runs.append(r)

    return runs
