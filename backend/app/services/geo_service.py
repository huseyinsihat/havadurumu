import json
import logging
from typing import Optional, Dict, List, Any
from app.config import settings

logger = logging.getLogger(__name__)

class GeoService:
    """Coğrafi veri servisi"""
    
    def __init__(self):
        self.provinces_cache = None
        self.coordinates_cache = None
        self._load_data()
    
    def _load_data(self):
        """Varyları yükle"""
        try:
            # GeoJSON yükle
            with open(settings.GEOJSON_PATH, 'r', encoding='utf-8') as f:
                self.geojson_data = json.load(f)
            
            # Koordinatlar yükle
            with open(settings.COORDINATES_PATH, 'r', encoding='utf-8') as f:
                self.coordinates_data = json.load(f)
            
            logger.info("✅ Coğrafi veriler yüklendi")
        except FileNotFoundError as e:
            logger.error(f"❌ Dosya bulunamadı: {e}")
            raise
        except json.JSONDecodeError as e:
            logger.error(f"❌ JSON parsing hatası: {e}")
            raise
    
    def get_all_provinces(self) -> List[Dict[str, Any]]:
        """Tüm illeri al"""
        return self.coordinates_data.get("provinces", [])
    
    def get_province_by_code(self, plate_code: str) -> Optional[Dict[str, Any]]:
        """Plaka koduna göre il al"""
        for province in self.get_all_provinces():
            if province.get("plate_code") == plate_code:
                return province
        return None
    
    def get_province_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        """İle göre il al"""
        for province in self.get_all_provinces():
            if province.get("name").lower() == name.lower():
                return province
        return None
    
    def get_province_coordinates(self, plate_code: str) -> Optional[Dict[str, float]]:
        """İlinin koordinatlarını al"""
        province = self.get_province_by_code(plate_code)
        if province:
            return {
                "latitude": province.get("latitude"),
                "longitude": province.get("longitude")
            }
        return None
    
    def get_geojson_features(self) -> List[Dict[str, Any]]:
        """GeoJSON özelliklerini al"""
        return self.geojson_data.get("features", [])

# Global instance
geo_service = GeoService()
