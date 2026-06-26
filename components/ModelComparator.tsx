"use client";
import { useEffect, useState } from "react";
import type { ScrapedForecast } from "@/lib/scrape";
import type { OpenMeteoResponse } from "@/lib/types";

const SCRAPERS = ["weeronline", "weernl", "weerplaza", "weerenradar"];

export default function ModelComparator() {
  const [scraped, setScraped] = useState<ScrapedForecast[]>([]);
  const [openmeteo, setOpenmeteo] = useState<OpenMeteoResponse | null>(null);

  useEffect(() => {
    fetch("/api/openmeteo").then(r => r.json()).then(setOpenmeteo);
    Promise.all(SCRAPERS.map(s => fetch(`/api/scrape/${s}`).then(r => r.json()))).then(setScraped);
  }, []);

  const sources = [
    { name: "Open-Meteo", tempMin: openmeteo?.daily[0]?.tempMin ?? null, tempMax: openmeteo?.daily[0]?.tempMax ?? null, precipitation: openmeteo?.daily[0]?.precipitation != null ? `${openmeteo.daily[0].precipitation} mm` : null },
    ...scraped.map(s => ({ name: s.source, tempMin: s.today.tempMin, tempMax: s.today.tempMax, precipitation: s.today.precipitation, error: s.error })),
  ];

  return (
    <section className="glass-card p-5">
      <h2 className="text-white/50 text-xs font-medium tracking-widest uppercase mb-4">Modellencomparator — vandaag</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-white/40 border-b border-white/10">
              <th className="pb-2 font-medium">Bron</th>
              <th className="pb-2 font-medium">Min</th>
              <th className="pb-2 font-medium">Max</th>
              <th className="pb-2 font-medium">Neerslag</th>
            </tr>
          </thead>
          <tbody>
            {sources.map(s => (
              <tr key={s.name} className="border-b border-white/10 last:border-0">
                <td className="py-2 text-white font-medium">{s.name}</td>
                <td className="py-2 text-white/80">{s.tempMin != null ? `${s.tempMin}°C` : "—"}</td>
                <td className="py-2 text-white/80">{s.tempMax != null ? `${s.tempMax}°C` : "—"}</td>
                <td className="py-2 text-white/80">{("error" in s && s.error) ? <span className="text-red-300 text-xs">niet beschikbaar</span> : (s.precipitation ?? "—")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
