'use client';
import Link from 'next/link';
import { TrendingUp, TrendingDown, Minus, ArrowRight, CheckCircle } from 'lucide-react';
import { CONFLICTS } from '@/data/mockConflicts';
import { EVENTS }   from '@/data/mockEvents';
import { X_POSTS }  from '@/data/mockXPosts';

/* ── Status colours (dark-theme overrides) ──────────────── */
const STATUS: Record<string, { dot: string; label: string; color: string }> = {
  CRITICAL:       { dot: '#ef4444', label: 'CRITICAL',      color: '#ef4444' },
  ESCALATING:     { dot: '#ef4444', label: 'ESCALATING',    color: '#ef4444' },
  ELEVATED:       { dot: '#3b82f6', label: 'ELEVATED',      color: '#3b82f6' },
  MONITORING:     { dot: '#22c55e', label: 'MONITORING',    color: '#22c55e' },
  'DE-ESCALATING':{ dot: '#22c55e', label: 'DE-ESCALATING', color: '#22c55e' },
};
const SEV_C: Record<string, string> = { CRITICAL: '#ef4444', HIGH: '#f59e0b', STANDARD: '#3b82f6' };

function fmt(ts: string) {
  const d = new Date(ts);
  return d.toISOString().slice(11, 16); // HH:MM
}
function fmtDate(ts: string) {
  return new Date(ts).toISOString().slice(0, 10);
}
function ago(ts: string) {
  const ms = Date.now() - new Date(ts).getTime();
  if (ms < 3600000)  return `${Math.round(ms / 60000)}m`;
  if (ms < 86400000) return `${Math.round(ms / 3600000)}h`;
  return `${Math.round(ms / 86400000)}d`;
}

