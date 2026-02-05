from datetime import datetime
import asyncio
import logging
import time
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from app.models.weather import DailyWeatherData, HourlyWeatherData, WeatherData, WeatherResponse
from app.services.geo_service import geo_service
from app.services.open_meteo import open_meteo

router = APIRouter()
logger = logging.getLogger(__name__)

_current_cache = {'timestamp': 0.0, 'payload': None}
_snapshot_cache = {'timestamp': 0.0, 'key': None, 'payload': None}
_snapshot_hourly_cache: dict[str, dict] = {}
_weather_cache: dict[str, dict] = {}

CURRENT_CACHE_TTL_SECONDS = 900
SNAPSHOT_CACHE_TTL_SECONDS = 900
SNAPSHOT_HOURLY_CACHE_TTL_SECONDS = 21600
WEATHER_CACHE_TTL_SECONDS = 900
SNAPSHOT_FETCH_TIMEOUT_SECONDS = 6.5
SNAPSHOT_CURRENT_TIMEOUT_SECONDS = 5.0
MAX_CONCURRENT_REQUESTS = 10


def _parse_time_fraction(value: str) -> float:
    try:
        hour_str, minute_str = value.split(':')
        hour = int(hour_str)
        minute = int(minute_str)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail='Saat formati HH:MM olmali.') from exc

    if hour < 0 or hour > 23 or minute < 0 or minute > 59:
        raise HTTPException(status_code=400, detail='Saat degeri gecersiz.')

    return hour + (minute / 60.0)


def _extract_hour_fraction(timestamp: str) -> Optional[float]:
    try:
        time_part = timestamp.split('T', 1)[1]
        hour_str, minute_str = time_part.split(':', 1)
        return int(hour_str) + (int(minute_str[:2]) / 60.0)
    except Exception:
        return None


def _resolve_best_hour_index(time_values: list[str], target_hour: float) -> int:
    if not time_values:
        return 0

    best_index = 0
    best_distance = 999.0

    for index, time_value in enumerate(time_values):
        hour_fraction = _extract_hour_fraction(time_value)
        if hour_fraction is None:
            continue

        distance = abs(hour_fraction - target_hour)
        if distance < best_distance:
            best_distance = distance
            best_index = index

    return best_index


def _safe_value(values, index: int, default):
    if not isinstance(values, list):
        return default
    if index < 0 or index >= len(values):
        return default
    return values[index]


def _snapshot_cache_get(date: str):
    entry = _snapshot_hourly_cache.get(date)
    if not entry:
        return None

    now = time.time()
    if (now - entry['timestamp']) > SNAPSHOT_HOURLY_CACHE_TTL_SECONDS:
        _snapshot_hourly_cache.pop(date, None)
        return None

    return entry['payload']


def _snapshot_cache_put(date: str, payload):
    _snapshot_hourly_cache[date] = {
        'timestamp': time.time(),
        'payload': payload,
    }

    if len(_snapshot_hourly_cache) > 6:
        oldest_date = min(_snapshot_hourly_cache.items(), key=lambda item: item[1]['timestamp'])[0]
        _snapshot_hourly_cache.pop(oldest_date, None)


def _weather_cache_get(key: str):
    entry = _weather_cache.get(key)
    if not entry:
        return None

    if (time.time() - entry['timestamp']) > WEATHER_CACHE_TTL_SECONDS:
        _weather_cache.pop(key, None)
        return None

    return entry['payload']


def _weather_cache_put(key: str, payload):
    _weather_cache[key] = {'timestamp': time.time(), 'payload': payload}
    if len(_weather_cache) > 512:
        oldest_key = min(_weather_cache.items(), key=lambda item: item[1]['timestamp'])[0]
        _weather_cache.pop(oldest_key, None)


