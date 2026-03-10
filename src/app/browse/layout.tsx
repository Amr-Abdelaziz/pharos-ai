import { BrowseShell } from '@/features/browse/components/BrowseShell';

export default function BrowseLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-theme="auto" className="h-screen flex flex-col bg-[var(--bg-app)]">
      <BrowseShell>{children}</BrowseShell>
    </div>
  );
}
