# Extra Features voor Weerhobbyist — Design Spec
*2026-06-26*

## Doel

Vijf nieuwe features toevoegen voor een weerhobbyist: dauwpunt, windstoten, 14-daagse verwachting, luchtkwaliteit, KNMI-waarschuwingen en een bliksemradar. Alles gratis, geen nieuwe API-keys.

## Overzicht nieuwe features

| Feature | Type | Databron |
|---|---|---|
| Dauwpunt + windstoten | Uitbreiding bestaand | Open-Meteo (al beschikbaar) |
| 14-daagse verwachting | Uitbreiding bestaand | Open-Meteo `forecast_days=14` |
| Luchtkwaliteit + pollen | Nieuw blok + route | Open-Meteo Air Quality API |
| KNMI Waarschuwingen | Nieuw blok + route | KNMI website scrapen |
| Bliksemradar | Nieuw blok | Lightningmaps.org iframe |

---

## Feature 1 — Dauwpunt + Windstoten

### Types (`lib/types.ts`)

Toevoegen aan `CurrentWeather`:
```ts
dewPoint: number;
windGusts: number;
```

Toevoegen aan `HourlyForecast`:
```ts
dewPoint: number;
windGusts: number;
```

Toevoegen aan `DailyForecast`:
```ts
windGusts: number;
```

### API Route (`app/api/openmeteo/route.ts`)

`current` params: voeg `dew_point_2m`, `wind_gusts_10m` toe
`hourly` params: voeg `dew_point_2m`, `wind_gusts_10m` toe
`daily` params: voeg `wind_gusts_10m_max` toe

Mapping:
- `current.dewPoint = json.current.dew_point_2m`
- `current.windGusts = json.current.wind_gusts_10m`
- `hourly[i].dewPoint = json.hourly.dew_point_2m?.[i] ?? null`
- `hourly[i].windGusts = json.hourly.wind_gusts_10m?.[i] ?? null`
- `daily[i].windGusts = json.daily.wind_gusts_10m_max?.[i] ?? null`

### UI Aanpassingen

**`components/CurrentWeather.tsx`:** Twee extra stat-kaartjes toevoegen aan de bestaande grid:
- `Stat label="Dauwpunt" value={`${data.dewPoint}°C`}` met icon 💦
- `Stat label="Windstoten" value={`${data.windGusts} km/h`}` met icon 🌬️

**`components/HourlyStrip.tsx`:** Onder de neerslagkans `%` een windstoot waarde tonen:
- Kleine tekst: `{h.windGusts} km/h` in `text-white/40 text-xs`

**`components/DayCards.tsx`:** Onder de neerslagkans een windstoten waarde:
- Kleine tekst: `💨 {d.windGusts}` in `text-white/40 text-xs`

---

## Feature 2 — 14-daagse verwachting

### API Route (`app/api/openmeteo/route.ts`)

Verander:
```ts
url.searchParams.set("forecast_days", "7");
```
naar:
```ts
url.searchParams.set("forecast_days", "14");
```

Geen verdere wijzigingen nodig. `DayCards` en `ForecastChart` tonen automatisch alle 14 dagen. `HourlyStrip` blijft gefilterd op vandaag + morgen (36 uur max).

---

## Feature 3 — Luchtkwaliteit + Pollen

### Nieuwe type (`lib/types.ts`)

```ts
export type AirQuality = {
  aqi: number;          // European AQI 0-500
  pm25: number;
  pm10: number;
  ozone: number;
  no2: number;
  grassPollen: number;
  birchPollen: number;
  mugwortPollen: number;
};
```

### Nieuwe API Route (`app/api/airquality/route.ts`)

URL: `https://air-quality-api.open-meteo.com/v1/air-quality`
Params: `latitude`, `longitude`, `current=european_aqi,pm2_5,pm10,ozone,nitrogen_dioxide,grass_pollen,birch_pollen,mugwort_pollen`, `timezone=Europe/Amsterdam`
Revalidate: 1800 (30 min)