@router.get('/weather')
async def get_weather(
    province: str = Query(..., min_length=1, description='Il plaka kodu'),
    start_date: str = Query(..., pattern=r'^\d{4}-\d{2}-\d{2}$', description='Baslangic tarihi (YYYY-MM-DD)'),
    end_date: Optional[str] = Query(None, pattern=r'^\d{4}-\d{2}-\d{2}$', description='Bitis tarihi (YYYY-MM-DD)'),
    hourly: str = Query('true', description='Saatlik veri mi? (true/false)'),
):
    """Secilen il icin hava durumu verisini dondurur."""
    try:
        hourly_bool = hourly.lower().strip() in ('true', '1', 'yes')

        province = province.strip()
        if len(province) == 1:
            province = f'0{province}'

        province_data = geo_service.get_province_by_code(province)
        if not province_data:
            raise HTTPException(status_code=404, detail=f'Il bulunamadi: {province}')

        latitude = province_data.get('latitude')
        longitude = province_data.get('longitude')

        try:
            start_dt = datetime.strptime(start_date, '%Y-%m-%d').date()
            end_dt = datetime.strptime(end_date or start_date, '%Y-%m-%d').date()
            if end_dt < start_dt:
                end_dt = start_dt
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=f'Tarih formati yanlis: {exc}') from exc

        cache_key = f'{province}|{start_dt.isoformat()}|{end_dt.isoformat()}|{hourly_bool}'
        cached_payload = _weather_cache_get(cache_key)
        if cached_payload:
            return cached_payload

        try:
            weather_data = await open_meteo.get_historical_weather(
                latitude=latitude,
                longitude=longitude,
                start_date=start_date,
                end_date=end_date or start_date,
                hourly=hourly_bool,
            )
        except Exception as exc:
            logger.warning('Archive API failed: %s. Trying forecast API.', exc)
            try:
                weather_data = await open_meteo.get_recent_weather(
                    latitude=latitude,
                    longitude=longitude,
                    start_date=start_date,
                    end_date=end_date or start_date,
                    hourly=hourly_bool,
                )
            except Exception as recent_exc:
                logger.error('Forecast API failed: %s. Falling back to current weather.', recent_exc)
                weather_data = await open_meteo.get_current_weather(latitude=latitude, longitude=longitude)
                current = weather_data.get('current', {})
                current_time = current.get('time', datetime.now().isoformat())

                if hourly_bool:
                    weather_data = {
                        'hourly': {
                            'time': [current_time],
                            'temperature_2m': [float(current.get('temperature_2m', 0))],
                            'apparent_temperature': [float(current.get('apparent_temperature', current.get('temperature_2m', 0)))],
                            'precipitation': [float(current.get('precipitation', 0))],
                            'wind_speed_10m': [float(current.get('wind_speed_10m', 0))],
                            'wind_direction_10m': [float(current.get('wind_direction_10m', 0))],
                            'relative_humidity_2m': [int(current.get('relative_humidity_2m', 50))],
                            'pressure_msl': [float(current.get('pressure_msl', 0))],
                            'visibility': [float(current.get('visibility', 0))],
                            'cloud_cover': [int(current.get('cloud_cover', 0))],
                            'weather_code': [int(current.get('weather_code', 0))],
                        }
                    }
                else:
                    weather_data = {
                        'daily': {
                            'time': [start_date],
                            'temperature_2m_max': [float(current.get('temperature_2m', 0))],
                            'temperature_2m_min': [float(current.get('temperature_2m', 0))],
                            'precipitation_sum': [float(current.get('precipitation', 0))],
                            'weather_code': [int(current.get('weather_code', 0))],
                        }
                    }

        if hourly_bool and 'hourly' in weather_data:
            hourly_data = weather_data['hourly']
            data = WeatherData(
                hourly=HourlyWeatherData(
                    time=hourly_data.get('time', []),
                    temperature_2m=hourly_data.get('temperature_2m', []),
                    precipitation=hourly_data.get('precipitation', []),
                    wind_speed_10m=hourly_data.get('wind_speed_10m', []),
                    relative_humidity_2m=hourly_data.get('relative_humidity_2m', []),
                    weather_code=hourly_data.get('weather_code'),
                    apparent_temperature=hourly_data.get('apparent_temperature'),
                    wind_direction_10m=hourly_data.get('wind_direction_10m'),
                    pressure_msl=hourly_data.get('pressure_msl'),
                    visibility=hourly_data.get('visibility'),
                    cloud_cover=hourly_data.get('cloud_cover'),
                )
            )
        else:
            daily_data = weather_data.get('daily', {})
            data = WeatherData(
                daily=DailyWeatherData(
                    time=daily_data.get('time', []),
                    temperature_2m_max=daily_data.get('temperature_2m_max', []),
                    temperature_2m_min=daily_data.get('temperature_2m_min', []),
                    precipitation_sum=daily_data.get('precipitation_sum', []),
                    weather_code=daily_data.get('weather_code'),
                )
            )

        payload = WeatherResponse(
            province=province_data.get('name'),
            plate_code=province,
            coordinates={'latitude': latitude, 'longitude': longitude},
            timezone='Europe/Istanbul',
            data=data,
        )
        payload_dict = payload.model_dump()
        _weather_cache_put(cache_key, payload_dict)
        return payload_dict
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f'Hava durumu verisi alinamadi: {exc}') from exc


