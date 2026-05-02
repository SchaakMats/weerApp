import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { fetchHtml, emptyForecast } from "@/lib/scrape";

export const revalidate = 900;

export async function GET() {
  try {
    const html = await fetchHtml("https://www.weerplaza.nl/nederland/hattem/6826/", "https://www.weerplaza.nl/");
    const $ = cheerio.load(html);
    const days: any[] = [];
    $(".forecast-day, .gtm-uur-dag").each((_, el) => {
      const date = $(el).find(".date, .day").first().text().trim();
      const tempMax = parseFloat($(el).find(".max").first().text());
      const tempMin = parseFloat($(el).find(".min").first().text());
      const precipitation = $(el).find(".rain, .neerslag").first().text().trim();
      if (date) days.push({ date, tempMax: isNaN(tempMax) ? null : tempMax, tempMin: isNaN(tempMin) ? null : tempMin, precipitation: precipitation || null });
    });
    return NextResponse.json({
      source: "weerplaza",
      today: days[0] ? { tempMin: days[0].tempMin, tempMax: days[0].tempMax, precipitation: days[0].precipitation, wind: null } : { tempMin: null, tempMax: null, precipitation: null, wind: null },
      days: days.slice(1),
    });
  } catch (e: any) {
    return NextResponse.json(emptyForecast("weerplaza", e.message), { status: 503 });
  }
}
