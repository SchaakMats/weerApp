"use client";
import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const tickStyle = { fill: "rgba(255,255,255,0.5)", fontSize: 11 };
const tooltipStyle = {
  contentStyle: { background: "rgba(15,39,68,0.95)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "0.75rem", color: "white" },
  labelStyle: { color: "rgba(255,255,255,0.6)" },
};

export default function Advanced() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/advanced").then(r => r.json()).then(setData);
  }, []);

  if (!data || data.error) return null;

  return (
    <section className="glass-card p-5 space-y-6">
      <h2 className="text-white/50 text-xs font-medium tracking-widest uppercase">Geavanceerde inzichten</h2>

      <div className="flex gap-8">
        <div>
          <p className="text-white/40 text-xs mb-1">Zonsopkomst</p>
          <p className="text-white font-semibold text-lg">🌅 {data.sunrise?.slice(11, 16)}</p>
        </div>
        <div>
          <p className="text-white/40 text-xs mb-1">Zonsondergang</p>
          <p className="text-white font-semibold text-lg">🌇 {data.sunset?.slice(11, 16)}</p>
        </div>
      </div>

      <div>
        <h3 className="text-white/50 text-xs font-medium tracking-widest uppercase mb-3">Luchtdruk afgelopen 24u</h3>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data.pressure}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis dataKey="time" interval={3} tick={tickStyle} axisLine={false} tickLine={false} />
            <YAxis domain={["auto", "auto"]} unit=" hPa" tick={tickStyle} axisLine={false} tickLine={false} />
            <Tooltip {...tooltipStyle} />
            <Line type="monotone" dataKey="pressure" stroke="#a78bfa" dot={false} name="Luchtdruk" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h3 className="text-white/50 text-xs font-medium tracking-widest uppercase mb-3">Windroosdiagram (afgelopen 24u)</h3>
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
        <circle key={f} cx={cx} cy={cy} r={r * f} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      ))}
      {buckets.map((val, i) => {
        const angle = (i * 22.5 - 90) * (Math.PI / 180);
        const len = (val / max) * r;
        const x = cx + Math.cos(angle) * len;
        const y = cy + Math.sin(angle) * len;
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#60a5fa" strokeWidth="4" strokeLinecap="round" />;
      })}
      {COMPASS.map((label, i) => {
        const angle = (i * 22.5 - 90) * (Math.PI / 180);
        const lx = cx + Math.cos(angle) * (r + 12);
        const ly = cy + Math.sin(angle) * (r + 12);
        return <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontSize="8" fill="rgba(255,255,255,0.5)">{label}</text>;
      })}
    </svg>
  );
}
