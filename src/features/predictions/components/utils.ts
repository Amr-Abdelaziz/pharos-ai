/**
 * Prediction-market–scoped utilities.
 * fmtVol / fmtMarketDate are intentionally separate from @/lib/format —
 * they use market-specific precision and localization.
 */
import type { PredictionMarket, SubMarket } from '@/types/domain';

/** "$1.23M", "$340K", "$890" — two-decimal precision for market volumes */
export function fmtVol(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

/** "MAR 01, '26" — localized short date for market end/start dates */
export function fmtMarketDate(iso: string): string {
  if (!iso) return '—';
  return new Date(iso)
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
    .toUpperCase();
}

/** Colour for a probability value — uses CSS tokens (CODEX §1.2) */
export function probColor(p: number): string {
  if (p >= 0.65) return 'var(--success)';
  if (p >= 0.50) return 'var(--blue)';
  if (p >= 0.35) return 'var(--warning)';
  return 'var(--danger)';
}

/** Background tint for a probability value */
export function probBg(p: number): string {
  if (p >= 0.65) return 'var(--success-dim)';
  if (p >= 0.50) return 'var(--blue-dim)';
  if (p >= 0.35) return 'var(--warning-dim)';
  return 'var(--danger-dim)';
}

/** Spread colour — green tight, amber ok, red wide */
export function spreadColor(s: number): string {
  if (s < 0.02) return 'var(--success)';
  if (s < 0.07) return 'var(--warning)';
  return 'var(--danger)';
}

/** Leading probability from any market/sub-market */
export function getLeadProb(m: PredictionMarket | SubMarket): number {
  const ltp = (m as PredictionMarket).lastTradePrice;
  if (ltp && ltp > 0) return ltp;
  const yesIdx = m.outcomes.findIndex(o => o.toUpperCase() === 'YES');
  return yesIdx >= 0 ? (m.prices[yesIdx] ?? 0) : (m.prices[0] ?? 0);
}

/** Status label + colours for a market */
export function statusLabel(m: PredictionMarket) {
  if (m.closed) return { label: 'CLOSED',   color: 'var(--t4)',    bg: 'rgba(92,112,128,0.12)', border: 'rgba(92,112,128,0.25)' };
  if (m.active) return { label: 'LIVE',     color: 'var(--success)', bg: 'var(--success-dim)',  border: 'rgba(35,162,109,0.3)'  };
  return          { label: 'RESOLVED', color: 'var(--blue-l)', bg: 'var(--blue-dim)',       border: 'rgba(76,144,240,0.3)'  };
}

/** Grid template columns for the market table */
export const COL = '36px 1fr 120px 96px 72px 80px 64px 28px';
