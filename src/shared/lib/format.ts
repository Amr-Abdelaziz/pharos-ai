/**
 * Shared formatting utilities — single source of truth.
 * CODEX §4.1: import from here, never redefine locally.
 */

/** "2026-03-01" — local date */
export function fmtDate(ts: string): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** "14:32" — local time, no seconds */
export function fmtTime(ts: string): string {
  return new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
}

/** "14:32 UTC" — explicit UTC time */
export function fmtTimeZ(ts: string): string {
  return new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' }) + ' UTC';
}

/** Relative time: "4m", "2h", "3d" */
export function ago(ts: string): string {
  const ms = Date.now() - new Date(ts).getTime();
  if (ms < 3_600_000)  return `${Math.round(ms / 60_000)}m`;
  if (ms < 86_400_000) return `${Math.round(ms / 3_600_000)}h`;
  return `${Math.round(ms / 86_400_000)}d`;
}

/** Relative time with " ago" suffix: "4m ago", "2h ago", "just now" */
export function timeAgo(dateStr: string): string {
  if (!dateStr) return '';
  const ms = Date.now() - new Date(dateStr).getTime();
  if (ms < 0 || ms < 60000) return 'just now';
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/** "1.2M", "3.4K", "890" — compact number */
export function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

/** "$1.2M", "$340K", "$890" */
export function fmtVol(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}
