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
      style={{
        height: 44,
        background: 'var(--bg-app)',
        borderBottom: '1px solid var(--bd)',
        display: 'flex',
        alignItems: 'stretch',
        flexShrink: 0,
        zIndex: 50,
        // Make entire header draggable for Electron window movement
        WebkitAppRegion: 'drag',
      } as React.CSSProperties}
    >
      {/* ── Traffic light spacer (macOS hiddenInset — 80px) ── */}
      <div style={{ width: 80, flexShrink: 0 }} />

      {/* ── Wordmark ── */}
      <Link
        href="/dashboard"
        style={{
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '0 16px 0 4px',
          borderRight: '1px solid var(--bd)',
          flexShrink: 0,
          // Links must opt out of drag so they're clickable
          WebkitAppRegion: 'no-drag',
        } as React.CSSProperties}
      >
        <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', letterSpacing: '0.18em' }}>
          PHAROS
        </span>

        {/* Thin accent rule */}
        <div
          style={{
            width: 1,
            height: 16,
            background: 'var(--bd)',
          }}
        />

        <span className="mono" style={{ fontSize: 9, fontWeight: 700, color: 'var(--t4)', letterSpacing: '0.08em' }}>
          EPIC FURY
        </span>

        {/* ONGOING badge */}
        <div
          style={{
            padding: '2px 7px',
            background: 'var(--danger-dim)',
            border: '1px solid rgba(231,106,110,.35)',
          }}
        >
          <span
            style={{
              fontSize: 8,
              fontWeight: 700,
              color: 'var(--danger)',
              letterSpacing: '0.08em',
              fontFamily: 'system-ui',
            }}
          >
            ONGOING
          </span>
        </div>
      </Link>

      {/* ── Nav tabs ── */}
      <nav
        style={{
          display: 'flex',
          alignItems: 'stretch',
          height: '100%',
          flex: 1,
          // Nav items are clickable — opt out of drag
          WebkitAppRegion: 'no-drag',
        } as React.CSSProperties}
      >
        {NAV.map(item => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{ textDecoration: 'none', display: 'flex', alignItems: 'stretch' }}
            >
              <div className={`nav-item${active ? ' active' : ''}`}>{item.label}</div>
            </Link>
          );
        })}
      </nav>

      {/* ── Right side ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '0 18px',
          borderLeft: '1px solid var(--bd)',
          flexShrink: 0,
          WebkitAppRegion: 'no-drag',
        } as React.CSSProperties}
      >
        {/* LIVE indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div className="dot dot-live" />
          <span className="mono" style={{ fontSize: 10, fontWeight: 700, color: 'var(--danger)', letterSpacing: '0.06em' }}>
            LIVE
          </span>
        </div>

        {/* UTC clock */}
        <span className="mono" style={{ fontSize: 10, color: 'var(--t4)', letterSpacing: '0.02em' }}>
          2026-03-01 · UTC
        </span>

        {/* KIA badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '3px 9px',
            background: 'var(--danger-dim)',
            border: '1px solid rgba(231,106,110,.35)',
          }}
        >
          <div
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: 'var(--danger)',
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: 'var(--danger)',
              letterSpacing: '0.08em',
              fontFamily: 'system-ui',
            }}
          >
            3 US KIA
          </span>
        </div>
      </div>
    </header>
  );
}
