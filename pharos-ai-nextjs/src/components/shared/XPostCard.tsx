'use client';
import { AlertTriangle, CheckCircle, ExternalLink, Eye, Heart, Repeat2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ago } from '@/lib/format';
import { type XPost, fmt } from '@/data/iranXPosts';

// ── Account type styles ───────────────────────────────────────────────────────
// Uses CSS tokens — no hex literals (CODEX §1.2)
const ACCT: Record<string, { bg: string; text: string; label: string }> = {
  military:   { bg: 'var(--danger-dim)',  text: 'var(--danger)',  label: 'MILITARY' },
  government: { bg: 'var(--success-dim)', text: 'var(--success)', label: 'GOVT'     },
  official:   { bg: 'var(--blue-dim)',    text: 'var(--blue-l)',  label: 'OFFICIAL' },
  journalist: { bg: 'rgba(162,139,224,0.15)', text: 'var(--cyber)', label: 'PRESS' },
  analyst:    { bg: 'var(--info-dim)',    text: 'var(--info)',    label: 'ANALYST'  },
};

// ── Left border by significance ───────────────────────────────────────────────
const SIG_BORDER: Record<string, string> = {
  BREAKING: 'var(--danger)',
  HIGH:     'var(--warning)',
  STANDARD: 'var(--bd)',
};

// ── Image placeholder backgrounds (unique dark tints, no token equivalent) ───
const IMG_BG: Record<string, string> = {
  'strike-aerial-1':           '#0e1a0e',
  'osint-thermal-1':           '#1a0e0e',
  'osint-map-1':               '#0e0e1a',
  'iran-missile-1':            '#1a0e0e',
  'ukraine-column-geo-1':      '#0e140e',
  'ukraine-column-geo-2':      '#0e1410',
  'taiwan-radar-track-1':      '#0e0e1a',
  'uss-reagan-philippine-sea': '#06101a',
};
const IMG_LBL: Record<string, string> = {
  'strike-aerial-1':           'AERIAL · N.GAZA',
  'osint-thermal-1':           'THERMAL · STRIKE SIG.',
  'osint-map-1':               'GEOLOC · MAP OVERLAY',
  'iran-missile-1':            'STATE MEDIA · IRGC LAUNCH',
  'ukraine-column-geo-1':      'SAT · ARMOR COLUMN',
  'ukraine-column-geo-2':      'SAT · VEHICLE ID',
  'taiwan-radar-track-1':      'ADIZ · PLAAF TRACK',
  'uss-reagan-philippine-sea': 'USN · PHILIPPINE SEA',
};

type Props = { post: XPost; compact?: boolean };

