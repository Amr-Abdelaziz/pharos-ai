import type { PickingInfo } from '@deck.gl/core';

import type {
  Asset,
  MissileTrack,
  StrikeArc,
  Target,
  ThreatZone,
} from '@/data/map-data';

import type { TooltipObject } from './intel-map-layers';

export function getMapTooltip({ object, layer }: PickingInfo<TooltipObject>) {
  if (!object) return null;
  const layerId = layer?.id ?? '';
  let html = '';

  if (layerId === 'strikes') {
    const d = object as StrikeArc;
    const typeLabel = d.type === 'NAVAL_STRIKE' ? 'NAVAL STRIKE' : d.actor === 'ISRAEL' ? 'IDF STRIKE' : 'US STRIKE';
    const typeColor = d.type === 'NAVAL_STRIKE' ? 'var(--teal)' : d.actor === 'ISRAEL' ? 'var(--il-green)' : 'var(--blue-l)';
    html = `
      <div style="font-weight:700;font-size:11px;color:var(--t1);margin-bottom:6px">${d.label}</div>
      <div style="color:${typeColor};font-size:10px;margin-bottom:2px">TYPE: ${typeLabel}</div>
      <div style="color:${d.severity === 'CRITICAL' ? 'var(--danger)' : 'var(--warning)'};font-size:10px">SEVERITY: ${d.severity}</div>
    `;
  } else if (layerId === 'missiles') {
    const d = object as MissileTrack;
    html = `
      <div style="font-weight:700;font-size:11px;color:var(--danger);margin-bottom:6px">${d.label}</div>
      <div style="color:var(--danger);font-size:10px;margin-bottom:2px">TYPE: IRGC BALLISTIC MISSILE</div>
      <div style="color:${d.severity === 'CRITICAL' ? 'var(--danger)' : 'var(--warning)'};font-size:10px;margin-bottom:2px">SEVERITY: ${d.severity}</div>
      <div style="color:${d.status === 'INTERCEPTED' ? 'var(--gold)' : 'var(--danger)'};font-size:10px">STATUS: ${d.status === 'INTERCEPTED' ? '✓ INTERCEPTED' : '⚠ IMPACT CONFIRMED'}</div>
    `;
  } else if (layerId === 'targets') {
    const d = object as Target;
    const statusColor = d.status === 'DESTROYED' ? 'var(--danger)' : d.status === 'DAMAGED' ? 'var(--warning)' : 'var(--gold)';
    const typeColor = d.type === 'NUCLEAR_SITE' ? 'var(--cyber)' : d.type === 'COMMAND' ? 'var(--danger)' : d.type === 'NAVAL_BASE' ? 'var(--blue-l)' : 'var(--t3)';
    html = `
      <div style="font-weight:700;font-size:12px;color:var(--t1);margin-bottom:6px">${d.name}</div>
      <div style="display:flex;gap:4px;margin-bottom:6px">
        <span style="border:1px solid ${typeColor};color:${typeColor};font-size:8px;padding:1px 5px;border-radius:2px">${d.type}</span>
        <span style="border:1px solid ${statusColor};color:${statusColor};font-size:8px;padding:1px 5px;border-radius:2px">${d.status}</span>
      </div>
      <div style="color:var(--t2);font-size:10px;line-height:1.5">${d.description}</div>
    `;
  } else if (layerId === 'assets') {
    const d = object as Asset;
    const nationColor = d.actor === 'US' ? 'var(--blue-l)' : 'var(--teal)';
    let extraLine = '';
    if (d.type === 'CARRIER') {
      extraLine = `<div style="color:var(--gold);font-size:10px;margin-top:4px;font-weight:700">▶ CARRIER STRIKE GROUP</div>`;
    }
    html = `
      <div style="font-weight:700;font-size:12px;color:var(--t1);margin-bottom:6px">${d.name}</div>
      <div style="display:flex;gap:4px;margin-bottom:4px">
        <span style="border:1px solid ${nationColor};color:${nationColor};font-size:8px;padding:1px 5px;border-radius:2px">${d.actor}</span>
        <span style="background:var(--bg-2);border:1px solid var(--bd);color:var(--t3);font-size:8px;padding:1px 5px;border-radius:2px">${d.type}</span>
      </div>
      ${d.description ? `<div style="color:var(--t2);font-size:10px;line-height:1.5;margin-top:4px">${d.description}</div>` : ''}
      ${extraLine}
    `;
  } else if (layerId === 'zones') {
    const d = object as ThreatZone;
    const zoneColor = d.type === 'CLOSURE' ? 'var(--danger)' : d.type === 'PATROL' ? 'var(--warning)' : d.type === 'NFZ' ? 'var(--gold)' : 'var(--danger)';
    html = `
      <div style="font-weight:700;font-size:11px;color:var(--t1);margin-bottom:4px">${d.name}</div>
      <div style="color:${zoneColor};font-size:10px">TYPE: ${d.type}</div>
    `;
  } else {
    const obj = object as unknown as Record<string, unknown>;
    const hasContent = obj.label || obj.name;
    if (!hasContent) return null;
    html = `<div style="font-size:11px;color:var(--t1)">${String(obj.label ?? obj.name ?? '')}</div>`;
  }

  if (!html) return null;
  return {
    html: `<div style="background:var(--bg-app);border:1px solid var(--bd);padding:8px 10px;font-family:monospace;max-width:260px;border-radius:2px">${html}</div>`,
    style: { backgroundColor: 'transparent', border: 'none', padding: '0' },
  };
}
