import { NextRequest, NextResponse } from "next/server";
import { fetchWeatherAt } from "@/lib/loadWeather";

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
		const payload = await fetchWeatherAt({
			lat,
			lon,
			city: cityOverride || undefined,
			region: searchParams.get("region") ?? undefined,
			country: searchParams.get("country") ?? undefined,
		});

		if (!payload) {
			return NextResponse.json(
				{ error: "Failed to fetch weather" },
				{ status: 502 },
			);
		}

		return NextResponse.json(payload);
	} catch {
		return NextResponse.json(
			{ error: "Weather request failed" },
			{ status: 500 },
		);
	}
}
