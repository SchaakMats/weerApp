import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { fetchHtml, emptyForecast } from "@/lib/scrape";

export const revalidate = 900;

export async function GET() {
  try {
    const html = await fetchHtml("https://www.weerplaza.nl/nederland/hattem/6826/", "https://www.weerplaza.nl/");
    const $ = cheerio.load(html);

    const days: { date: string; tempMax: number | null; tempMin: number | null }[] = [];
    $("td[data-day]").each((_, el) => {
      const dayEl = $(el);
      const redText = dayEl.find(".red.temp").first().text().trim();
      if (!redText) return;
      const tempMax = parseFloat(redText);
      const tempMin = parseFloat(dayEl.find(".blue.temp").first().text().trim());
      days.push({
        date: dayEl.attr("data-day") ?? "",
        tempMax: isNaN(tempMax) ? null : tempMax,
        tempMin: isNaN(tempMin) ? null : tempMin,
      });
    });

    const precipText = $(".rain em").first().text().replace("Neerslag: ", "").trim() || null;

    return NextResponse.json({
      source: "weerplaza",
      today: days[0]
        ? { tempMin: days[0].tempMin, tempMax: days[0].tempMax, precipitation: precipText, wind: null }
        : { tempMin: null, tempMax: null, precipitation: null, wind: null },
      days: days.slice(1).map(d => ({ ...d, precipitation: null })),
    });
  } catch (e: any) {
    return NextResponse.json(emptyForecast("weerplaza", e.message), { status: 503 });
  }
}
