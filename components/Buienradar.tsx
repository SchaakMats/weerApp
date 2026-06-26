"use client";
import { useEffect, useState } from "react";

export default function BuienradarBlock() {
  const [key, setKey] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setKey(k => k + 1), 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white/50 text-xs font-medium tracking-widest uppercase">Live Radar</h2>
        <button
          onClick={() => setKey(k => k + 1)}
          className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 text-sm transition-colors"
        >
          ↻ Ververs
        </button>
      </div>
      <img
        key={key}
        src={`/api/radar?_=${key}`}
        alt="Neerslagradar Nederland"
        className="w-full rounded-xl"
      />
      <p className="text-white/30 text-xs mt-2 text-right">
        Bron: Buienradar · ververst elke 5 minuten
      </p>
    </section>
  );
}
