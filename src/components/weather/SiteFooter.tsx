import type { ReactNode } from "react";

const TWITTER = "https://x.com/youssefRabeiii";

const BUILT_WITH = [
	{ href: "https://cursor.com", label: "Cursor" },
	{ href: "https://grok.com", label: "Grok" },
	{ href: "https://canvasui.dev/", label: "Canvas UI" },
	{ href: "https://cobe.vercel.app/", label: "COBE" },
	{ href: "https://bigsoundbank.com/", label: "BigSoundBank" },
] as const;

function CreditLink({
	href,
	children,
}: {
	href: string;
	children: ReactNode;
}) {
	return (
		<a
			href={href}
			target="_blank"
			rel="noopener noreferrer"
			className="text-white/70 no-underline transition hover:text-white">
			{children}
		</a>
	);
}

type SiteFooterProps = {
	glow?: string;
};

export function SiteFooter({ glow }: SiteFooterProps) {
	return (
		<footer className="mx-auto flex w-full justify-center px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-4 sm:px-6 lg:pb-3 lg:pt-5">
			<div
				className="inline-flex max-w-full flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-full border px-3.5 py-2 text-[11px] leading-none text-white/50 shadow-xl sm:gap-x-2.5 sm:px-4 sm:py-2.5 sm:text-xs"
				style={{
					/* No backdrop-blur — it breaks inside html-in-canvas capture. */
					background: "rgba(8, 12, 18, 0.94)",
					borderColor: "rgba(255,255,255,0.14)",
					boxShadow: glow
						? `0 10px 28px ${glow}`
						: "0 10px 28px rgba(0,0,0,0.32)",
				}}>
				<p className="inline-flex items-center whitespace-nowrap">
					<span className="text-white/45">spun into the sky by</span>
					<a
						href={TWITTER}
						target="_blank"
						rel="noopener noreferrer"
						className="ml-1.5 font-semibold text-white/90 underline underline-offset-2 transition hover:text-white">
						Youssef Rabei
					</a>
				</p>
				<span className="hidden h-3 w-px bg-white/15 sm:block" aria-hidden />
				<p className="inline-flex max-w-full flex-wrap items-center justify-center gap-x-1.5 gap-y-1">
					<span className="text-white/40">built with</span>
					{BUILT_WITH.map((item, i) => (
						<span key={item.href} className="inline-flex items-center">
							{i > 0 ? (
								<span className="mr-1.5 text-white/25" aria-hidden>
									·
								</span>
							) : null}
							<CreditLink href={item.href}>{item.label}</CreditLink>
						</span>
					))}
				</p>
			</div>
		</footer>
	);
}
