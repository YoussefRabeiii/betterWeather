import { MAJOR_CITIES } from "@/lib/cities";
import {
	normalizeWeather,
	type GeoPayload,
	type WeatherPayload,
} from "@/lib/weather";

const GEO_FALLBACK: GeoPayload = {
	city: "London",
	region: "England",
	country: "United Kingdom",
	lat: 51.5074,
	lon: -0.1278,
	source: "fallback",
};

type OpenMeteoResponse = {
	timezone?: string;
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

function isPrivateIp(ip: string): boolean {
	if (ip === "::1" || ip === "127.0.0.1") return true;
	if (ip.startsWith("10.") || ip.startsWith("192.168.")) return true;
	if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)) return true;
	return false;
}

export function clientIpFromHeaders(headers: Headers): string | null {
	const forwarded = headers.get("x-forwarded-for");
	if (forwarded) {
		const first = forwarded.split(",")[0]?.trim();
		if (first) return first;
	}
	const real = headers.get("x-real-ip");
	if (real) return real.trim();
	return null;
}

export async function resolveGeo(ip: string | null): Promise<GeoPayload> {
	const lookupUrl =
		!ip || isPrivateIp(ip)
			? "https://ipwho.is/"
			: `https://ipwho.is/${encodeURIComponent(ip)}`;

	try {
		const res = await fetch(lookupUrl, {
			headers: { Accept: "application/json" },
			cache: "no-store",
		});
		if (!res.ok) return GEO_FALLBACK;

		const data = (await res.json()) as {
			success?: boolean;
			city?: string;
			region?: string;
			country?: string;
			latitude?: number;
			longitude?: number;
		};

		if (
			!data.success ||
			typeof data.latitude !== "number" ||
			typeof data.longitude !== "number"
		) {
			return GEO_FALLBACK;
		}

		return {
			city: data.city || GEO_FALLBACK.city,
			region: data.region,
			country: data.country,
			lat: data.latitude,
			lon: data.longitude,
			source: "ip",
		};
	} catch {
		return GEO_FALLBACK;
	}
}

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

export async function fetchWeatherAt(params: {
	lat: number;
	lon: number;
	city?: string;
	region?: string;
	country?: string;
}): Promise<WeatherPayload | null> {
	const { lat, lon } = params;
	if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

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

		const cityOverride = params.city?.trim();
		const [weatherRes, place] = await Promise.all([
			fetch(weatherUrl, { next: { revalidate: 600 } }),
			cityOverride
				? Promise.resolve({
						city: cityOverride,
						region: params.region,
						country: params.country,
					})
				: reverseGeocode(lat, lon),
		]);

		if (!weatherRes.ok) return null;
		const data = (await weatherRes.json()) as OpenMeteoResponse;
		const current = data.current;
		if (!current || typeof current.temperature_2m !== "number") return null;

		return normalizeWeather({
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
			timezone: data.timezone,
		});
	} catch {
		return null;
	}
}

export function matchMajorCityId(lat: number, lon: number): string | null {
	const matched = MAJOR_CITIES.find(
		(c) => Math.abs(c.lat - lat) < 1.5 && Math.abs(c.lon - lon) < 1.5,
	);
	return matched?.id ?? null;
}

export type InitialWeatherBundle = {
	weather: WeatherPayload;
	cityId: string | null;
	geo: GeoPayload;
};

/** Resolve IP geo + live weather for first paint (SSR). */
export async function loadInitialWeather(
	headers: Headers,
): Promise<InitialWeatherBundle | null> {
	const geo = await resolveGeo(clientIpFromHeaders(headers));
	const weather = await fetchWeatherAt({
		lat: geo.lat,
		lon: geo.lon,
		city: geo.city,
		region: geo.region,
		country: geo.country,
	});
	if (!weather) return null;
	return {
		weather,
		cityId: matchMajorCityId(geo.lat, geo.lon),
		geo,
	};
}
