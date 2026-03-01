'use client';
import { fmtDate, fmtTimeZ } from '@/lib/format';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { CONFLICT }  from '@/data/iranConflict';
import { EVENTS }    from '@/data/iranEvents';
import { ACTORS, ACT_C, STA_C } from '@/data/iranActors';
import { X_POSTS }   from '@/data/iranXPosts';
import XPostCard     from '@/components/shared/XPostCard';
import Flag          from '@/components/shared/Flag';
import { SummaryBar } from '@/components/overview/SummaryBar';
import { CasChip } from './overview/CasChip';

const IntelMap = dynamic(() => import('@/components/map/IntelMap'), { ssr: false });

const SEV_C: Record<string, string> = {
  CRITICAL: 'var(--danger)', HIGH: 'var(--warning)', STANDARD: 'var(--info)',
};
const SEV_CLS: Record<string, string> = {
  CRITICAL: 'sev sev-crit', HIGH: 'sev sev-high', STANDARD: 'sev sev-std',
};

export default function OverviewPage() {
  const [wideScreen, setWideScreen] = useState(false);

  useEffect(() => {
    const check = () => setWideScreen(window.innerWidth >= 1500);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const sortedEvents  = [...EVENTS].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 6);
  const breakingPosts = X_POSTS.filter(p => p.significance === 'BREAKING').slice(0, 3);

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-[var(--bg-1)]">
      <SummaryBar />

      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── LEFT ~60% ── */}
        <div className="flex flex-col overflow-hidden min-w-0 border-r border-[var(--bd)] [flex:3]">

          {/* Situation Summary */}
          <div className="shrink-0 border-b border-[var(--bd)]">
            <div className="panel-header">
              <div className="w-[5px] h-[5px] rounded-full bg-[var(--danger)]" />
              <span className="section-title">Situation Summary</span>
              <span className="label ml-auto text-[8px] text-[var(--t4)]">
                {CONFLICT.codename.us} / {CONFLICT.codename.il}
              </span>
            </div>
            <div className="px-[18px] py-[14px]">
              <div className="mb-2.5">
                <span className="label text-[8px] text-[var(--t4)]">
                  UNCLASSIFIED // PHAROS ANALYTICAL // {fmtDate(CONFLICT.startDate)} →
                </span>
              </div>
              <p className="text-[13px] text-[var(--t1)] leading-relaxed mb-2.5">{CONFLICT.summary}</p>
              <div className="flex gap-3 mt-2.5">
                <div className="flex-1 px-3 py-2 bg-[var(--bg-2)] border border-[var(--bd)] [border-left:3px_solid_var(--blue)]">
                  <div className="label text-[8px] mb-1 text-[var(--blue)]">US OBJECTIVE</div>
                  <p className="text-[11px] text-[var(--t2)] leading-snug">{CONFLICT.objectives.us}</p>
                </div>
                <div className="flex-1 px-3 py-2 bg-[var(--bg-2)] border border-[var(--bd)] [border-left:3px_solid_var(--info)]">
                  <div className="label text-[8px] mb-1 text-[var(--info)]">ISRAELI OBJECTIVE</div>
                  <p className="text-[11px] text-[var(--t2)] leading-snug">{CONFLICT.objectives.il}</p>
                </div>
              </div>
              <div className="flex gap-[14px] mt-3 flex-wrap">
                <CasChip label="US KIA"       val={String(CONFLICT.casualties.us.kia)}           color="var(--danger)"  />
                <CasChip label="IL Civilians"  val={String(CONFLICT.casualties.israel.civilians)} color="var(--warning)" />
                <CasChip label="IR Killed"     val={String(CONFLICT.casualties.iran.killed)}      color="var(--t2)"      />
                <CasChip label="Regional KIA"  val="4"                                             color="var(--t3)"      />
              </div>
            </div>
          </div>

          {/* Latest Events */}
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="panel-header">
              <span className="section-title">Latest Events</span>
              <Link href="/dashboard/feed" className="no-underline ml-auto flex items-center gap-1">
                <span className="text-[9px] text-[var(--blue-l)] font-semibold">View All</span>
                <ArrowRight size={10} strokeWidth={2} className="text-[var(--blue-l)]" />
              </Link>
            </div>
            <div className="flex-1 overflow-y-auto">
              {sortedEvents.map((evt, i) => {
                const sc = SEV_C[evt.severity] ?? 'var(--info)';
                return (
                  <Link key={evt.id} href={`/dashboard/feed?event=${evt.id}`} className="no-underline">
                    <div
                      className="flex gap-3 items-start px-[18px] py-[9px] cursor-pointer hover:bg-[var(--bg-3)] transition-colors"
                      style={{ borderBottom: i < sortedEvents.length - 1 ? '1px solid var(--bd-s)' : 'none' }}
                    >
                      <div className="shrink-0 flex flex-col gap-1 w-20">
                        <span className={SEV_CLS[evt.severity]}>{evt.severity.slice(0, 4)}</span>
                        <span className="mono text-[9px] text-[var(--t4)]">{fmtTimeZ(evt.timestamp)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-[var(--t1)] leading-snug mb-[3px]">{evt.title}</p>
                        <span className="mono text-[9px] text-[var(--t4)]">{evt.location}</span>
                      </div>
                      <div className="shrink-0 flex items-center">
                        <div className="w-1 h-full min-h-[32px] mr-2 opacity-40" style={{ background: sc }} />
                        <ArrowRight size={10} strokeWidth={1.5} className="text-[var(--t4)]" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── RIGHT ~40% ── */}
        <div
          className={`flex flex-col min-w-0 overflow-hidden [flex:2]${wideScreen ? ' border-r border-[var(--bd)]' : ''}`}
        >

          {/* Actor Positions */}
          <div className="flex flex-col flex-1 overflow-hidden border-b border-[var(--bd)]">
            <div className="panel-header">
              <span className="section-title">Actor Positions</span>
              <Link href="/dashboard/actors" className="no-underline ml-auto flex items-center gap-1">
                <span className="text-[9px] text-[var(--blue-l)] font-semibold">Dossiers</span>
                <ArrowRight size={10} strokeWidth={2} className="text-[var(--blue-l)]" />
              </Link>
            </div>
            <div className="flex-1 overflow-y-auto">
              {ACTORS.map((actor, i) => {
                const actC = ACT_C[actor.activityLevel] ?? 'var(--t2)';
                const staC = STA_C[actor.stance] ?? 'var(--t2)';
                return (
                  <Link key={actor.id} href={`/dashboard/actors?actor=${actor.id}`} className="no-underline">
                    <div
                      className="flex items-start gap-[10px] px-[14px] py-2 cursor-pointer hover:bg-[var(--bg-3)] transition-colors"
                      style={{
                        borderBottom: i < ACTORS.length - 1 ? '1px solid var(--bd-s)' : 'none',
                        borderLeft: `3px solid ${actC}`,
                      }}
                    >
                      <div className="shrink-0 w-[110px]">
                        <div className="flex items-center gap-[5px] mb-[3px]">
                          {actor.countryCode && <Flag code={actor.countryCode} size={18} />}
                          <span className="text-[11px] font-bold text-[var(--t1)]">{actor.name}</span>
                        </div>
                        <span
                          className="text-[7px] font-bold px-[5px] py-[1px] tracking-[0.05em]"
                          style={{ background: staC + '18', color: staC }}
                        >
                          {actor.stance}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10.5px] text-[var(--t2)] leading-snug line-clamp-2">
                          ▸ {actor.doing[0]}
                        </p>
                      </div>
                      <div className="shrink-0 w-10 flex flex-col gap-[3px] items-end">
                        <span className="mono text-[10px] font-bold" style={{ color: actC }}>{actor.activityScore}</span>
                        <div className="w-9 h-[3px] bg-[var(--bd)]">
                          <div className="h-full" style={{ width: `${actor.activityScore}%`, background: actC }} />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Field Signals */}
          <div className="flex flex-col flex-1 overflow-hidden min-h-0">
            <div className="panel-header">
              <span className="text-[13px] text-[var(--t1)] leading-none">𝕏</span>
              <span className="section-title">Field Signals</span>
              <Link href="/dashboard/signals" className="no-underline ml-auto flex items-center gap-1">
                <span className="text-[9px] text-[var(--blue-l)] font-semibold">All Signals</span>
                <ArrowRight size={10} strokeWidth={2} className="text-[var(--blue-l)]" />
              </Link>
            </div>
            <div className="flex-1 overflow-y-auto p-[10px]">
              {breakingPosts.map(p => (
                <XPostCard key={p.id} post={p as import('@/data/iranXPosts').XPost} compact />
              ))}
            </div>
          </div>
        </div>

        {/* ── INTEL MAP (≥1500px) ── */}
        {wideScreen && (
          <div className="flex flex-col min-w-0 border-l border-[var(--bd)] overflow-hidden [flex:2]">
            <IntelMap />
          </div>
        )}
      </div>
    </div>
  );
}
