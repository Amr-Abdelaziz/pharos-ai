import type { MapStory } from '@/types/domain';

export type DayGroup = {
  label:   string;
  date:    string;
  stories: MapStory[];
};

/** Group stories by local date. Returns groups in chronological order (oldest first).
 *  Callers can .reverse() for newest-first display. */
export function groupByDay(stories: MapStory[]): DayGroup[] {
  const sorted = [...stories].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  const groups = new Map<string, MapStory[]>();
  for (const s of sorted) {
    const d = new Date(s.timestamp);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    groups.set(key, [...(groups.get(key) ?? []), s]);
  }

  return [...groups.entries()].map(([date, stories]) => {
    const d = new Date(date + 'T12:00:00'); // noon local — avoids DST edge cases
    const mon = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const day = String(d.getDate()).padStart(2, '0');
    return { label: `${mon} ${day}`, date, stories };
  });
}
