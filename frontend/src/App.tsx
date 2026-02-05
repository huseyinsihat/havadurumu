import { useCallback, useEffect, useMemo, useState } from 'react';
import type { GeoJsonObject } from 'geojson';
import { MapPin, TrendingUp, Search, X } from 'lucide-react';
import './App.css';
import { TurkeyMap } from './components/Map/TurkeyMap';
import Loading from './components/UI/Loading';
import Card from './components/UI/Card';
import Header from './components/Layout/Header';
import weatherApi from './services/weatherApi';
import { useWeatherStore } from './store/useWeatherStore';
import type { Province } from './types';
import WeatherCharts from './components/Weather/WeatherCharts';
import WeatherSummary from './components/Weather/WeatherSummary';

type RankingItem = {
  code: string;
  name: string;
  temperature: number;
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
    setProvinces,
    setSelectedProvince,
    setWeatherData,
    setCurrentWeather,
    setIsLoading,
    setError,
    setDateRange,
  } = useWeatherStore();

  const [geoJsonData, setGeoJsonData] = useState<GeoJsonObject | null>(null);
  const [searchText, setSearchText] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const provinceNameByCode = useMemo(() => {
    const map: Record<string, string> = {};
    provinces.forEach((province) => {
      map[String(province.plate_code).padStart(2, '0')] = province.name;
    });
    return map;
  }, [provinces]);

  const filteredProvinces = useMemo(() => {
    const query = searchText.trim().toLocaleLowerCase('tr');
    if (!query) return provinces;

    return provinces.filter(
      (province) =>
        province.name.toLocaleLowerCase('tr').includes(query) ||
        province.plate_code.includes(searchText.trim())
    );
  }, [provinces, searchText]);

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

  const selectedCurrentSnapshot = useMemo(() => {
    if (!selectedPlateCode || !currentWeather) return undefined;
    return currentWeather[selectedPlateCode];
  }, [selectedPlateCode, currentWeather]);

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
      total: rankingData.length,
      selected,
      hottest,
      coldest,
      average,
      diffFromAverage: selected.temperature - average,
      diffFromHottest: hottest.temperature - selected.temperature,
      diffFromColdest: selected.temperature - coldest.temperature,
    };
  }, [selectedPlateCode, rankingData]);

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

        setProvinces(provincesData);

        if (!geoJsonResponse.ok) {
          throw new Error('GeoJSON yuklenemedi.');
        }
        const geoJSON = await geoJsonResponse.json();
        setGeoJsonData(geoJSON);

        try {
          const current = await weatherApi.getCurrentWeather();
          const map: Record<
            string,
            { temperature: number; precipitation: number; humidity: number; wind_speed: number; name?: string }
          > = {};

          (current?.provinces || []).forEach(
            (province: {
              plate_code: string;
              temperature: number;
              precipitation: number;
              humidity: number;
              wind_speed: number;
              name?: string;
            }) => {
              if (!province?.plate_code) return;
              const normalizedCode = String(province.plate_code).padStart(2, '0');
              const temperature = Number(province.temperature);
              if (Number.isNaN(temperature)) return;

              map[normalizedCode] = {
                temperature,
                precipitation: Number(province.precipitation) || 0,
                humidity: Number(province.humidity) || 0,
                wind_speed: Number(province.wind_speed) || 0,
                name: province.name,
              };
            }
          );

          setCurrentWeather(map);
        } catch {
          setCurrentWeather(null);
          setError('Anlik veriler alinamadi. Harita verileri yuklenmeye devam ediyor.');
        }

        const defaultProvince =
          provincesData.find((province) => province.plate_code === '34') || provincesData[0] || null;

        if (defaultProvince) {
          const normalizedCode = String(defaultProvince.plate_code).padStart(2, '0');
          setSelectedProvince(defaultProvince, normalizedCode);
        }
      } catch (loadError) {
        const errorMessage =
          loadError instanceof Error ? loadError.message : 'Veri yukleme sirasinda beklenmeyen bir hata olustu.';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [setCurrentWeather, setError, setIsLoading, setProvinces, setSelectedProvince]);

  const handleProvinceSelect = useCallback(
    (plateCode: string, name: string) => {
      if (!plateCode || !name) {
        setError('Gecerli bir il secilmedi.');
        return;
      }

      const normalizedCode = String(plateCode).padStart(2, '0');
      const province =
        provinces.find((item) => String(item.plate_code).padStart(2, '0') === normalizedCode) ||
        ({
          name,
          plate_code: normalizedCode,
          coordinates: { latitude: 0, longitude: 0 },
        } as Province);

      setSelectedProvince(province, normalizedCode);
      setError(null);
    },
    [provinces, setError, setSelectedProvince]
  );

  useEffect(() => {
    const refreshSelected = async () => {
      if (!selectedPlateCode) return;

      try {
        setIsLoading(true);

        const weather = await weatherApi.getWeather(
          selectedPlateCode,
          selectedDateRange.startDate,
          selectedDateRange.endDate,
          true
        );

        setWeatherData(weather);
        setError(null);
      } catch (refreshError) {
        const hasCurrentFallback = Boolean(currentWeather?.[selectedPlateCode]);
        if (hasCurrentFallback) {
          setError('Detayli saatlik veri alinamadi. Anlik veri gosteriliyor.');
        } else {
          const errorMessage =
            refreshError instanceof Error ? refreshError.message : 'Hava durumu yuklenemedi. Lutfen tekrar deneyin.';
          setError(errorMessage);
        }
      } finally {
        setIsLoading(false);
      }
    };

    refreshSelected();
  }, [
    currentWeather,
    selectedDateRange.endDate,
    selectedDateRange.startDate,
    selectedPlateCode,
    setError,
    setIsLoading,
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
                <p className="font-semibold">Hata olustu</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700" aria-label="Hatayi kapat">
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
                  placeholder="Il adi veya plaka kodu yazin..."
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
                    aria-label="Aramayi temizle"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {showDropdown && (
                <div
                  className="absolute top-full left-0 right-0 mt-2 max-h-[300px] overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl z-[2000] animate-in fade-in slide-in-from-top-2 duration-200"
                  onClick={(event) => event.stopPropagation()}
                >
                  {filteredProvinces.map((province) => {
                    const normalizedCode = String(province.plate_code).padStart(2, '0');
                    const weather = currentWeather?.[normalizedCode];

                    return (
                      <button
                        key={province.plate_code}
                        onClick={() => {
                          handleProvinceSelect(province.plate_code, province.name);
                          setSearchText('');
                          setShowDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/40 border-b border-slate-100 dark:border-slate-700 last:border-b-0 transition-colors ${
                          selectedPlateCode === normalizedCode
                            ? 'bg-blue-50 dark:bg-blue-900/30 border-l-4 border-l-blue-500 pl-3'
                            : ''
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-slate-900 dark:text-slate-100">{province.name}</p>
                            <p className="text-xs text-slate-500">Plaka: {normalizedCode}</p>
                          </div>
                          {weather && (
                            <div className="text-right">
                              <span
                                className={`text-sm font-bold block ${
                                  weather.temperature > 30
                                    ? 'text-red-500'
                                    : weather.temperature > 20
                                      ? 'text-orange-500'
                                      : weather.temperature > 10
                                        ? 'text-yellow-500'
                                        : 'text-blue-500'
                                }`}
                              >
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
                      <p>Il bulunamadi</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <section>
          <Card title="Turkiye Haritasi" subtitle="Il secmek icin harita uzerinden tiklayin" icon={<MapPin className="w-6 h-6" />}>
            <div className="h-[500px] rounded-lg overflow-hidden relative">
              {isLoading && (
                <div className="absolute inset-0 z-10 bg-white/50 dark:bg-slate-900/50 flex items-center justify-center">
                  <Loading />
                </div>
              )}
              <TurkeyMap onProvinceSelect={handleProvinceSelect} geoJsonData={geoJsonData} currentTemps={currentWeather} />
            </div>
          </Card>
        </section>

        {selectedProvince && weatherData && (
          <section>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <WeatherCharts data={weatherData} hourlyMode chartType="temperature" />
              <WeatherCharts data={weatherData} hourlyMode chartType="precipitation" />
            </div>
          </section>
        )}

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card title="Tarih ve Saat">
            <div className="space-y-2.5">
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">Tarih</label>
                <input
                  type="date"
                  value={selectedDateRange.startDate}
                  onChange={(event) => setDateRange(event.target.value, event.target.value)}
                  min="1940-01-01"
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-2.5 py-1.5 rounded-lg text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">Saat</label>
                <input
                  type="time"
                  defaultValue={new Date().toTimeString().split(' ')[0].substring(0, 5)}
                  className="w-full px-2.5 py-1.5 rounded-lg text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 italic pt-1">Gercek Open-Meteo verisi</p>
            </div>
          </Card>

          {selectedProvince ? (
            <Card
              title={selectedProvince.name}
              subtitle={
                selectedComparison
                  ? `Plaka: ${selectedProvince.plate_code} | Sicaklik sirasi: ${selectedComparison.rank}/${selectedComparison.total}`
                  : `Plaka: ${selectedProvince.plate_code}`
              }
              icon={<TrendingUp className="w-5 h-5" />}
            >
              {weatherData && <WeatherSummary data={weatherData} current={selectedCurrentSnapshot} />}

              {selectedComparison && (
                <div className="mt-4 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 space-y-2">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Sehir sicaklik karsilastirmasi</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-md border border-slate-200 dark:border-slate-700 p-2 bg-white dark:bg-slate-800">
                      Turkiye ort.: <span className="font-semibold">{selectedComparison.average.toFixed(1)}°C</span>
                    </div>
                    <div className="rounded-md border border-slate-200 dark:border-slate-700 p-2 bg-white dark:bg-slate-800">
                      Ortalamaya fark:{' '}
                      <span className={`font-semibold ${selectedComparison.diffFromAverage >= 0 ? 'text-red-600' : 'text-blue-600'}`}>
                        {selectedComparison.diffFromAverage >= 0 ? '+' : ''}
                        {selectedComparison.diffFromAverage.toFixed(1)}°C
                      </span>
                    </div>
                    <div className="rounded-md border border-slate-200 dark:border-slate-700 p-2 bg-white dark:bg-slate-800">
                      En sicak ({selectedComparison.hottest.name}):{' '}
                      <span className="font-semibold">{selectedComparison.diffFromHottest.toFixed(1)}°C fark</span>
                    </div>
                    <div className="rounded-md border border-slate-200 dark:border-slate-700 p-2 bg-white dark:bg-slate-800">
                      En soguk ({selectedComparison.coldest.name}):{' '}
                      <span className="font-semibold">+{selectedComparison.diffFromColdest.toFixed(1)}°C ustunde</span>
                    </div>
                  </div>
                </div>
              )}

              {!weatherData && <div className="text-center py-4 text-slate-400 text-sm">Veri yukleniyor...</div>}
            </Card>
          ) : (
            <Card title="Il Secin" icon={<MapPin className="w-5 h-5" />}>
              <div className="text-center py-6 text-slate-400 text-sm">
                <p>Harita uzerinden bir il secin</p>
              </div>
            </Card>
          )}

          <Card title="Sicaklik Siralamasi" subtitle="Anlik veriler">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-semibold text-red-600 dark:text-red-400 mb-2">En Sicak</h4>
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

              <div>
                <h4 className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2">En Soguk</h4>
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
            </div>

            {rankingData.length === 0 && <div className="text-center py-4 text-slate-400 text-xs">Veri yukleniyor...</div>}
          </Card>
        </section>
      </main>

      <footer className="mt-12 pb-8 text-center text-slate-500 dark:text-slate-400 text-sm space-y-1">
        <p>© 2026 Turkiye Iklim Haritasi | Open-Meteo API</p>
        <p className="text-xs text-slate-400 dark:text-slate-500">Huseyin SIHAT tarafindan gelistirilmistir.</p>
      </footer>
    </div>
  );
}

export default App;
