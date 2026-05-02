# Weerdashboard Hattem — Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development or superpowers:executing-plans to implement task-by-task.

**Goal:** Uitgebreid weerdashboard voor Hattem (52.4833°N, 6.0667°E) met live radar, modellencomparator, historische data en geavanceerde inzichten.

**Architecture:** Next.js 14 App Router op Vercel. Browser fetcht Next.js API routes, die proxyen naar externe APIs en scrapers. Elke databron is onafhankelijk — als één faalt, laden de rest gewoon door.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Recharts, axios, cheerio

---

## Gedeelde constanten

```ts
// lib/constants.ts
export const LAT = 52.4833;
export const LON = 6.0667;
export const LOCATION_NAME = "Hattem";

export const SCRAPE_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "nl-NL,nl;q=0.9,en-US;q=0.8",
  "Accept-Encoding": "gzip, deflate, br",
  Connection: "keep-alive",
  DNT: "1",
  "Upgrade-Insecure-Requests": "1",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "Cache-Control": "max-age=0",
};
```

---

### Task 1: Project setup

**Files:**
- Create: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.ts`
- Create: `app/layout.tsx`, `app/page.tsx`
- Create: `lib/constants.ts`

- [ ] `npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"`
- [ ] Installeer dependencies: `npm install axios cheerio recharts`
- [ ] Installeer dev deps: `npm install -D @types/cheerio`
- [ ] Maak `lib/constants.ts` aan met bovenstaande inhoud
- [ ] Verwijder boilerplate uit `app/page.tsx`, laat lege `<main>` staan
- [ ] `git init && git add -A && git commit -m "feat: project setup"`

---

### Task 2: Open-Meteo API route — actueel + 7-daagse forecast

**Files:**
- Create: `app/api/openmeteo/route.ts`
- Create: `lib/types.ts`

- [ ] Maak `lib/types.ts`:

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
};

export type DailyForecast = {
  date: string;
  tempMin: number;
  tempMax: number;
  precipitation: number;
  windspeedMax: number;
  weathercode: number;
};

export type HourlyForecast = {
  time: string;
  temperature: number;
  precipitation: number;
  windspeed: number;
};

export type OpenMeteoResponse = {
  current: CurrentWeather;
  daily: DailyForecast[];
  hourly: HourlyForecast[];
};
```

- [ ] Maak `app/api/openmeteo/route.ts`:

```ts
import { NextResponse } from "next/server";
import { LAT, LON } from "@/lib/constants";
import type { OpenMeteoResponse } from "@/lib/types";

export const revalidate = 900; // 15 min cache

export async function GET() {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(LAT));
  url.searchParams.set("longitude", String(LON));
  url.searchParams.set("current", [
    "temperature_2m","apparent_temperature","relative_humidity_2m",
    "wind_speed_10m","wind_direction_10m","surface_pressure",
    "uv_index","visibility","cloud_cover","weather_code"
  ].join(","));
  url.searchParams.set("daily", [
    "temperature_2m_min","temperature_2m_max","precipitation_sum",
    "wind_speed_10m_max","weather_code"
  ].join(","));
  url.searchParams.set("hourly", [
    "temperature_2m","precipitation","wind_speed_10m"
  ].join(","));
  url.searchParams.set("timezone", "Europe/Amsterdam");
  url.searchParams.set("forecast_days", "7");

  const res = await fetch(url.toString());
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
    },
    daily: json.daily.time.map((date: string, i: number) => ({
      date,
      tempMin: json.daily.temperature_2m_min[i],
      tempMax: json.daily.temperature_2m_max[i],
      precipitation: json.daily.precipitation_sum[i],
      windspeedMax: json.daily.wind_speed_10m_max[i],
      weathercode: json.daily.weather_code[i],
    })),
    hourly: json.hourly.time.map((time: string, i: number) => ({
      time,
      temperature: json.hourly.temperature_2m[i],
      precipitation: json.hourly.precipitation[i],
      windspeed: json.hourly.wind_speed_10m[i],
    })),
  };

  return NextResponse.json(data);
}
```

- [ ] Test: `npm run dev` → open `http://localhost:3000/api/openmeteo` → controleer JSON
- [ ] `git add -A && git commit -m "feat: open-meteo api route"`

