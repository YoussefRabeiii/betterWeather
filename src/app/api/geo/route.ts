import { NextRequest, NextResponse } from "next/server";
import type { GeoPayload } from "@/lib/weather";

const FALLBACK: GeoPayload = {
  city: "London",
  region: "England",
  country: "United Kingdom",
  lat: 51.5074,
  lon: -0.1278,
  source: "fallback",
};

function clientIp(req: NextRequest): string | null {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return null;
}

function isPrivateIp(ip: string): boolean {
  if (ip === "::1" || ip === "127.0.0.1") return true;
  if (ip.startsWith("10.") || ip.startsWith("192.168.")) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)) return true;
  return false;
}

export async function GET(req: NextRequest) {
  const ip = clientIp(req);
  // For localhost/private IPs, hit ipwho.is without an IP so it uses the
  // outbound public address. Otherwise look up the forwarded client IP.
  const lookupUrl =
    !ip || isPrivateIp(ip)
      ? "https://ipwho.is/"
      : `https://ipwho.is/${encodeURIComponent(ip)}`;

  try {
    const res = await fetch(lookupUrl, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(FALLBACK);
    }

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
      return NextResponse.json(FALLBACK);
    }

    const payload: GeoPayload = {
      city: data.city || FALLBACK.city,
      region: data.region,
      country: data.country,
      lat: data.latitude,
      lon: data.longitude,
      source: "ip",
    };

    return NextResponse.json(payload);
  } catch {
    return NextResponse.json(FALLBACK);
  }
}
