"use client";

import { useSyncExternalStore } from "react";
import {
	getReducedMotion,
	subscribeReducedMotion,
	toggleReducedMotion,
} from "@/lib/reducedMotion";

const getServerSnapshot = () => false;

/** Subscribes to effective reduced-motion (OS preference + optional override). */
export function usePrefersReducedMotion() {
	return useSyncExternalStore(
		subscribeReducedMotion,
		getReducedMotion,
		getServerSnapshot,
	);
}

export function useReducedMotionControls() {
	const reducedMotion = usePrefersReducedMotion();
	return { reducedMotion, toggle: toggleReducedMotion };
}
