"use client";

type MotionToggleProps = {
	reduced: boolean;
	onToggle: () => void;
};

export function MotionToggle({ reduced, onToggle }: MotionToggleProps) {
	return (
		<button
			type="button"
			onClick={onToggle}
			aria-label={reduced ? "Enable decorative motion" : "Reduce decorative motion"}
			aria-pressed={reduced}
			title={reduced ? "Motion reduced" : "Reduce motion"}
			className="inline-flex size-9 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white sm:size-10">
			{reduced ? (
				<svg viewBox="0 0 24 24" aria-hidden className="size-4 fill-current">
					<path d="M12 2a1 1 0 0 1 1 1v2.07A8.002 8.002 0 0 1 20 13h2a1 1 0 1 1 0 2h-2.07A8.002 8.002 0 0 1 13 22v2a1 1 0 1 1-2 0v-2.07A8.002 8.002 0 0 1 4 15H2a1 1 0 1 1 0-2h2.07A8.002 8.002 0 0 1 11 5.07V3a1 1 0 0 1 1-1zm0 6a5 5 0 1 0 0 10 5 5 0 0 0 0-10z" />
					<path d="M3.22 3.22a.75.75 0 0 1 1.06 0l16.5 16.5a.75.75 0 1 1-1.06 1.06L3.22 4.28a.75.75 0 0 1 0-1.06z" />
				</svg>
			) : (
				<svg viewBox="0 0 24 24" aria-hidden className="size-4 fill-current">
					<path d="M12 2a1 1 0 0 1 1 1v2.07A8.002 8.002 0 0 1 20 13h2a1 1 0 1 1 0 2h-2.07A8.002 8.002 0 0 1 13 22v2a1 1 0 1 1-2 0v-2.07A8.002 8.002 0 0 1 4 15H2a1 1 0 1 1 0-2h2.07A8.002 8.002 0 0 1 11 5.07V3a1 1 0 0 1 1-1zm0 6a5 5 0 1 0 0 10 5 5 0 0 0 0-10z" />
				</svg>
			)}
		</button>
	);
}
