import type { ReactNode } from "react";

const TWITTER = "https://x.com/youssefRabeiii";

function Dot() {
	return (
		<span className="mx-1.5 text-white/30" aria-hidden>
			·
		</span>
	);
}

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
			className="text-white/75 no-underline transition hover:text-white">
			{children}
		</a>
	);
}

type SiteFooterProps = {
	glow?: string;
};

export function SiteFooter({ glow }: SiteFooterProps) {
	return (
		<footer className="mx-auto w-full max-w-3xl px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-6 sm:px-6 lg:pb-4">
			<div
				className="rounded-2xl border px-4 py-4 text-center text-[11px] leading-relaxed text-white/55 shadow-xl backdrop-blur-xl sm:px-6 sm:py-5 sm:text-xs"
				style={{
					background: "rgba(8, 12, 18, 0.72)",
					borderColor: "rgba(255,255,255,0.12)",
					boxShadow: glow
						? `0 12px 36px ${glow}`
						: "0 12px 36px rgba(0,0,0,0.3)",
				}}>
				<p>
					spun into the sky by{" "}
					<a
						href={TWITTER}
						target="_blank"
						rel="noopener noreferrer"
						className="font-bold text-white/90 underline underline-offset-2 transition hover:text-white">
						Youssef Rabei
					</a>
				</p>
				<p className="mt-2 flex flex-wrap items-center justify-center">
					<span>built with</span>
					<span className="ml-1 inline-flex flex-wrap items-center justify-center">
						<CreditLink href="https://cursor.com">Cursor</CreditLink>
						<Dot />
						<CreditLink href="https://grok.com">Grok</CreditLink>
						<Dot />
						<CreditLink href="https://canvasui.dev/">Canvas UI</CreditLink>
						<Dot />
						<CreditLink href="https://cobe.vercel.app/">COBE</CreditLink>
						<Dot />
						<CreditLink href="https://bigsoundbank.com/">
							BigSoundBank (CC0)
						</CreditLink>
					</span>
				</p>
			</div>
		</footer>
	);
}
