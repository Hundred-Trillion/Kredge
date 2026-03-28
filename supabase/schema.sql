-- ============================================================
-- Kredge — GST ITC Reconciliation Platform
-- Supabase PostgreSQL Schema
-- Run this in Supabase SQL Editor after creating your project
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS (extends Supabase auth.users)
-- ============================================================
CREATE TABLE public.users (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    email       TEXT NOT NULL UNIQUE,
    phone       TEXT,
    firm_name   TEXT NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.users IS 'CA firm user profiles — linked to Supabase auth';

-- ============================================================
-- CLIENTS
-- ============================================================
CREATE TABLE public.clients (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    client_name      TEXT NOT NULL,
    gstin            TEXT NOT NULL,
    default_gst_rate NUMERIC(5,2) DEFAULT 18.00,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_gstin CHECK (length(gstin) = 15),
    CONSTRAINT valid_gst_rate CHECK (default_gst_rate >= 0 AND default_gst_rate <= 100)
);

CREATE INDEX idx_clients_user_id ON public.clients(user_id);
CREATE INDEX idx_clients_gstin ON public.clients(gstin);

COMMENT ON TABLE public.clients IS 'Clients of the CA firm — each has a GSTIN';

-- ============================================================
-- RECONCILIATION RUNS
-- ============================================================
CREATE TYPE run_status AS ENUM ('pending', 'processing', 'completed', 'failed');

CREATE TABLE public.reconciliation_runs (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id        UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    run_date         TIMESTAMPTZ DEFAULT NOW(),
    period_month     INTEGER NOT NULL CHECK (period_month BETWEEN 1 AND 12),
    period_year      INTEGER NOT NULL CHECK (period_year BETWEEN 2017 AND 2100),
    status           run_status DEFAULT 'pending',
    total_purchases  NUMERIC(15,2) DEFAULT 0,
    total_matched    NUMERIC(15,2) DEFAULT 0,
    total_itc_at_risk NUMERIC(15,2) DEFAULT 0,
    mismatch_count   INTEGER DEFAULT 0,
    invoice_count    INTEGER DEFAULT 0,
    created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_runs_client_id ON public.reconciliation_runs(client_id);
CREATE INDEX idx_runs_status ON public.reconciliation_runs(status);
CREATE INDEX idx_runs_period ON public.reconciliation_runs(period_year, period_month);

COMMENT ON TABLE public.reconciliation_runs IS 'Each reconciliation run for a client period';

-- ============================================================
-- MISMATCHES
-- ============================================================
CREATE TYPE mismatch_type AS ENUM ('MISSING_IN_2B', 'VALUE_MISMATCH', 'GSTIN_MISMATCH');

CREATE TABLE public.mismatches (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id                   UUID NOT NULL REFERENCES public.reconciliation_runs(id) ON DELETE CASCADE,
    supplier_gstin           TEXT,
    supplier_name            TEXT,
    invoice_number           TEXT,
    invoice_date             TEXT,
    purchase_register_amount NUMERIC(15,2),
    gstr2b_amount            NUMERIC(15,2),
    difference               NUMERIC(15,2),
    mismatch_type            mismatch_type NOT NULL,
    itc_at_risk              NUMERIC(15,2) DEFAULT 0
);

CREATE INDEX idx_mismatches_run_id ON public.mismatches(run_id);
CREATE INDEX idx_mismatches_type ON public.mismatches(mismatch_type);
CREATE INDEX idx_mismatches_itc ON public.mismatches(itc_at_risk DESC);

COMMENT ON TABLE public.mismatches IS 'Individual invoice mismatches found during reconciliation';

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_insert_own" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_own" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Clients
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clients_select_own" ON public.clients
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "clients_insert_own" ON public.clients
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "clients_update_own" ON public.clients
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "clients_delete_own" ON public.clients
    FOR DELETE USING (auth.uid() = user_id);

-- Reconciliation Runs
ALTER TABLE public.reconciliation_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "runs_select_own" ON public.reconciliation_runs
    FOR SELECT USING (
        client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
    );

CREATE POLICY "runs_insert_own" ON public.reconciliation_runs
    FOR INSERT WITH CHECK (
        client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
    );

CREATE POLICY "runs_update_own" ON public.reconciliation_runs
    FOR UPDATE USING (
        client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
    );

CREATE POLICY "runs_delete_own" ON public.reconciliation_runs
    FOR DELETE USING (
        client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
    );

-- Mismatches
ALTER TABLE public.mismatches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mismatches_select_own" ON public.mismatches
    FOR SELECT USING (
        run_id IN (
            SELECT r.id FROM public.reconciliation_runs r
            JOIN public.clients c ON r.client_id = c.id
            WHERE c.user_id = auth.uid()
        )
    );

CREATE POLICY "mismatches_insert_own" ON public.mismatches
    FOR INSERT WITH CHECK (
        run_id IN (
            SELECT r.id FROM public.reconciliation_runs r
            JOIN public.clients c ON r.client_id = c.id
            WHERE c.user_id = auth.uid()
        )
    );

CREATE POLICY "mismatches_delete_own" ON public.mismatches
    FOR DELETE USING (
        run_id IN (
            SELECT r.id FROM public.reconciliation_runs r
            JOIN public.clients c ON r.client_id = c.id
            WHERE c.user_id = auth.uid()
        )
    );

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Function to get dashboard metrics for a user
CREATE OR REPLACE FUNCTION get_dashboard_metrics(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_itc_recovered', COALESCE(
            (SELECT SUM(total_matched * 0.18)
             FROM public.reconciliation_runs r
             JOIN public.clients c ON r.client_id = c.id
             WHERE c.user_id = p_user_id
               AND r.status = 'completed'
               AND r.run_date >= date_trunc('month', CURRENT_DATE)),
            0
        ),
        'active_clients', (
            SELECT COUNT(*)
            FROM public.clients
            WHERE user_id = p_user_id
        ),
        'pending_reconciliations', (
            SELECT COUNT(*)
            FROM public.reconciliation_runs r
            JOIN public.clients c ON r.client_id = c.id
            WHERE c.user_id = p_user_id
              AND r.status IN ('pending', 'processing')
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- SEED: Create a test user trigger (auto-create profile on signup)
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, name, email, phone, firm_name)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'phone', NULL),
        COALESCE(NEW.raw_user_meta_data->>'firm_name', 'My Firm')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
