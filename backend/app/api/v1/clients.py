"""
Client CRUD API endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import List

from app.dependencies import get_current_user
from app.core.supabase_client import get_supabase
from app.schemas.client import ClientCreate, ClientUpdate, ClientResponse

router = APIRouter(prefix="/clients", tags=["Clients"])

# In-memory store for demo mode
_demo_clients = [
    {"id": "1", "user_id": "demo-user-001", "client_name": "Mehta Industries Pvt. Ltd.", "gstin": "27AABCM1234A1Z5", "default_gst_rate": 18.0, "created_at": "2026-01-10T00:00:00"},
    {"id": "2", "user_id": "demo-user-001", "client_name": "Patel Textiles LLC", "gstin": "24AABCP5678B1Z3", "default_gst_rate": 18.0, "created_at": "2026-01-15T00:00:00"},
    {"id": "3", "user_id": "demo-user-001", "client_name": "Sunrise Electronics", "gstin": "29AABCS9012C1Z1", "default_gst_rate": 18.0, "created_at": "2026-02-01T00:00:00"},
    {"id": "4", "user_id": "demo-user-001", "client_name": "Gujarat Polymers Ltd.", "gstin": "24AABCG3456D1Z7", "default_gst_rate": 12.0, "created_at": "2026-02-10T00:00:00"},
]


@router.get("/", response_model=List[ClientResponse])
async def list_clients(user: dict = Depends(get_current_user)):
    """List all clients for the authenticated user."""
    supabase = get_supabase()

    if supabase is None:
        return [ClientResponse(**c) for c in _demo_clients]

    result = supabase.table("clients") \
        .select("*") \
        .eq("user_id", user["id"]) \
        .order("created_at", desc=True) \
        .execute()

    return result.data


@router.get("/{client_id}", response_model=ClientResponse)
async def get_client(client_id: str, user: dict = Depends(get_current_user)):
    """Get a single client by ID."""
    supabase = get_supabase()

    if supabase is None:
        for c in _demo_clients:
            if c["id"] == client_id:
                return ClientResponse(**c)
        raise HTTPException(status_code=404, detail="Client not found")

    result = supabase.table("clients") \
        .select("*") \
        .eq("id", client_id) \
        .eq("user_id", user["id"]) \
        .single() \
        .execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Client not found")

    return result.data


@router.post("/", response_model=ClientResponse, status_code=201)
async def create_client(client: ClientCreate, user: dict = Depends(get_current_user)):
    """Create a new client."""
    supabase = get_supabase()

    if supabase is None:
        import uuid
        new_client = {
            "id": str(uuid.uuid4()),
            "user_id": user["id"],
            **client.model_dump(),
            "created_at": "2026-03-28T00:00:00",
        }
        _demo_clients.append(new_client)
        return ClientResponse(**new_client)

    result = supabase.table("clients").insert({
        "user_id": user["id"],
        **client.model_dump(),
    }).execute()

    return result.data[0]


@router.put("/{client_id}", response_model=ClientResponse)
async def update_client(
    client_id: str,
    client: ClientUpdate,
    user: dict = Depends(get_current_user),
):
    """Update a client."""
    supabase = get_supabase()

    if supabase is None:
        for c in _demo_clients:
            if c["id"] == client_id:
                update_data = client.model_dump(exclude_unset=True)
                c.update(update_data)
                return ClientResponse(**c)
        raise HTTPException(status_code=404, detail="Client not found")

    update_data = client.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = supabase.table("clients") \
        .update(update_data) \
        .eq("id", client_id) \
        .eq("user_id", user["id"]) \
        .execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Client not found")

    return result.data[0]


@router.delete("/{client_id}", status_code=204)
async def delete_client(client_id: str, user: dict = Depends(get_current_user)):
    """Delete a client."""
    supabase = get_supabase()

    if supabase is None:
        global _demo_clients
        _demo_clients = [c for c in _demo_clients if c["id"] != client_id]
        return

    supabase.table("clients") \
        .delete() \
        .eq("id", client_id) \
        .eq("user_id", user["id"]) \
        .execute()
