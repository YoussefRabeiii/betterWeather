export type WeatherBucket =
	| "sunny"
	| "hot"
	| "cloudy"
	| "rain"
	| "snow"
	| "windy";

export type WeatherEffect =
	| "blaze"
	| "flame-wrap"
	| "clouds"
	| "droplets"
	| "frost"
	| "cloth";

export const WEATHER_EFFECTS: { id: WeatherEffect; label: string }[] = [
	{ id: "blaze", label: "Blaze" },
	{ id: "flame-wrap", label: "Flame Wrap" },
	{ id: "clouds", label: "Clouds" },
	{ id: "droplets", label: "Droplets" },
	{ id: "frost", label: "Frost" },
	{ id: "cloth", label: "Cloth" },
];

export type WeatherPayload = {
	city: string;
	region?: string;
	country?: string;
	lat: number;
	lon: number;
	temp: number;
	feelsLike: number;
	humidity: number;
	wind: number;
	precip: number;
	code: number;
	label: string;
	bucket: WeatherBucket;
	effect: WeatherEffect;
	isDay: boolean;
};

export type GeoPayload = {
	city: string;
	region?: string;
	country?: string;
	lat: number;
	lon: number;
	source: "ip" | "fallback";
};

const WINDY_THRESHOLD_KMH = 45;
const HOT_THRESHOLD_C = 32;

/** WMO weather interpretation codes → human label + base bucket. */
export function interpretWeatherCode(code: number): {
	label: string;
	bucket: WeatherBucket;
} {
	if (code === 0) return { label: "Clear sky", bucket: "sunny" };
	if (code === 1) return { label: "Mainly clear", bucket: "sunny" };
	if (code === 2) return { label: "Partly cloudy", bucket: "cloudy" };
	if (code === 3) return { label: "Overcast", bucket: "cloudy" };
	if (code === 45 || code === 48) return { label: "Fog", bucket: "cloudy" };
	if (code >= 51 && code <= 57) return { label: "Drizzle", bucket: "rain" };
	if (code >= 61 && code <= 67) return { label: "Rain", bucket: "rain" };
	if (code >= 80 && code <= 82)
		return { label: "Rain showers", bucket: "rain" };
	if (code === 95 || code === 96 || code === 99)
		return { label: "Thunderstorm", bucket: "rain" };
	if (code >= 71 && code <= 77) return { label: "Snow", bucket: "snow" };
	if (code >= 85 && code <= 86)
		return { label: "Snow showers", bucket: "snow" };
	return { label: "Unknown", bucket: "cloudy" };
}

export function resolveBucket(input: {
	code: number;
	temp: number;
	wind: number;
}): WeatherBucket {
	const { bucket } = interpretWeatherCode(input.code);

	if (bucket === "rain" || bucket === "snow") return bucket;

	if (
		(bucket === "sunny" || bucket === "cloudy") &&
		input.temp >= HOT_THRESHOLD_C
	) {
		return "hot";
	}

	if (input.wind >= WINDY_THRESHOLD_KMH && bucket !== "hot") {
		return "windy";
	}

	return bucket;
}

export function bucketToEffect(bucket: WeatherBucket): WeatherEffect {
	switch (bucket) {
		case "sunny":
			return "blaze";
		case "hot":
			return "flame-wrap";
		case "cloudy":
			return "clouds";
		case "rain":
			return "droplets";
		case "snow":
			return "frost";
		case "windy":
			return "cloth";
	}
}

/** COBE pin RGB (0–1) by weather bucket — keeps the globe multicolored. */
export function pinColorForBucket(
	bucket: WeatherBucket,
): [number, number, number] {
	switch (bucket) {
		case "sunny":
			return [1, 0.72, 0.22];
		case "hot":
			return [1, 0.42, 0.12];
		case "cloudy":
			return [0.78, 0.86, 0.96];
		case "rain":
			return [0.35, 0.72, 1];
		case "snow":
			return [0.92, 0.96, 1];
		case "windy":
			return [0.35, 0.92, 0.72];
	}
}

