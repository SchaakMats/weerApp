import { NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";
import { SCRAPE_HEADERS } from "@/lib/constants";

export const revalidate = 900;

type Warning = { level: "geel" | "oranje" | "rood"; description: string; valid: string };

// Meteoalarm Atom feed — officieel Europees waarschuwingssysteem, publiek
const FEED_URL = "https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-netherlands";

export async function GET() {
  try {
    const res = await axios.get(FEED_URL, {
      headers: { ...SCRAPE_HEADERS, Accept: "application/atom+xml,application/xml,text/xml,*/*" },
      timeout: 8000,
      validateStatus: () => true,
    });

    const $ = cheerio.load(res.data, { xmlMode: true });
    const warnings: Warning[] = [];

    $("entry").each((_, el) => {
      const title = $(el).find("title").text().trim();
      const summary = $(el).find("summary").text().trim();
      const updated = $(el).find("updated").text().trim();

      // Filter op Gelderland
      const combined = (title + " " + summary).toLowerCase();
      if (!combined.includes("gelderland")) return;

      // Bepaal level — feed gebruikt Engelse kleurnamen (Red/Orange/Yellow)
      const category = $(el).find("category").attr("term")?.toLowerCase() ?? "";
      let level: "geel" | "oranje" | "rood" = "geel";
      if (combined.includes("red ") || combined.includes("extreme") || category.includes("extreme")) level = "rood";
      else if (combined.includes("orange") || combined.includes("severe") || category.includes("severe")) level = "oranje";

      // Beschrijving: gebruik titel, vertaal kleurwoorden naar NL, strip locatieruis
      const typeMap: Record<string, string> = {
        "high-temperature warning": "Hittewaarschuwing",
        "thunderstorm warning": "Onweer",
        "wind warning": "Windwaarschuwing",
        "rain warning": "Zware neerslag",
        "snow warning": "Sneeuwwaarschuwing",
        "fog warning": "Mist",
        "ice warning": "Gladheid",
        "coastal event warning": "Kustwaarschuwing",
      };
      let description = title
        .replace(/^(red|orange|yellow)\s+/i, "")
        .replace(/\s+issued for The Netherlands\s*[-–]?\s*Gelderland/i, "")
        .trim();
      for (const [en, nl] of Object.entries(typeMap)) {
        description = description.replace(new RegExp(en, "i"), nl);
      }

      // Geldigheidsduur
      const valid = updated ? new Date(updated).toLocaleString("nl-NL", { dateStyle: "short", timeStyle: "short" }) : "";

      if (description.length > 2) warnings.push({ level, description, valid });
    });

    // Dedupliceer op basis van level + eerste 60 chars
    const seen = new Set<string>();
    const unique = warnings.filter(w => {
      const key = w.level + w.description.slice(0, 60);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return NextResponse.json({ warnings: unique.slice(0, 5) });
  } catch (e: any) {
    return NextResponse.json({ warnings: [], error: e.message }, { status: 200 });
  }
}
