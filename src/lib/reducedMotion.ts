const QUERY = "(prefers-reduced-motion: reduce)";
const STORAGE_KEY = "betterWeather:reducedMotion";

type Override = boolean | null;

let override: Override = null;
let media: MediaQueryList | null = null;
let hydrated = false;
let mediaBound = false;
const listeners = new Set<() => void>();

function emit() {
	for (const listener of listeners) listener();
}

function systemPrefers(): boolean {
	if (typeof window === "undefined") return false;
	media ??= window.matchMedia(QUERY);
	return media.matches;
}

function hydrate() {
	if (hydrated || typeof window === "undefined") return;
	hydrated = true;
	try {
		const raw = window.localStorage.getItem(STORAGE_KEY);
		if (raw === "on") override = true;
		else if (raw === "off") override = false;
	} catch {
		// ignore
	}
}

function ensureMedia() {
	if (mediaBound || typeof window === "undefined") return;
	mediaBound = true;
	media ??= window.matchMedia(QUERY);
	media.addEventListener("change", emit);
}

/** Effective reduced-motion: persisted override, else OS/browser preference. */
export function getReducedMotion(): boolean {
	hydrate();
	if (override !== null) return override;
	return systemPrefers();
}

export function getSystemPrefersReducedMotion(): boolean {
	return systemPrefers();
}

export function getReducedMotionOverride(): Override {
	hydrate();
	return override;
}

export function setReducedMotionOverride(next: Override) {
	hydrate();
	override = next;
	if (typeof window !== "undefined") {
		try {
			if (next === null) window.localStorage.removeItem(STORAGE_KEY);
			else window.localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
		} catch {
			// ignore
		}
	}
	emit();
}

/** Toggle effective motion; clears override when it matches the system preference. */
export function toggleReducedMotion() {
	const next = !getReducedMotion();
	if (next === systemPrefers()) setReducedMotionOverride(null);
	else setReducedMotionOverride(next);
}

export function subscribeReducedMotion(onStoreChange: () => void) {
	listeners.add(onStoreChange);
	if (typeof window !== "undefined") {
		hydrate();
		ensureMedia();
	}
	return () => {
		listeners.delete(onStoreChange);
	};
}
