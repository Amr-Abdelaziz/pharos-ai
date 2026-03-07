import { NextRequest, NextResponse } from 'next/server';

import type { TimePoint } from '@/types/domain';

const CLOB = 'https://clob.polymarket.com';

type CacheEntry = { data: unknown; ts: number };
const cache = new Map<string, CacheEntry>();
const FRESH_TTL = 3 * 60 * 1000;
const STALE_TTL = 15 * 60 * 1000;
const refetching = new Set<string>();

const INTERVALS = {
  '1d':  { interval: '1d',  fidelity: 10  },
  '7d':  { interval: '1w',  fidelity: 60  },
  '1mo': { interval: '1m',  fidelity: 240 },
  '3mo': { interval: '3m',  fidelity: 720 },
  'max': { interval: 'max', fidelity: 60  },
} as const;

async function fetchHistory(tokenId: string, range: string): Promise<TimePoint[]> {
  const cfg = INTERVALS[range as keyof typeof INTERVALS] ?? INTERVALS['7d'];
  const url = `${CLOB}/prices-history?market=${encodeURIComponent(tokenId)}&interval=${cfg.interval}&fidelity=${cfg.fidelity}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return (json.history ?? []) as TimePoint[];
}

async function getCached(tokenId: string, range: string): Promise<TimePoint[]> {
  const key = `${tokenId}:${range}`;
  const cached = cache.get(key);
  const now = Date.now();
  if (cached) {
    const age = now - cached.ts;
    if (age < FRESH_TTL) return cached.data as TimePoint[];
    if (age < STALE_TTL) {
      if (!refetching.has(key)) {
        refetching.add(key);
        fetchHistory(tokenId, range)
          .then(d => cache.set(key, { data: d, ts: Date.now() }))
          .finally(() => refetching.delete(key));
      }
      return cached.data as TimePoint[];
    }
  }
  const data = await fetchHistory(tokenId, range);
  cache.set(key, { data, ts: now });
  return data;
}

export async function GET(req: NextRequest) {
  const tokenId = req.nextUrl.searchParams.get('tokenId');
  const range = req.nextUrl.searchParams.get('range') ?? '7d';

  if (!tokenId) {
    return NextResponse.json({ error: 'Missing tokenId' }, { status: 400 });
  }

  try {
    const history = await getCached(tokenId, range);
    return NextResponse.json(
      { history },
      { headers: { 'Cache-Control': 'public, max-age=120, stale-while-revalidate=600' } },
    );
  } catch (err) {
    return NextResponse.json({ error: String(err), history: [] }, { status: 500 });
  }
}
