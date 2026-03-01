/**
 * Shared formatting utilities — single source of truth.
 * CODEX §4.1: import from here, never redefine locally.
 */

/** "2026-03-01" */
export function fmtDate(ts: string): string {
  return new Date(ts).toISOString().slice(0, 10);
}

/** "14:32" — UTC time, no seconds */
export function fmtTime(ts: string): string {
  return new Date(ts).toISOString().slice(11, 16);
}

/** "14:32Z" — UTC time with Z suffix */
export function fmtTimeZ(ts: string): string {
  return fmtTime(ts) + 'Z';
}

/** Relative time: "4m", "2h", "3d" */
export function ago(ts: string): string {
  const ms = Date.now() - new Date(ts).getTime();
  if (ms < 3_600_000)  return `${Math.round(ms / 60_000)}m`;
  if (ms < 86_400_000) return `${Math.round(ms / 3_600_000)}h`;
  return `${Math.round(ms / 86_400_000)}d`;
}

/** "$1.2M", "$340K", "$890" */
export function fmtVol(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}
