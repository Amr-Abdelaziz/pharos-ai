'use client';
import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams }   from 'next/navigation';
import Link                  from 'next/link';
import { CheckCircle, FileText, ArrowRight } from 'lucide-react';
import { CONFLICTS }         from '@/data/mockConflicts';
import { EVENTS, SEV_STYLE, type Severity, type IntelEvent } from '@/data/mockEvents';
import { getPostsForEvent }  from '@/data/mockXPosts';
import XPostCard             from '@/components/dashboard/XPostCard';

const SEV: Record<string, string> = { CRITICAL: 'var(--crit)', HIGH: 'var(--high)', STANDARD: 'var(--elev)' };
const TIER_C: Record<number, string> = { 1: '#22c55e', 2: '#f59e0b', 3: '#4e6d87' };
const TIER_L: Record<number, string> = { 1: 'T1', 2: 'T2', 3: 'T3' };
const STANCE_C: Record<string, string> = { SUPPORTING: '#22c55e', OPPOSING: '#ef4444', NEUTRAL: '#4e6d87', UNKNOWN: '#27404f' };

function ts(t: string) {
  const d = new Date(t);
  return d.toISOString().slice(11, 16);
}
function ago(ts: string) {
  const ms = Date.now() - new Date(ts).getTime();
  if (ms < 3600000) return Math.round(ms/60000)+'m';
  if (ms < 86400000) return Math.round(ms/3600000)+'h';
  return Math.round(ms/86400000)+'d';
}
function groupByDate(events: IntelEvent[]) {
  const groups: Record<string, IntelEvent[]> = {};
  events.forEach(e => {
    const d = new Date(e.timestamp).toISOString().slice(0, 10);
    if (!groups[d]) groups[d] = [];
    groups[d].push(e);
  });
  return groups;
}

