import React, { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Feature, Geometry } from 'geojson';

import { useWeatherStore } from '../../store/useWeatherStore';
import { getTemperatureColor } from '../../utils/colors';
import type { Province } from '../../types';
import MapLegend from './MapLegend';

interface TurkeyMapProps {
  onProvinceSelect: (plateCode: string, name: string) => void;
  geoJsonData?: GeoJSON.GeoJsonObject | null;
  provinces?: Province[];
  currentTemps?: Record<
    string,
    {
      temperature: number;
      precipitation: number;
      humidity: number;
      wind_speed: number;
      apparent_temperature?: number;
      wind_direction_10m?: number;
      pressure_msl?: number;
      visibility?: number;
      cloud_cover?: number;
      weather_code?: number;
      resolved_time?: string;
      name?: string;
    }
  > | null;
}

type ProvinceProps = {
  plate_code?: string;
  name?: string;
  'name:tr'?: string;
  admin_level?: string | number;
  [key: string]: unknown;
};

const normalizeProvinceName = (value: string) => {
  return value
    .toLocaleLowerCase('tr')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .replace(/[^a-z0-9]/g, '');
};

export const TurkeyMap: React.FC<TurkeyMapProps> = ({ onProvinceSelect, geoJsonData, provinces = [], currentTemps }) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const selectedPlateCode = useWeatherStore((state) => state.selectedPlateCode);

  const codeByNormalizedName = useMemo(() => {
    const map: Record<string, string> = {};

    provinces.forEach((province) => {
      const normalized = normalizeProvinceName(province.name || '');
      if (normalized) {
        map[normalized] = String(province.plate_code).padStart(2, '0');
      }
    });

    // Defensive aliases for known naming variations
    if (!map.bilecik) map.bilecik = '11';
    if (!map.sanliurfa) map.sanliurfa = '63';
    if (!map.kirikkale) map.kirikkale = '71';
    if (!map.osmaniye) map.osmaniye = '80';
    if (!map.aksaray) map.aksaray = '68';

    return map;
  }, [provinces]);

  const provinceNameByCode = useMemo(() => {
    const map: Record<string, string> = {};
    provinces.forEach((province) => {
      const code = String(province.plate_code).padStart(2, '0');
      map[code] = province.name;
    });
    return map;
  }, [provinces]);

  const resolvePlateCode = useMemo(() => {
    return (props: ProvinceProps | undefined) => {
      if (!props) return null;

      const direct = String(props.plate_code || '').trim();
      if (/^\d{1,2}$/.test(direct)) {
        return direct.padStart(2, '0');
      }

      const names = [props['name:tr'], props.name]
        .map((item) => String(item || '').trim())
        .filter(Boolean);

      for (const name of names) {
        const normalized = normalizeProvinceName(name);
        if (normalized && codeByNormalizedName[normalized]) {
          return codeByNormalizedName[normalized];
        }
      }

      return null;
    };
  }, [codeByNormalizedName]);

  const resolveProvinceName = (props: ProvinceProps | undefined) => {
    const nameTr = String(props?.['name:tr'] || '').trim();
    const name = String(props?.name || '').trim();
    return nameTr || name || 'Bilinmiyor';
  };

  const getPolygonColor = useMemo(() => {
    return (plateCode: string | null): string => {
      if (!plateCode || !currentTemps) return '#CBD5E1';
      const temp = currentTemps[plateCode]?.temperature;
      return getTemperatureColor(temp);
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

  useEffect(() => {
    if (!mapRef.current || !geoJsonData) return;

    if (geoJsonLayerRef.current) {
      mapRef.current.removeLayer(geoJsonLayerRef.current);
    }
    if (markersLayerRef.current) {
      markersLayerRef.current.clearLayers();
    }

    const createdMarkerCodes = new Set<string>();

    const geoJsonLayer = L.geoJSON(geoJsonData, {
      filter: (feature) => {
        const geometryOk = feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon';
        if (!geometryOk) return false;

        const props = (feature.properties || {}) as ProvinceProps;
        const adminLevel = String(props.admin_level || '');
        return adminLevel === '4';
      },
      style: (feature?: Feature<Geometry, ProvinceProps>) => {
        const plateCode = resolvePlateCode(feature?.properties);
        const isSelected = Boolean(plateCode && selectedPlateCode === plateCode);

        return {
          fillColor: getPolygonColor(plateCode),
          weight: isSelected ? 3.5 : 2,
          opacity: 1,
          color: isSelected ? '#2563eb' : '#475569',
          fillOpacity: isSelected ? 0.88 : 0.72,
        };
      },
      onEachFeature: (feature: Feature<Geometry, ProvinceProps>, layer: L.Layer) => {
        const plateCode = resolvePlateCode(feature.properties);
        const resolvedName = resolveProvinceName(feature.properties);
        const provinceName = plateCode ? provinceNameByCode[plateCode] || resolvedName : resolvedName;

        const weatherData = plateCode ? currentTemps?.[plateCode] : undefined;
        const temp = weatherData?.temperature;
        const humidity = weatherData?.humidity;

        let tooltipContent = `<div style="font-weight:700;font-size:16px;color:#1e293b;margin-bottom:4px;">${provinceName}</div>`;
        if (temp !== undefined && !Number.isNaN(temp)) {
          tooltipContent += `<div style="font-size:18px;font-weight:700;color:#dc2626;margin-bottom:2px;">${temp.toFixed(1)}°C</div>`;
          if (humidity !== undefined) {
            tooltipContent += `<div style="font-size:14px;color:#64748b;">Nem: %${humidity.toFixed(0)}</div>`;
          }
        } else {
          tooltipContent += '<div style="font-size:12px;color:#94a3b8;font-style:italic;">Veri bekleniyor...</div>';
        }

        layer.bindTooltip(tooltipContent, {
          permanent: false,
          direction: 'center',
          className: 'province-tooltip',
        });

        layer.on('click', () => {
          if (plateCode) {
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
          if (!plateCode || selectedPlateCode !== plateCode) {
            (layer as L.Path).setStyle({
              weight: 2,
              color: '#475569',
              fillOpacity: 0.72,
            });
          }
        });

        if (!markersLayerRef.current || !plateCode || createdMarkerCodes.has(plateCode)) return;

        try {
          const bounds = (layer as L.Polygon).getBounds();
          if (!bounds.isValid()) return;

          const center = bounds.getCenter();
          const markerColor = getTemperatureColor(temp);

          const marker = L.circleMarker(center, {
            radius: 9,
            fillColor: markerColor,
            color: '#ffffff',
            weight: 2.5,
            opacity: 1,
            fillOpacity: 0.95,
          });

          const tempText = temp !== undefined && !Number.isNaN(temp) ? `${temp.toFixed(1)}°C` : '-°C';
          marker.bindTooltip(
            `<div style="font-size:15px;font-weight:700;">${provinceName}</div><div style="font-size:17px;font-weight:700;color:#dc2626;margin-top:4px;">${tempText}</div>`,
            { direction: 'top', offset: [0, -10] }
          );

          marker.on('click', () => {
            onProvinceSelect(plateCode, provinceName);
          });

          markersLayerRef.current.addLayer(marker);
          createdMarkerCodes.add(plateCode);
        } catch (error) {
          console.warn('Marker olusturma hatasi:', plateCode, error);
        }
      },
    }).addTo(mapRef.current);

    geoJsonLayerRef.current = geoJsonLayer;

    return () => {
      if (mapRef.current && geoJsonLayerRef.current) {
        mapRef.current.removeLayer(geoJsonLayerRef.current);
      }
    };
  }, [currentTemps, geoJsonData, getPolygonColor, onProvinceSelect, provinceNameByCode, resolvePlateCode, selectedPlateCode]);

  useEffect(() => {
    if (!mapRef.current || !geoJsonLayerRef.current || !selectedPlateCode) return;

    geoJsonLayerRef.current.eachLayer((layer) => {
      const feature = (layer as L.Layer & { feature?: Feature<Geometry, ProvinceProps> }).feature;
      if (!feature) return;

      const plateCode = resolvePlateCode(feature.properties);
      if (plateCode !== selectedPlateCode) return;

      try {
        const bounds = (layer as L.Polygon).getBounds();
        if (bounds.isValid()) {
          mapRef.current!.fitBounds(bounds, { padding: [50, 50], animate: true, duration: 0.5 });
        }
      } catch (error) {
        console.warn('Zoom hatasi:', error);
      }
    });
  }, [resolvePlateCode, selectedPlateCode]);

  return (
    <div className="relative w-full h-full" style={{ height: '500px' }}>
      <div ref={containerRef} className="w-full h-full bg-slate-100 dark:bg-slate-800 rounded-lg" />
      <MapLegend />
    </div>
  );
};

export default TurkeyMap;
