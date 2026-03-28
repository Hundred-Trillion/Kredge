"""
Kredge Reconciliation Engine
Core ITC reconciliation logic: matches purchase register against GSTR-2B.
"""

import pandas as pd
import json
import uuid
from typing import List, Dict, Any, Tuple, BinaryIO
from io import BytesIO

from app.services.column_normalizer import (
    normalize_columns,
    validate_data_types,
    REQUIRED_COLUMNS,
)


def parse_purchase_register(file_content: bytes) -> pd.DataFrame:
    """
    Parse purchase register Excel file.
    Supports .xlsx and .xls formats.
    """
    try:
        df = pd.read_excel(BytesIO(file_content), engine="openpyxl")
    except Exception:
        # Try with xlrd for .xls files
        try:
            df = pd.read_excel(BytesIO(file_content), engine="xlrd")
        except Exception as e:
            raise ValueError(f"Cannot read Excel file: {str(e)}")

    if df.empty:
        raise ValueError("Purchase register file is empty")

    # Normalize columns
    df, warnings = normalize_columns(df)

    # Validate data types
    df = validate_data_types(df)

    if df.empty:
        raise ValueError(
            "No valid rows found after cleaning. "
            "Please check that your file has valid invoice numbers and GSTINs."
        )

    return df


def parse_gstr2b(file_content: bytes) -> pd.DataFrame:
    """
    Parse GSTR-2B JSON file (Government GST portal format).
    Handles the nested structure: data > docdata > b2b > inv
    """
    try:
        raw = json.loads(file_content.decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError) as e:
        raise ValueError(f"Invalid JSON file: {str(e)}")

    records = []

    # Navigate the nested GSTR-2B structure
    # Common paths in GSTR-2B JSON:
    # data > docdata > b2b > [suppliers] > inv > [invoices]
    doc_data = None

    if "data" in raw:
        if "docdata" in raw["data"]:
            doc_data = raw["data"]["docdata"]
        elif "b2b" in raw["data"]:
            doc_data = raw["data"]
    elif "docdata" in raw:
        doc_data = raw["docdata"]
    elif "b2b" in raw:
        doc_data = raw

    if doc_data is None:
        raise ValueError(
            "Invalid GSTR-2B format. Expected structure: "
            "data > docdata > b2b. Please download the JSON from the GST portal."
        )

    # Extract B2B invoices
    b2b = doc_data.get("b2b", [])
    if not b2b:
        raise ValueError("No B2B invoice data found in GSTR-2B file.")

    for supplier in b2b:
        ctin = supplier.get("ctin", "").upper().strip()
        supplier_name = supplier.get("trdnm", supplier.get("supprd_nm", "Unknown"))

        invoices = supplier.get("inv", [])
        for inv in invoices:
            invoice_number = str(inv.get("inum", inv.get("num", ""))).strip()
            invoice_date = str(inv.get("idt", inv.get("dt", ""))).strip()

            # Get invoice value — could be 'val' or 'txval'
            amount = inv.get("val", inv.get("txval", 0))
            if amount is None:
                # Try to sum from items
                items = inv.get("itms", [])
                amount = sum(
                    item.get("itm_det", {}).get("txval", 0)
                    for item in items
                )

            try:
                amount = float(amount)
            except (TypeError, ValueError):
                amount = 0

            records.append({
                "supplier_gstin": ctin,
                "supplier_name": supplier_name,
                "invoice_number": invoice_number,
                "invoice_date": invoice_date,
                "amount": amount,
            })

    if not records:
        raise ValueError("No invoice records extracted from GSTR-2B.")

    df = pd.DataFrame(records)

    # Clean data types
    df["invoice_number"] = df["invoice_number"].astype(str).str.strip()
    df["supplier_gstin"] = df["supplier_gstin"].astype(str).str.strip().str.upper()
    df["amount"] = pd.to_numeric(df["amount"], errors="coerce").fillna(0)

    return df


