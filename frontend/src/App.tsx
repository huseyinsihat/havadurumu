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
    const code = String(selectedPlateNumeric).padStart(2, '0');
    return {
      code,
      name: provinceNameByCode[code] || `İl ${code}`,
    };
  }, [provinceNameByCode, selectedPlateNumeric]);

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

  const selectedCurrentSnapshot = useMemo(() => {
    if (!selectedPlateCode || !currentWeather) return undefined;
    return currentWeather[selectedPlateCode];
  }, [currentWeather, selectedPlateCode]);

  const selectedStatusText = useMemo(() => {
    const status = getWeatherLabelTr(selectedCurrentSnapshot?.weather_code);
    const icon = getWeatherIcon(selectedCurrentSnapshot?.weather_code);
    const temp =
      selectedCurrentSnapshot?.temperature !== undefined && selectedCurrentSnapshot?.temperature !== null
        ? `${selectedCurrentSnapshot.temperature.toFixed(1)}°C`
        : '-';
    return `${icon} ${status} ${temp}`;
  }, [selectedCurrentSnapshot]);

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
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().slice(0, 5);

    setDateRange(date, date);
    setSelectedTime(time);
    setError(null);
  }, [setDateRange, setError, setSelectedTime]);

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

        const defaultProvince =
          localizedProvinces.find((province) => String(province.plate_code).padStart(2, '0') === '34') ||
          localizedProvinces[0] ||
          null;

        if (defaultProvince) {
          const code = String(defaultProvince.plate_code).padStart(2, '0');
          setSelectedProvince(defaultProvince, code);
        }
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
    const refreshSnapshot = async () => {
      if (provinces.length === 0) return;
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
  }, [provinces.length, selectedDateRange.startDate, selectedTime, setCurrentWeather, setError, setIsLoading]);

  const handleProvinceSelect = useCallback(
    (plateCode: string, name: string) => {
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
      const requestId = ++selectedWeatherRequestRef.current;

      try {
        if (fallbackWeatherData) {
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
        const hasCurrentFallback = Boolean(fallbackWeatherData);
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
    setError,
    setIsDetailLoading,
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

        <div className="relative z-[2000]" onClick={(event) => event.stopPropagation()}>
          <div className="flex gap-2">
            <div className="flex-1 relative">
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
          </div>
        </div>

        <section>
          <Card
            title="Türkiye Haritası"
            subtitle="İl seçmek için harita üzerinden tıklayın"
            icon={<MapPin className="w-6 h-6" />}
            headerRight={
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:min-w-[640px]">
                <button
                  onClick={handleNowClick}
                  className="px-4 py-2 text-sm font-semibold rounded-lg border border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-200 bg-blue-50/70 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                >
                  Şimdi
                </button>

                <input
                  type="date"
                  value={selectedDateRange.startDate}
                  onChange={(event) => setDateRange(event.target.value, event.target.value)}
                  min="1940-01-01"
                  max={new Date().toISOString().split('T')[0]}
                  className="px-3 py-2 rounded-lg text-sm font-medium border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Tarih seç"
                />

                <input
                  type="time"
                  value={selectedTime}
                  onChange={(event) => setSelectedTime(event.target.value)}
                  className="px-3 py-2 rounded-lg text-sm font-medium border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Saat seç"
                />

                <div className="px-3 py-2 rounded-lg text-sm font-semibold text-indigo-700 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-700 bg-indigo-50/80 dark:bg-indigo-900/30 text-center">
                  {selectedStatusText}
                </div>

                <div className="col-span-2 sm:col-span-4 text-[10px] text-slate-500 dark:text-slate-400 text-right pr-1">
                  Anlık referans: {selectedDateRange.startDate} {selectedTime}
                </div>
              </div>
            }
          >
            <div className="h-[500px] rounded-lg overflow-hidden relative">
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

            <div className="mt-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/40 px-3 py-2">
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
                <div className="mt-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-blue-50/30 dark:from-slate-900/50 dark:to-blue-900/10 space-y-3">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Şehir sıcaklık karşılaştırması</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-2.5 bg-white dark:bg-slate-800">
                      Türkiye ort.: <span className="font-semibold">{selectedComparison.average.toFixed(1)}°C</span>
                    </div>
                    <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-2.5 bg-white dark:bg-slate-800">
                      Ortalamaya fark:{' '}
                      <span className={`font-semibold ${selectedComparison.diffFromAverage >= 0 ? 'text-red-600' : 'text-blue-600'}`}>
                        {selectedComparison.diffFromAverage >= 0 ? '+' : ''}
                        {selectedComparison.diffFromAverage.toFixed(1)}°C
                      </span>
                    </div>
                    <div className="rounded-lg border border-orange-200 dark:border-orange-700 p-2.5 bg-orange-50/60 dark:bg-orange-900/20">
                      En sıcak ({selectedComparison.hottest.name}):{' '}
                      <span className="font-semibold">{selectedComparison.diffFromHottest.toFixed(1)}°C fark</span>
                    </div>
                    <div className="rounded-lg border border-blue-200 dark:border-blue-700 p-2.5 bg-blue-50/70 dark:bg-blue-900/20">
                      En soğuk ({selectedComparison.coldest.name}):{' '}
                      <span className="font-semibold text-blue-700 dark:text-blue-300">+{selectedComparison.diffFromColdest.toFixed(1)}°C üstünde</span>
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <WeatherCharts data={displayWeatherData} hourlyMode chartType="temperature" compact />
              <WeatherCharts data={displayWeatherData} hourlyMode chartType="precipitation" compact />
            </div>
          </section>
        )}
      </main>

      <footer className="mt-12 pb-8 text-center text-slate-500 dark:text-slate-400 text-sm space-y-1">
        <p>© 2026 Türkiye Hava Durumu Haritası | Open-Meteo API</p>
        <p className="text-xs text-slate-400 dark:text-slate-500">Huseyin SIHAT tarafından geliştirilmiştir.</p>
      </footer>
    </div>
  );
}

export default App;
