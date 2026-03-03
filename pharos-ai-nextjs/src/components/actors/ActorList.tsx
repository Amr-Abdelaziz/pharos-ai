'use client';
import { ArrowRight } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import Flag from '@/components/shared/Flag';
import { DaySelector } from '@/components/shared/DaySelector';
import { ACT_C, STA_C } from '@/data/iran-actors';
import { getActorForDay } from '@/lib/day-filter';
import type { Actor, ConflictDay } from '@/types/domain';
import { useActors } from '@/api/actors';
import { useXPosts } from '@/api/x-posts';

type Props = {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  currentDay: ConflictDay;
  onDayChange: (day: ConflictDay) => void;
};

export function ActorList({ selectedId, onSelect, currentDay, onDayChange }: Props) {
  const { data: actors } = useActors();
  const { data: allPosts } = useXPosts();
  // Sort actors by selected day's activity score
  const sorted = [...(actors ?? [])].sort((a, b) =>
    (getActorForDay(b, currentDay)?.activityScore ?? 0) - (getActorForDay(a, currentDay)?.activityScore ?? 0)
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="panel-header justify-between">
        <span className="section-title">Actors</span>
        <Badge variant="outline" className="text-[9px] text-[var(--t4)] border-[var(--bd)]">{sorted.length}</Badge>
      </div>

      {/* Day selector */}
      <div className="px-3 py-2 border-b border-[var(--bd)] bg-[var(--bg-2)] shrink-0">
        <DaySelector currentDay={currentDay} onDayChange={onDayChange} />
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[1fr_60px_30px] px-3 py-1 border-b border-[var(--bd)] bg-[var(--bg-2)] shrink-0">
        {['ACTOR', 'ACTIVITY', ''].map(h => <span key={h} className="label text-[8px]">{h}</span>)}
      </div>

      <ScrollArea className="flex-1">
        {sorted.map((actor: Actor) => {
          const snap   = getActorForDay(actor, currentDay);
          if (!snap) return null;
          const isOn   = selectedId === actor.id;
          const actC   = ACT_C[snap.activityLevel] ?? 'var(--t2)';
          const staC   = STA_C[snap.stance] ?? 'var(--t2)';
          const xCount = (allPosts ?? []).filter(p => p.actorId === actor.id).length;
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
                    {snap.stance}
                  </Badge>
                  {xCount > 0 && <span className="mono text-[8px] text-[var(--t3)]">𝕏{xCount}</span>}
                </div>
              </div>

              {/* Activity progress bar */}
              <div className="flex flex-col justify-center gap-[3px]">
                <Progress
                  value={snap.activityScore}
                  className="h-[3px] rounded-[1px] bg-[var(--bd)]"
                  indicatorStyle={{ background: actC }}
                />
                <span className="mono text-[8px]" style={{ color: actC }}>{snap.activityScore}</span>
              </div>

              <ArrowRight size={9} className="text-[var(--t3)] self-center" strokeWidth={1.5} />
            </Button>
          );
        })}
      </ScrollArea>
    </div>
  );
}
