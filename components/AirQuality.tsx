"use client";
import { useEffect, useState } from "react";
import type { AirQuality } from "@/lib/types";
import { aqiLabel, pollenLabel } from "@/lib/aqiLabel";

export default function AirQuality() {
  const [data, setData] = useState<AirQuality | null>(null);

  useEffect(() => {
    fetch("/api/airquality").then(r => r.json()).then(d => {
      if (!d.error) setData(d);
    });
  }, []);

  if (!data) return null;

  const { label, color } = aqiLabel(data.aqi);

  return (
    <section className="glass-card p-5">
      <h2 className="text-white/50 text-xs font-medium tracking-widest uppercase mb-4">Luchtkwaliteit</h2>
      <div className="flex items-center gap-4 mb-4">
        <span className="text-5xl font-bold text-white">{data.aqi}</span>
        <span className="text-lg font-semibold" style={{ color }}>{label}</span>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          ["PM2.5", `${data.pm25} µg/m³`],
          ["PM10", `${data.pm10} µg/m³`],
          ["Ozon", `${data.ozone} µg/m³`],
          ["NO₂", `${data.no2} µg/m³`],
        ].map(([l, v]) => (
          <div key={l} className="bg-white/5 rounded-xl p-3">
            <p className="text-white/50 text-xs mb-1">{l}</p>
            <p className="text-white font-semibold">{v}</p>
          </div>
        ))}
      </div>
      <h3 className="text-white/50 text-xs font-medium tracking-widest uppercase mb-3">🌿 Pollen</h3>
      <div className="grid grid-cols-3 gap-2">
        {[
          ["🌾 Gras", data.grassPollen],
          ["🌳 Berk", data.birchPollen],
          ["🌿 Ambro.", data.mugwortPollen],
        ].map(([l, v]) => (
          <div key={String(l)} className="bg-white/5 rounded-xl p-3 text-center">
            <p className="text-white/50 text-xs mb-1">{l}</p>
            <p className="text-white text-sm font-semibold">{pollenLabel(Number(v))}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