export function normalizeWeather(input: {
	city: string;
	region?: string;
	country?: string;
	lat: number;
	lon: number;
	temp: number;
	feelsLike: number;
	humidity: number;
	wind: number;
	precip: number;
	code: number;
	isDay: boolean;
}): WeatherPayload {
	const { label } = interpretWeatherCode(input.code);
	const bucket = resolveBucket({
		code: input.code,
		temp: input.temp,
		wind: input.wind,
	});

	return {
		...input,
		label,
		bucket,
		effect: bucketToEffect(bucket),
	};
}

export type AtmosphereTheme = {
	gradient: string;
	/** High-contrast text on the readout surface. */
	text: string;
	/** Secondary text on the readout surface. */
	muted: string;
	/** Accent for temp / highlights on the readout surface. */
	accent: string;
	glow: string;
	/** Surface behind compact UI (flame card, chips). */
	surface: string;
	surfaceBorder: string;
	/** Globe / lower section always uses this dark readable panel. */
	panelBg: string;
	panelText: string;
	panelMuted: string;
	panelAccent: string;
};

/** High-contrast forge backdrop so Flame Wrap reads against the page. */
export function forgeAtmosphere(): AtmosphereTheme {
	return {
		gradient:
			"radial-gradient(ellipse 130% 90% at 50% 0%, #3a2218 0%, #14100e 42%, #080606 78%, #030202 100%)",
		text: "#fff8f0",
		muted: "#e0c4a8",
		accent: "#ffd27a",
		glow: "rgba(255, 140, 40, 0.4)",
		surface: "rgba(12, 8, 6, 0.92)",
		surfaceBorder: "rgba(255, 180, 80, 0.45)",
		panelBg:
			"linear-gradient(180deg, rgba(8,10,12,0.65) 0%, rgba(4,4,6,0.92) 100%)",
		panelText: "#f4f7fb",
		panelMuted: "#b7c4d4",
		panelAccent: "#ffb06a",
	};
}

/** Dark cool backdrop so crystalline Frost reads as ice, not pale fog. */
export function frostAtmosphere(): AtmosphereTheme {
	return {
		gradient:
			"radial-gradient(ellipse 130% 90% at 50% 0%, #3a4a5c 0%, #1a2434 42%, #0c121c 78%, #06080e 100%)",
		text: "#f4f8fc",
		muted: "#c5d4e4",
		accent: "#e8f2ff",
		glow: "rgba(180, 210, 255, 0.28)",
		surface: "rgba(10, 16, 26, 0.88)",
		surfaceBorder: "rgba(200, 220, 245, 0.35)",
		panelBg:
			"linear-gradient(180deg, rgba(8,12,18,0.65) 0%, rgba(4,6,10,0.92) 100%)",
		panelText: "#f4f7fb",
		panelMuted: "#b7c4d4",
		panelAccent: "#dce8f8",
	};
}

/** Cool overcast sky for Clouds — enough depth for clouds without washing to white. */
export function cloudsAtmosphere(): AtmosphereTheme {
	return {
		gradient:
			"radial-gradient(ellipse 140% 90% at 50% 0%, #a8b6c6 0%, #6e7f94 40%, #455568 75%, #2a3544 100%)",
		text: "#f2f6fa",
		muted: "#c2cedc",
		accent: "#e8f0f8",
		glow: "rgba(120, 150, 180, 0.22)",
		surface: "rgba(12, 18, 26, 0.82)",
		surfaceBorder: "rgba(220, 230, 245, 0.28)",
		panelBg:
			"linear-gradient(180deg, rgba(8,12,18,0.55) 0%, rgba(6,8,12,0.88) 100%)",
		panelText: "#f4f7fb",
		panelMuted: "#b7c4d4",
		panelAccent: "#d7e4f2",
	};
}

