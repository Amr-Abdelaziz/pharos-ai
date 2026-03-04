'use client';

import { SummaryBar } from '@/components/overview/SummaryBar';
import { WorkspaceDashboard } from '@/components/dashboard/WorkspaceDashboard';
import { useIsLandscapePhone } from '@/hooks/use-is-landscape-phone';
import { useLandscapeScrollEmitter } from '@/hooks/use-landscape-scroll-emitter';

export default function OverviewPage() {
  const isLandscapePhone = useIsLandscapePhone();
  const onLandscapeScroll = useLandscapeScrollEmitter(isLandscapePhone);

  return (
    <div
      className={`flex flex-col flex-1 min-h-0 bg-[var(--bg-1)] ${isLandscapePhone ? 'overflow-y-auto' : 'overflow-hidden'}`}
      onScroll={isLandscapePhone ? onLandscapeScroll : undefined}
    >
      <SummaryBar />
      <WorkspaceDashboard />
    </div>
  );
}
