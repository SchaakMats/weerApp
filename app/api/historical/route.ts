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

  try {
    const results = await Promise.all(years.map(async (year) => {
      const date = `${year}-${mmdd}`;
      const url = new URL("https://archive-api.open-meteo.com/v1/archive");
      url.searchParams.set("latitude", String(LAT));
      url.searchParams.set("longitude", String(LON));
      url.searchParams.set("start_date", date);
      url.searchParams.set("end_date", date);
      url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,precipitation_sum");
      url.searchParams.set("timezone", "Europe/Amsterdam");

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(url.toString(), { signal: controller.signal });
      clearTimeout(timeout);

      if (!res.ok) return { year, date, tempMax: null, tempMin: null, precipitation: null };
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
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "fetch failed" }, { status: 503 });
  }
}
