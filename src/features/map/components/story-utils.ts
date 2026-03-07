import type { MapStory } from '@/types/domain';

export type DayGroup = {
  label:   string;
  date:    string;
  stories: MapStory[];
};

export type GroupByDayOptions = {
  dayOrder?: 'asc' | 'desc';
  storyOrder?: 'asc' | 'desc';
};

function storyTimeMs(story: MapStory): number {
  const ts = new Date(story.timestamp).getTime();
  return Number.isFinite(ts) ? ts : 0;
}

/** Group stories by local date with explicit day + story ordering. */
export function groupByDay(
  stories: MapStory[],
  { dayOrder = 'asc', storyOrder = 'asc' }: GroupByDayOptions = {},
): DayGroup[] {
  const sorted = [...stories].sort((a, b) => (
    storyOrder === 'asc' ? storyTimeMs(a) - storyTimeMs(b) : storyTimeMs(b) - storyTimeMs(a)
  ));

  const groups = new Map<string, MapStory[]>();
  for (const s of sorted) {
    const d = new Date(s.timestamp);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    groups.set(key, [...(groups.get(key) ?? []), s]);
  }

  const orderedDates = [...groups.keys()].sort((a, b) => (
    dayOrder === 'asc' ? a.localeCompare(b) : b.localeCompare(a)
  ));

  return orderedDates.map((date) => {
    const stories = groups.get(date) ?? [];
    const d = new Date(date + 'T12:00:00'); // noon local — avoids DST edge cases
    const mon = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const day = String(d.getDate()).padStart(2, '0');
    return { label: `${mon} ${day}`, date, stories };
  });
}
