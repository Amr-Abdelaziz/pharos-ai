import { NextRequest } from 'next/server';
import { ok, err, parseQueryArray } from '@/lib/api-utils';

// ─── Types ──────────────────────────────────────────────────────────────────

interface CacheEntry {
  data: Record<string, CountryMilData>;
  ts: number;
}

interface CountryMilData {
  spending: { year: number; value: number }[];
  gdpPct: { year: number; value: number }[];
}

// ─── In-memory cache (24 h TTL) ────────────────────────────────────────────

const cache = new Map<string, CacheEntry>();
const TTL = 24 * 60 * 60 * 1000;

// ─── World Bank indicator IDs ───────────────────────────────────────────────

const INDICATORS = {
  spending: 'MS.MIL.XPND.CD',   // Military expenditure (current USD)
  gdpPct: 'MS.MIL.XPND.GD.ZS', // Military expenditure (% of GDP)
} as const;

const DATE_RANGE = '2015:2023';
const PER_PAGE = 200;

// ─── Fetch one indicator for one country ────────────────────────────────────

async function fetchIndicator(
  iso3: string,
  indicator: string,
): Promise<{ year: number; value: number }[]> {
  const url =
    `https://api.worldbank.org/v2/country/${iso3}/indicator/${indicator}` +
    `?date=${DATE_RANGE}&format=json&per_page=${PER_PAGE}`;

  const res = await fetch(url);
  if (!res.ok) return [];

  const json = await res.json();
  // World Bank returns [metadata, dataArray] — dataArray may be null
  const rows: any[] | null = json?.[1];
  if (!rows) return [];

  return rows
    .filter((r: any) => r.value !== null)
    .map((r: any) => ({ year: Number(r.date), value: Number(r.value) }))
    .sort((a, b) => a.year - b.year);
}

// ─── Route handler ──────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const countries = parseQueryArray(req.nextUrl.searchParams.get('countries'));

  if (countries.length === 0) {
    return err('BAD_REQUEST', 'countries query param required (comma-separated ISO3 codes)');
  }

  // Build cache key from sorted country list
  const cacheKey = [...countries].sort().join(',');
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < TTL) {
    return ok(cached.data);
  }

  // Fetch all indicators for all countries in parallel
  const results: Record<string, CountryMilData> = {};

  await Promise.all(
    countries.map(async (iso3) => {
      const [spending, gdpPct] = await Promise.all([
        fetchIndicator(iso3, INDICATORS.spending),
        fetchIndicator(iso3, INDICATORS.gdpPct),
      ]);
      results[iso3] = { spending, gdpPct };
    }),
  );

  cache.set(cacheKey, { data: results, ts: Date.now() });

  return ok(results);
}
