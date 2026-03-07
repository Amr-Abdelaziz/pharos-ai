'use client';
import { Suspense } from 'react';
import { Tweet } from 'react-tweet';
import { PharosView, EmbedSkeleton } from './PharosView';
import { ACCT, SIG_BORDER, xUrl } from './x-post-constants';
import type { XPost } from '@/types/domain';

type Props = { post: XPost; compact?: boolean };

export function XPostCard({ post, compact }: Props) {
  const acct       = ACCT[post.accountType] ?? ACCT.analyst;
  const border     = SIG_BORDER[post.significance] ?? SIG_BORDER.STANDARD;
  const postUrl    = xUrl(post.handle, post.tweetId);
  const hasEmbed   = !!post.tweetId && !compact;

  return (
    <div className="card mb-2" style={{ borderLeft: `3px solid ${border}` }}>

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