---

### Task 3: Actueel weer blok (UI)

**Files:**
- Create: `components/CurrentWeather.tsx`
- Modify: `app/page.tsx`

- [ ] Maak `components/CurrentWeather.tsx`:

```tsx
"use client";
import { useEffect, useState } from "react";
import type { CurrentWeather } from "@/lib/types";

export default function CurrentWeatherBlock() {
  const [data, setData] = useState<CurrentWeather | null>(null);

  useEffect(() => {
    fetch("/api/openmeteo").then(r => r.json()).then(d => setData(d.current));
  }, []);

  if (!data) return <div className="p-6 text-gray-400">Laden...</div>;

  return (
    <section className="p-6 bg-white rounded-2xl shadow">
      <h2 className="text-xl font-bold mb-4">Actueel — Hattem</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Temperatuur" value={`${data.temperature}°C`} />
        <Stat label="Gevoelstemperatuur" value={`${data.feelsLike}°C`} />
        <Stat label="Luchtvochtigheid" value={`${data.humidity}%`} />
        <Stat label="Wind" value={`${data.windspeed} km/h`} />
        <Stat label="Luchtdruk" value={`${data.pressure} hPa`} />
        <Stat label="UV-index" value={String(data.uvIndex)} />
        <Stat label="Zichtbaarheid" value={`${(data.visibility / 1000).toFixed(1)} km`} />
        <Stat label="Bewolking" value={`${data.cloudcover}%`} />
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}
```

- [ ] Voeg toe aan `app/page.tsx`:

```tsx
import CurrentWeatherBlock from "@/components/CurrentWeather";

export default function Home() {
  return (
    <main className="max-w-5xl mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold">Weerdashboard Hattem</h1>
      <CurrentWeatherBlock />
    </main>
  );
}
```

- [ ] Check in browser: actueel blok zichtbaar met data
- [ ] `git add -A && git commit -m "feat: current weather block"`

---

### Task 4: Buienradar

**Files:**
- Create: `app/api/buienradar/route.ts`
- Create: `components/Buienradar.tsx`

- [ ] Maak `app/api/buienradar/route.ts`:

```ts
import { NextResponse } from "next/server";

export const revalidate = 300;

export async function GET() {
  const res = await fetch("https://data.buienradar.nl/2.0/feed/json");
  const json = await res.json();
  const station = json.actual.stationmeasurements.find(
    (s: any) => s.stationname === "Zwolle"
  );
  return NextResponse.json({ station });
}
```

- [ ] Maak `components/Buienradar.tsx`:

```tsx
export default function BuienradarBlock() {
  return (
    <section className="p-6 bg-white rounded-2xl shadow">
      <h2 className="text-xl font-bold mb-4">Live Radar</h2>
      <iframe
        src="https://www.buienradar.nl/nederland/weerbericht/actueel-weer/buienradar?w=800&h=400&lat=52.4833&lon=6.0667"
        width="100%"
        height="400"
        className="rounded-xl"
        title="Buienradar"
      />
    </section>
  );
}
```

- [ ] Voeg `<BuienradarBlock />` toe in `app/page.tsx` na actueel blok
- [ ] Check in browser: radar zichtbaar
- [ ] `git add -A && git commit -m "feat: buienradar embed + api"`

---

### Task 5: KNMI API route

**Files:**
- Create: `app/api/knmi/route.ts`

- [ ] Maak `app/api/knmi/route.ts`:

```ts
import { NextResponse } from "next/server";

export const revalidate = 900;

// Station Heino (dichtstbij Hattem) = 257
export async function GET() {
  try {
    const res = await fetch(
      "https://www.daggegevens.knmi.nl/klimatologie/uurgegevens?stns=257&vars=T:U:P:DD:FF:VV:N&start=" +
        getYesterdayStr() + "&end=" + getTodayStr(),
      { headers: { Accept: "application/json" } }
    );
    const text = await res.text();
    return NextResponse.json({ raw: text });
  } catch {
    return NextResponse.json({ error: "knmi unavailable" }, { status: 503 });
  }
}

function getTodayStr() {
  return new Date().toISOString().slice(0, 10).replace(/-/g, "");
}
function getYesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}
```

