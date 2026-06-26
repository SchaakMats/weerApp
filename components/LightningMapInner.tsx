"use client";
import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const WS_SERVERS = [
  "wss://ws1.blitzortung.org:3000/",
  "wss://ws5.blitzortung.org:3000/",
  "wss://ws6.blitzortung.org:3000/",
  "wss://ws7.blitzortung.org:3000/",
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
  const [status, setStatus] = useState<"connecting" | "live" | "disconnected">("connecting");

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Inject dark tile style
    const style = document.createElement("style");
    style.textContent = ".leaflet-tile-pane { filter: brightness(0.4) saturate(0.3) hue-rotate(200deg); }";
    document.head.appendChild(style);

    // Init Leaflet map
    const map = L.map(mapContainerRef.current, {
      center: [52.4833, 6.0667],
      zoom: 7,
    });
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
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
      };

      ws.onmessage = (event: MessageEvent) => {
        if (!hasReceivedMessage) {
          hasReceivedMessage = true;
          setStatus("live");
        }
        try {
          const strike = JSON.parse(event.data as string);
          if (
            typeof strike.lat !== "number" ||
            typeof strike.lon !== "number"
          ) return;

          const circleMarker = L.circleMarker([strike.lat, strike.lon], {
            radius: 4,
            color: "#ffeb3b",
            fillColor: "#ff9800",
            fillOpacity: 0.9,
            weight: 1,
          }).addTo(mapInstanceRef.current!);

          markersRef.current.push({ marker: circleMarker, opacity: 0.9 });

          if (markersRef.current.length > 200) {
            const oldest = markersRef.current.shift();
            oldest?.marker.remove();
          }
        } catch {
          // ignore parse errors
        }
      };

      ws.onclose = () => {
        setStatus("disconnected");
        reconnectTimerRef.current = setTimeout(connect, 5000);
      };

      ws.onerror = () => {
        setStatus("disconnected");
        ws.onclose = null; // prevent onclose from also scheduling a reconnect
        ws.close();
        reconnectTimerRef.current = setTimeout(connect, 5000);
      };
    }

    connect();

    return () => {
      style.remove();
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
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
        ? "● Live"
        : status === "connecting"
        ? "○ Verbinden..."
        : "○ Geen verbinding"}
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
