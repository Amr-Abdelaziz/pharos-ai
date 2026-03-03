import './globals.css';

import { Header } from '@/components/layout/Header';
import { Toaster } from '@/components/ui/sonner';
import { ReduxProvider } from '@/store/ReduxProvider';
import { QueryProvider } from '@/lib/QueryProvider';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pharos Intelligence',
  description: 'Geopolitical Intelligence Dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ReduxProvider>
          <QueryProvider>
            <div className="flex flex-col h-screen overflow-hidden">
              <Header />
              <div className="flex flex-1 min-h-0 overflow-hidden">
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
