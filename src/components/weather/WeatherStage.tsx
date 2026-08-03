"use client";

import type { CSSProperties, ReactNode } from "react";
import { useSyncExternalStore } from "react";
import { Blaze } from "@/components/canvasui/Blaze";
import { Cloth } from "@/components/canvasui/Cloth";
import { Clouds } from "@/components/canvasui/Clouds";
import { Droplets, supportsHtmlInCanvas } from "@/components/canvasui/Droplets";
import { Frost } from "@/components/canvasui/Frost";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import type { WeatherEffect, WeatherPayload } from "@/lib/weather";

type WeatherStageProps = {
	weather: WeatherPayload | null;
	/** When set, overrides the weather-driven effect (test picker). */
	effectOverride?: WeatherEffect | null;
	/** Sky/gradient painted INSIDE the effect so html-in-canvas can capture it. */
	backdrop: string;
	children: ReactNode;
	className?: string;
};

const emptySubscribe = () => () => {};

const MOBILE_MQ = "(max-width: 1023px)";

function subscribeMobile(onStoreChange: () => void) {
	const mq = window.matchMedia(MOBILE_MQ);
	mq.addEventListener("change", onStoreChange);
	return () => mq.removeEventListener("change", onStoreChange);
}

function getIsMobile() {
	return window.matchMedia(MOBILE_MQ).matches;
}

function stageStyle(className?: string) {
	return {
		className: className ?? "h-full w-full",
		style: { height: "100%", width: "100%" } as const,
	};
}

const FILL = {
	className: "h-full w-full",
	style: { height: "100%", width: "100%" } as const,
};

/** Full-bleed scenery that lives inside the canvas content tree. */
function Scene({
	backdrop,
	photo,
	overlay,
	baseColor = "#1a222c",
	photoFirst = false,
	children,
}: {
	backdrop: string;
	photo?: string;
	overlay?: string;
	baseColor?: string;
	/** Put the photo as the dominant layer (Droplets refraction). */
	photoFirst?: boolean;
	children: ReactNode;
}) {
	const layers = photoFirst
		? [
				overlay ??
					"linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%)",
				backdrop,
				photo ? `url(${photo})` : "",
			]
		: [
				overlay ??
					"radial-gradient(circle at 20% 20%, rgba(255,255,255,0.1), transparent 42%), radial-gradient(circle at 80% 0%, rgba(255,255,255,0.06), transparent 36%)",
				backdrop,
				photo ? `url(${photo})` : "",
			];

	const style: CSSProperties = {
		height: "100%",
		width: "100%",
		backgroundColor: baseColor,
		backgroundImage: layers.filter(Boolean).join(", "),
		backgroundSize: photo ? "auto, auto, cover" : "auto, auto",
		backgroundPosition: "center",
		backgroundRepeat: "no-repeat",
	};

	return (
		<div className="relative h-full w-full overflow-hidden" style={style}>
			<div className="sky-noise absolute inset-0" aria-hidden />
			{/* Scrollport: content can grow past the viewport so mobile can scroll. */}
			<div className="relative z-10 h-full min-h-0 w-full overflow-x-clip overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]">
				{children}
			</div>
		</div>
	);
}

/**
 * Blaze + Cloth only when html-in-canvas is OFF.
 * Nesting two layoutsubtree canvases breaks native capture.
 */
function HeatStage({
	layout,
	blaze,
	cloth,
	prefer,
	native,
	children,
}: {
	layout: ReturnType<typeof stageStyle>;
	blaze: Record<string, unknown>;
	cloth: Record<string, unknown>;
	prefer: "blaze" | "cloth";
	native: boolean;
	children: ReactNode;
}) {
	if (native) {
		if (prefer === "cloth") {
			return (
				<Cloth {...layout} {...cloth}>
					{children}
				</Cloth>
			);
		}
		return (
			<Blaze {...layout} {...blaze}>
				{children}
			</Blaze>
		);
	}

	return (
		<Blaze {...layout} {...blaze}>
			<Cloth {...FILL} {...cloth}>
				{children}
			</Cloth>
		</Blaze>
	);
}

/** Stable Clouds config — avoid setOptions thrash when weather updates. */
const CLOUDS_OPTIONS = {
	scale: 1,
	speed: 0.55,
	cover: 0.18,
	density: 2.0,
	shading: 0.32,
	color: [0.9, 0.93, 0.97] as [number, number, number],
	opacity: 0.72,
	shadow: 0.14,
	shadowOffsetX: 180,
	shadowOffsetY: -10,
	shadowSoftness: 1,
	wind: 0.55,
	windRadius: 350,
	refraction: 0,
	fogBlur: 0.04,
	quality: 0.85,
};