- [ ] Test: `http://localhost:3000/api/knmi` → controleer KNMI response
- [ ] `git add -A && git commit -m "feat: knmi api route"`

---

### Task 6: Scraper utility + 4 scrapers

**Files:**
- Create: `lib/scrape.ts`
- Create: `app/api/scrape/weeronline/route.ts`
- Create: `app/api/scrape/weernl/route.ts`
- Create: `app/api/scrape/weerplaza/route.ts`
- Create: `app/api/scrape/weerenradar/route.ts`

- [ ] Maak `lib/scrape.ts`:

```ts
import axios from "axios";
import * as cheerio from "cheerio";
import { SCRAPE_HEADERS } from "./constants";

export type ScrapedForecast = {
  source: string;
  today: { tempMin: number | null; tempMax: number | null; precipitation: string | null; wind: string | null };
  days: { date: string; tempMin: number | null; tempMax: number | null; precipitation: string | null }[];
  error?: string;
};

export async function fetchHtml(url: string, referer?: string): Promise<string> {
  const res = await axios.get(url, {
    headers: { ...SCRAPE_HEADERS, ...(referer ? { Referer: referer, Origin: new URL(url).origin } : {}) },
    maxRedirects: 5,
    timeout: 8000,
    validateStatus: () => true,
  });
  return res.data;
}

export function emptyForecast(source: string, error: string): ScrapedForecast {
  return { source, today: { tempMin: null, tempMax: null, precipitation: null, wind: null }, days: [], error };
}
```

- [ ] Maak `app/api/scrape/weeronline/route.ts`:

```ts
import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { fetchHtml, emptyForecast } from "@/lib/scrape";

export const revalidate = 900;

export async function GET() {
  try {
    const html = await fetchHtml(
      "https://www.weeronline.nl/weer/hattem/302100",
      "https://www.weeronline.nl/"
    );
    const $ = cheerio.load(html);
    // Temperatuur min/max uit de dagkaarten
    const days: any[] = [];
    $(".weather-day-item, .forecast-day").each((_, el) => {
      const date = $(el).find(".date, .day-label").first().text().trim();
      const tempMax = parseFloat($(el).find(".temp-max, .temperature-max").first().text());
      const tempMin = parseFloat($(el).find(".temp-min, .temperature-min").first().text());
      const precipitation = $(el).find(".rain, .precipitation").first().text().trim();
      if (date) days.push({ date, tempMax: isNaN(tempMax) ? null : tempMax, tempMin: isNaN(tempMin) ? null : tempMin, precipitation: precipitation || null });
    });
    return NextResponse.json({
      source: "weeronline",
      today: days[0] ? { tempMin: days[0].tempMin, tempMax: days[0].tempMax, precipitation: days[0].precipitation, wind: null } : { tempMin: null, tempMax: null, precipitation: null, wind: null },
      days: days.slice(1),
    });
  } catch (e: any) {
    return NextResponse.json(emptyForecast("weeronline", e.message), { status: 503 });
  }
}
```

- [ ] Maak `app/api/scrape/weernl/route.ts` — zelfde patroon, URL: `https://www.weer.nl/verwachting/hattem/`

```ts
import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { fetchHtml, emptyForecast } from "@/lib/scrape";

export const revalidate = 900;

export async function GET() {
  try {
    const html = await fetchHtml("https://www.weer.nl/verwachting/hattem/", "https://www.weer.nl/");
    const $ = cheerio.load(html);
    const days: any[] = [];
    $(".forecast-item, .dag-item, .weather-row").each((_, el) => {
      const date = $(el).find(".datum, .day, .date").first().text().trim();
      const tempMax = parseFloat($(el).find(".max, .temp-max").first().text());
      const tempMin = parseFloat($(el).find(".min, .temp-min").first().text());
      const precipitation = $(el).find(".neerslag, .rain").first().text().trim();
      if (date) days.push({ date, tempMax: isNaN(tempMax) ? null : tempMax, tempMin: isNaN(tempMin) ? null : tempMin, precipitation: precipitation || null });
    });
    return NextResponse.json({
      source: "weernl",
      today: days[0] ? { tempMin: days[0].tempMin, tempMax: days[0].tempMax, precipitation: days[0].precipitation, wind: null } : { tempMin: null, tempMax: null, precipitation: null, wind: null },
      days: days.slice(1),
    });
  } catch (e: any) {
    return NextResponse.json(emptyForecast("weernl", e.message), { status: 503 });
  }
}
```

