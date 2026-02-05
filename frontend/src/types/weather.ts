// TypeScript Types - Weather
export interface Temperature {
  current: number;
  min: number;
  max: number;
}

export interface WeatherMetrics {
  temperature: Temperature;
  precipitation: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  visibility: number;
}

export interface HourlyWeatherPoint {
  time: string;
  temperature: number;
  precipitation: number;
  windSpeed: number;
  humidity: number;
  weatherCode: number;
}

export interface DailyWeatherPoint {
  date: string;
  tempMax: number;
  tempMin: number;
  precipitation: number;
  weatherCode: number;
}

export interface WeatherData {
  hourly?: {
    time: string[];
    temperature_2m: number[];
    apparent_temperature?: number[];
    precipitation: number[];
    wind_speed_10m: number[];
    wind_direction_10m?: number[];
    relative_humidity_2m: number[];
    pressure_msl?: number[];
    visibility?: number[];
    cloud_cover?: number[];
    weather_code?: number[];
  };
  daily?: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    weather_code?: number[];
  };
}

export interface WeatherResponse {
  province: string;
  plate_code: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  timezone: string;
  data: WeatherData;
  timestamp: string;
}
