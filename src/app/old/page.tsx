import { redirect } from "next/navigation";

/** Frozen production deploy of dd4a7cb (pre island-chrome / mobile polish). */
const OLD_DEPLOY_URL =
	"https://better-weather-6dtzryias-youssef-rabeis-projects.vercel.app";

/** Vercel blocks framing (CSP frame-ancestors / X-Frame-Options), so open full-page. */
export default function OldVersionPage() {
	redirect(OLD_DEPLOY_URL);
}
