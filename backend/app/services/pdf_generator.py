"""
PDF Report Generator for Kredge ITC Reconciliation reports.
Uses Jinja2 templates with WeasyPrint (or falls back to HTML response).
"""

import os
from datetime import datetime
from typing import Dict, Any, List, Optional
from jinja2 import Template

# Try importing weasyprint — may not be available on Windows without GTK3
try:
    from weasyprint import HTML as WeasyHTML
    WEASYPRINT_AVAILABLE = True
except (ImportError, OSError):
    WEASYPRINT_AVAILABLE = False


def format_inr(amount: float) -> str:
    """Format number in Indian currency format: ₹X,XX,XXX"""
    if amount is None:
        return "₹0"
    is_negative = amount < 0
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
    return ("-" if is_negative else "") + "₹" + result


REPORT_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=DM+Mono:wght@400;500&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'DM Sans', sans-serif;
    color: #1a1a2e;
    font-size: 11px;
    line-height: 1.5;
    padding: 40px;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 2px solid #2D6FF7;
    padding-bottom: 20px;
    margin-bottom: 30px;
  }

  .logo {
    font-family: 'DM Sans', sans-serif;
    font-size: 24px;
    font-weight: 700;
    letter-spacing: 4px;
    color: #2D6FF7;
    text-transform: uppercase;
  }

  .logo-sub {
    font-size: 9px;
    color: #666;
    letter-spacing: 2px;
    margin-top: 2px;
  }

  .report-title {
    text-align: right;
    font-size: 16px;
    font-weight: 700;
    color: #1a1a2e;
  }

  .firm-name {
    text-align: right;
    font-size: 11px;
    color: #666;
    margin-top: 4px;
  }

  .client-info {
    background: #f8f9fb;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 16px 20px;
    margin-bottom: 24px;
    display: flex;
    gap: 40px;
  }

  .client-info .label {
    font-size: 9px;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .client-info .value {
    font-size: 12px;
    font-weight: 600;
    color: #1a1a2e;
    margin-top: 2px;
  }

  .client-info .mono {
    font-family: 'DM Mono', monospace;
    letter-spacing: 1px;
  }

  .summary-box {
    display: flex;
    gap: 16px;
    margin-bottom: 30px;
  }

  .summary-card {
    flex: 1;
    background: #f8f9fb;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 14px 16px;
    text-align: center;
  }

  .summary-card.danger {
    background: #fff5f5;
    border-color: #fecaca;
  }

  .summary-card .card-label {
    font-size: 9px;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .summary-card .card-value {
    font-family: 'DM Mono', monospace;
    font-size: 18px;
    font-weight: 700;
    margin-top: 6px;
  }

  .summary-card.danger .card-value {
    color: #FF4444;
  }

  .section-title {
    font-size: 13px;
    font-weight: 700;
    color: #1a1a2e;
    margin-bottom: 12px;
    padding-bottom: 6px;
    border-bottom: 1px solid #e2e8f0;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 30px;
    font-size: 10px;
  }

  th {
    background: #f1f5f9;
    font-weight: 600;
    text-align: left;
    padding: 8px 10px;
    border: 1px solid #e2e8f0;
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #555;
  }

  td {
    padding: 7px 10px;
    border: 1px solid #e2e8f0;
    vertical-align: top;
  }

  tr:nth-child(even) { background: #fafbfc; }

  .mono {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
  }

  .text-danger { color: #FF4444; font-weight: 600; }
  .text-warning { color: #f59e0b; }
  .text-info { color: #2D6FF7; }

  .badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 8px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .badge-danger { background: #fee2e2; color: #dc2626; }
  .badge-warning { background: #fef3c7; color: #d97706; }
  .badge-info { background: #dbeafe; color: #2563eb; }

  .footer {
    border-top: 1px solid #e2e8f0;
    padding-top: 16px;
    margin-top: 40px;
    display: flex;
    justify-content: space-between;
    font-size: 9px;
    color: #999;
  }

  @page {
    size: A4;
    margin: 15mm;
  }
</style>
</head>
<body>

<div class="header">
  <div>
    <div class="logo">KREDGE</div>
    <div class="logo-sub">Recover what's yours</div>
  </div>
  <div>
    <div class="report-title">ITC Reconciliation Report</div>
    <div class="firm-name">{{ firm_name }}</div>
  </div>
</div>

<div class="client-info">
  <div>
    <div class="label">Client</div>
    <div class="value">{{ client_name }}</div>
  </div>
  <div>
    <div class="label">GSTIN</div>
    <div class="value mono">{{ gstin }}</div>
  </div>
  <div>
    <div class="label">Period</div>
    <div class="value">{{ period }}</div>
  </div>
  <div>
    <div class="label">Run Date</div>
    <div class="value">{{ run_date }}</div>
  </div>
</div>

<div class="summary-box">
  <div class="summary-card">
    <div class="card-label">Total Purchases</div>
    <div class="card-value mono">{{ total_purchases }}</div>
  </div>
  <div class="summary-card">
    <div class="card-label">Matched</div>
    <div class="card-value mono" style="color: #00C48C;">{{ total_matched }}</div>
  </div>
  <div class="summary-card">
    <div class="card-label">Mismatches</div>
    <div class="card-value mono">{{ mismatch_count }}</div>
  </div>
  <div class="summary-card danger">
    <div class="card-label">Total ITC at Risk</div>
    <div class="card-value mono">{{ total_itc_at_risk }}</div>
  </div>
</div>

{% if mismatches %}
<div class="section-title">Mismatch Details ({{ mismatches|length }} issues)</div>
<table>
  <thead>
    <tr>
      <th>#</th>
      <th>Supplier</th>
      <th>GSTIN</th>
      <th>Invoice No.</th>
      <th>Type</th>
      <th>PR Amount</th>
      <th>2B Amount</th>
      <th>Difference</th>
      <th>ITC at Risk</th>
    </tr>
  </thead>
  <tbody>
    {% for m in mismatches %}
    <tr>
      <td>{{ loop.index }}</td>
      <td>{{ m.supplier_name }}</td>
      <td class="mono">{{ m.supplier_gstin }}</td>
      <td class="mono">{{ m.invoice_number }}</td>
      <td>
        {% if m.mismatch_type == 'MISSING_IN_2B' %}
          <span class="badge badge-danger">Missing in 2B</span>
        {% elif m.mismatch_type == 'VALUE_MISMATCH' %}
          <span class="badge badge-warning">Value Mismatch</span>
        {% else %}
          <span class="badge badge-info">GSTIN Mismatch</span>
        {% endif %}
      </td>
      <td class="mono">{{ m.pr_amount }}</td>
      <td class="mono">{{ m.twob_amount }}</td>
      <td class="mono text-warning">{{ m.difference }}</td>
      <td class="mono text-danger">{{ m.itc_at_risk }}</td>
    </tr>
    {% endfor %}
  </tbody>
</table>
{% else %}
<p>No mismatches found. All invoices matched successfully.</p>
{% endif %}

<div class="footer">
  <div>Generated by Kredge | kredge.in</div>
  <div>{{ generated_date }}</div>
</div>

</body>
</html>
"""


MONTH_NAMES = [
    "", "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
]


def generate_report_html(
    run_data: Dict[str, Any],
    mismatches: List[Dict[str, Any]],
    firm_name: str = "CA Firm",
) -> str:
    """Generate the HTML for the PDF report."""
    template = Template(REPORT_TEMPLATE)

    # Format mismatches for template
    formatted_mismatches = []
    for m in mismatches:
        formatted_mismatches.append({
            "supplier_name": m.get("supplier_name", "Unknown"),
            "supplier_gstin": m.get("supplier_gstin", "—"),
            "invoice_number": m.get("invoice_number", "—"),
            "mismatch_type": m.get("mismatch_type", ""),
            "pr_amount": format_inr(m.get("purchase_register_amount", 0)),
            "twob_amount": format_inr(m.get("gstr2b_amount", 0)),
            "difference": format_inr(m.get("difference", 0)),
            "itc_at_risk": format_inr(m.get("itc_at_risk", 0)),
        })

    period_month = run_data.get("period_month", 1)
    period_year = run_data.get("period_year", 2026)

    html = template.render(
        firm_name=firm_name,
        client_name=run_data.get("client_name", "Client"),
        gstin=run_data.get("gstin", "—"),
        period=f"{MONTH_NAMES[period_month]} {period_year}",
        run_date=datetime.now().strftime("%d %b %Y"),
        total_purchases=format_inr(run_data.get("total_purchases", 0)),
        total_matched=format_inr(run_data.get("total_matched", 0)),
        mismatch_count=run_data.get("mismatch_count", 0),
        total_itc_at_risk=format_inr(run_data.get("total_itc_at_risk", 0)),
        mismatches=formatted_mismatches,
        generated_date=datetime.now().strftime("%d %b %Y, %I:%M %p"),
    )

    return html


def generate_pdf(
    run_data: Dict[str, Any],
    mismatches: List[Dict[str, Any]],
    firm_name: str = "CA Firm",
) -> Optional[bytes]:
    """
    Generate PDF bytes from reconciliation data.
    Returns None if WeasyPrint is not available.
    """
    html = generate_report_html(run_data, mismatches, firm_name)

    if not WEASYPRINT_AVAILABLE:
        return None

    pdf_bytes = WeasyHTML(string=html).write_pdf()
    return pdf_bytes
