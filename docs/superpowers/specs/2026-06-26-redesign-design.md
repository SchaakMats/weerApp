# Weerdashboard Redesign + Uurlijkse Verwachting — Design Spec
*2026-06-26*

## Doel

Het bestaande weerdashboard voor Hattem een volledig nieuw visueel jasje geven (dark/glassmorphism, Apple-stijl) en uitbreiden met uurlijkse temperatuur en dagkaartjes. Alle bestaande data en blokken blijven behouden.

## Design Systeem

### Achtergrond
Vaste donkerblauwe gradiënt over de volledige pagina, altijd zichtbaar achter alle kaarten:
```css
background: linear-gradient(160deg, #0c1445 0%, #1a3a6b 50%, #0f2744 100%);
min-height: 100vh;
```

### Kaarten (glass-morphism)
Alle blokken worden glazen kaarten:
```css
background: rgba(255,255,255,0.10);
backdrop-filter: blur(12px);
border: 1px solid rgba(255,255,255,0.20);
border-radius: 1.5rem;
```

### Typografie
- Geist (al aanwezig), geen wijziging aan de font-import
- Labels: `text-white/60 text-xs`
- Waarden: `text-white font-semibold`
- Hero temperatuur: `text-7xl font-bold text-white`

### Accentkleuren
| Element | Kleur |
|---|---|
| Regen / neerslag | `#60a5fa` (blauw) |
| Zon / UV | `#fbbf24` (geel/oranje) |
| Positief / groen | `#34d399` |
| Dimme tekst | `rgba(255,255,255,0.6)` |

### Weericons
Emoji's op basis van WMO weathercode, één helper-functie `weatherIcon(code: number): string`:
- 0 → ☀️, 1–2 → 🌤️, 3 → ⛅, 45/48 → 🌫️
- 51–67 → 🌧️, 71–77 → ❄️, 80–82 → 🌦️, 95–99 → ⛈️

---

## Paginastructuur

### 1. Hero (nieuw)
- Geen kaart — direct op de gradiënt
- Grote temperatuur (72px), weericon (64px emoji), locatienaam "Hattem"
- Subtitel: gevoelstemperatuur + weeromschrijving ("Licht bewolkt")
- Data: `current.temperature`, `current.feelsLike`, `current.weathercode`

### 2. Uurlijkse strip (nieuw blok)
- Horizontaal scrollbare rij van 36 kaartjes (nu t/m morgen)
- Per uur: tijd, weericon, temperatuur, neerslagkans %
- Huidige uur visueel gemarkeerd (lichtere rand/accent)
- Data: `hourly[]` — bestaand + `precipitationProbability` (nieuw veld)

### 3. Dagkaartjes (nieuw blok, vervangt min/max-tabel)
- 7 compacte kaartjes horizontaal scrollbaar op mobiel
- Per dag: dag naam (ma/di/…), weericon, max°C, min°C, neerslagkans %
- Recharts 7-daagse grafiek blijft eronder voor detailweergave
- Data: `daily[]` + `daily[].precipitationProbability` (nieuw veld)

### 4. Live Radar
- Zelfde inhoud als nu, glass-kaart styling

### 5. Actueel detail
- 8 statistieken behouden (temp, gevoels, vochtigheid, wind, druk, UV, zicht, bewolking)
- Elk stat-kaartje krijgt een klein icon-emoji als visuele hint
- Grid 2-col op mobiel, 4-col op desktop

### 6. Modellencomparator
- Zelfde tabel, dark-gestyled (witte tekst, `border-white/10`)

### 7. Historisch (zelfde dag vorige jaren)
- Zelfde data, dark-gestyled

### 8. Geavanceerde inzichten
- Zonsop/-ondergang, luchtdrukcurve, windroosdiagram
- Recharts charts krijgen dark theme (witte assen/tekst, donkere grid)

---

## Nieuwe API-aanpassingen

### `lib/types.ts`
Twee nieuwe velden toevoegen:
```ts
HourlyForecast {
  // nieuw:
  precipitationProbability: number;
  weathercode: number;
}

DailyForecast {
  // nieuw:
  precipitationProbability: number;
}
```

### `app/api/openmeteo/route.ts`
Open-Meteo request uitbreiden met extra `hourly` en `daily` parameters:
- `hourly`: voeg `precipitation_probability`, `weathercode` toe
- `daily`: voeg `precipitation_probability_max` toe

---

## Nieuwe Components

| Component | Beschrijving |
|---|---|
| `components/HourlyStrip.tsx` | Nieuw — horizontaal scrollbare uurstrip |
| `components/DayCards.tsx` | Nieuw — 7 dagkaartjes |
| `lib/weatherIcon.ts` | Nieuw — helper weatherIcon(code) → emoji |

---

## Gewijzigde Components

| Component | Wijziging |
|---|---|
| `app/globals.css` | Gradiënt achtergrond, glass-kaart utility class |
| `app/layout.tsx` | `bg-transparent` body zodat gradiënt zichtbaar is |
| `app/page.tsx` | Hero sectie toevoegen, nieuwe volgorde blokken |
| `components/CurrentWeather.tsx` | Glass-kaart styling, emoji icons per stat |
| `components/Buienradar.tsx` | Glass-kaart styling |
| `components/ForecastChart.tsx` | Dark Recharts theme, dagkaartjes boven de chart |
| `components/Historical.tsx` | Glass-kaart styling |
| `components/ModelComparator.tsx` | Glass-kaart styling, witte tekst tabel |
| `components/Advanced.tsx` | Glass-kaart styling, dark Recharts theme |

---

## Scope — Wat NIET verandert

- Alle API routes (`/api/*`) — geen logica-wijziging behalve extra query-params in openmeteo
- Alle scraping-logica (`lib/scrape.ts`)
- Data-bronnen, caching, error handling
- Recharts blijft de chartlibrary — geen nieuwe dependencies

---

## Niet in scope

- Zoekfunctie / andere locaties
- Meldingen / push notificaties
- Animaties anders dan de bestaande radar-gif
- Air quality / pollen (vereist nieuwe data bron)
- Moon phase
