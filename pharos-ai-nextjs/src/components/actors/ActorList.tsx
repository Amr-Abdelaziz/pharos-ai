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
    <div className="w-60 min-w-60 shrink-0 border-r border-[var(--bd)] flex flex-col overflow-hidden">
      <div className="panel-header justify-between">
        <span className="section-title">Actors</span>
        <Badge variant="outline" className="text-[9px] text-[var(--t4)] border-[var(--bd)]">{ACTORS.length}</Badge>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[1fr_60px_30px] px-3 py-1 border-b border-[var(--bd)] bg-[var(--bg-2)] shrink-0">
        {['ACTOR', 'ACTIVITY', ''].map(h => <span key={h} className="label text-[8px]">{h}</span>)}
      </div>

      <ScrollArea className="flex-1">
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
              className="grid grid-cols-[1fr_60px_30px] gap-0 w-full h-auto px-3 py-2 rounded-none justify-start items-center border-b border-[var(--bd-s)]"
              style={{
                borderLeft: `3px solid ${isOn ? actC : 'transparent'}`,
                background: isOn ? 'var(--bg-sel)' : 'transparent',
              }}
            >
              {/* Name + flag + stance */}
              <div>
                <div className="flex items-center gap-[5px] mb-[3px]">
                  {actor.countryCode && <Flag code={actor.countryCode} size={18} />}
                  <span className="text-[11px] font-bold text-[var(--t1)] text-left">
                    {actor.name}
                  </span>
                </div>
                <div className="flex gap-1.5 items-center">
                  <Badge
                    variant="outline"
                    className="text-[7px] px-1 py-px tracking-[0.04em] rounded-sm"
                    style={{ color: staC, borderColor: staC, background: `${staC}15` }}
                  >
                    {actor.stance}
                  </Badge>
                  {xCount > 0 && <span className="mono text-[8px] text-[var(--t3)]">𝕏{xCount}</span>}
                </div>
              </div>

              {/* Activity progress bar */}
              <div className="flex flex-col justify-center gap-[3px]">
                <Progress
                  value={actor.activityScore}
                  className="h-[3px] rounded-[1px] bg-[var(--bd)]"
                  indicatorStyle={{ background: actC }}
                />
                <span className="mono text-[8px]" style={{ color: actC }}>{actor.activityScore}</span>
              </div>

              <ArrowRight size={9} className="text-[var(--t3)] self-center" strokeWidth={1.5} />
            </Button>
          );
        })}
      </ScrollArea>
    </div>
  );
}
