import type { Metadata } from "next";
import Link from "next/link";

/** Frozen production deploy of dd4a7cb (pre island-chrome / mobile polish). */
const OLD_DEPLOY_URL =
	"https://better-weather-6dtzryias-youssef-rabeis-projects.vercel.app";

export const metadata: Metadata = {
	title: "Better Weather (previous)",
	description: "Previous deployed Better Weather build for comparison.",
	robots: { index: false, follow: false },
};

export default function OldVersionPage() {
	return (
		<div className="fixed inset-0 z-[100] bg-black">
			<div className="pointer-events-none absolute top-0 right-0 left-0 z-[101] flex justify-center px-3 pt-[max(0.5rem,env(safe-area-inset-top))]">
				<div className="pointer-events-auto flex items-center gap-3 rounded-full border border-white/15 bg-[rgba(8,12,18,0.92)] px-3 py-1.5 text-xs text-white/80 shadow-xl">
					<span className="font-medium text-white/55">previous deploy</span>
					<span className="h-3 w-px bg-white/15" aria-hidden />
					<Link
						href="/"
						className="font-semibold text-white underline-offset-2 transition hover:text-white hover:underline">
						Back to current
					</Link>
				</div>
			</div>
			<iframe
				title="Previous Better Weather deployment"
				src={OLD_DEPLOY_URL}
				className="h-dvh w-full border-0"
				allow="geolocation; autoplay"
			/>
		</div>
	);
}
