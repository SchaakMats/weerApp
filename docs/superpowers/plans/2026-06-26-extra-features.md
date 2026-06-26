# Extra Features + Tab Navigatie Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tab-navigatie (2 tabs, bottom bar) + 5 nieuwe features: dauwpunt/windstoten, 14-daagse, luchtkwaliteit, KNMI-waarschuwingen, bliksemradar.

**Architecture:** Client-side tab state in page.tsx. Nieuwe components volgen het bestaande patroon: `"use client"`, fetch naar eigen `/api/*` route, glass-card stijl. Geen nieuwe npm packages.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS v4, axios, cheerio

## Global Constraints

- Geen nieuwe npm packages
- Alle API calls via `/api/*` routes (nooit direct vanuit browser)
- Glass-card stijl: `className="glass-card p-5"`
- Headers in components: `text-white/50 text-xs font-medium tracking-widest uppercase`
- Stat-kaartjes: `bg-white/5 rounded-xl p-3`
- `SCRAPE_HEADERS` uit `lib/constants.ts` voor alle scrapers
- LAT/LON uit `lib/constants.ts`

---

### Task 1: Types + OpenMeteo Route (dauwpunt, windstoten, 14-daagse)

**Files:**
- Modify: `lib/types.ts`
- Modify: `app/api/openmeteo/route.ts`

**Interfaces:**
- Produces: `CurrentWeather.dewPoint`, `CurrentWeather.windGusts`, `HourlyForecast.windGusts`, `DailyForecast.windGusts`

- [ ] **Stap 1: Update lib/types.ts**

```ts
export type CurrentWeather = {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windspeed: number;
  winddirection: number;
  pressure: number;
  uvIndex: number;
  visibility: number;
  cloudcover: number;
  weathercode: number;
  dewPoint: number;
  windGusts: number;
};

export type DailyForecast = {
  date: string;
  tempMin: number;
  tempMax: number;
  precipitation: number;
  windspeedMax: number;
  weathercode: number;
  precipitationProbability: number;
  windGusts: number;
};

export type HourlyForecast = {
  time: string;
  temperature: number;
  precipitation: number;
  windspeed: number;
  precipitationProbability: number;
  weathercode: number;
  windGusts: number;
};

export type OpenMeteoResponse = {
  current: CurrentWeather;
  daily: DailyForecast[];
  hourly: HourlyForecast[];
};

export type AirQuality = {
  aqi: number;
  pm25: number;
  pm10: number;
  ozone: number;
  no2: number;
  grassPollen: number;
  birchPollen: number;
  mugwortPollen: number;
};
```

- [ ] **Stap 2: Update app/api/openmeteo/route.ts**