- [ ] Maak `app/api/scrape/weerplaza/route.ts`:

```ts
import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { fetchHtml, emptyForecast } from "@/lib/scrape";

export const revalidate = 900;

export async function GET() {
  try {
    const html = await fetchHtml("https://www.weerplaza.nl/nederland/hattem/6826/", "https://www.weerplaza.nl/");
    const $ = cheerio.load(html);
    const days: any[] = [];
    $(".forecast-day, .gtm-uur-dag").each((_, el) => {
      const date = $(el).find(".date, .day").first().text().trim();
      const tempMax = parseFloat($(el).find(".max").first().text());
      const tempMin = parseFloat($(el).find(".min").first().text());
      const precipitation = $(el).find(".rain, .neerslag").first().text().trim();
      if (date) days.push({ date, tempMax: isNaN(tempMax) ? null : tempMax, tempMin: isNaN(tempMin) ? null : tempMin, precipitation: precipitation || null });
    });
    return NextResponse.json({
      source: "weerplaza",
      today: days[0] ? { tempMin: days[0].tempMin, tempMax: days[0].tempMax, precipitation: days[0].precipitation, wind: null } : { tempMin: null, tempMax: null, precipitation: null, wind: null },
      days: days.slice(1),
    });
  } catch (e: any) {
    return NextResponse.json(emptyForecast("weerplaza", e.message), { status: 503 });
  }
}
```

- [ ] Maak `app/api/scrape/weerenradar/route.ts`:

```ts
import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { fetchHtml, emptyForecast } from "@/lib/scrape";

export const revalidate = 900;

export async function GET() {
  try {
    const html = await fetchHtml("https://www.weerenradar.nl/verwachting/hattem", "https://www.weerenradar.nl/");
    const $ = cheerio.load(html);
    const days: any[] = [];
    $(".forecast-day, .weather-day").each((_, el) => {
      const date = $(el).find(".date, .day").first().text().trim();
      const tempMax = parseFloat($(el).find(".max, .temp-max").first().text());
      const tempMin = parseFloat($(el).find(".min, .temp-min").first().text());
      const precipitation = $(el).find(".rain, .neerslag").first().text().trim();
      if (date) days.push({ date, tempMax: isNaN(tempMax) ? null : tempMax, tempMin: isNaN(tempMin) ? null : tempMin, precipitation: precipitation || null });
    });
    return NextResponse.json({
      source: "weerenradar",
      today: days[0] ? { tempMin: days[0].tempMin, tempMax: days[0].tempMax, precipitation: days[0].precipitation, wind: null } : { tempMin: null, tempMax: null, precipitation: null, wind: null },
      days: days.slice(1),
    });
  } catch (e: any) {
    return NextResponse.json(emptyForecast("weerenradar", e.message), { status: 503 });
  }
}
```

- [ ] Test alle 4 routes in browser: `http://localhost:3000/api/scrape/weeronline` etc.
- [ ] **Let op:** selectors zijn best-guess — pas aan op basis van wat de site daadwerkelijk teruggeeft (inspect element)
- [ ] `git add -A && git commit -m "feat: scrapers voor 4 weersites"`

---

### Task 7: Modellencomparator (UI)

**Files:**
- Create: `components/ModelComparator.tsx`

- [ ] Maak `components/ModelComparator.tsx`:

