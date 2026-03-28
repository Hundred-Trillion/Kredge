# Kredge

**Recover what's yours.** — GST ITC Reconciliation Platform for Indian CA Firms.

Kredge helps chartered accountants reconcile Input Tax Credit between purchase registers (Tally/Busy exports) and GSTR-2B returns from the GST portal. It identifies missing invoices, value mismatches, and GSTIN discrepancies — so no ITC goes unclaimed.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Tailwind CSS (Vite) |
| Backend | Python + FastAPI |
| Database | PostgreSQL via Supabase |
| Auth | Supabase Auth (email/password) |
| File Parsing | openpyxl (Excel), json (GSTR-2B) |
| Reconciliation | Pandas |
| PDF Reports | WeasyPrint + Jinja2 |
| WhatsApp Alerts | Meta WhatsApp Cloud API |
| Frontend Hosting | Vercel |
| Backend Hosting | Railway |

## Quick Start (Docker)

```bash
# Clone and start
docker-compose up --build

# Frontend: http://localhost:5173
# Backend:  http://localhost:8000
# API Docs: http://localhost:8000/api/docs
```

For development with hot reload:
```bash
docker-compose --profile dev up --build
```

## Quick Start (Local)

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Environment Variables

### Frontend (.env)
```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:8000
```

### Backend (.env)
```
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_KEY=your-service-role-key
JWT_SECRET=your-jwt-secret
WHATSAPP_PHONE_NUMBER_ID=your-wa-phone-id
WHATSAPP_ACCESS_TOKEN=your-wa-token
FRONTEND_URL=http://localhost:5173
```

## Demo Mode

Runs without Supabase configuration. All data stored in-memory with realistic demo data. Perfect for UI development and testing.

## Database Setup

Run `supabase/schema.sql` in your Supabase SQL Editor to create all tables, indexes, RLS policies, and triggers.

## Test Data

Generate sample purchase register:
```bash
cd test_data
pip install openpyxl
python generate_test_data.py
```

A sample GSTR-2B JSON is included at `test_data/sample_gstr2b.json`.

## Deployment

### Frontend → Vercel
1. Connect `frontend/` directory to Vercel
2. Set environment variables
3. Build command: `npm run build`
4. Output directory: `dist`

## V2 Features & Architecture

Since the initial release, Kredge has been extended with the following V2 enterprise capabilities:

### Supplier Engine & Automated Emails
Kredge calculates a global **Supplier Risk Score** (GREEN/YELLOW/RED) based on mismatch frequency across the firm's entire client base. When mismatches are found, CAs can initiate the **"Chase Suppliers"** workflow to automatically generate and send discrepancy reports directly to the defaulting suppliers leveraging the **Resend API**.

### Client Portal
CAs can issue read-only, securely tokenized URLs (`/portal/:token`) directly to their clients. This allows the end-business to monitor their ITC recovered and mismatch velocity without needing a Kredge account.

### Automated Monthly Summaries (Cron)
Kredge aggregates firm-wide statistics on the 1st of every month automatically.
- **Cron Setup (Railway)**: Since Railway lacks a native cron UI, Kredge exposes a secured webhook at `POST /api/v1/cron/monthly-summary`. You must set up an external scheduler (e.g., [cron-job.org](https://cron-job.org) or GitHub Actions) to hit this endpoint on schedule. Include the `Authorization: Bearer <CRON_SECRET>` header.

## Environment Variables (V2 Updates)

### Backend (.env addition)
```
RESEND_API_KEY=re_xxxxxxxxxxxxx
CRON_SECRET=your_secure_random_string   # For securing the monthly cron webhook
```

---

## License

Kredge is licensed under the **Business Source License 1.1 (BSL)** by **L88 Laboratories**.
You may use the source code for free for non-production, testing, and development purposes. Production use (generating revenue or providing CA services) requires a commercial agreement. On the change date (2030-01-01), the license reverts to the Apache 2.0 License. See the `LICENSE` file for details.

Built with ♠ by Kredge | kredge.in

