/**
 * map-tooltip.ts
 * DeckGL tooltip HTML generator.
 *
 * CODEX §5.4 exception: DeckGL requires raw HTML strings for tooltips.
 * All colours reference CSS variables — zero hex literals allowed.
 */

import { ACTOR_META, STATUS_META } from '@/data/map-tokens';

import type { PickingInfo } from '@deck.gl/core';
import type { StrikeArc, MissileTrack, Target, Asset, ThreatZone } from '@/data/map-data';

// ─── Shared wrapper ───────────────────────────────────────────────────────────

function wrap(inner: string) {
  return {
    html: `<div style="background:var(--bg-app);border:1px solid var(--bd);padding:8px 10px;font-family:'SFMono-Regular',Menlo,monospace;max-width:260px;border-radius:2px">${inner}</div>`,
    style: { backgroundColor: 'transparent', border: 'none', padding: '0' },
  };
}

function pill(label: string, color: string) {
  return `<span style="background:color-mix(in srgb,${color} 14%,transparent);border:1px solid color-mix(in srgb,${color} 35%,transparent);color:${color};font-size:8px;padding:1px 5px;border-radius:2px;margin-right:3px">${label}</span>`;
}

// ─── Per-type renderers ───────────────────────────────────────────────────────

function strikeTooltip(d: StrikeArc): string {
  const actorMeta = ACTOR_META[d.actor];
  const sevColor  = d.severity === 'CRITICAL' ? 'var(--danger)' : 'var(--warning)';
  return `
    <div style="font-weight:700;font-size:11px;color:var(--t1);margin-bottom:6px">${d.label}</div>
    <div style="margin-bottom:4px">${pill(actorMeta.label, actorMeta.cssVar)}${pill(d.type.replace('_', ' '), actorMeta.cssVar)}${pill(d.severity, sevColor)}</div>
    <div style="font-size:10px;color:var(--t3)">STATUS: <span style="color:${STATUS_META[d.status].cssVar}">${STATUS_META[d.status].label}</span></div>
  `;
}

function missileTooltip(d: MissileTrack): string {
  const actorMeta  = ACTOR_META[d.actor];
  const statusColor = d.status === 'INTERCEPTED' ? 'var(--warning)' : 'var(--danger)';
  const sevColor    = d.severity === 'CRITICAL' ? 'var(--danger)' : 'var(--warning)';
  return `
    <div style="font-weight:700;font-size:11px;color:var(--danger);margin-bottom:6px">${d.label}</div>
    <div style="margin-bottom:4px">${pill(actorMeta.label, actorMeta.cssVar)}${pill(d.type, actorMeta.cssVar)}${pill(d.severity, sevColor)}</div>
    <div style="font-size:10px;color:${statusColor};font-weight:700">▶ ${d.status}</div>
  `;
}

function targetTooltip(d: Target): string {
  const actorMeta  = ACTOR_META[d.actor];
  const statusMeta = STATUS_META[d.status];
  return `
    <div style="font-weight:700;font-size:12px;color:var(--t1);margin-bottom:6px">${d.name}</div>
    <div style="margin-bottom:6px">${pill(actorMeta.label, actorMeta.cssVar)}${pill(d.type.replace('_', ' '), actorMeta.cssVar)}${pill(d.status, statusMeta.cssVar)}</div>
    <div style="color:var(--t2);font-size:10px;line-height:1.5">${d.description}</div>
  `;
}

function assetTooltip(d: Asset): string {
  const actorMeta  = ACTOR_META[d.actor];
  const statusMeta = STATUS_META[d.status];
  const extra = d.type === 'CARRIER'
    ? `<div style="color:var(--warning);font-size:10px;margin-top:4px;font-weight:700">▶ CARRIER STRIKE GROUP</div>`
    : '';
  return `
    <div style="font-weight:700;font-size:12px;color:var(--t1);margin-bottom:6px">${d.name}</div>
    <div style="margin-bottom:4px">${pill(actorMeta.label, actorMeta.cssVar)}${pill(d.type.replace('_', ' '), 'var(--t3)')}${pill(statusMeta.label, statusMeta.cssVar)}</div>
    ${d.description ? `<div style="color:var(--t2);font-size:10px;line-height:1.5;margin-top:4px">${d.description}</div>` : ''}
    ${extra}
  `;
}

function zoneTooltip(d: ThreatZone): string {
  const actorMeta = ACTOR_META[d.actor];
  return `
    <div style="font-weight:700;font-size:11px;color:var(--t1);margin-bottom:4px">${d.name}</div>
    <div>${pill(actorMeta.label, actorMeta.cssVar)}${pill(d.type.replace('_', ' '), 'var(--warning)')}</div>
  `;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function buildTooltip(info: PickingInfo): ReturnType<typeof wrap> | null {
  const { object, layer } = info;
  if (!object || !layer) return null;

  const id = layer.id;
  if (id === 'strikes')      return wrap(strikeTooltip(object as StrikeArc));
  if (id === 'missiles')     return wrap(missileTooltip(object as MissileTrack));
  if (id === 'targets' || id === 'target-labels') return wrap(targetTooltip(object as Target));
  if (id === 'assets'  || id === 'asset-labels')  return wrap(assetTooltip(object as Asset));
  if (id === 'zones')        return wrap(zoneTooltip(object as ThreatZone));
  return null;
}
