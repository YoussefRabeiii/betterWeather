import { NextRequest, NextResponse } from "next/server";
import { clientIpFromHeaders, resolveGeo } from "@/lib/loadWeather";

export async function GET(req: NextRequest) {
	const geo = await resolveGeo(clientIpFromHeaders(req.headers));
	return NextResponse.json(geo);
}
