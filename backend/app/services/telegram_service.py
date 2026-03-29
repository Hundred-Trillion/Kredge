"""
Telegram Bot API integration for Kredge reconciliation alerts.
Allows CA firms to receive status updates via Telegram.
"""

import httpx
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
    """Build the Telegram alert message in Markdown."""
    period = f"{MONTH_NAMES[period_month]} {period_year}"

    msg = f"🚀 *Kredge Action Alert*\n\n"
    msg += f"🏢 *Client:* {client_name}\n"
    msg += f"📅 *Period:* {period}\n"
    msg += f"⚠️ *Mismatches:* {mismatch_count}\n"
    msg += f"💰 *ITC at Risk: {format_inr(total_itc_at_risk)}*\n"

    if top_supplier and top_supplier_risk:
        msg += f"\n🚨 *Top Risk:* {top_supplier}\nloses {format_inr(top_supplier_risk)}\n"

    if dashboard_link:
        msg += f"\n🔗 [View Full Report]({dashboard_link})\n"

    msg += "\n_Powered by Kredge_"

    return msg


async def send_telegram_message(
    chat_id: str,
    message_text: str,
) -> Dict[str, Any]:
    """
    Send a message via Telegram Bot API.
    
    Args:
        chat_id: Recipient's Telegram Chat ID
        message_text: The message content
    """
    if not settings.is_telegram_configured:
        return {
            "success": False,
            "error": "Telegram Bot API is not configured. Set TELEGRAM_BOT_TOKEN in environment.",
        }

    url = f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendMessage"
    
    payload = {
        "chat_id": chat_id,
        "text": message_text,
        "parse_mode": "Markdown",
        "disable_web_page_preview": False
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json=payload, timeout=10.0)
            response.raise_for_status()
            return {"success": True, "data": response.json()}
        except httpx.HTTPStatusError as e:
            return {
                "success": False, 
                "error": f"Telegram API error: {e.response.text if e.response else str(e)}"
            }
        except Exception as e:
            return {"success": False, "error": f"Request failed: {str(e)}"}


async def send_reconciliation_alert(
    chat_id: str,
    run_data: Dict[str, Any],
    mismatches: list,
    dashboard_url: Optional[str] = None,
) -> Dict[str, Any]:
    """Send a reconciliation summary alert via Telegram Bot."""
    # Find top supplier by ITC at risk
    top_supplier = None
    top_risk = 0
    for m in mismatches:
        risk = m.get("itc_at_risk", 0)
        if risk > top_risk:
            top_risk = risk
            top_supplier = m.get("supplier_name", "Unknown")

    run_id = run_data.get("id", "")
    # Link to the deployment or local frontend
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

    return await send_telegram_message(chat_id, message)
