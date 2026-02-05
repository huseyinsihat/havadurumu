import { create } from 'zustand';
import type { Province, WeatherResponse } from '../types';

interface WeatherState {
  // Data
  provinces: Province[];
  selectedProvince: Province | null;
  selectedPlateCode: string | null;
  weatherData: WeatherResponse | null;
  currentWeather: Record<
    string,
    { temperature: number; precipitation: number; humidity: number; wind_speed: number; name?: string }
  > | null;

  // UI State
  isLoading: boolean;
  error: string | null;
  selectedDateRange: {
    startDate: string;
    endDate: string;
  };
  hourlyMode: boolean;

  // Actions
  setProvinces: (provinces: Province[]) => void;
  setSelectedProvince: (province: Province | null, plateCode: string | null) => void;
  setWeatherData: (data: WeatherResponse | null) => void;
  setCurrentWeather: (
    data: Record<
      string,
      { temperature: number; precipitation: number; humidity: number; wind_speed: number; name?: string }
    > | null
  ) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setDateRange: (startDate: string, endDate: string) => void;
  setHourlyMode: (hourly: boolean) => void;
  reset: () => void;
}

export const useWeatherStore = create<WeatherState>((set) => ({
  // Initial state
  provinces: [],
  selectedProvince: null,
  selectedPlateCode: null,
  weatherData: null,
  currentWeather: null,
  isLoading: false,
  error: null,
  selectedDateRange: {
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  },
  hourlyMode: true,

  // Actions
  setProvinces: (provinces) => set({ provinces }),
  setSelectedProvince: (province, plateCode) =>
    set({ selectedProvince: province, selectedPlateCode: plateCode }),
  setWeatherData: (data) => set({ weatherData: data }),
  setCurrentWeather: (data) => set({ currentWeather: data }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setDateRange: (startDate, endDate) =>
    set({
      selectedDateRange: { startDate, endDate },
    }),
  setHourlyMode: (hourly) => set({ hourlyMode: hourly }),
  reset: () =>
    set({
      selectedProvince: null,
      selectedPlateCode: null,
      weatherData: null,
      error: null,
    }),
}));
