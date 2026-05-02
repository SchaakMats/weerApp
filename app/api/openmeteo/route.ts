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
      },
      daily: (json.daily?.time ?? []).map((date: string, i: number) => ({
        date,
        tempMin: json.daily.temperature_2m_min?.[i] ?? null,
        tempMax: json.daily.temperature_2m_max?.[i] ?? null,
        precipitation: json.daily.precipitation_sum?.[i] ?? null,
        windspeedMax: json.daily.wind_speed_10m_max?.[i] ?? null,
        weathercode: json.daily.weather_code?.[i] ?? 0,
      })),
      hourly: (json.hourly?.time ?? []).map((time: string, i: number) => ({
        time,
        temperature: json.hourly.temperature_2m?.[i] ?? null,
        precipitation: json.hourly.precipitation?.[i] ?? null,
        windspeed: json.hourly.wind_speed_10m?.[i] ?? null,
      })),
    };

    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "fetch failed" }, { status: 503 });
  }
}
