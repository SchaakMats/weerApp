"use client";
import { useEffect, useState } from "react";

export default function BuienradarBlock() {
  const [key, setKey] = useState(0);

  // Ververs de radar elke 5 minuten
  useEffect(() => {
    const id = setInterval(() => setKey(k => k + 1), 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="p-6 bg-white rounded-2xl shadow">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Live Radar — Neerslagradar</h2>
        <button
          onClick={() => setKey(k => k + 1)}
          className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm"
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
      <p className="text-xs text-gray-400 mt-2 text-right">
        Bron: Buienradar · geanimeerde radar · ververst elke 5 minuten
      </p>
    </section>
  );
}
