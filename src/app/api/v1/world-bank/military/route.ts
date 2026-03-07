import { NextRequest } from 'next/server';

import { err, ok, parseQueryArray } from '@/server/lib/api-utils';

// Types

type CacheEntry = {
  data: Record<string, CountryWorldBankData>;
  ts: number;
};

type CountryWorldBankData = {
  spending: { year: number; value: number }[];
  gdpPct: { year: number; value: number }[];
  armedForces: { year: number; value: number }[];
  inflation: { year: number; value: number }[];
  gdpGrowth: { year: number; value: number }[];
  refugeePopulation: { year: number; value: number }[];
  gini: { year: number; value: number }[];
};

type WorldBankRow = {
  date: string;
  value: number | null;
};

// Cache (24h TTL)

const cache = new Map<string, CacheEntry>();
const TTL = 24 * 60 * 60 * 1000;

// World Bank indicator IDs

const INDICATORS = {
  spending: 'MS.MIL.XPND.CD',
  gdpPct: 'MS.MIL.XPND.GD.ZS', // Military expenditure (% of GDP)
  armedForces: 'MS.MIL.TOTL.P1',
  inflation: 'FP.CPI.TOTL.ZG',
  gdpGrowth: 'NY.GDP.MKTP.KD.ZG',
  refugeePopulation: 'SM.POP.REFG',
  gini: 'SI.POV.GINI',
} as const;

const END_YEAR = new Date().getUTCFullYear();
const START_YEAR = END_YEAR - 14;
const DATE_RANGE = `${START_YEAR}:${END_YEAR}`;
const PER_PAGE = 200;
const FETCH_TIMEOUT_MS = 15_000;

async function fetchWithTimeout(url: string): Promise<Response | null> {
  try {
    return await fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Pharos/1.0 (+world-bank-profile)',
      },
      cache: 'no-store',
    });
  } catch {
    return null;
  }
}

async function fetchIndicator(
  iso3: string,
  indicator: string,
): Promise<{ year: number; value: number }[]> {
  const url =
    `https://api.worldbank.org/v2/country/${iso3}/indicator/${indicator}` +
    `?date=${DATE_RANGE}&format=json&per_page=${PER_PAGE}`;

  const res = await fetchWithTimeout(url);
  if (!res?.ok) return [];

  const json: unknown = await res.json();
  // World Bank returns [metadata, dataArray] — dataArray may be null
  const rows = Array.isArray(json) && Array.isArray(json[1]) ? (json[1] as WorldBankRow[]) : null;
  if (!rows) return [];

  return rows
    .filter((r) => r.value !== null)
    .map((r) => ({ year: Number(r.date), value: Number(r.value) }))
    .sort((a, b) => a.year - b.year);
}

export async function GET(req: NextRequest) {
  const countries = parseQueryArray(req.nextUrl.searchParams.get('countries'));

  if (countries.length === 0) {
    return err('BAD_REQUEST', 'countries query param required (comma-separated ISO3 codes)');
  }

  const normalized = [...new Set(countries.map(c => c.toUpperCase()))].sort();
  const cacheKey = normalized.join(',');
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < TTL) {
    return ok(cached.data);
  }

  const results: Record<string, CountryWorldBankData> = {};

  await Promise.all(
    normalized.map(async (iso3) => {
      const settled = await Promise.allSettled([
        fetchIndicator(iso3, INDICATORS.spending),
        fetchIndicator(iso3, INDICATORS.gdpPct),
        fetchIndicator(iso3, INDICATORS.armedForces),
        fetchIndicator(iso3, INDICATORS.inflation),
        fetchIndicator(iso3, INDICATORS.gdpGrowth),
        fetchIndicator(iso3, INDICATORS.refugeePopulation),
        fetchIndicator(iso3, INDICATORS.gini),
      ]);
      const [spending, gdpPct, armedForces, inflation, gdpGrowth, refugeePopulation, gini] = settled.map((result) =>
        result.status === 'fulfilled' ? result.value : [],
      );
      results[iso3] = {
        spending,
        gdpPct,
        armedForces,
        inflation,
        gdpGrowth,
        refugeePopulation,
        gini,
      };
    }),
  );

  // Only cache if at least one country returned data (avoid caching timeout failures)
  const hasData = Object.values(results).some(c =>
    Object.values(c).some(arr => arr.length > 0),
  );
  if (hasData) {
    cache.set(cacheKey, { data: results, ts: Date.now() });
  }

  return ok(results);
}
