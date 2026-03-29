from app.core.config import settings
from app.core.supabase_client import get_supabase

async def update_supplier_risk_scores(user_id: str):
    """
    V2: Recalculates risk scores for all suppliers under a specific CA firm (user_id).
    Runs asynchronously after a reconciliation job completes.
    """
    if not settings.is_supabase_configured:
        print("DEMO MODE: Skipping risk score updates (No Supabase)")
        return
        
    supabase = get_supabase()
    
    try:
        # High-level algorithm:
        # 1. Fetch all mismatches for all runs belonging to the CA's clients
        # 2. Group by supplier_gstin
        # 3. Calculate consecutive defaults and set GREEN/YELLOW/RED
        # 4. Upsert into supplier_profiles table
        
        # NOTE: A fully robust implementation would typically do this inside PostgreSQL
        # using a combination of views or a stored procedure. For FastAPI, we will 
        # trigger a stored procedure if one is available, or rely on a simple heuristic here.
        
        # For this execution, we will trigger a RPC call if it existed, but since we didn't 
        # write an RPC in schema.sql for this specific complex query, we will do a basic
        # application-level check or assume the DB handles real-time updates via triggers.
        # Since it's a SaaS, we do a basic pass:
        
        print(f"Risk scorer activated for user {user_id}. Proceeding to update profiles...")
        # (Implementation details for fetching and updating profiles would go here,
        # typically involving querying `mismatches` joined with `runs` for the CA)
        
        # Let's do a basic sync script placeholder that fetches all distinct suppliers
        suppliers_resp = supabase.table('mismatches') \
            .select('supplier_gstin, supplier_name, itc_at_risk, run_id, reconciliation_runs!inner(client_id, clients!inner(user_id))') \
            .eq('reconciliation_runs.clients.user_id', user_id) \
            .execute()
            
        if not suppliers_resp.data:
            return
            
        # Group and tally logic
        profiles = {}
        for m in suppliers_resp.data:
            gstin = m.get('supplier_gstin')
            if not gstin or len(gstin) != 15:
                continue
                
            if gstin not in profiles:
                profiles[gstin] = {
                    "user_id": user_id,
                    "supplier_gstin": gstin,
                    "supplier_name": m.get('supplier_name') or "Unknown",
                    "total_itc_loss": 0,
                    "consecutive_defaults": 0
                }
            
            # Add ITC loss
            profiles[gstin]['total_itc_loss'] += float(m.get('itc_at_risk', 0))
            profiles[gstin]['consecutive_defaults'] += 1  # Simplified: 1 default per mismatch
            
        # Calculate Risk and Upsert
        for gstin, p in profiles.items():
            defaults = p['consecutive_defaults']
            if defaults >= 3:
                p['risk_level'] = 'RED'
            elif defaults > 0:
                p['risk_level'] = 'YELLOW'
            else:
                p['risk_level'] = 'GREEN'
                
            # Upsert into supplier_profiles
            supabase.table('supplier_profiles').upsert(p, on_conflict='user_id,supplier_gstin').execute()
            
        print(f"Risk scorer updated {len(profiles)} supplier profiles successfully.")
            
    except Exception as e:
        print(f"Risk Scorer Error: {str(e)}")

