import axios from "axios";
import * as cheerio from "cheerio";
import { SCRAPE_HEADERS } from "./constants";

export type ScrapedForecast = {
  source: string;
  today: { tempMin: number | null; tempMax: number | null; precipitation: string | null; wind: string | null };
  days: { date: string; tempMin: number | null; tempMax: number | null; precipitation: string | null }[];
  error?: string;
};

export async function fetchHtml(url: string, referer?: string): Promise<string> {
  const res = await axios.get(url, {
    headers: { ...SCRAPE_HEADERS, ...(referer ? { Referer: referer, Origin: new URL(url).origin } : {}) },
    maxRedirects: 5,
    timeout: 8000,
    validateStatus: () => true,
  });
  return res.data;
}

export function emptyForecast(source: string, error: string): ScrapedForecast {
  return { source, today: { tempMin: null, tempMax: null, precipitation: null, wind: null }, days: [], error };
}
