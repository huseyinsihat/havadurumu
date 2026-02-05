from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# Weather Request/Response Models
class WeatherRequest(BaseModel):
    """Hava durumu isteği"""
    province: str = Field(..., description="İl plaka kodu")
    start_date: str = Field(..., description="Başlangıç tarihi (YYYY-MM-DD)")
    end_date: Optional[str] = Field(None, description="Bitiş tarihi (YYYY-MM-DD)")
    metrics: Optional[List[str]] = Field(
        None, 
        description="İstenen metrikler"
    )

class HourlyWeatherData(BaseModel):
    """Saatlik hava durumu"""
    time: List[str] = Field(..., description="Saat damgaları")
    temperature_2m: List[float] = Field(..., description="Sıcaklık (°C)")
    precipitation: List[float] = Field(..., description="Yağış (mm)")
    wind_speed_10m: List[float] = Field(..., description="Rüzgar hızı (km/h)")
    relative_humidity_2m: List[int] = Field(..., description="Nem oranı (%)")
    weather_code: Optional[List[int]] = Field(None, description="Hava kodu")

class DailyWeatherData(BaseModel):
    """Günlük hava durumu"""
    time: List[str] = Field(..., description="Tarihler")
    temperature_2m_max: List[float] = Field(..., description="Maksimum sıcaklık (°C)")
    temperature_2m_min: List[float] = Field(..., description="Minimum sıcaklık (°C)")
    precipitation_sum: List[float] = Field(..., description="Toplam yağış (mm)")
    weather_code: Optional[List[int]] = Field(None, description="Hava kodu")

class WeatherData(BaseModel):
    """Hava durumu verisi"""
    hourly: Optional[HourlyWeatherData] = Field(None, description="Saatlik veriler")
    daily: Optional[DailyWeatherData] = Field(None, description="Günlük veriler")

class WeatherResponse(BaseModel):
    """Hava durumu response'u"""
    province: str = Field(..., description="İl adı")
    plate_code: str = Field(..., description="Plaka kodu")
    coordinates: Dict[str, float] = Field(..., description="Koordinatlar")
    timezone: str = Field(..., description="Zaman dilimi")
    data: WeatherData
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class CurrentWeather(BaseModel):
    """Anlık hava durumu"""
    plate_code: str
    name: str
    temperature: float = Field(..., description="Sıcaklık (°C)")
    precipitation: float = Field(..., description="Yağış (mm)")
    humidity: int = Field(..., description="Nem (%)")
    wind_speed: float = Field(..., description="Rüzgar (km/h)")
    icon: str = Field(..., description="İkon kodu")

class CurrentWeatherList(BaseModel):
    """Tüm iller için anlık hava durumu"""
    timestamp: str
    provinces: List[CurrentWeather]
