import asyncio
import httpx
import logging
from typing import Optional, Dict, Any
from app.config import settings

logger = logging.getLogger(__name__)


class OpenMeteoService:
    """Open-Meteo API ile iletisim servisi"""

    def __init__(self):
        self.base_url = settings.OPEN_METEO_BASE_URL
        self.archive_url = settings.OPEN_METEO_ARCHIVE_URL
        self.timeout = 12.0
        self.max_retries = 2

    async def _request_json(self, url: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Transient ag hatalarina karsi retry ile API cagrisi yap."""
        last_error: Exception | None = None

        for attempt in range(self.max_retries + 1):
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.get(url, params=params, timeout=self.timeout)
                    response.raise_for_status()
                    return response.json()
            except httpx.HTTPError as exc:
                last_error = exc
                if attempt >= self.max_retries:
                    break

                wait_seconds = 0.5 * (attempt + 1)
                logger.warning(
                    "Open-Meteo request failed (attempt %s/%s): %s",
                    attempt + 1,
                    self.max_retries + 1,
                    exc,
                )
                await asyncio.sleep(wait_seconds)

        logger.error("Open-Meteo API error: %s", last_error)
        raise last_error if last_error else RuntimeError("Open-Meteo request failed")

    async def get_current_weather(self, latitude: float, longitude: float) -> Dict[str, Any]:
        """Anlik hava durumu al"""
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "current": "temperature_2m,precipitation,weather_code,wind_speed_10m,relative_humidity_2m",
            "timezone": "Europe/Istanbul",
        }
        return await self._request_json(self.base_url, params)

    async def get_historical_weather(
        self,
        latitude: float,
        longitude: float,
        start_date: str,
        end_date: Optional[str] = None,
        hourly: bool = True,
    ) -> Dict[str, Any]:
        """Gecmis hava durumu al (saatlik veya gunluk)"""
        params: Dict[str, Any] = {
            "latitude": latitude,
            "longitude": longitude,
            "start_date": start_date,
            "end_date": end_date or start_date,
            "timezone": "Europe/Istanbul",
        }

        if hourly:
            params["hourly"] = "temperature_2m,precipitation,wind_speed_10m,relative_humidity_2m,weather_code"
        else:
            params["daily"] = "temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code"

        return await self._request_json(self.archive_url, params)

    async def get_forecast(self, latitude: float, longitude: float, days: int = 7) -> Dict[str, Any]:
        """7 gunluk tahmin al"""
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code",
            "forecast_days": days,
            "timezone": "Europe/Istanbul",
        }
        return await self._request_json(self.base_url, params)


# Global instance
open_meteo = OpenMeteoService()
