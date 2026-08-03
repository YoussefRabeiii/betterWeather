"use client";

import {
	useCallback,
	useEffect,
	useMemo,
	useState,
	useTransition,
} from "react";
import {
	WeatherGlobe,
	type PinColorMap,
} from "@/components/globe/WeatherGlobe";
import { EffectPicker } from "@/components/weather/EffectPicker";
import { IslandNav } from "@/components/weather/IslandNav";
import { MotionToggle } from "@/components/weather/MotionToggle";
import { SiteFooter } from "@/components/weather/SiteFooter";
import { SoundToggle } from "@/components/weather/SoundToggle";
import { WeatherPanel } from "@/components/weather/WeatherPanel";
import { WeatherStage } from "@/components/weather/WeatherStage";
import { useReducedMotionControls } from "@/hooks/usePrefersReducedMotion";
import { useWeatherAudio } from "@/hooks/useWeatherAudio";
import { MAJOR_CITIES } from "@/lib/cities";
import {
	bootstrapAtmosphere,
	clothAtmosphere,
	cloudsAtmosphere,
	dropletsAtmosphere,
	forgeAtmosphere,
	frostAtmosphere,
	atmosphereFor,
	pinColorForBucket,
	type GeoPayload,
	type WeatherEffect,
	type WeatherPayload,
} from "@/lib/weather";

function hexToRgb01(hex: string): [number, number, number] | null {
	const m = hex
		.trim()
		.replace("#", "")
		.match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
	if (!m) return null;
	return [
		parseInt(m[1], 16) / 255,
		parseInt(m[2], 16) / 255,
		parseInt(m[3], 16) / 255,
	];
}

/** Lift dark theme accents so pins stay readable on the globe. */
function boostPinColor(rgb: [number, number, number]): [number, number, number] {
	const luma = rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
	if (luma >= 0.45) return rgb;
	const t = (0.55 - luma) / 0.55;
	return [
		Math.min(1, rgb[0] + (1 - rgb[0]) * t * 0.85),
		Math.min(1, rgb[1] + (1 - rgb[1]) * t * 0.85),
		Math.min(1, rgb[2] + (1 - rgb[2]) * t * 0.85),
	];
}

async function fetchWeather(params: {
	lat: number;
	lon: number;
	city?: string;
	region?: string;
	country?: string;
}): Promise<WeatherPayload> {
	const url = new URL("/api/weather", window.location.origin);
	url.searchParams.set("lat", String(params.lat));
	url.searchParams.set("lon", String(params.lon));
	if (params.city) url.searchParams.set("city", params.city);
	if (params.region) url.searchParams.set("region", params.region);
	if (params.country) url.searchParams.set("country", params.country);

	const res = await fetch(url);
	if (!res.ok) throw new Error("Weather fetch failed");
	return res.json() as Promise<WeatherPayload>;
}

