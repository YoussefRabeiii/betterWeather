export type MajorCity = {
  id: string;
  name: string;
  country: string;
  lat: number;
  lon: number;
};

/** Major cities for globe pins — lat/lon order matches COBE markers. */
export const MAJOR_CITIES: MajorCity[] = [
  { id: "nyc", name: "New York", country: "US", lat: 40.7128, lon: -74.006 },
  { id: "la", name: "Los Angeles", country: "US", lat: 34.0522, lon: -118.2437 },
  { id: "london", name: "London", country: "UK", lat: 51.5074, lon: -0.1278 },
  { id: "paris", name: "Paris", country: "FR", lat: 48.8566, lon: 2.3522 },
  { id: "cairo", name: "Cairo", country: "EG", lat: 30.0444, lon: 31.2357 },
  { id: "dubai", name: "Dubai", country: "AE", lat: 25.2048, lon: 55.2708 },
  { id: "mumbai", name: "Mumbai", country: "IN", lat: 19.076, lon: 72.8777 },
  { id: "singapore", name: "Singapore", country: "SG", lat: 1.3521, lon: 103.8198 },
  { id: "tokyo", name: "Tokyo", country: "JP", lat: 35.6762, lon: 139.6503 },
  { id: "sydney", name: "Sydney", country: "AU", lat: -33.8688, lon: 151.2093 },
  { id: "saopaulo", name: "São Paulo", country: "BR", lat: -23.5505, lon: -46.6333 },
  { id: "capetown", name: "Cape Town", country: "ZA", lat: -33.9249, lon: 18.4241 },
];

export function cityToMarker(city: MajorCity) {
  return {
    id: city.id,
    location: [city.lat, city.lon] as [number, number],
    size: 0.06,
  };
}
