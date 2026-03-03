'use client';

import { ChevronRight, ChevronDown } from 'lucide-react';
import StoryCard from './StoryCard';

import type { MapStory } from '@/types/domain';
import type { DayGroup } from './story-utils';

type Props = {
  group:       DayGroup;
  isExpanded:  boolean;
  onToggle:    () => void;
  openStoryId: string | null;
  onToggleStory: (story: MapStory) => void;
  onFlyTo:       (story: MapStory) => void;
};

export default function StoryDateGroup({
  group,
  isExpanded,
  onToggle,
  openStoryId,
  onToggleStory,
  onFlyTo,
}: Props) {
  return (
    <div>
      {/* Date header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 mono"
        style={{
          padding:     '8px 16px',
          fontSize:    10,
          fontWeight:  700,
          color:       'var(--t4)',
          background:  'var(--bg-1)',
          borderBottom: '1px solid var(--bd-s)',
          cursor:      'pointer',
          letterSpacing: '0.06em',
        }}
      >
        {isExpanded
          ? <ChevronDown size={12} strokeWidth={2.5} />
          : <ChevronRight size={12} strokeWidth={2.5} />}
        {group.label}
        <span style={{
          background: 'var(--bg-3)',
          color:      'var(--t4)',
          fontSize:   8,
          padding:    '1px 5px',
          borderRadius: 2,
          marginLeft: 2,
        }}>
          {group.stories.length}
        </span>
      </button>

      {/* Nested story cards */}
      {isExpanded && group.stories.map(story => (
        <div key={story.id} data-story-id={story.id}>
          <StoryCard
            story={story}
            isOpen={openStoryId === story.id}
            onToggle={() => onToggleStory(story)}
            onFlyTo={() => onFlyTo(story)}
          />
        </div>
      ))}
    </div>
  );
}
