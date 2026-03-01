'use client';
import Link       from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { label: 'SITUATION ROOM', href: '/dashboard' },
  { label: 'INTEL FEED',     href: '/dashboard/feed' },
  { label: 'ACTORS',         href: '/dashboard/actors' },
  { label: 'DAILY BRIEFS',   href: '/dashboard/briefs' },
];

export function Header() {
  const path = usePathname();
  const isActive = (href: string) =>
    href === '/dashboard' ? path === '/dashboard' : path.startsWith(href);

  return (
    <header style={{
      height: 40,
      background: 'var(--p2)',
      borderBottom: '1px solid var(--b)',
      display: 'flex',
      alignItems: 'center',
      paddingLeft: 16,
      paddingRight: 20,
      gap: 0,
      flexShrink: 0,
      zIndex: 50,
    }}>
      {/* Logo */}
      <Link href="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, marginRight: 32 }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <polygon points="8,1 15,5 15,11 8,15 1,11 1,5" fill="none" stroke="var(--acc)" strokeWidth="1.5" />
          <circle cx="8" cy="8" r="2" fill="var(--acc)" />
        </svg>
        <span style={{
          fontFamily: "'SFMono-Regular', monospace",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.12em',
          color: 'var(--t1)',
        }}>
          PHAROS
        </span>
        <span style={{ fontSize: 9, color: 'var(--t3)', letterSpacing: '0.06em', fontFamily: 'system-ui, sans-serif' }}>
          INTELLIGENCE
        </span>
      </Link>

      {/* Nav */}
      <nav style={{ display: 'flex', alignItems: 'stretch', height: '100%', gap: 0 }}>
        {NAV.map(item => {
          const active = isActive(item.href);
          return (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              <div style={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                padding: '0 16px',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.08em',
                fontFamily: 'system-ui, sans-serif',
                color: active ? 'var(--t1)' : 'var(--t2)',
                borderBottom: active ? '2px solid var(--acc)' : '2px solid transparent',
                background: active ? 'var(--p3)' : 'transparent',
                transition: 'color 0.1s, background 0.1s',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
              }}
                onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.color = 'var(--t1)'; (e.currentTarget as HTMLElement).style.background = 'var(--p3)'; } }}
                onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.color = 'var(--t2)'; (e.currentTarget as HTMLElement).style.background = 'transparent'; } }}
              >
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Right: status */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Live indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--crit)',
            boxShadow: '0 0 6px var(--crit)',
          }} />
          <span style={{ fontSize: 9, color: 'var(--t2)', letterSpacing: '0.08em', fontFamily: 'system-ui, sans-serif', fontWeight: 700 }}>LIVE</span>
        </div>

        {/* UTC clock */}
        <ClockDisplay />

        {/* User */}
        <div style={{
          width: 24, height: 24, borderRadius: '50%',
          background: 'var(--p4)',
          border: '1px solid var(--b)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 9, color: 'var(--t2)', fontFamily: 'system-ui, sans-serif', fontWeight: 700,
        }}>
          OP
        </div>
      </div>
    </header>
  );
}

function ClockDisplay() {
  // Static — in production this would tick
  return (
    <span style={{
      fontFamily: "'SFMono-Regular', 'Menlo', monospace",
      fontSize: 10,
      color: 'var(--t2)',
      letterSpacing: '0.04em',
    }}>
      2026-03-01 · UTC
    </span>
  );
}
