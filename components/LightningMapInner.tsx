"use client";
import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const WS_SERVERS = [
  "wss://ws1.blitzortung.org/",
  "wss://ws5.blitzortung.org/",
  "wss://ws6.blitzortung.org/",
  "wss://ws7.blitzortung.org/",
];

interface TrackedMarker {
  marker: L.CircleMarker;
  opacity: number;
}

export default function LightningMapInner() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<TrackedMarker[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [status, setStatus] = useState<"connecting" | "live" | "disconnected">("connecting");
  const [strikeCount, setStrikeCount] = useState(0);

  useEffect(() => {
    mountedRef.current = true;
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Inject dark tile style
    const style = document.createElement("style");
    style.textContent = ".leaflet-tile-pane { filter: brightness(0.4) saturate(0.3) hue-rotate(200deg); }";
    document.head.appendChild(style);

    // Init Leaflet map
    const map = L.map(mapContainerRef.current, {
      center: [52.4833, 6.0667],
      zoom: 8,
    });
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
    }).addTo(map);

    // Fade interval — every 2 seconds
    fadeIntervalRef.current = setInterval(() => {
      const step = 0.9 / 15;
      const remaining: TrackedMarker[] = [];
      for (const tracked of markersRef.current) {
        tracked.opacity -= step;
        if (tracked.opacity < 0.05) {
          tracked.marker.remove();
        } else {
          tracked.marker.setStyle({ fillOpacity: tracked.opacity, opacity: tracked.opacity });
          remaining.push(tracked);
        }
      }
      markersRef.current = remaining;
    }, 2000);

    // WebSocket connect function
    function connect() {
      if (!mountedRef.current) return;
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.close();
      }

      setStatus("connecting");
      const serverUrl = WS_SERVERS[Math.floor(Math.random() * WS_SERVERS.length)];
      const ws = new WebSocket(serverUrl);
      wsRef.current = ws;
      let hasReceivedMessage = false;

      ws.onopen = () => {
        ws.send(JSON.stringify({ time: 0 }));
        setStatus("live");
        // Ping every 30s to keep connection alive
        if (pingRef.current) clearInterval(pingRef.current);
        pingRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ time: 0 }));
        }, 30_000);
      };

      ws.onmessage = (event: MessageEvent) => {
        if (!hasReceivedMessage) hasReceivedMessage = true;
        try {
          const strike = JSON.parse(event.data as string);
          if (
            typeof strike.lat !== "number" ||
            typeof strike.lon !== "number"
          ) return;

          if (!mapInstanceRef.current) return;

          const circleMarker = L.circleMarker([strike.lat, strike.lon], {
            radius: 4,
            color: "#ffeb3b",
            fillColor: "#ff9800",
            fillOpacity: 0.9,
            weight: 1,
          }).addTo(mapInstanceRef.current!);

          markersRef.current.push({ marker: circleMarker, opacity: 0.9 });
          setStrikeCount(c => c + 1);

          if (markersRef.current.length > 200) {
            const oldest = markersRef.current.shift();
            oldest?.marker.remove();
          }
        } catch {
          // ignore parse errors
        }
      };

      ws.onclose = () => {
        if (pingRef.current) clearInterval(pingRef.current);
        setStatus("disconnected");
        reconnectTimerRef.current = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        if (pingRef.current) clearInterval(pingRef.current);
        setStatus("disconnected");
        ws.onclose = null;
        ws.close();
        reconnectTimerRef.current = setTimeout(connect, 3000);
      };
    }

    connect();

    return () => {
      mountedRef.current = false;
      markersRef.current = [];
      style.remove();
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
      if (pingRef.current) clearInterval(pingRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.close();
      }
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  const statusBadge = (
    <span
      className={`text-xs font-mono px-2 py-0.5 rounded-full ${
        status === "live"
          ? "bg-green-500/20 text-green-300"
          : status === "connecting"
          ? "bg-yellow-500/20 text-yellow-300"
          : "bg-red-500/20 text-red-300"
      }`}
    >
      {status === "live"
        ? strikeCount > 0 ? `● Live · ${strikeCount} inslagen` : "● Live · rustig"
        : status === "connecting"
        ? "○ Verbinden..."
        : "○ Herverbinden..."}
    </span>
  );

  return (
    <section className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white/50 text-xs font-medium tracking-widest uppercase">⚡ Live Bliksemradar</h2>
        {statusBadge}
      </div>
      <div
        ref={mapContainerRef}
        className="w-full rounded-xl overflow-hidden"
        style={{ height: "400px" }}
      />
      <p className="text-white/30 text-xs mt-2 text-right">Bron: Blitzortung.org · live bliksemdetectie</p>
    </section>
  );
}
