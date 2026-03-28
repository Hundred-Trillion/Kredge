"""
Column Normalizer for Purchase Register files.
Maps known Tally/Busy/custom export headers to the standard Kredge schema.
"""

import pandas as pd
from typing import Tuple, List, Optional


# Comprehensive mapping of known column names to standard names
COLUMN_MAP = {
    # Invoice Number
    "invoice no": "invoice_number",
    "invoice no.": "invoice_number",
    "inv no": "invoice_number",
    "inv no.": "invoice_number",
    "inv. no": "invoice_number",
    "inv. no.": "invoice_number",
    "bill no": "invoice_number",
    "bill no.": "invoice_number",
    "bill number": "invoice_number",
    "voucher no": "invoice_number",
    "voucher no.": "invoice_number",
    "voucher number": "invoice_number",
    "invoice number": "invoice_number",
    "document number": "invoice_number",
    "document no": "invoice_number",
    "doc no": "invoice_number",
    "doc. no.": "invoice_number",
    "ref no": "invoice_number",
    "ref. no.": "invoice_number",
    "reference number": "invoice_number",
    "reference no": "invoice_number",
    "inum": "invoice_number",

    # Supplier GSTIN
    "supplier gstin": "supplier_gstin",
    "party gstin": "supplier_gstin",
    "gstin": "supplier_gstin",
    "gstin/uin": "supplier_gstin",
    "gstin / uin": "supplier_gstin",
    "gstin/uin of supplier": "supplier_gstin",
    "gstin of supplier": "supplier_gstin",
    "ctin": "supplier_gstin",
    "gst no": "supplier_gstin",
    "gst no.": "supplier_gstin",
    "gst number": "supplier_gstin",
    "supplier gst no": "supplier_gstin",
    "party gst no": "supplier_gstin",
    "vendor gstin": "supplier_gstin",

    # Amount / Taxable Value
    "taxable value": "amount",
    "taxable amt": "amount",
    "taxable amount": "amount",
    "invoice value": "amount",
    "inv value": "amount",
    "invoice amount": "amount",
    "total value": "amount",
    "total amount": "amount",
    "net amount": "amount",
    "base amount": "amount",
    "assessable value": "amount",
    "val": "amount",
    "value": "amount",
    "amount": "amount",
    "amt": "amount",

    # Supplier Name
    "supplier name": "supplier_name",
    "party name": "supplier_name",
    "ledger name": "supplier_name",
    "vendor name": "supplier_name",
    "name of supplier": "supplier_name",
    "party": "supplier_name",
    "supplier": "supplier_name",
    "vendor": "supplier_name",
    "particulars": "supplier_name",

    # Invoice Date
    "invoice date": "invoice_date",
    "inv date": "invoice_date",
    "inv. date": "invoice_date",
    "voucher date": "invoice_date",
    "bill date": "invoice_date",
    "document date": "invoice_date",
    "date": "invoice_date",
    "doc date": "invoice_date",
    "idt": "invoice_date",
}

# Required columns for reconciliation
REQUIRED_COLUMNS = ["invoice_number", "supplier_gstin", "amount"]
OPTIONAL_COLUMNS = ["supplier_name", "invoice_date"]


def normalize_columns(df: pd.DataFrame) -> Tuple[pd.DataFrame, List[str]]:
    """
    Normalize column names from various accounting software exports
    to the standard Kredge schema.

    Returns:
        Tuple of (normalized DataFrame, list of warnings)

    Raises:
        ValueError: If required columns cannot be mapped
    """
    warnings = []

    # Clean column names: lowercase, strip whitespace
    df.columns = [str(c).lower().strip() for c in df.columns]

    # Apply mapping
    new_columns = []
    mapped = set()
    for col in df.columns:
        if col in COLUMN_MAP:
            std_name = COLUMN_MAP[col]
            if std_name not in mapped:
                new_columns.append(std_name)
                mapped.add(std_name)
            else:
                # Duplicate mapping — keep original
                new_columns.append(col)
                warnings.append(f"Duplicate mapping: '{col}' also maps to '{std_name}'")
        else:
            new_columns.append(col)

    df.columns = new_columns

    # Check required columns
    missing = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    if missing:
        found = list(df.columns)
        raise ValueError(
            f"Required columns not found: {missing}. "
            f"Found columns: {found}. "
            f"Expected at least: {REQUIRED_COLUMNS}"
        )

    # Check optional columns
    for col in OPTIONAL_COLUMNS:
        if col not in df.columns:
            warnings.append(f"Optional column '{col}' not found — will be empty")
            df[col] = None

    return df, warnings


def validate_data_types(df: pd.DataFrame) -> pd.DataFrame:
    """
    Validate and clean data types after normalization.
    """
    # Clean invoice numbers — convert to string, strip
    df["invoice_number"] = df["invoice_number"].astype(str).str.strip()
    df["invoice_number"] = df["invoice_number"].replace(["nan", "None", ""], pd.NA)

    # Clean GSTINs — uppercase, strip
    df["supplier_gstin"] = df["supplier_gstin"].astype(str).str.strip().str.upper()
    df["supplier_gstin"] = df["supplier_gstin"].replace(["NAN", "NONE", ""], pd.NA)

    # Clean amounts — convert to numeric
    df["amount"] = pd.to_numeric(df["amount"], errors="coerce").fillna(0)

    # Clean supplier names
    if "supplier_name" in df.columns:
        df["supplier_name"] = df["supplier_name"].astype(str).str.strip()
        df["supplier_name"] = df["supplier_name"].replace(["nan", "None"], "Unknown")

    # Clean dates
    if "invoice_date" in df.columns:
        df["invoice_date"] = df["invoice_date"].astype(str).str.strip()

    # Drop rows with no invoice number or GSTIN
    df = df.dropna(subset=["invoice_number", "supplier_gstin"])

    return df
