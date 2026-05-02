"use client";
import { useEffect, useState } from "react";

type HistoricalEntry = { year: number; date: string; tempMax: number | null; tempMin: number | null; precipitation: number | null };

export default function Historical() {
  const [data, setData] = useState<HistoricalEntry[]>([]);

  useEffect(() => {
    fetch("/api/historical").then(r => r.json()).then(d => setData(d.historical ?? []));
  }, []);

  return (
    <section className="p-6 bg-white rounded-2xl shadow">
      <h2 className="text-xl font-bold mb-4">Zelfde dag vorige jaren</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data.map(d => (
          <div key={d.year} className="bg-gray-50 rounded-xl p-4">
            <p className="font-semibold text-lg">{d.year}</p>
            <p className="text-sm text-gray-500">{d.date}</p>
            <p>Max: <strong>{d.tempMax != null ? `${d.tempMax}°C` : "—"}</strong></p>
            <p>Min: <strong>{d.tempMin != null ? `${d.tempMin}°C` : "—"}</strong></p>
            <p>Neerslag: <strong>{d.precipitation != null ? `${d.precipitation} mm` : "—"}</strong></p>
          </div>
        ))}
      </div>
    </section>
  );
}
