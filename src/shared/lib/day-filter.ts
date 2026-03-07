import type { Actor,ActorDaySnapshot, ConflictDaySnapshot, IntelEvent, XPost } from '@/types/domain';

/** Get the day (YYYY-MM-DD) a timestamp falls on (defaults to last day). */
export function getDayFromTimestamp(ts: string, allDays: string[]): string {
  const date = ts.slice(0, 10);
  if (allDays.includes(date)) return date;
  return allDays[allDays.length - 1];
}

/**
 * Find the previous day in allDays. Returns undefined if already at the first day.
 */
function prevDay(day: string, allDays: string[]): string | undefined {
  const idx = allDays.indexOf(day);
  return idx > 0 ? allDays[idx - 1] : undefined;
}

/**
 * Filter events to a conflict day.
 * If the requested day has no events, rolls back through previous days
 * until data is found (handles day rollover when new day has no data yet).
 */
export function getEventsForDay(events: IntelEvent[], allDays: string[], day: string): IntelEvent[] {
  let d: string | undefined = day;
  while (d) {
    const result = events.filter(e => getDayFromTimestamp(e.timestamp, allDays) === d);
    if (result.length > 0) return result;
    d = prevDay(d, allDays);
  }
  return [];
}

/**
 * Filter X posts to a conflict day.
 * Rolls back to previous day if current day has no posts.
 */
export function getPostsForDay(posts: XPost[], allDays: string[], day: string): XPost[] {
  let d: string | undefined = day;
  while (d) {
    const result = posts.filter(p => getDayFromTimestamp(p.timestamp, allDays) === d);
    if (result.length > 0) return result;
    d = prevDay(d, allDays);
  }
  return [];
}

/**
 * Get an actor's snapshot for a given day.
 * Rolls back to previous day if current day has no snapshot.
 */
export function getActorForDay(actor: Actor, day: string, allDays?: string[]): ActorDaySnapshot {
  if (actor.daySnapshots[day]) return actor.daySnapshots[day];
  // Roll back through allDays if provided
  if (allDays) {
    let d = prevDay(day, allDays);
    while (d) {
      if (actor.daySnapshots[d]) return actor.daySnapshots[d];
      d = prevDay(d, allDays);
    }
  }
  // Ultimate fallback: return the latest available snapshot
  const keys = Object.keys(actor.daySnapshots).sort();
  return actor.daySnapshots[keys[keys.length - 1]];
}

/** Get the conflict-level snapshot for a given day. Falls back to latest. */
export function getConflictForDay(snapshots: ConflictDaySnapshot[], day: string): ConflictDaySnapshot {
  return snapshots.find(s => s.day === day) ?? snapshots[snapshots.length - 1];
}

/** Day index (0-based). */
export function dayIndex(day: string, allDays: string[]): number {
  return allDays.indexOf(day);
}

/** Human label: "DAY 1", "DAY 2", etc. */
export function dayLabel(day: string, allDays: string[]): string {
  return `DAY ${dayIndex(day, allDays) + 1}`;
}

/** Short date: "FEB 28", "MAR 1", etc. */
export function dayShort(day: string): string {
  const d = new Date(day + 'T00:00:00Z');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).toUpperCase();
}

/** Abbreviated day label: "D1", "D2", etc. */
export function dayAbbrev(day: string, allDays: string[]): string {
  return `D${dayIndex(day, allDays) + 1}`;
}
