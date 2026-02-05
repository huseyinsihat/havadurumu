from fastapi import APIRouter, HTTPException
from typing import List
from app.services.geo_service import geo_service
from app.models.province import ProvinceInfo, ProvinceList, Coordinates

router = APIRouter()

@router.get("/provinces", response_model=ProvinceList)
async def get_provinces():
    """81 ilin listesini döndürür"""
    try:
        provinces_data = geo_service.get_all_provinces()
        
        provinces = []
        for p in provinces_data:
            province = ProvinceInfo(
                name=p.get("name"),
                name_en=p.get("name"),
                plate_code=p.get("plate_code"),
                region=p.get("region"),
                population=p.get("population"),
                area_km2=p.get("area_km2"),
                elevation=p.get("elevation"),
                coordinates=Coordinates(
                    latitude=p.get("latitude"),
                    longitude=p.get("longitude")
                )
            )
            provinces.append(province)
        
        return ProvinceList(
            provinces=provinces,
            total=len(provinces)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/provinces/{plate_code}")
async def get_province(plate_code: str):
    """Spesifik bir ili al"""
    try:
        province_data = geo_service.get_province_by_code(plate_code)
        if not province_data:
            raise HTTPException(status_code=404, detail=f"İl bulunamadı: {plate_code}")
        
        return {
            "name": province_data.get("name"),
            "plate_code": province_data.get("plate_code"),
            "coordinates": {
                "latitude": province_data.get("latitude"),
                "longitude": province_data.get("longitude")
            },
            "elevation": province_data.get("elevation")
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
