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
	/** When false, keep the island hidden (avoids layout jump). */
	visible?: boolean;
	/**
	 * `inline` — scrolls with mobile content.
	 * `rail` — fixed left dock on desktop.
	 */
	layout?: "inline" | "rail";
};

export function EffectPicker({
	active,
	override,
	theme,
	onSelect,
	visible = true,
	layout = "rail",
}: EffectPickerProps) {
	const selected = override ?? active;
	const htmlInCanvas = useSyncExternalStore(
		emptySubscribe,
		supportsHtmlInCanvas,
		() => false,
	);

	const shell =
		layout === "inline"
			? "relative z-10 w-full rounded-2xl px-3 py-2.5"
			: "fixed z-50 left-[max(0.75rem,env(safe-area-inset-left))] top-[max(5.75rem,calc(50%-10.75rem))] w-auto min-w-[11.75rem] max-w-[13rem] rounded-2xl px-3 py-3 backdrop-blur-xl";

	return (
		<div
			className={`${shell} border shadow-2xl transition-opacity duration-500 ${
				visible
					? "pointer-events-auto opacity-100"
					: "pointer-events-none opacity-0"
			}`}
			style={{
				/* Solid fill when inline — backdrop-blur inside html-in-canvas paints a huge blur band. */
				background:
					layout === "inline"
						? "rgba(8, 12, 18, 0.94)"
						: "rgba(8, 12, 18, 0.82)",
				borderColor: "rgba(255,255,255,0.14)",
				color: "#f4f7fb",
				boxShadow: `0 16px 50px ${theme.glow}`,
			}}
			aria-hidden={!visible}>
			<div
				className={
					layout === "inline"
						? "mb-2 flex items-center justify-between gap-2 px-0.5"
						: "mb-2 flex flex-col items-stretch gap-2 px-1"
				}>
				<div
					className={
						layout === "inline"
							? "flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1"
							: "flex flex-col items-start gap-1.5"
					}>
					<p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
						Effects
					</p>
					<p
						className="inline-flex items-center gap-1.5 text-[11px] font-medium leading-snug"
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
							html-in-canvas{" "}
							{htmlInCanvas ? "available" : "not available"}
						</span>
					</p>
				</div>
				<button
					type="button"
					onClick={() => onSelect(null)}
					className="shrink-0 text-left text-xs font-medium text-white/80 underline-offset-2 transition hover:text-white hover:underline disabled:no-underline disabled:opacity-40"
					disabled={override === null || !visible}>
					Live weather
				</button>
			</div>
			{!htmlInCanvas && layout === "rail" ? (
				<p className="mb-2 px-1 text-[11px] leading-snug text-white/55">
					Full glass refraction needs Chrome with{" "}
					<span className="text-white/80">
						chrome://flags/#canvas-draw-element
					</span>{" "}
					enabled, then restart. Fallback capture is active until then.
				</p>
			) : null}
			<div
				className={
					layout === "inline"
						? "flex flex-wrap gap-2"
						: "flex flex-col gap-1.5"
				}>
				{WEATHER_EFFECTS.map((effect) => {
					const isOn = selected === effect.id;
					const isLive = override === null && active === effect.id;
					return (
						<button
							key={effect.id}
							type="button"
							onClick={() => onSelect(effect.id)}
							disabled={!visible}
							className={
								layout === "inline"
									? "rounded-full px-3 py-1.5 text-sm font-medium transition"
									: "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-medium transition"
							}
							style={{
								background: isOn
									? "rgba(255,255,255,0.22)"
									: "rgba(255,255,255,0.08)",
								color: "#f7fafc",
								outline: isOn
									? `1px solid ${theme.panelAccent}`
									: "1px solid transparent",
							}}>
							<span>{effect.label}</span>
							{isLive ? (
								<span className="ml-1 text-[10px] uppercase tracking-wider text-white/60">
									live
								</span>
							) : layout === "rail" ? (
								<span
									className="ml-1 text-[10px] uppercase tracking-wider text-transparent"
									aria-hidden>
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
