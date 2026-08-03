import { NextRequest, NextResponse } from "next/server";
import { normalizeWeather, type WeatherPayload } from "@/lib/weather";

type OpenMeteoResponse = {
  current?: {
    temperature_2m?: number;
    apparent_temperature?: number;
    relative_humidity_2m?: number;
    precipitation?: number;
    weather_code?: number;
    wind_speed_10m?: number;
    is_day?: number;
  };
};

type ReverseGeoResponse = {
  city?: string;
  locality?: string;
  principalSubdivision?: string;
  countryName?: string;
};

async function reverseGeocode(lat: number, lon: number) {
  const url = new URL(
    "https://api.bigdatacloud.net/data/reverse-geocode-client",
  );
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set("localityLanguage", "en");

  const res = await fetch(url.toString(), { next: { revalidate: 86400 } });
  if (!res.ok) return null;
  const data = (await res.json()) as ReverseGeoResponse;
  const city = data.city || data.locality;
  if (!city) return null;
  return {
    city,
    region: data.principalSubdivision,
    country: data.countryName,
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const lat = Number(searchParams.get("lat"));
  const lon = Number(searchParams.get("lon"));
  const cityOverride = searchParams.get("city")?.trim();

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json(
      { error: "lat and lon are required numbers" },
      { status: 400 },
    );
  }

  try {
    const weatherUrl = new URL("https://api.open-meteo.com/v1/forecast");
    weatherUrl.searchParams.set("latitude", String(lat));
    weatherUrl.searchParams.set("longitude", String(lon));
    weatherUrl.searchParams.set(
      "current",
      [
        "temperature_2m",
        "apparent_temperature",
        "relative_humidity_2m",
        "precipitation",
        "weather_code",
        "wind_speed_10m",
        "is_day",
      ].join(","),
    );
    weatherUrl.searchParams.set("wind_speed_unit", "kmh");
    weatherUrl.searchParams.set("timezone", "auto");

    const [weatherRes, place] = await Promise.all([
      fetch(weatherUrl, { next: { revalidate: 600 } }),
      cityOverride
        ? Promise.resolve({
            city: cityOverride,
            region: searchParams.get("region") ?? undefined,
            country: searchParams.get("country") ?? undefined,
          })
        : reverseGeocode(lat, lon),
    ]);

    if (!weatherRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch weather" },
        { status: 502 },
      );
    }

    const data = (await weatherRes.json()) as OpenMeteoResponse;
    const current = data.current;
    if (!current || typeof current.temperature_2m !== "number") {
      return NextResponse.json(
        { error: "Incomplete weather response" },
        { status: 502 },
      );
    }

    const payload: WeatherPayload = normalizeWeather({
      city: place?.city ?? "Unknown",
      region: place?.region,
      country: place?.country,
      lat,
      lon,
      temp: current.temperature_2m,
      feelsLike: current.apparent_temperature ?? current.temperature_2m,
      humidity: current.relative_humidity_2m ?? 0,
      wind: current.wind_speed_10m ?? 0,
      precip: current.precipitation ?? 0,
      code: current.weather_code ?? 0,
      isDay: (current.is_day ?? 1) === 1,
    });

    return NextResponse.json(payload);
  } catch {
    return NextResponse.json(
      { error: "Weather request failed" },
      { status: 500 },
    );
  }
}
