"use client";
import { useEffect, useState, useRef } from "react";
import type { OpenMeteoResponse } from "@/lib/types";
import { weatherIcon } from "@/lib/weatherIcon";

export default function HourlyStrip() {
  const [data, setData] = useState<OpenMeteoResponse | null>(null);
  const currentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/openmeteo").then(r => r.json()).then(setData);
  }, []);

  useEffect(() => {
    if (currentRef.current) {
      currentRef.current.scrollIntoView({ behavior: "instant", block: "nearest", inline: "center" });
    }
  }, [data]);

  if (!data?.hourly?.length) return null;

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const tomorrowDate = new Date(now.getTime() + 86400000);
  const tomorrowStr = `${tomorrowDate.getFullYear()}-${pad(tomorrowDate.getMonth() + 1)}-${pad(tomorrowDate.getDate())}`;
  const currentHourStr = `${todayStr}T${pad(now.getHours())}:00`;

  const hours = data.hourly
    .filter(h => h.time.slice(0, 10) === todayStr || h.time.slice(0, 10) === tomorrowStr)
    .slice(0, 36);

  return (
    <section className="glass-card p-4">
      <h2 className="text-white/50 text-xs font-medium tracking-widest uppercase mb-3">Per uur</h2>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {hours.map(h => {
          const isNow = h.time === currentHourStr;
          return (
            <div
              ref={isNow ? currentRef : undefined}
              key={h.time}
              className={`flex flex-col items-center gap-1 min-w-[52px] rounded-xl py-3 px-2 transition-colors ${
                isNow ? "bg-white/25 border border-white/40" : "bg-white/5"
              }`}
            >
              <p className="text-white/50 text-xs">{h.time.slice(11, 16)}</p>
              <span className="text-xl leading-none">{weatherIcon(h.weathercode)}</span>
              <p className="text-white font-semibold text-sm">{Math.round(h.temperature)}°</p>
              <p className="text-blue-300 text-xs">{h.precipitationProbability}%</p>
              {h.windGusts != null && (
                <p className="text-white/40 text-xs">{Math.round(h.windGusts)}km/h</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
