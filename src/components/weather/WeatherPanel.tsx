"use client";

import { useEffect, useState, type ReactNode } from "react";
import { FlameWrap } from "@/components/canvasui/FlameWrap";
import {
	celsiusToDisplay,
	TEMP_UNIT_KEY,
	windKmhToDisplay,
	windUnitLabel,
	type AtmosphereTheme,
	type TempUnit,
	type WeatherEffect,
	type WeatherPayload,
} from "@/lib/weather";

type WeatherPanelProps = {
	weather: WeatherPayload;
	theme: AtmosphereTheme;
	effect: WeatherEffect;
	loading?: boolean;
};

/** Solid-enough fill — translucent surfaces + canvas blur passes paint a huge haze band. */
function opaqueSurface(surface: string, alpha = 0.96): string {
	const m = surface.match(
		/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*[\d.]+)?\s*\)/i,
	);
	if (!m) return surface;
	return `rgba(${m[1]}, ${m[2]}, ${m[3]}, ${alpha})`;
}

function ReadoutShell({
	theme,
	children,
}: {
	theme: AtmosphereTheme;
	effect: WeatherEffect;
	children: ReactNode;
}) {
	// Avoid large colored glows — under html-in-canvas they smear into a blurry card bg.
	const shadow = "0 16px 40px rgba(15, 25, 40, 0.28)";

	return (
		<div
			className="relative max-w-[39.6rem] px-6 py-6 sm:px-8 sm:py-7"
			style={{
				background: opaqueSurface(theme.surface, 1),
				border: `1px solid ${theme.surfaceBorder}`,
				borderRadius: 31,
				boxShadow: shadow,
			}}>
			{children}
		</div>
	);
}

export function WeatherPanel({
	weather,
	theme,
	effect,
	loading,
}: WeatherPanelProps) {
	const [unit, setUnit] = useState<TempUnit>("C");
	const place = [weather.city, weather.country].filter(Boolean).join(", ");
	const displayTemp = Math.round(celsiusToDisplay(weather.temp, unit));
	const displayFeels = Math.round(celsiusToDisplay(weather.feelsLike, unit));
	const displayWind = Math.round(windKmhToDisplay(weather.wind, unit));
	const windLabel = windUnitLabel(unit);

	useEffect(() => {
		try {
			const stored = localStorage.getItem(TEMP_UNIT_KEY);
			if (stored === "C" || stored === "F") setUnit(stored);
		} catch {
			// ignore unavailable storage
		}
	}, []);

	const toggleUnit = () => {
		setUnit((prev) => {
			const next: TempUnit = prev === "C" ? "F" : "C";
			try {
				localStorage.setItem(TEMP_UNIT_KEY, next);
			} catch {
				// ignore unavailable storage
			}
			return next;
		});
	};

	const body = (
		<div
			className="relative z-10 flex flex-col items-start gap-3.5 sm:gap-4.5"
			style={{ color: theme.text }}
			aria-busy={loading || undefined}>
			{/* Island nav carries the mark on small screens — keep hero brand for lg+. */}
			<p
				className="animate-rise-in hidden font-[family-name:var(--font-display)] text-[2.0625rem] font-bold leading-none tracking-tight sm:text-[2.475rem] lg:block lg:text-[3.3rem]">
				Better Weather
			</p>

			<div className="animate-rise-in-delay flex flex-col gap-1.5">
				<h1 className="max-w-xl font-[family-name:var(--font-display)] text-[1.2375rem] font-semibold leading-tight tracking-tight sm:text-[1.375rem] lg:text-[1.65rem]">
					{weather.label} in {weather.city}
				</h1>
				<p
					className="hidden max-w-md text-[0.9625rem] font-medium sm:block"
					style={{ color: theme.muted }}>
					Live conditions painted with canvas effects — not another boring
					forecast tile.
				</p>
			</div>

			<div className="animate-rise-in-delay-2 flex flex-wrap items-end gap-x-7 gap-y-2">
				<button
					type="button"
					onClick={toggleUnit}
					aria-label={`Temperature in degrees ${unit === "C" ? "Celsius" : "Fahrenheit"}. Switch to ${unit === "C" ? "Fahrenheit" : "Celsius"}.`}
					title={`Switch to °${unit === "C" ? "F" : "C"}`}
					className="flex cursor-pointer items-start gap-1 rounded-lg border-0 bg-transparent p-0 text-left transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2"
					style={{ outlineColor: theme.accent }}>
					<span
						key={`${unit}-${effect}`}
						className="font-[family-name:var(--font-display)] text-[3.3rem] font-bold leading-none tabular-nums sm:text-[3.96rem]"
						style={{ color: theme.accent }}>
						{displayTemp}
					</span>
					<span
						className="pt-1.5 text-[1.2375rem] font-semibold"
						style={{ color: theme.muted }}>
						°{unit}
					</span>
				</button>

				<div
					className="flex flex-col gap-0.5 pb-0.5 text-[0.9625rem] font-medium"
					style={{ color: theme.muted }}>
					<span>{place}</span>
					<span>
						Feels {displayFeels}° · Wind {displayWind} {windLabel} ·
						Humidity {Math.round(weather.humidity)}%
					</span>
					<span className="text-[11px] font-semibold uppercase tracking-[0.18em]">
						effect · {effect.replace("-", " ")}
					</span>
				</div>
			</div>

			<p
				className="hidden text-[0.9625rem] font-semibold tracking-wide sm:block"
				style={{ color: theme.muted }}>
				Spin the globe — or tap a city pin
			</p>
		</div>
	);

	if (effect === "flame-wrap") {
		return (
			<FlameWrap
				// Hot yellow-white core reads on dark forge skies (not peach-on-peach)
				color={[1, 0.72, 0.18]}
				intensity={1.35}
				height={110}
				spread={14}
				radius={31}
				speed={0.45}
				scale={0.85}
				turbulence={0.6}
				sparks={1.7}
				sparkSize={0.45}
				sparkDensity={1.25}
				sparkSpeed={1.15}
				rim={2.6}
				melt={4}
				distortion={9}
				smoke={0.85}
				ember={2}
				scorch={0.25}
				// self-start: flex stretch was forcing the flame box to full viewport width
				className="w-fit max-w-full self-start"
				style={{ width: "fit-content", alignSelf: "flex-start" }}>
				<ReadoutShell theme={theme} effect={effect}>
					{body}
				</ReadoutShell>
			</FlameWrap>
		);
	}

	return (
		<ReadoutShell theme={theme} effect={effect}>
			{body}
		</ReadoutShell>
	);
}
