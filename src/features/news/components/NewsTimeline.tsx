'use client';

import { useCallback,useEffect, useMemo, useState } from 'react';

import { useRssFeeds } from '@/features/news/queries';

import { useIsLandscapePhone } from '@/shared/hooks/use-is-landscape-phone';

import type { FeedItem } from '@/types/domain';

import { CARD_W,type TimelineArticle } from './timeline-constants';
import { TimelineCanvas } from './TimelineCanvas';
import { TimelineHeader } from './TimelineHeader';
import { useTimelineFocus } from './use-timeline-focus';
import { useTimelineLayout } from './use-timeline-layout';
import { useTimelineTransform } from './use-timeline-transform';

// Types

type NewsTimelineProps = {
  feedData: Map<string, FeedItem[]>;
};

// Component

export function NewsTimeline({ feedData }: NewsTimelineProps) {
  const { data: allFeeds } = useRssFeeds();
  const isLandscapePhone = useIsLandscapePhone();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedTiers, setSelectedTiers] = useState<Set<number>>(new Set([1, 2, 3, 4]));
  const [viewportWidth, setViewportWidth] = useState(0);

  const { viewportRef, zoom, pan, isDragging, zoomRef, panRef, commitTransform } = useTimelineTransform();

  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    setViewportWidth(vp.getBoundingClientRect().width);
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) setViewportWidth(entry.contentRect.width);
    });
    observer.observe(vp);
    return () => observer.disconnect();
  }, [viewportRef]);

  const articles = useMemo(() => {
    const items: TimelineArticle[] = [];
    feedData.forEach((feedItems, feedId) => {
      const feed = (allFeeds ?? []).find(f => f.id === feedId);
      if (!feed) return;
      for (const item of feedItems) {
        const dateStr = item.isoDate ?? item.pubDate;
        if (!dateStr) continue;
        const time = new Date(dateStr);
        if (isNaN(time.getTime())) continue;
        items.push({
          id: `${feedId}-${time.getTime()}-${item.link}`,
          title: item.title,
          link: item.link,
          snippet: item.contentSnippet ?? '',
          time,
          feed,
          imageUrl: item.imageUrl,
        });
      }
    });
    items.sort((a, b) => a.time.getTime() - b.time.getTime());
    return items;
  }, [feedData, allFeeds]);

  const filtered = useMemo(
    () => articles.filter(a => selectedTiers.has(a.feed.tier)),
    [articles, selectedTiers],
  );

  const layout = useTimelineLayout(filtered);
  const { focusedId, focusCard, defocus, centerOnNewest, resetView } = useTimelineFocus(
    layout,
    { viewportRef, zoomRef, panRef, commitTransform },
  );

  const toggleTier = useCallback((tier: number) => {
    setSelectedTiers(prev => {
      const next = new Set(prev);
      if (next.has(tier)) { if (next.size > 1) next.delete(tier); }
      else { next.add(tier); }
      return next;
    });
  }, []);

  const zoomPct = Math.round(zoom * 100);

  // Viewport culling for performance
  const visibleCards = useMemo(() => {
    if (viewportWidth <= 0) return layout.positioned;
    const viewLeft = -pan.x / zoom - 200;
    const viewRight = (-pan.x + viewportWidth) / zoom + 200;
    return layout.positioned.filter(({ x }) => x + CARD_W > viewLeft && x < viewRight);
  }, [layout.positioned, pan.x, zoom, viewportWidth]);

  return (
    <div className="flex flex-col w-full h-full min-h-0">
      <TimelineHeader
        isLandscapePhone={isLandscapePhone}
        selectedTiers={selectedTiers}
        toggleTier={toggleTier}
        zoomRef={zoomRef}
        commitTransform={commitTransform}
        centerOnNewest={centerOnNewest}
        resetView={resetView}
        zoomPct={zoomPct}
        filteredCount={filtered.length}
      />
      <TimelineCanvas
        layout={layout}
        visibleCards={visibleCards}
        zoom={zoom}
        pan={pan}
        focusedId={focusedId}
        hoveredId={hoveredId}
        setHoveredId={setHoveredId}
        focusCard={focusCard}
        defocus={defocus}
        isDragging={isDragging}
        viewportRef={viewportRef}
        zoomPct={zoomPct}
        filteredCount={filtered.length}
      />
    </div>
  );
}
