'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { SectionDivider } from '@/components/shared/SectionDivider';
import { useMilitarySpending, type MilSpendPoint } from '@/api/world-bank';
import type { Actor } from '@/types/domain';

type Props = {
  actor: Actor;
  iso3: string;
};

// ─── Formatters ─────────────────────────────────────────────────────────────

function fmtUsd(val: number): string {
  if (val >= 1e12) return `$${(val / 1e12).toFixed(1)}T`;
  if (val >= 1e9) return `$${(val / 1e9).toFixed(1)}B`;
  if (val >= 1e6) return `$${(val / 1e6).toFixed(0)}M`;
  return `$${val.toLocaleString()}`;
}

function fmtPct(val: number): string {
  return `${val.toFixed(2)}%`;
}

function yoyChange(pts: MilSpendPoint[]): { delta: number; pct: number } | null {
  if (pts.length < 2) return null;
  const curr = pts[pts.length - 1].value;
  const prev = pts[pts.length - 2].value;
  if (prev === 0) return null;
  return { delta: curr - prev, pct: ((curr - prev) / prev) * 100 };
}

// ─── Sparkline (SVG polyline) ───────────────────────────────────────────────

function Sparkline({ data, color }: { data: MilSpendPoint[]; color: string }) {
  if (data.length < 2) return null;
  const W = 280;
  const H = 48;
  const PAD = 4;

  const values = data.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = data
    .map((d, i) => {
      const x = PAD + (i / (data.length - 1)) * (W - PAD * 2);
      const y = H - PAD - ((d.value - min) / range) * (H - PAD * 2);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={W} height={H} className="w-full" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─── YoY badge ──────────────────────────────────────────────────────────────

function YoyBadge({ pts, formatVal }: { pts: MilSpendPoint[]; formatVal: (v: number) => string }) {
  const change = yoyChange(pts);
  if (!change) return null;

  const positive = change.delta >= 0;
  const color = positive ? 'var(--success)' : 'var(--danger)';
  const arrow = positive ? '▲' : '▼';

  return (
    <span className="mono text-[10px] ml-2" style={{ color }}>
      {arrow} {Math.abs(change.pct).toFixed(1)}% YoY
    </span>
  );
}

// ─── Skeleton placeholder ───────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="px-[22px] py-[18px] space-y-5 animate-pulse">
      {[1, 2, 3, 4].map(i => (
        <div key={i}>
          <div className="h-2 w-32 bg-[var(--bd)] mb-3" />
          <div className="h-5 w-48 bg-[var(--bd)] mb-1" />
          <div className="h-3 w-24 bg-[var(--bd)]" />
        </div>
      ))}
    </div>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

export function ActorMilitaryTab({ actor, iso3 }: Props) {
  const { data, isLoading, isError } = useMilitarySpending([iso3]);

  if (isLoading) {
    return (
      <ScrollArea className="h-full">
        <Skeleton />
      </ScrollArea>
    );
  }

  const milData = data?.[iso3];

  if (isError || !milData || (milData.spending.length === 0 && milData.gdpPct.length === 0)) {
    return (
      <ScrollArea className="h-full">
        <div className="p-12 text-center">
          <p className="label text-[var(--t3)]">No military data available for this actor</p>
        </div>
      </ScrollArea>
    );
  }

  const latestSpending = milData.spending.length > 0 ? milData.spending[milData.spending.length - 1] : null;
  const latestGdp = milData.gdpPct.length > 0 ? milData.gdpPct[milData.gdpPct.length - 1] : null;

  // Determine trend color from latest spending change
  const spendChange = yoyChange(milData.spending);
  const trendPositive = spendChange ? spendChange.delta >= 0 : true;
  const trendColor = trendPositive ? 'rgba(34,197,94,0.9)' : 'rgba(239,68,68,0.9)';

  // Merge years for table (most recent first)
  const allYears = [...new Set([
    ...milData.spending.map(d => d.year),
    ...milData.gdpPct.map(d => d.year),
  ])].sort((a, b) => b - a);

  const spendMap = Object.fromEntries(milData.spending.map(d => [d.year, d.value]));
  const gdpMap = Object.fromEntries(milData.gdpPct.map(d => [d.year, d.value]));

  return (
    <ScrollArea className="h-full">
      <div className="px-[22px] py-[18px]">
        {/* MILITARY EXPENDITURE */}
        {latestSpending && (
          <div className="mb-5">
            <SectionDivider label="MILITARY EXPENDITURE" />
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-[var(--t1)] mono">
                {fmtUsd(latestSpending.value)}
              </span>
              <YoyBadge pts={milData.spending} formatVal={fmtUsd} />
            </div>
            <span className="label text-[8px] text-[var(--t3)]">
              {latestSpending.year} · CURRENT USD · WORLD BANK
            </span>
          </div>
        )}

        {/* DEFENSE AS % OF GDP */}
        {latestGdp && (
          <div className="mb-5">
            <SectionDivider label="DEFENSE AS % OF GDP" />
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-[var(--t1)] mono">
                {fmtPct(latestGdp.value)}
              </span>
              <YoyBadge pts={milData.gdpPct} formatVal={fmtPct} />
            </div>
            <span className="label text-[8px] text-[var(--t3)]">
              {latestGdp.year} · SHARE OF GDP · WORLD BANK
            </span>
          </div>
        )}

        {/* SPENDING TREND */}
        {milData.spending.length >= 2 && (
          <div className="mb-5">
            <SectionDivider label="SPENDING TREND" />
            <div className="border border-[var(--bd)] p-2">
              <Sparkline data={milData.spending} color={trendColor} />
              <div className="flex justify-between mt-1">
                <span className="mono text-[8px] text-[var(--t4)]">
                  {milData.spending[0].year}
                </span>
                <span className="mono text-[8px] text-[var(--t4)]">
                  {milData.spending[milData.spending.length - 1].year}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* YEARLY BREAKDOWN */}
        <div className="mb-5">
          <SectionDivider label="YEARLY BREAKDOWN" />
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-[var(--bd)]">
                <th className="label text-[8px] text-left py-1.5 pr-4">YEAR</th>
                <th className="label text-[8px] text-right py-1.5 pr-4">SPENDING</th>
                <th className="label text-[8px] text-right py-1.5">% GDP</th>
              </tr>
            </thead>
            <tbody>
              {allYears.map(year => (
                <tr key={year} className="border-b border-[var(--bd-s)]">
                  <td className="mono text-[var(--t2)] py-1.5 pr-4">{year}</td>
                  <td className="mono text-[var(--t1)] text-right py-1.5 pr-4">
                    {spendMap[year] != null ? fmtUsd(spendMap[year]) : '—'}
                  </td>
                  <td className="mono text-[var(--t1)] text-right py-1.5">
                    {gdpMap[year] != null ? fmtPct(gdpMap[year]) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ScrollArea>
  );
}
