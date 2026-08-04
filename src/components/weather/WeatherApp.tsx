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
	clothAtmosphere,
	cloudsAtmosphere,
	dropletsAtmosphere,
	forgeAtmosphere,
	frostAtmosphere,
	atmosphereFor,
	pinColorForBucket,
	type AtmosphereTheme,
	type GeoPayload,
	type WeatherEffect,
	type WeatherPayload,
} from "@/lib/weather";

function LoadingPanel({ theme }: { theme: AtmosphereTheme }) {
	return (
		<div
			className="relative max-w-[39.6rem] px-6 py-6 sm:px-8 sm:py-7"
			style={{
				background: "rgba(12, 18, 26, 0.96)",
				border: `1px solid ${theme.surfaceBorder}`,
				borderRadius: 31,
				boxShadow: "0 16px 40px rgba(15, 25, 40, 0.28)",
				color: theme.text,
			}}
			aria-busy
			aria-live="polite">
			<p className="hidden font-[family-name:var(--font-display)] text-[2.0625rem] font-bold leading-none tracking-tight sm:text-[2.475rem] lg:block lg:text-[3.3rem]">
				Better Weather
			</p>
			<div className="mt-3.5 flex flex-col gap-3 sm:mt-4.5">
				<div
					className="h-6 w-48 max-w-full animate-pulse rounded-md sm:h-7 sm:w-64"
					style={{ background: "rgba(255,255,255,0.12)" }}
				/>
				<div
					className="hidden h-4 w-72 max-w-full animate-pulse rounded-md sm:block"
					style={{ background: "rgba(255,255,255,0.08)" }}
				/>
				<div className="mt-1 flex items-end gap-6">
					<div
						className="h-14 w-24 animate-pulse rounded-lg sm:h-16 sm:w-28"
						style={{ background: "rgba(255,255,255,0.14)" }}
					/>
					<div className="flex flex-col gap-2 pb-1">
						<div
							className="h-3.5 w-36 animate-pulse rounded-md"
							style={{ background: "rgba(255,255,255,0.1)" }}
						/>
						<div
							className="h-3.5 w-44 animate-pulse rounded-md"
							style={{ background: "rgba(255,255,255,0.08)" }}
						/>
					</div>
				</div>
			</div>
			<p className="mt-4 text-sm font-medium" style={{ color: theme.muted }}>
				Reading the sky…
			</p>
		</div>
	);
}

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

type WeatherAppProps = {
	/** Server-resolved weather so first paint is real, not a stub. */
	initialWeather?: WeatherPayload | null;
	initialCityId?: string | null;
};

export function WeatherApp({
	initialWeather = null,
	initialCityId = null,
}: WeatherAppProps) {
	const [weather, setWeather] = useState<WeatherPayload | null>(
		initialWeather,
	);
	const [activeCityId, setActiveCityId] = useState<string | null>(
		initialCityId,
	);
	const [pinColors, setPinColors] = useState<PinColorMap>({});
	const [effectOverride, setEffectOverride] = useState<WeatherEffect | null>(
		null,
	);
	const [error, setError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	const activeEffect = effectOverride ?? weather?.effect ?? "clouds";
	const { enabled: soundOn, toggle: toggleSound } =
		useWeatherAudio(activeEffect);
	const { reducedMotion, toggle: toggleMotion } = useReducedMotionControls();

	const theme = useMemo(() => {
		if (!weather) return cloudsAtmosphere();
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
		// SSR already painted real weather — skip the empty-stub client boot.
		if (initialWeather) return;

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
	}, [initialWeather, loadLocation]);

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
			setEffectOverride(null);
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

	const effectPickerProps = {
		active: weather?.effect ?? ("clouds" as WeatherEffect),
		override: effectOverride,
		theme,
		onSelect: setEffectOverride,
		visible: Boolean(weather),
	};

	return (
		<div
			className="relative h-dvh max-h-dvh w-full transition-[background] duration-700"
			style={{ background: theme.gradient, color: theme.text }}>
			<WeatherStage
				weather={weather}
				effectOverride={effectOverride}
				backdrop={theme.gradient}
				className="absolute inset-0 h-full w-full">
				{/* Mobile: scrollable stack under the island nav. Desktop: centered two-col. */}
				<main
					className={`relative z-10 flex w-full flex-col px-0 lg:min-h-full lg:justify-center lg:pb-6 lg:pt-[calc(4.5rem+env(safe-area-inset-top))] ${
						activeEffect === "flame-wrap"
							? "pt-[calc(6.75rem+env(safe-area-inset-top))]"
							: "pt-[calc(5.5rem+env(safe-area-inset-top))]"
					} pb-[max(1.25rem,env(safe-area-inset-bottom))]`}>
					<section className="mx-auto grid w-full max-w-7xl grid-cols-1 content-start items-start gap-5 px-4 sm:gap-6 sm:px-8 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.9fr)] lg:content-center lg:items-center lg:gap-8 lg:px-12 lg:pl-[calc(13.5rem+env(safe-area-inset-left))]">
						<div
							className={`flex min-w-0 flex-col justify-center ${flameOverflow} lg:-translate-x-[calc(2rem+40px)] lg:overflow-visible`}>
							{weather ? (
								<WeatherPanel
									weather={weather}
									theme={theme}
									effect={activeEffect}
									loading={isPending}
								/>
							) : (
								<LoadingPanel theme={theme} />
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
								className="aspect-square w-[min(100%,48dvh,380px)] lg:w-[min(100%,52dvh,500px)]"
							/>

							<div className="mx-auto flex w-full max-w-md flex-wrap justify-center gap-x-1.5 gap-y-2.5 pb-1 lg:w-[min(100%,42dvh,400px)]">
								{MAJOR_CITIES.map((city) => {
									const active = city.id === activeCityId;
									return (
										<button
											key={city.id}
											type="button"
											onClick={() => selectCity(city.id)}
											className="cursor-pointer rounded-full px-2.5 py-1 text-xs font-semibold transition sm:text-sm"
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

							{/* Mobile: effects sit under the globe and scroll with the page. */}
							<div className="w-full max-w-md lg:hidden">
								<EffectPicker {...effectPickerProps} layout="inline" />
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

			{/* Desktop: left effects rail */}
			<div className="hidden lg:block">
				<EffectPicker {...effectPickerProps} layout="rail" />
			</div>
		</div>
	);
}
