export type MajorCity = {
  id: string;
  name: string;
  country: string;
  lat: number;
  lon: number;
  /** IANA timezone for local clock display. */
  timezone: string;
};

/** Major cities for globe pins — lat/lon order matches COBE markers. */
export const MAJOR_CITIES: MajorCity[] = [
  {
    id: "nyc",
    name: "New York",
    country: "US",
    lat: 40.7128,
    lon: -74.006,
    timezone: "America/New_York",
  },
  {
    id: "la",
    name: "Los Angeles",
    country: "US",
    lat: 34.0522,
    lon: -118.2437,
    timezone: "America/Los_Angeles",
  },
  {
    id: "london",
    name: "London",
    country: "UK",
    lat: 51.5074,
    lon: -0.1278,
    timezone: "Europe/London",
  },
  {
    id: "paris",
    name: "Paris",
    country: "FR",
    lat: 48.8566,
    lon: 2.3522,
    timezone: "Europe/Paris",
  },
  {
    id: "cairo",
    name: "Cairo",
    country: "EG",
    lat: 30.0444,
    lon: 31.2357,
    timezone: "Africa/Cairo",
  },
  {
    id: "dubai",
    name: "Dubai",
    country: "AE",
    lat: 25.2048,
    lon: 55.2708,
    timezone: "Asia/Dubai",
  },
  {
    id: "mumbai",
    name: "Mumbai",
    country: "IN",
    lat: 19.076,
    lon: 72.8777,
    timezone: "Asia/Kolkata",
  },
  {
    id: "singapore",
    name: "Singapore",
    country: "SG",
    lat: 1.3521,
    lon: 103.8198,
    timezone: "Asia/Singapore",
  },
  {
    id: "tokyo",
    name: "Tokyo",
    country: "JP",
    lat: 35.6762,
    lon: 139.6503,
    timezone: "Asia/Tokyo",
  },
  {
    id: "sydney",
    name: "Sydney",
    country: "AU",
    lat: -33.8688,
    lon: 151.2093,
    timezone: "Australia/Sydney",
  },
  {
    id: "saopaulo",
    name: "São Paulo",
    country: "BR",
    lat: -23.5505,
    lon: -46.6333,
    timezone: "America/Sao_Paulo",
  },
  {
    id: "capetown",
    name: "Cape Town",
    country: "ZA",
    lat: -33.9249,
    lon: 18.4241,
    timezone: "Africa/Johannesburg",
  },
];

export function cityToMarker(city: MajorCity) {
  return {
    id: city.id,
    location: [city.lat, city.lon] as [number, number],
    size: 0.06,
  };
}

/** Local wall-clock time for a city (respects the viewer's 12/24h locale). */
export function formatCityTime(timezone: string, date: Date = new Date()) {
  return new Intl.DateTimeFormat(undefined, {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