function IntelFeedInner() {
  const searchParams = useSearchParams();
  const initConflict = searchParams.get('conflict') ?? 'all';
  const initEvent    = searchParams.get('event');

  const [cfFilter, setCfFilter] = useState(initConflict);
  const [sevFilter, setSevFilter] = useState<Record<Severity, boolean>>({ CRITICAL: true, HIGH: true, STANDARD: true });
  const [verOnly,  setVerOnly]  = useState(false);
  const [selId,    setSelId]    = useState<string | null>(initEvent);
  const [tab,      setTab]      = useState<'report' | 'signals'>('report');

  useEffect(() => { if (initEvent) setSelId(initEvent); }, [initEvent]);

  const filtered = useMemo(() => EVENTS.filter(e => {
    if (cfFilter !== 'all' && e.conflictId !== cfFilter) return false;
    if (!sevFilter[e.severity]) return false;
    if (verOnly && !e.verified) return false;
    return true;
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()), [cfFilter, sevFilter, verOnly]);

  const grouped  = groupByDate(filtered);
  const selected = EVENTS.find(e => e.id === selId) ?? null;

  return (
    <div style={{ display: 'flex', flex: 1, minWidth: 0, overflow: 'hidden' }}>

      {/* ── FILTER RAIL ── 160px ── */}
      <div style={{ width: 160, minWidth: 160, flexShrink: 0, borderRight: '1px solid var(--b)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="pane-hdr">
          <span className="hd">Filters</span>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          <FilterBlock label="CONFLICT">
            <FRow active={cfFilter === 'all'} onClick={() => setCfFilter('all')} label="ALL" />
            {CONFLICTS.map(c => <FRow key={c.id} active={cfFilter === c.id} onClick={() => setCfFilter(c.id)} label={c.shortName} />)}
          </FilterBlock>

          <FilterBlock label="SEVERITY">
            {(['CRITICAL', 'HIGH', 'STANDARD'] as Severity[]).map(s => (
              <CRow key={s} label={s} color={SEV[s]} checked={sevFilter[s]} onChange={v => setSevFilter(p => ({ ...p, [s]: v }))} />
            ))}
          </FilterBlock>

          <FilterBlock label="VERIFIED">
            <CRow label="ONLY VERIFIED" color="var(--mon)" checked={verOnly} onChange={setVerOnly} />
          </FilterBlock>
        </div>

        <div style={{ padding: '8px 12px', borderTop: '1px solid var(--b)' }}>
          <span className="mono" style={{ fontSize: 9, color: 'var(--t3)' }}>{filtered.length} EVENTS</span>
        </div>
      </div>

      {/* ── EVENT LOG ── 300px ── */}
      <div style={{ width: 300, minWidth: 300, flexShrink: 0, borderRight: '1px solid var(--b)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="pane-hdr" style={{ justifyContent: 'space-between' }}>
          <span className="hd">{cfFilter === 'all' ? 'All Conflicts' : CONFLICTS.find(c => c.id === cfFilter)?.shortName}</span>
          <span className="lbl">{filtered.length}</span>
        </div>

        {/* Col headers */}
        <div style={{ display: 'grid', gridTemplateColumns: '40px 50px 1fr 24px', padding: '4px 12px', borderBottom: '1px solid var(--b)', background: 'var(--p2)' }}>
          {['TIME', 'SEV', 'TITLE', ''].map(h => <span key={h} className="lbl" style={{ fontSize: 8 }}>{h}</span>)}
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filtered.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center' }}>
              <span className="lbl">No results</span>
            </div>
          )}
          {Object.entries(grouped).map(([date, events]) => (
            <div key={date}>
              <div style={{ padding: '4px 12px', background: 'var(--p2)', borderBottom: '1px solid var(--b)' }}>
                <span className="mono" style={{ fontSize: 9, color: 'var(--t3)' }}>{date}</span>
              </div>
              {events.map(evt => {
                const isOn = selId === evt.id;
                const sc   = SEV[evt.severity] ?? 'var(--elev)';
                const xc   = getPostsForEvent(evt.id).length;
                return (
                  <button key={evt.id} onClick={() => { setSelId(isOn ? null : evt.id); setTab('report'); }}
                    className="row-btn"
                    style={{
                      display: 'grid', gridTemplateColumns: '40px 50px 1fr 24px',
                      padding: '6px 12px',
                      borderBottom: '1px solid var(--bs)',
                      borderLeft: `3px solid ${isOn ? sc : 'transparent'}`,
                      background: isOn ? 'var(--p4)' : 'transparent',
                    }}
                  >
                    <span className="mono" style={{ fontSize: 9, color: 'var(--t3)', alignSelf: 'center' }}>{ts(evt.timestamp)}</span>
                    <div style={{ alignSelf: 'center' }}>
                      <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '.06em', color: sc, fontFamily: 'system-ui' }}>{evt.severity.slice(0,4)}</span>
                    </div>
                    <div>
                      <p style={{ fontSize: 11, color: 'var(--t1)', lineHeight: 1.3, fontFamily: 'system-ui, sans-serif', textAlign: 'left',
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {evt.title}
                      </p>
                      <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
                        <span className="mono" style={{ fontSize: 8, color: 'var(--t3)' }}>{evt.sources.length}src</span>
                        {xc > 0 && <span className="mono" style={{ fontSize: 8, color: 'var(--t2)' }}>𝕏{xc}</span>}
                        {evt.verified && <CheckCircle size={8} style={{ color: '#22c55e' }} strokeWidth={2} />}
                      </div>
                    </div>
                    <ArrowRight size={9} style={{ color: 'var(--t3)', alignSelf: 'center' }} strokeWidth={1.5} />
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* ── DETAIL PANE ── fills ── */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {!selected ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <FileText size={32} style={{ color: 'var(--t3)' }} strokeWidth={1} />
            <span className="lbl" style={{ color: 'var(--t3)' }}>Select an event</span>
          </div>
        ) : (
          <EventDetail event={selected} tab={tab} setTab={setTab} />
        )}
      </div>
    </div>
  );
}

function EventDetail({ event, tab, setTab }: { event: IntelEvent; tab: 'report' | 'signals'; setTab: (t: 'report' | 'signals') => void }) {
  const sc      = SEV[event.severity] ?? 'var(--elev)';
  const conflict = CONFLICTS.find(c => c.id === event.conflictId);
  const xPosts   = getPostsForEvent(event.id);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Classification header */}
      <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--b)', background: 'var(--p2)', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '2px 8px', border: `1px solid ${sc}`, background: sc + '18' }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: sc }} />
            <span style={{ fontSize: 9, fontWeight: 700, color: sc, letterSpacing: '0.08em', fontFamily: 'system-ui' }}>{event.severity}</span>
          </div>
          <span className="lbl" style={{ color: 'var(--t3)', fontSize: 8 }}>{event.type}</span>
          {event.verified && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <CheckCircle size={9} style={{ color: 'var(--mon)' }} strokeWidth={2} />
              <span className="lbl" style={{ fontSize: 8, color: 'var(--mon)' }}>VERIFIED</span>
            </div>
          )}
          {conflict && (
            <Link href={`/dashboard/conflicts/${conflict.id}`} style={{ textDecoration: 'none', marginLeft: 'auto' }}>
              <span className="lbl" style={{ fontSize: 8, color: 'var(--acc)' }}>↗ {conflict.shortName}</span>
            </Link>
          )}
        </div>

        <h1 style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)', lineHeight: 1.25, marginBottom: 8, fontFamily: 'system-ui, sans-serif' }}>
          {event.title}
        </h1>

        <div style={{ display: 'flex', gap: 20 }}>
          <MetaChip label="TIMESTAMP" val={new Date(event.timestamp).toISOString().replace('T', ' ').slice(0, 19) + ' UTC'} />
          <MetaChip label="LOCATION"  val={event.location} />
          <MetaChip label="SOURCES"   val={String(event.sources.length)} />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--b)', flexShrink: 0, background: 'var(--p2)' }}>
        {(['report', 'signals'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className="row-btn" style={{
            padding: '8px 18px', width: 'auto',
            fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
            color: tab === t ? 'var(--t1)' : 'var(--t2)',
            borderBottom: tab === t ? '2px solid var(--acc)' : '2px solid transparent',
            background: tab === t ? 'var(--p1)' : 'transparent',
          }}>
            {t === 'signals' ? `𝕏 SIGNALS${xPosts.length > 0 ? ` (${xPosts.length})` : ''}` : 'INTEL REPORT'}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {tab === 'report' ? (
          <div style={{ padding: '20px 24px' }}>
            {/* Summary */}
            <Section label="EXECUTIVE SUMMARY">
              <div style={{ borderLeft: `3px solid ${sc}`, paddingLeft: 14 }}>
                <p style={{ fontSize: 13, color: 'var(--t1)', lineHeight: 1.7, fontFamily: 'system-ui, sans-serif' }}>{event.summary}</p>
              </div>
            </Section>

            {/* Full report */}
            <Section label="INTELLIGENCE REPORT">
              <div style={{ fontSize: 12.5, color: 'var(--t1)', lineHeight: 1.7, fontFamily: 'system-ui, sans-serif' }}>
                {event.fullContent.split('\n\n').map((p, i) => (
                  <p key={i} style={{ marginBottom: 12, color: i === 0 ? 'var(--t1)' : 'var(--t2)' }}>{p}</p>
                ))}
              </div>
            </Section>

            {/* Sources */}
            <Section label={`SOURCES (${event.sources.length})`}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {event.sources.map((src, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', border: '1px solid var(--b)' }}>
                    <span style={{ fontSize: 8, fontWeight: 700, padding: '1px 5px', background: TIER_C[src.tier] + '22', color: TIER_C[src.tier], fontFamily: 'system-ui', letterSpacing: '.05em' }}>
                      {TIER_L[src.tier]}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--t1)', fontFamily: 'system-ui', flex: 1 }}>{src.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 50, height: 3, background: 'var(--b)' }}>
                        <div style={{ width: `${src.reliability}%`, height: '100%', background: src.reliability > 90 ? '#22c55e' : src.reliability > 75 ? '#f59e0b' : '#ef4444' }} />
                      </div>
                      <span className="mono" style={{ fontSize: 9, color: 'var(--t3)', minWidth: 26 }}>{src.reliability}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {/* Actor responses */}
            {event.actorResponses.length > 0 && (
              <Section label="ACTOR RESPONSES">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {event.actorResponses.map((r, i) => {
                    const sc = STANCE_C[r.stance] ?? 'var(--t2)';
                    return (
                      <Link key={i} href={`/dashboard/actors?actor=${r.actorId}`} style={{ textDecoration: 'none' }}>
                        <div style={{ padding: '8px 12px', border: '1px solid var(--b)', borderLeft: `3px solid ${sc}`, cursor: 'pointer' }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--p3)'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                        >
                          <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--t1)', fontFamily: 'system-ui' }}>{r.actorName}</span>
                            <span style={{ fontSize: 8, padding: '1px 5px', background: sc + '18', color: sc, fontFamily: 'system-ui', fontWeight: 700, letterSpacing: '.05em' }}>{r.stance}</span>
                            <span className="lbl" style={{ fontSize: 8, marginLeft: 'auto', color: 'var(--t3)' }}>{r.type}</span>
                            <ArrowRight size={9} style={{ color: 'var(--t3)' }} strokeWidth={1.5} />
                          </div>
                          <p style={{ fontSize: 11.5, color: 'var(--t2)', fontFamily: 'system-ui', lineHeight: 1.5, fontStyle: 'italic' }}>"{r.statement}"</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </Section>
            )}
          </div>
        ) : (
          <div style={{ padding: '12px 16px' }}>
            {xPosts.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center' }}>
                <span style={{ fontSize: 20, color: 'var(--t3)' }}>𝕏</span>
                <p className="lbl" style={{ color: 'var(--t3)', marginTop: 8 }}>No signals indexed for this event</p>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 10 }}>
                  <span className="lbl" style={{ fontSize: 8 }}>{xPosts.length} POSTS · PHAROS-CURATED · CHRONOLOGICAL</span>
                </div>
                {xPosts.map(p => <XPostCard key={p.id} post={p} />)}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MetaChip({ label, val }: { label: string; val: string }) {
  return (
    <div>
      <div className="lbl" style={{ fontSize: 8, marginBottom: 1 }}>{label}</div>
      <span className="mono" style={{ fontSize: 10, color: 'var(--t1)' }}>{val}</span>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span className="lbl" style={{ fontSize: 8 }}>{label}</span>
        <div style={{ flex: 1, height: 1, background: 'var(--bs)' }} />
      </div>
      {children}
    </div>
  );
}

function FilterBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: '10px 0', borderBottom: '1px solid var(--bs)' }}>
      <div className="lbl" style={{ padding: '0 12px', marginBottom: 4, fontSize: 8 }}>{label}</div>
      {children}
    </div>
  );
}

function FRow({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} className="row-btn" style={{
      padding: '5px 12px',
      background: active ? 'var(--p4)' : 'transparent',
      borderLeft: `3px solid ${active ? 'var(--acc)' : 'transparent'}`,
    }}>
      <span style={{ fontSize: 10, fontWeight: active ? 700 : 400, color: active ? 'var(--t1)' : 'var(--t2)', fontFamily: 'system-ui, sans-serif' }}>
        {label}
      </span>
    </button>
  );
}

function CRow({ label, color, checked, onChange }: { label: string; color: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)} className="row-btn" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 12px' }}>
      <div style={{
        width: 11, height: 11, flexShrink: 0,
        border: `1px solid ${checked ? color : 'var(--b)'}`,
        background: checked ? color : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {checked && <div style={{ width: 5, height: 5, background: 'var(--p0)' }} />}
      </div>
      <span style={{ fontSize: 10, color: checked ? 'var(--t1)' : 'var(--t2)', fontFamily: 'system-ui, sans-serif' }}>{label}</span>
    </button>
  );
}

export default function IntelFeedPage() {
  return (
    <Suspense fallback={<div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span className="lbl">Loading…</span></div>}>
      <IntelFeedInner />
    </Suspense>
  );
}
