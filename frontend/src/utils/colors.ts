// Sicaklik araliklarina gore renk dondurur
export const getTemperatureColor = (temp?: number | null): string => {
  if (temp === undefined || temp === null || Number.isNaN(temp)) {
    return '#CBD5E1'; // veri yok
  }

  if (temp < -10) return '#1e3a8a'; // cok soguk
  if (temp < 0) return '#3b82f6'; // soguk
  if (temp < 10) return '#22c55e'; // serin
  if (temp < 18) return '#84cc16'; // ideal
  if (temp < 25) return '#fbbf24'; // iliman
  if (temp < 30) return '#f97316'; // sicak
  if (temp < 35) return '#ef4444'; // cok sicak
  return '#991b1b'; // asiri sicak
};

const SCALE_STOPS = ['#1d4ed8', '#0ea5e9', '#22c55e', '#facc15', '#f97316', '#dc2626'];

const hexToRgb = (hex: string) => {
  const normalized = hex.replace('#', '');
  const value = Number.parseInt(normalized, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
};

const rgbToHex = (r: number, g: number, b: number) => {
  const toHex = (n: number) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const interpolateColor = (startHex: string, endHex: string, ratio: number) => {
  const start = hexToRgb(startHex);
  const end = hexToRgb(endHex);

  return rgbToHex(
    start.r + (end.r - start.r) * ratio,
    start.g + (end.g - start.g) * ratio,
    start.b + (end.b - start.b) * ratio
  );
};

export const getTemperatureScaleColor = (
  temp?: number | null,
  minTemp?: number,
  maxTemp?: number
): string => {
  if (temp === undefined || temp === null || Number.isNaN(temp)) {
    return '#CBD5E1';
  }

  if (
    minTemp === undefined ||
    maxTemp === undefined ||
    Number.isNaN(minTemp) ||
    Number.isNaN(maxTemp) ||
    minTemp === maxTemp
  ) {
    return getTemperatureColor(temp);
  }

  const normalized = (temp - minTemp) / (maxTemp - minTemp);
  const clamped = Math.max(0, Math.min(1, normalized));
  const segment = 1 / (SCALE_STOPS.length - 1);
  const index = Math.min(Math.floor(clamped / segment), SCALE_STOPS.length - 2);
  const localRatio = (clamped - index * segment) / segment;

  return interpolateColor(SCALE_STOPS[index], SCALE_STOPS[index + 1], localRatio);
};

// Legend icin renk araliklari ve etiketleri
export const TEMP_RANGES = [
  { min: -Infinity, max: -10, color: '#1e3a8a', label: 'Çok Soğuk (<-10°C)' },
  { min: -10, max: 0, color: '#3b82f6', label: 'Soğuk (-10 - 0°C)' },
  { min: 0, max: 10, color: '#22c55e', label: 'Serin (0 - 10°C)' },
  { min: 10, max: 18, color: '#84cc16', label: 'İdeal (10 - 18°C)' },
  { min: 18, max: 25, color: '#fbbf24', label: 'Ilıman (18 - 25°C)' },
  { min: 25, max: 30, color: '#f97316', label: 'Sıcak (25 - 30°C)' },
  { min: 30, max: 35, color: '#ef4444', label: 'Çok Sıcak (30 - 35°C)' },
  { min: 35, max: Infinity, color: '#991b1b', label: 'Aşırı Sıcak (>35°C)' },
];

// Hava durumu kodu icin ikon dondurur
export const getWeatherIcon = (code?: number): string => {
  if (code === undefined || code === null || Number.isNaN(code)) return '☁️';

  if (code === 0) return '☀️'; // Acik
  if (code <= 3) return '⛅'; // Parcali bulutlu
  if (code <= 48) return '🌫️'; // Sisli
  if (code <= 67) return '🌧️'; // Yagmurlu
  if (code <= 77) return '🌨️'; // Karli
  if (code <= 82) return '🌦️'; // Saganak
  if (code <= 99) return '⛈️'; // Firtinali

  return '☁️';
};

export const getWeatherLabelTr = (code?: number): string => {
  if (code === undefined || code === null) return 'Bilinmiyor';

  if (code === 0) return 'Açık';
  if ([1, 2].includes(code)) return 'Az bulutlu';
  if (code === 3) return 'Kapalı';
  if ([45, 48].includes(code)) return 'Sisli';
  if (code >= 51 && code <= 67) return 'Yağmurlu';
  if (code >= 71 && code <= 77) return 'Karlı';
  if (code >= 80 && code <= 82) return 'Sağanak';
  if (code >= 85 && code <= 86) return 'Kar sağanağı';
  if (code >= 95 && code <= 99) return 'Fırtına';

  return 'Değişken';
};
