'use client';
import { Suspense } from 'react';
import { AlertTriangle, CheckCircle, ExternalLink, Eye, Heart, Repeat2 } from 'lucide-react';
import { Tweet } from 'react-tweet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ago } from '@/lib/format';
import type { XPost } from '@/types/domain';
import { fmt } from '@/lib/format';

// ── Account type styles ───────────────────────────────────────────────────────
// Uses CSS tokens — no hex literals (CODEX §1.2)
const ACCT: Record<string, { bg: string; text: string; label: string }> = {
  military:   { bg: 'var(--danger-dim)',  text: 'var(--danger)',  label: 'MILITARY' },
  government: { bg: 'var(--success-dim)', text: 'var(--success)', label: 'GOVT'     },
  official:   { bg: 'var(--blue-dim)',    text: 'var(--blue-l)',  label: 'OFFICIAL' },
  journalist: { bg: 'var(--cyber-dim)',        text: 'var(--cyber)', label: 'PRESS' },
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

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Build the X post URL from handle + tweetId */
function xUrl(handle: string, tweetId?: string): string | null {
  if (!tweetId) return null;
  const bare = handle.replace(/^@/, '');
  return `https://x.com/${bare}/status/${tweetId}`;
}

type Props = { post: XPost; compact?: boolean };

export default function XPostCard({ post, compact }: Props) {
  const isBreaking = post.significance === 'BREAKING';
  const isHigh     = post.significance === 'HIGH';
  const acct       = ACCT[post.accountType] ?? ACCT.analyst;
  const border     = SIG_BORDER[post.significance] ?? SIG_BORDER.STANDARD;
  const postUrl    = xUrl(post.handle, post.tweetId);
  const hasEmbed   = !!post.tweetId && !compact;

  return (
    <div className="card mb-2" style={{ borderLeft: `3px solid ${border}` }}>

      {/* ── BREAKING banner ── */}
      {isBreaking && (
        <div className="flex items-center gap-2 px-3 py-[3px]" style={{ background: 'var(--danger)' }}>
          <div className="dot" style={{ background: 'white' }} />
          <span className="text-[9px] font-bold text-white tracking-[0.10em] uppercase">Breaking</span>
        </div>
      )}
      {isHigh && !isBreaking && (
        <div
          className="px-3 py-0.5 border-b"
          style={{ background: 'var(--warning-dim)', borderColor: 'var(--warning-bd)' }}
        >
          <span className="text-[9px] font-bold tracking-[0.08em] uppercase text-[var(--warning)]">
            High Significance
          </span>
        </div>
      )}

      {hasEmbed ? (
        /* ── Side-by-side: Original (left) | Pharos (right) ── */
        <div className="grid grid-cols-[1fr_1fr] min-h-0">
          {/* LEFT — Original embed */}
          <div
            data-theme="dark"
            className="border-r border-[var(--bd-s)] px-1 py-2 [&_>_div]:!my-0 overflow-hidden"
          >
            <div className="flex items-center gap-1 px-2 pb-1.5">
              <span className="mono text-[8px] text-[var(--t4)] tracking-[0.08em]">ORIGINAL</span>
            </div>
            <Suspense fallback={<EmbedSkeleton />}>
              <Tweet id={post.tweetId!} />
            </Suspense>
          </div>

          {/* RIGHT — Pharos intel view */}
          <div className="flex flex-col">
            <div className="flex items-center gap-1 px-3 py-1.5">
              <span className="mono text-[8px] text-[var(--blue-l)] tracking-[0.08em]">PHAROS INTEL</span>
            </div>
            <PharosView post={post} acct={acct} postUrl={postUrl} />
          </div>
        </div>
      ) : (
        /* ── Standard single-column view ── */
        <PharosView post={post} acct={acct} postUrl={postUrl} compact={compact} />
      )}
    </div>
  );
}

// ── Pharos intel view (reused in both layouts) ──────────────────────────────

function PharosView({
  post, acct, postUrl, compact,
}: {
  post: XPost;
  acct: { bg: string; text: string; label: string };
  postUrl: string | null;
  compact?: boolean;
}) {
  return (
    <>
      {/* ── HEADER ── */}
      <div className="card-header px-3 py-[9px]">
        <Avatar
          className="w-8 h-8 shrink-0"
          style={{ background: post.avatarColor }}
        >
          <AvatarFallback
            className="text-[10px] font-bold text-white rounded-full"
            style={{ background: post.avatarColor }}
          >
            {post.avatar.slice(0, 2)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-xs font-bold text-[var(--t1)] leading-none">{post.displayName}</span>
            {post.verified && (
              <CheckCircle size={11} strokeWidth={2.5} className="text-[var(--blue-l)] shrink-0" />
            )}
          </div>
          <span className="mono text-[var(--t4)]">{post.handle}</span>
        </div>

        <Badge
          variant="outline"
          className="text-[9px] px-[6px] py-0.5 rounded-sm shrink-0 border-transparent tracking-[0.05em]"
          style={{ background: acct.bg, color: acct.text }}
        >
          {acct.label}
        </Badge>

        <span className="mono text-[var(--t4)] shrink-0">{ago(post.timestamp)}</span>
      </div>

      {/* ── BODY ── */}
      <div className="card-body">
        <p
          className={`leading-snug whitespace-pre-wrap text-[var(--t1)]${compact ? ' line-clamp-3' : ''}`}
          style={{ fontSize: compact ? 11.5 : 12.5 }}
        >
          {post.content}
        </p>

        {/* Images */}
        {!compact && post.images && post.images.length > 0 && (
          <div
            className="mt-2.5 gap-[3px] grid"
            style={{ gridTemplateColumns: post.images.length === 1 ? '1fr' : '1fr 1fr' }}
          >
            {post.images.map((img: string) => (
              <div
                key={img}
                className="relative overflow-hidden flex items-end p-1.5 border border-[var(--bd)]"
                style={{
                  height: post.images!.length === 1 ? 130 : 80,
                  background: IMG_BG[img] ?? 'var(--bg-app)',
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[rgba(0,0,0,0.65)]" />
                <span className="label relative uppercase text-[rgba(255,255,255,0.55)]">
                  {IMG_LBL[img] ?? img}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Video placeholder */}
        {!compact && post.videoThumb && (
          <div
            className="flex items-center justify-center relative mt-3 h-[90px] border border-[var(--bd)] bg-[var(--bg-app)]"
          >
            <div className="w-9 h-9 flex items-center justify-center border border-[var(--bd)] bg-white/[0.06]">
              <div
                className="ml-[2px]"
                style={{
                  width: 0, height: 0,
                  borderTop: '7px solid transparent',
                  borderBottom: '7px solid transparent',
                  borderLeft: '12px solid var(--t3)',
                }}
              />
            </div>
            <span className="label absolute bottom-2 left-3">VIDEO</span>
          </div>
        )}
      </div>

      {/* ── FOOTER: engagement metrics ── */}
      <Separator className="bg-[var(--bd-s)]" />
      <div className="card-footer">
        <EngStat icon={<Heart   size={10} strokeWidth={1.5} />} val={fmt(post.likes)}    />
        <EngStat icon={<Repeat2 size={10} strokeWidth={1.5} />} val={fmt(post.retweets)} />
        <EngStat icon={<Eye     size={10} strokeWidth={1.5} />} val={fmt(post.views)}    />
        <div className="ml-auto">
          {postUrl ? (
            <a href={postUrl} target="_blank" rel="noopener noreferrer" title="View on 𝕏">
              <ExternalLink size={11} className="text-[var(--t4)] hover:text-[var(--blue-l)] transition-colors cursor-pointer" strokeWidth={1.5} />
            </a>
          ) : (
            <ExternalLink size={11} className="text-[var(--t4)] opacity-30" strokeWidth={1.5} />
          )}
        </div>
      </div>

      {/* ── PHAROS NOTE ── */}
      {!compact && post.pharosNote && (
        <PharosNote note={post.pharosNote} />
      )}
    </>
  );
}

// ── Private sub-components (< 30 lines each, only used here) ─────────────────

function EngStat({ icon, val }: { icon: React.ReactNode; val: string }) {
  return (
    <div className="flex items-center gap-1 text-[var(--t4)]">
      {icon}
      <span className="mono">{val}</span>
    </div>
  );
}

function EmbedSkeleton() {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="mono text-[10px] text-[var(--t4)]">Loading embed…</div>
    </div>
  );
}

function PharosNote({ note }: { note: string }) {
  const isWarning = note.startsWith('⚠️');
  const color     = isWarning ? 'var(--warning)' : 'var(--success)';
  const bg        = isWarning ? 'var(--warning-dim)' : 'var(--success-dim)';
  const border    = isWarning ? 'var(--warning-bd)' : 'var(--success-bd)';
  const text      = note.replace('⚠️ ', '');
  const Icon      = isWarning ? AlertTriangle : CheckCircle;

  return (
    <div
      className="mx-3 mb-2.5 px-[10px] py-2"
      style={{ background: bg, border: `1px solid ${border}`, borderLeft: `3px solid ${color}` }}
    >
      <div className="flex gap-[7px] items-start">
        <Icon size={11} strokeWidth={2} className="shrink-0 mt-px" style={{ color }} />
        <div>
          <div className="label mb-0.5">Pharos Analyst Note</div>
          <p className="text-[11.5px] text-[var(--t2)] leading-normal">{text}</p>
        </div>
      </div>
    </div>
  );
}
