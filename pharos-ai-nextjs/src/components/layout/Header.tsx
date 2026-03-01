'use client';
import Link           from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { label: 'OVERVIEW',    href: '/dashboard'              },
  { label: 'EVENTS',      href: '/dashboard/feed'         },
  { label: 'ACTORS',      href: '/dashboard/actors'       },
  { label: 'SIGNALS',     href: '/dashboard/signals'      },
  { label: 'BRIEF',       href: '/dashboard/brief'        },
  { label: 'MAP',         href: '/dashboard/map'          },
  { label: 'PREDICTIONS', href: '/dashboard/predictions'  },
];

export function Header() {
  const path = usePathname();
  const isActive = (href: string) =>
    href === '/dashboard' ? path === '/dashboard' : path.startsWith(href);

  return (
    <header
      className="h-11 bg-[var(--bg-app)] border-b border-[var(--bd)] flex items-stretch shrink-0 z-50"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* ── Traffic light spacer (macOS hiddenInset — 80px) ── */}
      <div className="w-20 shrink-0" />

      {/* ── Wordmark ── */}
      <Link
        href="/dashboard"
        className="no-underline flex items-center gap-2.5 pr-4 pl-1 border-r border-[var(--bd)] shrink-0"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <span className="mono text-[13px] font-bold text-[var(--t1)] tracking-[0.18em]">
          PHAROS
        </span>

        {/* Thin accent rule */}
        <div className="w-px h-4 bg-[var(--bd)]" />

        <span className="mono text-[9px] font-bold text-[var(--t4)] tracking-[0.08em]">
          EPIC FURY
        </span>

        {/* ONGOING badge */}
        <div
          className="px-[7px] py-0.5 bg-[var(--danger-dim)] border border-[var(--danger-bd)] rounded-sm"
        >
          <span className="text-[8px] font-bold text-[var(--danger)] tracking-[0.08em] uppercase">
            ONGOING
          </span>
        </div>
      </Link>

      {/* ── Nav tabs ── */}
      <nav
        className="flex items-stretch h-full flex-1"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        {NAV.map(item => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="no-underline flex items-stretch"
            >
              <div className={`nav-item${active ? ' active' : ''}`}>{item.label}</div>
            </Link>
          );
        })}
      </nav>

      {/* ── Right side ── */}
      <div
        className="flex items-center gap-3.5 px-[18px] border-l border-[var(--bd)] shrink-0"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        {/* LIVE indicator */}
        <div className="flex items-center gap-[5px]">
          <div className="dot dot-live" />
          <span className="mono text-[10px] font-bold text-[var(--danger)] tracking-[0.06em]">
            LIVE
          </span>
        </div>

        {/* UTC clock */}
        <span className="mono text-[10px] text-[var(--t4)] tracking-[0.02em]">
          2026-03-01 · UTC
        </span>

        {/* KIA badge */}
        <div
          className="flex items-center gap-[5px] px-[9px] py-[3px] bg-[var(--danger-dim)] border border-[var(--danger-bd)] rounded-sm"
        >
          <div className="w-[5px] h-[5px] rounded-full bg-[var(--danger)] shrink-0" />
          <span className="text-[9px] font-bold text-[var(--danger)] tracking-[0.08em] uppercase">
            3 US KIA
          </span>
        </div>
      </div>
    </header>
  );
}
