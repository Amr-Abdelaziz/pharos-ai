'use client';

import { useCallback, useState } from 'react';

import { usePathname } from 'next/navigation';

import { MenuIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet';

import { useIsMobile } from '@/shared/hooks/use-is-mobile';

import { BrowseArticleBanner } from './BrowseArticleBanner';
import { BrowseFooter } from './BrowseFooter';
import { BrowseNav } from './BrowseNav';
import { BrowseSidebar } from './BrowseSidebar';
import { CriticalTimeline } from './CriticalTimeline';

type Props = {
  children: React.ReactNode;
};

export function BrowseShell({ children }: Props) {
  const isMobile = useIsMobile(768);
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isLanding = pathname === '/browse';
  const isDetailPage = pathname.split('/').filter(Boolean).length >= 3;

  const handleNavigate = useCallback(() => setOpen(false), []);

  const hamburgerButton = isMobile && !isLanding ? (
    <Button
      variant="ghost"
      size="icon-xs"
      className="-ml-1"
      onClick={() => setOpen(true)}
      aria-label="Open navigation"
    >
      <MenuIcon className="size-4" />
    </Button>
  ) : null;

  return (
    <>
      <BrowseNav hamburgerSlot={hamburgerButton} />

      <div className="flex flex-1 min-h-0">
        {!isMobile && !isLanding && <BrowseSidebar />}

        {isMobile && (
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetContent
              side="left"
              showCloseButton={false}
              data-theme="auto"
              className="w-56 p-0 bg-[var(--bg-1)]"
            >
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <BrowseSidebar onNavigate={handleNavigate} />
            </SheetContent>
          </Sheet>
        )}

        <main className="flex-1 overflow-y-auto">
          {isDetailPage && <BrowseArticleBanner />}
          {children}
          {isLanding && <BrowseFooter />}
        </main>
        {!isMobile && !isLanding && <CriticalTimeline />}
      </div>
    </>
  );
}