function effectOptions(
	weather: WeatherPayload,
	reducedMotion: boolean,
	isMobile: boolean,
) {
	const precipBoost = Math.min(1, weather.precip / 5);
	const windBoost = Math.min(1, weather.wind / 80);
	const brushScale = isMobile ? 0.55 : 1;
	const dropScale = isMobile ? 0.7 : 1;

	const blazeHeat = {
		height: 0.97,
		distortion: reducedMotion ? 0.35 : 0.6,
		distortionScale: 0.5,
		speed: reducedMotion ? 0 : 1,
		sparks: reducedMotion ? 0 : 0.5,
		sparkDensity: reducedMotion ? 0 : 1.5,
		sparkSize: 1,
		layers: reducedMotion ? 2 : 4,
		smoke: reducedMotion ? 0.25 : 0.5,
		glow: reducedMotion ? 0.9 : 1.5,
		sparkColor: [1, 0.4, 0.05] as [number, number, number],
		smokeColor: [1, 0.43, 0.1] as [number, number, number],
	};

	return {
		blaze: {
			...blazeHeat,
			sparks: reducedMotion ? 0 : weather.isDay ? 0.55 : 0.3,
			glow: weather.isDay
				? reducedMotion
					? 1
					: 1.5
				: reducedMotion
					? 0.7
					: 0.9,
		},
		blazeCloth: {
			pin: "top" as const,
			wind: reducedMotion ? 0 : 0.35,
			speed: reducedMotion ? 0 : 0.85,
			amplitude: reducedMotion ? 0 : 12,
			drape: 16,
			brush: 0.35 * brushScale,
			brushSize: isMobile ? 90 : 150,
			cornerRadius: 0,
			light: 0.45,
			sheen: 0.25,
			damping: 0.08,
		},
		"flame-wrap": {
			...blazeHeat,
			height: 0.7,
			distortion: reducedMotion ? 0.25 : 0.4,
			sparks: reducedMotion ? 0 : 0.3,
			smoke: reducedMotion ? 0.2 : 0.35,
			glow: reducedMotion ? 0.75 : 1.1,
			layers: reducedMotion ? 2 : 3,
		},
		flameCloth: {
			pin: "top" as const,
			wind: reducedMotion ? 0 : 0.28,
			speed: reducedMotion ? 0 : 0.7,
			amplitude: reducedMotion ? 0 : 10,
			drape: 14,
			brush: 0.25 * brushScale,
			brushSize: isMobile ? 80 : 140,
			cornerRadius: 0,
			light: 0.4,
			sheen: 0.2,
			damping: 0.1,
		},
		clouds: {
			...CLOUDS_OPTIONS,
			speed: reducedMotion ? 0 : CLOUDS_OPTIONS.speed,
			wind: reducedMotion ? 0 : CLOUDS_OPTIONS.wind,
		},
		droplets: {
			intensity: 0.75 + precipBoost * 0.35,
			speed: reducedMotion ? 0 : 1,
			scale: isMobile ? 0.28 : 0.38,
			dropWidth: 1.15 * dropScale,
			dropLength: 1.25 * dropScale,
			refraction: 0.42,
			blur: 0.2,
			vignette: 0.12,
			fallSpeed: reducedMotion ? 0 : 1,
			wiggle: reducedMotion ? 0 : 1.15,
			staticDrops: reducedMotion ? 0.85 : 0.45,
			tint: [1, 1, 1] as [number, number, number],
			tintStrength: 0,
			interactive: !reducedMotion,
			interactionRadius: isMobile ? 0.18 : 0.32,
			interactionStrength: isMobile ? 0.5 : 0.65,
			interactionDistortion: isMobile ? 2.4 : 3.2,
		},
		frost: {
			frost: 0.08,
			strength: 0.85,
			contrast: 3.2,
			crispness: 1.15,
			highlight: 0.45,
			highlightStrength: 0.9,
			haze: 0.45,
			tintThin: [0.82, 0.86, 1.05] as [number, number, number],
			tintThick: [0.92, 0.96, 1.1] as [number, number, number],
			tintStrength: 0.28,
			saturation: 1.15,
			brightness: 0.88,
			refraction: 1.15,
			ior: 1.31,
			detail: 2.2,
			textureScale: 2,
			fresnel: 0.9,
			meltRadius: isMobile ? 0.16 : 0.28,
			meltNoise: 0.3,
			meltStrength: 0.8,
			refreeze: 10,
			edgeFade: 0.12,
			meltEdges: !reducedMotion,
			introDuration: reducedMotion ? 0 : 2.5,
			opacity: 0.72,
			shimmer: reducedMotion ? 0 : 0.25,
			quality: 1,
			// Keep footer chrome readable — center stays fully iced.
			footerClear: 0.22,
		},
		cloth: {
			pin: "top" as const,
			wind: reducedMotion ? 0 : 0.75 + windBoost * 0.25,
			speed: reducedMotion ? 0 : 1.15 + windBoost,
			amplitude: reducedMotion ? 0 : 26 + windBoost * 12,
			drape: 32,
			brush: reducedMotion ? 0 : 1.05 * brushScale,
			brushSize: isMobile ? 95 : 175,
			cornerRadius: 0,
			light: 0.65,
			sheen: 0.4,
			damping: 0.045,
			// Teal fabric backing so empty regions still read as cloth, not white void
			backing: [0.18, 0.32, 0.28] as [number, number, number],
		},
		clothBlaze: {
			...blazeHeat,
			height: 0.85,
			distortion: reducedMotion ? 0.3 : 0.55,
			sparks: reducedMotion ? 0 : 0.4,
			smoke: reducedMotion ? 0.2 : 0.4,
			glow: reducedMotion ? 0.85 : 1.35,
		},
	};
}

