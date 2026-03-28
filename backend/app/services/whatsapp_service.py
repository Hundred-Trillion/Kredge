"""
WhatsApp Cloud API integration for Kredge reconciliation alerts.
Uses Meta's WhatsApp Cloud API to send summary messages.
"""

import requests
from typing import Dict, Any, Optional
from app.core.config import settings


def format_inr(amount: float) -> str:
    """Format number in Indian currency format: ₹X,XX,XXX"""
    if amount is None:
        return "₹0"
    num = abs(round(amount))
    s = str(num)
    if len(s) <= 3:
        result = s
    else:
        result = s[-3:]
        remaining = s[:-3]
        while len(remaining) > 2:
            result = remaining[-2:] + "," + result
            remaining = remaining[:-2]
        if remaining:
            result = remaining + "," + result
    return "₹" + result


MONTH_NAMES = [
    "", "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
]


def build_alert_message(
    client_name: str,
    period_month: int,
    period_year: int,
    mismatch_count: int,
    total_itc_at_risk: float,
    top_supplier: Optional[str] = None,
    top_supplier_risk: Optional[float] = None,
    dashboard_link: Optional[str] = None,
) -> str:
    """Build the WhatsApp alert message text."""
    period = f"{MONTH_NAMES[period_month]} {period_year}"

    msg = f"*Kredge Alert* 🔴\n"
    msg += f"Client: {client_name}\n"
    msg += f"Period: {period}\n"
    msg += f"Mismatches found: {mismatch_count}\n"
    msg += f"*Total ITC at risk: {format_inr(total_itc_at_risk)}*\n"

    if top_supplier and top_supplier_risk:
        msg += f"\nTop supplier: {top_supplier} — {format_inr(top_supplier_risk)} at risk\n"

    if dashboard_link:
        msg += f"\nView full report: {dashboard_link}\n"

    msg += "— Kredge"

    return msg


def send_whatsapp_message(
    to_phone: str,
    message_text: str,
) -> Dict[str, Any]:
    """
    Send a text message via WhatsApp Cloud API.

    Args:
        to_phone: Recipient phone in E.164 format (e.g., '919876543210')
        message_text: The message body

    Returns:
        API response dict or error dict
    """
    if not settings.is_whatsapp_configured:
        return {
            "success": False,
            "error": "WhatsApp Cloud API is not configured. "
                     "Set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN in environment.",
        }

    url = f"https://graph.facebook.com/v21.0/{settings.WHATSAPP_PHONE_NUMBER_ID}/messages"

    headers = {
        "Authorization": f"Bearer {settings.WHATSAPP_ACCESS_TOKEN}",
        "Content-Type": "application/json",
    }

    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": to_phone.replace("+", ""),
        "type": "text",
        "text": {
            "preview_url": True,
            "body": message_text,
        },
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        response.raise_for_status()
        return {"success": True, "data": response.json()}
    except requests.exceptions.HTTPError as e:
        return {
            "success": False,
            "error": f"WhatsApp API error: {e.response.text if e.response else str(e)}",
        }
    except requests.exceptions.RequestException as e:
        return {"success": False, "error": f"Request failed: {str(e)}"}


def send_reconciliation_alert(
    to_phone: str,
    run_data: Dict[str, Any],
    mismatches: list,
    dashboard_url: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Send a reconciliation summary alert via WhatsApp.

    Args:
        to_phone: CA's phone number
        run_data: Reconciliation run data
        mismatches: List of mismatches (to find top supplier)
        dashboard_url: Optional link to the dashboard
    """
    # Find top supplier by ITC at risk
    top_supplier = None
    top_risk = 0
    for m in mismatches:
        risk = m.get("itc_at_risk", 0)
        if risk > top_risk:
            top_risk = risk
            top_supplier = m.get("supplier_name", "Unknown")

    run_id = run_data.get("id", "")
    link = dashboard_url or f"{settings.FRONTEND_URL}/runs/{run_id}"

    message = build_alert_message(
        client_name=run_data.get("client_name", "Client"),
        period_month=run_data.get("period_month", 1),
        period_year=run_data.get("period_year", 2026),
        mismatch_count=run_data.get("mismatch_count", 0),
        total_itc_at_risk=run_data.get("total_itc_at_risk", 0),
        top_supplier=top_supplier,
        top_supplier_risk=top_risk if top_supplier else None,
        dashboard_link=link,
    )

    return send_whatsapp_message(to_phone, message)
