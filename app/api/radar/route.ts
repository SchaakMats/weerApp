import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Stap 1: haal de actuele radar-URL op uit de Buienradar datafeed
    const feed = await fetch("https://data.buienradar.nl/2.0/feed/json", {
      headers: { Accept: "application/json" },
    });
    const json = await feed.json();
    const radarUrl: string = json.actual?.actualradarurl;

    if (!radarUrl) {
      return new NextResponse("geen radar-url in feed", { status: 502 });
    }

    // Stap 2: proxy de GIF (volgt de redirect automatisch)
    const img = await fetch(radarUrl, {
      headers: {
        Referer: "https://www.buienradar.nl/",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0",
        Accept: "image/gif,image/*,*/*",
      },
      redirect: "follow",
    });

    if (!img.ok) {
      return new NextResponse(`upstream ${img.status}`, { status: img.status });
    }

    const buffer = await img.arrayBuffer();
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": img.headers.get("Content-Type") ?? "image/gif",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (e: any) {
    return new NextResponse(e.message, { status: 503 });
  }
}
