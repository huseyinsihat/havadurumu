from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

# Province Models
class Coordinates(BaseModel):
    """Coğrafi koordinatlar"""
    latitude: float = Field(..., description="Enlem")
    longitude: float = Field(..., description="Boylam")

class ProvinceInfo(BaseModel):
    """İl bilgileri"""
    name: str = Field(..., description="İl adı")
    name_en: Optional[str] = Field(None, description="İngilizce adı")
    plate_code: str = Field(..., description="Plaka kodu")
    region: Optional[str] = Field(None, description="Bölge adı")
    population: Optional[int] = Field(None, description="Nüfus")
    area_km2: Optional[int] = Field(None, description="Yüzölçümü (km²)")
    elevation: Optional[int] = Field(None, description="Yükseklik (metre)")
    coordinates: Coordinates

class ProvinceList(BaseModel):
    """İl listesi"""
    provinces: List[ProvinceInfo]
    total: int = Field(..., description="Toplam il sayısı")
