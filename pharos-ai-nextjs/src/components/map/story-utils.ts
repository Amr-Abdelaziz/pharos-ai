import type { MapStory } from '@/data/mapStories';

export type DayGroup = {
  label:   string;
  date:    string;
  stories: MapStory[];
};

export function groupByDay(stories: MapStory[]): DayGroup[] {
  const sorted = [...stories].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  const groups = new Map<string, MapStory[]>();
  for (const s of sorted) {
    const d = new Date(s.timestamp);
    const key = d.toISOString().slice(0, 10);
    groups.set(key, [...(groups.get(key) ?? []), s]);
  }

  return [...groups.entries()].map(([date, stories]) => {
    const d = new Date(date + 'T00:00:00Z');
    const mon = d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }).toUpperCase();
    const day = d.getUTCDate().toString().padStart(2, '0');
    return { label: `${mon} ${day}`, date, stories };
  });
}
