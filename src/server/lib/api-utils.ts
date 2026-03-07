import { NextResponse } from 'next/server';

// Response envelope

type JsonInit = Parameters<typeof NextResponse.json>[1];

export function ok<T>(data: T, init?: JsonInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function err(code: string, message: string, status = 400, init?: JsonInit) {
  return NextResponse.json({ ok: false, error: { code, message } }, { ...(init ?? {}), status });
}

// Query helpers

export function parseQueryArray(param: string | null): string[] {
  if (!param) return [];
  return param.split(',').map(s => s.trim()).filter(Boolean);
}

/** Parse a day string (YYYY-MM-DD) into a date range for timestamp filtering */
export function parseDayRange(day: string): { gte: Date; lt: Date } {
  const gte = new Date(day + 'T00:00:00Z');
  const lt = new Date(gte);
  lt.setUTCDate(lt.getUTCDate() + 1);
  return { gte, lt };
}

// Casualty reassembly

type CasualtySummaryRow = {
  faction: string;
  killed: number;
  wounded: number;
  civilians: number;
  injured: number;
};

/**
 * Reassemble flat CasualtySummary rows into the nested domain.ts format:
 * { us: { kia, wounded, civilians }, israel: { kia, wounded, civilians, injured },
 *   iran: { killed, injured }, lebanon: { killed, injured },
 *   regional: Record<string, { killed, injured }> }
 */
export function reassembleCasualties(rows: CasualtySummaryRow[]) {
  const map = Object.fromEntries(rows.map(r => [r.faction, r]));

  const us = map['us'];
  const israel = map['israel'];
  const iran = map['iran'];
  const lebanon = map['lebanon'];

  const knownFactions = new Set(['us', 'israel', 'iran', 'lebanon']);
  const regional: Record<string, { killed: number; injured: number }> = {};
  for (const r of rows) {
    if (!knownFactions.has(r.faction)) {
      regional[r.faction] = { killed: r.killed, injured: r.injured };
    }
  }

  return {
    us: { kia: us?.killed ?? 0, wounded: us?.wounded ?? 0, civilians: us?.civilians ?? 0 },
    israel: { kia: israel?.killed ?? 0, wounded: israel?.wounded ?? 0, civilians: israel?.civilians ?? 0, injured: israel?.injured ?? 0 },
    iran: { killed: iran?.killed ?? 0, injured: iran?.injured ?? 0 },
    lebanon: { killed: lebanon?.killed ?? 0, injured: lebanon?.injured ?? 0 },
    regional,
  };
}

// Actor type mapping

export function mapActorTypeToApi(type: string): string {
  if (type === 'NON_STATE') return 'NON-STATE';
  return type;
}
