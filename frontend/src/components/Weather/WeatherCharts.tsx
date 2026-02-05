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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

interface WeatherChartsProps {
  data: WeatherResponse;
  hourlyMode: boolean;
  chartType?: 'temperature' | 'precipitation' | 'both';
  compact?: boolean;
}

export const WeatherCharts: React.FC<WeatherChartsProps> = ({
  data,
  hourlyMode,
  chartType = 'both',
  compact = false,
}) => {
  const rawLabels = hourlyMode ? data.data.hourly?.time ?? [] : data.data.daily?.time ?? [];

  const labels = hourlyMode
    ? (rawLabels as string[]).map((time) => {
        const hour = new Date(time).getHours();
        return `${hour.toString().padStart(2, '0')}:00`;
      })
    : rawLabels;

  const temps = hourlyMode ? data.data.hourly?.temperature_2m ?? [] : data.data.daily?.temperature_2m_max ?? [];
  const precipitation = hourlyMode ? data.data.hourly?.precipitation ?? [] : data.data.daily?.precipitation_sum ?? [];

  const tempChartData = {
    labels,
    datasets: [
      {
        label: hourlyMode ? 'Sıcaklık (°C)' : 'Sıcaklık Maksimum (°C)',
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
        label: hourlyMode ? 'Yağış (mm)' : 'Yağış Toplamı (mm)',
        data: precipitation,
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: '#3B82F6',
        borderWidth: 1,
      },
    ],
  };

  const commonOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: compact ? 3.0 : 2.0,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          font: { size: compact ? 12 : 12, weight: 600 },
          padding: compact ? 10 : 15,
        },
      },
      title: { display: false },
    },
    scales: {
      x: {
        ticks: {
          maxTicksLimit: hourlyMode ? 12 : 8,
          font: { size: compact ? 11 : 11 },
        },
        grid: { display: false },
      },
      y: {
        grid: { color: 'rgba(0, 0, 0, 0.1)' },
      },
    },
  };

  const lineOptions: ChartOptions<'line'> = commonOptions;
  const barOptions: ChartOptions<'bar'> = commonOptions as ChartOptions<'bar'>;

  const cardPaddingClass = compact ? 'p-4' : 'p-4';
  const titleClass = compact
    ? 'text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2'
    : 'text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3';

  return (
    <>
      {(chartType === 'temperature' || chartType === 'both') && (
        <div className={`bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 ${cardPaddingClass} shadow-sm`}>
          <h3 className={titleClass}>{hourlyMode ? '24 Saatlik Sıcaklık' : 'Günlük Sıcaklık'}</h3>
          <Line options={lineOptions} data={tempChartData} />
        </div>
      )}

      {(chartType === 'precipitation' || chartType === 'both') && (
        <div className={`bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 ${cardPaddingClass} shadow-sm`}>
          <h3 className={titleClass}>{hourlyMode ? '24 Saatlik Yağış' : 'Günlük Yağış'}</h3>
          <Bar options={barOptions} data={rainChartData} />
        </div>
      )}
    </>
  );
};

export default WeatherCharts;
