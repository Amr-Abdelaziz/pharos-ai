import './globals.css';

import { Header } from '@/components/layout/Header';
import { ViewportHeightSync } from '@/components/layout/ViewportHeightSync';
import { Toaster } from '@/components/ui/sonner';
import { ReduxProvider } from '@/store/ReduxProvider';
import { QueryProvider } from '@/lib/QueryProvider';

import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Pharos Intelligence',
  description: 'Geopolitical Intelligence Dashboard',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ReduxProvider>
          <QueryProvider>
            <ViewportHeightSync />
            <div className="flex flex-col min-h-0 overflow-hidden" style={{ height: 'var(--app-height)' }}>
              <Header />
              <div className="flex flex-1 min-h-0 overflow-hidden pb-[var(--safe-bottom)]">
                {children}
              </div>
            </div>
            <Toaster theme="dark" position="bottom-right" />
          </QueryProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
