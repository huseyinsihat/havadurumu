// TypeScript Types - Province
export interface ProvinceCoordinates {
  latitude: number;
  longitude: number;
}

export interface Province {
  name: string;
  name_en?: string;
  plate_code: string;
  region?: string;
  population?: number;
  area_km2?: number;
  elevation?: number;
  coordinates: ProvinceCoordinates;
}

export interface ProvinceFeature {
  type: string;
  properties: {
    name: string;
    name_tr?: string;
    plate_code: string;
    region?: string;
    population?: number;
    area_km2?: number;
  };
  geometry: {
    type: string;
    coordinates: number[][][][];
  };
}

export interface ProvinceGeoJSON {
  type: string;
  features: ProvinceFeature[];
}
