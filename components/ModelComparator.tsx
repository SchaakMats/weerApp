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
    <section className="p-6 bg-white rounded-2xl shadow">
      <h2 className="text-xl font-bold mb-4">Modellencomparator — vandaag</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="pb-2">Bron</th>
              <th className="pb-2">Min</th>
              <th className="pb-2">Max</th>
              <th className="pb-2">Neerslag</th>
            </tr>
          </thead>
          <tbody>
            {sources.map(s => (
              <tr key={s.name} className="border-b last:border-0">
                <td className="py-2 font-medium">{s.name}</td>
                <td className="py-2">{s.tempMin != null ? `${s.tempMin}°C` : "—"}</td>
                <td className="py-2">{s.tempMax != null ? `${s.tempMax}°C` : "—"}</td>
                <td className="py-2">{("error" in s && s.error) ? <span className="text-red-400 text-xs">niet beschikbaar</span> : (s.precipitation ?? "—")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
