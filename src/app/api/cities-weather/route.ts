import { NextResponse } from "next/server";
import { MAJOR_CITIES } from "@/lib/cities";
import {
  pinColorForBucket,
  resolveBucket,
  type WeatherBucket,
} from "@/lib/weather";

type OpenMeteoCurrent = {
  temperature_2m?: number;
  weather_code?: number;
  wind_speed_10m?: number;
};

type OpenMeteoLocation = {
  current?: OpenMeteoCurrent;
};

export type CityPinWeather = {
  id: string;
  bucket: WeatherBucket;
  color: [number, number, number];
};

export async function GET() {
  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set(
      "latitude",
      MAJOR_CITIES.map((c) => c.lat).join(","),
    );
    url.searchParams.set(
      "longitude",
      MAJOR_CITIES.map((c) => c.lon).join(","),
    );
    url.searchParams.set(
      "current",
      "temperature_2m,weather_code,wind_speed_10m",
    );
    url.searchParams.set("wind_speed_unit", "kmh");
    url.searchParams.set("timezone", "auto");

    const res = await fetch(url, { next: { revalidate: 600 } });
    if (!res.ok) {
      return NextResponse.json(
        { error: "Upstream weather fetch failed" },
        { status: 502 },
      );
    }

    const data = (await res.json()) as OpenMeteoLocation | OpenMeteoLocation[];
    const rows = Array.isArray(data) ? data : [data];

    const cities: CityPinWeather[] = MAJOR_CITIES.map((city, i) => {
      const current = rows[i]?.current;
      const bucket = resolveBucket({
        code: current?.weather_code ?? 2,
        temp: current?.temperature_2m ?? 20,
        wind: current?.wind_speed_10m ?? 0,
      });
      return {
        id: city.id,
        bucket,
        color: pinColorForBucket(bucket),
      };
    });

    return NextResponse.json({ cities });
  } catch {
    return NextResponse.json(
      { error: "Could not load city weather pins" },
      { status: 500 },
    );
  }
}
