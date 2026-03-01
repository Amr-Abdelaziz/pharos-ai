'use client';
import { use } from 'react';
import Link    from 'next/link';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { CONFLICTS }             from '@/data/mockConflicts';
import { EVENTS }                from '@/data/mockEvents';
import { ACTORS }                from '@/data/mockActors';
import { getPostsForConflict }   from '@/data/mockXPosts';
import XPostCard                 from '@/components/dashboard/XPostCard';

const SEV_C: Record<string, string>  = { CRITICAL: 'var(--crit)', HIGH: 'var(--high)', STANDARD: 'var(--elev)' };
const ACT_C: Record<string, string>  = { HIGH: 'var(--crit)', ELEVATED: 'var(--high)', MODERATE: 'var(--elev)', LOW: 'var(--t2)' };
const STATUS_C: Record<string, string> = { CRITICAL: 'var(--crit)', ESCALATING: 'var(--crit)', ELEVATED: 'var(--elev)', MONITORING: 'var(--mon)', 'DE-ESCALATING': 'var(--mon)' };

function fmtTs(ts: string) { return new Date(ts).toISOString().slice(11, 16); }
function ago(ts: string) {
  const ms = Date.now() - new Date(ts).getTime();
  if (ms < 3600000) return Math.round(ms/60000)+'m';
  return Math.round(ms/3600000)+'h';
}