def run_reconciliation(
    pr_content: bytes,
    gstr2b_content: bytes,
    gst_rate: float = 0.18,
) -> Dict[str, Any]:
    """
    Run the full ITC reconciliation.

    Args:
        pr_content: Purchase register Excel file bytes
        gstr2b_content: GSTR-2B JSON file bytes
        gst_rate: GST rate as decimal (0.18 = 18%)

    Returns:
        Dict with reconciliation results including mismatches
    """
    # Parse both files
    pr_df = parse_purchase_register(pr_content)
    gstr2b_df = parse_gstr2b(gstr2b_content)

    total_pr_invoices = len(pr_df)
    total_2b_invoices = len(gstr2b_df)

    # Standardize invoice numbers for matching (uppercase, strip special chars)
    pr_df["_match_inv"] = pr_df["invoice_number"].str.upper().str.replace(r"[^A-Z0-9]", "", regex=True)
    gstr2b_df["_match_inv"] = gstr2b_df["invoice_number"].str.upper().str.replace(r"[^A-Z0-9]", "", regex=True)

    pr_df["_match_gstin"] = pr_df["supplier_gstin"].str.upper().str.strip()
    gstr2b_df["_match_gstin"] = gstr2b_df["supplier_gstin"].str.upper().str.strip()

    # Merge on normalized invoice number + GSTIN
    merged = pr_df.merge(
        gstr2b_df,
        left_on=["_match_inv", "_match_gstin"],
        right_on=["_match_inv", "_match_gstin"],
        how="outer",
        suffixes=("_pr", "_2b"),
        indicator=True,
    )

    mismatches = []
    total_matched_amount = 0

    # 1. MISSING IN 2B — in purchase register but not in GSTR-2B
    missing_in_2b = merged[merged["_merge"] == "left_only"]
    for _, row in missing_in_2b.iterrows():
        pr_amount = float(row.get("amount_pr", 0) or 0)
        mismatches.append({
            "id": str(uuid.uuid4()),
            "supplier_gstin": str(row.get("supplier_gstin_pr", "") or ""),
            "supplier_name": str(row.get("supplier_name_pr", "") or "Unknown"),
            "invoice_number": str(row.get("invoice_number_pr", "") or ""),
            "invoice_date": str(row.get("invoice_date_pr", "") or ""),
            "purchase_register_amount": pr_amount,
            "gstr2b_amount": 0,
            "difference": pr_amount,
            "mismatch_type": "MISSING_IN_2B",
            "itc_at_risk": round(pr_amount * gst_rate, 2),
        })

    # 2. VALUE MISMATCH — in both but amounts differ (tolerance: ₹1)
    both = merged[merged["_merge"] == "both"]
    for _, row in both.iterrows():
        pr_amount = float(row.get("amount_pr", 0) or 0)
        twob_amount = float(row.get("amount_2b", 0) or 0)
        diff = abs(pr_amount - twob_amount)

        if diff > 1:  # Tolerance of ₹1
            mismatches.append({
                "id": str(uuid.uuid4()),
                "supplier_gstin": str(row.get("supplier_gstin_pr", row.get("supplier_gstin_2b", "")) or ""),
                "supplier_name": str(row.get("supplier_name_pr", row.get("supplier_name_2b", "")) or "Unknown"),
                "invoice_number": str(row.get("invoice_number_pr", row.get("invoice_number_2b", "")) or ""),
                "invoice_date": str(row.get("invoice_date_pr", row.get("invoice_date_2b", "")) or ""),
                "purchase_register_amount": pr_amount,
                "gstr2b_amount": twob_amount,
                "difference": diff,
                "mismatch_type": "VALUE_MISMATCH",
                "itc_at_risk": round(diff * gst_rate, 2),
            })
        else:
            total_matched_amount += pr_amount

    # Sort mismatches by ITC at risk (biggest bleeds first)
    mismatches.sort(key=lambda m: m["itc_at_risk"], reverse=True)

    total_purchases = float(pr_df["amount"].sum())
    total_itc_at_risk = sum(m["itc_at_risk"] for m in mismatches)

    return {
        "total_purchases": round(total_purchases, 2),
        "total_matched": round(total_matched_amount, 2),
        "total_itc_at_risk": round(total_itc_at_risk, 2),
        "mismatch_count": len(mismatches),
        "invoice_count": total_pr_invoices,
        "mismatches": mismatches,
    }