export function WeatherApp() {
	const [weather, setWeather] = useState<WeatherPayload | null>(null);
	const [activeCityId, setActiveCityId] = useState<string | null>(null);
	const [pinColors, setPinColors] = useState<PinColorMap>({});
	const [effectOverride, setEffectOverride] = useState<WeatherEffect | null>(
		null,
	);
	const [error, setError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	const activeEffect = effectOverride ?? weather?.effect ?? "blaze";
	const { enabled: soundOn, toggle: toggleSound } =
		useWeatherAudio(activeEffect);
	const { reducedMotion, toggle: toggleMotion } = useReducedMotionControls();

	const theme = useMemo(() => {
		if (!weather) return bootstrapAtmosphere();
		if (activeEffect === "flame-wrap") return forgeAtmosphere();
		if (activeEffect === "frost") return frostAtmosphere();
		if (activeEffect === "clouds") return cloudsAtmosphere();
		if (activeEffect === "cloth") return clothAtmosphere();
		if (activeEffect === "droplets") return dropletsAtmosphere();
		return atmosphereFor(weather.bucket, weather.isDay);
	}, [weather, activeEffect]);

	const loadLocation = useCallback(
		(params: {
			lat: number;
			lon: number;
			city?: string;
			region?: string;
			country?: string;
			cityId?: string | null;
		}) => {
			startTransition(() => {
				void (async () => {
					try {
						setError(null);
						const next = await fetchWeather(params);
						setWeather(next);
						setActiveCityId(params.cityId ?? null);
					} catch {
						setError("Could not load weather for that place.");
					}
				})();
			});
		},
		[],
	);

	useEffect(() => {
		let cancelled = false;

		(async () => {
			try {
				const geoRes = await fetch("/api/geo");
				const geo = (await geoRes.json()) as GeoPayload;
				if (cancelled) return;

				const matched = MAJOR_CITIES.find(
					(c) =>
						Math.abs(c.lat - geo.lat) < 1.5 && Math.abs(c.lon - geo.lon) < 1.5,
				);

				loadLocation({
					lat: geo.lat,
					lon: geo.lon,
					city: geo.city,
					region: geo.region,
					country: geo.country,
					cityId: matched?.id ?? null,
				});
			} catch {
				if (!cancelled) {
					setError("Could not detect your location.");
					loadLocation({
						lat: 51.5074,
						lon: -0.1278,
						city: "London",
						country: "United Kingdom",
						cityId: "london",
					});
				}
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [loadLocation]);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				const res = await fetch("/api/cities-weather");
				if (!res.ok) return;
				const data = (await res.json()) as {
					cities: Array<{ id: string; color: [number, number, number] }>;
				};
				if (cancelled || !data.cities) return;
				const next: PinColorMap = {};
				for (const city of data.cities) next[city.id] = city.color;
				setPinColors(next);
			} catch {
				// keep previous / empty colors
			}
		})();
		return () => {
			cancelled = true;
		};
	}, []);

	useEffect(() => {
		if (!weather || !activeCityId) return;
		setPinColors((prev) => ({
			...prev,
			[activeCityId]: pinColorForBucket(weather.bucket),
		}));
	}, [weather, activeCityId]);

	const selectCity = useCallback(
		(cityId: string) => {
			const city = MAJOR_CITIES.find((c) => c.id === cityId);
			if (!city) return;
			loadLocation({
				lat: city.lat,
				lon: city.lon,
				city: city.name,
				country: city.country,
				cityId: city.id,
			});
		},
		[loadLocation],
	);

	const markerColor = useMemo((): [number, number, number] => {
		const byEffect: Record<string, [number, number, number]> = {
			blaze: [1, 0.48, 0.12],
			"flame-wrap": [1, 0.42, 0.1],
			droplets: [0.35, 0.72, 1],
			frost: [0.82, 0.92, 1],
			clouds: [0.72, 0.82, 0.95],
			cloth: [0.3, 0.95, 0.72],
		};
		const effectPin = byEffect[activeEffect];
		if (effectPin) return effectPin;

		const fromTheme = hexToRgb01(theme.panelAccent) ?? hexToRgb01(theme.accent);
		return fromTheme ? boostPinColor(fromTheme) : [1, 0.72, 0.28];
	}, [theme.panelAccent, theme.accent, activeEffect]);

	const glowColor = useMemo((): [number, number, number] => {
		return [
			Math.min(1, markerColor[0] * 0.55 + 0.45),
			Math.min(1, markerColor[1] * 0.55 + 0.45),
			Math.min(1, markerColor[2] * 0.55 + 0.45),
		];
	}, [markerColor]);

	const flameOverflow =
		activeEffect === "flame-wrap" ? "overflow-visible" : "overflow-hidden";

	return (
		<div
			className="relative h-dvh max-h-dvh w-full transition-[background] duration-700"
			style={{ background: theme.gradient, color: theme.text }}>
			<WeatherStage
				weather={weather}
				effectOverride={effectOverride}
				backdrop={theme.gradient}
				className="absolute inset-0 h-full w-full">
				<main className="relative z-10 flex min-h-full w-full flex-col px-0 pb-[calc(7.5rem+env(safe-area-inset-bottom))] pt-[calc(4.25rem+env(safe-area-inset-top))] lg:justify-center lg:pb-6 lg:pt-[calc(4.5rem+env(safe-area-inset-top))]">
					<section className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 content-start items-start gap-6 px-4 sm:gap-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.9fr)] lg:content-center lg:items-center lg:gap-8 lg:px-12 lg:pl-[calc(11rem+env(safe-area-inset-left))]">
						<div
							className={`flex min-w-0 flex-col justify-center ${flameOverflow} lg:-translate-x-8 lg:overflow-visible`}>
							{weather ? (
								<WeatherPanel
									weather={weather}
									theme={theme}
									effect={activeEffect}
									loading={isPending}
								/>
							) : (
								<div
									className="flex max-w-xl flex-col gap-3 rounded-[28px] px-5 py-6 sm:px-7"
									style={{
										background: theme.surface,
										border: `1px solid ${theme.surfaceBorder}`,
										color: theme.text,
									}}>
									<p className="hidden font-[family-name:var(--font-display)] text-4xl tracking-tight sm:text-5xl lg:block">
										betterWeather
									</p>
									<p className="font-medium" style={{ color: theme.muted }}>
										Finding your sky…
									</p>
								</div>
							)}
							{error ? (
								<p
									className="mt-2 text-sm font-medium"
									style={{ color: theme.muted }}>
									{error}
								</p>
							) : null}
						</div>

						<div
							id="globe"
							className="flex min-w-0 flex-col items-center justify-center gap-3 sm:gap-4">
							<WeatherGlobe
								activeCityId={activeCityId}
								focusLat={weather?.lat}
								focusLon={weather?.lon}
								onSelectCity={selectCity}
								pinColors={pinColors}
								markerColor={markerColor}
								glowColor={glowColor}
								className="aspect-square w-[min(100%,42dvh,360px)] lg:w-[min(100%,52dvh,500px)]"
							/>

							<div className="mx-auto flex w-full max-w-md flex-wrap justify-center gap-x-1.5 gap-y-2.5 pb-1 lg:w-[min(100%,42dvh,400px)]">
								{MAJOR_CITIES.map((city) => {
									const active = city.id === activeCityId;
									return (
										<button
											key={city.id}
											type="button"
											onClick={() => selectCity(city.id)}
											className="rounded-full px-2.5 py-1 text-xs font-semibold transition sm:text-sm"
											style={{
												background: active
													? "rgba(255,255,255,0.95)"
													: "rgba(6,10,16,0.88)",
												color: active ? "#0a1016" : "#f7fafc",
												outline: active
													? `1px solid ${theme.accent}`
													: "1px solid rgba(255,255,255,0.4)",
												boxShadow: active
													? `0 0 0 1px ${theme.accent}, 0 4px 16px rgba(0,0,0,0.45)`
													: "0 2px 12px rgba(0,0,0,0.45)",
												textShadow: active
													? "none"
													: "0 1px 2px rgba(0,0,0,0.55)",
											}}>
											{city.name}
										</button>
									);
								})}
							</div>
						</div>
					</section>

					<SiteFooter glow={theme.glow} />
				</main>
			</WeatherStage>

			<IslandNav
				glow={theme.glow}
				leading={
					<>
						<SoundToggle enabled={soundOn} onToggle={toggleSound} />
						<MotionToggle reduced={reducedMotion} onToggle={toggleMotion} />
					</>
				}
			/>

			<EffectPicker
				active={weather?.effect ?? "blaze"}
				override={effectOverride}
				theme={theme}
				onSelect={setEffectOverride}
				visible={Boolean(weather)}
			/>
		</div>
	);
}
