"use client";

import { useSyncExternalStore } from "react";
import { supportsHtmlInCanvas } from "@/components/canvasui/Droplets";
import {
	WEATHER_EFFECTS,
	type AtmosphereTheme,
	type WeatherEffect,
} from "@/lib/weather";

const emptySubscribe = () => () => {};

type EffectPickerProps = {
	active: WeatherEffect;
	override: WeatherEffect | null;
	theme: AtmosphereTheme;
	onSelect: (effect: WeatherEffect | null) => void;
};

export function EffectPicker({
	active,
	override,
	theme,
	onSelect,
}: EffectPickerProps) {
	const selected = override ?? active;
	const htmlInCanvas = useSyncExternalStore(
		emptySubscribe,
		supportsHtmlInCanvas,
		() => false,
	);

	return (
		<div
			className="fixed bottom-4 left-1/2 z-50 w-[min(960px,calc(100%-1.5rem))] -translate-x-1/2 rounded-2xl border px-3 py-3 shadow-2xl backdrop-blur-xl sm:px-4"
			style={{
				background: "rgba(8, 12, 18, 0.82)",
				borderColor: "rgba(255,255,255,0.14)",
				color: "#f4f7fb",
				boxShadow: `0 16px 50px ${theme.glow}`,
			}}>
			<div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-1">
				<div className="flex flex-wrap items-center gap-x-3 gap-y-1">
					<p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
						Test effects
					</p>
					<p
						className="inline-flex items-center gap-1.5 text-[11px] font-medium"
						title={
							htmlInCanvas
								? "html-in-canvas is available — full live DOM refraction"
								: "Enable chrome://flags/#canvas-draw-element and restart Chrome for full effects"
						}>
						<span
							className="size-1.5 shrink-0 rounded-full"
							style={{
								background: htmlInCanvas ? "#6ddc8c" : "#f0a35e",
								boxShadow: htmlInCanvas
									? "0 0 8px rgba(109, 220, 140, 0.7)"
									: "0 0 8px rgba(240, 163, 94, 0.7)",
							}}
							aria-hidden
						/>
						<span style={{ color: htmlInCanvas ? "#b8f0c8" : "#ffd2a8" }}>
							html-in-canvas {htmlInCanvas ? "available" : "not available"}
						</span>
					</p>
				</div>
				<button
					type="button"
					onClick={() => onSelect(null)}
					className="text-xs font-medium text-white/80 underline-offset-2 transition hover:text-white hover:underline disabled:no-underline disabled:opacity-40"
					disabled={override === null}>
					Use live weather
				</button>
			</div>
			{!htmlInCanvas ? (
				<p className="mb-2 px-1 text-[11px] leading-snug text-white/55">
					Full glass refraction needs Chrome with{" "}
					<span className="text-white/80">
						chrome://flags/#canvas-draw-element
					</span>{" "}
					enabled, then restart. Fallback capture is active until then.
				</p>
			) : null}
			<div className="flex flex-wrap gap-2">
				{WEATHER_EFFECTS.map((effect) => {
					const isOn = selected === effect.id;
					const isLive = override === null && active === effect.id;
					return (
						<button
							key={effect.id}
							type="button"
							onClick={() => onSelect(effect.id)}
							className="rounded-full px-3 py-1.5 text-sm font-medium transition"
							style={{
								background: isOn
									? "rgba(255,255,255,0.22)"
									: "rgba(255,255,255,0.08)",
								color: "#f7fafc",
								outline: isOn
									? `1px solid ${theme.panelAccent}`
									: "1px solid transparent",
							}}>
							{effect.label}
							{isLive ? (
								<span className="ml-1 text-[10px] uppercase tracking-wider text-white/60">
									live
								</span>
							) : null}
						</button>
					);
				})}
			</div>
		</div>
	);
}
