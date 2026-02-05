import React, { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Feature, Geometry } from 'geojson';

import { useWeatherStore } from '../../store/useWeatherStore';
import { getTemperatureColor, getWeatherLabelTr } from '../../utils/colors';
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

type WeatherSnapshot = {
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
};

type CriticalEvent = {
  icon: string;
  label: string;
  type: 'storm' | 'snow' | 'rain' | 'wind' | 'heat' | 'cold' | 'humid';
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
  const eventsLayerRef = useRef<L.LayerGroup | null>(null);

  const selectedPlateCode = useWeatherStore((state) => state.selectedPlateCode);

  const codeByNormalizedName = useMemo(() => {
    const map: Record<string, string> = {};

    provinces.forEach((province) => {
      const normalized = normalizeProvinceName(province.name || '');
      if (normalized) {
        map[normalized] = String(province.plate_code).padStart(2, '0');
      }
    });

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

  const nationalAverages = useMemo(() => {
    const values = Object.values(currentTemps || {});
    const temperatures = values.map((item) => Number(item.temperature)).filter((value) => !Number.isNaN(value));
    const precipitations = values.map((item) => Number(item.precipitation)).filter((value) => !Number.isNaN(value));
    const windSpeeds = values.map((item) => Number(item.wind_speed)).filter((value) => !Number.isNaN(value));
    const humidities = values.map((item) => Number(item.humidity)).filter((value) => !Number.isNaN(value));

    const avg = (list: number[]) => (list.length ? list.reduce((sum, value) => sum + value, 0) / list.length : null);

    return {
      temperature: avg(temperatures),
      precipitation: avg(precipitations),
      windSpeed: avg(windSpeeds),
      humidity: avg(humidities),
    };
  }, [currentTemps]);

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

  const getCriticalEvents = useMemo(() => {
    return (weatherData?: WeatherSnapshot): CriticalEvent[] => {
      if (!weatherData) return [];

      const code = Number(weatherData.weather_code);
      const precipitation = Number(weatherData.precipitation) || 0;
      const windSpeed = Number(weatherData.wind_speed) || 0;
      const humidity = Number(weatherData.humidity) || 0;
      const temperature = Number(weatherData.temperature);

      const events: CriticalEvent[] = [];

      const isThunderstorm = code >= 95 && code <= 99;
      const isSnow = (code >= 71 && code <= 77) || (code >= 85 && code <= 86);
      const isRain = (code >= 51 && code <= 67) || (code >= 80 && code <= 82);

      if (isThunderstorm) {
        events.push({ icon: '⛈️', label: 'Fırtına', type: 'storm' });
      }
      if (isSnow && precipitation >= 0.8) {
        events.push({ icon: '🌨️', label: 'Karlı', type: 'snow' });
      }
      if (isRain && precipitation >= 1.0) {
        events.push({ icon: precipitation >= 3 ? '🌧️' : '🌦️', label: 'Yağışlı', type: 'rain' });
      }
      if (windSpeed >= 40) {
        events.push({ icon: '💨', label: 'Çok rüzgarlı', type: 'wind' });
      }
      if (!Number.isNaN(temperature) && temperature >= 35) {
        events.push({ icon: '🔥', label: 'Aşırı sıcak', type: 'heat' });
      }
      if (!Number.isNaN(temperature) && temperature <= -10) {
        events.push({ icon: '🧊', label: 'Aşırı soğuk', type: 'cold' });
      }
      if (humidity >= 90) {
        events.push({ icon: '💧', label: 'Çok nemli', type: 'humid' });
      }

      return events;
    };
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    mapRef.current = L.map(containerRef.current).setView([39, 35], 6);

    const eventsPane = mapRef.current.createPane('provinceEventsPane');
    eventsPane.style.zIndex = '680';
    const tooltipsPane = mapRef.current.createPane('provinceTooltipsPane');
    tooltipsPane.style.zIndex = '700';

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(mapRef.current);

    eventsLayerRef.current = L.layerGroup().addTo(mapRef.current);

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
    if (eventsLayerRef.current) {
      eventsLayerRef.current.clearLayers();
    }

    const createdEventCodes = new Set<string>();

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
        const precipitation = Number(weatherData?.precipitation) || 0;
        const windSpeed = Number(weatherData?.wind_speed) || 0;
        const weatherLabel = getWeatherLabelTr(weatherData?.weather_code);

        const tempText = temp !== undefined && !Number.isNaN(temp) ? `${temp.toFixed(1)}°C` : '-°C';
        const humidityText = humidity !== undefined && !Number.isNaN(humidity) ? `%${humidity.toFixed(0)}` : '-';
        const tempAvgText = nationalAverages.temperature !== null ? `${nationalAverages.temperature.toFixed(1)}°C` : '-';
        const humidityAvgText = nationalAverages.humidity !== null ? `%${nationalAverages.humidity.toFixed(0)}` : '-';
        const windAvgText = nationalAverages.windSpeed !== null ? `${nationalAverages.windSpeed.toFixed(1)} km/h` : '-';
        const rainAvgText =
          nationalAverages.precipitation !== null ? `${nationalAverages.precipitation.toFixed(1)} mm` : '-';

        const criticalEvents = getCriticalEvents(weatherData);
        const criticalText = criticalEvents.length
          ? criticalEvents.map((event) => `${event.icon} ${event.label}`).join(' • ')
          : 'Kritik eşik yok';

        let tooltipContent = `<div style="font-weight:700;font-size:16px;color:#1e293b;margin-bottom:4px;">${provinceName}</div>`;
        if (temp !== undefined && !Number.isNaN(temp)) {
          tooltipContent += `<div style="font-size:16px;font-weight:700;color:#0f172a;margin-bottom:3px;">Durum: ${weatherLabel}</div>`;
          tooltipContent += `<div style="font-size:14px;color:#334155;"><b>Sıcaklık:</b> ${tempText} <span style="color:#64748b;">(TR ort: ${tempAvgText})</span></div>`;
          tooltipContent += `<div style="font-size:14px;color:#334155;"><b>Nem:</b> ${humidityText} <span style="color:#64748b;">(TR ort: ${humidityAvgText})</span></div>`;
          tooltipContent += `<div style="font-size:14px;color:#334155;"><b>Rüzgar:</b> ${windSpeed.toFixed(1)} km/h <span style="color:#64748b;">(TR ort: ${windAvgText})</span></div>`;
          tooltipContent += `<div style="font-size:14px;color:#334155;"><b>Yağış:</b> ${precipitation.toFixed(1)} mm <span style="color:#64748b;">(TR ort: ${rainAvgText})</span></div>`;
          tooltipContent += `<div style="font-size:13px;color:#0f172a;margin-top:4px;"><b>Kritik:</b> ${criticalText}</div>`;
        } else {
          tooltipContent += '<div style="font-size:12px;color:#94a3b8;font-style:italic;">Veri bekleniyor...</div>';
        }

        layer.bindTooltip(tooltipContent, {
          permanent: false,
          direction: 'top',
          sticky: true,
          pane: 'provinceTooltipsPane',
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

        if (!plateCode || !eventsLayerRef.current || createdEventCodes.has(plateCode) || criticalEvents.length === 0) return;

        try {
          const bounds = (layer as L.Polygon).getBounds();
          if (!bounds.isValid()) return;

          const center = bounds.getCenter();
          const iconOffsets: Array<[number, number]> = [
            [0, 0],
            [18, 0],
            [-18, 0],
            [0, -18],
            [0, 18],
            [14, -14],
            [-14, -14],
          ];

          const makeEventTooltip = (event: CriticalEvent) => {
            const tempValue = temp !== undefined && !Number.isNaN(temp) ? `${temp.toFixed(1)}°C` : '-';
            const tempAvg = nationalAverages.temperature !== null ? `${nationalAverages.temperature.toFixed(1)}°C` : '-';
            const humidityValue = humidity !== undefined && !Number.isNaN(humidity) ? `%${humidity.toFixed(0)}` : '-';
            const humidityAvg = nationalAverages.humidity !== null ? `%${nationalAverages.humidity.toFixed(0)}` : '-';
            const rainValue = `${precipitation.toFixed(1)} mm`;
            const rainAvg = nationalAverages.precipitation !== null ? `${nationalAverages.precipitation.toFixed(1)} mm` : '-';
            const windValue = `${windSpeed.toFixed(1)} km/h`;
            const windAvg = nationalAverages.windSpeed !== null ? `${nationalAverages.windSpeed.toFixed(1)} km/h` : '-';

            if (event.type === 'wind') {
              return `
                <div style="font-size:15px;font-weight:700;">${provinceName}</div>
                <div style="font-size:16px;font-weight:700;color:#0f172a;margin-top:3px;">${event.icon} ${event.label}</div>
                <div style="font-size:14px;color:#334155;"><b>Rüzgar:</b> ${windValue}</div>
                <div style="font-size:13px;color:#64748b;">Türkiye ort: ${windAvg}</div>
              `;
            }

            if (event.type === 'rain' || event.type === 'snow') {
              return `
                <div style="font-size:15px;font-weight:700;">${provinceName}</div>
                <div style="font-size:16px;font-weight:700;color:#0f172a;margin-top:3px;">${event.icon} ${event.label}</div>
                <div style="font-size:14px;color:#334155;"><b>Yağış:</b> ${rainValue}</div>
                <div style="font-size:13px;color:#64748b;">Türkiye ort: ${rainAvg}</div>
              `;
            }

            if (event.type === 'heat' || event.type === 'cold') {
              return `
                <div style="font-size:15px;font-weight:700;">${provinceName}</div>
                <div style="font-size:16px;font-weight:700;color:#0f172a;margin-top:3px;">${event.icon} ${event.label}</div>
                <div style="font-size:14px;color:#334155;"><b>Sıcaklık:</b> ${tempValue}</div>
                <div style="font-size:13px;color:#64748b;">Türkiye ort: ${tempAvg}</div>
              `;
            }

            if (event.type === 'humid') {
              return `
                <div style="font-size:15px;font-weight:700;">${provinceName}</div>
                <div style="font-size:16px;font-weight:700;color:#0f172a;margin-top:3px;">${event.icon} ${event.label}</div>
                <div style="font-size:14px;color:#334155;"><b>Nem:</b> ${humidityValue}</div>
                <div style="font-size:13px;color:#64748b;">Türkiye ort: ${humidityAvg}</div>
              `;
            }

            return `
              <div style="font-size:15px;font-weight:700;">${provinceName}</div>
              <div style="font-size:16px;font-weight:700;color:#0f172a;margin-top:3px;">${event.icon} ${event.label}</div>
              <div style="font-size:14px;color:#334155;"><b>Yağış:</b> ${rainValue} • <b>Rüzgar:</b> ${windValue}</div>
              <div style="font-size:13px;color:#64748b;">TR ort Yağış: ${rainAvg} • TR ort Rüzgar: ${windAvg}</div>
            `;
          };

          criticalEvents.forEach((event, index) => {
            const [dx, dy] = iconOffsets[index % iconOffsets.length];
            const eventMarker = L.marker(center, {
              pane: 'provinceEventsPane',
              interactive: true,
              icon: L.divIcon({
                className: 'weather-event-icon-wrapper',
                html: `<span class="weather-event-icon" title="${event.label}"><span class="weather-event-emoji">${event.icon}</span></span>`,
                iconSize: [30, 30],
                iconAnchor: [15 - dx, 36 - dy],
              }),
            });

            eventMarker.bindTooltip(makeEventTooltip(event), {
              direction: 'top',
              offset: [0, -12],
              pane: 'provinceTooltipsPane',
              className: 'province-tooltip',
              sticky: true,
            });

            eventMarker.on('mouseover', () => {
              eventMarker.openTooltip();
            });

            eventMarker.on('mouseout', () => {
              eventMarker.closeTooltip();
            });

            eventMarker.on('click', () => {
              onProvinceSelect(plateCode, provinceName);
            });

            eventsLayerRef.current?.addLayer(eventMarker);
          });

          createdEventCodes.add(plateCode);
        } catch (error) {
          console.warn('Event marker olusturma hatasi:', plateCode, error);
        }
      },
    }).addTo(mapRef.current);

    geoJsonLayerRef.current = geoJsonLayer;

    return () => {
      if (mapRef.current && geoJsonLayerRef.current) {
        mapRef.current.removeLayer(geoJsonLayerRef.current);
      }
    };
  }, [
    currentTemps,
    geoJsonData,
    getCriticalEvents,
    getPolygonColor,
    nationalAverages.humidity,
    nationalAverages.precipitation,
    nationalAverages.temperature,
    nationalAverages.windSpeed,
    onProvinceSelect,
    provinceNameByCode,
    resolvePlateCode,
    selectedPlateCode,
  ]);

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
