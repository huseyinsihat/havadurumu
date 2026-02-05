from fastapi import APIRouter
from datetime import datetime
import time

router = APIRouter()

# Server start time (basit uptime tracking)
START_TIME = time.time()

@router.get("/health")
async def health_check():
    """Sağlık kontrolü endpoint'i"""
    uptime_seconds = int(time.time() - START_TIME)
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "uptime_seconds": uptime_seconds,
        "message": "🟢 API çalışıyor"
    }
