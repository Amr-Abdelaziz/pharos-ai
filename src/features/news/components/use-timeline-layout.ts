'use client';

import { useMemo } from 'react';

import {
  CARD_GAP,
  CARD_W,
  formatHour,
  PADDING_X,
  TIER_Y_OFFSET,
  TIME_SLOT_W,
  type TimelineArticle,
} from './timeline-constants';

// Hook

export function useTimelineLayout(filtered: TimelineArticle[]) {
  return useMemo(() => {
    const laneNextX: Record<string, number> = {};
    const positioned: { article: TimelineArticle; x: number; above: boolean; yOffset: number }[] = [];
    const hourMarkers: { hour: Date; x: number }[] = [];
    let lastHourStr = '';
    let globalIdx = 0;

    for (const article of filtered) {
      const tier = article.feed.tier;
      const yOffset = TIER_Y_OFFSET[tier] ?? 160;
      const above = globalIdx % 2 === 0;
      const laneKey = `${above ? 'a' : 'b'}-${tier}`;

      const globalX = PADDING_X + globalIdx * TIME_SLOT_W;
      const laneX = laneNextX[laneKey] ?? 0;
      const x = Math.max(globalX, laneX);
      laneNextX[laneKey] = x + CARD_W + CARD_GAP;

      const hourStr = formatHour(article.time).slice(0, 2);
      if (hourStr !== lastHourStr) {
        hourMarkers.push({ hour: new Date(article.time), x: x + CARD_W / 2 });
        lastHourStr = hourStr;
      }

      positioned.push({ article, x, above, yOffset });
      globalIdx++;
    }

    const totalWidth = Math.max(PADDING_X * 2 + (globalIdx + 1) * TIME_SLOT_W, 1200);
    return { positioned, hourMarkers, totalWidth };
  }, [filtered]);
}
