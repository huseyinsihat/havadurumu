import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { GeoJsonObject } from 'geojson';
import { MapPin, Search, TrendingUp, X } from 'lucide-react';

import './App.css';
import Header from './components/Layout/Header';
import Card from './components/UI/Card';
import Loading from './components/UI/Loading';
import { TurkeyMap } from './components/Map/TurkeyMap';
import WeatherCharts from './components/Weather/WeatherCharts';
import WeatherSummary from './components/Weather/WeatherSummary';
import weatherApi from './services/weatherApi';
import { useWeatherStore } from './store/useWeatherStore';
import type { WeatherResponse } from './types';
import { getWeatherIcon, getWeatherLabelTr } from './utils/colors';
import { detectUserCoordinates, findNearestProvinceByCoordinates } from './utils/location';
import { getIstanbulDateString, getIstanbulNow } from './utils/time';

type CurrentSnapshot = {
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

type CurrentWeatherMap = Record<string, CurrentSnapshot>;

type RankingItem = {
  code: string;
  name: string;
  temperature: number;
};

type RainRankingItem = {
  code: string;
  name: string;
  precipitation: number;
};

type HumidityRankingItem = {
  code: string;
  name: string;
  humidity: number;
};

const normalizeProvinceName = (value: string) =>
  value
    .toLocaleLowerCase('tr')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .replace(/[^a-z0-9]/g, '');

const TURKISH_PROVINCE_NAME_OVERRIDES: Record<string, string> = {
  adiyaman: 'Adıyaman',
  agri: 'Ağrı',
  aydin: 'Aydın',
  balikesir: 'Balıkesir',
  bingol: 'Bingöl',
  canakkale: 'Çanakkale',
  cankiri: 'Çankırı',
  corum: 'Çorum',
  diyarbakir: 'Diyarbakır',
  elazig: 'Elazığ',
  eskisehir: 'Eskişehir',
  gumushane: 'Gümüşhane',
  igdir: 'Iğdır',
  izmir: 'İzmir',
  kahramanmaras: 'Kahramanmaraş',
  karabuk: 'Karabük',
  kirikkale: 'Kırıkkale',
  kirklareli: 'Kırklareli',
  kirsehir: 'Kırşehir',
  kutahya: 'Kütahya',
  mugla: 'Muğla',
  mus: 'Muş',
  nevsehir: 'Nevşehir',
  nigde: 'Niğde',
  sanliurfa: 'Şanlıurfa',
  sirnak: 'Şırnak',
  tekirdag: 'Tekirdağ',
  usak: 'Uşak',
  zonguldak: 'Zonguldak',
  istanbul: 'İstanbul',
};

const toTurkishProvinceName = (name: string) => {
  const key = normalizeProvinceName(name);
  return TURKISH_PROVINCE_NAME_OVERRIDES[key] || name;
};

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

const isValidIsoDate = (value: string) => {
  if (!DATE_REGEX.test(value)) return false;
  const [yearStr, monthStr, dayStr] = value.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) return false;

  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

const isValidTime = (value: string) => TIME_REGEX.test(value);

const buildFallbackWeatherResponse = (params: {
  provinceName: string;
  plateCode: string;
  latitude: number;
  longitude: number;
  date: string;
  time: string;
  snapshot?: CurrentSnapshot;
}): WeatherResponse | null => {
  const { provinceName, plateCode, latitude, longitude, date, time, snapshot } = params;
  if (!snapshot) return null;

  const resolvedTime = snapshot.resolved_time || `${date}T${time}:00`;
  const temperature = Number(snapshot.temperature);
  if (Number.isNaN(temperature)) return null;

  return {
    province: provinceName,
    plate_code: plateCode,
    coordinates: {
      latitude,
      longitude,
    },
    timezone: 'Europe/Istanbul',
    data: {
      hourly: {
        time: [resolvedTime],
        temperature_2m: [temperature],
        apparent_temperature: [Number(snapshot.apparent_temperature ?? temperature)],
        precipitation: [Number(snapshot.precipitation) || 0],
        wind_speed_10m: [Number(snapshot.wind_speed) || 0],
        wind_direction_10m: [Number(snapshot.wind_direction_10m) || 0],
        relative_humidity_2m: [Number(snapshot.humidity) || 0],
        pressure_msl: [Number(snapshot.pressure_msl) || 0],
        visibility: [Number(snapshot.visibility) || 0],
        cloud_cover: [Number(snapshot.cloud_cover) || 0],
        weather_code: [Number(snapshot.weather_code) || 0],
      },
    },
    timestamp: new Date().toISOString(),
  };
};

function App() {
  const {
    provinces,
    selectedProvince,
    selectedPlateCode,
    weatherData,
    currentWeather,
    isLoading,
    error,
    selectedDateRange,
    selectedTime,
    setProvinces,
    setSelectedProvince,
    setWeatherData,
    setCurrentWeather,
    setIsLoading,
    setError,
    setDateRange,
    setSelectedTime,
  } = useWeatherStore();

  const [geoJsonData, setGeoJsonData] = useState<GeoJsonObject | null>(null);
  const [searchText, setSearchText] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const snapshotRequestRef = useRef(0);
  const selectedWeatherRequestRef = useRef(0);
  const autoLocateAttemptedRef = useRef(false);
  const manualSelectionRef = useRef(false);

  const provinceNameByCode = useMemo(() => {
    const map: Record<string, string> = {};
    provinces.forEach((province) => {
      const code = String(province.plate_code).padStart(2, '0');
      map[code] = province.name;
    });
    return map;
  }, [provinces]);

  const filteredProvinces = useMemo(() => {
    const query = searchText.trim().toLocaleLowerCase('tr');
    if (!query) return provinces;

    return provinces.filter(
      (province) =>
        province.name.toLocaleLowerCase('tr').includes(query) ||
        String(province.plate_code).padStart(2, '0').includes(searchText.trim())
    );
  }, [provinces, searchText]);

  const selectedPlateNumeric = useMemo(() => {
    const parsed = Number(selectedPlateCode || '34');
    if (Number.isNaN(parsed) || parsed < 1 || parsed > 81) return 34;
    return parsed;
  }, [selectedPlateCode]);

  const selectedPlateInfo = useMemo(() => {
    if (!selectedPlateCode) {
      return {
        code: '--',
        name: 'Türkiye',
      };
    }

    const code = String(selectedPlateCode).padStart(2, '0');
    return {
      code,
      name: provinceNameByCode[code] || `İl ${code}`,
    };
  }, [provinceNameByCode, selectedPlateCode]);

  const rankingData = useMemo<RankingItem[]>(() => {
    if (!currentWeather) return [];

    return Object.entries(currentWeather)
      .filter(([, data]) => data.temperature !== undefined && !Number.isNaN(data.temperature))
      .map(([code, data]) => ({
        code,
        name: provinceNameByCode[code] || data.name || `Il ${code}`,
        temperature: data.temperature,
      }))
      .sort((a, b) => b.temperature - a.temperature);
  }, [currentWeather, provinceNameByCode]);

  const rainRankingData = useMemo<RainRankingItem[]>(() => {
    if (!currentWeather) return [];

    return Object.entries(currentWeather)
      .filter(([, data]) => data.precipitation !== undefined && !Number.isNaN(data.precipitation))
      .map(([code, data]) => ({
        code,
        name: provinceNameByCode[code] || data.name || `Il ${code}`,
        precipitation: Number(data.precipitation) || 0,
      }))
      .sort((a, b) => b.precipitation - a.precipitation);
  }, [currentWeather, provinceNameByCode]);

  const lowRainRankingData = useMemo<RainRankingItem[]>(() => {
    return [...rainRankingData].sort((a, b) => a.precipitation - b.precipitation);
  }, [rainRankingData]);

  const chartNationalAverages = useMemo(() => {
    const rows = Object.values(currentWeather || {});
    const avg = (values: number[]) => (values.length ? values.reduce((sum, val) => sum + val, 0) / values.length : null);

    const toNumbers = (items: Array<number | undefined>) =>
      items.map((value) => Number(value)).filter((value) => !Number.isNaN(value));

    return {
      temperature: avg(toNumbers(rows.map((item) => item.temperature))),
      precipitation: avg(toNumbers(rows.map((item) => item.precipitation))),
      windSpeed: avg(toNumbers(rows.map((item) => item.wind_speed))),
      humidity: avg(toNumbers(rows.map((item) => item.humidity))),
      pressure: avg(toNumbers(rows.map((item) => item.pressure_msl))),
      visibility: avg(toNumbers(rows.map((item) => item.visibility))),
      cloudCover: avg(toNumbers(rows.map((item) => item.cloud_cover))),
    };
  }, [currentWeather]);

  const humidityRankingData = useMemo<HumidityRankingItem[]>(() => {
    if (!currentWeather) return [];

    return Object.entries(currentWeather)
      .filter(([, data]) => data.humidity !== undefined && !Number.isNaN(data.humidity))
      .map(([code, data]) => ({
        code,
        name: provinceNameByCode[code] || data.name || `Il ${code}`,
        humidity: Number(data.humidity) || 0,
      }))
      .sort((a, b) => b.humidity - a.humidity);
  }, [currentWeather, provinceNameByCode]);

  const lowHumidityRankingData = useMemo<HumidityRankingItem[]>(() => {
    return [...humidityRankingData].sort((a, b) => a.humidity - b.humidity);
  }, [humidityRankingData]);

  const selectedCurrentSnapshot = useMemo(() => {
    if (!selectedPlateCode || !currentWeather) return undefined;
    return currentWeather[selectedPlateCode];
  }, [currentWeather, selectedPlateCode]);

  const selectedStatusText = useMemo(() => {
    if (!selectedCurrentSnapshot) {
      const temps = Object.values(currentWeather || {})
        .map((item) => Number(item.temperature))
        .filter((value) => !Number.isNaN(value));

      if (temps.length > 0) {
        const average = temps.reduce((sum, value) => sum + value, 0) / temps.length;
        return `🌡️ ${average.toFixed(1)}°C`;
      }

      return '🌡️ -';
    }

    const status = getWeatherLabelTr(selectedCurrentSnapshot?.weather_code);
    const icon = getWeatherIcon(selectedCurrentSnapshot?.weather_code);
    const temp =
      selectedCurrentSnapshot?.temperature !== undefined && selectedCurrentSnapshot?.temperature !== null
        ? `${selectedCurrentSnapshot.temperature.toFixed(1)}°C`
        : '-';
    return `${icon} ${status} ${temp}`;
  }, [currentWeather, selectedCurrentSnapshot]);

  const selectedComparison = useMemo(() => {
    if (!selectedPlateCode || rankingData.length === 0) return null;

    const index = rankingData.findIndex((item) => item.code === selectedPlateCode);
    if (index === -1) return null;

    const selected = rankingData[index];
    const hottest = rankingData[0];
    const coldest = rankingData[rankingData.length - 1];
    const average = rankingData.reduce((sum, item) => sum + item.temperature, 0) / rankingData.length;

    return {
      rank: index + 1,
      total: provinces.length || rankingData.length,
      selected,
      hottest,
      coldest,
      average,
      diffFromAverage: selected.temperature - average,
      diffFromHottest: hottest.temperature - selected.temperature,
      diffFromColdest: selected.temperature - coldest.temperature,
    };
  }, [provinces.length, rankingData, selectedPlateCode]);

  const handleNowClick = useCallback(() => {
    const { date, time } = getIstanbulNow();

    setDateRange(date, date);
    setSelectedTime(time);
    setError(null);
  }, [setDateRange, setError, setSelectedTime]);

  const normalizeDateTimeSelection = useCallback(
    (nextDate: string, nextTime: string) => {
      const now = getIstanbulNow();
      const isDateValid = isValidIsoDate(nextDate) && nextDate <= now.date;
      const isTimeValid = isValidTime(nextTime);

      if (!isDateValid || !isTimeValid) {
        setDateRange(now.date, now.date);
        setSelectedTime(now.time);
        setError(null);
        return;
      }

      setDateRange(nextDate, nextDate);
      setSelectedTime(nextTime);
      setError(null);
    },
    [setDateRange, setError, setSelectedTime]
  );

  useEffect(() => {
    const handleClickOutside = () => setShowDropdown(false);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [{ provinces: provincesData }, geoJsonResponse] = await Promise.all([
          weatherApi.getProvinces(),
          fetch('/data/turkey_provinces.geojson'),
        ]);

        const localizedProvinces = provincesData.map((province) => ({
          ...province,
          name: toTurkishProvinceName(province.name),
        }));

        setProvinces(localizedProvinces);

        if (!geoJsonResponse.ok) {
          throw new Error('GeoJSON yüklenemedi.');
        }

        const geoJSON = await geoJsonResponse.json();
        setGeoJsonData(geoJSON);

        setSelectedProvince(null, null);
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : 'Veri yükleme sırasında beklenmeyen hata.';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [setError, setIsLoading, setProvinces, setSelectedProvince]);

  useEffect(() => {
    if (provinces.length === 0) return;
    if (autoLocateAttemptedRef.current) return;
    if (selectedProvince) return;

    autoLocateAttemptedRef.current = true;
    let cancelled = false;

    const autoDetectAndSelect = async () => {
      try {
        const coordinates = await detectUserCoordinates();
        if (!coordinates || cancelled) return;
        if (manualSelectionRef.current) return;

        const nearestProvince = findNearestProvinceByCoordinates(coordinates, provinces);
        if (!nearestProvince) return;

        const code = String(nearestProvince.plate_code).padStart(2, '0');
        setSelectedProvince(nearestProvince, code);
      } catch {
        // Sessiz fallback: konum belirlenemezse Türkiye genel görünümde kal
      }
    };

    autoDetectAndSelect();

    return () => {
      cancelled = true;
    };
  }, [provinces, selectedProvince, setSelectedProvince]);

  useEffect(() => {
    const refreshSnapshot = async () => {
      if (provinces.length === 0) return;
      const today = getIstanbulDateString();
      if (
        !isValidIsoDate(selectedDateRange.startDate) ||
        selectedDateRange.startDate > today ||
        !isValidTime(selectedTime)
      ) {
        const now = getIstanbulNow();
        setDateRange(now.date, now.date);
        setSelectedTime(now.time);
        setError(null);
        return;
      }
      const requestId = ++snapshotRequestRef.current;

      try {
        setIsLoading(true);

        const snapshot = await weatherApi.getWeatherSnapshot(selectedDateRange.startDate, selectedTime);
        if (requestId !== snapshotRequestRef.current) return;
        const snapshotMap: CurrentWeatherMap = {};

        (snapshot?.provinces || []).forEach(
          (province: {
            plate_code: string;
            name?: string;
            temperature: number;
            apparent_temperature?: number;
            precipitation: number;
            humidity: number;
            wind_speed: number;
            wind_direction_10m?: number;
            pressure_msl?: number;
            visibility?: number;
            cloud_cover?: number;
            weather_code?: number;
            resolved_time?: string;
          }) => {
            if (!province.plate_code) return;
            const code = String(province.plate_code).padStart(2, '0');
            const temperature = Number(province.temperature);
            if (Number.isNaN(temperature)) return;

            snapshotMap[code] = {
              temperature,
              precipitation: Number(province.precipitation) || 0,
              humidity: Number(province.humidity) || 0,
              wind_speed: Number(province.wind_speed) || 0,
              apparent_temperature: Number(province.apparent_temperature ?? temperature),
              wind_direction_10m: Number(province.wind_direction_10m) || 0,
              pressure_msl: Number(province.pressure_msl) || 0,
              visibility: Number(province.visibility) || 0,
              cloud_cover: Number(province.cloud_cover) || 0,
              weather_code: Number(province.weather_code) || 0,
              resolved_time: province.resolved_time,
              name: province.name,
            };
          }
        );

        const coverage = snapshot?.coverage;
        const available = Number(coverage?.available) || Object.keys(snapshotMap).length;
        const total = Number(coverage?.total) || provinces.length;

        if (available === 0) {
          setError('Seçili tarih-saat verisi geçici olarak alınamadı. Önceki veri korunuyor, lütfen tekrar deneyin.');
          return;
        }

        setCurrentWeather(snapshotMap);

        if (available < total) {
          console.warn(`Snapshot coverage partial: ${available}/${total}`);
        }
        setError(null);
      } catch (snapshotError) {
        if (requestId !== snapshotRequestRef.current) return;
        const message =
          snapshotError instanceof Error
            ? snapshotError.message
            : 'Seçili tarih-saat verisi yüklenemedi. Lütfen tekrar deneyin.';
        setError(message);
      } finally {
        if (requestId === snapshotRequestRef.current) {
          setIsLoading(false);
        }
      }
    };

    refreshSnapshot();
  }, [
    provinces.length,
    selectedDateRange.startDate,
    selectedTime,
    setCurrentWeather,
    setDateRange,
    setError,
    setIsLoading,
    setSelectedTime,
  ]);

  const handleProvinceSelect = useCallback(
    (plateCode: string, name: string) => {
      manualSelectionRef.current = true;
      const normalizedCode = String(plateCode || '').padStart(2, '0');

      let province = provinces.find((item) => String(item.plate_code).padStart(2, '0') === normalizedCode) || null;

      if (!province && name) {
        const normalizedName = normalizeProvinceName(name);
        province =
          provinces.find((item) => normalizeProvinceName(item.name || '') === normalizedName) ||
          null;
      }

      if (!province) {
        setError('Seçilen il eşleşmedi. Lütfen listeden il seçin.');
        return;
      }

      const code = String(province.plate_code).padStart(2, '0');
      setSelectedProvince(province, code);
      setError(null);
    },
    [provinces, setError, setSelectedProvince]
  );

  const fallbackWeatherData = useMemo(() => {
    if (!selectedProvince || !selectedPlateCode) return null;
    return buildFallbackWeatherResponse({
      provinceName: selectedProvince.name,
      plateCode: selectedPlateCode,
      latitude: selectedProvince.coordinates.latitude,
      longitude: selectedProvince.coordinates.longitude,
      date: selectedDateRange.startDate,
      time: selectedTime,
      snapshot: selectedCurrentSnapshot,
    });
  }, [selectedCurrentSnapshot, selectedDateRange.startDate, selectedPlateCode, selectedProvince, selectedTime]);

  const displayWeatherData = weatherData || fallbackWeatherData;

  useEffect(() => {
    const refreshSelected = async () => {
      if (!selectedPlateCode) {
        setIsDetailLoading(false);
        return;
      }
      const today = getIstanbulDateString();
      if (
        !isValidIsoDate(selectedDateRange.startDate) ||
        selectedDateRange.startDate > today ||
        !isValidTime(selectedTime)
      ) {
        const now = getIstanbulNow();
        setDateRange(now.date, now.date);
        setSelectedTime(now.time);
        setError(null);
        return;
      }
      const requestId = ++selectedWeatherRequestRef.current;
      const isTodaySelected = selectedDateRange.startDate === getIstanbulDateString();

      try {
        if (fallbackWeatherData && isTodaySelected) {
          setWeatherData(fallbackWeatherData);
        }
        setIsDetailLoading(true);
        const weather = await weatherApi.getWeather(
          selectedPlateCode,
          selectedDateRange.startDate,
          selectedDateRange.endDate,
          true
        );
        if (requestId !== selectedWeatherRequestRef.current) return;

        setWeatherData(weather);
        setError(null);
      } catch (refreshError) {
        if (requestId !== selectedWeatherRequestRef.current) return;
        const hasCurrentFallback = Boolean(fallbackWeatherData) && isTodaySelected;
        if (hasCurrentFallback) {
          setWeatherData(fallbackWeatherData);
          setError(null);
          return;
        } else {
          const message =
            refreshError instanceof Error ? refreshError.message : 'Hava durumu yüklenemedi. Lütfen tekrar deneyin.';
          setError(message);
        }
      } finally {
        if (requestId === selectedWeatherRequestRef.current) {
          setIsDetailLoading(false);
        }
      }
    };

    refreshSelected();
  }, [
    fallbackWeatherData,
    selectedDateRange.endDate,
    selectedDateRange.startDate,
    selectedPlateCode,
    selectedTime,
    setDateRange,
    setError,
    setIsDetailLoading,
    setSelectedTime,
    setWeatherData,
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 transition-colors duration-500">
      <Header />

      <main className="max-w-[1600px] mx-auto px-6 py-8 space-y-6 fade-in">
        {error && (
          <div className="p-4 rounded-lg bg-red-50 border-l-4 border-red-500 text-red-800 dark:bg-red-900/20 dark:border-red-600 dark:text-red-200 flex items-start gap-3 justify-between">
            <div className="flex items-start gap-3">
              <span className="text-2xl">!</span>
              <div>
                <p className="font-semibold">Hata oluştu</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700" aria-label="Hatayı kapat">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        <section className="space-y-3">
          <div className="relative z-[2000]" onClick={(event) => event.stopPropagation()}>
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-800/95 shadow-lg px-3 py-3">
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-2 items-start">
                <div className="xl:col-span-5 relative">
                  <div className="relative group">
                    <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <input
                      type="text"
                      placeholder="İl adı veya plaka kodu yazın..."
                      value={searchText}
                      onChange={(event) => {
                        setSearchText(event.target.value);
                        setShowDropdown(true);
                      }}
                      onFocus={() => setShowDropdown(true)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-shadow"
                    />
                    {searchText && (
                      <button
                        onClick={() => setSearchText('')}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        aria-label="Aramayı temizle"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  {showDropdown && (
                    <div
                      className="absolute top-full left-0 right-0 mt-2 max-h-[300px] overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl z-[2000]"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {filteredProvinces.map((province) => {
                        const code = String(province.plate_code).padStart(2, '0');
                        const weather = currentWeather?.[code];

                        return (
                          <button
                            key={code}
                            onClick={() => {
                              handleProvinceSelect(code, province.name);
                              setSearchText('');
                              setShowDropdown(false);
                            }}
                            className={`w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/40 border-b border-slate-100 dark:border-slate-700 last:border-b-0 transition-colors ${
                              selectedPlateCode === code ? 'bg-blue-50 dark:bg-blue-900/30 border-l-4 border-l-blue-500 pl-3' : ''
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium text-slate-900 dark:text-slate-100">{province.name}</p>
                                <p className="text-xs text-slate-500">Plaka: {code} </p>
                              </div>
                              {weather && (
                                <div className="text-right">
                                  <span className="text-sm font-bold block text-slate-700 dark:text-slate-200">
                                    {weather.temperature.toFixed(1)}°C
                                  </span>
                                  <span className="text-xs text-slate-400">Nem %{weather.humidity}</span>
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}

                      {filteredProvinces.length === 0 && (
                        <div className="px-4 py-8 text-center text-slate-400">
                          <p>İl bulunamadı</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="xl:col-span-7">
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    <div className="px-3 py-2 rounded-lg text-sm font-semibold text-blue-700 dark:text-blue-200 border border-blue-200 dark:border-blue-700 bg-blue-50/80 dark:bg-blue-900/30 text-center">
                      {selectedPlateInfo.name}
                    </div>

                    <div className="px-3 py-2 rounded-lg text-sm font-semibold text-indigo-700 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-700 bg-indigo-50/80 dark:bg-indigo-900/30 text-center">
                      {selectedStatusText}
                    </div>

                    <input
                      type="date"
                      value={selectedDateRange.startDate}
                      onChange={(event) => normalizeDateTimeSelection(event.target.value, selectedTime)}
                      min="1940-01-01"
                      max={getIstanbulDateString()}
                      className="px-3 py-2 rounded-lg text-sm font-medium border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      aria-label="Tarih seç"
                    />

                    <input
                      type="time"
                      value={selectedTime}
                      onChange={(event) => normalizeDateTimeSelection(selectedDateRange.startDate, event.target.value)}
                      className="px-3 py-2 rounded-lg text-sm font-medium border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      aria-label="Saat seç"
                    />

                    <button
                      onClick={handleNowClick}
                      className="px-4 py-2 text-sm font-semibold rounded-lg border border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-200 bg-blue-50/70 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                    >
                      Şimdi
                    </button>
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 text-right pr-1 mt-1">
                    Anlık referans: {selectedDateRange.startDate} {selectedTime}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Card contentClassName="p-0">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/40">
              <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <p className="text-sm text-slate-700 dark:text-slate-300">İl seçmek için harita üzerinden tıklayın</p>
            </div>

            <div className="h-[500px] rounded-none overflow-hidden relative">
              {isLoading && (
                <div className="absolute inset-0 z-10 bg-white/50 dark:bg-slate-900/50 flex items-center justify-center">
                  <Loading />
                </div>
              )}
              <TurkeyMap
                onProvinceSelect={handleProvinceSelect}
                geoJsonData={geoJsonData}
                provinces={provinces}
                currentTemps={currentWeather}
              />
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/40 px-3 py-2">
              <div className="flex items-center justify-between text-[11px] font-semibold mb-1.5">
                <span className="text-slate-600 dark:text-slate-300">Plaka Kaydırıcı (1-81)</span>
                <span className="text-blue-700 dark:text-blue-300">
                  {selectedPlateInfo.code} - {selectedPlateInfo.name}
                </span>
              </div>
              <div className="px-1">
                <input
                  type="range"
                  min={1}
                  max={81}
                  step={1}
                  value={selectedPlateNumeric}
                  onChange={(event) => {
                    const numericCode = Number(event.target.value);
                    const bounded = Math.min(81, Math.max(1, numericCode));
                    const code = String(bounded).padStart(2, '0');
                    const selected = provinces.find((item) => String(item.plate_code).padStart(2, '0') === code);
                    if (!selected) return;
                    handleProvinceSelect(code, selected.name);
                  }}
                  className="w-full h-2 rounded-lg accent-blue-600 cursor-pointer"
                  aria-label="Plaka kaydırıcı"
                />
                <div className="mt-1 flex justify-between text-[10px] text-slate-500 dark:text-slate-400">
                  <span>1</span>
                  <span>81</span>
                </div>
              </div>
            </div>
          </Card>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {selectedProvince ? (
            <Card
              className="md:col-span-7"
              title={selectedProvince.name}
              subtitle={`Plaka: ${String(selectedProvince.plate_code).padStart(2, '0')}`}
              icon={<TrendingUp className="w-5 h-5" />}
            >
              {displayWeatherData && <WeatherSummary data={displayWeatherData} current={selectedCurrentSnapshot} />}

              {selectedComparison && (
                <div className="mt-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-slate-900/50 dark:via-blue-900/10 dark:to-indigo-900/10 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Şehir sıcaklık karşılaştırması</p>
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 px-2 py-1 rounded-md bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                      Sıra #{selectedComparison.rank}/{selectedComparison.total}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 bg-white dark:bg-slate-800">
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Türkiye ortalaması</div>
                      <div className="font-bold text-slate-900 dark:text-slate-100">{selectedComparison.average.toFixed(1)}°C</div>
                    </div>

                    <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 bg-white dark:bg-slate-800">
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Ortalamaya fark</div>
                      <div className={`font-bold ${selectedComparison.diffFromAverage >= 0 ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-300'}`}>
                        {selectedComparison.diffFromAverage >= 0 ? '+' : ''}
                        {selectedComparison.diffFromAverage.toFixed(1)}°C
                      </div>
                    </div>

                    <div className="rounded-lg border border-orange-200 dark:border-orange-700 p-3 bg-orange-50/70 dark:bg-orange-900/20">
                      <div className="text-xs text-orange-700 dark:text-orange-300 mb-1">En sıcak il: {selectedComparison.hottest.name}</div>
                      <div className="font-bold text-orange-700 dark:text-orange-300">{selectedComparison.diffFromHottest.toFixed(1)}°C altında</div>
                    </div>

                    <div className="rounded-lg border border-blue-200 dark:border-blue-700 p-3 bg-blue-50/70 dark:bg-blue-900/20">
                      <div className="text-xs text-blue-700 dark:text-blue-300 mb-1">En soğuk il: {selectedComparison.coldest.name}</div>
                      <div className="font-bold text-blue-700 dark:text-blue-300">+{selectedComparison.diffFromColdest.toFixed(1)}°C üstünde</div>
                    </div>
                  </div>
                </div>
              )}

              {isDetailLoading && (
                <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">Detay saatlik seri verisi güncelleniyor...</div>
              )}

              {!displayWeatherData && !isDetailLoading && (
                <div className="text-center py-4 text-slate-400 text-sm">Seçili il için veri bulunamadı.</div>
              )}
            </Card>
          ) : (
            <Card className="md:col-span-7" title="İl Seçin" icon={<MapPin className="w-5 h-5" />}>
              <div className="text-center py-6 text-slate-400 text-sm">
                <p>Harita üzerinden bir il seçin</p>
              </div>
            </Card>
          )}

          <Card
            className="md:col-span-5"
            title="Enler"
            subtitle={`Seçili an: ${selectedDateRange.startDate} ${selectedTime} | Kapsam ${rankingData.length}/${provinces.length || 81}`}
          >
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <h4 className="h-5 flex items-center text-xs font-semibold text-red-600 dark:text-red-400 mb-2 tracking-wide uppercase">En Sıcak</h4>
                  <div className="space-y-1.5">
                    {rankingData.slice(0, 3).map((item) => (
                      <div
                        key={`hot-${item.code}`}
                        onClick={() => handleProvinceSelect(item.code, item.name)}
                        className="p-2 rounded bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border border-orange-200 dark:border-orange-700 cursor-pointer hover:shadow-md transition-all"
                      >
                        <div className="flex justify-between items-center gap-1">
                          <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">{item.name}</span>
                          <span className="font-bold text-lg text-red-600 dark:text-red-400 whitespace-nowrap">{item.temperature.toFixed(1)}°</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <h4 className="h-5 flex items-center text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2 tracking-wide uppercase">En Soğuk</h4>
                  <div className="space-y-1.5">
                    {[...rankingData].reverse().slice(0, 3).map((item) => (
                      <div
                        key={`cold-${item.code}`}
                        onClick={() => handleProvinceSelect(item.code, item.name)}
                        className="p-2 rounded bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 cursor-pointer hover:shadow-md transition-all"
                      >
                        <div className="flex justify-between items-center gap-1">
                          <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">{item.name}</span>
                          <span className="font-bold text-lg text-blue-600 dark:text-blue-400 whitespace-nowrap">{item.temperature.toFixed(1)}°</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <h4 className="h-5 flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-2 tracking-wide uppercase">En Nemli</h4>
                  <div className="space-y-1.5">
                    {humidityRankingData.slice(0, 3).map((item) => (
                      <div
                        key={`humid-high-${item.code}`}
                        onClick={() => handleProvinceSelect(item.code, item.name)}
                        className="p-2 rounded bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border border-emerald-200 dark:border-emerald-700 cursor-pointer hover:shadow-md transition-all"
                      >
                        <div className="flex justify-between items-center gap-1">
                          <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">{item.name}</span>
                          <span className="font-bold text-lg text-emerald-600 dark:text-emerald-300 whitespace-nowrap">{item.humidity.toFixed(0)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <h4 className="h-5 flex items-center text-xs font-semibold text-teal-600 dark:text-teal-400 mb-2 tracking-wide uppercase">En Az Nemli</h4>
                  <div className="space-y-1.5">
                    {lowHumidityRankingData.slice(0, 3).map((item) => (
                      <div
                        key={`humid-low-${item.code}`}
                        onClick={() => handleProvinceSelect(item.code, item.name)}
                        className="p-2 rounded bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 border border-teal-200 dark:border-teal-700 cursor-pointer hover:shadow-md transition-all"
                      >
                        <div className="flex justify-between items-center gap-1">
                          <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">{item.name}</span>
                          <span className="font-bold text-lg text-teal-600 dark:text-teal-300 whitespace-nowrap">{item.humidity.toFixed(0)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <h4 className="h-5 flex items-center text-xs font-semibold text-cyan-600 dark:text-cyan-400 mb-2 tracking-wide uppercase">En Yağışlı</h4>
                  <div className="space-y-1.5">
                    {rainRankingData.slice(0, 3).map((item) => (
                      <div
                        key={`rain-high-${item.code}`}
                        onClick={() => handleProvinceSelect(item.code, item.name)}
                        className="p-2 rounded bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 border border-cyan-200 dark:border-cyan-700 cursor-pointer hover:shadow-md transition-all"
                      >
                        <div className="flex justify-between items-center gap-1">
                          <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">{item.name}</span>
                          <span className="font-bold text-lg text-cyan-600 dark:text-cyan-300 whitespace-nowrap">{item.precipitation.toFixed(1)} mm</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <h4 className="h-5 flex items-center text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2 tracking-wide uppercase">En Az Yağış</h4>
                  <div className="space-y-1.5">
                    {lowRainRankingData.slice(0, 3).map((item) => (
                      <div
                        key={`rain-low-${item.code}`}
                        onClick={() => handleProvinceSelect(item.code, item.name)}
                        className="p-2 rounded bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900/40 dark:to-slate-800/40 border border-slate-200 dark:border-slate-700 cursor-pointer hover:shadow-md transition-all"
                      >
                        <div className="flex justify-between items-center gap-1">
                          <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">{item.name}</span>
                          <span className="font-bold text-lg text-slate-600 dark:text-slate-300 whitespace-nowrap">{item.precipitation.toFixed(1)} mm</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
            </div>

            {rankingData.length === 0 && rainRankingData.length === 0 && (
              <div className="text-center py-4 text-slate-400 text-xs">Veri yükleniyor...</div>
            )}
          </Card>
        </section>

        {selectedProvince && displayWeatherData && (
          <section>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <WeatherCharts
                data={displayWeatherData}
                hourlyMode
                chartType="temp"
                compact
                contextLabel={`${selectedProvince.name} • ${selectedDateRange.startDate} • ${selectedTime}`}
                nationalAverages={chartNationalAverages}
              />
              <WeatherCharts
                data={displayWeatherData}
                hourlyMode
                chartType="rain"
                compact
                contextLabel={`${selectedProvince.name} • ${selectedDateRange.startDate} • ${selectedTime}`}
                nationalAverages={chartNationalAverages}
              />
              <WeatherCharts
                data={displayWeatherData}
                hourlyMode
                chartType="windHumidity"
                compact
                contextLabel={`${selectedProvince.name} • ${selectedDateRange.startDate} • ${selectedTime}`}
                nationalAverages={chartNationalAverages}
              />
              <WeatherCharts
                data={displayWeatherData}
                hourlyMode
                chartType="pressure"
                compact
                contextLabel={`${selectedProvince.name} • ${selectedDateRange.startDate} • ${selectedTime}`}
                nationalAverages={chartNationalAverages}
              />
            </div>
          </section>
        )}
      </main>

      <footer className="mt-12 pb-8 text-center text-slate-500 dark:text-slate-400 text-sm space-y-1">
        <p>© 2026 Türkiye Hava Durumu Haritası | Open-Meteo API</p>
        <p className="text-xs text-slate-400 dark:text-slate-500">Hüseyin SIHAT tarafından geliştirilmiştir.</p>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          <a
            href="https://docs.google.com/forms/d/e/1FAIpQLSfdI9GncS207bb8TZkvdSfS2cvJCncQnkdWaK6dWv-3m1wcmA/viewform?usp=dialog"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
          >
            Öneride Bulun
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;
