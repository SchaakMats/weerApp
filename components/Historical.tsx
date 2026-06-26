"use client";
import { useEffect, useState } from "react";

type HistoricalEntry = { year: number; date: string; tempMax: number | null; tempMin: number | null; precipitation: number | null };

export default function Historical() {
  const [data, setData] = useState<HistoricalEntry[]>([]);

  useEffect(() => {
    fetch("/api/historical").then(r => r.json()).then(d => setData(d.historical ?? []));
  }, []);

  return (
    <section className="glass-card p-5">
      <h2 className="text-white/50 text-xs font-medium tracking-widest uppercase mb-4">Zelfde dag vorige jaren</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {data.map(d => (
          <div key={d.year} className="bg-white/5 rounded-xl p-4">
            <p className="text-white font-semibold text-lg">{d.year}</p>
            <p className="text-white/40 text-xs mb-2">{d.date}</p>
            <p className="text-white/70 text-sm">Max: <span className="text-white font-medium">{d.tempMax != null ? `${d.tempMax}°C` : "—"}</span></p>
            <p className="text-white/70 text-sm">Min: <span className="text-white font-medium">{d.tempMin != null ? `${d.tempMin}°C` : "—"}</span></p>
            <p className="text-white/70 text-sm">Neerslag: <span className="text-white font-medium">{d.precipitation != null ? `${d.precipitation} mm` : "—"}</span></p>
          </div>
        ))}
      </div>
    </section>
  );
}