export default function ConflictPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const conflict = CONFLICTS.find(c => c.id === id);

  if (!conflict) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span className="lbl" style={{ color: 'var(--t3)' }}>Conflict not found</span>
    </div>
  );

  const sc      = STATUS_C[conflict.status] ?? 'var(--t2)';
  const events  = EVENTS.filter(e => e.conflictId === id).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const actors  = ACTORS.filter(a => a.conflictIds.includes(id));
  const xPosts  = getPostsForConflict(id);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── Header ──────────────────────────────────── */}
      <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--b)', background: 'var(--p2)', flexShrink: 0 }}>
        <Link href="/dashboard" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
          <ArrowLeft size={11} strokeWidth={2} style={{ color: 'var(--t3)' }} />
          <span className="lbl" style={{ fontSize: 8, color: 'var(--t3)' }}>SITUATION ROOM</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div className="lbl" style={{ fontSize: 8, color: 'var(--t3)', marginBottom: 4 }}>
              CONFLICT ASSESSMENT // PHAROS INTELLIGENCE
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--t1)', fontFamily: 'system-ui, sans-serif', lineHeight: 1.1 }}>
                {conflict.name.toUpperCase()}
              </h1>
              <span style={{ fontSize: 8, padding: '2px 8px', border: `1px solid ${sc}`, color: sc, fontFamily: 'system-ui', fontWeight: 700, letterSpacing: '.06em' }}>
                {conflict.status}
              </span>
            </div>
            <span className="mono" style={{ fontSize: 10, color: 'var(--t3)' }}>{conflict.region}</span>
            <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
              {conflict.actors.map(a => (
                <span key={a} style={{ fontSize: 9, padding: '1px 7px', border: '1px solid var(--b)', color: 'var(--t3)', fontFamily: 'system-ui, sans-serif' }}>{a}</span>
              ))}
            </div>
          </div>

          {/* Metrics */}
          <div style={{ display: 'flex', gap: 20, flexShrink: 0 }}>
            {[
              { label: 'ESCALATION',  val: `${conflict.escalationScore}%`, color: sc },
              { label: 'CRITICAL',    val: String(conflict.criticalToday),  color: 'var(--crit)' },
              { label: 'HIGH',        val: String(conflict.highToday),      color: 'var(--high)' },
              { label: 'TOTAL EVT',   val: String(events.length),           color: 'var(--t2)' },
            ].map(m => (
              <div key={m.label} style={{ textAlign: 'right' }}>
                <div className="mono" style={{ fontSize: 22, color: m.color, lineHeight: 1 }}>{m.val}</div>
                <div className="lbl" style={{ fontSize: 8, marginTop: 2 }}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Escalation bar + CTAs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
          <div className="lbl" style={{ fontSize: 8, minWidth: 70 }}>ESCALATION</div>
          <div style={{ flex: 1, height: 4, background: 'var(--b)' }}>
            <div style={{ width: `${conflict.escalationScore}%`, height: '100%', background: sc }} />
          </div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <NavBtn href={`/dashboard/feed?conflict=${id}`} label="INTEL FEED" />
            <NavBtn href={`/dashboard/actors?conflict=${id}`} label="ACTORS" />
          </div>
        </div>
      </div>

      {/* ── Three columns ────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>

        {/* Event timeline */}
        <div style={{ flex: 1, borderRight: '1px solid var(--b)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="pane-hdr">
            <span className="hd">Event Timeline</span>
            <span className="lbl" style={{ marginLeft: 'auto' }}>{events.length}</span>
          </div>
          {/* Col headers */}
          <div style={{ display: 'grid', gridTemplateColumns: '44px 50px 1fr 30px', padding: '4px 12px', borderBottom: '1px solid var(--b)', background: 'var(--p2)' }}>
            {['TIME', 'SEV', 'EVENT', 'SRC'].map(h => <span key={h} className="lbl" style={{ fontSize: 8 }}>{h}</span>)}
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {events.map((evt, i) => {
              const sc = SEV_C[evt.severity] ?? 'var(--elev)';
              return (
                <Link key={evt.id} href={`/dashboard/feed?event=${evt.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    display: 'grid', gridTemplateColumns: '44px 50px 1fr 30px',
                    padding: '7px 12px', borderBottom: i < events.length - 1 ? '1px solid var(--bs)' : 'none',
                    cursor: 'pointer',
                  }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--p3)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    <span className="mono" style={{ fontSize: 9, color: 'var(--t3)', alignSelf: 'flex-start', paddingTop: 2 }}>{fmtTs(evt.timestamp)}</span>
                    <span style={{ fontSize: 8, fontWeight: 700, color: sc, letterSpacing: '.06em', fontFamily: 'system-ui', alignSelf: 'flex-start', paddingTop: 2 }}>{evt.severity.slice(0,4)}</span>
                    <div>
                      <p style={{ fontSize: 11.5, color: 'var(--t1)', fontFamily: 'system-ui, sans-serif', lineHeight: 1.3, marginBottom: 2 }}>{evt.title}</p>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <span className="lbl" style={{ fontSize: 8, color: 'var(--t3)' }}>{evt.type}</span>
                        {evt.verified && <CheckCircle size={8} style={{ color: 'var(--mon)' }} strokeWidth={2} />}
                      </div>
                    </div>
                    <span className="mono" style={{ fontSize: 10, color: 'var(--t3)', textAlign: 'right' }}>{evt.sources.length}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Actors */}
        <div style={{ width: 300, minWidth: 300, borderRight: '1px solid var(--b)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="pane-hdr">
            <span className="hd">Key Actors</span>
            <span className="lbl" style={{ marginLeft: 'auto' }}>{actors.length}</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {actors.map((actor, i) => {
              const ac  = ACT_C[actor.activityLevel] ?? 'var(--t2)';
              const stc: Record<string, string> = { AGGRESSIVE: 'var(--crit)', OPPOSING: 'var(--high)', NEUTRAL: 'var(--t2)', SUPPORTING: 'var(--mon)', DEFENSIVE: 'var(--elev)' };
              return (
                <Link key={actor.id} href={`/dashboard/actors?actor=${actor.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    padding: '10px 14px',
                    borderBottom: i < actors.length - 1 ? '1px solid var(--bs)' : 'none',
                    cursor: 'pointer', borderLeft: `3px solid ${ac}`,
                  }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--p3)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                      {actor.flag && <span style={{ fontSize: 16 }}>{actor.flag}</span>}
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)', fontFamily: 'system-ui', flex: 1 }}>{actor.name}</span>
                      <span style={{ fontSize: 8, padding: '1px 5px', border: `1px solid ${ac}`, color: ac, fontFamily: 'system-ui', fontWeight: 700 }}>{actor.activityLevel}</span>
                      <ArrowRight size={9} style={{ color: 'var(--t3)' }} strokeWidth={1.5} />
                    </div>
                    <p style={{ fontSize: 10.5, color: 'var(--t2)', fontFamily: 'system-ui', lineHeight: 1.4, fontStyle: 'italic', marginBottom: 6,
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      "{actor.saying.slice(0, 100)}…"
                    </p>
                    <div>
                      <span className="lbl" style={{ fontSize: 8, marginRight: 6 }}>DOING:</span>
                      <span style={{ fontSize: 10, color: 'var(--t2)', fontFamily: 'system-ui' }}>{actor.doing[0]}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                      <div style={{ flex: 1, height: 3, background: 'var(--b)', alignSelf: 'center' }}>
                        <div style={{ width: `${actor.activityScore}%`, height: '100%', background: ac }} />
                      </div>
                      <span className="mono" style={{ fontSize: 9, color: ac }}>{actor.activityScore}%</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* X posts */}
        <div style={{ width: 280, minWidth: 280, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="pane-hdr">
            <span style={{ fontSize: 13, color: 'var(--t1)', lineHeight: 1 }}>𝕏</span>
            <span className="hd" style={{ marginLeft: 2 }}>Field Signals</span>
            <span className="lbl" style={{ marginLeft: 'auto' }}>{xPosts.length}</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
            {xPosts.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center' }}>
                <span className="lbl" style={{ color: 'var(--t3)' }}>No signals</span>
              </div>
            ) : (
              xPosts.map(post => <XPostCard key={post.id} post={post} compact />)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function NavBtn({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 12px', border: '1px solid var(--b)', cursor: 'pointer' }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--p3)'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
      >
        <span className="lbl" style={{ fontSize: 8, color: 'var(--acc)' }}>{label}</span>
        <ArrowRight size={9} strokeWidth={1.5} style={{ color: 'var(--acc)' }} />
      </div>
    </Link>
  );
}
