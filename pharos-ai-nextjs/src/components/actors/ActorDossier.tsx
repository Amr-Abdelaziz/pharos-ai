'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { IntelTabBar, TabsContent } from '@/components/shared/IntelTabs';
import Flag from '@/components/shared/Flag';
import XPostCard from '@/components/shared/XPostCard';
import { ActorIntelTab } from '@/components/actors/ActorIntelTab';
import { ACT_C, STA_C } from '@/data/iran-actors';
import { getActorForDay, dayAbbrev } from '@/lib/day-filter';
import { useXPostsByActor } from '@/api/x-posts';
import { useConflictDay } from '@/hooks/use-conflict-day';
import type { Actor, XPost } from '@/types/domain';

type Props = {
  actor: Actor;
  tab: 'intel' | 'signals';
  onTabChange: (t: 'intel' | 'signals') => void;
  currentDay: string;
};

export function ActorDossier({ actor, tab, onTabChange, currentDay }: Props) {
  const snap   = getActorForDay(actor, currentDay);
  const actC   = ACT_C[snap?.activityLevel] ?? 'var(--t2)';
  const staC   = STA_C[snap?.stance] ?? 'var(--t2)';
  const { data: xPosts } = useXPostsByActor(undefined, actor.id);
  const { allDays } = useConflictDay();
  const dayActions = actor.recentActions.filter(a => a.date === currentDay);

  const posts = xPosts ?? [];

  const tabs = [
    { value: 'intel'   as const, label: 'ACTOR INTELLIGENCE' },
    { value: 'signals' as const, label: `𝕏 SIGNALS${posts.length > 0 ? ` (${posts.length})` : ''}` },
  ];

  if (!snap) return null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-[var(--bd)] bg-[var(--bg-2)] shrink-0">
        <div className="label text-[8px] text-[var(--t3)] mb-2">
          ACTOR INTELLIGENCE DOSSIER // PHAROS THREAT ANALYSIS // OPERATION EPIC FURY
        </div>
        <div className="flex items-start gap-3.5 mb-2.5">
          {actor.countryCode && <Flag code={actor.countryCode} size={36} />}
          <div className="flex-1">
            <div className="flex items-center gap-2.5 mb-1">
              <h1 className="text-base font-bold text-[var(--t1)] leading-[1.1]">
                {actor.name.toUpperCase()}
              </h1>
              <span
                className="text-[8px] font-bold tracking-[0.06em] px-2 py-0.5"
                style={{ border: `1px solid ${actC}`, color: actC }}
              >
                {snap.activityLevel}
              </span>
              <span
                className="text-[8px] font-bold tracking-[0.06em] px-2 py-0.5"
                style={{ border: `1px solid ${staC}`, color: staC }}
              >
                {snap.stance}
              </span>
            </div>
            <span className="mono text-[10px] text-[var(--t2)]">{actor.fullName}</span>
            <span className="label ml-2.5 text-[8px] text-[var(--t3)]">{actor.type}</span>
          </div>
          <div className="shrink-0 flex items-center gap-1.5">
            <div className="h-1.5 w-20 bg-[var(--bd)]">
              <div style={{ width: `${snap.activityScore}%`, height: '100%', background: actC }} />
            </div>
            <span className="mono text-[11px]" style={{ color: actC }}>{snap.activityScore}%</span>
          </div>
        </div>

        {/* Stance timeline */}
        <div className="flex items-center gap-1 mt-1">
          <span className="label text-[7px] text-[var(--t4)] mr-1">STANCE</span>
          {allDays.map(day => {
            const ds = getActorForDay(actor, day);
            if (!ds) return null;
            const sc = STA_C[ds.stance] ?? 'var(--t2)';
            const isCurrent = day === currentDay;
            return (
              <div
                key={day}
                className="flex items-center gap-[3px] px-[6px] py-[2px]"
                style={{
                  background: sc + '18',
                  border: `1px solid ${isCurrent ? sc : 'transparent'}`,
                }}
              >
                <span className="mono text-[7px] font-bold" style={{ color: sc }}>{dayAbbrev(day, allDays)}</span>
                <span className="text-[7px] font-bold tracking-[0.04em]" style={{ color: sc }}>{ds.stance}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <IntelTabBar value={tab} onValueChange={onTabChange} tabs={tabs}>
        <TabsContent value="intel" className="flex-1 min-h-0 overflow-hidden">
          <ActorIntelTab
            actor={actor}
            snap={snap}
            actC={actC}
            staC={staC}
            currentDay={currentDay}
            dayActions={dayActions}
          />
        </TabsContent>

        <TabsContent value="signals" className="flex-1 min-h-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="px-4 py-3">
              {posts.length === 0 ? (
                <div className="p-12 text-center">
                  <span className="text-xl text-[var(--t3)]">𝕏</span>
                  <p className="label text-[var(--t3)] mt-2">
                    No signals indexed for this actor
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-2.5">
                    <span className="label text-[8px]">
                      {posts.length} POSTS · PHAROS-CURATED · {actor.name.toUpperCase()}
                    </span>
                  </div>
                  {posts.map(p => <XPostCard key={p.id} post={p as XPost} />)}
                </>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </IntelTabBar>
    </div>
  );
}
