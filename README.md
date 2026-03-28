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

### Backend → Railway
1. Connect `backend/` directory to Railway
2. Set environment variables
3. Railway auto-detects `railway.toml` config

---

Built with ♠ by Kredge | kredge.in
