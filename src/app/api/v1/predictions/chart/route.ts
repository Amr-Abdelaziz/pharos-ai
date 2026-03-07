import { NextRequest, NextResponse } from 'next/server';

import type { TimePoint } from '@/types/domain';

export async function GET(req: NextRequest) {
  const conditionId = req.nextUrl.searchParams.get('id');
  if (!conditionId) {
    return NextResponse.json({ error: 'missing id', history: [] }, { status: 400 });
  }

  try {
    const url = `https://clob.polymarket.com/prices-history?market=${encodeURIComponent(conditionId)}&interval=all&fidelity=60`;
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) {
      return NextResponse.json({ error: `CLOB ${res.status}`, history: [] }, { status: res.status });
    }
    const data = await res.json() as { history?: TimePoint[] };
    return NextResponse.json({ history: data.history ?? [] });
  } catch (err) {
    return NextResponse.json({ error: String(err), history: [] }, { status: 500 });
  }
}
