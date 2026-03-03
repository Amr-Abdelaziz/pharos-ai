'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowRight, ArrowLeft, X as XIcon, Plus } from 'lucide-react';

import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { fmtDate, fmtTimeZ } from '@/lib/format';
import { CONFLICT } from '@/data/iranConflict';
import { EVENTS } from '@/data/iranEvents';
import { ACTORS, ACT_C, STA_C } from '@/data/iranActors';
import { X_POSTS } from '@/data/iranXPosts';
import XPostCard from '@/components/shared/XPostCard';
import Flag from '@/components/shared/Flag';
import { CasChip } from '@/app/dashboard/overview/CasChip';
import { DaySelector } from '@/components/shared/DaySelector';
import { getConflictForDay, getActorForDay, getEventsForDay, getPostsForDay } from '@/lib/day-filter';
import type { ConflictDay } from '@/types/domain';
import { CONFLICT_DAYS } from '@/types/domain';

const DashDayCtx = createContext<ConflictDay>(CONFLICT_DAYS[CONFLICT_DAYS.length - 1]);

const FullMapPage = dynamic(() => import('@/components/map/MapPageContent'),                           { ssr: false });

// ─── types ───────────────────────────────────────────────────────────────────

type WidgetKey = 'situation' | 'latest' | 'actors' | 'signals' | 'map' | 'keyfacts' | 'casualties' | 'commanders' | 'predictions' | 'brief';

type Column = {
  id: string;
  widgets: WidgetKey[];
};

type WorkspaceState = {
  columns: Column[];
};

// ─── defaults ────────────────────────────────────────────────────────────────

const DEFAULT_STATE: WorkspaceState = {
  columns: [
    { id: 'col-a', widgets: ['situation', 'latest'] },
    { id: 'col-b', widgets: ['actors', 'signals'] },
  ],
};

const ALL_WIDGET_KEYS: WidgetKey[] = [
  'situation', 'latest', 'actors', 'signals', 'map',
  'keyfacts', 'casualties', 'commanders', 'predictions', 'brief',
];

const STORAGE_KEY = 'pharos:workspace:v3';

// ─── widget meta ─────────────────────────────────────────────────────────────

const WIDGET_LABELS: Record<WidgetKey, string> = {
  situation:   'Situation Summary',
  latest:      'Latest Events',
  actors:      'Actor Positions',
  signals:     'Field Signals',
  map:         'Intel Map',
  keyfacts:    'Key Facts',
  casualties:  'Casualties',
  commanders:  'Commanders',
  predictions: 'Prediction Markets',
  brief:       'Daily Brief',
};

import { SEV_C } from '@/lib/severity-colors';
const SEV_CLS: Record<string, string> = {
  CRITICAL: 'sev sev-crit', HIGH: 'sev sev-high', STANDARD: 'sev sev-std',
};

// ─── individual widgets ──────────────────────────────────────────────────────

