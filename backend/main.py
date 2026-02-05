from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import health, provinces, weather
from app.config import settings
from app.services.open_meteo import open_meteo

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Uygulama baslangic ve kapanis islemleri."""
    logger.info('Uygulama baslatiliyor...')
    yield
    await open_meteo.close()
    logger.info('Uygulama kapatiliyor...')


app = FastAPI(
    title=settings.API_TITLE,
    version=settings.API_VERSION,
    description="Turkiye'nin 81 ili icin hava durumu verileri API'si",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(health.router, prefix='/api', tags=['Health'])
app.include_router(provinces.router, prefix='/api', tags=['Provinces'])
app.include_router(weather.router, prefix='/api', tags=['Weather'])


@app.get('/')
async def root():
    """API ana sayfasi."""
    return {
        'message': "Turkiye Hava Durumu Haritasi API'sine hos geldiniz!",
        'version': settings.API_VERSION,
        'docs': '/docs',
        'redoc': '/redoc',
    }


if __name__ == '__main__':
    import uvicorn

    uvicorn.run('main:app', host='0.0.0.0', port=8000, reload=settings.DEBUG)
