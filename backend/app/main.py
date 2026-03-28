"""
Kredge API — Main Application Entry Point
GST ITC Reconciliation Platform for Indian CA Firms
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.v1.clients import router as clients_router
from app.api.v1.reconciliation import router as reconciliation_router
from app.api.v1.reports import router as reports_router
from app.api.v1.whatsapp import router as whatsapp_router

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Kredge — GST ITC Reconciliation API. Recover what's yours.",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API v1 routes
app.include_router(clients_router, prefix="/api/v1")
app.include_router(reconciliation_router, prefix="/api/v1")
app.include_router(reports_router, prefix="/api/v1")
app.include_router(whatsapp_router, prefix="/api/v1")


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
