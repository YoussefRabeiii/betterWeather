"use client";

import type { ReactNode } from "react";
import { SocialLinks } from "@/components/weather/SocialLinks";

type IslandNavProps = {
	leading?: ReactNode;
	glow?: string;
};

export function IslandNav({ leading, glow }: IslandNavProps) {
	return (
		<header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
			<nav
				aria-label="App"
				className="pointer-events-auto flex max-w-[calc(100%-0.5rem)] items-center gap-1 rounded-full border px-2.5 py-1.5 shadow-2xl backdrop-blur-xl sm:gap-1.5 sm:px-3 sm:py-2"
				style={{
					background: "rgba(8, 12, 18, 0.82)",
					borderColor: "rgba(255,255,255,0.14)",
					boxShadow: glow
						? `0 12px 40px ${glow}`
						: "0 12px 40px rgba(0,0,0,0.35)",
				}}>
				<span className="truncate px-2 font-[family-name:var(--font-display)] text-sm font-semibold tracking-tight text-white sm:text-base">
					betterWeather
				</span>
				<span className="mx-0.5 h-4 w-px shrink-0 bg-white/15" aria-hidden />
				<SocialLinks leading={leading} variant="inline" />
			</nav>
		</header>
	);
}
