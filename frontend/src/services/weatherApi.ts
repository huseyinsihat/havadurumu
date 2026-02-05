import axios from 'axios';
import type { WeatherResponse, Province } from '../types';

const API_BASE_URL = 'http://localhost:8000/api';
const REQUEST_RETRY_COUNT = 2;
const REQUEST_RETRY_DELAY_MS = 600;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const shouldRetryRequest = (error: any) => {
  const status = error?.response?.status;
  if (!status) return true;
  return status >= 500;
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
  // Tum illerin listesini al
  getProvinces: async (): Promise<{ provinces: Province[]; total: number }> => {
    const response = await requestWithRetry(() => apiClient.get('/provinces'));
    return response.data;
  },

  // Spesifik bir ili al
  getProvince: async (plateCode: string): Promise<Province> => {
    const response = await requestWithRetry(() => apiClient.get(`/provinces/${plateCode}`));
    return response.data;
  },

  // Secilen il icin hava durumu al
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

    console.log('%cAPI Request', 'color: blue; font-weight: bold', {
      endpoint: '/weather',
      params,
    });

    try {
      const response = await requestWithRetry(() => apiClient.get('/weather', { params }));
      console.log('%cWeather response OK', 'color: green; font-weight: bold', response.data);
      return response.data;
    } catch (error: any) {
      const msg = error.response?.data?.detail || error.message;
      const status = error.response?.status || 'Unknown';
      console.error('%cWeather API Error', 'color: red; font-weight: bold', {
        status,
        message: msg,
        params,
      });
      throw new Error(`Hava durumu alinamadi (${status}): ${msg}`);
    }
  },

  // Tum iller icin anlik hava durumu al
  getCurrentWeather: async () => {
    const response = await requestWithRetry(() => apiClient.get('/weather/current'));
    return response.data;
  },

  // Saglik kontrolu
  health: async () => {
    const response = await requestWithRetry(() => apiClient.get('/health'));
    return response.data;
  },
};

export default weatherApi;
