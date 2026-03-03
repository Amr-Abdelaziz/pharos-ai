'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowRight, ArrowLeft, X as XIcon, Plus } from 'lucide-react';

import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { fmtDate, fmtTimeZ } from '@/lib/format';
import { ACT_C, STA_C } from '@/data/iran-actors';
import XPostCard from '@/components/shared/XPostCard';
import Flag from '@/components/shared/Flag';
import { CasChip } from '@/app/dashboard/overview/CasChip';
import { DaySelector } from '@/components/shared/DaySelector';
import { getConflictForDay, getActorForDay, getEventsForDay, getPostsForDay } from '@/lib/day-filter';
import type { ConflictDaySnapshot, IntelEvent, Actor, XPost } from '@/types/domain';

import { useAppSelector, useAppDispatch } from '@/store';
import {
  applyPreset,
  addWidget as addWidgetAction,
  removeWidget as removeWidgetAction,
  moveWidget as moveWidgetAction,
  addColumn as addColumnAction,
  toggleEditing,
  resetToPreset,
  setColumnSizes,
  setRowSizes,
} from '@/store/workspace-slice';
import { ALL_WIDGET_KEYS, WIDGET_LABELS, PRESETS, type WidgetKey, type PresetId } from '@/store/presets';

import { useBootstrap } from '@/api/bootstrap';
import { useConflict, useConflictDays } from '@/api/conflicts';
import { useEvents } from '@/api/events';
import { useActors } from '@/api/actors';
import { useXPosts } from '@/api/x-posts';

// Dashboard context — provides day + API data to all widgets
interface DashData {
  day: string;
  conflict: any;
  snapshots: ConflictDaySnapshot[];
  events: IntelEvent[];
  actors: Actor[];
  xPosts: XPost[];
  allDays: string[];
}

const DashCtx = createContext<DashData>({
  day: '',
  conflict: null,
  snapshots: [],
  events: [],
  actors: [],
  xPosts: [],
  allDays: [],
});

const FullMapPage = dynamic(() => import('@/components/map/MapPageContent'),                           { ssr: false });

// types, constants, and presets imported from @/store/presets

import { SEV_C } from '@/lib/severity-colors';
const SEV_CLS: Record<string, string> = {
  CRITICAL: 'sev sev-crit', HIGH: 'sev sev-high', STANDARD: 'sev sev-std',
};

// ─── individual widgets ──────────────────────────────────────────────────────

function SituationWidget() {
  const { day, snapshots, conflict } = useContext(DashCtx);
  const snap = getConflictForDay(snapshots, day);
  if (!snap) return null;
  return (
    <div className="h-full overflow-y-auto px-[18px] py-[14px]">
      <div className="mb-2.5">
        <span className="label text-[8px] text-[var(--t4)]">
          UNCLASSIFIED // PHAROS ANALYTICAL // {snap.dayLabel} — {day}
        </span>
      </div>
      <p className="text-[13px] text-[var(--t1)] leading-relaxed mb-2.5">{snap.summary}</p>
      <div className="flex gap-3 mt-2.5">
        <div className="flex-1 px-3 py-2 bg-[var(--bg-2)] border border-[var(--bd)] [border-left:3px_solid_var(--blue)]">
          <div className="label text-[8px] mb-1 text-[var(--blue)]">US OBJECTIVE</div>
          <p className="text-[11px] text-[var(--t2)] leading-snug">{conflict?.objectives?.us}</p>
        </div>
        <div className="flex-1 px-3 py-2 bg-[var(--bg-2)] border border-[var(--bd)] [border-left:3px_solid_var(--info)]">
          <div className="label text-[8px] mb-1 text-[var(--info)]">ISRAELI OBJECTIVE</div>
          <p className="text-[11px] text-[var(--t2)] leading-snug">{conflict?.objectives?.il}</p>
        </div>
      </div>
      <div className="flex gap-[14px] mt-3 flex-wrap">
        <CasChip label="US KIA"       val={String(snap.casualties.us.kia)}                                        color="var(--danger)"  />
        <CasChip label="IL Civilians" val={String(snap.casualties.israel.civilians)}                              color="var(--warning)" />
        <CasChip label="IR Killed"    val={String(snap.casualties.iran.killed)}                                   color="var(--t2)"      />
        <CasChip label="Regional"     val={String(Object.values(snap.casualties.regional).reduce((s, c) => s + c.killed, 0))} color="var(--t3)"      />
      </div>
    </div>
  );
}

