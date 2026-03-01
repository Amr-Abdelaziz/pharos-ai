'use client';
import { ArrowRight } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import Flag from '@/components/shared/Flag';
import { ACTORS, ACT_C, STA_C, type Actor } from '@/data/iranActors';
import { getPostsForActor } from '@/data/iranXPosts';

interface Props {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export function ActorList({ selectedId, onSelect }: Props) {
  return (
    <div style={{ width: 240, minWidth: 240, flexShrink: 0, borderRight: '1px solid var(--bd)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div className="panel-header" style={{ justifyContent: 'space-between' }}>
        <span className="section-title">Actors</span>
        <Badge variant="outline" style={{ fontSize: 9, color: 'var(--t4)', borderColor: 'var(--bd)' }}>{ACTORS.length}</Badge>
      </div>

      {/* Column headers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 30px', padding: '4px 12px', borderBottom: '1px solid var(--bd)', background: 'var(--bg-2)', flexShrink: 0 }}>
        {['ACTOR', 'ACTIVITY', ''].map(h => <span key={h} className="label" style={{ fontSize: 8 }}>{h}</span>)}
      </div>

      <ScrollArea style={{ flex: 1 }}>
        {ACTORS.map((actor: Actor) => {
          const isOn   = selectedId === actor.id;
          const actC   = ACT_C[actor.activityLevel] ?? 'var(--t2)';
          const staC   = STA_C[actor.stance] ?? 'var(--t2)';
          const xCount = getPostsForActor(actor.id).length;
          return (
            <Button
              key={actor.id}
              variant="ghost"
              onClick={() => onSelect(isOn ? null : actor.id)}
              style={{
                display: 'grid', gridTemplateColumns: '1fr 60px 30px', gap: 0,
                width: '100%', height: 'auto', padding: '8px 12px',
                borderRadius: 0, justifyContent: 'start', alignItems: 'center',
                borderBottom: '1px solid var(--bd-s)',
                borderLeft: `3px solid ${isOn ? actC : 'transparent'}`,
                background: isOn ? 'var(--bg-sel)' : 'transparent',
              }}
            >
              {/* Name + flag + stance */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                  {actor.countryCode && <Flag code={actor.countryCode} size={18} />}
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--t1)', textAlign: 'left' }}>
                    {actor.name}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <Badge variant="outline" style={{ fontSize: 7, padding: '1px 4px', color: staC, borderColor: staC, background: `${staC}15`, letterSpacing: '0.04em', borderRadius: 2 }}>
                    {actor.stance}
                  </Badge>
                  {xCount > 0 && <span className="mono" style={{ fontSize: 8, color: 'var(--t3)' }}>𝕏{xCount}</span>}
                </div>
              </div>

              {/* Activity progress bar */}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 3 }}>
                <Progress
                  value={actor.activityScore}
                  style={{ height: 3, borderRadius: 1, background: 'var(--bd)' }}
                  indicatorStyle={{ background: actC }}
                />
                <span className="mono" style={{ fontSize: 8, color: actC }}>{actor.activityScore}</span>
              </div>

              <ArrowRight size={9} style={{ color: 'var(--t3)', alignSelf: 'center' }} strokeWidth={1.5} />
            </Button>
          );
        })}
      </ScrollArea>
    </div>
  );
}
