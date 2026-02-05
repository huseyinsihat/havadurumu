import axios from 'axios';
import type { AxiosError } from 'axios';
import type { WeatherResponse, Province } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const REQUEST_RETRY_COUNT = 2;
const REQUEST_RETRY_DELAY_MS = 600;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const extractAxiosError = (error: unknown): AxiosError | null => {
  return axios.isAxiosError(error) ? error : null;
};

const shouldRetryRequest = (error: unknown) => {
  const axiosError = extractAxiosError(error);
  const status = axiosError?.response?.status;
  if (!status) return true;
  return status >= 500 || status === 429;
};

const requestWithRetry = async <T>(request: () => Promise<T>, retries = REQUEST_RETRY_COUNT): Promise<T> => {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await request();
    } catch (error) {
      lastError = error;
      if (attempt >= retries || !shouldRetryRequest(error)) {
        break;
      }
      await sleep(REQUEST_RETRY_DELAY_MS * (attempt + 1));
    }
  }

  throw lastError;
};

export const weatherApi = {
  getProvinces: async (): Promise<{ provinces: Province[]; total: number }> => {
    const response = await requestWithRetry(() => apiClient.get('/provinces'));
    return response.data;
  },

  getProvince: async (plateCode: string): Promise<Province> => {
    const response = await requestWithRetry(() => apiClient.get(`/provinces/${plateCode}`));
    return response.data;
  },

  getWeather: async (
    province: string,
    startDate: string,
    endDate?: string,
    hourly: boolean = true
  ): Promise<WeatherResponse> => {
    if (!province) {
      throw new Error('Il kodu belirtilmedi');
    }

    const params = {
      province: String(province).padStart(2, '0'),
      start_date: startDate,
      end_date: endDate || startDate,
      hourly: hourly ? 'true' : 'false',
    };

    try {
      const response = await requestWithRetry(() => apiClient.get('/weather', { params, timeout: 25000 }));
      return response.data;
    } catch (error) {
      const axiosError = extractAxiosError(error);
      const status = axiosError?.response?.status ?? 'Unknown';
      const detail = (axiosError?.response?.data as { detail?: string } | undefined)?.detail;
      const message = detail || axiosError?.message || (error instanceof Error ? error.message : 'Bilinmeyen hata');

      throw new Error(`Hava durumu alinamadi (${status}): ${message}`);
    }
  },

  getCurrentWeather: async () => {
    const response = await requestWithRetry(() => apiClient.get('/weather/current'));
    return response.data;
  },

  getWeatherSnapshot: async (date: string, time: string) => {
    const response = await requestWithRetry(
      () =>
        apiClient.get('/weather/snapshot', {
          params: { date, time },
          timeout: 120000,
        }),
      1
    );
    return response.data;
  },

  health: async () => {
    const response = await requestWithRetry(() => apiClient.get('/health'));
    return response.data;
  },
};

export default weatherApi;