function LatestEventsWidget() {
  const { day, events: allEvents, allDays } = useContext(DashCtx);
  const events = useMemo(
    () => getEventsForDay(allEvents, allDays, day).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 30),
    [allEvents, allDays, day],
  );
  return (
    <div className="h-full overflow-y-auto">
      {events.map((evt, i) => {
        const sc = SEV_C[evt.severity] ?? 'var(--info)';
        return (
          <Link key={evt.id} href={`/dashboard/feed?event=${evt.id}`} className="no-underline">
            <div
              className="flex gap-3 items-start px-[18px] py-[9px] cursor-pointer hover:bg-[var(--bg-3)] transition-colors"
              style={{ borderBottom: i < events.length - 1 ? '1px solid var(--bd-s)' : 'none' }}
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
  );
}

function ActorsWidget() {
  const { day, actors } = useContext(DashCtx);
  return (
    <div className="h-full overflow-y-auto">
      {actors.map((actor, i) => {
        const snap = getActorForDay(actor, day);
        if (!snap) return null;
        const actC = ACT_C[snap.activityLevel] ?? 'var(--t2)';
        const staC = STA_C[snap.stance] ?? 'var(--t2)';
        return (
          <Link key={actor.id} href={`/dashboard/actors?actor=${actor.id}`} className="no-underline">
            <div
              className="flex items-start gap-[10px] px-[14px] py-2 cursor-pointer hover:bg-[var(--bg-3)] transition-colors"
              style={{
                borderBottom: i < actors.length - 1 ? '1px solid var(--bd-s)' : 'none',
                borderLeft: `3px solid ${actC}`,
              }}
            >
              <div className="shrink-0 w-[110px]">
                <div className="flex items-center gap-[5px] mb-[3px]">
                  {actor.countryCode && <Flag code={actor.countryCode} size={18} />}
                  <span className="text-[11px] font-bold text-[var(--t1)]">{actor.name}</span>
                </div>
                <span className="text-[7px] font-bold px-[5px] py-[1px] tracking-[0.05em]" style={{ background: staC + '18', color: staC }}>
                  {snap.stance}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10.5px] text-[var(--t2)] leading-snug line-clamp-2">▸ {snap.doing[0]}</p>
              </div>
              <div className="shrink-0 w-10 flex flex-col gap-[3px] items-end">
                <span className="mono text-[10px] font-bold" style={{ color: actC }}>{snap.activityScore}</span>
                <div className="w-9 h-[3px] bg-[var(--bd)]">
                  <div className="h-full" style={{ width: `${snap.activityScore}%`, background: actC }} />
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function SignalsWidget() {
  const { day, xPosts, allDays } = useContext(DashCtx);
  const posts = useMemo(() => getPostsForDay(xPosts, allDays, day).filter(p => p.significance === 'BREAKING').slice(0, 20), [xPosts, allDays, day]);
  return (
    <div className="h-full overflow-y-auto p-[10px]">
      {posts.map(p => (
        <XPostCard key={p.id} post={p as XPost} compact />
      ))}
    </div>
  );
}

function MapWidget({ full }: { full: boolean }) {
  if (full) return <div className="h-full w-full"><FullMapPage embedded /></div>;
  return <div className="h-full w-full"><FullMapPage embedded /></div>;
}

// ── Key Facts ──
function KeyFactsWidget() {
  const { day, snapshots } = useContext(DashCtx);
  const snap = getConflictForDay(snapshots, day);
  if (!snap) return null;
  return (
    <div className="h-full overflow-y-auto">
      {snap.keyFacts.map((fact, i) => (
        <div
          key={i}
          className="flex gap-3 items-start px-[18px] py-[8px] hover:bg-[var(--bg-3)] transition-colors"
          style={{ borderBottom: i < snap.keyFacts.length - 1 ? '1px solid var(--bd-s)' : 'none' }}
        >
          <span className="mono text-[9px] text-[var(--blue)] shrink-0 mt-[2px]">{String(i + 1).padStart(2, '0')}</span>
          <p className="text-[11px] text-[var(--t2)] leading-snug">{fact}</p>
        </div>
      ))}
    </div>
  );
}

// ── Casualties ──
function CasualtiesWidget() {
  const { day, snapshots } = useContext(DashCtx);
  const snap = getConflictForDay(snapshots, day);
  if (!snap) return null;
  const cas = snap.casualties;
  const rows = [
    { label: 'US KIA',            val: cas.us.kia,              sub: `${cas.us.wounded} wounded`,             color: 'var(--blue)' },
    { label: 'US Civilians',      val: cas.us.civilians,         sub: 'civilian deaths',                       color: 'var(--t3)'   },
    { label: 'Israeli Civilians', val: cas.israel.civilians,     sub: `${cas.israel.injured}+ injured`,       color: 'var(--warning)' },
    { label: 'Iran Killed',       val: cas.iran.killed,          sub: `${snap.dayLabel} cumulative`,           color: 'var(--danger)'  },
  ];
  return (
    <div className="h-full overflow-y-auto px-[18px] py-[14px]">
      <div className="grid grid-cols-2 gap-3 mb-4">
        {rows.map(r => (
          <div key={r.label} className="px-3 py-3 bg-[var(--bg-2)] border border-[var(--bd)]" style={{ borderLeft: `3px solid ${r.color}` }}>
            <div className="label text-[8px] mb-1 text-[var(--t4)]">{r.label}</div>
            <div className="mono text-[22px] font-bold leading-none mb-1" style={{ color: r.color }}>{r.val?.toLocaleString?.() ?? r.val}</div>
            <div className="mono text-[9px] text-[var(--t4)]">{r.sub}</div>
          </div>
        ))}
      </div>
      <div className="text-[10px] text-[var(--t3)] leading-relaxed border-t border-[var(--bd)] pt-3">
        {Object.entries(cas.regional).map(([k, v]) => `${k.toUpperCase()}: ${v.killed} killed, ${v.injured} injured`).join(' · ')}
      </div>
    </div>
  );
}

// ── Commanders ──
function CommandersWidget() {
  const { conflict } = useContext(DashCtx);
  const commanders = conflict?.commanders;
  if (!commanders) return null;
  const sides = [
    { label: 'US', color: 'var(--blue)',    names: commanders.us ?? [] },
    { label: 'IDF', color: 'var(--info)',   names: commanders.il ?? [] },
    { label: 'IRAN', color: 'var(--danger)', names: commanders.ir ?? [] },
  ];
  return (
    <div className="h-full overflow-y-auto px-[18px] py-[14px]">
      {sides.map(side => (
        <div key={side.label} className="mb-5">
          <div className="label text-[8px] font-bold mb-2 tracking-[0.12em]" style={{ color: side.color }}>{side.label}</div>
          {side.names.map((name: string, i: number) => (
            <div key={i} className="flex items-center gap-2 py-[5px]" style={{ borderBottom: '1px solid var(--bd-s)' }}>
              <div className="w-1 h-4 shrink-0" style={{ background: side.color, opacity: i === 0 ? 1 : 0.3 }} />
              <span className="text-[11px] text-[var(--t1)]">{name}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Predictions ──
import type { PredictionMarket as PMType } from '@/types/domain';
import { getLeadProb, probColor, fmtVol, spreadColor, statusLabel } from '@/components/predictions/utils';
import { assignGroup } from '@/data/prediction-groups';

function PredictionsWidget() {
  const [markets, setMarkets] = useState<PMType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/v1/predictions/markets')
      .then(r => r.json())
      .then((d: { markets: PMType[]; error?: string }) => {
        if (d.error) throw new Error(d.error);
        setMarkets(d.markets.filter(m => m.active && !m.closed).sort((a, b) => b.volume - a.volume).slice(0, 20));
      })
      .catch(e => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="h-full flex items-center justify-center"><span className="mono text-[10px] text-[var(--t4)] animate-pulse">LOADING MARKETS…</span></div>;
  if (error) return <div className="h-full flex items-center justify-center"><span className="mono text-[10px] text-[var(--danger)]">{error}</span></div>;

  return (
    <div className="h-full overflow-y-auto">
      {/* column headers */}
      <div className="flex items-center gap-2 px-[14px] py-[6px] border-b border-[var(--bd)] bg-[var(--bg-2)] sticky top-0 z-10">
        <span className="mono text-[8px] text-[var(--t4)] w-[52px]">PROB</span>
        <span className="mono text-[8px] text-[var(--t4)] flex-1">MARKET</span>
        <span className="mono text-[8px] text-[var(--t4)] w-[60px] text-right">VOLUME</span>
        <span className="mono text-[8px] text-[var(--t4)] w-[44px] text-right">24H</span>
        <span className="mono text-[8px] text-[var(--t4)] w-[38px] text-right">SPRD</span>
      </div>

      {markets.map((m, i) => {
        const prob = getLeadProb(m);
        const pct = Math.round(prob * 100);
        const pc = probColor(prob);
        const sc = spreadColor(m.spread);
        const grp = assignGroup(m.title);
        const status = statusLabel(m);
        return (
          <a key={m.id || i} href={m.polyUrl} target="_blank" rel="noopener noreferrer" className="no-underline">
            <div
              className="flex items-center gap-2 px-[14px] py-[8px] hover:bg-[var(--bg-3)] transition-colors cursor-pointer"
              style={{ borderBottom: '1px solid var(--bd-s)', borderLeft: `3px solid ${grp.color}` }}
            >
              {/* probability bar + number */}
              <div className="shrink-0 w-[52px] flex items-center gap-[4px]">
                <div className="w-[22px] h-[4px] bg-[var(--bg-3)] overflow-hidden rounded-sm">
                  <div className="h-full rounded-sm" style={{ width: `${pct}%`, background: pc }} />
                </div>
                <span className="mono text-[11px] font-bold leading-none" style={{ color: pc }}>{pct}%</span>
              </div>

              {/* title + group tag */}
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-[var(--t1)] leading-snug truncate">{m.title}</p>
                <div className="flex items-center gap-[6px] mt-[2px]">
                  <span className="mono text-[7px] font-bold tracking-[0.05em] px-[4px] py-[1px]" style={{ color: grp.color, background: grp.bg, border: `1px solid ${grp.border}` }}>
                    {grp.label}
                  </span>
                  <span className="mono text-[7px] px-[4px] py-[1px]" style={{ color: status.color, background: status.bg }}>
                    {status.label}
                  </span>
                  {m.subMarkets.length > 1 && (
                    <span className="mono text-[7px] text-[var(--t4)]">{m.subMarkets.length} sub</span>
                  )}
                </div>
              </div>

              {/* volume */}
              <div className="shrink-0 w-[60px] text-right">
                <span className="mono text-[10px] text-[var(--t2)] font-bold">{fmtVol(m.volume)}</span>
              </div>

              {/* 24h */}
              <div className="shrink-0 w-[44px] text-right">
                <span className="mono text-[9px] text-[var(--t4)]">{fmtVol(m.volume24hr)}</span>
              </div>

              {/* spread */}
              <div className="shrink-0 w-[38px] text-right">
                <span className="mono text-[9px]" style={{ color: sc }}>{(m.spread * 100).toFixed(1)}¢</span>
              </div>
            </div>
          </a>
        );
      })}
    </div>
  );
}

// ── Daily Brief ──
function BriefWidget() {
  const { day, snapshots, events: allEvents, allDays, conflict } = useContext(DashCtx);
  const snap = getConflictForDay(snapshots, day);
  const dayEvents = useMemo(() => getEventsForDay(allEvents, allDays, day), [allEvents, allDays, day]);
  const topEvents = useMemo(
    () => [...dayEvents].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 8),
    [dayEvents],
  );

  const critCount = dayEvents.filter(e => e.severity === 'CRITICAL').length;
  const highCount = dayEvents.filter(e => e.severity === 'HIGH').length;

  if (!snap) return null;

  return (
    <div className="h-full overflow-y-auto">
      {/* classification banner */}
      <div className="px-[18px] py-[10px] bg-[var(--bg-2)] border-b border-[var(--bd)]">
        <div className="mono text-[8px] text-[var(--t4)] tracking-[0.14em] mb-1">UNCLASSIFIED // PHAROS ANALYTICAL</div>
        <div className="mono text-[13px] font-bold text-[var(--t1)] tracking-[0.04em]">DAILY INTELLIGENCE BRIEF</div>
        <div className="flex items-center gap-3 mt-[6px]">
          <span className="mono text-[9px] text-[var(--t3)]">{snap.dayLabel} — OPERATIONS ONGOING</span>
          <span className="mono text-[9px] text-[var(--t4)]">•</span>
          <span className="mono text-[9px] text-[var(--t3)]">AS OF 12:00 UTC</span>
        </div>
      </div>

      {/* escalation meter */}
      <div className="px-[18px] py-[12px] border-b border-[var(--bd)]">
        <div className="flex items-center justify-between mb-[6px]">
          <span className="label text-[8px] text-[var(--t4)] tracking-[0.10em]">ESCALATION INDEX</span>
          <span className="mono text-[18px] font-bold text-[var(--danger)] leading-none">{snap.escalation}</span>
        </div>
        <div className="w-full h-[6px] bg-[var(--bg-3)] rounded-sm overflow-hidden">
          <div className="h-full bg-[var(--danger)] rounded-sm transition-all" style={{ width: `${snap.escalation}%` }} />
        </div>
        <div className="flex items-center gap-4 mt-[8px]">
          <div className="flex items-center gap-[6px]">
            <div className="w-[6px] h-[6px] rounded-full bg-[var(--danger)]" />
            <span className="mono text-[9px] text-[var(--t3)]">{critCount} CRITICAL</span>
          </div>
          <div className="flex items-center gap-[6px]">
            <div className="w-[6px] h-[6px] rounded-full bg-[var(--warning)]" />
            <span className="mono text-[9px] text-[var(--t3)]">{highCount} HIGH</span>
          </div>
          <div className="flex items-center gap-[6px]">
            <div className="w-[6px] h-[6px] rounded-full bg-[var(--blue)]" />
            <span className="mono text-[9px] text-[var(--t3)]">{dayEvents.length} TOTAL</span>
          </div>
        </div>
      </div>

      {/* executive summary — truncated */}
      <div className="px-[18px] py-[12px] border-b border-[var(--bd)]">
        <div className="label text-[8px] text-[var(--t4)] mb-[6px] tracking-[0.10em]">EXECUTIVE SUMMARY</div>
        <p className="text-[11px] text-[var(--t2)] leading-relaxed">{snap.summary.slice(0, 600)}…</p>
      </div>

      {/* top events */}
      <div className="px-[18px] py-[12px] border-b border-[var(--bd)]">
        <div className="label text-[8px] text-[var(--t4)] mb-[6px] tracking-[0.10em]">TOP EVENTS — {snap.dayLabel}</div>
        {topEvents.map((evt, i) => {
          const sc = SEV_C[evt.severity] ?? 'var(--info)';
          return (
            <Link key={evt.id} href={`/dashboard/feed?event=${evt.id}`} className="no-underline">
              <div
                className="flex gap-[10px] items-start py-[7px] hover:bg-[var(--bg-3)] transition-colors"
                style={{ borderBottom: i < topEvents.length - 1 ? '1px solid var(--bd-s)' : 'none', borderLeft: `3px solid ${sc}` }}
              >
                <div className="shrink-0 flex flex-col gap-[2px] pl-[8px]">
                  <span className={SEV_CLS[evt.severity]}>{evt.severity.slice(0, 4)}</span>
                  <span className="mono text-[8px] text-[var(--t4)]">{fmtTimeZ(evt.timestamp)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-[var(--t1)] leading-snug">{evt.title}</p>
                  <span className="mono text-[8px] text-[var(--t4)]">{evt.location}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* key objectives */}
      <div className="px-[18px] py-[12px] border-b border-[var(--bd)]">
        <div className="label text-[8px] text-[var(--t4)] mb-[6px] tracking-[0.10em]">STRATEGIC OBJECTIVES</div>
        <div className="flex gap-3">
          <div className="flex-1 px-3 py-2 bg-[var(--bg-2)] border border-[var(--bd)]" style={{ borderLeft: '3px solid var(--blue)' }}>
            <div className="label text-[8px] mb-1 text-[var(--blue)]">US / COALITION</div>
            <p className="text-[10px] text-[var(--t2)] leading-snug">{conflict?.objectives?.us}</p>
          </div>
          <div className="flex-1 px-3 py-2 bg-[var(--bg-2)] border border-[var(--bd)]" style={{ borderLeft: '3px solid var(--info)' }}>
            <div className="label text-[8px] mb-1 text-[var(--info)]">ISRAEL</div>
            <p className="text-[10px] text-[var(--t2)] leading-snug">{conflict?.objectives?.il}</p>
          </div>
        </div>
      </div>

      {/* link to full brief */}
      <div className="px-[18px] py-[10px]">
        <Link href="/dashboard/brief" className="no-underline flex items-center gap-1">
          <span className="text-[9px] text-[var(--blue-l)] font-semibold">Read Full Brief →</span>
        </Link>
      </div>
    </div>
  );
}

function widgetComponents(): Record<WidgetKey, () => React.ReactNode> {
  return {
    situation:   () => <SituationWidget />,
    latest:      () => <LatestEventsWidget />,
    actors:      () => <ActorsWidget />,
    signals:     () => <SignalsWidget />,
    map:         () => <MapWidget full={false} />,
    keyfacts:    () => <KeyFactsWidget />,
    casualties:  () => <CasualtiesWidget />,
    commanders:  () => <CommandersWidget />,
    predictions: () => <PredictionsWidget />,
    brief:       () => <BriefWidget />,
  };
}


// ─── main ─────────────────────────────────────────────────────────────────────

export function WorkspaceDashboard() {
  const dispatch = useAppDispatch();
  const { columns, activePreset, editing, columnSizes, rowSizes } = useAppSelector(s => s.workspace);
  const [mounted, setMounted] = useState(false);

  const { data: bootstrap } = useBootstrap();
  const allDays = bootstrap?.days ?? [];
  const [dashDay, setDashDay] = useState<string>('');

  // Set initial day once bootstrap data arrives
  useEffect(() => {
    if (allDays.length > 0 && !dashDay) {
      setDashDay(allDays[allDays.length - 1]);
    }
  }, [allDays, dashDay]);

  const { data: conflict } = useConflict();
  const { data: snapshots } = useConflictDays();
  const { data: events } = useEvents();
  const { data: actors } = useActors();
  const { data: xPosts } = useXPosts();

  useEffect(() => { setMounted(true); }, []);

  // All widgets not yet placed anywhere
  const usedWidgets = columns.flatMap(c => c.widgets);
  const availableWidgets = ALL_WIDGET_KEYS.filter(k => !usedWidgets.includes(k));

  if (!mounted) return null;

  const colSize = `${(100 / columns.length).toFixed(1)}%`;

  const dashData: DashData = {
    day: dashDay,
    conflict: conflict ?? null,
    snapshots: snapshots ?? [],
    events: events ?? [],
    actors: actors ?? [],
    xPosts: xPosts ?? [],
    allDays,
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-[var(--bg-1)]">

      {/* ── toolbar ── */}
      <div className="shrink-0 flex items-center gap-2 px-3 py-[5px] border-b border-[var(--bd)] bg-[var(--bg-2)]">
        <button
          onClick={() => dispatch(toggleEditing())}
          className={`text-[10px] px-[10px] py-[4px] border font-semibold tracking-wide transition-colors ${
            editing
              ? 'border-[var(--blue)] bg-[var(--blue-dim)] text-[var(--blue-l)]'
              : 'border-[var(--bd)] bg-[var(--bg-3)] text-[var(--t3)]'
          }`}
        >
          {editing ? '✦ EDITING' : 'EDIT LAYOUT'}
        </button>

        {/* preset selector */}
        <div className="flex items-center gap-0.5 ml-2">
          {(['analyst', 'commander', 'executive'] as const).map(id => (
            <button
              key={id}
              onClick={() => dispatch(applyPreset(id))}
              className={`text-[10px] px-[10px] py-[4px] border font-semibold tracking-wide transition-colors mono ${
                activePreset === id
                  ? 'border-[var(--blue)] bg-[var(--blue-dim)] text-[var(--blue-l)]'
                  : 'border-[var(--bd)] bg-[var(--bg-3)] text-[var(--t4)] hover:text-[var(--t2)]'
              }`}
            >
              {PRESETS[id].label}
            </button>
          ))}
          {activePreset === 'custom' && (
            <span className="text-[9px] text-[var(--t4)] ml-1 mono">CUSTOM</span>
          )}
        </div>

        <div className="ml-1">
          <DaySelector currentDay={dashDay} onDayChange={setDashDay} />
        </div>

        {editing && (
          <>
            {/* Add widget to existing column or as new column */}
            {availableWidgets.length > 0 && (
              <div className="flex items-center gap-1">
                <select
                  id="add-widget-select"
                  className="text-[10px] px-2 py-[4px] border border-[var(--bd)] bg-[var(--bg-3)] text-[var(--t2)]"
                  defaultValue=""
                  onChange={() => {}}
                >
                  <option value="" disabled>widget</option>
                  {availableWidgets.map(k => (
                    <option key={k} value={k}>{WIDGET_LABELS[k]}</option>
                  ))}
                </select>
                <span className="text-[9px] text-[var(--t4)]">→ col:</span>
                {columns.map((col, ci) => (
                  <button
                    key={col.id}
                    className="text-[10px] px-[8px] py-[4px] border border-[var(--bd)] bg-[var(--bg-3)] text-[var(--t2)] flex items-center gap-1"
                    onClick={() => {
                      const sel = document.getElementById('add-widget-select') as HTMLSelectElement;
                      const val = sel.value as WidgetKey;
                      if (!val || !availableWidgets.includes(val)) return;
                      dispatch(addWidgetAction({ colId: col.id, widget: val }));
                      sel.value = '';
                    }}
                  >
                    {ci + 1}
                  </button>
                ))}
                <button
                  className="text-[10px] px-[8px] py-[4px] border border-[var(--bd)] bg-[var(--bg-3)] text-[var(--t2)] flex items-center gap-1"
                  onClick={() => {
                    const sel = document.getElementById('add-widget-select') as HTMLSelectElement;
                    const val = sel.value as WidgetKey;
                    if (!val || !availableWidgets.includes(val)) return;
                    dispatch(addColumnAction(val));
                    sel.value = '';
                  }}
                >
                  <Plus size={9} strokeWidth={2.5} />
                  col
                </button>
              </div>
            )}

            <span className="text-[9px] text-[var(--t4)] mono ml-2">drag splitters to resize</span>

            <button
              onClick={() => dispatch(resetToPreset())}
              className="ml-auto text-[10px] px-[10px] py-[4px] border border-[var(--bd)] bg-[var(--bg-3)] text-[var(--t4)]"
            >
              Reset
            </button>
          </>
        )}
      </div>

      {/* ── tiled layout ── */}
      <DashCtx.Provider value={dashData}>
      <ResizablePanelGroup
        orientation="horizontal"
        id="workspace-cols"
        className="flex-1 min-h-0"
        onLayoutChanged={(layout) => { dispatch(setColumnSizes(layout)); }}
      >
        {columns.map((col, ci) => (
          <React.Fragment key={col.id}>
            {ci > 0 && <ResizableHandle />}
            <ResizablePanel
              id={col.id}
              defaultSize={columnSizes[col.id] != null ? `${columnSizes[col.id]}%` : colSize}
              minSize="10%"
              className="flex flex-col min-h-0 min-w-0 overflow-hidden"
            >
              <ResizablePanelGroup
                orientation="vertical"
                id={`rows-${col.id}`}
                className="flex-1 min-h-0"
                onLayoutChanged={(layout) => { dispatch(setRowSizes({ colId: col.id, layout })); }}
              >
                {col.widgets.map((widget, wi) => (
                  <React.Fragment key={`${col.id}-${widget}`}>
                    {wi > 0 && <ResizableHandle />}
                    <ResizablePanel
                      id={`${col.id}-${widget}`}
                      defaultSize={rowSizes[col.id]?.[`${col.id}-${widget}`] != null ? `${rowSizes[col.id][`${col.id}-${widget}`]}%` : `${(100 / col.widgets.length).toFixed(1)}%`}
                      minSize="15%"
                      className="flex flex-col min-h-0 overflow-hidden"
                    >
                      {/* ── widget tile ── */}
                      <div className="flex flex-col h-full min-h-0 overflow-hidden">

                        {/* header */}
                        <div
                          className="panel-header shrink-0"
                          style={editing ? { borderBottom: '1px solid var(--blue-dim)' } : undefined}
                        >
                          <span className="section-title">{WIDGET_LABELS[widget]}</span>

                          {/* edit-mode controls */}
                          {editing && (
                            <div className="ml-auto flex items-center gap-1">
                              {ci > 0 && (
                                <button
                                  className="flex items-center justify-center w-5 h-5 text-[var(--t4)] hover:text-[var(--t1)] transition-colors"
                                  title="Move left"
                                  onClick={() => dispatch(moveWidgetAction({ colId: col.id, widget, direction: 'left' }))}
                                >
                                  <ArrowLeft size={10} strokeWidth={2} />
                                </button>
                              )}
                              {ci < columns.length - 1 && (
                                <button
                                  className="flex items-center justify-center w-5 h-5 text-[var(--t4)] hover:text-[var(--t1)] transition-colors"
                                  title="Move right"
                                  onClick={() => dispatch(moveWidgetAction({ colId: col.id, widget, direction: 'right' }))}
                                >
                                  <ArrowRight size={10} strokeWidth={2} />
                                </button>
                              )}
                              <button
                                className="flex items-center justify-center w-5 h-5 text-[var(--t4)] hover:text-[var(--danger)] transition-colors"
                                title="Remove widget"
                                onClick={() => dispatch(removeWidgetAction({ colId: col.id, widget }))}
                              >
                                <XIcon size={10} strokeWidth={2} />
                              </button>
                            </div>
                          )}

                          {/* view-mode link shortcuts */}
                          {!editing && widget === 'latest' && (
                            <Link href="/dashboard/feed" className="no-underline ml-auto flex items-center gap-1">
                              <span className="text-[9px] text-[var(--blue-l)] font-semibold">View All</span>
                              <ArrowRight size={10} strokeWidth={2} className="text-[var(--blue-l)]" />
                            </Link>
                          )}
                          {!editing && widget === 'actors' && (
                            <Link href="/dashboard/actors" className="no-underline ml-auto flex items-center gap-1">
                              <span className="text-[9px] text-[var(--blue-l)] font-semibold">Dossiers</span>
                              <ArrowRight size={10} strokeWidth={2} className="text-[var(--blue-l)]" />
                            </Link>
                          )}
                          {!editing && widget === 'signals' && (
                            <Link href="/dashboard/signals" className="no-underline ml-auto flex items-center gap-1">
                              <span className="text-[9px] text-[var(--blue-l)] font-semibold">All Signals</span>
                              <ArrowRight size={10} strokeWidth={2} className="text-[var(--blue-l)]" />
                            </Link>
                          )}
                          {/* map widget — link to full map page */}
                          {!editing && widget === 'map' && (
                            <Link href="/dashboard/map" className="no-underline ml-auto flex items-center gap-1">
                              <span className="text-[9px] text-[var(--blue-l)] font-semibold">Full Map</span>
                              <ArrowRight size={10} strokeWidth={2} className="text-[var(--blue-l)]" />
                            </Link>
                          )}

                          {!editing && widget === 'predictions' && (
                            <Link href="/dashboard/predictions" className="no-underline ml-auto flex items-center gap-1">
                              <span className="text-[9px] text-[var(--blue-l)] font-semibold">All Markets</span>
                              <ArrowRight size={10} strokeWidth={2} className="text-[var(--blue-l)]" />
                            </Link>
                          )}
                          {!editing && widget === 'brief' && (
                            <Link href="/dashboard/brief" className="no-underline ml-auto flex items-center gap-1">
                              <span className="text-[9px] text-[var(--blue-l)] font-semibold">Full Brief</span>
                              <ArrowRight size={10} strokeWidth={2} className="text-[var(--blue-l)]" />
                            </Link>
                          )}
                        </div>

                        {/* content */}
                        <div className="flex-1 min-h-0 overflow-hidden">
                          {widgetComponents()[widget]()}
                        </div>
                      </div>
                    </ResizablePanel>
                  </React.Fragment>
                ))}
              </ResizablePanelGroup>
            </ResizablePanel>
          </React.Fragment>
        ))}
      </ResizablePanelGroup>
      </DashCtx.Provider>
    </div>
  );
}