async def _build_snapshot_hourly_payload(date: str):
    provinces = geo_service.get_all_provinces()
    sem = asyncio.Semaphore(MAX_CONCURRENT_REQUESTS)
    today = datetime.now().date()
    target_date = datetime.strptime(date, '%Y-%m-%d').date()

    async def fetch_one(province):
        lat = province.get('latitude')
        lon = province.get('longitude')
        plate_code = province.get('plate_code')
        name = province.get('name')

        if lat is None or lon is None or not plate_code:
            return None

        async with sem:
            try:
                weather_data = await open_meteo.get_historical_weather(
                    latitude=lat,
                    longitude=lon,
                    start_date=date,
                    end_date=date,
                    hourly=True,
                    timeout=SNAPSHOT_FETCH_TIMEOUT_SECONDS,
                    retries=0,
                )
                hourly_data = weather_data.get('hourly', {})
                if not hourly_data.get('time'):
                    raise RuntimeError('hourly data is empty')
            except Exception as exc:
                try:
                    weather_data = await open_meteo.get_recent_weather(
                        latitude=lat,
                        longitude=lon,
                        start_date=date,
                        end_date=date,
                        hourly=True,
                        timeout=SNAPSHOT_FETCH_TIMEOUT_SECONDS,
                        retries=0,
                    )
                    hourly_data = weather_data.get('hourly', {})
                    if not hourly_data.get('time'):
                        raise RuntimeError('recent hourly data is empty')
                except Exception as recent_exc:
                    logger.warning('Snapshot hourly fallback failed for %s (%s): %s', name, plate_code, recent_exc)

                    if target_date != today:
                        return None

                    try:
                        current_data = await open_meteo.get_current_weather(
                            latitude=lat,
                            longitude=lon,
                            timeout=SNAPSHOT_CURRENT_TIMEOUT_SECONDS,
                            retries=0,
                        )
                        current = current_data.get('current', {})
                        current_time = current.get('time', f'{date}T00:00')
                        hourly_data = {
                            'time': [current_time],
                            'temperature_2m': [float(current.get('temperature_2m', 0))],
                            'apparent_temperature': [float(current.get('apparent_temperature', current.get('temperature_2m', 0)))],
                            'precipitation': [float(current.get('precipitation', 0))],
                            'wind_speed_10m': [float(current.get('wind_speed_10m', 0))],
                            'wind_direction_10m': [float(current.get('wind_direction_10m', 0))],
                            'relative_humidity_2m': [int(current.get('relative_humidity_2m', 0))],
                            'pressure_msl': [float(current.get('pressure_msl', 0))],
                            'visibility': [float(current.get('visibility', 0))],
                            'cloud_cover': [int(current.get('cloud_cover', 0))],
                            'weather_code': [int(current.get('weather_code', 0))],
                        }
                    except Exception as current_exc:
                        logger.error('Snapshot fallback failed for %s (%s): %s', name, plate_code, current_exc)
                        return None

            return {
                'plate_code': str(plate_code).zfill(2),
                'name': name,
                'hourly': {
                    'time': hourly_data.get('time', []),
                    'temperature_2m': hourly_data.get('temperature_2m', []),
                    'apparent_temperature': hourly_data.get('apparent_temperature', []),
                    'precipitation': hourly_data.get('precipitation', []),
                    'relative_humidity_2m': hourly_data.get('relative_humidity_2m', []),
                    'wind_speed_10m': hourly_data.get('wind_speed_10m', []),
                    'wind_direction_10m': hourly_data.get('wind_direction_10m', []),
                    'pressure_msl': hourly_data.get('pressure_msl', []),
                    'visibility': hourly_data.get('visibility', []),
                    'cloud_cover': hourly_data.get('cloud_cover', []),
                    'weather_code': hourly_data.get('weather_code', []),
                },
            }

    tasks = [fetch_one(province) for province in provinces]
    results = await asyncio.gather(*tasks)
    return {
        'provinces': [item for item in results if item is not None],
        'total': len(provinces),
    }


