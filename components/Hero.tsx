"use client";
import { useEffect, useState } from "react";
import type { OpenMeteoResponse } from "@/lib/types";
import { weatherIcon, weatherDescription } from "@/lib/weatherIcon";

export default function Hero() {
  const [data, setData] = useState<OpenMeteoResponse | null>(null);

  useEffect(() => {
    fetch("/api/openmeteo").then(r => r.json()).then(setData);
  }, []);

  if (!data?.current) {
    return <div className="text-center py-16 text-white/40">Laden...</div>;
  }

  const { temperature, feelsLike, weathercode } = data.current;

  return (
    <div className="text-center py-8 px-4">
      <p className="text-white/50 text-xs font-medium tracking-widest uppercase mb-4">Hattem</p>
      <div className="text-7xl mb-3">{weatherIcon(weathercode)}</div>
      <div className="text-8xl font-bold text-white mb-2 tabular-nums">
        {Math.round(temperature)}°
      </div>
      <p className="text-white/80 text-xl mb-1">{weatherDescription(weathercode)}</p>
      <p className="text-white/50 text-sm">Gevoelstemperatuur {Math.round(feelsLike)}°C</p>
    </div>
  );
}
