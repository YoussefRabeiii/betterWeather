"use client";

import { useEffect, useRef, useState } from "react";
import {
  readSoundEnabled,
  WeatherAudioEngine,
} from "@/lib/weatherAudio";
import type { WeatherEffect } from "@/lib/weather";

export function useWeatherAudio(effect: WeatherEffect) {
  const engineRef = useRef<WeatherAudioEngine | null>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const engine = new WeatherAudioEngine();
    engineRef.current = engine;
    const saved = readSoundEnabled();
    setEnabled(saved);
    if (saved) {
      void engine.setEnabled(true).then(() => engine.setEffect(effect));
    }
    return () => {
      engine.dispose();
      engineRef.current = null;
    };
    // Mount once — effect updates handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void engineRef.current?.setEffect(effect);
  }, [effect]);

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    void engineRef.current?.setEnabled(next).then(() => {
      if (next) void engineRef.current?.setEffect(effect);
    });
  };

  return { enabled, toggle };
}