@router.get('/weather/snapshot')
async def get_weather_snapshot(
    date: str = Query(..., pattern=r'^\d{4}-\d{2}-\d{2}$', description='Tarih (YYYY-MM-DD)'),
    time_value: str = Query(..., alias='time', pattern=r'^\d{2}:\d{2}$', description='Saat (HH:MM)'),
):
    """81 il icin secilen tarih-saat anina en yakin saatlik snapshot verisini dondurur."""
    try:
        target_date = datetime.strptime(date, '%Y-%m-%d').date()
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=f'Tarih formati yanlis: {exc}') from exc

    today = datetime.now().date()
    if target_date > today:
        raise HTTPException(status_code=400, detail='Gelecek tarih secilemez.')

    target_hour = _parse_time_fraction(time_value)

    now = time.time()
    cache_key = f'{date}|{time_value}'
    if (
        _snapshot_cache['payload']
        and _snapshot_cache['key'] == cache_key
        and (now - _snapshot_cache['timestamp']) < SNAPSHOT_CACHE_TTL_SECONDS
    ):
        return _snapshot_cache['payload']

    hourly_payload = _snapshot_cache_get(date)
    if hourly_payload is None:
        hourly_payload = await _build_snapshot_hourly_payload(date)
        _snapshot_cache_put(date, hourly_payload)

    snapshot_data = []
    for item in hourly_payload.get('provinces', []):
        hourly_data = item.get('hourly', {})
        hourly_times = hourly_data.get('time', [])
        if not hourly_times:
            continue

        index = _resolve_best_hour_index(hourly_times, target_hour)
        temperature = _safe_value(hourly_data.get('temperature_2m', []), index, None)
        if temperature is None:
            continue

        snapshot_data.append(
            {
                'plate_code': item.get('plate_code'),
                'name': item.get('name'),
                'temperature': float(temperature),
                'apparent_temperature': float(_safe_value(hourly_data.get('apparent_temperature', []), index, temperature) or temperature),
                'precipitation': float(_safe_value(hourly_data.get('precipitation', []), index, 0.0) or 0.0),
                'humidity': int(_safe_value(hourly_data.get('relative_humidity_2m', []), index, 0) or 0),
                'wind_speed': float(_safe_value(hourly_data.get('wind_speed_10m', []), index, 0.0) or 0.0),
                'wind_direction_10m': float(_safe_value(hourly_data.get('wind_direction_10m', []), index, 0.0) or 0.0),
                'pressure_msl': float(_safe_value(hourly_data.get('pressure_msl', []), index, 0.0) or 0.0),
                'visibility': float(_safe_value(hourly_data.get('visibility', []), index, 0.0) or 0.0),
                'cloud_cover': int(_safe_value(hourly_data.get('cloud_cover', []), index, 0) or 0),
                'weather_code': int(_safe_value(hourly_data.get('weather_code', []), index, 0) or 0),
                'icon': f"code_{int(_safe_value(hourly_data.get('weather_code', []), index, 0) or 0)}",
                'resolved_time': _safe_value(hourly_times, index, f'{date}T00:00'),
            }
        )

    payload = {
        'requested_date': date,
        'requested_time': time_value,
        'timestamp': datetime.utcnow().isoformat(),
        'coverage': {
            'available': len(snapshot_data),
            'total': hourly_payload.get('total', 81),
        },
        'provinces': snapshot_data,
    }

    _snapshot_cache['timestamp'] = now
    _snapshot_cache['key'] = cache_key
    _snapshot_cache['payload'] = payload

    return payload


