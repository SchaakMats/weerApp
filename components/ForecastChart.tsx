"use client";
import { useEffect, useState } from "react";
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";
import type { OpenMeteoResponse } from "@/lib/types";

const tickStyle = { fill: "rgba(255,255,255,0.5)", fontSize: 11 };
const tooltipStyle = {
  contentStyle: { background: "rgba(15,39,68,0.95)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "0.75rem", color: "white" },
  labelStyle: { color: "rgba(255,255,255,0.6)" },
};

export default function ForecastChart() {
  const [data, setData] = useState<OpenMeteoResponse | null>(null);

  useEffect(() => {
    fetch("/api/openmeteo").then(r => r.json()).then(setData);
  }, []);

  if (!data || !data.daily) return null;

  const chartData = data.daily.map(d => ({
    date: d.date.slice(5),
    min: d.tempMin,
    max: d.tempMax,
    neerslag: d.precipitation,
    wind: d.windspeedMax,
  }));

  return (
    <section className="glass-card p-5">
      <h2 className="text-white/50 text-xs font-medium tracking-widest uppercase mb-4">7-daagse verwachting</h2>
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
          <XAxis dataKey="date" tick={tickStyle} axisLine={false} tickLine={false} />
          <YAxis yAxisId="temp" unit="°C" tick={tickStyle} axisLine={false} tickLine={false} />
          <YAxis yAxisId="rain" orientation="right" unit="mm" tick={tickStyle} axisLine={false} tickLine={false} />
          <Tooltip {...tooltipStyle} />
          <Legend wrapperStyle={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }} />
          <Line yAxisId="temp" type="monotone" dataKey="max" stroke="#f87171" name="Max °C" dot={false} strokeWidth={2} />
          <Line yAxisId="temp" type="monotone" dataKey="min" stroke="#60a5fa" name="Min °C" dot={false} strokeWidth={2} />
          <Bar yAxisId="rain" dataKey="neerslag" fill="#93c5fd" name="Neerslag mm" opacity={0.5} />
        </ComposedChart>
      </ResponsiveContainer>
    </section>
  );
}
