'use client';

import { useState } from 'react';

import Link from 'next/link';

import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'pharos:browse-article-banner-dismissed';

function readDismissed(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(STORAGE_KEY) === '1';
}

export function BrowseArticleBanner() {
  const [isDismissed, setIsDismissed] = useState(readDismissed);

  function handleDismiss() {
    localStorage.setItem(STORAGE_KEY, '1');
    setIsDismissed(true);
  }

  if (isDismissed) return null;

  return (
    <div className="flex items-center justify-between gap-4 px-5 py-2 bg-black border-b border-[var(--bd)]">
      <p className="text-[11px] text-white/70 leading-snug">
        You are viewing public article pages.{' '}
        <Link
          href="/dashboard"
          className="no-underline text-[var(--blue-l)] hover:text-white transition-colors font-medium"
        >
          Open the dashboard
        </Link>{' '}
        for more detailed analysis.
      </p>

      <Button
        variant="ghost"
        size="icon-xs"
        onClick={handleDismiss}
        className="shrink-0 text-white/50 hover:text-white"
        aria-label="Dismiss banner"
      >
        <X className="size-3" />
      </Button>
    </div>
  );
}
