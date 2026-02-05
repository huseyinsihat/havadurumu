import React from 'react';
import { Cloud, Compass, Eye, Gauge } from 'lucide-react';
import type { WeatherResponse } from '../../types';
import { getWeatherIcon, getWeatherLabelTr } from '../../utils/colors';

interface WeatherSummaryProps {
  data: WeatherResponse;
  current?: {
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
    name?: string;
  };
}

const getWindDirectionLabel = (degree?: number | null) => {
  if (degree === undefined || degree === null || Number.isNaN(degree)) {
    return '-';
  }

  const normalized = ((degree % 360) + 360) % 360;
  const directions = ['K', 'KD', 'D', 'GD', 'G', 'GB', 'B', 'KB'];
  const index = Math.round(normalized / 45) % 8;
  return `${directions[index]} (${normalized.toFixed(0)}°)`;
};

export const WeatherSummary: React.FC<WeatherSummaryProps> = ({ data, current }) => {
  const hourly = data.data.hourly;
  const daily = data.data.daily;

  const latestHourlyIndex = hourly?.time?.length ? hourly.time.length - 1 : 0;

  const tempNow = current?.temperature ?? hourly?.temperature_2m?.[latestHourlyIndex] ?? daily?.temperature_2m_max?.[0];
  const rainNow = current?.precipitation ?? hourly?.precipitation?.[latestHourlyIndex] ?? daily?.precipitation_sum?.[0];
  const windNow = current?.wind_speed ?? hourly?.wind_speed_10m?.[latestHourlyIndex];
  const humidityNow = current?.humidity ?? hourly?.relative_humidity_2m?.[latestHourlyIndex];

  const weatherCodeNow = current?.weather_code ?? hourly?.weather_code?.[latestHourlyIndex];
  const apparentTempNow = current?.apparent_temperature ?? hourly?.apparent_temperature?.[latestHourlyIndex];
  const pressureNow = current?.pressure_msl ?? hourly?.pressure_msl?.[latestHourlyIndex];
  const visibilityNow = current?.visibility ?? hourly?.visibility?.[latestHourlyIndex];
  const cloudCoverNow = current?.cloud_cover ?? hourly?.cloud_cover?.[latestHourlyIndex];
  const windDirectionNow = current?.wind_direction_10m ?? hourly?.wind_direction_10m?.[latestHourlyIndex];

  const tempValue = tempNow !== undefined && tempNow !== null ? Number(tempNow) : null;
  const rainValue = rainNow !== undefined && rainNow !== null ? Number(rainNow) : null;
  const windValue = windNow !== undefined && windNow !== null ? Number(windNow) : null;
  const humidityValue = humidityNow !== undefined && humidityNow !== null ? Number(humidityNow) : null;
  const code = weatherCodeNow !== undefined && weatherCodeNow !== null ? Number(weatherCodeNow) : null;

  const tempExtremeIcon =
    tempValue !== null && !Number.isNaN(tempValue) ? (tempValue >= 35 ? '🔥' : tempValue <= -10 ? '🧊' : '') : '';
  const windExtremeIcon =
    windValue !== null && !Number.isNaN(windValue) ? (windValue >= 40 ? '💨' : windValue >= 30 ? '🌬️' : '') : '';
  const humidityExtremeIcon =
    humidityValue !== null && !Number.isNaN(humidityValue) && humidityValue >= 90 ? '💧' : '';
  const rainExtremeIcon =
    code !== null && !Number.isNaN(code)
      ? code >= 95 && code <= 99 && (rainValue ?? 0) >= 0.2
        ? '⛈️'
        : ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) && (rainValue ?? 0) >= 0.8
          ? '🌨️'
          : ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) && (rainValue ?? 0) >= 1.0
            ? '🌧️'
            : ''
      : '';

  const tempText = tempNow !== undefined && tempNow !== null ? `${tempNow.toFixed(1)}°C` : '-';
  const apparentText = apparentTempNow !== undefined && apparentTempNow !== null ? `${apparentTempNow.toFixed(1)}°C` : '-';

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-indigo-200 dark:border-indigo-700 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/30 dark:to-blue-900/20 p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs font-bold tracking-wide text-indigo-700 dark:text-indigo-200 uppercase">Durum</div>
          <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {getWeatherIcon(weatherCodeNow)} {getWeatherLabelTr(weatherCodeNow)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3.5 rounded-lg bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-200 dark:border-red-700">
          <div className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 inline-flex items-center gap-1">
            {tempExtremeIcon && <span>{tempExtremeIcon}</span>}Sıcaklık / Hissedilen
          </div>
          <div className="text-xl font-bold text-red-600 dark:text-red-400">
            {tempText}
            <span className="text-base font-semibold text-orange-600 dark:text-orange-300 ml-1">/ {apparentText}</span>
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-700">
          <div className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 inline-flex items-center gap-1">
            {humidityExtremeIcon && <span>{humidityExtremeIcon}</span>}Nem
          </div>
          <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
            {humidityNow !== undefined && humidityNow !== null ? humidityNow.toFixed(0) : '-'}%
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700">
          <div className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 inline-flex items-center gap-1">
            {windExtremeIcon && <span>{windExtremeIcon}</span>}Rüzgar
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="text-xl font-bold text-green-600 dark:text-green-400">
              {windNow !== undefined && windNow !== null ? windNow.toFixed(1) : '-'} km/h
            </div>
            <div className="text-xs text-emerald-700 dark:text-emerald-300 inline-flex items-center gap-1 whitespace-nowrap">
              <Compass className="w-3.5 h-3.5" />
              {getWindDirectionLabel(windDirectionNow)}
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-700">
          <div className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 inline-flex items-center gap-1">
            {rainExtremeIcon && <span>{rainExtremeIcon}</span>}Yağış
          </div>
          <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
            {rainNow !== undefined && rainNow !== null ? rainNow.toFixed(1) : '-'} mm
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
        <div className="rounded-lg border border-violet-200 dark:border-violet-700 px-3 py-2.5 bg-violet-50/70 dark:bg-violet-900/20 inline-flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1 text-violet-700 dark:text-violet-300 font-semibold">
            <Gauge className="w-4 h-4" />Basınç
          </span>
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {pressureNow !== undefined && pressureNow !== null ? `${pressureNow.toFixed(0)} hPa` : '-'}
          </span>
        </div>

        <div className="rounded-lg border border-cyan-200 dark:border-cyan-700 px-3 py-2.5 bg-cyan-50/80 dark:bg-cyan-900/20 inline-flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1 text-cyan-700 dark:text-cyan-300 font-semibold">
            <Eye className="w-4 h-4" />Görüş
          </span>
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {visibilityNow !== undefined && visibilityNow !== null ? `${(visibilityNow / 1000).toFixed(1)} km` : '-'}
          </span>
        </div>

        <div className="rounded-lg border border-sky-200 dark:border-sky-700 px-3 py-2.5 bg-sky-50/80 dark:bg-sky-900/20 inline-flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1 text-sky-700 dark:text-sky-300 font-semibold">
            <Cloud className="w-4 h-4" />Bulutluluk
          </span>
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {cloudCoverNow !== undefined && cloudCoverNow !== null ? `${cloudCoverNow.toFixed(0)}%` : '-'}
          </span>
        </div>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        {current
          ? 'Kart değeri: seçili tarih-saat snapshot verisi ile aynı kaynaktan gelir.'
          : 'Snapshot veri yoksa seçili tarih/saat saatlik serisi kullanılır.'}
      </p>
    </div>
  );
};

export default WeatherSummary;
