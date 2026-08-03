"use client";

import createGlobe from "cobe";
import { useEffect, useRef, type CSSProperties } from "react";
import { MAJOR_CITIES } from "@/lib/cities";

export type PinColorMap = Record<string, [number, number, number]>;

type WeatherGlobeProps = {
  activeCityId?: string | null;
  focusLat?: number;
  focusLon?: number;
  onSelectCity: (cityId: string) => void;
  /** Per-city pin colors (e.g. from each city's live weather). */
  pinColors?: PinColorMap;
  /** Fallback / active-city accent when a city has no pinColors entry. */
  markerColor?: [number, number, number];
  glowColor?: [number, number, number];
  className?: string;
};

const FALLBACK_PIN: [number, number, number] = [0.95, 0.72, 0.28];

const AUTO_SPIN = 0.0025;
const FRICTION_PHI = 0.945;
const FRICTION_THETA = 0.9;
const COAST_EPS = 0.00045;
const THETA_MIN = -Math.PI / 2 + 0.05;
const THETA_MAX = Math.PI / 2 - 0.05;

function locationToAngles(lat: number, lon: number): [number, number] {
  return [
    Math.PI - ((lon * Math.PI) / 180 - Math.PI / 2),
    (lat * Math.PI) / 180,
  ];
}

function clampTheta(theta: number) {
  return Math.max(THETA_MIN, Math.min(THETA_MAX, theta));
}

