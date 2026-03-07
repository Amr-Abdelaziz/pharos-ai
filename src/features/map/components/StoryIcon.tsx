'use client';
import {
AlertTriangle, Anchor, Crosshair, Flame, type LucideProps,
  Plane, Radiation, Shield, Ship, Skull, Swords,   Target, Zap,
} from 'lucide-react';
import type { FC } from 'react';

const ICON_MAP: Record<string, FC<LucideProps>> = {
  Plane, Radiation, Anchor, Crosshair, Ship, Skull, Zap,
  Target, Swords, Shield, Flame, AlertTriangle,
};

const CATEGORY_COLOR: Record<string, string> = {
  STRIKE:      'var(--danger)',
  RETALIATION: 'var(--warning)',
  NAVAL:       'var(--blue-l)',
  INTEL:       'var(--cyber)',
  DIPLOMATIC:  'var(--success)',
};

const CATEGORY_BG: Record<string, string> = {
  STRIKE:      'rgba(232,76,76,0.15)',
  RETALIATION: 'rgba(232,168,76,0.15)',
  NAVAL:       'rgba(76,155,232,0.15)',
  INTEL:       'rgba(184,76,232,0.15)',
  DIPLOMATIC:  'rgba(76,232,168,0.15)',
};

type Props = {
  iconName: string;
  category: string;
  size?: number;          // icon px size, default 16
  boxSize?: number;       // outer box px size, default 28
  style?: React.CSSProperties;
}

export function StoryIcon({
  iconName,
  category,
  size = 16,
  boxSize = 28,
  style,
}: Props) {
  const Icon = ICON_MAP[iconName] ?? AlertTriangle;
  const color = CATEGORY_COLOR[category] ?? 'var(--t3)';
  const bg    = CATEGORY_BG[category]    ?? 'rgba(143,153,168,0.12)';

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width:  boxSize,
      height: boxSize,
      background: bg,
      border: `1px solid ${color}33`,
      borderRadius: 2,
      flexShrink: 0,
      ...style,
    }}>
      <Icon size={size} strokeWidth={2.5} color={color} />
    </span>
  );
}
