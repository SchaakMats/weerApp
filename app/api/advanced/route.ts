import { NextResponse } from "next/server";
import { LAT, LON } from "@/lib/constants";

export const revalidate = 900;

export async function GET() {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(LAT));
  url.searchParams.set("longitude", String(LON));
  url.searchParams.set("hourly", "surface_pressure,wind_direction_10m,wind_speed_10m");
  url.searchParams.set("daily", "sunrise,sunset");
  url.searchParams.set("timezone", "Europe/Amsterdam");
  url.searchParams.set("past_days", "1");
  url.searchParams.set("forecast_days", "1");

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url.toString(), { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json({ error: `Open-Meteo returned ${res.status}` }, { status: 502 });
    }

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
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "fetch failed" }, { status: 503 });
  }
}
