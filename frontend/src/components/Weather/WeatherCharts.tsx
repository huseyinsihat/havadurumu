import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  type ChartOptions,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import type { WeatherResponse } from '../../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface WeatherChartsProps {
  data: WeatherResponse;
  hourlyMode: boolean;
  chartType?: 'temperature' | 'precipitation' | 'both';
}

export const WeatherCharts: React.FC<WeatherChartsProps> = ({ data, hourlyMode, chartType = 'both' }) => {
  const rawLabels = hourlyMode
    ? data.data.hourly?.time ?? []
    : data.data.daily?.time ?? [];

  // Format labels for hourly data (extract hour from timestamp)
  const labels = hourlyMode
    ? (rawLabels as string[]).map((time: string) => {
        // time: "2026-02-05T00:00", "2026-02-05T01:00", etc
        const hour = new Date(time).getHours();
        return `${hour.toString().padStart(2, '0')}:00`;
      })
    : rawLabels;

  const temps = hourlyMode
    ? data.data.hourly?.temperature_2m ?? []
    : data.data.daily?.temperature_2m_max ?? [];

  const precipitation = hourlyMode
    ? data.data.hourly?.precipitation ?? []
    : data.data.daily?.precipitation_sum ?? [];

  const tempChartData = {
    labels,
    datasets: [
      {
        label: hourlyMode ? 'Sıcaklık (°C) - Saatlik' : 'Sıcaklık Maksimum (°C)',
        data: temps,
        borderColor: '#EF4444',
        backgroundColor: hourlyMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.2)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointRadius: hourlyMode ? 3 : 4,
        pointHoverRadius: 5,
      },
    ],
  };

  const rainChartData = {
    labels,
    datasets: [
      {
        label: hourlyMode ? 'Yağış (mm) - Saatlik' : 'Yağış Toplamı (mm)',
        data: precipitation,
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: '#3B82F6',
        borderWidth: 1,
      },
    ],
  };

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { 
        display: true, 
        position: 'top' as const,
        labels: {
          font: { size: 12, weight: 600 as const },
          padding: 15,
        }
      },
      title: { display: false },
    },
    scales: {
      x: { 
        ticks: { 
          maxTicksLimit: hourlyMode ? 12 : 8,
          font: { size: 11 }
        },
        grid: { display: false }
      },
      y: {
        grid: { color: 'rgba(0, 0, 0, 0.1)' },
      }
    },
  };

  const lineOptions: ChartOptions<'line'> = commonOptions;
  const barOptions: ChartOptions<'bar'> = commonOptions;

  return (
    <>
      {(chartType === 'temperature' || chartType === 'both') && (
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
            {hourlyMode ? '📊 24 Saatlik Sıcaklık' : '📊 Günlük Sıcaklık'}
          </h3>
          <Line options={lineOptions} data={tempChartData} />
        </div>
      )}

      {(chartType === 'precipitation' || chartType === 'both') && (
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
            {hourlyMode ? '🌧️ 24 Saatlik Yağış' : '🌧️ Günlük Yağış'}
          </h3>
          <Bar options={barOptions} data={rainChartData} />
        </div>
      )}
    </>
  );
};

export default WeatherCharts;
