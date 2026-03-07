'use client';

import { PERSPECTIVE_COLORS } from '@/features/news/lib/news-colors';

import { ExpandedCard } from './ExpandedCard';
import { NormalCard } from './NormalCard';
import {
  CARD_H_IMG,
  CARD_H_NO_IMG,
  CARD_W,
  SPINE_Y,
  type TimelineArticle,
} from './timeline-constants';

// Types

type Props = {
  article: TimelineArticle;
  x: number;
  above: boolean;
  yOffset: number;
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
  focusedId: string | null;
  focusCard: (article: TimelineArticle, x: number, cardTop: number) => void;
  defocus: () => void;
};

// Component

export function TimelineCard({
  article,
  x,
  above,
  yOffset,
  hoveredId,
  setHoveredId,
  focusedId,
  focusCard,
  defocus,
}: Props) {
  const color = PERSPECTIVE_COLORS[article.feed.perspective] ?? 'var(--t4)';
  const isHovered = hoveredId === article.id;
  const isFocused = focusedId === article.id;
  const hasImg = !!article.imageUrl;
  const cardH = hasImg ? CARD_H_IMG : CARD_H_NO_IMG;

  const cardTop = above
    ? SPINE_Y - yOffset - cardH
    : SPINE_Y + yOffset + 20;

  const connectorTop = above ? cardTop + cardH : SPINE_Y + 2;
  const connectorH = above ? SPINE_Y - (cardTop + cardH) : cardTop - SPINE_Y - 2;
  const cardCenter = x + CARD_W / 2;

  return (
    <div key={article.id}>
      {/* Connector */}
      <div
        className="absolute"
        style={{
          left: `${cardCenter}px`,
          top: `${connectorTop}px`,
          width: '2px',
          height: `${Math.max(connectorH, 0)}px`,
          backgroundColor: color,
          opacity: isFocused ? 0.9 : isHovered ? 0.8 : 0.3,
        }}
      />
      {/* Spine dot */}
      <div
        className="absolute rounded-full"
        style={{
          left: `${cardCenter - 5}px`,
          top: `${SPINE_Y - 5}px`,
          width: isFocused ? '14px' : '10px',
          height: isFocused ? '14px' : '10px',
          marginLeft: isFocused ? '-2px' : '0',
          marginTop: isFocused ? '-2px' : '0',
          backgroundColor: color,
          opacity: isFocused ? 1 : isHovered ? 1 : 0.7,
          boxShadow: isFocused ? `0 0 20px ${color}, 0 0 40px ${color}60` : isHovered ? `0 0 14px ${color}` : 'none',
          transition: 'all 0.3s ease',
        }}
      />

      {/* Card — normal state */}
      {!isFocused && (
        <NormalCard
          article={article}
          x={x}
          cardTop={cardTop}
          isHovered={isHovered}
          onMouseEnter={() => setHoveredId(article.id)}
          onMouseLeave={() => setHoveredId(null)}
          onClick={() => focusCard(article, x, cardTop)}
        />
      )}

      {/* Card — focused/expanded state */}
      {isFocused && (
        <ExpandedCard
          article={article}
          x={x}
          cardTop={cardTop}
          above={above}
          color={color}
          defocus={defocus}
        />
      )}
    </div>
  );
}