```tsx
"use client";
import { useEffect, useState } from "react";
import type { ScrapedForecast } from "@/lib/scrape";
import type { OpenMeteoResponse } from "@/lib/types";

const SCRAPERS = ["weeronline", "weernl", "weerplaza", "weerenradar"];

export default function ModelComparator() {
  const [scraped, setScraped] = useState<ScrapedForecast[]>([]);
  const [openmeteo, setOpenmeteo] = useState<OpenMeteoResponse | null>(null);

  useEffect(() => {
    fetch("/api/openmeteo").then(r => r.json()).then(setOpenmeteo);
    Promise.all(SCRAPERS.map(s => fetch(`/api/scrape/${s}`).then(r => r.json()))).then(setScraped);
  }, []);

  const sources = [
    { name: "Open-Meteo", tempMin: openmeteo?.daily[0]?.tempMin ?? null, tempMax: openmeteo?.daily[0]?.tempMax ?? null, precipitation: openmeteo?.daily[0]?.precipitation != null ? `${openmeteo.daily[0].precipitation} mm` : null },
    ...scraped.map(s => ({ name: s.source, tempMin: s.today.tempMin, tempMax: s.today.tempMax, precipitation: s.today.precipitation, error: s.error })),
  ];

  return (
    <section className="p-6 bg-white rounded-2xl shadow">
      <h2 className="text-xl font-bold mb-4">Modellencomparator — vandaag</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="pb-2">Bron</th>
              <th className="pb-2">Min</th>
              <th className="pb-2">Max</th>
              <th className="pb-2">Neerslag</th>
            </tr>
          </thead>
          <tbody>
            {sources.map(s => (
              <tr key={s.name} className="border-b last:border-0">
                <td className="py-2 font-medium">{s.name}</td>
                <td className="py-2">{s.tempMin != null ? `${s.tempMin}°C` : "—"}</td>
                <td className="py-2">{s.tempMax != null ? `${s.tempMax}°C` : "—"}</td>
                <td className="py-2">{("error" in s && s.error) ? <span className="text-red-400 text-xs">niet beschikbaar</span> : (s.precipitation ?? "—")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
```

- [ ] Voeg `<ModelComparator />` toe in `app/page.tsx`
- [ ] Check in browser: tabel zichtbaar, fouten tonen "niet beschikbaar"
- [ ] `git add -A && git commit -m "feat: modellencomparator"`

---

### Task 8: 7-daagse forecast grafiek

**Files:**
- Create: `components/ForecastChart.tsx`

- [ ] Maak `components/ForecastChart.tsx`:

```tsx
"use client";
import { useEffect, useState } from "react";
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";
import type { OpenMeteoResponse } from "@/lib/types";

export default function ForecastChart() {
  const [data, setData] = useState<OpenMeteoResponse | null>(null);

  useEffect(() => {
    fetch("/api/openmeteo").then(r => r.json()).then(setData);
  }, []);

  if (!data) return <div className="p-6 text-gray-400">Laden...</div>;

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
```

- [ ] Voeg `<ForecastChart />` toe in `app/page.tsx`
- [ ] Check in browser: grafiek zichtbaar
- [ ] `git add -A && git commit -m "feat: 7-daagse forecast grafiek"`

---

### Task 9: Historische data (ERA5)

**Files:**
- Create: `app/api/historical/route.ts`
- Create: `components/Historical.tsx`

- [ ] Maak `app/api/historical/route.ts`:

```ts
import { NextResponse } from "next/server";
import { LAT, LON } from "@/lib/constants";

export const revalidate = 86400; // 1 dag

export async function GET() {
  const today = new Date();
  const mmdd = today.toISOString().slice(5, 10); // bijv. "05-02"

  const years = [
    today.getFullYear() - 1,
    today.getFullYear() - 2,
    today.getFullYear() - 3,
  ];

  const results = await Promise.all(years.map(async (year) => {
    const date = `${year}-${mmdd}`;
    const url = new URL("https://archive-api.open-meteo.com/v1/archive");
    url.searchParams.set("latitude", String(LAT));
    url.searchParams.set("longitude", String(LON));
    url.searchParams.set("start_date", date);
    url.searchParams.set("end_date", date);
    url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,precipitation_sum");
    url.searchParams.set("timezone", "Europe/Amsterdam");
    const res = await fetch(url.toString());
    const json = await res.json();
    return {
      year,
      date,
      tempMax: json.daily?.temperature_2m_max?.[0] ?? null,
      tempMin: json.daily?.temperature_2m_min?.[0] ?? null,
      precipitation: json.daily?.precipitation_sum?.[0] ?? null,
    };
  }));

  return NextResponse.json({ historical: results });
}
```

