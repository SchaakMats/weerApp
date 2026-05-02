"use client";
import { useEffect, useState } from "react";
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";
import type { OpenMeteoResponse } from "@/lib/types";

export default function ForecastChart() {
  const [data, setData] = useState<OpenMeteoResponse | null>(null);

  useEffect(() => {
    fetch("/api/openmeteo").then(r => r.json()).then(setData);
  }, []);

  if (!data || !data.daily) return <div className="p-6 text-gray-400">{(data as any)?.error ?? "Laden..."}</div>;

  const chartData = data.daily.map(d => ({
    date: d.date.slice(5),
    min: d.tempMin,
    max: d.tempMax,
    neerslag: d.precipitation,
    wind: d.windspeedMax,
  }));

  return (
    <section className="p-6 bg-white rounded-2xl shadow">
      <h2 className="text-xl font-bold mb-4">7-daagse verwachting</h2>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis yAxisId="temp" unit="°C" />
          <YAxis yAxisId="rain" orientation="right" unit="mm" />
          <Tooltip />
          <Legend />
          <Line yAxisId="temp" type="monotone" dataKey="max" stroke="#ef4444" name="Max °C" dot={false} />
          <Line yAxisId="temp" type="monotone" dataKey="min" stroke="#3b82f6" name="Min °C" dot={false} />
          <Bar yAxisId="rain" dataKey="neerslag" fill="#93c5fd" name="Neerslag mm" opacity={0.7} />
        </ComposedChart>
      </ResponsiveContainer>
    </section>
  );
}
