import type { Province } from '../types';

export type UserCoordinates = {
  latitude: number;
  longitude: number;
};

const GEOLOCATION_TIMEOUT_MS = 5500;
const IP_LOOKUP_TIMEOUT_MS = 3500;

const toNumber = (value: unknown): number => Number(value);

const isValidCoordinate = (latitude: number, longitude: number) =>
  Number.isFinite(latitude) &&
  Number.isFinite(longitude) &&
  latitude >= -90 &&
  latitude <= 90 &&
  longitude >= -180 &&
  longitude <= 180;

const withTimeout = async <T>(promiseFactory: (signal: AbortSignal) => Promise<T>, timeoutMs: number): Promise<T> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await promiseFactory(controller.signal);
  } finally {
    clearTimeout(timeoutId);
  }
};

const getBrowserCoordinates = async (): Promise<UserCoordinates | null> => {
  if (typeof navigator === 'undefined' || !navigator.geolocation) return null;

  return new Promise((resolve) => {
    let settled = false;
    const timeoutId = setTimeout(() => {
      if (settled) return;
      settled = true;
      resolve(null);
    }, GEOLOCATION_TIMEOUT_MS);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        const latitude = Number(position.coords.latitude);
        const longitude = Number(position.coords.longitude);
        if (!isValidCoordinate(latitude, longitude)) {
          resolve(null);
          return;
        }
        resolve({ latitude, longitude });
      },
      () => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        resolve(null);
      },
      {
        enableHighAccuracy: false,
        timeout: GEOLOCATION_TIMEOUT_MS,
        maximumAge: 10 * 60 * 1000,
      }
    );
  });
};

const getIpCoordinates = async (): Promise<UserCoordinates | null> => {
  const providers: Array<{ url: string; parse: (data: unknown) => UserCoordinates | null }> = [
    {
      url: 'https://ipapi.co/json/',
      parse: (data) => {
        const payload = data as { latitude?: unknown; longitude?: unknown } | null;
        const latitude = toNumber(payload?.latitude);
        const longitude = toNumber(payload?.longitude);
        return isValidCoordinate(latitude, longitude) ? { latitude, longitude } : null;
      },
    },
    {
      url: 'https://ipwho.is/',
      parse: (data) => {
        const payload = data as { latitude?: unknown; longitude?: unknown } | null;
        const latitude = toNumber(payload?.latitude);
        const longitude = toNumber(payload?.longitude);
        return isValidCoordinate(latitude, longitude) ? { latitude, longitude } : null;
      },
    },
  ];

  for (const provider of providers) {
    try {
      const response = await withTimeout(
        async (signal) => fetch(provider.url, { signal, headers: { Accept: 'application/json' } }),
        IP_LOOKUP_TIMEOUT_MS
      );

      if (!response.ok) continue;
      const data = await response.json();
      const coordinates = provider.parse(data);
      if (coordinates) return coordinates;
    } catch {
      // Silent fallback to next provider
    }
  }

  return null;
};

const toRadians = (value: number) => (value * Math.PI) / 180;

const haversineDistanceKm = (a: UserCoordinates, b: UserCoordinates): number => {
  const earthRadiusKm = 6371;
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);

  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return earthRadiusKm * c;
};

export const detectUserCoordinates = async (): Promise<UserCoordinates | null> => {
  const browserCoordinates = await getBrowserCoordinates();
  if (browserCoordinates) return browserCoordinates;
  return getIpCoordinates();
};

export const findNearestProvinceByCoordinates = (
  coordinates: UserCoordinates,
  provinces: Province[]
): Province | null => {
  let nearest: Province | null = null;
  let minDistance = Number.POSITIVE_INFINITY;

  provinces.forEach((province) => {
    const latitude = Number(province.coordinates?.latitude);
    const longitude = Number(province.coordinates?.longitude);
    if (!isValidCoordinate(latitude, longitude)) return;

    const distance = haversineDistanceKm(coordinates, { latitude, longitude });
    if (distance < minDistance) {
      minDistance = distance;
      nearest = province;
    }
  });

  return nearest;
};