/** Windy green-teal sky for Cloth — fabric needs visible scenery to ripple. */
export function clothAtmosphere(): AtmosphereTheme {
	return {
		gradient:
			"radial-gradient(ellipse 140% 90% at 30% 10%, #9ec9b8 0%, #4f8a7a 42%, #2c564c 78%, #15322c 100%)",
		text: "#f3fffa",
		muted: "#c5e8da",
		accent: "#d8fff0",
		glow: "rgba(140, 210, 180, 0.3)",
		surface: "rgba(8, 28, 22, 0.78)",
		surfaceBorder: "rgba(200, 240, 220, 0.32)",
		panelBg:
			"linear-gradient(180deg, rgba(8,12,18,0.55) 0%, rgba(6,8,12,0.88) 100%)",
		panelText: "#f4f7fb",
		panelMuted: "#b7c4d4",
		panelAccent: "#b8f0d8",
	};
}

/** Light colorful scene for Droplets — refraction needs bright detail to read. */
export function dropletsAtmosphere(): AtmosphereTheme {
	return {
		gradient:
			"radial-gradient(ellipse 140% 90% at 60% 0%, #e8d4a8 0%, #a8c4dc 40%, #6e9abe 75%, #456f96 100%)",
		text: "#14202c",
		muted: "#2c4054",
		accent: "#0d2740",
		glow: "rgba(255, 255, 255, 0.28)",
		surface: "rgba(255, 252, 248, 0.82)",
		surfaceBorder: "rgba(20, 40, 60, 0.14)",
		panelBg:
			"linear-gradient(180deg, rgba(8,12,18,0.55) 0%, rgba(6,8,12,0.88) 100%)",
		panelText: "#f4f7fb",
		panelMuted: "#b7c4d4",
		panelAccent: "#b6e0ff",
	};
}

