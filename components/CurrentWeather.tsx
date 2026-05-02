"use client";
import { useEffect, useState } from "react";
import type { CurrentWeather } from "@/lib/types";

export default function CurrentWeatherBlock() {
  const [data, setData] = useState<CurrentWeather | null>(null);

  useEffect(() => {
    fetch("/api/openmeteo").then(r => r.json()).then(d => { if (d.current) setData(d.current); });
  }, []);

  if (!data) return <div className="p-6 text-gray-400">Laden...</div>;

  return (
    <section className="p-6 bg-white rounded-2xl shadow">
      <h2 className="text-xl font-bold mb-4">Actueel — Hattem</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
    <div className="bg-gray-50 rounded-xl p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}
