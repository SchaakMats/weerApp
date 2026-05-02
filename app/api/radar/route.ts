import { NextRequest, NextResponse } from "next/server";

export const revalidate = 300;

export async function GET(req: NextRequest) {
  const ts = req.nextUrl.searchParams.get("ts") ?? "";

  const url = ts
    ? `https://api.buienradar.nl/image/1.0/radarmap/mercator/700x700/${ts}`
    : `https://api.buienradar.nl/image/1.0/radarmap/mercator/700x700`;

  try {
    const res = await fetch(url, {
      headers: {
        Referer: "https://www.buienradar.nl/",
        Origin: "https://www.buienradar.nl",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0",
      },
    });

    if (!res.ok) {
      return new NextResponse(null, { status: res.status });
    }

    const buffer = await res.arrayBuffer();
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": res.headers.get("Content-Type") ?? "image/png",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}