- [ ] Maak `components/Historical.tsx`:

```tsx
"use client";
import { useEffect, useState } from "react";

type HistoricalEntry = { year: number; date: string; tempMax: number | null; tempMin: number | null; precipitation: number | null };

export default function Historical() {
  const [data, setData] = useState<HistoricalEntry[]>([]);

  useEffect(() => {
    fetch("/api/historical").then(r => r.json()).then(d => setData(d.historical));
  }, []);

  return (
    <section className="p-6 bg-white rounded-2xl shadow">
      <h2 className="text-xl font-bold mb-4">Zelfde dag vorige jaren</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data.map(d => (
          <div key={d.year} className="bg-gray-50 rounded-xl p-4">
            <p className="font-semibold text-lg">{d.year}</p>
            <p className="text-sm text-gray-500">{d.date}</p>
            <p>Max: <strong>{d.tempMax != null ? `${d.tempMax}°C` : "—"}</strong></p>
            <p>Min: <strong>{d.tempMin != null ? `${d.tempMin}°C` : "—"}</strong></p>
            <p>Neerslag: <strong>{d.precipitation != null ? `${d.precipitation} mm` : "—"}</strong></p>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] Voeg `<Historical />` toe in `app/page.tsx`
- [ ] Test: `http://localhost:3000/api/historical` → 3 jaren terug met data
- [ ] `git add -A && git commit -m "feat: historische data ERA5"`

---

### Task 10: Geavanceerde inzichten

**Files:**
- Create: `app/api/advanced/route.ts`
- Create: `components/Advanced.tsx`

- [ ] Maak `app/api/advanced/route.ts`:

```ts
import { NextResponse } from "next/server";
import { LAT, LON } from "@/lib/constants";

export const revalidate = 900;

export async function GET() {
  const end = new Date();
  const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().slice(0, 16);

  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(LAT));
  url.searchParams.set("longitude", String(LON));
  url.searchParams.set("hourly", "surface_pressure,wind_direction_10m,wind_speed_10m");
  url.searchParams.set("daily", "sunrise,sunset");
  url.searchParams.set("timezone", "Europe/Amsterdam");
  url.searchParams.set("past_days", "1");
  url.searchParams.set("forecast_days", "1");

  const res = await fetch(url.toString());
  const json = await res.json();

  return NextResponse.json({
    pressure: json.hourly.time.slice(-24).map((t: string, i: number) => ({
      time: t.slice(11, 16),
      pressure: json.hourly.surface_pressure.slice(-24)[i],
    })),
    windDirections: json.hourly.wind_direction_10m.slice(-24),
    windSpeeds: json.hourly.wind_speed_10m.slice(-24),
    sunrise: json.daily.sunrise[0],
    sunset: json.daily.sunset[0],
  });
}
```

- [ ] Maak `components/Advanced.tsx`:

```tsx
"use client";
import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function Advanced() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/advanced").then(r => r.json()).then(setData);
  }, []);

  if (!data) return <div className="p-6 text-gray-400">Laden...</div>;

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
```

- [ ] Voeg `<Advanced />` toe in `app/page.tsx`
- [ ] `git add -A && git commit -m "feat: geavanceerde inzichten"`

---

### Task 11: Deploy naar Vercel

- [ ] Maak GitHub repo aan (via `gh repo create weerApp --public`)
- [ ] `git remote add origin <url> && git push -u origin main`
- [ ] Ga naar vercel.com → New Project → importeer repo → Deploy
- [ ] Controleer publieke URL werkt volledig
- [ ] Stuur URL naar vader

---

## Volgorde samenvatting

1. Setup → 2. Open-Meteo API → 3. Actueel blok → 4. Buienradar → 5. KNMI → 6. Scrapers → 7. Comparator → 8. Forecast grafiek → 9. Historisch → 10. Geavanceerd → 11. Deploy
