'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { fmtTimeZ } from '@/lib/format';
import StoryIcon from './StoryIcon';

import type { MapStory, StoryEvent } from '@/types/domain';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<MapStory['category'], { bg: string; text: string }> = {
  STRIKE:      { bg: 'var(--danger-dim)',  text: 'var(--danger)'  },
  RETALIATION: { bg: 'var(--danger-dim)',  text: 'var(--danger)'  },
  NAVAL:       { bg: 'var(--info-dim)',    text: 'var(--blue-l)'  },
  INTEL:       { bg: 'rgba(160,100,220,0.12)', text: 'var(--cyber)' },
  DIPLOMATIC:  { bg: 'var(--success-dim)', text: 'var(--success)' },
};

const EVENT_COLORS: Record<StoryEvent['type'], string> = {
  STRIKE:      'var(--danger)',
  RETALIATION: 'var(--warning)',
  INTEL:       'var(--cyber)',
  NAVAL:       'var(--blue-l)',
  POLITICAL:   'var(--t3)',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function EventLog({ events }: { events: StoryEvent[] }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <p className="label" style={{ color: 'var(--t4)', marginBottom: 8 }}>EVENT LOG</p>
      <div style={{ position: 'relative', paddingLeft: 16 }}>
        <div style={{ position: 'absolute', left: 5, top: 6, bottom: 6, width: 1, background: 'var(--bd-s)' }} />
        {events.map((ev, i) => {
          const color = EVENT_COLORS[ev.type] ?? 'var(--t3)';
          return (
            <div key={i} style={{ position: 'relative', marginBottom: i < events.length - 1 ? 10 : 0 }}>
              <div style={{
                position: 'absolute', left: -12, top: 4,
                width: 7, height: 7, borderRadius: '50%',
                background: color, border: `1px solid ${color}`,
              }} />
              <p className="mono" style={{ fontSize: 9, color, fontWeight: 700, marginBottom: 1 }}>
                {new Date(ev.time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).toUpperCase()} · {fmtTimeZ(ev.time)}
              </p>
              <p style={{ fontSize: 11, color: 'var(--t3)', lineHeight: 1.4 }}>{ev.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type Props = {
  story:    MapStory;
  isOpen:   boolean;
  onToggle: () => void;
  onFlyTo:  () => void;
};

export default function StoryCard({ story, isOpen, onToggle, onFlyTo }: Props) {
  const catColor = CATEGORY_COLORS[story.category];
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div style={{ borderBottom: '1px solid var(--bd-s)' }}>

      {/* Header row */}
      <Button
        variant="ghost"
        onClick={onToggle}
        className="w-full text-left hover:bg-[var(--bg-1)] transition-colors rounded-none h-auto"
        style={{
          padding:    '12px 16px',
          background: isOpen ? 'var(--bg-1)' : 'transparent',
          display:    'block',
        }}
      >
        <div className="flex items-center gap-0">
          <StoryIcon iconName={story.iconName} category={story.category} size={15} boxSize={28} style={{ marginRight: 10 }} />
          <div className="flex-1 min-w-0">
            <p style={{ fontWeight: 600, fontSize: 12, color: 'var(--t1)', lineHeight: 1.3 }} className="line-clamp-2">
              {story.title}
            </p>
            <p style={{ fontSize: 10, color: 'var(--t3)', marginTop: 2 }} className="truncate">{story.tagline}</p>
          </div>
          <div className="flex items-center gap-1 ml-2 shrink-0">
            <span className="mono" style={{
              background: catColor.bg, color: catColor.text,
              fontSize: 8, fontWeight: 700, padding: '2px 5px', borderRadius: 2,
            }}>
              {story.category}
            </span>
            <span style={{ color: 'var(--t4)', fontSize: 12 }}>{isOpen ? '∨' : '›'}</span>
          </div>
        </div>
      </Button>

      {/* Expanded body */}
      {isOpen && (
        <div style={{ background: 'var(--bg-app)', padding: '12px 16px' }}>
          <p style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.6, marginBottom: 12 }}>
            {story.narrative}
          </p>

          {story.events.length > 0 && <EventLog events={story.events} />}

          {/* Key facts */}
          <div style={{ marginBottom: 10 }}>
            <p className="label" style={{ color: 'var(--t4)', marginBottom: 6 }}>KEY FACTS</p>
            {story.keyFacts.map((fact, i) => (
              <p key={i} className="mono" style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 3 }}>
                → {fact}
              </p>
            ))}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onFlyTo} className="flex-1 font-mono text-[10px] tracking-widest"
              style={{ color: 'var(--blue-l)', borderColor: 'var(--blue)', background: 'var(--blue-dim)' }}
            >
              ⊙ FLY TO
            </Button>
            <Button variant="outline" size="sm" onClick={() => setModalOpen(true)} className="flex-1 font-mono text-[10px] tracking-widest"
              style={{ color: 'var(--t2)', borderColor: 'var(--bd)', background: 'var(--bg-1)' }}
            >
              ⊞ OPEN
            </Button>
          </div>
        </div>
      )}

      {/* Story detail modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent
          className="sm:max-w-2xl max-h-[80vh] overflow-y-auto"
          style={{ background: 'var(--bg-app)', color: 'var(--t1)', borderColor: 'var(--bd)' }}
        >
          <DialogHeader>
            <div className="flex items-center gap-3">
              <StoryIcon iconName={story.iconName} category={story.category} size={20} boxSize={36} />
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-sm leading-tight" style={{ color: 'var(--t1)' }}>
                  {story.title}
                </DialogTitle>
                <DialogDescription className="text-xs mt-1" style={{ color: 'var(--t3)' }}>
                  {story.tagline}
                </DialogDescription>
              </div>
              <span className="mono shrink-0" style={{
                background: catColor.bg, color: catColor.text,
                fontSize: 9, fontWeight: 700, padding: '3px 7px', borderRadius: 3,
              }}>
                {story.category}
              </span>
            </div>
          </DialogHeader>

          {/* Narrative */}
          <div style={{ borderTop: '1px solid var(--bd-s)', paddingTop: 16 }}>
            <p style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.7 }}>
              {story.narrative}
            </p>
          </div>

          {/* Event log */}
          {story.events.length > 0 && (
            <div style={{ borderTop: '1px solid var(--bd-s)', paddingTop: 16 }}>
              <EventLog events={story.events} />
            </div>
          )}

          {/* Key facts */}
          <div style={{ borderTop: '1px solid var(--bd-s)', paddingTop: 16 }}>
            <p className="label" style={{ color: 'var(--t4)', marginBottom: 8 }}>KEY FACTS</p>
            {story.keyFacts.map((fact, i) => (
              <p key={i} className="mono" style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 4 }}>
                → {fact}
              </p>
            ))}
          </div>

          {/* Fly to */}
          <Button variant="outline" size="sm" onClick={() => { onFlyTo(); setModalOpen(false); }}
            className="w-full font-mono text-[10px] tracking-widest"
            style={{ color: 'var(--blue-l)', borderColor: 'var(--blue)', background: 'var(--blue-dim)' }}
          >
            ⊙ FLY TO
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
