import { NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";
import { SCRAPE_HEADERS } from "@/lib/constants";

export const revalidate = 900;

type Warning = { level: "geel" | "oranje" | "rood"; description: string; valid: string };

export async function GET() {
  try {
    const res = await axios.get("https://www.knmi.nl/nederland-nu/weer/waarschuwingen", {
      headers: { ...SCRAPE_HEADERS, Referer: "https://www.knmi.nl/", Origin: "https://www.knmi.nl" },
      timeout: 8000,
      validateStatus: () => true,
    });

    const $ = cheerio.load(res.data);
    const warnings: Warning[] = [];

    $("[data-province], .warning-item, .waarschuwing").each((_, el) => {
      const text = $(el).text().toLowerCase();
      if (!text.includes("gelderland")) return;
      const level = text.includes("rood") ? "rood" : text.includes("oranje") ? "oranje" : "geel";
      const description = $(el).find("p, .description, .omschrijving").first().text().trim()
        || $(el).text().trim().slice(0, 200);
      const valid = $(el).find("time, .valid, .geldig").first().text().trim() || "";
      if (description) warnings.push({ level, description, valid });
    });

    // Fallback: zoek op kleur-badges als structuur anders is
    if (warnings.length === 0) {
      $("*:contains('Gelderland')").each((_, el) => {
        const parent = $(el).closest("article, section, li, div.warning, div.waarschuwing");
        if (!parent.length) return;
        const parentText = parent.text().toLowerCase();
        if (!parentText.includes("gelderland")) return;
        const level = parentText.includes("rood") ? "rood" : parentText.includes("oranje") ? "oranje" : "geel";
        const description = parent.text().trim().slice(0, 300);
        warnings.push({ level, description, valid: "" });
      });
    }

    return NextResponse.json({ warnings: warnings.slice(0, 5) });
  } catch (e: any) {
    return NextResponse.json({ warnings: [], error: e.message }, { status: 200 });
  }
}
