export type ArpMode = "up" | "down" | "updown" | "random";

export interface AirQualityData {
  pm25: number;
  pm10: number;
  no2: number;
  o3: number;
  so2: number;
  co: number;
  location: string;
  lastUpdated: string;
  sensors?: Array<{
    id: string;
    parameter: string;
    coordinates: { latitude: number; longitude: number } | null;
  }>;
}