export function atmosphereFor(
	bucket: WeatherBucket,
	isDay: boolean,
): AtmosphereTheme {
	const darkPanel = {
		panelBg:
			"linear-gradient(180deg, rgba(8,12,18,0.55) 0%, rgba(6,8,12,0.88) 100%)",
		panelText: "#f4f7fb",
		panelMuted: "#b7c4d4",
		panelAccent: "#f0c674",
	};

	if (!isDay) {
		switch (bucket) {
			case "rain":
				return {
					gradient:
						"radial-gradient(ellipse 120% 80% at 50% -10%, #24384c 0%, #0f1824 50%, #070b12 100%)",
					text: "#f2f7fb",
					muted: "#c2d0dc",
					accent: "#9fd0ef",
					glow: "rgba(100, 160, 200, 0.3)",
					surface: "rgba(10, 18, 28, 0.55)",
					surfaceBorder: "rgba(180, 210, 230, 0.25)",
					...darkPanel,
					panelAccent: "#9fd0ef",
				};
			case "snow":
				return {
					gradient:
						"radial-gradient(ellipse 120% 80% at 50% -10%, #334155 0%, #141b28 50%, #080b11 100%)",
					text: "#f7fafc",
					muted: "#c8d4e4",
					accent: "#dce8f8",
					glow: "rgba(180, 200, 230, 0.25)",
					surface: "rgba(12, 18, 28, 0.55)",
					surfaceBorder: "rgba(210, 225, 245, 0.28)",
					...darkPanel,
					panelAccent: "#dce8f8",
				};
			case "hot":
				return {
					gradient:
						"radial-gradient(ellipse 120% 80% at 50% -10%, #4a2214 0%, #1a0c08 50%, #080402 100%)",
					text: "#fff5ec",
					muted: "#e0b89a",
					accent: "#ffb06a",
					glow: "rgba(255, 120, 50, 0.35)",
					surface: "rgba(20, 10, 6, 0.6)",
					surfaceBorder: "rgba(255, 160, 80, 0.35)",
					...darkPanel,
					panelAccent: "#ffb06a",
				};
			default:
				return {
					gradient:
						"radial-gradient(ellipse 120% 80% at 50% -10%, #2a3a58 0%, #101828 50%, #070a12 100%)",
					text: "#f3f6fb",
					muted: "#c4cedc",
					accent: "#f2c96b",
					glow: "rgba(242, 201, 107, 0.22)",
					surface: "rgba(10, 14, 22, 0.55)",
					surfaceBorder: "rgba(230, 210, 150, 0.28)",
					...darkPanel,
				};
		}
	}

	switch (bucket) {
		case "sunny":
			return {
				gradient:
					"radial-gradient(ellipse 140% 90% at 70% 0%, #ffd978 0%, #5eb0e0 38%, #2a74b8 72%, #154f86 100%)",
				text: "#071828",
				muted: "#16324a",
				accent: "#8a4a00",
				glow: "rgba(255, 200, 80, 0.4)",
				surface: "rgba(255, 250, 235, 0.72)",
				surfaceBorder: "rgba(20, 40, 60, 0.18)",
				...darkPanel,
				panelAccent: "#ffd36a",
			};
		case "hot":
			return {
				// Deep ash/forge sky — bright peach washed out Flame Wrap before
				gradient:
					"radial-gradient(ellipse 140% 90% at 55% -5%, #5a2818 0%, #2a120c 38%, #120806 72%, #060304 100%)",
				text: "#fff6ec",
				muted: "#f0c8a8",
				accent: "#ffe08a",
				glow: "rgba(255, 160, 60, 0.35)",
				surface: "rgba(18, 8, 5, 0.88)",
				surfaceBorder: "rgba(255, 190, 100, 0.4)",
				...darkPanel,
				panelAccent: "#ffb06a",
			};
		case "cloudy":
			return {
				gradient:
					"radial-gradient(ellipse 140% 90% at 50% 0%, #c9d3e0 0%, #7d91a8 42%, #465a70 78%, #2a3848 100%)",
				text: "#101820",
				muted: "#243140",
				accent: "#0f2438",
				glow: "rgba(180, 195, 210, 0.35)",
				surface: "rgba(245, 248, 252, 0.7)",
				surfaceBorder: "rgba(20, 30, 40, 0.2)",
				...darkPanel,
				panelAccent: "#d7e4f2",
			};
		case "rain":
			return {
				gradient:
					"radial-gradient(ellipse 140% 90% at 40% 0%, #5d7690 0%, #334960 42%, #1c2c3c 78%, #101820 100%)",
				text: "#f3f8fc",
				muted: "#c5d4e2",
				accent: "#b6e0ff",
				glow: "rgba(130, 180, 220, 0.3)",
				surface: "rgba(12, 22, 32, 0.5)",
				surfaceBorder: "rgba(180, 210, 230, 0.28)",
				...darkPanel,
				panelAccent: "#b6e0ff",
			};
		case "snow":
			return {
				gradient:
					"radial-gradient(ellipse 140% 90% at 50% 0%, #e8eef6 0%, #a8bdd4 42%, #6b87a6 78%, #3d5570 100%)",
				text: "#102030",
				muted: "#24384c",
				accent: "#0d2740",
				glow: "rgba(255, 255, 255, 0.45)",
				surface: "rgba(255, 255, 255, 0.72)",
				surfaceBorder: "rgba(20, 40, 60, 0.2)",
				...darkPanel,
				panelAccent: "#e8f1ff",
			};
		case "windy":
			return {
				gradient:
					"radial-gradient(ellipse 140% 90% at 30% 10%, #9ec9b8 0%, #4f8a7a 42%, #2c564c 78%, #15322c 100%)",
				text: "#f3fffa",
				muted: "#c5e8da",
				accent: "#d8fff0",
				glow: "rgba(140, 210, 180, 0.35)",
				surface: "rgba(8, 28, 22, 0.72)",
				surfaceBorder: "rgba(200, 240, 220, 0.35)",
				...darkPanel,
				panelAccent: "#b8f0d8",
			};
	}
}