Mapping:
```ts
{
  aqi: json.current.european_aqi,
  pm25: json.current.pm2_5,
  pm10: json.current.pm10,
  ozone: json.current.ozone,
  no2: json.current.nitrogen_dioxide,
  grassPollen: json.current.grass_pollen,
  birchPollen: json.current.birch_pollen,
  mugwortPollen: json.current.mugwort_pollen,
}
```

### AQI Helper (`lib/aqiLabel.ts`)

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

### Nieuwe Component (`components/AirQuality.tsx`)

- `"use client"`, fetcht `/api/airquality`
- Glass-card bovenaan: grote AQI-waarde + gekleurde label ("Goed" / "Matig" etc.)
- Grid 2×2: PM2.5, PM10, Ozon, NO₂ als stat-kaartjes
- Sub-sectie "Pollen": 🌾 Gras, 🌳 Berk, 🌿 Ambrosia — elk met `pollenLabel()`
- Loading: return null
- Error: return null (pollen kan seizoensgebonden ontbreken)

### Paginavolgorde (`app/page.tsx`)

`<AirQuality />` toevoegen na `<Advanced />` (onderaan, informatief blok).

---

## Feature 4 — KNMI Waarschuwingen

### Nieuwe API Route (`app/api/knmi-warnings/route.ts`)

Scrapt `https://www.knmi.nl/nederland-nu/weer/waarschuwingen` met axios + cheerio.
Zoekt naar waarschuwingen voor provincie **Gelderland**.
Revalidate: 900 (15 min).

Response type:
```ts
type Warning = {
  level: "geel" | "oranje" | "rood";
  description: string;
  validFrom: string;
  validUntil: string;
};
// Returns: { warnings: Warning[] }
// Als geen waarschuwingen: { warnings: [] }
```

Headers: volledige browser-mimicking header set (zoals andere scrapers in dit project).

### Nieuwe Component (`components/KnmiWarnings.tsx`)

- `"use client"`, fetcht `/api/knmi-warnings`
- Als `warnings.length === 0`: return null (blok onzichtbaar)
- Als actieve waarschuwingen: glass-card met gekleurde linkerborder
  - Geel: `border-l-4 border-yellow-400`
  - Oranje: `border-l-4 border-orange-500`
  - Rood: `border-l-4 border-red-600`
- Per waarschuwing: level badge + omschrijving + geldigheid
- Icon: ⚠️

### Paginavolgorde (`app/page.tsx`)

`<KnmiWarnings />` toevoegen **boven** `<Hero />` — waarschuwingen moeten direct zichtbaar zijn.

---

## Feature 5 — Bliksemradar

### Nieuwe Component (`components/LightningMap.tsx`)

- Geen API route nodig — iframe embed
- URL: `https://www.lightningmaps.org/?lang=nl#m=oss;t=3;s=0;o=0;b=;ts=0;`
- Glass-card wrapper
- `<iframe>` hoogte: 400px, width: 100%, `border-0 rounded-xl`
- Bron-vermelding: "Bron: Lightningmaps.org · live bliksemdetectie"
- Titel: "⚡ Live Bliksemradar"

### Paginavolgorde (`app/page.tsx`)

`<LightningMap />` toevoegen na `<BuienradarBlock />` — logisch samen met het radar-blok.

---

## Paginastructuur na alle wijzigingen

```
KnmiWarnings (alleen zichtbaar bij actieve waarschuwing)
Hero
HourlyStrip
DayCards
ForecastChart
BuienradarBlock
LightningMap          ← nieuw
CurrentWeatherBlock
ModelComparator
Historical
Advanced
AirQuality            ← nieuw
```

---

## Niet in scope

- Historische luchtkwaliteit
- Pollenkalender (seizoensoverzicht)
- Push-notificaties bij waarschuwingen
- Andere provincies dan Gelderland
