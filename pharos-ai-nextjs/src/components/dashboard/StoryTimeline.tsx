'use client';
import StoryIcon from './StoryIcon';
import type { MapStory } from '@/data/mapStories';

// Timeline window: Feb 28 16:00Z → Mar 1 09:00Z  (17 hours)
const T_START = new Date('2026-02-28T16:00:00Z').getTime();
const T_END   = new Date('2026-03-01T09:00:00Z').getTime();
const T_SPAN  = T_END - T_START;

function pct(iso: string) {
  const t = new Date(iso).getTime();
  return Math.max(0, Math.min(100, ((t - T_START) / T_SPAN) * 100));
}

function fmtHour(date: Date) {
  return date.getUTCHours().toString().padStart(2, '0') + ':00';
}

// Hour ticks to draw (every 3h within window)
const TICKS: { label: string; pct: number }[] = [];
for (let h = 18; h <= 33; h += 3) {          // 18:00 Feb28 → 09:00 Mar1
  const d = new Date(T_START + (h - 16) * 3_600_000);
  const p = ((h - 16) / 17) * 100;
  if (p < 0 || p > 100) continue;
  const day  = d.getUTCDate() === 28 ? '28' : '01';
  const time = fmtHour(d);
  TICKS.push({ label: `${time}\nMar ${day === '28' ? 'Feb' : 'Mar'} ${day}`, pct: p });
}

// Day band markers
const DAY_BANDS = [
  { label: 'FEB 28', pctStart: 0,    pctEnd: pct('2026-02-29T00:00:00Z') },
  { label: 'MAR 01', pctStart: pct('2026-03-01T00:00:00Z'), pctEnd: 100 },
];

const CAT_COLOR: Record<string, string> = {
  STRIKE:      '#E84C4C',
  RETALIATION: '#E8A84C',
  NAVAL:       '#4C9BE8',
  INTEL:       '#B84CE8',
  DIPLOMATIC:  '#4CE8A8',
};

interface Props {
  stories: MapStory[];
  activeId: string | null;
  onActivate: (story: MapStory) => void;
}

export default function StoryTimeline({ stories, activeId, onActivate }: Props) {
  // Sort by timestamp for consistent rendering
  const sorted = [...stories].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return (
    <div style={{
      flexShrink: 0,
      background: '#161A1F',
      borderBottom: '1px solid #2A2F38',
      padding: '10px 16px 14px',
      userSelect: 'none',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 10,
      }}>
        <span style={{ fontSize: 8, fontFamily: 'monospace', fontWeight: 700, color: '#5C7080', letterSpacing: '0.1em' }}>
          OPERATION TIMELINE
        </span>
        <span style={{ fontSize: 8, fontFamily: 'monospace', color: '#404854' }}>
          FEB 28 – MAR 01 2026
        </span>
      </div>

      {/* Timeline track */}
      <div style={{ position: 'relative', height: 64 }}>

        {/* Day band labels */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 14, display: 'flex' }}>
          {DAY_BANDS.map(band => (
            <div key={band.label} style={{
              position: 'absolute',
              left: `${band.pctStart}%`,
              width: `${band.pctEnd - band.pctStart}%`,
              fontSize: 7,
              fontFamily: 'monospace',
              fontWeight: 700,
              color: '#404854',
              letterSpacing: '0.08em',
              paddingLeft: 2,
              borderLeft: band.pctStart > 0 ? '1px solid #2A2F38' : 'none',
            }}>
              {band.label}
            </div>
          ))}
        </div>

        {/* Central track line */}
        <div style={{
          position: 'absolute',
          top: 36,
          left: 0,
          right: 0,
          height: 1,
          background: '#2A2F38',
        }} />

        {/* Hour ticks */}
        {TICKS.map((tick, i) => (
          <div key={i} style={{
            position: 'absolute',
            top: 30,
            left: `${tick.pct}%`,
            width: 1,
            height: 12,
            background: '#2A2F38',
          }} />
        ))}

        {/* Hour labels */}
        {TICKS.map((tick, i) => (
          <div key={`lbl-${i}`} style={{
            position: 'absolute',
            top: 44,
            left: `${tick.pct}%`,
            transform: 'translateX(-50%)',
            fontSize: 7,
            fontFamily: 'monospace',
            color: '#404854',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}>
            {tick.label.split('\n')[0]}
          </div>
        ))}

        {/* Story markers */}
        {sorted.map((story, i) => {
          const x = pct(story.timestamp);
          const isActive = story.id === activeId;
          const color = CAT_COLOR[story.category] ?? '#8F99A8';
          // Alternate above/below track to reduce overlap
          const above = i % 2 === 0;

          return (
            <div
              key={story.id}
              onClick={() => onActivate(story)}
              title={story.title}
              style={{
                position: 'absolute',
                left: `${x}%`,
                top: above ? 14 : 30,
                transform: 'translateX(-50%)',
                cursor: 'pointer',
                zIndex: isActive ? 10 : 1,
              }}
            >
              {/* Connector line to track */}
              <div style={{
                position: 'absolute',
                left: '50%',
                top: above ? '100%' : undefined,
                bottom: above ? undefined : '100%',
                width: 1,
                height: above ? 36 - 14 - 14 : 36 - 30,
                background: isActive ? color : '#404854',
                transform: 'translateX(-50%)',
                pointerEvents: 'none',
              }} />

              {/* Icon box */}
              <div style={{
                position: 'relative',
                outline: isActive ? `2px solid ${color}` : '2px solid transparent',
                outlineOffset: 1,
                borderRadius: 2,
                boxShadow: isActive ? `0 0 8px ${color}66` : 'none',
                transition: 'outline 0.15s, box-shadow 0.15s',
              }}>
                <StoryIcon
                  iconName={story.iconName}
                  category={story.category}
                  size={11}
                  boxSize={18}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
