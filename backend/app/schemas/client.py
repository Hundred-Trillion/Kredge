from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ClientCreate(BaseModel):
    client_name: str = Field(..., min_length=1, max_length=200)
    gstin: str = Field(..., min_length=15, max_length=15)
    default_gst_rate: float = Field(default=18.0, ge=0, le=100)


class ClientUpdate(BaseModel):
    client_name: Optional[str] = None
    gstin: Optional[str] = None
    default_gst_rate: Optional[float] = None


class ClientResponse(BaseModel):
    id: str
    user_id: str
    client_name: str
    gstin: str
    default_gst_rate: float
    created_at: Optional[str] = None
