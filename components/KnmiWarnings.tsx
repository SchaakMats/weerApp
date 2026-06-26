"use client";
import { useEffect, useState } from "react";

type Warning = { level: "geel" | "oranje" | "rood"; description: string; valid: string };

const BORDER: Record<string, string> = {
  geel: "border-yellow-400",
  oranje: "border-orange-500",
  rood: "border-red-600",
};

const BADGE: Record<string, string> = {
  geel: "bg-yellow-400/20 text-yellow-300",
  oranje: "bg-orange-500/20 text-orange-300",
  rood: "bg-red-600/20 text-red-300",
};

export default function KnmiWarnings() {
  const [warnings, setWarnings] = useState<Warning[]>([]);

  useEffect(() => {
    fetch("/api/knmi-warnings").then(r => r.json()).then(d => setWarnings(d.warnings ?? []));
  }, []);

  if (!warnings.length) return null;

  return (
    <div className="space-y-2">
      {warnings.map((w, i) => (
        <div key={i} className={`glass-card p-4 border-l-4 ${BORDER[w.level]}`}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">⚠️</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${BADGE[w.level]}`}>{w.level}</span>
            {w.valid && <span className="text-white/40 text-xs">{w.valid}</span>}
          </div>
          <p className="text-white/80 text-sm">{w.description}</p>
        </div>
      ))}
    </div>
  );
}
