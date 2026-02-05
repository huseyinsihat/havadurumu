import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  type ChartOptions,
  type TooltipItem,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { WeatherResponse } from '../../types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface WeatherChartsProps {
  data: WeatherResponse;
  hourlyMode: boolean;
  chartType?: 'temp' | 'rain' | 'windHumidity' | 'pressure' | 'temperature' | 'precipitation' | 'both';
  compact?: boolean;
  contextLabel?: string;
  nationalAverages?: {
    temperature?: number | null;
    precipitation?: number | null;
    windSpeed?: number | null;
    humidity?: number | null;
    pressure?: number | null;
    visibility?: number | null;
    cloudCover?: number | null;
  };
}

type NullableNumber = number | null;

type HourlyField =
  | 'temperature_2m'
  | 'apparent_temperature'
  | 'precipitation'
  | 'wind_speed_10m'
  | 'relative_humidity_2m'
  | 'pressure_msl'
  | 'visibility'
  | 'cloud_cover';

const HOURS = Array.from({ length: 25 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);

const parseHour = (value: string): number | null => {
  const match = value.match(/T(\d{2}):/);
  if (match) {
    const hour = Number(match[1]);
    if (!Number.isNaN(hour) && hour >= 0 && hour <= 23) return hour;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  const hour = parsed.getHours();
  if (Number.isNaN(hour) || hour < 0 || hour > 23) return null;
  return hour;
};

const countSeriesPoints = (series: NullableNumber[]) =>
  series.reduce<number>((count, item) => (item !== null && !Number.isNaN(item) ? count + 1 : count), 0);
const hasEnoughSeriesData = (series: NullableNumber[], minPoints = 8) => countSeriesPoints(series) >= minPoints;
const AVG_LABEL_PREFIX = '__avg__:';
const isAverageLabel = (label?: string) => String(label || '').startsWith(AVG_LABEL_PREFIX);
const stripAveragePrefix = (label?: string) => String(label || '').replace(AVG_LABEL_PREFIX, '');

const fmt1 = (value: NullableNumber, unit = '') => {
  if (value === null || Number.isNaN(value)) return '-';
  return `${value.toFixed(1)}${unit}`;
};

const toConstSeries = (value?: number | null): NullableNumber[] => {
  if (value === undefined || value === null || Number.isNaN(value)) return HOURS.map(() => null as NullableNumber);
  return HOURS.map(() => Number(value));
};

const WeatherCharts: React.FC<WeatherChartsProps> = ({
  data,
  hourlyMode,
  chartType = 'temp',
  compact = false,
  contextLabel,
  nationalAverages,
}) => {
  const normalizedType =
    chartType === 'temperature' ? 'temp' : chartType === 'precipitation' ? 'rain' : chartType === 'both' ? 'temp' : chartType;

  const hourly = data.data.hourly;

  const series = useMemo(() => {
    const empty = HOURS.map(() => null as NullableNumber);
    if (!hourlyMode || !hourly || !hourly.time?.length) {
      return {
        labels: HOURS,
        temperature: empty,
        apparent: empty,
        precipitation: empty,
        wind: empty,
        humidity: empty,
        pressure: empty,
        visibilityKm: empty,
        cloud: empty,
      };
    }

    const buildField = (field: HourlyField, transform?: (v: number) => number): NullableNumber[] => {
      const values = (hourly[field] as number[] | undefined) ?? [];
      const out = HOURS.map(() => null as NullableNumber);

      hourly.time.forEach((timeValue, idx) => {
        const hour = parseHour(timeValue);
        if (hour === null) return;
        const raw = values[idx];
        if (raw === undefined || raw === null) return;
        const numeric = Number(raw);
        if (Number.isNaN(numeric)) return;
        out[hour] = transform ? transform(numeric) : numeric;
      });

      // 24:00 noktasi 23:00 degerinin devami olarak gosterilir
      out[24] = out[23];
      return out;
    };

    return {
      labels: HOURS,
      temperature: buildField('temperature_2m'),
      apparent: buildField('apparent_temperature'),
      precipitation: buildField('precipitation'),
      wind: buildField('wind_speed_10m'),
      humidity: buildField('relative_humidity_2m'),
      pressure: buildField('pressure_msl'),
      visibilityKm: buildField('visibility', (v) => v / 1000),
      cloud: buildField('cloud_cover'),
    };
  }, [hourly, hourlyMode]);

  const latest = useMemo(() => {
    const last = (arr: NullableNumber[]) => {
      for (let i = arr.length - 1; i >= 0; i -= 1) {
        if (arr[i] !== null) return arr[i];
      }
      return null;
    };

    return {
      temp: last(series.temperature),
      apparent: last(series.apparent),
      rain: last(series.precipitation),
      wind: last(series.wind),
      humidity: last(series.humidity),
      pressure: last(series.pressure),
      visibilityKm: last(series.visibilityKm),
      cloud: last(series.cloud),
    };
  }, [series]);

  const cardPaddingClass = compact ? 'p-4' : 'p-5';
  const titleClass = compact
    ? 'text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2'
    : 'text-base font-semibold text-slate-700 dark:text-slate-300 mb-3';

  const baseOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: compact ? 2.8 : 2.1,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          filter(legendItem) {
            return !isAverageLabel(legendItem.text);
          },
          font: { size: 12, weight: 600 },
          padding: 10,
          boxWidth: 18,
        },
      },
      title: { display: false },
    },
    elements: {
      line: {
        tension: 0.32,
        borderWidth: 2.1,
      },
      point: {
        radius: 2.4,
        hoverRadius: 4.8,
      },
    },
    scales: {
      x: {
        ticks: {
          autoSkip: false,
          maxRotation: 55,
          minRotation: 55,
          callback(_v, i) {
            return i % 2 === 0 ? HOURS[i] : '';
          },
          font: { size: 10 },
        },
        grid: { color: 'rgba(100, 116, 139, 0.12)' },
      },
    },
    spanGaps: false,
  };

  const noDataCard = (title: string, hint: string) => (
    <div className={`bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 ${cardPaddingClass} shadow-sm`}>
      <div className="mb-2">
        <h3 className={titleClass}>{title}</h3>
        {contextLabel && <p className="text-xs text-slate-500 dark:text-slate-400 -mt-1">{contextLabel}</p>}
      </div>
      <div className="h-[260px] rounded-lg border border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center text-sm text-slate-500 dark:text-slate-400">
        {hint}
      </div>
    </div>
  );

  if (normalizedType === 'temp') {
    const hasTemp = hasEnoughSeriesData(series.temperature) || hasEnoughSeriesData(series.apparent);
    if (!hasTemp) return noDataCard('🌡️ 24 Saatlik Sıcaklık Geçişi (00:00 - 24:00)', 'Seçili gün için saatlik sıcaklık serisi yetersiz');

    const chartData = {
      labels: series.labels,
      datasets: [
        {
          label: `🌡️ Sıcaklık (${fmt1(latest.temp, '°C')})`,
          data: series.temperature,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239,68,68,0.08)',
          yAxisID: 'y',
        },
        {
          label: `🫧 Hissedilen (${fmt1(latest.apparent, '°C')})`,
          data: series.apparent,
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245,158,11,0.08)',
          borderDash: [6, 4],
          yAxisID: 'y',
        },
        {
          label: `${AVG_LABEL_PREFIX}Türkiye Ortalama Sıcaklık`,
          data: toConstSeries(nationalAverages?.temperature ?? null),
          borderColor: '#ef4444',
          borderDash: [4, 4],
          pointRadius: 0,
          yAxisID: 'y',
        },
      ],
    };

    const options: ChartOptions<'line'> = {
      ...baseOptions,
      plugins: {
        ...baseOptions.plugins,
        tooltip: {
          callbacks: {
            label(ctx: TooltipItem<'line'>) {
              const v = ctx.parsed.y;
              const label = stripAveragePrefix(ctx.dataset.label);
              if (v === null || Number.isNaN(v)) return `${label}: -`;
              return `${label}: ${Number(v).toFixed(1)}°C`;
            },
          },
        },
      },
      scales: {
        ...baseOptions.scales,
        y: {
          grid: { color: 'rgba(239,68,68,0.12)' },
          ticks: {
            callback(value) {
              return `${Number(value).toFixed(1)}°`;
            },
          },
        },
      },
    };

    return (
      <div className={`bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 ${cardPaddingClass} shadow-sm`}>
        <div className="mb-2">
          <h3 className={titleClass}>🌡️ 24 Saatlik Sıcaklık Geçişi (00:00 - 24:00)</h3>
          {contextLabel && <p className="text-xs text-slate-500 dark:text-slate-400 -mt-1">{contextLabel}</p>}
        </div>
        <Line data={chartData} options={options} />
      </div>
    );
  }

  if (normalizedType === 'rain') {
    const hasRain = hasEnoughSeriesData(series.precipitation);
    if (!hasRain) return noDataCard('🌧️ 24 Saatlik Yağış Geçişi (00:00 - 24:00)', 'Seçili gün için saatlik yağış serisi yetersiz');

    const chartData = {
      labels: series.labels,
      datasets: [
        {
          label: `🌧️ Yağış (${fmt1(latest.rain, ' mm')})`,
          data: series.precipitation,
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37,99,235,0.18)',
          borderWidth: 2,
        },
        {
          label: `${AVG_LABEL_PREFIX}Türkiye Ortalama Yağış`,
          data: toConstSeries(nationalAverages?.precipitation ?? null),
          borderColor: '#2563eb',
          borderDash: [4, 4],
          pointRadius: 0,
        },
      ],
    };

    const options: ChartOptions<'line'> = {
      ...baseOptions,
      scales: {
        ...baseOptions.scales,
        y: {
          grid: { color: 'rgba(37,99,235,0.12)' },
          ticks: {
            callback(value) {
              return `${Number(value).toFixed(1)} mm`;
            },
          },
        },
      },
      plugins: {
        ...baseOptions.plugins,
        tooltip: {
          callbacks: {
            label(ctx) {
              const v = ctx.parsed.y;
              const label = stripAveragePrefix(ctx.dataset.label);
              if (v === null || Number.isNaN(v)) return `${label}: -`;
              return `${label}: ${Number(v).toFixed(1)} mm`;
            },
          },
        },
      },
    };

    return (
      <div className={`bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 ${cardPaddingClass} shadow-sm`}>
        <div className="mb-2">
          <h3 className={titleClass}>🌧️ 24 Saatlik Yağış Geçişi (00:00 - 24:00)</h3>
          {contextLabel && <p className="text-xs text-slate-500 dark:text-slate-400 -mt-1">{contextLabel}</p>}
        </div>
        <Line data={chartData} options={options} />
      </div>
    );
  }

  if (normalizedType === 'windHumidity') {
    const hasWH = hasEnoughSeriesData(series.wind) || hasEnoughSeriesData(series.humidity);
    if (!hasWH) return noDataCard('💨 24 Saatlik Rüzgar ve Nem (00:00 - 24:00)', 'Seçili gün için saatlik rüzgar/nem serisi yetersiz');

    const chartData = {
      labels: series.labels,
      datasets: [
        {
          label: `💨 Rüzgar (${fmt1(latest.wind, ' km/h')})`,
          data: series.wind,
          borderColor: '#0ea5e9',
          backgroundColor: 'rgba(14,165,233,0.08)',
          yAxisID: 'yWind',
        },
        {
          label: `💧 Nem (${fmt1(latest.humidity, '%')})`,
          data: series.humidity,
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34,197,94,0.08)',
          yAxisID: 'yHumidity',
        },
        {
          label: `${AVG_LABEL_PREFIX}Türkiye Ortalama Rüzgar`,
          data: toConstSeries(nationalAverages?.windSpeed ?? null),
          borderColor: '#0ea5e9',
          borderDash: [4, 4],
          pointRadius: 0,
          yAxisID: 'yWind',
        },
        {
          label: `${AVG_LABEL_PREFIX}Türkiye Ortalama Nem`,
          data: toConstSeries(nationalAverages?.humidity ?? null),
          borderColor: '#22c55e',
          borderDash: [4, 4],
          pointRadius: 0,
          yAxisID: 'yHumidity',
        },
      ],
    };

    const options: ChartOptions<'line'> = {
      ...baseOptions,
      plugins: {
        ...baseOptions.plugins,
        tooltip: {
          callbacks: {
            label(ctx) {
              const v = ctx.parsed.y;
              const label = stripAveragePrefix(ctx.dataset.label);
              if (v === null || Number.isNaN(v)) return `${label}: -`;
              if (ctx.dataset.yAxisID === 'yHumidity') return `${label}: ${Number(v).toFixed(1)}%`;
              return `${label}: ${Number(v).toFixed(1)} km/h`;
            },
          },
        },
      },
      scales: {
        ...baseOptions.scales,
        yWind: {
          type: 'linear',
          position: 'left',
          grid: { color: 'rgba(14,165,233,0.12)' },
          ticks: {
            callback(value) {
              return `${Number(value).toFixed(1)}`;
            },
          },
        },
        yHumidity: {
          type: 'linear',
          position: 'right',
          grid: { drawOnChartArea: false },
          min: 0,
          max: 100,
          ticks: {
            callback(value) {
              return `${Number(value).toFixed(1)}%`;
            },
          },
        },
      },
    };

    return (
      <div className={`bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 ${cardPaddingClass} shadow-sm`}>
        <div className="mb-2">
          <h3 className={titleClass}>💨 24 Saatlik Rüzgar ve Nem (00:00 - 24:00)</h3>
          {contextLabel && <p className="text-xs text-slate-500 dark:text-slate-400 -mt-1">{contextLabel}</p>}
        </div>
        <Line data={chartData} options={options} />
      </div>
    );
  }

  if (normalizedType === 'pressure') {
    const hasVisibilityCloud = hasEnoughSeriesData(series.visibilityKm) || hasEnoughSeriesData(series.cloud);
    if (!hasVisibilityCloud) return noDataCard('👁️ 24 Saatlik Görüş ve Bulutluluk (00:00 - 24:00)', 'Seçili gün için saatlik görüş/bulutluluk serisi yetersiz');

    const chartData = {
      labels: series.labels,
      datasets: [
        {
          label: `👁️ Görüş (${fmt1(latest.visibilityKm, ' km')})`,
          data: series.visibilityKm,
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139,92,246,0.08)',
          yAxisID: 'yVisibility',
        },
        {
          label: `☁️ Bulutluluk (${fmt1(latest.cloud, '%')})`,
          data: series.cloud,
          borderColor: '#64748b',
          backgroundColor: 'rgba(100,116,139,0.08)',
          yAxisID: 'yCloud',
        },
        {
          label: `${AVG_LABEL_PREFIX}Türkiye Ortalama Görüş`,
          data: toConstSeries(
            nationalAverages?.visibility !== undefined && nationalAverages?.visibility !== null
              ? nationalAverages.visibility / 1000
              : null
          ),
          borderColor: '#8b5cf6',
          borderDash: [4, 4],
          pointRadius: 0,
          yAxisID: 'yVisibility',
        },
        {
          label: `${AVG_LABEL_PREFIX}Türkiye Ortalama Bulutluluk`,
          data: toConstSeries(nationalAverages?.cloudCover ?? null),
          borderColor: '#64748b',
          borderDash: [4, 4],
          pointRadius: 0,
          yAxisID: 'yCloud',
        },
      ],
    };

    const options: ChartOptions<'line'> = {
      ...baseOptions,
      plugins: {
        ...baseOptions.plugins,
        tooltip: {
          callbacks: {
            label(ctx) {
              const v = ctx.parsed.y;
              const label = stripAveragePrefix(ctx.dataset.label);
              if (v === null || Number.isNaN(v)) return `${label}: -`;
              if (ctx.dataset.yAxisID === 'yVisibility') return `${label}: ${Number(v).toFixed(1)} km`;
              return `${label}: ${Number(v).toFixed(1)}%`;
            },
          },
        },
      },
      scales: {
        ...baseOptions.scales,
        yVisibility: {
          type: 'linear',
          position: 'left',
          grid: { color: 'rgba(139,92,246,0.12)' },
          ticks: {
            callback(value) {
              return `${Number(value).toFixed(1)} km`;
            },
          },
        },
        yCloud: {
          type: 'linear',
          position: 'right',
          offset: true,
          min: 0,
          max: 100,
          grid: { drawOnChartArea: false },
          ticks: {
            callback(value) {
              return `${Number(value).toFixed(1)}%`;
            },
          },
        },
      },
    };

    return (
      <div className={`bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 ${cardPaddingClass} shadow-sm`}>
        <div className="mb-2">
          <h3 className={titleClass}>👁️ 24 Saatlik Görüş ve Bulutluluk (00:00 - 24:00)</h3>
          {contextLabel && <p className="text-xs text-slate-500 dark:text-slate-400 -mt-1">{contextLabel}</p>}
        </div>
        <Line data={chartData} options={options} />
      </div>
    );
  }

  return null;
};

export default WeatherCharts;
