"use client";
import { useEffect, useState, useRef } from "react";

function getRadarTimestamps(count: number): string[] {
  const now = new Date();
  // Round down to nearest 5 min, subtract 10 min for radar data delay
  now.setMinutes(Math.floor(now.getMinutes() / 5) * 5 - 10, 0, 0);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getTime() - (count - 1 - i) * 5 * 60 * 1000);
    return (
      d.getFullYear().toString() +
      String(d.getMonth() + 1).padStart(2, "0") +
      String(d.getDate()).padStart(2, "0") +
      String(d.getHours()).padStart(2, "0") +
      String(d.getMinutes()).padStart(2, "0")
    );
  });
}

export default function BuienradarBlock() {
  const [timestamps] = useState(() => getRadarTimestamps(12));
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setFrame(f => (f + 1) % timestamps.length);
      }, 500);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [playing, timestamps.length]);

  const ts = timestamps[frame];
  const timeLabel = ts ? `${ts.slice(8, 10)}:${ts.slice(10, 12)}` : "";

  return (
    <section className="p-6 bg-white rounded-2xl shadow">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Live Radar — Neerslagradar</h2>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-gray-500">{timeLabel}</span>
          <button
            onClick={() => setPlaying(p => !p)}
            className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
          >
            {playing ? "⏸ Pauze" : "▶ Afspelen"}
          </button>
        </div>
      </div>

      <div className="relative bg-gray-100 rounded-xl overflow-hidden" style={{ aspectRatio: "700/700" }}>
        {/* preload all frames, show only current */}
        {timestamps.map((t, i) => (
          <img
            key={t}
            src={`/api/radar?ts=${t}`}
            alt="Neerslagradar"
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-100 ${i === frame ? "opacity-100" : "opacity-0"}`}
          />
        ))}
      </div>

      <div className="flex gap-1 mt-3">
        {timestamps.map((t, i) => (
          <button
            key={t}
            onClick={() => { setFrame(i); setPlaying(false); }}
            className={`flex-1 h-1.5 rounded-full transition-colors ${i === frame ? "bg-blue-500" : "bg-gray-200 hover:bg-gray-300"}`}
          />
        ))}
      </div>
      <p className="text-xs text-gray-400 mt-2 text-right">Bron: Buienradar · 12 frames · laatste uur</p>
    </section>
  );
}
