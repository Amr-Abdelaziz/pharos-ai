'use client';

import { useState, useCallback } from 'react';
import { MapCanvas } from './MapCanvas';
import { StoriesScreen } from './StoriesScreen';
import { StoryDetailScreen } from './StoryDetailScreen';
import { EventDetailScreen } from './EventDetailScreen';

import type { MapPageContext } from '@/features/map/components/use-map-page';
import type { SelectedItem } from '@/features/map/components/types';
import type { MapStory } from '@/types/domain';

// ─── Screen stack types ───────────────────────────────────────────────────────

type Screen =
  | { id: 'map' }
  | { id: 'stories' }
  | { id: 'story'; story: MapStory }
  | { id: 'detail'; item: SelectedItem };

// ─── Component ────────────────────────────────────────────────────────────────

type Props = {
  ctx: MapPageContext;
  embedded?: boolean;
};

export function LandscapeMapLayout({ ctx }: Props) {
  const {
    stories, activeStory,
    activateStory, setSelectedItem, setActiveStory,
  } = ctx;

  const [stack, setStack] = useState<Screen[]>([{ id: 'map' }]);
  const current = stack[stack.length - 1];

  const push = useCallback((screen: Screen) => {
    setStack(prev => [...prev, screen]);
  }, []);

  const pop = useCallback(() => {
    setStack(prev => prev.length > 1 ? prev.slice(0, -1) : prev);
  }, []);

  const popTo = useCallback((id: Screen['id']) => {
    setStack(prev => {
      const idx = prev.findIndex(s => s.id === id);
      return idx >= 0 ? prev.slice(0, idx + 1) : [{ id: 'map' as const }];
    });
  }, []);

  // ── Handlers ──

  const handleOpenStories = useCallback(() => {
    push({ id: 'stories' });
  }, [push]);

  const handleSelectFeature = useCallback((item: SelectedItem | null) => {
    if (item && current.id === 'map') {
      push({ id: 'detail', item });
    }
  }, [current.id, push]);

  const handleSelectStory = useCallback((story: MapStory) => {
    activateStory(story);
    push({ id: 'story', story });
  }, [activateStory, push]);

  const handleSeeOnMap = useCallback((story: MapStory) => {
    activateStory(story);
    popTo('map');
  }, [activateStory, popTo]);

  const handleDetailBack = useCallback(() => {
    setSelectedItem(null);
    pop();
  }, [setSelectedItem, pop]);

  const handleStoryBack = useCallback(() => {
    pop();
  }, [pop]);

  const handleStoriesBack = useCallback(() => {
    setActiveStory(null);
    popTo('map');
  }, [setActiveStory, popTo]);

  const handleStoryActivateStory = useCallback((story: MapStory) => {
    activateStory(story);
    // Replace current screen with story detail
    setStack(prev => [...prev.slice(0, -1), { id: 'story', story }]);
  }, [activateStory]);

  // ── Render current screen ──

  return (
    <div className="w-full h-full bg-[var(--bg-app)] overflow-hidden">
      {current.id === 'map' && (
        <MapCanvas
          ctx={ctx}
          onOpenStories={handleOpenStories}
          onSelectFeature={handleSelectFeature}
        />
      )}

      {current.id === 'stories' && (
        <StoriesScreen
          stories={stories}
          activeStory={activeStory}
          onBack={handleStoriesBack}
          onSelectStory={handleSelectStory}
        />
      )}

      {current.id === 'story' && (
        <StoryDetailScreen
          story={current.story}
          onBack={handleStoryBack}
          onSeeOnMap={handleSeeOnMap}
        />
      )}

      {current.id === 'detail' && (
        <EventDetailScreen
          item={current.item}
          onBack={handleDetailBack}
          onSelectItem={(item) => {
            setSelectedItem(item);
            setStack(prev => [...prev.slice(0, -1), { id: 'detail', item }]);
          }}
          onActivateStory={handleStoryActivateStory}
        />
      )}
    </div>
  );
}
