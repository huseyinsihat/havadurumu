import React, { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useWeatherStore } from '../../store/useWeatherStore';
import { getTemperatureColor, getTemperatureScaleColor } from '../../utils/colors';
import MapLegend from './MapLegend';
import type { Feature, Geometry } from 'geojson';

interface TurkeyMapProps {
  onProvinceSelect: (plateCode: string, name: string) => void;
  geoJsonData?: GeoJSON.GeoJsonObject | null;
  currentTemps?: Record<
    string,
    { temperature: number; precipitation: number; humidity: number; wind_speed: number; name?: string }
  > | null;
}

type ProvinceProps = {
  plate_code: string;
  name: string;
  region?: string;
  population?: number;
  area_km2?: number;
};

export const TurkeyMap: React.FC<TurkeyMapProps> = ({ onProvinceSelect, geoJsonData, currentTemps }) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const selectedPlateCode = useWeatherStore((state) => state.selectedPlateCode);

  const temperatureRange = useMemo(() => {
    const values = Object.values(currentTemps || {})
      .map((item) => item?.temperature)
      .filter((value): value is number => value !== undefined && value !== null && !Number.isNaN(value));

    if (values.length === 0) {
      return null;
    }

    return {
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }, [currentTemps]);

  useEffect(() => {
    if (!containerRef.current) return;

    mapRef.current = L.map(containerRef.current).setView([39, 35], 6);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(mapRef.current);

    markersLayerRef.current = L.layerGroup().addTo(mapRef.current);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const getPolygonColor = useMemo(() => {
    return (plateCode: string): string => {
      if (!currentTemps) return '#CBD5E1';
      const normalizedCode = String(plateCode).padStart(2, '0');
      const temp = currentTemps[normalizedCode]?.temperature;
      return getTemperatureColor(temp);
    };
  }, [currentTemps]);

  useEffect(() => {
    if (!mapRef.current || !geoJsonData) return;

    if (geoJsonLayerRef.current) {
      mapRef.current.removeLayer(geoJsonLayerRef.current);
    }
    if (markersLayerRef.current) {
      markersLayerRef.current.clearLayers();
    }

    const geoJsonLayer = L.geoJSON(geoJsonData, {
      filter: (feature) => feature.geometry.type !== 'Point',
      style: (feature?: Feature<Geometry, ProvinceProps>) => {
        const rawCode = feature?.properties?.plate_code;
        const plateCode = String(rawCode || '').padStart(2, '0');
        const isSelected = selectedPlateCode === plateCode;
        const fillColor = getPolygonColor(plateCode);

        return {
          fillColor,
          weight: isSelected ? 4 : 2,
          opacity: 1,
          color: isSelected ? '#2563eb' : '#475569',
          dashArray: '',
          fillOpacity: isSelected ? 0.9 : 0.75,
        };
      },
      onEachFeature: (feature: Feature<Geometry, ProvinceProps>, layer: L.Layer) => {
        const rawCode = feature.properties?.plate_code;
        const plateCode = String(rawCode || '').padStart(2, '0');
        const provinceName = feature.properties?.name || 'Bilinmiyor';

        const weatherData = currentTemps?.[plateCode];
        const temp = weatherData?.temperature;
        const humidity = weatherData?.humidity;

        let tooltipContent = `<div style="font-weight:700;font-size:16px;color:#1e293b;margin-bottom:4px;">${provinceName}</div>`;
        if (temp !== undefined && !Number.isNaN(temp)) {
          tooltipContent += `<div style="font-size:18px;font-weight:700;color:#dc2626;margin-bottom:2px;">${temp.toFixed(1)}°C</div>`;
          if (humidity !== undefined) {
            tooltipContent += `<div style="font-size:14px;color:#64748b;">Nem: %${humidity.toFixed(0)}</div>`;
          }
        } else {
          tooltipContent += '<div style="font-size:12px;color:#94a3b8;font-style:italic;">Veri yukleniyor...</div>';
        }

        layer.bindTooltip(tooltipContent, {
          permanent: false,
          direction: 'center',
          className: 'province-tooltip',
        });

        layer.on('click', () => {
          if (plateCode && plateCode !== '00') {
            onProvinceSelect(plateCode, provinceName);
          }
        });

        layer.on('mouseover', () => {
          (layer as L.Path).setStyle({
            weight: 4,
            color: '#2563eb',
            fillOpacity: 0.9,
          });
        });

        layer.on('mouseout', () => {
          if (selectedPlateCode !== plateCode) {
            (layer as L.Path).setStyle({
              weight: 2,
              color: '#475569',
              fillOpacity: 0.75,
            });
          }
        });
      },
    }).addTo(mapRef.current);

    geoJsonLayerRef.current = geoJsonLayer;

    if (markersLayerRef.current) {
      geoJsonLayer.eachLayer((layer) => {
        const feature = (layer as any).feature as Feature<Geometry, ProvinceProps>;
        if (!feature) return;

        const geomType = feature.geometry?.type;
        if (geomType !== 'Polygon' && geomType !== 'MultiPolygon') return;

        const rawCode = feature.properties?.plate_code;
        const plateCode = String(rawCode || '').padStart(2, '0');
        const provinceName = feature.properties?.name || 'Bilinmiyor';

        try {
          const bounds = (layer as L.Polygon).getBounds();
          if (!bounds.isValid()) return;

          const center = bounds.getCenter();
          const weatherData = currentTemps?.[plateCode];
          const temp = weatherData?.temperature;
          const color = getTemperatureScaleColor(temp, temperatureRange?.min, temperatureRange?.max);

          const marker = L.circleMarker(center, {
            radius: 10,
            fillColor: color,
            color: '#ffffff',
            weight: 2.5,
            opacity: 1,
            fillOpacity: 0.95,
          });

          const tempText = temp !== undefined && !Number.isNaN(temp) ? `${temp.toFixed(1)}°C` : '-°C';
          marker.bindTooltip(
            `<div style="font-size:16px;font-weight:700;">${provinceName}</div><div style="font-size:18px;font-weight:700;color:#dc2626;margin-top:4px;">${tempText}</div>`,
            {
              direction: 'top',
              offset: [0, -10],
            }
          );

          marker.on('click', () => {
            onProvinceSelect(plateCode, provinceName);
          });

          markersLayerRef.current!.addLayer(marker);
        } catch (error) {
          console.warn('Marker olusturma hatasi:', plateCode, error);
        }
      });
    }

    return () => {
      if (mapRef.current && geoJsonLayerRef.current) {
        mapRef.current.removeLayer(geoJsonLayerRef.current);
      }
    };
  }, [geoJsonData, currentTemps, selectedPlateCode, onProvinceSelect, getPolygonColor, temperatureRange]);

  useEffect(() => {
    if (!mapRef.current || !geoJsonLayerRef.current || !selectedPlateCode) return;

    geoJsonLayerRef.current.eachLayer((layer) => {
      const feature = (layer as any).feature as Feature<Geometry, ProvinceProps>;
      if (!feature) return;

      const rawCode = feature.properties?.plate_code;
      const plateCode = String(rawCode || '').padStart(2, '0');

      if (plateCode === selectedPlateCode) {
        try {
          const bounds = (layer as L.Polygon).getBounds();
          if (bounds.isValid()) {
            mapRef.current!.fitBounds(bounds, { padding: [50, 50], animate: true, duration: 0.5 });
          }
        } catch (error) {
          console.warn('Zoom hatasi:', error);
        }
      }
    });
  }, [selectedPlateCode]);

  return (
    <div className="relative w-full h-full" style={{ height: '500px' }}>
      <div ref={containerRef} className="w-full h-full bg-slate-100 dark:bg-slate-800 rounded-lg" />
      <MapLegend />
    </div>
  );
};

export default TurkeyMap;