```ts
import { NextResponse } from "next/server";
import { LAT, LON } from "@/lib/constants";
import type { OpenMeteoResponse } from "@/lib/types";

export const revalidate = 900;

export async function GET() {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(LAT));
  url.searchParams.set("longitude", String(LON));
  url.searchParams.set("current", [
    "temperature_2m","apparent_temperature","relative_humidity_2m",
    "wind_speed_10m","wind_direction_10m","surface_pressure",
    "uv_index","visibility","cloud_cover","weather_code",
    "dew_point_2m","wind_gusts_10m"
  ].join(","));
  url.searchParams.set("daily", [
    "temperature_2m_min","temperature_2m_max","precipitation_sum",
    "wind_speed_10m_max","weather_code","precipitation_probability_max",
    "wind_gusts_10m_max"
  ].join(","));
  url.searchParams.set("hourly", [
    "temperature_2m","precipitation","wind_speed_10m",
    "precipitation_probability","weather_code","wind_gusts_10m"
  ].join(","));
  url.searchParams.set("timezone", "Europe/Amsterdam");
  url.searchParams.set("forecast_days", "14");

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url.toString(), { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json({ error: `Open-Meteo returned ${res.status}` }, { status: 502 });
    }

    const json = await res.json();

    const data: OpenMeteoResponse = {
      current: {
        temperature: json.current.temperature_2m,
        feelsLike: json.current.apparent_temperature,
        humidity: json.current.relative_humidity_2m,
        windspeed: json.current.wind_speed_10m,
        winddirection: json.current.wind_direction_10m,
        pressure: json.current.surface_pressure,
        uvIndex: json.current.uv_index,
        visibility: json.current.visibility,
        cloudcover: json.current.cloud_cover,
        weathercode: json.current.weather_code,
        dewPoint: json.current.dew_point_2m,
        windGusts: json.current.wind_gusts_10m,
      },
      daily: (json.daily?.time ?? []).map((date: string, i: number) => ({
        date,
        tempMin: json.daily.temperature_2m_min?.[i] ?? null,
        tempMax: json.daily.temperature_2m_max?.[i] ?? null,
        precipitation: json.daily.precipitation_sum?.[i] ?? null,
        windspeedMax: json.daily.wind_speed_10m_max?.[i] ?? null,
        weathercode: json.daily.weather_code?.[i] ?? 0,
        precipitationProbability: json.daily.precipitation_probability_max?.[i] ?? 0,
        windGusts: json.daily.wind_gusts_10m_max?.[i] ?? null,
      })),
      hourly: (json.hourly?.time ?? []).map((time: string, i: number) => ({
        time,
        temperature: json.hourly.temperature_2m?.[i] ?? null,
        precipitation: json.hourly.precipitation?.[i] ?? null,
        windspeed: json.hourly.wind_speed_10m?.[i] ?? null,
        precipitationProbability: json.hourly.precipitation_probability?.[i] ?? 0,
        weathercode: json.hourly.weather_code?.[i] ?? 0,
        windGusts: json.hourly.wind_gusts_10m?.[i] ?? null,
      })),
    };

    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "fetch failed" }, { status: 503 });
  }
}
```

- [ ] **Stap 3: Commit**

```bash
git add lib/types.ts app/api/openmeteo/route.ts
git commit -m "feat: voeg dewPoint, windGusts toe aan types en openmeteo route; 14-daagse"
```

---

### Task 2: Tab Navigatie

**Files:**
- Create: `components/TabBar.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Produces: bottom tab bar met tabs "weer" | "geavanceerd"

- [ ] **Stap 1: Maak components/TabBar.tsx**

```tsx
type Tab = "weer" | "geavanceerd";

