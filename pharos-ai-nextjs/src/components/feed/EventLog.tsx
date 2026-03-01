'use client';
import { fmtTime } from '@/lib/format';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { IntelEvent } from '@/data/iranEvents';
import { getPostsForEvent } from '@/data/iranXPosts';

const SEV_C: Record<string, string> = {
  CRITICAL: 'var(--danger)', HIGH: 'var(--warning)', STANDARD: 'var(--info)',
};
const SEV_BG: Record<string, string> = {
  CRITICAL: 'rgba(231,106,110,0.12)', HIGH: 'rgba(236,154,60,0.12)', STANDARD: 'rgba(76,144,240,0.1)',
};



function groupByDate(events: IntelEvent[]) {
  const groups: Record<string, IntelEvent[]> = {};
  events.forEach(e => {
    const d = new Date(e.timestamp).toISOString().slice(0, 10);
    if (!groups[d]) groups[d] = [];
    groups[d].push(e);
  });
  return groups;
}

interface Props {
  events: IntelEvent[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export function EventLog({ events, selectedId, onSelect }: Props) {
  const grouped = groupByDate(events);

  return (
    <div style={{ width: 300, minWidth: 300, flexShrink: 0, borderRight: '1px solid var(--bd)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div className="panel-header" style={{ justifyContent: 'space-between' }}>
        <span className="section-title">Operation Epic Fury</span>
        <Badge variant="outline" style={{ fontSize: 9, color: 'var(--t4)', borderColor: 'var(--bd)' }}>{events.length}</Badge>
      </div>

      {/* Column headers */}
      <div style={{ display: 'grid', gridTemplateColumns: '40px 50px 1fr 24px', padding: '4px 12px', borderBottom: '1px solid var(--bd)', background: 'var(--bg-2)', flexShrink: 0 }}>
        {['TIME', 'SEV', 'TITLE', ''].map(h => <span key={h} className="label" style={{ fontSize: 8 }}>{h}</span>)}
      </div>

      <ScrollArea style={{ flex: 1 }}>
        {events.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center' }}>
            <span className="label">No results</span>
          </div>
        )}
        {Object.entries(grouped).map(([date, dayEvents]) => (
          <div key={date}>
            <div style={{ padding: '4px 12px', background: 'var(--bg-2)', borderBottom: '1px solid var(--bd)' }}>
              <span className="mono" style={{ fontSize: 9, color: 'var(--t3)' }}>{date}</span>
            </div>
            {dayEvents.map(evt => {
              const isOn = selectedId === evt.id;
              const sc   = SEV_C[evt.severity] ?? 'var(--info)';
              const sbg  = SEV_BG[evt.severity] ?? 'rgba(76,144,240,0.1)';
              const xc   = getPostsForEvent(evt.id).length;
              return (
                <Button
                  key={evt.id}
                  variant="ghost"
                  onClick={() => onSelect(isOn ? null : evt.id)}
                  style={{
                    display: 'grid', gridTemplateColumns: '40px 50px 1fr 24px', gap: 0,
                    width: '100%', height: 'auto', padding: '6px 12px',
                    borderRadius: 0, justifyContent: 'start', alignItems: 'start',
                    borderBottom: '1px solid var(--bd-s)',
                    borderLeft: `3px solid ${isOn ? sc : 'transparent'}`,
                    background: isOn ? 'var(--bg-sel)' : 'transparent',
                  }}
                >
                  <span className="mono" style={{ fontSize: 9, color: 'var(--t3)', alignSelf: 'center' }}>
                    {fmtTime(evt.timestamp)}
                  </span>

                  <div style={{ alignSelf: 'center' }}>
                    <Badge
                      variant="outline"
                      style={{ fontSize: 7, padding: '1px 4px', color: sc, borderColor: sc, background: sbg, letterSpacing: '0.06em', borderRadius: 2 }}
                    >
                      {evt.severity.slice(0, 4)}
                    </Badge>
                  </div>

                  <div>
                    <p style={{ fontSize: 11, color: 'var(--t1)', lineHeight: 1.3, textAlign: 'left', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {evt.title}
                    </p>
                    <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
                      <span className="mono" style={{ fontSize: 8, color: 'var(--t3)' }}>{evt.sources.length}src</span>
                      {xc > 0 && <span className="mono" style={{ fontSize: 8, color: 'var(--t2)' }}>𝕏{xc}</span>}
                      {evt.verified && <CheckCircle size={8} style={{ color: 'var(--success)' }} strokeWidth={2} />}
                    </div>
                  </div>

                  <ArrowRight size={9} style={{ color: 'var(--t3)', alignSelf: 'center' }} strokeWidth={1.5} />
                </Button>
              );
            })}
          </div>
        ))}
      </ScrollArea>
    </div>
  );
}
