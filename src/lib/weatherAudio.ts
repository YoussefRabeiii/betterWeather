import type { WeatherEffect } from "@/lib/weather";

const STORAGE_KEY = "betterWeather:sound";
/** Quiet master — layered mixes stay under the UI. */
const MASTER_LEVEL = 0.14;
const FADE_MS = 850;

export type AmbientLayerId =
  | "fire"
  | "fire-hot"
  | "rain-glass"
  | "wind-soft"
  | "wind-whistle"
  | "fabric";

export type SoundtrackId =
  | "heatwave"
  | "forge"
  | "overcast"
  | "rainglass"
  | "winter"
  | "breeze";

/** One looping SFX file. */
export const AMBIENT_LAYERS: Record<
  AmbientLayerId,
  { src: string; title: string }
> = {
  fire: { src: "/sounds/fire.mp3", title: "Fireplace" },
  "fire-hot": { src: "/sounds/fire-hot.mp3", title: "Big Fire" },
  "rain-glass": {
    src: "/sounds/rain-glass.mp3",
    title: "Rain on Car Windshield",
  },
  "wind-soft": { src: "/sounds/wind-soft.mp3", title: "Soft Wind" },
  "wind-whistle": {
    src: "/sounds/wind-whistle.mp3",
    title: "Whistling Wind",
  },
  fabric: { src: "/sounds/fabric.mp3", title: "Fabric" },
};

/** Named compositions: layer id → relative volume (0–1), scaled by MASTER_LEVEL. */
export const SOUNDTRACKS: Record<
  SoundtrackId,
  { title: string; layers: Partial<Record<AmbientLayerId, number>> }
> = {
  heatwave: {
    title: "Heatwave",
    layers: { fire: 1 },
  },
  forge: {
    title: "Forge",
    layers: { "fire-hot": 0.9, fire: 0.28 },
  },
  overcast: {
    title: "Overcast",
    layers: { "wind-soft": 1 },
  },
  rainglass: {
    title: "Gentle Rain",
    layers: { "rain-glass": 1 },
  },
  winter: {
    title: "Winter",
    layers: { "wind-whistle": 1, "wind-soft": 0.32 },
  },
  breeze: {
    title: "Breeze",
    layers: { fabric: 0.95, "wind-soft": 0.28 },
  },
};

/** Canvas / weather effects → soundtrack. */
export const EFFECT_SOUNDTRACKS: Record<WeatherEffect, SoundtrackId> = {
  blaze: "forge",
  "flame-wrap": "heatwave",
  clouds: "overcast",
  droplets: "rainglass",
  frost: "winter",
  cloth: "breeze",
};

export function readSoundEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "on";
  } catch {
    return false;
  }
}

export function writeSoundEnabled(on: boolean) {
  try {
    window.localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
  } catch {
    // ignore
  }
}

function clampVolume(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function setVolume(audio: HTMLAudioElement, volume: number): void {
  audio.volume = clampVolume(volume);
}

function fadeTo(
  audio: HTMLAudioElement,
  target: number,
  ms: number,
  shouldContinue: () => boolean,
  onDone?: () => void,
) {
  const from = clampVolume(audio.volume);
  const clampedTarget = clampVolume(target);
  const start = performance.now();
  const tick = (now: number) => {
    if (!shouldContinue()) return;
    const t = Math.min(1, (now - start) / ms);
    setVolume(audio, from + (clampedTarget - from) * t);
    if (t < 1) {
      requestAnimationFrame(tick);
    } else {
      onDone?.();
    }
  };
  requestAnimationFrame(tick);
}

export class WeatherAudioEngine {
  private layers = new Map<AmbientLayerId, HTMLAudioElement>();
  private fadeToken = new Map<AmbientLayerId, number>();
  private effect: WeatherEffect | null = null;
  private soundtrack: SoundtrackId | null = null;
  private enabled = false;
  private generation = 0;

  isEnabled() {
    return this.enabled;
  }

  async setEnabled(on: boolean) {
    this.enabled = on;
    writeSoundEnabled(on);
    if (!on) {
      this.muteAll();
      return;
    }
    if (this.effect) await this.setEffect(this.effect);
  }

  async setEffect(effect: WeatherEffect) {
    this.effect = effect;
    if (!this.enabled) return;

    const soundtrackId = EFFECT_SOUNDTRACKS[effect];
    if (!soundtrackId) return;

    await this.playSoundtrack(soundtrackId);
  }

  dispose() {
    this.generation += 1;
    this.stopAll(true);
    this.effect = null;
    this.soundtrack = null;
  }

  private async playSoundtrack(id: SoundtrackId) {
    const mix = SOUNDTRACKS[id]?.layers;
    if (!mix) return;

    // Same soundtrack already audible — keep layers as-is.
    if (this.soundtrack === id && this.hasAudibleLayers()) {
      return;
    }

    const gen = ++this.generation;
    this.soundtrack = id;

    const targetIds = new Set(
      Object.keys(mix) as AmbientLayerId[],
    );

    for (const [layerId, audio] of this.layers) {
      if (targetIds.has(layerId)) continue;
      this.fadeLayer(layerId, audio, 0, gen, () => {
        if (gen !== this.generation) return;
        audio.pause();
      });
    }

    for (const [layerId, relative] of Object.entries(mix) as [
      AmbientLayerId,
      number,
    ][]) {
      if (gen !== this.generation) return;

      const targetVol = MASTER_LEVEL * relative;
      let audio = this.layers.get(layerId);

      if (!audio) {
        const meta = AMBIENT_LAYERS[layerId];
        audio = new Audio(meta.src);
        audio.loop = true;
        audio.preload = "auto";
        setVolume(audio, 0);
        this.layers.set(layerId, audio);
      }

      if (audio.paused) {
        try {
          await audio.play();
        } catch {
          // Autoplay blocked until a gesture — toggle already is a gesture.
          return;
        }
      }

      if (gen !== this.generation) return;
      this.fadeLayer(layerId, audio, targetVol, gen);
    }
  }

  private hasAudibleLayers() {
    for (const audio of this.layers.values()) {
      if (!audio.paused && audio.volume > 0.001) return true;
    }
    return false;
  }

  private fadeLayer(
    layerId: AmbientLayerId,
    audio: HTMLAudioElement,
    target: number,
    gen: number,
    onDone?: () => void,
  ) {
    const token = (this.fadeToken.get(layerId) ?? 0) + 1;
    this.fadeToken.set(layerId, token);

    fadeTo(
      audio,
      clampVolume(target),
      FADE_MS,
      () =>
        this.fadeToken.get(layerId) === token && gen === this.generation,
      onDone,
    );
  }

  /** Instant mute — cancel fades, zero volume, pause; keep layers for fade-in on unmute. */
  private muteAll() {
    this.generation += 1;
    this.soundtrack = null;

    for (const [layerId, audio] of this.layers) {
      this.fadeToken.set(layerId, (this.fadeToken.get(layerId) ?? 0) + 1);
      setVolume(audio, 0);
      audio.pause();
    }
  }

  private stopAll(immediate = false) {
    this.generation += 1;
    this.soundtrack = null;

    for (const [layerId, audio] of this.layers) {
      if (immediate) {
        this.fadeToken.set(layerId, (this.fadeToken.get(layerId) ?? 0) + 1);
        audio.pause();
        setVolume(audio, 0);
        continue;
      }
      this.fadeLayer(layerId, audio, 0, this.generation, () => {
        audio.pause();
      });
    }

    if (immediate) {
      for (const audio of this.layers.values()) {
        audio.src = "";
      }
      this.layers.clear();
    }
  }
}
