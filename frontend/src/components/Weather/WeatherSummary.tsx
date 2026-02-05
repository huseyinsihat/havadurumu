import React from 'react';
import type { WeatherResponse } from '../../types';

interface WeatherSummaryProps {
  data: WeatherResponse;
  current?: {
    temperature: number;
    precipitation: number;
    humidity: number;
    wind_speed: number;
    name?: string;
  };
}

export const WeatherSummary: React.FC<WeatherSummaryProps> = ({ data, current }) => {
  const hourly = data.data.hourly;
  const daily = data.data.daily;

  const latestHourlyIndex = hourly?.temperature_2m?.length ? hourly.temperature_2m.length - 1 : 0;

  const tempNow = current?.temperature ?? hourly?.temperature_2m?.[latestHourlyIndex] ?? daily?.temperature_2m_max?.[0];
  const rainNow = current?.precipitation ?? hourly?.precipitation?.[latestHourlyIndex] ?? daily?.precipitation_sum?.[0];
  const windNow = current?.wind_speed ?? hourly?.wind_speed_10m?.[latestHourlyIndex];
  const humidityNow = current?.humidity ?? hourly?.relative_humidity_2m?.[latestHourlyIndex];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-lg bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-200 dark:border-red-700">
          <div className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Sicaklik</div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">{tempNow !== undefined && tempNow !== null ? tempNow.toFixed(1) : '-'}°C</div>
        </div>
        <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-700">
          <div className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Nem</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{humidityNow !== undefined && humidityNow !== null ? humidityNow.toFixed(0) : '-'}%</div>
        </div>
        <div className="p-4 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700">
          <div className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Ruzgar</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{windNow !== undefined && windNow !== null ? windNow.toFixed(1) : '-'} km/h</div>
        </div>
        <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-700">
          <div className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Yagis</div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{rainNow !== undefined && rainNow !== null ? rainNow.toFixed(1) : '-'} mm</div>
        </div>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        {current ? 'Anlik kart degeri: siralama ile ayni veri kaynagi.' : 'Anlik veri yoksa secili tarih/saat serisi kullanilir.'}
      </p>
    </div>
  );
};

export default WeatherSummary;
