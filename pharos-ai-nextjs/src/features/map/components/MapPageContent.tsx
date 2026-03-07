'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef } from 'react';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { useIsLandscapePhone } from '@/shared/hooks/use-is-landscape-phone';
import { useMapPage } from '@/features/map/components/use-map-page';
import { MapScreenSkeleton } from '@/shared/components/loading/screen-skeletons';

const LandscapeMapLayout = dynamic(() => import('@/features/map/components/landscape/MapLayout').then(m => ({ default: m.LandscapeMapLayout })), { ssr: false });
const MobileMapLayout    = dynamic(() => import('@/features/map/components/mobile/MapLayout').then(m => ({ default: m.MobileMapLayout })),       { ssr: false });
const DesktopMapLayout   = dynamic(() => import('@/features/map/components/desktop/MapLayout').then(m => ({ default: m.DesktopMapLayout })),     { ssr: false });

export function FullMapPage({ embedded = false }: { embedded?: boolean }) {
  const isLandscapePhone = useIsLandscapePhone();
  const isMobile = useIsMobile(1024);
  const ctx = useMapPage({ isMobile: isMobile || isLandscapePhone });
  const mode = isLandscapePhone ? 'landscape' : (isMobile ? 'mobile' : 'desktop');
  const prevModeRef = useRef<string | null>(null);

  useEffect(() => {
    if (prevModeRef.current === null) {
      prevModeRef.current = mode;
      return;
    }
    if (prevModeRef.current !== mode) {
      ctx.setSelectedItem(null);
      if (mode === 'landscape') ctx.setSidebarOpen(false);
      prevModeRef.current = mode;
    }
  }, [mode, ctx]);

  if (ctx.isLoading) return <MapScreenSkeleton />;

  if (isLandscapePhone) return <LandscapeMapLayout ctx={ctx} embedded={embedded} />;
  if (isMobile) return <MobileMapLayout ctx={ctx} embedded={embedded} />;
  return <DesktopMapLayout ctx={ctx} embedded={embedded} />;
}