export default function XPostCard({ post, compact }: Props) {
  const isBreaking = post.significance === 'BREAKING';
  const isHigh     = post.significance === 'HIGH';
  const acct       = ACCT[post.accountType] ?? ACCT.analyst;
  const border     = SIG_BORDER[post.significance] ?? SIG_BORDER.STANDARD;

  return (
    <div className="card" style={{ borderLeft: `3px solid ${border}`, marginBottom: 8 }}>

      {/* ── BREAKING banner ── */}
      {isBreaking && (
        <div className="flex items-center gap-2" style={{ padding: '3px 12px', background: 'var(--danger)' }}>
          <div className="dot" style={{ background: 'white' }} />
          <span style={{ fontSize: 9, fontWeight: 700, color: 'white', letterSpacing: '0.10em', textTransform: 'uppercase' }}>Breaking</span>
        </div>
      )}
      {isHigh && !isBreaking && (
        <div style={{ padding: '2px 12px', background: 'var(--warning-dim)', borderBottom: '1px solid rgba(236,154,60,0.2)' }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--warning)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>High Significance</span>
        </div>
      )}

      {/* ── HEADER ── */}
      <div className="card-header" style={{ padding: '9px 12px' }}>
        <Avatar style={{ width: 32, height: 32, flexShrink: 0, background: post.avatarColor }}>
          <AvatarFallback style={{ background: post.avatarColor, fontSize: 10, fontWeight: 700, color: 'white', borderRadius: '50%' }}>
            {post.avatar.slice(0, 2)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)', lineHeight: 1 }}>{post.displayName}</span>
            {post.verified && <CheckCircle size={11} strokeWidth={2.5} style={{ color: 'var(--blue-l)', flexShrink: 0 }} />}
          </div>
          <span className="mono" style={{ color: 'var(--t4)' }}>{post.handle}</span>
        </div>

        <Badge variant="outline" style={{ fontSize: 9, padding: '2px 6px', background: acct.bg, color: acct.text, borderColor: 'transparent', letterSpacing: '0.05em', flexShrink: 0, borderRadius: 2 }}>
          {acct.label}
        </Badge>

        <span className="mono" style={{ color: 'var(--t4)', flexShrink: 0 }}>{ago(post.timestamp)}</span>
      </div>

      {/* ── BODY ── */}
      <div className="card-body">
        <p style={{
          fontSize: compact ? 11.5 : 12.5,
          color: 'var(--t1)', lineHeight: 1.6, whiteSpace: 'pre-wrap',
          ...(compact ? { display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' } : {}),
        }}>
          {post.content}
        </p>

        {/* Images */}
        {!compact && post.images && post.images.length > 0 && (
          <div style={{ display: 'grid', gap: 3, marginTop: 10, gridTemplateColumns: post.images.length === 1 ? '1fr' : '1fr 1fr' }}>
            {post.images.map((img: string) => (
              <div
                key={img}
                className="relative overflow-hidden flex items-end p-1.5"
                style={{ height: post.images!.length === 1 ? 130 : 80, background: IMG_BG[img] ?? 'var(--bg-app)', border: '1px solid var(--bd)' }}
              >
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.65))' }} />
                <span className="label relative" style={{ color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase' }}>
                  {IMG_LBL[img] ?? img}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Video placeholder */}
        {!compact && post.videoThumb && (
          <div className="flex items-center justify-center relative mt-3" style={{ height: 90, background: 'var(--bg-app)', border: '1px solid var(--bd)' }}>
            <div className="flex items-center justify-center" style={{ width: 36, height: 36, border: '1px solid var(--bd)', background: 'rgba(255,255,255,0.06)' }}>
              <div style={{ width: 0, height: 0, borderTop: '7px solid transparent', borderBottom: '7px solid transparent', borderLeft: '12px solid var(--t3)', marginLeft: 2 }} />
            </div>
            <span className="label absolute bottom-2 left-3">VIDEO</span>
          </div>
        )}
      </div>

      {/* ── FOOTER: engagement metrics ── */}
      <Separator style={{ background: 'var(--bd-s)' }} />
      <div className="card-footer">
        <EngStat icon={<Heart   size={10} strokeWidth={1.5} />} val={fmt(post.likes)}    />
        <EngStat icon={<Repeat2 size={10} strokeWidth={1.5} />} val={fmt(post.retweets)} />
        <EngStat icon={<Eye     size={10} strokeWidth={1.5} />} val={fmt(post.views)}    />
        <div className="ml-auto">
          <ExternalLink size={11} style={{ color: 'var(--t4)', cursor: 'pointer' }} strokeWidth={1.5} />
        </div>
      </div>

      {/* ── PHAROS NOTE ── */}
      {!compact && post.pharosNote && (
        <PharosNote note={post.pharosNote} />
      )}
    </div>
  );
}

// ── Private sub-components (< 30 lines each, only used here) ─────────────────

function EngStat({ icon, val }: { icon: React.ReactNode; val: string }) {
  return (
    <div className="flex items-center gap-1" style={{ color: 'var(--t4)' }}>
      {icon}
      <span className="mono">{val}</span>
    </div>
  );
}

function PharosNote({ note }: { note: string }) {
  const isWarning = note.startsWith('⚠️');
  const color     = isWarning ? 'var(--warning)' : 'var(--success)';
  const bg        = isWarning ? 'var(--warning-dim)' : 'var(--success-dim)';
  const border    = isWarning ? 'rgba(236,154,60,.25)' : 'rgba(35,162,109,.25)';
  const text      = note.replace('⚠️ ', '');
  const Icon      = isWarning ? AlertTriangle : CheckCircle;

  return (
    <div className="mx-3 mb-2.5" style={{ padding: '8px 10px', background: bg, border: `1px solid ${border}`, borderLeft: `3px solid ${color}` }}>
      <div style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}>
        <Icon size={11} strokeWidth={2} style={{ color, flexShrink: 0, marginTop: 1 }} />
        <div>
          <div className="label" style={{ marginBottom: 2 }}>Pharos Analyst Note</div>
          <p style={{ fontSize: 11.5, color: 'var(--t2)', lineHeight: 1.5 }}>{text}</p>
        </div>
      </div>
    </div>
  );
}