function rgbTupleToCss(rgb: [number, number, number], alpha = 1) {
  const r = Math.round(rgb[0] * 255);
  const g = Math.round(rgb[1] * 255);
  const b = Math.round(rgb[2] * 255);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Project lat/lon to canvas pixels using COBE's rotation + 0.8 sphere scale. */
function projectCity(
  lat: number,
  lon: number,
  phi: number,
  theta: number,
  size: number,
): { x: number; y: number; visible: boolean } {
  const latR = (lat * Math.PI) / 180;
  const lonR = (lon * Math.PI) / 180 - Math.PI;
  const cosLat = Math.cos(latR);
  const p = [
    -cosLat * Math.cos(lonR),
    Math.sin(latR),
    cosLat * Math.sin(lonR),
  ] as const;
  const elev = 0.8 + 0.02;
  const ax = p[0] * elev;
  const ay = p[1] * elev;
  const az = p[2] * elev;
  const e = Math.cos(phi);
  const f = Math.sin(phi);
  const c = Math.cos(theta);
  const d = Math.sin(theta);
  const lx = e * ax + f * az;
  const ly = f * d * ax + c * ay - e * d * az;
  const lz = -f * c * ax + d * ay + e * c * az;
  const radial = Math.hypot(lx, ly);
  const visible = !(lz < 0 && radial < 0.8);
  return {
    x: (lx * 0.5 + 0.5) * size,
    y: (-ly * 0.5 + 0.5) * size,
    visible,
  };
}

export function WeatherGlobe({
  activeCityId,
  focusLat,
  focusLon,
  onSelectCity,
  pinColors,
  markerColor = FALLBACK_PIN,
  glowColor = [0.85, 0.9, 1],
  className,
}: WeatherGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeIdRef = useRef(activeCityId);
  const onSelectRef = useRef(onSelectCity);
  const focusAnglesRef = useRef<[number, number] | null>(null);
  const colorsRef = useRef({
    markerColor,
    glowColor,
    pinColors: pinColors ?? {},
  });
  const pointerRef = useRef({
    dragging: false,
    moved: false,
    lastX: 0,
    lastY: 0,
    lastT: 0,
  });
  const velocityRef = useRef({ phi: AUTO_SPIN, theta: 0 });
  const phiRef = useRef(0);
  const thetaRef = useRef(0.2);

  activeIdRef.current = activeCityId;
  onSelectRef.current = onSelectCity;
  colorsRef.current = {
    markerColor,
    glowColor,
    pinColors: pinColors ?? {},
  };

  useEffect(() => {
    if (typeof focusLat === "number" && typeof focusLon === "number") {
      focusAnglesRef.current = locationToAngles(focusLat, focusLon);
      velocityRef.current = { phi: AUTO_SPIN, theta: 0 };
    }
  }, [focusLat, focusLon]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let width = 0;
    let frame = 0;
    let raf = 0;

    const onResize = () => {
      // Keep the WebGL buffer square — stretched CSS boxes make an oval.
      width =
        Math.min(canvas.offsetWidth, canvas.offsetHeight) || canvas.offsetWidth;
    };
    window.addEventListener("resize", onResize);
    onResize();

    const globe = createGlobe(canvas, {
      devicePixelRatio: 2,
      width: width * 2,
      height: width * 2,
      phi: phiRef.current,
      theta: thetaRef.current,
      dark: 1,
      diffuse: 1.25,
      mapSamples: 18000,
      mapBrightness: 5.5,
      baseColor: [0.1, 0.14, 0.2],
      markerColor: colorsRef.current.markerColor,
      glowColor: colorsRef.current.glowColor,
      markerElevation: 0.02,
      markers: MAJOR_CITIES.map((city) => ({
        location: [city.lat, city.lon] as [number, number],
        size: 0.055,
        color:
          colorsRef.current.pinColors[city.id] ??
          colorsRef.current.markerColor,
        id: city.id,
      })),
    });

    const animate = () => {
      const target = focusAnglesRef.current;
      const vel = velocityRef.current;

      if (target && !pointerRef.current.dragging) {
        phiRef.current += (target[0] - phiRef.current) * 0.08;
        thetaRef.current += (target[1] - thetaRef.current) * 0.08;
        vel.phi = AUTO_SPIN;
        vel.theta = 0;
        if (
          Math.abs(target[0] - phiRef.current) < 0.01 &&
          Math.abs(target[1] - thetaRef.current) < 0.01
        ) {
          focusAnglesRef.current = null;
        }
      } else if (!pointerRef.current.dragging) {
        const momentum =
          Math.abs(vel.phi - AUTO_SPIN) + Math.abs(vel.theta);

        if (momentum > COAST_EPS) {
          phiRef.current += vel.phi;
          thetaRef.current = clampTheta(thetaRef.current + vel.theta);
          vel.phi *= FRICTION_PHI;
          vel.theta *= FRICTION_THETA;

          // As momentum fades, ease phi velocity toward gentle auto-spin.
          const speed = Math.max(Math.hypot(vel.phi, vel.theta), COAST_EPS);
          const fade = Math.min(1, (COAST_EPS * 3) / speed);
          vel.phi += (AUTO_SPIN - vel.phi) * (0.04 + fade * 0.12);
          if (Math.abs(vel.theta) < COAST_EPS) vel.theta = 0;
        } else {
          vel.phi = AUTO_SPIN;
          vel.theta = 0;
          phiRef.current += AUTO_SPIN;
        }
      }

      frame += 1;
      const pulse = 0.08 + Math.sin(frame / 12) * 0.015;
      const pins = colorsRef.current.pinColors;
      const fallback = colorsRef.current.markerColor;

      globe.update({
        width: width * 2,
        height: width * 2,
        phi: phiRef.current,
        theta: thetaRef.current,
        markerColor: fallback,
        glowColor: colorsRef.current.glowColor,
        markers: MAJOR_CITIES.map((city) => {
          const base = pins[city.id] ?? fallback;
          const active = city.id === activeIdRef.current;
          const color: [number, number, number] = active
            ? [
                Math.min(1, base[0] * 1.12),
                Math.min(1, base[1] * 1.12),
                Math.min(1, base[2] * 1.12),
              ]
            : base;
          return {
            location: [city.lat, city.lon] as [number, number],
            size: active ? pulse : 0.065,
            color,
            id: city.id,
          };
        }),
      });

      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    const onPointerDown = (e: PointerEvent) => {
      pointerRef.current = {
        dragging: true,
        moved: false,
        lastX: e.clientX,
        lastY: e.clientY,
        lastT: performance.now(),
      };
      velocityRef.current = { phi: 0, theta: 0 };
      canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor = "grabbing";
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!pointerRef.current.dragging) return;
      const now = performance.now();
      const dt = Math.max(8, now - pointerRef.current.lastT);
      const dx = e.clientX - pointerRef.current.lastX;
      const dy = e.clientY - pointerRef.current.lastY;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) pointerRef.current.moved = true;

      const dPhi = dx / 200;
      const dTheta = dy / 250;
      phiRef.current += dPhi;
      thetaRef.current = clampTheta(thetaRef.current + dTheta);

      // Normalize to ~60fps frame units, EMA-smooth for a stable flick.
      const frameScale = 16.67 / dt;
      const samplePhi = dPhi * frameScale;
      const sampleTheta = dTheta * frameScale;
      velocityRef.current.phi = velocityRef.current.phi * 0.55 + samplePhi * 0.45;
      velocityRef.current.theta =
        velocityRef.current.theta * 0.55 + sampleTheta * 0.45;

      pointerRef.current.lastX = e.clientX;
      pointerRef.current.lastY = e.clientY;
      pointerRef.current.lastT = now;
      focusAnglesRef.current = null;
    };

    const onPointerUp = (e: PointerEvent) => {
      const wasDrag = pointerRef.current.moved;
      pointerRef.current.dragging = false;
      canvas.style.cursor = "grab";
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }

      if (wasDrag) {
        // Clamp runaway flicks; inertia loop takes over from here.
        velocityRef.current.phi = Math.max(
          -0.12,
          Math.min(0.12, velocityRef.current.phi),
        );
        velocityRef.current.theta = Math.max(
          -0.06,
          Math.min(0.06, velocityRef.current.theta),
        );
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const size = Math.min(rect.width, rect.height);
      const cx = e.clientX - rect.left - (rect.width - size) / 2;
      const cy = e.clientY - rect.top - (rect.height - size) / 2;
      const hitR = Math.max(18, size * 0.045);

      let best: { id: string; dist: number } | null = null;
      for (const city of MAJOR_CITIES) {
        const p = projectCity(
          city.lat,
          city.lon,
          phiRef.current,
          thetaRef.current,
          size,
        );
        if (!p.visible) continue;
        const dist = Math.hypot(p.x - cx, p.y - cy);
        if (!best || dist < best.dist) best = { id: city.id, dist };
      }
      if (best && best.dist <= hitR) {
        onSelectRef.current(best.id);
      }
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);

    return () => {
      cancelAnimationFrame(raf);
      globe.destroy();
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
    };
  }, []);

  const activePinColor =
    (activeCityId && pinColors?.[activeCityId]) || markerColor;

  return (
    <div className={`relative mx-auto shrink-0 ${className ?? ""}`}>
      <canvas
        ref={canvasRef}
        className="block size-full cursor-grab touch-none active:cursor-grabbing"
        style={{
          aspectRatio: "1 / 1",
          contain: "layout paint size",
          filter: `drop-shadow(0 0 36px ${rgbTupleToCss(activePinColor, 0.3)})`,
        }}
      />
      {MAJOR_CITIES.map((city) => {
        const visibleVar = `var(--cobe-visible-${city.id}, 0)`;
        const active = city.id === activeCityId;
        const cityColor = pinColors?.[city.id] ?? markerColor;
        return (
          <div key={city.id} className="contents">
            {/* Pin hit target — scale(0) when behind so it won't steal clicks */}
            <button
              type="button"
              aria-label={city.name}
              onClick={() => onSelectCity(city.id)}
              className="globe-pin-hit absolute z-10 size-8 -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full"
              style={
                {
                  positionAnchor: `--cobe-${city.id}`,
                  top: "anchor(center)",
                  left: "anchor(center)",
                  opacity: visibleVar,
                  transform: `translate(-50%, -50%) scale(${visibleVar})`,
                  background: active
                    ? rgbTupleToCss(cityColor, 0.22)
                    : "transparent",
                  boxShadow: active
                    ? `0 0 14px ${rgbTupleToCss(cityColor)}`
                    : undefined,
                } as CSSProperties
              }
            />
            <button
              type="button"
              onClick={() => onSelectCity(city.id)}
              className="globe-pin-label absolute z-10 -translate-x-1/2 cursor-pointer rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide text-white/95 backdrop-blur-sm transition hover:text-white sm:text-xs"
              style={
                {
                  positionAnchor: `--cobe-${city.id}`,
                  bottom: "anchor(top)",
                  left: "anchor(center)",
                  opacity: visibleVar,
                  filter: `blur(calc((1 - ${visibleVar}) * 6px))`,
                  transform: `translateX(-50%) scale(${visibleVar})`,
                  transformOrigin: "bottom center",
                  background: active
                    ? rgbTupleToCss(cityColor, 0.4)
                    : "rgba(0, 0, 0, 0.4)",
                  outline: active
                    ? `1px solid ${rgbTupleToCss(cityColor, 0.75)}`
                    : `1px solid ${rgbTupleToCss(cityColor, 0.35)}`,
                  marginBottom: "6px",
                } as CSSProperties
              }
            >
              {city.name}
            </button>
          </div>
        );
      })}
    </div>
  );
}
