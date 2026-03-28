"""
PDF Report download endpoint.
"""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response, HTMLResponse

from app.dependencies import get_current_user
from app.core.supabase_client import get_supabase
from app.services.pdf_generator import generate_pdf, generate_report_html, WEASYPRINT_AVAILABLE
from app.api.v1.reconciliation import _demo_runs, _demo_mismatches

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/{run_id}/pdf")
async def download_pdf_report(run_id: str, user: dict = Depends(get_current_user)):
    """
    Download a PDF report for a reconciliation run.
    Falls back to HTML if WeasyPrint is not available.
    """
    supabase = get_supabase()

    if supabase is None:
        # Demo mode
        run_data = _demo_runs.get(run_id)
        mismatches = _demo_mismatches.get(run_id, [])

        if not run_data:
            raise HTTPException(status_code=404, detail="Run not found")

        firm_name = user.get("firm_name", "CA Firm")

    else:
        # Fetch from Supabase
        run_result = supabase.table("reconciliation_runs") \
            .select("*, clients(client_name, gstin)") \
            .eq("id", run_id) \
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
            .eq("run_id", run_id) \
            .order("itc_at_risk", desc=True) \
            .execute()

        mismatches = mismatch_result.data

        # Get firm name from user profile
        user_result = supabase.table("users") \
            .select("firm_name") \
            .eq("id", user["id"]) \
            .single() \
            .execute()

        firm_name = user_result.data.get("firm_name", "CA Firm") if user_result.data else "CA Firm"

    # Try to generate PDF
    pdf_bytes = generate_pdf(run_data, mismatches, firm_name)

    if pdf_bytes:
        client_name = run_data.get("client_name", "Client").replace(" ", "_")
        filename = f"Kredge_ITC_Report_{client_name}_{run_data.get('period_month', 0)}_{run_data.get('period_year', 0)}.pdf"

        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    else:
        # Fallback: return HTML
        html = generate_report_html(run_data, mismatches, firm_name)
        return HTMLResponse(
            content=html,
            headers={"Content-Disposition": f'inline; filename="report.html"'},
        )


@router.get("/{run_id}/html")
async def view_html_report(run_id: str, user: dict = Depends(get_current_user)):
    """View the report as HTML (useful for preview)."""
    supabase = get_supabase()

    if supabase is None:
        run_data = _demo_runs.get(run_id)
        mismatches = _demo_mismatches.get(run_id, [])
        if not run_data:
            raise HTTPException(status_code=404, detail="Run not found")
        firm_name = user.get("firm_name", "CA Firm")
    else:
        # Same fetch logic as PDF...
        run_result = supabase.table("reconciliation_runs") \
            .select("*, clients(client_name, gstin)") \
            .eq("id", run_id).single().execute()
        if not run_result.data:
            raise HTTPException(status_code=404, detail="Run not found")
        run_data = run_result.data
        if "clients" in run_data:
            run_data["client_name"] = run_data["clients"].get("client_name")
            run_data["gstin"] = run_data["clients"].get("gstin")
            del run_data["clients"]
        mismatch_result = supabase.table("mismatches") \
            .select("*").eq("run_id", run_id).order("itc_at_risk", desc=True).execute()
        mismatches = mismatch_result.data
        firm_name = "CA Firm"

    html = generate_report_html(run_data, mismatches, firm_name)
    return HTMLResponse(content=html)
