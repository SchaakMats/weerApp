"use client";
import { useEffect, useState } from "react";
import type { CurrentWeather } from "@/lib/types";

const STAT_ICONS: Record<string, string> = {
  "Temperatuur": "🌡️",
  "Gevoelstemperatuur": "🤔",
  "Luchtvochtigheid": "💧",
  "Wind": "💨",
  "Luchtdruk": "🔵",
  "UV-index": "☀️",
  "Zichtbaarheid": "👁️",
  "Bewolking": "☁️",
};

export default function CurrentWeatherBlock() {
  const [data, setData] = useState<CurrentWeather | null>(null);

  useEffect(() => {
    fetch("/api/openmeteo").then(r => r.json()).then(d => { if (d.current) setData(d.current); });
  }, []);

  if (!data) return null;

  return (
    <section className="glass-card p-5">
      <h2 className="text-white/50 text-xs font-medium tracking-widest uppercase mb-4">Actueel detail</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Temperatuur" value={`${data.temperature}°C`} />
        <Stat label="Gevoelstemperatuur" value={`${data.feelsLike}°C`} />
        <Stat label="Luchtvochtigheid" value={`${data.humidity}%`} />
        <Stat label="Wind" value={`${data.windspeed} km/h`} />
        <Stat label="Luchtdruk" value={`${data.pressure} hPa`} />
        <Stat label="UV-index" value={String(data.uvIndex)} />
        <Stat label="Zichtbaarheid" value={`${(data.visibility / 1000).toFixed(1)} km`} />
        <Stat label="Bewolking" value={`${data.cloudcover}%`} />
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/5 rounded-xl p-3">
      <p className="text-white/50 text-xs mb-1">{STAT_ICONS[label] ?? "•"} {label}</p>
      <p className="text-white font-semibold text-lg">{value}</p>
    </div>
  );
}