function SituationWidget() {
  const day = useContext(DashDayCtx);
  const snap = getConflictForDay(day);
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
          <p className="text-[11px] text-[var(--t2)] leading-snug">{CONFLICT.objectives.us}</p>
        </div>
        <div className="flex-1 px-3 py-2 bg-[var(--bg-2)] border border-[var(--bd)] [border-left:3px_solid_var(--info)]">
          <div className="label text-[8px] mb-1 text-[var(--info)]">ISRAELI OBJECTIVE</div>
          <p className="text-[11px] text-[var(--t2)] leading-snug">{CONFLICT.objectives.il}</p>
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
  const day = useContext(DashDayCtx);
  const events = useMemo(
    () => getEventsForDay(day).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 30),
    [day],
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
  const day = useContext(DashDayCtx);
  return (
    <div className="h-full overflow-y-auto">
      {ACTORS.map((actor, i) => {
        const snap = getActorForDay(actor, day);
        const actC = ACT_C[snap.activityLevel] ?? 'var(--t2)';
        const staC = STA_C[snap.stance] ?? 'var(--t2)';
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
  const day = useContext(DashDayCtx);
  const posts = useMemo(() => getPostsForDay(day).filter(p => p.significance === 'BREAKING').slice(0, 20), [day]);
  return (
    <div className="h-full overflow-y-auto p-[10px]">
      {posts.map(p => (
        <XPostCard key={p.id} post={p as import('@/data/iranXPosts').XPost} compact />
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
  const day = useContext(DashDayCtx);
  const snap = getConflictForDay(day);
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
  const day = useContext(DashDayCtx);
  const snap = getConflictForDay(day);
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
  const sides = [
    { label: 'US', color: 'var(--blue)',    names: CONFLICT.commanders.us },
    { label: 'IDF', color: 'var(--info)',   names: CONFLICT.commanders.il },
    { label: 'IRAN', color: 'var(--danger)', names: CONFLICT.commanders.ir },
  ];
  return (
    <div className="h-full overflow-y-auto px-[18px] py-[14px]">
      {sides.map(side => (
        <div key={side.label} className="mb-5">
          <div className="label text-[8px] font-bold mb-2 tracking-[0.12em]" style={{ color: side.color }}>{side.label}</div>
          {side.names.map((name, i) => (
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
import { assignGroup } from '@/data/predictionGroups';

function PredictionsWidget() {
  const [markets, setMarkets] = useState<PMType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/polymarket')
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
  const day = useContext(DashDayCtx);
  const snap = getConflictForDay(day);
  const dayEvents = getEventsForDay(day);
  const topEvents = useMemo(
    () => [...dayEvents].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 8),
    [dayEvents],
  );

  const critCount = dayEvents.filter(e => e.severity === 'CRITICAL').length;
  const highCount = dayEvents.filter(e => e.severity === 'HIGH').length;

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
            <p className="text-[10px] text-[var(--t2)] leading-snug">{CONFLICT.objectives.us}</p>
          </div>
          <div className="flex-1 px-3 py-2 bg-[var(--bg-2)] border border-[var(--bd)]" style={{ borderLeft: '3px solid var(--info)' }}>
            <div className="label text-[8px] mb-1 text-[var(--info)]">ISRAEL</div>
            <p className="text-[10px] text-[var(--t2)] leading-snug">{CONFLICT.objectives.il}</p>
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

// ─── storage ─────────────────────────────────────────────────────────────────

function load(): WorkspaceState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as WorkspaceState;
  } catch { /**/ }
  return DEFAULT_STATE;
}

function save(s: WorkspaceState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /**/ }
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function newColId() { return `col-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`; }

function allWidgets(state: WorkspaceState): WidgetKey[] {
  return state.columns.flatMap(c => c.widgets);
}

// ─── main ─────────────────────────────────────────────────────────────────────

export function WorkspaceDashboard() {
  const [editing, setEditing] = useState(false);
  const [state, setState] = useState<WorkspaceState>(DEFAULT_STATE);
  const [mounted, setMounted] = useState(false);
  const [dashDay, setDashDay] = useState<ConflictDay>(CONFLICT_DAYS[CONFLICT_DAYS.length - 1]);


  useEffect(() => {
    setState(load());
    setMounted(true);
  }, []);

  function update(next: WorkspaceState) {
    setState(next);
    save(next);
  }

  // All widgets not yet placed anywhere
  const usedWidgets = allWidgets(state);
  const availableWidgets = ALL_WIDGET_KEYS.filter(k => !usedWidgets.includes(k));

  // ── mutations ──

  function removeWidget(colId: string, widget: WidgetKey) {
    const next: WorkspaceState = {
      columns: state.columns
        .map(col => col.id !== colId ? col : { ...col, widgets: col.widgets.filter(w => w !== widget) })
        .filter(col => col.widgets.length > 0), // remove empty columns
    };
    update(next);
  }

  function addWidgetToColumn(colId: string, widget: WidgetKey) {
    const next: WorkspaceState = {
      columns: state.columns.map(col =>
        col.id !== colId ? col : { ...col, widgets: [...col.widgets, widget] },
      ),
    };
    update(next);
  }

  function addNewColumn(widget: WidgetKey) {
    const next: WorkspaceState = {
      columns: [...state.columns, { id: newColId(), widgets: [widget] }],
    };
    update(next);
  }

  function moveWidget(colId: string, widget: WidgetKey, direction: 'left' | 'right') {
    const ci = state.columns.findIndex(c => c.id === colId);
    const targetIndex = direction === 'left' ? ci - 1 : ci + 1;
    if (targetIndex < 0 || targetIndex >= state.columns.length) return;

    const next: WorkspaceState = {
      columns: state.columns.map((col, i) => {
        if (i === ci) return { ...col, widgets: col.widgets.filter(w => w !== widget) };
        if (i === targetIndex) return { ...col, widgets: [...col.widgets, widget] };
        return col;
      }).filter(col => col.widgets.length > 0),
    };
    update(next);
  }

  function reset() {
    update(DEFAULT_STATE);
  }

  if (!mounted) return null;

  const colSize = `${(100 / state.columns.length).toFixed(1)}%`;

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-[var(--bg-1)]">

      {/* ── toolbar ── */}
      <div className="shrink-0 flex items-center gap-2 px-3 py-[5px] border-b border-[var(--bd)] bg-[var(--bg-2)]">
        <button
          onClick={() => setEditing(v => !v)}
          className={`text-[10px] px-[10px] py-[4px] border font-semibold tracking-wide transition-colors ${
            editing
              ? 'border-[var(--blue)] bg-[var(--blue-dim)] text-[var(--blue-l)]'
              : 'border-[var(--bd)] bg-[var(--bg-3)] text-[var(--t3)]'
          }`}
        >
          {editing ? '✦ EDITING' : 'EDIT LAYOUT'}
        </button>

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
                {state.columns.map((col, ci) => (
                  <button
                    key={col.id}
                    className="text-[10px] px-[8px] py-[4px] border border-[var(--bd)] bg-[var(--bg-3)] text-[var(--t2)] flex items-center gap-1"
                    onClick={() => {
                      const sel = document.getElementById('add-widget-select') as HTMLSelectElement;
                      const val = sel.value as WidgetKey;
                      if (!val || !availableWidgets.includes(val)) return;
                      addWidgetToColumn(col.id, val);
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
                    addNewColumn(val);
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
              onClick={reset}
              className="ml-auto text-[10px] px-[10px] py-[4px] border border-[var(--bd)] bg-[var(--bg-3)] text-[var(--t4)]"
            >
              Reset
            </button>
          </>
        )}
      </div>

      {/* ── tiled layout ── */}
      <DashDayCtx.Provider value={dashDay}>
      <ResizablePanelGroup
        orientation="horizontal"
        id="workspace-cols"
        className="flex-1 min-h-0"
      >
        {state.columns.map((col, ci) => (
          <React.Fragment key={col.id}>
            {ci > 0 && <ResizableHandle />}
            <ResizablePanel
              id={col.id}
              defaultSize={colSize}
              minSize="10%"
              className="flex flex-col min-h-0 min-w-0 overflow-hidden"
            >
              <ResizablePanelGroup
                orientation="vertical"
                id={`rows-${col.id}`}
                className="flex-1 min-h-0"
              >
                {col.widgets.map((widget, wi) => (
                  <React.Fragment key={`${col.id}-${widget}`}>
                    {wi > 0 && <ResizableHandle />}
                    <ResizablePanel
                      id={`${col.id}-${widget}`}
                      defaultSize={`${(100 / col.widgets.length).toFixed(1)}%`}
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
                                  onClick={() => moveWidget(col.id, widget, 'left')}
                                >
                                  <ArrowLeft size={10} strokeWidth={2} />
                                </button>
                              )}
                              {ci < state.columns.length - 1 && (
                                <button
                                  className="flex items-center justify-center w-5 h-5 text-[var(--t4)] hover:text-[var(--t1)] transition-colors"
                                  title="Move right"
                                  onClick={() => moveWidget(col.id, widget, 'right')}
                                >
                                  <ArrowRight size={10} strokeWidth={2} />
                                </button>
                              )}
                              <button
                                className="flex items-center justify-center w-5 h-5 text-[var(--t4)] hover:text-[var(--danger)] transition-colors"
                                title="Remove widget"
                                onClick={() => removeWidget(col.id, widget)}
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
      </DashDayCtx.Provider>
    </div>
  );
}
