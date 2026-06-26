"use client";
import { useEffect, useState } from "react";
import type { OpenMeteoResponse } from "@/lib/types";
import { weatherIcon } from "@/lib/weatherIcon";

const DAY_NAMES = ["zo", "ma", "di", "wo", "do", "vr", "za"];

export default function DayCards() {
  const [data, setData] = useState<OpenMeteoResponse | null>(null);

  useEffect(() => {
    fetch("/api/openmeteo").then(r => r.json()).then(setData);
  }, []);

  if (!data?.daily?.length) return null;

  return (
    <section className="glass-card p-4">
      <h2 className="text-white/50 text-xs font-medium tracking-widest uppercase mb-3">7 dagen</h2>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {data.daily.map((d, i) => {
          const date = new Date(d.date + "T12:00:00");
          const dayLabel = i === 0 ? "vandaag" : DAY_NAMES[date.getDay()];
          return (
            <div
              key={d.date}
              className={`flex flex-col items-center gap-1 min-w-[68px] rounded-xl py-3 px-2 ${
                i === 0 ? "bg-white/20 border border-white/30" : "bg-white/5"
              }`}
            >
              <p className="text-white/50 text-xs capitalize">{dayLabel}</p>
              <span className="text-2xl leading-none">{weatherIcon(d.weathercode)}</span>
              <p className="text-white font-semibold text-sm">{Math.round(d.tempMax)}°</p>
              <p className="text-white/40 text-xs">{Math.round(d.tempMin)}°</p>
              <p className="text-blue-300 text-xs">{d.precipitationProbability ?? 0}%</p>
              {d.windGusts != null && (
                <p className="text-white/40 text-xs">💨{Math.round(d.windGusts)}</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
