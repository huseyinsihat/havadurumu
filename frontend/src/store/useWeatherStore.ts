import { create } from 'zustand';
import type { Province, WeatherResponse } from '../types';

type CurrentWeatherSnapshot = {
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

interface WeatherState {
  // Data
  provinces: Province[];
  selectedProvince: Province | null;
  selectedPlateCode: string | null;
  weatherData: WeatherResponse | null;
  currentWeather: Record<string, CurrentWeatherSnapshot> | null;

  // UI State
  isLoading: boolean;
  error: string | null;
  selectedDateRange: {
    startDate: string;
    endDate: string;
  };
  selectedTime: string;
  hourlyMode: boolean;

  // Actions
  setProvinces: (provinces: Province[]) => void;
  setSelectedProvince: (province: Province | null, plateCode: string | null) => void;
  setWeatherData: (data: WeatherResponse | null) => void;
  setCurrentWeather: (data: Record<string, CurrentWeatherSnapshot> | null) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setDateRange: (startDate: string, endDate: string) => void;
  setSelectedTime: (time: string) => void;
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
  selectedTime: new Date().toTimeString().split(' ')[0].slice(0, 5),
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
  setSelectedTime: (time) => set({ selectedTime: time }),
  setHourlyMode: (hourly) => set({ hourlyMode: hourly }),
  reset: () =>
    set({
      selectedProvince: null,
      selectedPlateCode: null,
      weatherData: null,
      error: null,
    }),
}));