@router.get('/weather/current')
async def get_current_weather():
    """Tum iller icin anlik hava durumunu dondurur."""
    try:
        now = time.time()
        if _current_cache['payload'] and (now - _current_cache['timestamp']) < CURRENT_CACHE_TTL_SECONDS:
            return _current_cache['payload']

        provinces = geo_service.get_all_provinces()
        sem = asyncio.Semaphore(MAX_CONCURRENT_REQUESTS)
        today = datetime.now().strftime('%Y-%m-%d')

        async def fetch_one(province):
            lat = province.get('latitude')
            lon = province.get('longitude')
            plate_code = province.get('plate_code')
            name = province.get('name')

            if lat is None or lon is None or not plate_code:
                logger.warning('Skipping province without coordinates: %s (%s)', name, plate_code)
                return None

            async with sem:
                try:
                    result = await open_meteo.get_current_weather(latitude=lat, longitude=lon)
                    current = result.get('current', {})
                    return {
                        'plate_code': plate_code,
                        'name': name,
                        'temperature': current.get('temperature_2m', 0),
                        'apparent_temperature': current.get('apparent_temperature', current.get('temperature_2m', 0)),
                        'precipitation': current.get('precipitation', 0),
                        'humidity': current.get('relative_humidity_2m', 0),
                        'wind_speed': current.get('wind_speed_10m', 0),
                        'wind_direction_10m': current.get('wind_direction_10m', 0),
                        'pressure_msl': current.get('pressure_msl', 0),
                        'visibility': current.get('visibility', 0),
                        'cloud_cover': current.get('cloud_cover', 0),
                        'weather_code': current.get('weather_code', 0),
                        'icon': f"code_{current.get('weather_code', 0)}",
                    }
                except Exception as current_exc:
                    logger.warning('Current weather failed for %s (%s): %s', name, plate_code, current_exc)

                    try:
                        fallback = await open_meteo.get_recent_weather(
                            latitude=lat,
                            longitude=lon,
                            start_date=today,
                            end_date=today,
                            hourly=True,
                        )
                        hourly_data = fallback.get('hourly', {})
                        temps = hourly_data.get('temperature_2m', [])
                        idx = len(temps) - 1 if temps else 0

                        return {
                            'plate_code': plate_code,
                            'name': name,
                            'temperature': float(_safe_value(temps, idx, 0.0) or 0.0),
                            'apparent_temperature': float(_safe_value(hourly_data.get('apparent_temperature', []), idx, _safe_value(temps, idx, 0.0) or 0.0) or 0.0),
                            'precipitation': float(_safe_value(hourly_data.get('precipitation', []), idx, 0.0) or 0.0),
                            'humidity': int(_safe_value(hourly_data.get('relative_humidity_2m', []), idx, 0) or 0),
                            'wind_speed': float(_safe_value(hourly_data.get('wind_speed_10m', []), idx, 0.0) or 0.0),
                            'wind_direction_10m': float(_safe_value(hourly_data.get('wind_direction_10m', []), idx, 0.0) or 0.0),
                            'pressure_msl': float(_safe_value(hourly_data.get('pressure_msl', []), idx, 0.0) or 0.0),
                            'visibility': float(_safe_value(hourly_data.get('visibility', []), idx, 0.0) or 0.0),
                            'cloud_cover': int(_safe_value(hourly_data.get('cloud_cover', []), idx, 0) or 0),
                            'weather_code': int(_safe_value(hourly_data.get('weather_code', []), idx, 0) or 0),
                            'icon': f"code_{int(_safe_value(hourly_data.get('weather_code', []), idx, 0) or 0)}",
                        }
                    except Exception as fallback_exc:
                        logger.error('Fallback weather failed for %s (%s): %s', name, plate_code, fallback_exc)
                        return None

        tasks = [fetch_one(province) for province in provinces]
        results = await asyncio.gather(*tasks)
        current_weathers = [item for item in results if item is not None]

        payload = {
            'timestamp': datetime.utcnow().isoformat(),
            'provinces': current_weathers,
        }
        _current_cache['timestamp'] = now
        _current_cache['payload'] = payload
        return payload
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f'Anlik veri alinamadi: {exc}') from exc
