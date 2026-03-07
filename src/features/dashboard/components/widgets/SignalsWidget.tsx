'use client';

import { useContext, useMemo } from 'react';

import { XPostCard } from '@/shared/components/shared/XPostCard';

import { getPostsForDay } from '@/shared/lib/day-filter';

import type { XPost } from '@/types/domain';

import { DashCtx } from '../DashCtx';

export function SignalsWidget() {
  const { day, xPosts, allDays } = useContext(DashCtx);
  const posts = useMemo(
    () => getPostsForDay(xPosts, allDays, day).filter(p => p.significance === 'BREAKING').slice(0, 20),
    [xPosts, allDays, day],
  );
  return (
    <div className="h-full overflow-y-auto p-2.5">
      {posts.map(p => (
        <XPostCard key={p.id} post={p as XPost} compact />
      ))}
    </div>
  );
}
