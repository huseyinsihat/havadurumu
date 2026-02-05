import os
from dotenv import load_dotenv
from pathlib import Path

load_dotenv()

class Settings:
    """Uygulama ayarları"""
    
    # API
    API_TITLE = "Türkiye İklim Haritası API"
    API_VERSION = "1.0.0"
    DEBUG = os.getenv("DEBUG", "True").lower() == "true"
    
    # CORS
    ALLOWED_ORIGINS = os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,http://localhost:5174,http://localhost:3000,http://localhost:8000"
    ).split(",")
    
    # Open-Meteo API
    OPEN_METEO_BASE_URL = "https://api.open-meteo.com/v1/forecast"
    OPEN_METEO_ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"
    
    # Redis (opsiyonel)
    REDIS_URL = os.getenv("REDIS_URL", None)
    CACHE_TTL = int(os.getenv("CACHE_TTL", 3600))  # 1 saat
    
    # Data - Backend klasöründen ../ ile parent'a git
    BASE_DIR = Path(__file__).parent.parent.parent
    GEOJSON_PATH = str(BASE_DIR / "data" / "turkey_provinces.geojson")
    COORDINATES_PATH = str(BASE_DIR / "data" / "province_coordinates.json")

settings = Settings()
