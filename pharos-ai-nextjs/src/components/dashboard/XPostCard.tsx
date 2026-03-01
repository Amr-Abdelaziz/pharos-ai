'use client';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { type XPost, ACCOUNT_TYPE_STYLE, fmt } from '@/data/mockXPosts';

const IMAGE_BG: Record<string, string>    = {
  'strike-aerial-1':          '#0d1f0d',
  'osint-thermal-1':          '#1a0a0a',
  'osint-map-1':              '#0a0d1a',
  'iran-missile-1':           '#1a0a0a',
  'ukraine-column-geo-1':     '#0d150d',
  'ukraine-column-geo-2':     '#0d1510',
  'taiwan-radar-track-1':     '#0a0d1a',
  'uss-reagan-philippine-sea':'#040d18',
};
const IMAGE_LABEL: Record<string, string> = {
  'strike-aerial-1':          'Aerial · Northern Gaza',
  'osint-thermal-1':          'Thermal OSINT · strike signature',
  'osint-map-1':              'Geolocation · map overlay',
  'iran-missile-1':           'State media · IRGC launch',
  'ukraine-column-geo-1':     'Satellite · armor column',
  'ukraine-column-geo-2':     'Satellite · vehicle ID',
  'taiwan-radar-track-1':     'ADIZ track · PLAAF',
  'uss-reagan-philippine-sea':'USN · Philippine Sea',
};

const ACCT_C: Record<string, string> = {
  official:   '#3b82f6',
  journalist: '#a78bfa',
  analyst:    '#06b6d4',
  military:   '#ef4444',
  government: '#22c55e',
};

function ago(ts: string) {
  const ms = Date.now() - new Date(ts).getTime();
  if (ms < 3600000) return `${Math.round(ms / 60000)}m`;
  if (ms < 86400000) return `${Math.round(ms / 3600000)}h`;
  return `${Math.round(ms / 86400000)}d`;
}

interface Props { post: XPost; compact?: boolean }

export default function XPostCard({ post, compact }: Props) {
  const isBreaking = post.significance === 'BREAKING';
  const ac = ACCT_C[post.accountType] ?? '#4e6d87';

  return (
    <div style={{
      background: isBreaking ? 'rgba(239,68,68,0.04)' : 'var(--p1)',
      border: `1px solid ${isBreaking ? 'rgba(239,68,68,0.18)' : 'var(--bs)'}`,
      borderLeft: `3px solid ${isBreaking ? 'var(--crit)' : 'var(--b)'}`,
      marginBottom: 6,
    }}>
      {isBreaking && (
        <div style={{ padding: '3px 10px', background: 'var(--crit)', display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'white' }} />
          <span style={{ fontSize: 8, color: 'white', fontWeight: 700, letterSpacing: '0.08em', fontFamily: 'system-ui' }}>BREAKING</span>
        </div>
      )}

      <div style={{ padding: compact ? '8px 10px' : '12px 14px' }}>
        {/* Header */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          {/* Avatar */}
          <div style={{
            width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
            background: post.avatarColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 9, fontWeight: 700, color: 'white', fontFamily: 'system-ui',
          }}>
            {post.avatar.slice(0, 2)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', marginBottom: 1 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--t1)', fontFamily: 'system-ui', lineHeight: 1 }}>{post.displayName}</span>
              {post.verified && <CheckCircle size={10} style={{ color: ac, flexShrink: 0 }} strokeWidth={2.5} />}
              <span style={{ marginLeft: 'auto', fontSize: 8, color: 'var(--t3)', fontFamily: 'SFMono-Regular, monospace', flexShrink: 0 }}>{ago(post.timestamp)}</span>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 8, color: 'var(--t3)', fontFamily: 'SFMono-Regular, monospace' }}>{post.handle}</span>
              <span style={{ fontSize: 8, padding: '1px 4px', background: ac + '18', color: ac, fontFamily: 'system-ui', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                {post.accountType}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <p style={{
          fontSize: compact ? 11 : 12,
          color: 'var(--t1)', lineHeight: 1.55,
          fontFamily: 'system-ui, sans-serif',
          marginBottom: 8, whiteSpace: 'pre-wrap',
          ...(compact ? { display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' } : {}),
        }}>
          {post.content}
        </p>

        {/* Images */}
        {!compact && post.images && post.images.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: post.images.length === 1 ? '1fr' : '1fr 1fr',
            gap: 3, marginBottom: 8,
          }}>
            {post.images.map(img => (
              <div key={img} style={{
                height: post.images!.length === 1 ? 140 : 80,
                background: IMAGE_BG[img] ?? '#060e1a',
                display: 'flex', alignItems: 'flex-end', padding: 6,
                position: 'relative', border: '1px solid var(--b)',
              }}>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.6))' }} />
                <span style={{ position: 'relative', fontSize: 9, color: 'rgba(255,255,255,0.5)', fontFamily: 'SFMono-Regular, monospace', lineHeight: 1.3 }}>
                  {IMAGE_LABEL[img] ?? img}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Video */}
        {!compact && post.videoThumb && (
          <div style={{ height: 100, background: 'var(--p2)', border: '1px solid var(--b)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8, position: 'relative' }}>
            <div style={{ width: 32, height: 32, border: '1px solid var(--b)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 0, height: 0, borderTop: '6px solid transparent', borderBottom: '6px solid transparent', borderLeft: '10px solid var(--t2)', marginLeft: 2 }} />
            </div>
            <span style={{ position: 'absolute', bottom: 6, left: 10, fontSize: 9, color: 'var(--t3)', fontFamily: 'SFMono-Regular, monospace' }}>VIDEO</span>
          </div>
        )}

        {/* Engagement */}
        <div style={{ display: 'flex', gap: 12, marginBottom: compact ? 0 : (post.pharosNote ? 8 : 0) }}>
          <Metric icon="♥" val={fmt(post.likes)} />
          <Metric icon="🔁" val={fmt(post.retweets)} />
          <Metric icon="👁" val={fmt(post.views)} />
        </div>

        {/* Pharos note */}
        {!compact && post.pharosNote && (
          <div style={{
            marginTop: 8, padding: '6px 8px',
            background: post.pharosNote.startsWith('⚠️') ? 'rgba(245,158,11,0.06)' : 'rgba(34,197,94,0.06)',
            border: `1px solid ${post.pharosNote.startsWith('⚠️') ? 'rgba(245,158,11,0.2)' : 'rgba(34,197,94,0.2)'}`,
            display: 'flex', gap: 6, alignItems: 'flex-start',
          }}>
            {post.pharosNote.startsWith('⚠️')
              ? <AlertTriangle size={10} style={{ color: 'var(--high)', flexShrink: 0, marginTop: 1 }} strokeWidth={2} />
              : <CheckCircle  size={10} style={{ color: 'var(--mon)',  flexShrink: 0, marginTop: 1 }} strokeWidth={2} />
            }
            <p style={{ fontSize: 10, color: 'var(--t2)', lineHeight: 1.5, fontFamily: 'system-ui, sans-serif' }}>
              <span style={{ fontSize: 8, fontWeight: 700, color: 'var(--t3)', letterSpacing: '0.05em', fontFamily: 'system-ui' }}>PHAROS · </span>
              {post.pharosNote.replace('⚠️ ', '')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({ icon, val }: { icon: string; val: string }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: 'var(--t3)', fontFamily: 'SFMono-Regular, monospace' }}>
      <span>{icon}</span> {val}
    </span>
  );
}
