import { NextResponse } from "next/server";

export const revalidate = 300;

export async function GET() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch("https://data.buienradar.nl/2.0/feed/json", { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json({ error: `Buienradar returned ${res.status}` }, { status: 502 });
    }

    const json = await res.json();
    const station = json.actual?.stationmeasurements?.find(
      (s: any) => s.stationname === "Zwolle"
    ) ?? null;
    return NextResponse.json({ station });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "fetch failed" }, { status: 503 });
  }
}
