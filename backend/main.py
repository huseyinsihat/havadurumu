from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.config import settings
from app.api import health, provinces, weather

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Lifecycle events
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Uygulama başlangıç ve kapanış işlemleri"""
    logger.info("🚀 Uygulama başlatılıyor...")
    yield
    logger.info("🛑 Uygulama kapatılıyor...")

# FastAPI App
app = FastAPI(
    title=settings.API_TITLE,
    version=settings.API_VERSION,
    description="Türkiye'nin 81 ili için hava durumu ve iklim verileri API'si",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(health.router, prefix="/api", tags=["Health"])
app.include_router(provinces.router, prefix="/api", tags=["Provinces"])
app.include_router(weather.router, prefix="/api", tags=["Weather"])

# Root endpoint
@app.get("/")
async def root():
    """API'nin ana sayfası"""
    return {
        "message": "🌦️ Türkiye İklim Haritası API'sine hoş geldiniz!",
        "version": settings.API_VERSION,
        "docs": "/docs",
        "redoc": "/redoc"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