export default function SituationRoom() {
  const criticalCount = EVENTS.filter(e => e.severity === 'CRITICAL').length;
  const highCount     = EVENTS.filter(e => e.severity === 'HIGH').length;
  const recentEvents  = [...EVENTS].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const breakingPosts = X_POSTS.filter(p => p.significance === 'BREAKING').slice(0, 3);
  const otherPosts    = X_POSTS.filter(p => p.significance !== 'BREAKING').slice(0, 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>

      {/* ── Threat level bar ─────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 24,
        padding: '0 20px', height: 32, flexShrink: 0,
        background: 'var(--p2)', borderBottom: '1px solid var(--b)',
      }}>
        <span className="lbl" style={{ color: 'var(--crit)' }}>THREAT ASSESSMENT: CRITICAL</span>
        <div style={{ display: 'flex', gap: 2 }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} style={{ width: 14, height: 4, background: i < 9 ? 'var(--crit)' : 'var(--b)' }} />
          ))}
        </div>
        <span style={{ fontSize: 10, color: 'var(--t2)', fontFamily: 'SFMono-Regular, monospace' }}>
          {CONFLICTS.length} CONFLICT ZONES · {criticalCount} CRITICAL · {highCount} HIGH
        </span>
        <span style={{ marginLeft: 'auto', fontFamily: 'SFMono-Regular, monospace', fontSize: 10, color: 'var(--t3)' }}>
          2026-03-01 13:42 UTC
        </span>
      </div>

      {/* ── Three-pane workspace ─────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>

        {/* ── CONFLICT MATRIX ─────── 400px ──── */}
        <div style={{ width: 400, minWidth: 400, flexShrink: 0, borderRight: '1px solid var(--b)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="pane-hdr">
            <span className="hd">Conflict Matrix</span>
            <span className="lbl" style={{ marginLeft: 'auto' }}>{CONFLICTS.length} zones</span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {CONFLICTS.map((c, i) => {
              const st = STATUS[c.status] ?? STATUS.MONITORING;
              const isLast = i === CONFLICTS.length - 1;
              return (
                <div key={c.id} style={{ borderBottom: isLast ? 'none' : '1px solid var(--bs)' }}>
                  {/* Row header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px 6px' }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: st.dot, flexShrink: 0 }} />
                    <Link href={`/dashboard/conflicts/${c.id}`} style={{ textDecoration: 'none', flex: 1 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)', fontFamily: 'system-ui, sans-serif', cursor: 'pointer' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--acc)'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--t1)'}
                      >
                        {c.shortName.toUpperCase()}
                      </span>
                    </Link>
                    {c.trend === 'UP' && <TrendingUp size={11} style={{ color: '#ef4444' }} strokeWidth={2} />}
                    {c.trend === 'DOWN' && <TrendingDown size={11} style={{ color: '#22c55e' }} strokeWidth={2} />}
                    {c.trend === 'STABLE' && <Minus size={11} style={{ color: 'var(--t2)' }} strokeWidth={2} />}
                    <span style={{ fontSize: 9, fontWeight: 700, color: st.color, fontFamily: 'system-ui, sans-serif', letterSpacing: '0.06em' }}>
                      {st.label}
                    </span>
                  </div>

                  {/* Region */}
                  <div style={{ padding: '0 14px 6px 31px' }}>
                    <span className="mono" style={{ fontSize: 10, color: 'var(--t3)' }}>{c.region}</span>
                  </div>

                  {/* Escalation bar */}
                  <div style={{ padding: '0 14px 6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="esc-bar" style={{ flex: 1 }}>
                        <div className="esc-bar-fill" style={{ width: `${c.escalationScore}%`, background: st.dot }} />
                      </div>
                      <span className="mono" style={{ fontSize: 10, color: st.color, minWidth: 30, textAlign: 'right' }}>{c.escalationScore}%</span>
                    </div>
                  </div>

                  {/* Counts */}
                  <div style={{ display: 'flex', gap: 16, padding: '0 14px 6px' }}>
                    <CountBit val={c.criticalToday} label="CRIT" color="#ef4444" />
                    <CountBit val={c.highToday}     label="HIGH" color="#f59e0b" />
                    <CountBit val={c.standardToday} label="STD"  color="#3b82f6" />
                  </div>

                  {/* CTA row */}
                  <div style={{ display: 'flex', gap: 6, padding: '0 14px 10px' }}>
                    <NavBtn href={`/dashboard/feed?conflict=${c.id}`} label="INTEL FEED" />
                    <NavBtn href={`/dashboard/conflicts/${c.id}`}     label="FULL BRIEF" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── LIVE EVENT FEED ─────── fills ──── */}
        <div style={{ flex: 1, minWidth: 0, borderRight: '1px solid var(--b)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="pane-hdr">
            <span className="hd">Live Event Feed</span>
            <span className="lbl" style={{ marginLeft: 'auto' }}>{recentEvents.length} events · sorted by time</span>
          </div>

          {/* Column headers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '52px 70px 50px 1fr 40px 30px',
            gap: 0, padding: '5px 14px',
            borderBottom: '1px solid var(--b)',
            background: 'var(--p2)',
          }}>
            {['TIME', 'SEV', 'TYPE', 'TITLE', 'SRC', ''].map(h => (
              <span key={h} className="lbl" style={{ fontSize: 8 }}>{h}</span>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {recentEvents.map((evt, i) => {
              const isLast = i === recentEvents.length - 1;
              const sevC   = SEV_C[evt.severity] ?? '#3b82f6';
              const confl  = CONFLICTS.find(c => c.id === evt.conflictId);
              return (
                <Link key={evt.id} href={`/dashboard/feed?event=${evt.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '52px 70px 50px 1fr 40px 30px',
                    gap: 0, padding: '6px 14px',
                    borderBottom: isLast ? 'none' : '1px solid var(--bs)',
                    cursor: 'pointer', transition: 'background 0.08s',
                  }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--p3)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    <span className="mono" style={{ fontSize: 10, color: 'var(--t3)', paddingRight: 8 }}>{fmt(evt.timestamp)}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: sevC, letterSpacing: '0.06em', fontFamily: 'system-ui, sans-serif' }}>{evt.severity}</span>
                    <span className="lbl" style={{ fontSize: 8, color: 'var(--t3)' }}>{evt.type}</span>
                    <div style={{ overflow: 'hidden' }}>
                      <p style={{ fontSize: 11.5, color: 'var(--t1)', fontFamily: 'system-ui, sans-serif', lineHeight: 1.35, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 1 }}>
                        {evt.title}
                      </p>
                      {confl && (
                        <span className="mono" style={{ fontSize: 9, color: 'var(--t3)' }}>{confl.shortName}</span>
                      )}
                    </div>
                    <span className="mono" style={{ fontSize: 10, color: 'var(--t3)', textAlign: 'right', paddingRight: 8 }}>{evt.sources.length}</span>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
                      {evt.verified && <CheckCircle size={10} style={{ color: '#22c55e', marginTop: 1 }} strokeWidth={2} />}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── X FIELD SIGNALS ─────── 320px ──── */}
        <div style={{ width: 300, minWidth: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="pane-hdr">
            <span style={{ fontSize: 13, color: 'var(--t1)', lineHeight: 1 }}>𝕏</span>
            <span className="hd" style={{ marginLeft: 2 }}>Field Signals</span>
            <span className="lbl" style={{ marginLeft: 'auto' }}>Curated</span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
            {/* Breaking posts */}
            {breakingPosts.map(post => (
              <XRow key={post.id} post={post} />
            ))}

            <div style={{ height: 1, background: 'var(--b)', margin: '8px 0' }} />

            {/* Other posts */}
            {otherPosts.map(post => (
              <XRow key={post.id} post={post} />
            ))}
          </div>

          <div style={{ padding: '8px 10px', borderTop: '1px solid var(--b)' }}>
            <Link href="/dashboard/feed" style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '6px', border: '1px solid var(--b)', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--p3)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
              >
                <span className="lbl" style={{ color: 'var(--acc)' }}>View All Signals</span>
                <ArrowRight size={10} strokeWidth={2} style={{ color: 'var(--acc)' }} />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function CountBit({ val, label, color }: { val: number; label: string; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span className="mono" style={{ fontSize: 13, color, lineHeight: 1 }}>{val}</span>
      <span className="lbl" style={{ fontSize: 8 }}>{label}</span>
    </div>
  );
}

function NavBtn({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div style={{
        padding: '3px 10px',
        border: '1px solid var(--b)',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 4,
      }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--p3)'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
      >
        <span className="lbl" style={{ fontSize: 8, color: 'var(--acc)' }}>{label}</span>
        <ArrowRight size={9} strokeWidth={2} style={{ color: 'var(--acc)' }} />
      </div>
    </Link>
  );
}

type XSig = { id: string; handle: string; displayName: string; avatarColor: string; avatar: string; accountType: string; significance: string; content: string; likes: number; retweets: number; views: number; timestamp: string; pharosNote?: string };
function XRow({ post }: { post: XSig }) {
  const isBreaking = post.significance === 'BREAKING';
  const ACCT: Record<string, string> = { official: '#3b82f6', journalist: '#a78bfa', analyst: '#06b6d4', military: '#ef4444', government: '#22c55e' };
  const acctColor = ACCT[post.accountType] ?? 'var(--t2)';
  function fmtN(n: number) { if (n >= 1000000) return (n/1000000).toFixed(1)+'M'; if (n>=1000) return (n/1000).toFixed(1)+'K'; return String(n); }
  const age = (() => { const ms = Date.now() - new Date(post.timestamp).getTime(); if (ms < 3600000) return Math.round(ms/60000)+'m'; if (ms < 86400000) return Math.round(ms/3600000)+'h'; return Math.round(ms/86400000)+'d'; })();

  return (
    <div style={{
      padding: '8px 10px',
      marginBottom: 5,
      background: isBreaking ? 'rgba(239,68,68,0.05)' : 'var(--p1)',
      border: `1px solid ${isBreaking ? 'rgba(239,68,68,0.2)' : 'var(--bs)'}`,
      borderLeft: `3px solid ${isBreaking ? 'var(--crit)' : 'var(--b)'}`,
    }}>
      {isBreaking && (
        <div style={{ marginBottom: 5 }}>
          <span className="lbl" style={{ fontSize: 8, color: 'var(--crit)' }}>● BREAKING</span>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <div style={{ width: 20, height: 20, borderRadius: '50%', background: post.avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: 'white', fontWeight: 700, fontFamily: 'system-ui', flexShrink: 0 }}>
          {post.avatar.slice(0, 2)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--t1)', fontFamily: 'system-ui', lineHeight: 1 }}>{post.displayName}</span>
            <span style={{ fontSize: 8, padding: '1px 4px', background: acctColor + '22', color: acctColor, fontFamily: 'system-ui', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              {post.accountType}
            </span>
          </div>
          <span className="mono" style={{ fontSize: 9, color: 'var(--t3)' }}>{post.handle}</span>
        </div>
        <span className="mono" style={{ fontSize: 9, color: 'var(--t3)', flexShrink: 0 }}>{age}</span>
      </div>
      <p style={{ fontSize: 11, color: 'var(--t1)', lineHeight: 1.45, fontFamily: 'system-ui, sans-serif', marginBottom: 5,
        display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {post.content}
      </p>
      <div style={{ display: 'flex', gap: 10 }}>
        <Eng icon="♥" val={fmtN(post.likes)} />
        <Eng icon="🔁" val={fmtN(post.retweets)} />
        <Eng icon="👁" val={fmtN(post.views)} />
      </div>
    </div>
  );
}
function Eng({ icon, val }: { icon: string; val: string }) {
  return <span className="mono" style={{ fontSize: 9, color: 'var(--t3)' }}>{icon} {val}</span>;
}
