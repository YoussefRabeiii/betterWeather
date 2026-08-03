"use client";

import type { CSSProperties, ReactNode } from "react";
import { useSyncExternalStore } from "react";
import { Blaze } from "@/components/canvasui/Blaze";
import { Cloth } from "@/components/canvasui/Cloth";
import { Clouds } from "@/components/canvasui/Clouds";
import { Droplets, supportsHtmlInCanvas } from "@/components/canvasui/Droplets";
import { Frost } from "@/components/canvasui/Frost";
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
			<div className="relative z-10 h-full w-full overflow-visible">
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

function effectOptions(weather: WeatherPayload) {
	const precipBoost = Math.min(1, weather.precip / 5);
	const windBoost = Math.min(1, weather.wind / 80);

	const blazeHeat = {
		height: 0.97,
		distortion: 0.6,
		distortionScale: 0.5,
		speed: 1,
		sparks: 0.5,
		sparkDensity: 1.5,
		sparkSize: 1,
		layers: 4,
		smoke: 0.5,
		glow: 1.5,
		sparkColor: [1, 0.4, 0.05] as [number, number, number],
		smokeColor: [1, 0.43, 0.1] as [number, number, number],
	};

	return {
		blaze: {
			...blazeHeat,
			sparks: weather.isDay ? 0.55 : 0.3,
			glow: weather.isDay ? 1.5 : 0.9,
		},
		blazeCloth: {
			pin: "top" as const,
			wind: 0.35,
			speed: 0.85,
			amplitude: 12,
			drape: 16,
			brush: 0.35,
			cornerRadius: 0,
			light: 0.45,
			sheen: 0.25,
			damping: 0.08,
		},
		"flame-wrap": {
			...blazeHeat,
			height: 0.7,
			distortion: 0.4,
			sparks: 0.3,
			smoke: 0.35,
			glow: 1.1,
			layers: 3,
		},
		flameCloth: {
			pin: "top" as const,
			wind: 0.28,
			speed: 0.7,
			amplitude: 10,
			drape: 14,
			brush: 0.25,
			cornerRadius: 0,
			light: 0.4,
			sheen: 0.2,
			damping: 0.1,
		},
		clouds: CLOUDS_OPTIONS,
		droplets: {
			intensity: 0.75 + precipBoost * 0.35,
			speed: 1,
			scale: 0.38,
			dropWidth: 1.15,
			dropLength: 1.25,
			refraction: 0.42,
			blur: 0.2,
			vignette: 0.12,
			fallSpeed: 1,
			wiggle: 1.15,
			staticDrops: 0.45,
			tint: [1, 1, 1] as [number, number, number],
			tintStrength: 0,
			interactive: true,
			interactionRadius: 0.32,
			interactionStrength: 0.65,
			interactionDistortion: 3.2,
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
			meltRadius: 0.28,
			meltNoise: 0.3,
			meltStrength: 0.8,
			refreeze: 10,
			edgeFade: 0.12,
			meltEdges: true,
			introDuration: 2.5,
			opacity: 0.72,
			shimmer: 0.25,
			quality: 1,
		},
		cloth: {
			pin: "top" as const,
			wind: 0.75 + windBoost * 0.25,
			speed: 1.15 + windBoost,
			amplitude: 26 + windBoost * 12,
			drape: 32,
			brush: 0.75,
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
			distortion: 0.55,
			sparks: 0.4,
			smoke: 0.4,
			glow: 1.35,
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
	const opts = effectOptions(weather);

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
