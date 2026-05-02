# Weerdashboard Hattem — Design Spec
*2026-05-02*

## Doel

Een uitgebreid weerdashboard voor Hattem (naast Zwolle, NL) dat meerdere weermodellen en databronnen combineert in één overzicht. Bedoeld als persoonlijk cadeau voor een weerfanaat — zo gedetailleerd en informatief mogelijk.

## Tech Stack

| Laag | Keuze |
|---|---|
| Framework | Next.js 14 (App Router) |
| Taal | TypeScript |
| Styling | Tailwind CSS |
| Grafieken | Recharts |
| Hosting | Vercel (gratis tier) |
| HTTP fetching | axios |
| HTML parsing | cheerio |

## Locatie

Hattem, Nederland — coördinaten: **52.4833°N, 6.0667°E**. Locatie is hardcoded, geen zoekfunctie nodig.

## Architectuur

```
Browser
  └── Next.js frontend (React, Tailwind)
        └── fetch() naar Next.js API routes (/api/*)
              ├── /api/openmeteo     → Open-Meteo REST API
              ├── /api/knmi          → KNMI open data JSON
              ├── /api/buienradar    → Buienradar JSON API
              ├── /api/scrape/weerplaza
              ├── /api/scrape/weeronline
              ├── /api/scrape/weernl
              └── /api/scrape/weerenradar
```

Alle externe calls lopen via API routes (server-side). Nooit direct vanuit de browser — voorkomt CORS-problemen en houdt scrapelogica server-side.

## Data Sources

| Bron | Data | Methode |
|---|---|---|
| Open-Meteo | Forecast 7d uurlijks, historisch ERA5 | Gratis API, geen key |
| KNMI open data | Actuele meting dichtstbijzijnd station (Heino) | HTTP JSON |
| Buienradar | Neerslagradar embed + actuele neerslag JSON | Embed + JSON API |
| Weerplaza | Verwachting + weermodel | axios/cheerio scraping |
| Weer.nl | Verwachting + waarschuwingen | axios/cheerio scraping |
| Weeronline.nl | Verwachting + indices (werkbaarheid etc.) | axios/cheerio scraping |
| Weerenradar.nl | Extra radarbeelden | axios/cheerio scraping |

## Scraping Standaard

Alle scrapers gebruiken de volledige browser-mimicking header set:
- `User-Agent`: Firefox op Windows
- `Accept`, `Accept-Language`, `Accept-Encoding: gzip, deflate, br`
- `Connection`, `Referer`, `Origin`, `DNT`, `Upgrade-Insecure-Requests`, `Cache-Control`
- **Alle `Sec-Fetch-*` headers**: `Sec-Fetch-Dest`, `Sec-Fetch-Mode`, `Sec-Fetch-Site`, `Sec-Fetch-User`

Retry met exponential backoff (max 3 pogingen). Als een bron faalt, geeft de API route een duidelijke foutmelding terug zodat het UI-blok "niet beschikbaar" toont zonder de rest te breken.

## Caching

Elke API route cacht de response 10–15 minuten via Vercel Response Cache headers. Voorkomt rate-limiting en houdt de site snel bij meerdere refreshes.

## Dashboard Indeling (één scrollende pagina)

### Blok 1 — Actueel weer Hattem
- Grote weergave: temperatuur, gevoelstemperatuur
- Secundair: bewolking, windsnelheid + richting, luchtdruk, luchtvochtigheid, UV-index, zichtbaarheid
- Data: KNMI (gemeten waarden) aangevuld met Open-Meteo

### Blok 2 — Buienradar Live Radar
- Embedded Buienradar animatie, ingezoomd op regio Hattem/Zwolle
- Toont actuele en komende neerslag als animatie

### Blok 3 — Modellencomparator
- Tabel met verwachting vandaag + 3 dagen vooruit
- Kolommen: Open-Meteo, Buienradar, Weer.nl, Weeronline, Weerplaza, Weerenradar
- Rijen: min/max temperatuur, neerslag, wind
- Maakt zichtbaar waar modellen het eens of oneens over zijn

### Blok 4 — 7-daagse verwachting (grafiek)
- Temperatuurcurve (min/max per dag)
- Neerslagstaven per dag
- Windkracht per dag
- Interactief: hover toont uurlijkse detail
- Data: Open-Meteo

### Blok 5 — Historisch & klimaatvergelijking
- Zelfde dag in 2025, 2024, 2023: temperatuur + neerslag
- 30-jarig klimaatgemiddelde voor deze dag
- Grafiek: huidig jaar vs gemiddelde vs vorig jaar
- Data: Open-Meteo ERA5

### Blok 6 — Geavanceerde inzichten
- Windroosdiagram (windrichting verdeling afgelopen 24u)
- Luchtdrukcurve afgelopen 24u (trend-indicator voor weersverandering)
- Zonsopkomst / -ondergang tijden
- Extra indices van Weeronline (werkbaarheidsindex, gevoelstemperatuur-index)

## Error Handling

- Elke databron is volledig onafhankelijk
- Als een scraper blokkeert of times out: dat blok toont "tijdelijk niet beschikbaar"
- Overige blokken laden normaal door
- Geen crashende pagina door één falende bron

## Deployment

1. Code op GitHub (private repository)
2. Vercel koppelt aan GitHub repo
3. Elke push naar `main` deployt automatisch
4. Vader krijgt publieke Vercel URL

## Bouwen in fasen

1. **Fase 1:** Basis Next.js setup + Open-Meteo API + actueel weer blok + 7-daagse grafiek
2. **Fase 2:** Buienradar embed + KNMI integratie
3. **Fase 3:** Scrapers (Weeronline, Weer.nl, Weerplaza, Weerenradar) + modellencomparator
4. **Fase 4:** Historisch blok (ERA5)
5. **Fase 5:** Geavanceerde inzichten (windroosdiagram, luchtdrukcurve)
