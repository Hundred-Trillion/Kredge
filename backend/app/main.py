"""
Kredge API — Main Application Entry Point
GST ITC Reconciliation Platform for Indian CA Firms
"""

from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings as app_settings
from app.core.supabase_client import get_supabase

from app.api.v1.reconciliation import router as reconciliation_router
from app.api.v1.clients import router as clients_router
from app.api.v1.reports import router as reports_router
from app.api.v1.whatsapp import router as whatsapp_router
from app.api.v1.suppliers import router as suppliers_router
from app.api.v1.settings import router as settings_router
from app.api.v1.portal import router as portal_router
from app.api.v1.cron import router as cron_router

# Create main app instance
app = FastAPI(
    title=app_settings.APP_NAME,
    version=app_settings.APP_VERSION,
    description="GST ITC Reconciliation API. Recover what's yours.",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=app_settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
api_router = APIRouter(prefix="/api/v1")
api_router.include_router(clients_router)
api_router.include_router(reconciliation_router)
api_router.include_router(reports_router)
api_router.include_router(whatsapp_router)
api_router.include_router(suppliers_router)
api_router.include_router(settings_router)
api_router.include_router(portal_router)
api_router.include_router(cron_router)

app.include_router(api_router)


@app.get("/")
async def root():
    return {
        "name": "Kredge API",
        "version": settings.APP_VERSION,
        "tagline": "Recover what's yours.",
        "status": "running",
        "supabase_configured": settings.is_supabase_configured,
        "whatsapp_configured": settings.is_whatsapp_configured,
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}
