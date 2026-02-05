from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from app.services.geo_service import geo_service
from app.services.open_meteo import open_meteo
from app.models.weather import WeatherResponse, WeatherData, HourlyWeatherData, DailyWeatherData
from datetime import datetime, timedelta
import asyncio
import time
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

# In-memory cache for current weather
_current_cache = {
    "timestamp": 0.0,
    "payload": None
}
CURRENT_CACHE_TTL_SECONDS = 900
MAX_CONCURRENT_REQUESTS = 10

@router.get("/weather")
async def get_weather(
    province: str = Query(..., min_length=1, description="Ä°l plaka kodu"),
    start_date: str = Query(..., pattern=r"^\d{4}-\d{2}-\d{2}$", description="BaÅŸlangÄ±Ã§ tarihi (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, pattern=r"^\d{4}-\d{2}-\d{2}$", description="BitiÅŸ tarihi (YYYY-MM-DD)"),
    hourly: str = Query('true', description="Saatlik veri mi? (true/false)")
):
    """SeÃ§ilen il iÃ§in hava durumu verisini dÃ¶ndÃ¼rÃ¼r"""
    try:
        # String'i boolean'a Ã§evir
        hourly_bool = hourly.lower().strip() in ('true', '1', 'yes')
        
        # Province code'u normalize et (1 -> 01, 10 -> 10, etc)
        province = province.strip()
        if len(province) == 1:
            province = f"0{province}"
        
        print(f"\n{'='*60}")
        print(f"ğŸ“¡ WEATHER REQUEST RECEIVED")
        print(f"{'='*60}")
        print(f"   Province: {province}")
        print(f"   Start Date: {start_date}")
        print(f"   End Date: {end_date or start_date}")
        print(f"   Hourly: {hourly_bool}")
        print(f"{'='*60}\n")
        
        # Ä°l koordinatlarÄ±nÄ± al
        province_data = geo_service.get_province_by_code(province)
        if not province_data:
            print(f"âŒ Province not found: {province}")
            raise HTTPException(status_code=404, detail=f"Ä°l bulunamadÄ±: {province}")
        
        latitude = province_data.get("latitude")
        longitude = province_data.get("longitude")
        province_name = province_data.get("name")
        
        print(f"âœ… Found province: {province_name} (Code: {province}, Lat: {latitude}, Lon: {longitude})")
        
        # Tarih validasyonu
        try:
            start_dt = datetime.strptime(start_date, "%Y-%m-%d").date()
            end_dt = datetime.strptime(end_date or start_date, "%Y-%m-%d").date()
            if end_dt < start_dt:
                end_dt = start_dt
                print(f"âš ï¸ End date corrected to start date")
        except ValueError as e:
            print(f"âŒ Date format error: {str(e)}")
            raise HTTPException(status_code=400, detail=f"Tarih formatÄ± yanlÄ±ÅŸ: {str(e)}")
        
        # BugÃ¼nÃ¼n tarihi ile karÅŸÄ±laÅŸtÄ±r
        today = datetime.now().date()
        
        # Her zaman archive API'yi kullan (gerÃ§ek saatlik veri iÃ§in)
        print(f"ğŸ“… Using ARCHIVE weather API for Real hourly data: {start_date}")
        try:
            weather_data = await open_meteo.get_historical_weather(
                latitude=latitude,
                longitude=longitude,
                start_date=start_date,
                end_date=end_date or start_date,
                hourly=hourly_bool
            )
        except Exception as e:
            logger.error(f"Archive API failed: {e}, falling back to current weather")
            # Fallback to current weather if archive fails
            weather_data = await open_meteo.get_current_weather(
                latitude=latitude,
                longitude=longitude
            )
            current = weather_data.get("current", {})
            current_time = weather_data.get("current", {}).get("time", datetime.now().isoformat())
            
            if hourly_bool:
                # Generate single hour point from current
                weather_data = {
                    "hourly": {
                        "time": [current_time],
                        "temperature_2m": [float(current.get("temperature_2m", 0))],
                        "precipitation": [float(current.get("precipitation", 0))],
                        "wind_speed_10m": [float(current.get("wind_speed_10m", 0))],
                        "relative_humidity_2m": [int(current.get("relative_humidity_2m", 50))],
                        "weather_code": [int(current.get("weather_code", 0))]
                    }
                }
            else:
                weather_data = {
                    "daily": {
                        "time": [start_date],
                        "temperature_2m_max": [float(current.get("temperature_2m", 0))],
                        "temperature_2m_min": [float(current.get("temperature_2m", 0))],
                        "precipitation_sum": [float(current.get("precipitation", 0))],
                        "weather_code": [int(current.get("weather_code", 0))]
                    }
                }
        
        # Response formatla
        if hourly and "hourly" in weather_data:
            hourly_data = weather_data["hourly"]
            data = WeatherData(
                hourly=HourlyWeatherData(
                    time=hourly_data.get("time", []),
                    temperature_2m=hourly_data.get("temperature_2m", []),
                    precipitation=hourly_data.get("precipitation", []),
                    wind_speed_10m=hourly_data.get("wind_speed_10m", []),
                    relative_humidity_2m=hourly_data.get("relative_humidity_2m", []),
                    weather_code=hourly_data.get("weather_code")
                )
            )
        else:
            daily_data = weather_data.get("daily", {})
            data = WeatherData(
                daily=DailyWeatherData(
                    time=daily_data.get("time", []),
                    temperature_2m_max=daily_data.get("temperature_2m_max", []),
                    temperature_2m_min=daily_data.get("temperature_2m_min", []),
                    precipitation_sum=daily_data.get("precipitation_sum", []),
                    weather_code=daily_data.get("weather_code")
                )
            )
        
        return WeatherResponse(
            province=province_data.get("name"),
            plate_code=province,
            coordinates={
                "latitude": latitude,
                "longitude": longitude
            },
            timezone="Europe/Istanbul",
            data=data
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Hava durumu verisi alÄ±namadÄ±: {str(e)}")

@router.get("/weather/current")
async def get_current_weather():
    """TÃ¼m iller iÃ§in anlÄ±k hava durumunu dÃ¶ndÃ¼rÃ¼r"""
    try:
        now = time.time()
        if _current_cache["payload"] and (now - _current_cache["timestamp"]) < CURRENT_CACHE_TTL_SECONDS:
            return _current_cache["payload"]

        provinces = geo_service.get_all_provinces()
        sem = asyncio.Semaphore(MAX_CONCURRENT_REQUESTS)

        async def fetch_one(p):
            lat = p.get("latitude")
            lon = p.get("longitude")
            plate_code = p.get("plate_code")
            name = p.get("name")
            
            if lat is None or lon is None:
                logger.warning(f"âš ï¸ {name} ({plate_code}): Koordinat bulunamadÄ±")
                return None
            
            async with sem:
                try:
                    result = await open_meteo.get_current_weather(latitude=lat, longitude=lon)
                    current = result.get("current", {})
                    temp = current.get("temperature_2m", 0)
                    
                    logger.info(f"âœ… {name} ({plate_code}): {temp}Â°C")
                    
                    return {
                        "plate_code": plate_code,
                        "name": name,
                        "temperature": temp,
                        "precipitation": current.get("precipitation", 0),
                        "humidity": current.get("relative_humidity_2m", 0),
                        "wind_speed": current.get("wind_speed_10m", 0),
                        "icon": f"code_{current.get('weather_code', 0)}"
                    }
                except Exception as e:
                    logger.error(f"âŒ {name} ({plate_code}): {str(e)}")
                    return None

        tasks = [fetch_one(p) for p in provinces]
        results = await asyncio.gather(*tasks)
        current_weathers = [r for r in results if r is not None]

        payload = {
            "timestamp": datetime.utcnow().isoformat(),
            "provinces": current_weathers
        }
        _current_cache["timestamp"] = now
        _current_cache["payload"] = payload
        return payload
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AnlÄ±k veri alÄ±namadÄ±: {str(e)}")
