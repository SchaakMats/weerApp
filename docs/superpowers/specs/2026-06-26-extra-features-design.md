# Extra Features + Tab Navigatie — Design Spec
*2026-06-26*

## Doel

Tab-navigatie toevoegen zodat de pagina overzichtelijk blijft, plus vijf nieuwe features voor een weerhobbyist: dauwpunt, windstoten, 14-daagse verwachting, luchtkwaliteit, KNMI-waarschuwingen en bliksemradar.

---

## Tab Navigatie

### Structuur

Twee tabs, gestuurd door client-side state in `app/page.tsx` (`"use client"`).

**Tab 1 — Weer** (standaard actief)
```
KnmiWarnings (conditioneel — alleen zichtbaar bij actieve waarschuwing)
Hero
HourlyStrip
DayCards
ForecastChart
BuienradarBlock
LightningMap
CurrentWeatherBlock
AirQuality
```

**Tab 2 — Geavanceerd**
```
ModelComparator
Historical
Advanced
```

### Bottom Tab Bar (`components/TabBar.tsx`)

- Vaste balk onderin het scherm: `fixed bottom-0 left-0 right-0`
- Glass-morphism stijl: `glass-card` zonder border-radius bovenaan, `border-t border-white/20`
- Twee knoppen met icon + label:
  - 🌤️ **Weer** — activeert tab 1
  - 📊 **Geavanceerd** — activeert tab 2
- Actieve tab: `text-white`, inactieve tab: `text-white/40`
- Hoogte: `pb-safe` voor iOS home indicator, anders `py-3`
- `max-w-xl mx-auto` voor uitlijning met de rest van de content

### Page Layout aanpassing

`app/page.tsx` wordt een client component (`"use client"`). State: `const [tab, setTab] = useState<"weer" | "geavanceerd">("weer")`. Content wordt conditioneel gerenderd op basis van tab. Body krijgt `pb-20` padding zodat content niet achter de tab bar verdwijnt.

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
windGusts: number;
```

Toevoegen aan `DailyForecast`:
```ts
windGusts: number;
```

### API Route (`app/api/openmeteo/route.ts`)

`current` params: voeg `dew_point_2m`, `wind_gusts_10m` toe
`hourly` params: voeg `wind_gusts_10m` toe
`daily` params: voeg `wind_gusts_10m_max` toe

Mapping:
```ts
current.dewPoint = json.current.dew_point_2m
current.windGusts = json.current.wind_gusts_10m
hourly[i].windGusts = json.hourly.wind_gusts_10m?.[i] ?? null
daily[i].windGusts = json.daily.wind_gusts_10m_max?.[i] ?? null
```

### UI Aanpassingen

**`components/CurrentWeather.tsx`:** Twee extra stat-kaartjes:
- `💦 Dauwpunt` → `${data.dewPoint}°C`
- `🌬️ Windstoten` → `${data.windGusts} km/h`

**`components/HourlyStrip.tsx`:** Onder neerslagkans % een windstoot waarde:
- `text-white/40 text-xs`: `{Math.round(h.windGusts)} km/h`

**`components/DayCards.tsx`:** Onder neerslagkans % een windstoot waarde:
- `text-white/40 text-xs`: `💨 {Math.round(d.windGusts)}`

---

## Feature 2 — 14-daagse verwachting

### API Route (`app/api/openmeteo/route.ts`)

Verander `forecast_days` van `"7"` naar `"14"`. Geen verdere wijzigingen. DayCards en ForecastChart tonen automatisch 14 dagen.

---

## Feature 3 — Luchtkwaliteit + Pollen

### Nieuwe type (`lib/types.ts`)

```ts
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

### Nieuwe API Route (`app/api/airquality/route.ts`)

URL: `https://air-quality-api.open-meteo.com/v1/air-quality`
Params: `latitude`, `longitude`, `current=european_aqi,pm2_5,pm10,ozone,nitrogen_dioxide,grass_pollen,birch_pollen,mugwort_pollen`, `timezone=Europe/Amsterdam`
Revalidate: 1800

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
- Glass-card
- Bovenaan: grote AQI-waarde + gekleurde label (kleur uit `aqiLabel()`)
- Grid 2×2: PM2.5, PM10, Ozon, NO₂ als stat-kaartjes (`bg-white/5 rounded-xl p-3`)
- Sub-sectie "🌿 Pollen": 🌾 Gras, 🌳 Berk, 🌿 Ambrosia — elk met `pollenLabel()`
- Loading / error: return null

---

## Feature 4 — KNMI Waarschuwingen

### Nieuwe API Route (`app/api/knmi-warnings/route.ts`)

Scrapt `https://www.knmi.nl/nederland-nu/weer/waarschuwingen` met axios + cheerio.
Zoekt naar waarschuwingen voor provincie **Gelderland**.
Revalidate: 900

Request headers: volledige browser-mimicking set (User-Agent Firefox, Sec-Fetch-*, Accept-Encoding, etc.) — zelfde patroon als andere scrapers in `lib/scrape.ts`.

Response:
```ts
type Warning = {
  level: "geel" | "oranje" | "rood";
  description: string;
  validFrom: string;
  validUntil: string;
};
// { warnings: Warning[] }
// Lege array als geen actieve waarschuwingen
```

### Nieuwe Component (`components/KnmiWarnings.tsx`)

- `"use client"`, fetcht `/api/knmi-warnings`
- `warnings.length === 0` → return null
- Per waarschuwing: glass-card met gekleurde linkerborder:
  - Geel: `border-l-4 border-yellow-400`
  - Oranje: `border-l-4 border-orange-500`
  - Rood: `border-l-4 border-red-600`
- Inhoud: `⚠️ [level badge] [omschrijving]` + geldigheidsperiode in `text-white/50 text-xs`

---

## Feature 5 — Bliksemradar

### Nieuwe Component (`components/LightningMap.tsx`)

- Geen API route — iframe embed
- Glass-card wrapper
- Header: `⚡ Live Bliksemradar` (zelfde stijl als andere headers)
- `<iframe src="https://www.lightningmaps.org/?lang=nl#m=oss;t=3;s=0;o=0;b=;ts=0;" className="w-full rounded-xl border-0" style={{ height: "400px" }} />`
- Bron: `text-white/30 text-xs`: "Bron: Lightningmaps.org · live bliksemdetectie"

---

## Niet in scope

- Meer dan 2 tabs
- Historische luchtkwaliteit
- Push-notificaties bij waarschuwingen
- Andere provincies dan Gelderland
- Deep-links naar specifieke tabs
