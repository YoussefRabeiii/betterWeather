/** Canonical production origin for absolute OG / Twitter URLs. */
export const SITE_URL =
	process.env.NEXT_PUBLIC_SITE_URL ??
	(process.env.VERCEL_PROJECT_PRODUCTION_URL
		? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
		: "https://weather4k.vercel.app");

export const SITE_NAME = "Better Weather";

export const SITE_DESCRIPTION =
	"A canvas-powered weather experience — live conditions painted as Flame, Frost, Droplets, Clouds, Cloth, and Blaze.";
