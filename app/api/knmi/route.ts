import { NextResponse } from "next/server";

export const revalidate = 900;

// Station Heino (dichtstbij Hattem) = 257
export async function GET() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(
      "https://www.daggegevens.knmi.nl/klimatologie/uurgegevens?stns=257&vars=T:U:P:DD:FF:VV:N&start=" +
        getYesterdayStr() + "&end=" + getTodayStr(),
      {
        headers: { Accept: "application/json" },
        signal: controller.signal,
      }
    );
    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json({ error: `KNMI returned ${res.status}` }, { status: 502 });
    }

    const text = await res.text();
    return NextResponse.json({ raw: text });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "knmi unavailable" }, { status: 503 });
  }
}

function getTodayStr() {
  return new Date().toISOString().slice(0, 10).replace(/-/g, "");
}
function getYesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}
