import { NextResponse } from "next/server";
import { LAT, LON } from "@/lib/constants";
import { emptyForecast } from "@/lib/scrape";

export const revalidate = 900;

export async function GET() {
  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(LAT));
    url.searchParams.set("longitude", String(LON));
    url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,precipitation_sum");
    url.searchParams.set("timezone", "Europe/Amsterdam");
    url.searchParams.set("forecast_days", "1");
    url.searchParams.set("models", "gfs_seamless");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url.toString(), { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return NextResponse.json(emptyForecast("GFS", `upstream ${res.status}`), { status: 502 });

    const json = await res.json();
    const tempMax = json.daily?.temperature_2m_max?.[0] ?? null;
    const tempMin = json.daily?.temperature_2m_min?.[0] ?? null;
    const precipitation = json.daily?.precipitation_sum?.[0] ?? null;

    return NextResponse.json({
      source: "GFS",
      today: {
        tempMax,
        tempMin,
        precipitation: precipitation != null ? `${precipitation} mm` : null,
        wind: null,
      },
      days: [],
    });
  } catch (e: any) {
    return NextResponse.json(emptyForecast("GFS", e.message), { status: 503 });
  }
}
