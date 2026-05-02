"use client";
import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function Advanced() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/advanced").then(r => r.json()).then(setData);
  }, []);

  if (!data || data.error) return <div className="p-6 text-gray-400">{data?.error ?? "Laden..."}</div>;

  return (
    <section className="p-6 bg-white rounded-2xl shadow space-y-6">
      <h2 className="text-xl font-bold">Geavanceerde inzichten</h2>

      <div className="flex gap-8">
        <div>
          <p className="text-xs text-gray-500">Zonsopkomst</p>
          <p className="font-semibold">{data.sunrise?.slice(11, 16)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Zonsondergang</p>
          <p className="font-semibold">{data.sunset?.slice(11, 16)}</p>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Luchtdruk afgelopen 24u</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data.pressure}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" interval={3} />
            <YAxis domain={["auto", "auto"]} unit=" hPa" />
            <Tooltip />
            <Line type="monotone" dataKey="pressure" stroke="#8b5cf6" dot={false} name="Luchtdruk" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Windroosdiagram (afgelopen 24u)</h3>
        <WindRose directions={data.windDirections} speeds={data.windSpeeds} />
      </div>
    </section>
  );
}

const COMPASS = ["N","NNO","NO","ONO","O","OZO","ZO","ZZO","Z","ZZW","ZW","WZW","W","WNW","NW","NNW"];

function WindRose({ directions, speeds }: { directions: number[]; speeds: number[] }) {
  const buckets = Array(16).fill(0);
  directions.forEach((deg, i) => {
    const idx = Math.round(deg / 22.5) % 16;
    buckets[idx] += speeds[i];
  });
  const max = Math.max(...buckets) || 1;
  const cx = 100, cy = 100, r = 80;

  return (
    <svg width="200" height="200" viewBox="0 0 200 200">
      {[0.25, 0.5, 0.75, 1].map(f => (
        <circle key={f} cx={cx} cy={cy} r={r * f} fill="none" stroke="#e5e7eb" strokeWidth="1" />
      ))}
      {buckets.map((val, i) => {
        const angle = (i * 22.5 - 90) * (Math.PI / 180);
        const len = (val / max) * r;
        const x = cx + Math.cos(angle) * len;
        const y = cy + Math.sin(angle) * len;
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#3b82f6" strokeWidth="4" strokeLinecap="round" />;
      })}
      {COMPASS.map((label, i) => {
        const angle = (i * 22.5 - 90) * (Math.PI / 180);
        const lx = cx + Math.cos(angle) * (r + 12);
        const ly = cy + Math.sin(angle) * (r + 12);
        return <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontSize="8" fill="#6b7280">{label}</text>;
      })}
    </svg>
  );
}
