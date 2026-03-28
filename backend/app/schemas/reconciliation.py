from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum


class MismatchType(str, Enum):
    MISSING_IN_2B = "MISSING_IN_2B"
    VALUE_MISMATCH = "VALUE_MISMATCH"
    GSTIN_MISMATCH = "GSTIN_MISMATCH"


class RunStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class ReconciliationRunResponse(BaseModel):
    id: str
    client_id: str
    client_name: Optional[str] = None
    gstin: Optional[str] = None
    run_date: Optional[str] = None
    period_month: int
    period_year: int
    status: str
    total_purchases: float = 0
    total_matched: float = 0
    total_itc_at_risk: float = 0
    mismatch_count: int = 0
    invoice_count: int = 0
    created_at: Optional[str] = None


class MismatchResponse(BaseModel):
    id: str
    run_id: str
    supplier_gstin: Optional[str] = None
    supplier_name: Optional[str] = None
    invoice_number: Optional[str] = None
    invoice_date: Optional[str] = None
    purchase_register_amount: Optional[float] = None
    gstr2b_amount: Optional[float] = None
    difference: Optional[float] = None
    mismatch_type: str
    itc_at_risk: float = 0


class ReconciliationResult(BaseModel):
    """Result returned by the reconciliation engine."""
    run_id: str
    total_purchases: float
    total_matched: float
    total_itc_at_risk: float
    mismatch_count: int
    invoice_count: int
    mismatches: List[MismatchResponse]


class ColumnMappingError(BaseModel):
    """Error when column normalization fails."""
    message: str
    found_columns: List[str]
    expected_columns: List[str]
