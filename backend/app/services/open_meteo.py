import asyncio
import httpx
import logging
from typing import Optional, Dict, Any

from app.config import settings

logger = logging.getLogger(__name__)

HOURLY_VARIABLES = ','.join(
    [
        'temperature_2m',
        'apparent_temperature',
        'precipitation',
        'wind_speed_10m',
        'wind_direction_10m',
        'relative_humidity_2m',
        'pressure_msl',
        'visibility',
        'cloud_cover',
        'weather_code',
    ]
)

DAILY_VARIABLES = ','.join(
    [
        'temperature_2m_max',
        'temperature_2m_min',
        'precipitation_sum',
        'weather_code',
    ]
)


class OpenMeteoService:
    """Open-Meteo API ile iletisim servisi"""

    def __init__(self):
        self.base_url = settings.OPEN_METEO_BASE_URL
        self.archive_url = settings.OPEN_METEO_ARCHIVE_URL
        self.timeout = 12.0
        self.max_retries = 2
        self._client = httpx.AsyncClient(
            limits=httpx.Limits(max_connections=120, max_keepalive_connections=40),
            timeout=self.timeout,
        )

    async def close(self):
        await self._client.aclose()

    async def _request_json(
        self,
        url: str,
        params: Dict[str, Any],
        timeout: Optional[float] = None,
        retries: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Transient ag hatalarina karsi retry ile API cagrisi yap."""
        last_error: Exception | None = None
        max_retries = self.max_retries if retries is None else max(0, retries)
        request_timeout = self.timeout if timeout is None else timeout

        for attempt in range(max_retries + 1):
            try:
                response = await self._client.get(url, params=params, timeout=request_timeout)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as exc:
                last_error = exc
                if attempt >= max_retries:
                    break

                wait_seconds = 0.5 * (attempt + 1)
                logger.warning(
                    'Open-Meteo request failed (attempt %s/%s): %s',
                    attempt + 1,
                    max_retries + 1,
                    exc,
                )
                await asyncio.sleep(wait_seconds)

        logger.error('Open-Meteo API error: %s', last_error)
        raise last_error if last_error else RuntimeError('Open-Meteo request failed')

    async def get_current_weather(
        self,
        latitude: float,
        longitude: float,
        timeout: Optional[float] = None,
        retries: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Anlik hava durumu al"""
        params = {
            'latitude': latitude,
            'longitude': longitude,
            'current': HOURLY_VARIABLES,
            'timezone': 'Europe/Istanbul',
        }
        return await self._request_json(self.base_url, params, timeout=timeout, retries=retries)

    async def get_historical_weather(
        self,
        latitude: float,
        longitude: float,
        start_date: str,
        end_date: Optional[str] = None,
        hourly: bool = True,
        timeout: Optional[float] = None,
        retries: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Gecmis hava durumu al (saatlik veya gunluk)"""
        params: Dict[str, Any] = {
            'latitude': latitude,
            'longitude': longitude,
            'start_date': start_date,
            'end_date': end_date or start_date,
            'timezone': 'Europe/Istanbul',
        }

        if hourly:
            params['hourly'] = HOURLY_VARIABLES
        else:
            params['daily'] = DAILY_VARIABLES

        return await self._request_json(self.archive_url, params, timeout=timeout, retries=retries)

    async def get_recent_weather(
        self,
        latitude: float,
        longitude: float,
        start_date: str,
        end_date: Optional[str] = None,
        hourly: bool = True,
        timeout: Optional[float] = None,
        retries: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Forecast API ile yakin tarih araligi verisi al."""
        params: Dict[str, Any] = {
            'latitude': latitude,
            'longitude': longitude,
            'start_date': start_date,
            'end_date': end_date or start_date,
            'timezone': 'Europe/Istanbul',
        }

        if hourly:
            params['hourly'] = HOURLY_VARIABLES
        else:
            params['daily'] = DAILY_VARIABLES

        return await self._request_json(self.base_url, params, timeout=timeout, retries=retries)

    async def get_forecast(
        self,
        latitude: float,
        longitude: float,
        days: int = 7,
        timeout: Optional[float] = None,
        retries: Optional[int] = None,
    ) -> Dict[str, Any]:
        """7 gunluk tahmin al"""
        params = {
            'latitude': latitude,
            'longitude': longitude,
            'daily': DAILY_VARIABLES,
            'forecast_days': days,
            'timezone': 'Europe/Istanbul',
        }
        return await self._request_json(self.base_url, params, timeout=timeout, retries=retries)


# Global instance
open_meteo = OpenMeteoService()