export default function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/20"
      style={{ background: "rgba(12,20,69,0.85)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}>
      <div className="max-w-xl mx-auto flex">
        {([["weer", "🌤️", "Weer"], ["geavanceerd", "📊", "Geavanceerd"]] as [Tab, string, string][]).map(([key, icon, label]) => (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${active === key ? "text-white" : "text-white/40"}`}
          >
            <span className="text-xl">{icon}</span>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Stap 2: Update app/page.tsx**

```tsx
"use client";
import { useState } from "react";
import TabBar from "@/components/TabBar";
import KnmiWarnings from "@/components/KnmiWarnings";
import Hero from "@/components/Hero";
import HourlyStrip from "@/components/HourlyStrip";
import DayCards from "@/components/DayCards";
import ForecastChart from "@/components/ForecastChart";
import BuienradarBlock from "@/components/Buienradar";
import LightningMap from "@/components/LightningMap";
import CurrentWeatherBlock from "@/components/CurrentWeather";
import AirQuality from "@/components/AirQuality";
import ModelComparator from "@/components/ModelComparator";
import Historical from "@/components/Historical";
import Advanced from "@/components/Advanced";

type Tab = "weer" | "geavanceerd";

export default function Home() {
  const [tab, setTab] = useState<Tab>("weer");

  return (
    <>
      <main className="max-w-xl mx-auto px-4 py-6 pb-24 space-y-4">
        {tab === "weer" && (
          <>
            <KnmiWarnings />
            <Hero />
            <HourlyStrip />
            <DayCards />
            <ForecastChart />
            <BuienradarBlock />
            <LightningMap />
            <CurrentWeatherBlock />
            <AirQuality />
          </>
        )}
        {tab === "geavanceerd" && (
          <>
            <ModelComparator />
            <Historical />
            <Advanced />
          </>
        )}
      </main>
      <TabBar active={tab} onChange={setTab} />
    </>
  );
}
```

Noot: `KnmiWarnings`, `LightningMap`, `AirQuality` bestaan nog niet — maak tijdelijke placeholders:

`components/KnmiWarnings.tsx`: `export default function KnmiWarnings() { return null; }`
`components/LightningMap.tsx`: `export default function LightningMap() { return null; }`
`components/AirQuality.tsx`: `export default function AirQuality() { return null; }`

- [ ] **Stap 3: Commit**

```bash
git add components/TabBar.tsx components/KnmiWarnings.tsx components/LightningMap.tsx components/AirQuality.tsx app/page.tsx
git commit -m "feat: tab-navigatie met bottom bar (Weer / Geavanceerd)"
```

---

### Task 3: Dauwpunt + Windstoten UI

**Files:**
- Modify: `components/CurrentWeather.tsx`
- Modify: `components/HourlyStrip.tsx`
- Modify: `components/DayCards.tsx`

**Interfaces:**
- Consumes: `CurrentWeather.dewPoint`, `CurrentWeather.windGusts`, `HourlyForecast.windGusts`, `DailyForecast.windGusts` uit Task 1

- [ ] **Stap 1: Update components/CurrentWeather.tsx**

Voeg toe aan `STAT_ICONS`:
```ts
"Dauwpunt": "💦",
"Windstoten": "🌬️",
```

Voeg toe aan de grid (na `Bewolking`):
```tsx
<Stat label="Dauwpunt" value={`${data.dewPoint}°C`} />
<Stat label="Windstoten" value={`${data.windGusts} km/h`} />
```

- [ ] **Stap 2: Update components/HourlyStrip.tsx**

Voeg toe onder `<p className="text-blue-300 text-xs">`:
```tsx
{h.windGusts != null && (
  <p className="text-white/40 text-xs">{Math.round(h.windGusts)}km/h</p>
)}
```

- [ ] **Stap 3: Update components/DayCards.tsx**

Voeg toe onder `<p className="text-blue-300 text-xs">`:
```tsx
{d.windGusts != null && (
  <p className="text-white/40 text-xs">💨{Math.round(d.windGusts)}</p>
)}
```

- [ ] **Stap 4: Commit**

```bash
git add components/CurrentWeather.tsx components/HourlyStrip.tsx components/DayCards.tsx
git commit -m "feat: dauwpunt en windstoten in CurrentWeather, HourlyStrip, DayCards"
```

---

### Task 4: Luchtkwaliteit

**Files:**
- Create: `lib/aqiLabel.ts`
- Create: `app/api/airquality/route.ts`
- Modify: `components/AirQuality.tsx` (vervang placeholder)

**Interfaces:**
- Consumes: `AirQuality` type uit `lib/types.ts` (Task 1)
- Consumes: `LAT`, `LON` uit `lib/constants.ts`
- Produces: `aqiLabel(aqi)`, `pollenLabel(value)` uit `lib/aqiLabel.ts`

- [ ] **Stap 1: Maak lib/aqiLabel.ts**

```ts
export function aqiLabel(aqi: number): { label: string; color: string } {
  if (aqi <= 20) return { label: "Goed", color: "#34d399" };
  if (aqi <= 40) return { label: "Redelijk", color: "#a3e635" };
  if (aqi <= 60) return { label: "Matig", color: "#fbbf24" };
  if (aqi <= 80) return { label: "Slecht", color: "#f97316" };
  if (aqi <= 100) return { label: "Zeer slecht", color: "#ef4444" };
  return { label: "Gevaarlijk", color: "#7c3aed" };
}

export function pollenLabel(value: number): string {
  if (value === 0) return "Geen";
  if (value <= 10) return "Laag";
  if (value <= 30) return "Matig";
  if (value <= 80) return "Hoog";
  return "Zeer hoog";
}
```

- [ ] **Stap 2: Maak app/api/airquality/route.ts**

```ts
import { NextResponse } from "next/server";
import { LAT, LON } from "@/lib/constants";
import type { AirQuality } from "@/lib/types";

export const revalidate = 1800;

export async function GET() {
  const url = new URL("https://air-quality-api.open-meteo.com/v1/air-quality");
  url.searchParams.set("latitude", String(LAT));
  url.searchParams.set("longitude", String(LON));
  url.searchParams.set("current", [
    "european_aqi","pm2_5","pm10","ozone",
    "nitrogen_dioxide","grass_pollen","birch_pollen","mugwort_pollen"
  ].join(","));
  url.searchParams.set("timezone", "Europe/Amsterdam");

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url.toString(), { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return NextResponse.json({ error: `AQ API ${res.status}` }, { status: 502 });

    const json = await res.json();
    const data: AirQuality = {
      aqi: json.current.european_aqi ?? 0,
      pm25: json.current.pm2_5 ?? 0,
      pm10: json.current.pm10 ?? 0,
      ozone: json.current.ozone ?? 0,
      no2: json.current.nitrogen_dioxide ?? 0,
      grassPollen: json.current.grass_pollen ?? 0,
      birchPollen: json.current.birch_pollen ?? 0,
      mugwortPollen: json.current.mugwort_pollen ?? 0,
    };
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "fetch failed" }, { status: 503 });
  }
}
```

- [ ] **Stap 3: Vervang components/AirQuality.tsx**

```tsx
"use client";
import { useEffect, useState } from "react";
import type { AirQuality } from "@/lib/types";
import { aqiLabel, pollenLabel } from "@/lib/aqiLabel";

export default function AirQuality() {
  const [data, setData] = useState<AirQuality | null>(null);

  useEffect(() => {
    fetch("/api/airquality").then(r => r.json()).then(d => {
      if (!d.error) setData(d);
    });
  }, []);

  if (!data) return null;

  const { label, color } = aqiLabel(data.aqi);

  return (
    <section className="glass-card p-5">
      <h2 className="text-white/50 text-xs font-medium tracking-widest uppercase mb-4">Luchtkwaliteit</h2>
      <div className="flex items-center gap-4 mb-4">
        <span className="text-5xl font-bold text-white">{data.aqi}</span>
        <span className="text-lg font-semibold" style={{ color }}>{label}</span>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          ["PM2.5", `${data.pm25} µg/m³`],
          ["PM10", `${data.pm10} µg/m³`],
          ["Ozon", `${data.ozone} µg/m³`],
          ["NO₂", `${data.no2} µg/m³`],
        ].map(([l, v]) => (
          <div key={l} className="bg-white/5 rounded-xl p-3">
            <p className="text-white/50 text-xs mb-1">{l}</p>
            <p className="text-white font-semibold">{v}</p>
          </div>
        ))}
      </div>
      <h3 className="text-white/50 text-xs font-medium tracking-widest uppercase mb-3">🌿 Pollen</h3>
      <div className="grid grid-cols-3 gap-2">
        {[
          ["🌾 Gras", data.grassPollen],
          ["🌳 Berk", data.birchPollen],
          ["🌿 Ambro.", data.mugwortPollen],
        ].map(([l, v]) => (
          <div key={String(l)} className="bg-white/5 rounded-xl p-3 text-center">
            <p className="text-white/50 text-xs mb-1">{l}</p>
            <p className="text-white text-sm font-semibold">{pollenLabel(Number(v))}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Stap 4: Commit**

```bash
git add lib/aqiLabel.ts app/api/airquality/route.ts components/AirQuality.tsx
git commit -m "feat: luchtkwaliteit blok met AQI, fijnstof en pollen"
```

---

### Task 5: KNMI Waarschuwingen

**Files:**
- Create: `app/api/knmi-warnings/route.ts`
- Modify: `components/KnmiWarnings.tsx` (vervang placeholder)

- [ ] **Stap 1: Maak app/api/knmi-warnings/route.ts**

```ts
import { NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";
import { SCRAPE_HEADERS } from "@/lib/constants";

export const revalidate = 900;

type Warning = { level: "geel" | "oranje" | "rood"; description: string; valid: string };

export async function GET() {
  try {
    const res = await axios.get("https://www.knmi.nl/nederland-nu/weer/waarschuwingen", {
      headers: { ...SCRAPE_HEADERS, Referer: "https://www.knmi.nl/", Origin: "https://www.knmi.nl" },
      timeout: 8000,
      validateStatus: () => true,
    });

    const $ = cheerio.load(res.data);
    const warnings: Warning[] = [];

    $("[data-province], .warning-item, .waarschuwing").each((_, el) => {
      const text = $(el).text().toLowerCase();
      if (!text.includes("gelderland")) return;
      const level = text.includes("rood") ? "rood" : text.includes("oranje") ? "oranje" : "geel";
      const description = $(el).find("p, .description, .omschrijving").first().text().trim()
        || $(el).text().trim().slice(0, 200);
      const valid = $(el).find("time, .valid, .geldig").first().text().trim() || "";
      if (description) warnings.push({ level, description, valid });
    });

    // Fallback: zoek op kleur-badges als structuur anders is
    if (warnings.length === 0) {
      $("*:contains('Gelderland')").each((_, el) => {
        const parent = $(el).closest("article, section, li, div.warning, div.waarschuwing");
        if (!parent.length) return;
        const parentText = parent.text().toLowerCase();
        if (!parentText.includes("gelderland")) return;
        const level = parentText.includes("rood") ? "rood" : parentText.includes("oranje") ? "oranje" : "geel";
        const description = parent.text().trim().slice(0, 300);
        warnings.push({ level, description, valid: "" });
      });
    }

    return NextResponse.json({ warnings: warnings.slice(0, 5) });
  } catch (e: any) {
    return NextResponse.json({ warnings: [], error: e.message }, { status: 200 });
  }
}
```

- [ ] **Stap 2: Vervang components/KnmiWarnings.tsx**

```tsx
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
```

- [ ] **Stap 3: Commit**

```bash
git add app/api/knmi-warnings/route.ts components/KnmiWarnings.tsx
git commit -m "feat: KNMI waarschuwingen voor Gelderland"
```

---

### Task 6: Bliksemradar

**Files:**
- Modify: `components/LightningMap.tsx` (vervang placeholder)

- [ ] **Stap 1: Vervang components/LightningMap.tsx**

```tsx
export default function LightningMap() {
  return (
    <section className="glass-card p-5">
      <h2 className="text-white/50 text-xs font-medium tracking-widest uppercase mb-4">⚡ Live Bliksemradar</h2>
      <iframe
        src="https://www.lightningmaps.org/?lang=nl#m=oss;t=3;s=0;o=0;b=;ts=0;"
        className="w-full rounded-xl border-0"
        style={{ height: "400px" }}
        title="Live bliksemradar"
        loading="lazy"
      />
      <p className="text-white/30 text-xs mt-2 text-right">Bron: Lightningmaps.org · live bliksemdetectie</p>
    </section>
  );
}
```

- [ ] **Stap 2: Commit + push**

```bash
git add components/LightningMap.tsx
git commit -m "feat: live bliksemradar via Lightningmaps.org embed"
git push origin main
```
