'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function RouteScreenSkeleton() {
  return (
    <div className="flex flex-1 flex-col min-h-0 bg-[var(--bg-1)] p-3 gap-3">
      <Skeleton className="h-8 w-56 bg-[var(--bg-3)]" />
      <Skeleton className="h-10 w-full bg-[var(--bg-3)]" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 min-h-0">
        <Skeleton className="h-full min-h-[220px] bg-[var(--bg-3)]" />
        <Skeleton className="h-full min-h-[220px] bg-[var(--bg-3)]" />
      </div>
    </div>
  );
}

export function OverviewScreenSkeleton() {
  return (
    <div className="flex flex-1 flex-col min-h-0 bg-[var(--bg-1)]">
      <div className="h-9 border-b border-[var(--bd)] px-4 flex items-center gap-2">
        <Skeleton className="h-3 w-16 bg-[var(--bg-3)]" />
        <Skeleton className="h-3 w-24 bg-[var(--bg-3)]" />
        <Skeleton className="h-3 w-20 bg-[var(--bg-3)] ml-auto" />
      </div>
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2 p-2 min-h-0">
        <Skeleton className="h-full min-h-[180px] bg-[var(--bg-3)]" />
        <Skeleton className="h-full min-h-[180px] bg-[var(--bg-3)]" />
        <Skeleton className="h-full min-h-[180px] bg-[var(--bg-3)]" />
        <Skeleton className="h-full min-h-[180px] bg-[var(--bg-3)]" />
      </div>
    </div>
  );
}

export function ListDetailScreenSkeleton() {
  return (
    <div className="flex flex-1 min-h-0 bg-[var(--bg-1)]">
      <div className="hidden lg:flex w-[280px] border-r border-[var(--bd)] p-3 gap-2 flex-col">
        <Skeleton className="h-8 w-full bg-[var(--bg-3)]" />
        <Skeleton className="h-8 w-full bg-[var(--bg-3)]" />
        <Skeleton className="h-8 w-full bg-[var(--bg-3)]" />
      </div>
      <div className="flex-1 p-3 gap-2 flex flex-col">
        <Skeleton className="h-9 w-full bg-[var(--bg-3)]" />
        <Skeleton className="h-[72px] w-full bg-[var(--bg-3)]" />
        <Skeleton className="h-[72px] w-full bg-[var(--bg-3)]" />
        <Skeleton className="h-[72px] w-full bg-[var(--bg-3)]" />
      </div>
    </div>
  );
}

export function BriefScreenSkeleton() {
  return (
    <div className="flex flex-1 flex-col min-h-0 bg-[var(--bg-1)] p-4 gap-3">
      <Skeleton className="h-6 w-80 bg-[var(--bg-3)]" />
      <Skeleton className="h-24 w-full bg-[var(--bg-3)]" />
      <Skeleton className="h-20 w-full bg-[var(--bg-3)]" />
      <Skeleton className="h-20 w-full bg-[var(--bg-3)]" />
      <Skeleton className="h-20 w-full bg-[var(--bg-3)]" />
    </div>
  );
}

export function MapScreenSkeleton() {
  return (
    <div className="relative flex-1 min-h-0 bg-[var(--bg-app)]">
      <Skeleton className="absolute inset-0 bg-[var(--bg-3)]" />
      <div className="absolute top-3 left-3 flex flex-col gap-2">
        <Skeleton className="h-8 w-8 bg-[var(--bg-2)]" />
        <Skeleton className="h-8 w-8 bg-[var(--bg-2)]" />
      </div>
      <div className="absolute top-3 right-3 flex flex-col gap-2">
        <Skeleton className="h-8 w-8 bg-[var(--bg-2)]" />
        <Skeleton className="h-8 w-8 bg-[var(--bg-2)]" />
      </div>
      <div className="absolute bottom-3 left-3 right-3">
        <Skeleton className="h-16 w-full bg-[var(--bg-2)]" />
      </div>
    </div>
  );
}

export function MobileOverviewSkeleton() {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-[var(--bg-1)] safe-px py-3">
      <Skeleton className="h-24 w-full bg-[var(--bg-3)] mb-3" />
      <Skeleton className="h-14 w-full bg-[var(--bg-3)] mb-3" />
      <div className="grid grid-cols-4 gap-1 mb-3">
        <Skeleton className="h-14 bg-[var(--bg-3)]" />
        <Skeleton className="h-14 bg-[var(--bg-3)]" />
        <Skeleton className="h-14 bg-[var(--bg-3)]" />
        <Skeleton className="h-14 bg-[var(--bg-3)]" />
      </div>
      <Skeleton className="h-24 w-full bg-[var(--bg-3)] mb-2" />
      <Skeleton className="h-24 w-full bg-[var(--bg-3)] mb-2" />
      <Skeleton className="h-24 w-full bg-[var(--bg-3)]" />
    </div>
  );
}