export function WeatherStage({
	weather,
	effectOverride,
	backdrop,
	children,
	className,
}: WeatherStageProps) {
	const layout = stageStyle(className);
	const reducedMotion = usePrefersReducedMotion();
	const isMobile = useSyncExternalStore(
		subscribeMobile,
		getIsMobile,
		() => false,
	);
	const native = useSyncExternalStore(
		emptySubscribe,
		supportsHtmlInCanvas,
		() => false,
	);

	if (!weather) {
		return (
			<div {...layout}>
				<Scene backdrop={backdrop}>{children}</Scene>
			</div>
		);
	}

	const effect = effectOverride ?? weather.effect;
	const opts = effectOptions(weather, reducedMotion, isMobile);

	const scene = (extra?: { photo?: string; overlay?: string }) => (
		<Scene backdrop={backdrop} photo={extra?.photo} overlay={extra?.overlay}>
			{children}
		</Scene>
	);

	switch (effect) {
		case "blaze":
			return (
				<HeatStage
					layout={layout}
					blaze={opts.blaze}
					cloth={opts.blazeCloth}
					prefer="blaze"
					native={native}>
					{scene()}
				</HeatStage>
			);
		case "flame-wrap":
			if (native) {
				return <div {...layout}>{scene()}</div>;
			}
			return (
				<HeatStage
					layout={layout}
					blaze={opts["flame-wrap"]}
					cloth={opts.flameCloth}
					prefer="blaze"
					native={false}>
					{scene()}
				</HeatStage>
			);
		case "cloth":
			return (
				<HeatStage
					layout={layout}
					blaze={opts.clothBlaze}
					cloth={opts.cloth}
					prefer="cloth"
					native={native}>
					{scene({
						photo: "/cloth-hills.jpg",
						overlay:
							"linear-gradient(180deg, rgba(20,40,34,0.35) 0%, rgba(12,28,24,0.55) 100%)",
					})}
				</HeatStage>
			);
		case "clouds":
			return (
				<Clouds key="clouds-effect" {...layout} {...opts.clouds}>
					{scene()}
				</Clouds>
			);
		case "droplets":
			return (
				<Droplets {...layout} {...opts.droplets}>
					<Scene
						backdrop={backdrop}
						photo="/droplets-bloom.jpg"
						photoFirst
						baseColor="#b8c8d8"
						overlay="linear-gradient(180deg, rgba(40,55,70,0.18) 0%, rgba(30,45,60,0.28) 100%)">
						{children}
					</Scene>
				</Droplets>
			);
		case "frost":
			return (
				<Frost {...layout} {...opts.frost}>
					{scene({
						photo: "/frost-field.jpg",
						overlay:
							"linear-gradient(180deg, rgba(8,12,18,0.55) 0%, rgba(6,10,16,0.72) 100%)",
					})}
				</Frost>
			);
	}
}
