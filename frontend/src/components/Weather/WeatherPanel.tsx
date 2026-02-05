import React from 'react';
import type { WeatherResponse } from '../../types';
import WeatherSummary from './WeatherSummary';
import WeatherCharts from './WeatherCharts';

interface WeatherPanelProps {
  weatherData: WeatherResponse | null;
  hourlyMode: boolean;
  isLoading: boolean;
}

export const WeatherPanel: React.FC<WeatherPanelProps> = ({
  weatherData,
  hourlyMode,
  isLoading,
}) => {
  return (
    <div className="space-y-6">
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-8 space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-3 border-blue-200 border-t-blue-600"></div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Veri yükleniyor...</p>
        </div>
      )}

      {weatherData && !isLoading && (
        <>
          <div>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">⚡ Şu Anki Koşullar</h3>
            <WeatherSummary data={weatherData} />
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">📈 Saatlik Analiz</h3>
            <WeatherCharts data={weatherData} hourlyMode={hourlyMode} />
          </div>
        </>
      )}

      {!weatherData && !isLoading && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-slate-400 dark:text-slate-500 text-sm">Veri bulunamadı</p>
        </div>
      )}
    </div>
  );
};

export default WeatherPanel;
