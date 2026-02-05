from datetime import datetime
from typing import Dict, List, Optional

from pydantic import BaseModel, Field


class WeatherRequest(BaseModel):
    """Hava durumu istegi"""

    province: str = Field(..., description='Il plaka kodu')
    start_date: str = Field(..., description='Baslangic tarihi (YYYY-MM-DD)')
    end_date: Optional[str] = Field(None, description='Bitis tarihi (YYYY-MM-DD)')
    metrics: Optional[List[str]] = Field(None, description='Istenen metrikler')


class HourlyWeatherData(BaseModel):
    """Saatlik hava durumu"""

    time: List[str] = Field(..., description='Saat damgalari')
    temperature_2m: List[float] = Field(..., description='Sicaklik (C)')
    precipitation: List[float] = Field(..., description='Yagis (mm)')
    wind_speed_10m: List[float] = Field(..., description='Ruzgar hizi (km/h)')
    relative_humidity_2m: List[int] = Field(..., description='Nem orani (%)')
    weather_code: Optional[List[int]] = Field(None, description='Hava kodu')

    apparent_temperature: Optional[List[float]] = Field(None, description='Hissedilen sicaklik (C)')
    wind_direction_10m: Optional[List[float]] = Field(None, description='Ruzgar yonu (derece)')
    pressure_msl: Optional[List[float]] = Field(None, description='Deniz seviyesi basinci (hPa)')
    visibility: Optional[List[float]] = Field(None, description='Gorus mesafesi (metre)')
    cloud_cover: Optional[List[int]] = Field(None, description='Bulutluluk (%)')


class DailyWeatherData(BaseModel):
    """Gunluk hava durumu"""

    time: List[str] = Field(..., description='Tarihler')
    temperature_2m_max: List[float] = Field(..., description='Maksimum sicaklik (C)')
    temperature_2m_min: List[float] = Field(..., description='Minimum sicaklik (C)')
    precipitation_sum: List[float] = Field(..., description='Toplam yagis (mm)')
    weather_code: Optional[List[int]] = Field(None, description='Hava kodu')


class WeatherData(BaseModel):
    """Hava durumu verisi"""

    hourly: Optional[HourlyWeatherData] = Field(None, description='Saatlik veriler')
    daily: Optional[DailyWeatherData] = Field(None, description='Gunluk veriler')


class WeatherResponse(BaseModel):
    """Hava durumu response"""

    province: str = Field(..., description='Il adi')
    plate_code: str = Field(..., description='Plaka kodu')
    coordinates: Dict[str, float] = Field(..., description='Koordinatlar')
    timezone: str = Field(..., description='Zaman dilimi')
    data: WeatherData
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class CurrentWeather(BaseModel):
    """Anlik hava durumu"""

    plate_code: str
    name: str
    temperature: float = Field(..., description='Sicaklik (C)')
    precipitation: float = Field(..., description='Yagis (mm)')
    humidity: int = Field(..., description='Nem (%)')
    wind_speed: float = Field(..., description='Ruzgar (km/h)')
    icon: str = Field(..., description='Ikon kodu')

    apparent_temperature: Optional[float] = None
    pressure_msl: Optional[float] = None
    visibility: Optional[float] = None
    cloud_cover: Optional[int] = None
    wind_direction_10m: Optional[float] = None
    weather_code: Optional[int] = None


class CurrentWeatherList(BaseModel):
    """Tum iller icin anlik hava durumu"""

    timestamp: str
    provinces: List[CurrentWeather]
