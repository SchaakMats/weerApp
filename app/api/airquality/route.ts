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
