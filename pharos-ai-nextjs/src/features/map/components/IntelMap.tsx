'use client';

import '@/features/map/lib/deckgl-device';
import { useState, useCallback } from 'react';
import Link from 'next/link';
import DeckGL from '@deck.gl/react';
import Map from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { PickingInfo, MapViewState } from '@deck.gl/core';

import { Button } from '@/components/ui/button';
import { IntelMapLegend } from './IntelMapLegend';
import { useMapData } from '@/features/map/queries';
import { useMapLayers, type LayerVisibility, type TooltipObject } from './intel-map-layers';
import { getMapTooltip } from './intel-map-tooltip';

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

const INITIAL_VIEW_STATE: MapViewState = {
  longitude: 51.0, latitude: 30.0, zoom: 4.5, pitch: 0, bearing: 0,
};

const BUTTON_CONFIG: Array<{
  key: keyof LayerVisibility;
  label: string;
  active: { bg: string; border: string; color: string };
}> = [
  { key: 'strikes',  label: 'STRIKES',  active: { bg: '#1C3A5E', border: '#2D72D2', color: '#4C9BE8' } },
  { key: 'missiles', label: 'MISSILES', active: { bg: '#3A1C1C', border: '#D23232', color: '#E84C4C' } },
  { key: 'targets',  label: 'TARGETS',  active: { bg: '#3A2A1C', border: '#D27832', color: '#E8A84C' } },
  { key: 'assets',   label: 'ASSETS',   active: { bg: '#1C3A3A', border: '#32C8C8', color: '#4CE8E8' } },
  { key: 'zones',    label: 'ZONES',    active: { bg: '#3A3A1C', border: '#C8C832', color: '#E8E84C' } },
  { key: 'heat',     label: 'HEAT',     active: { bg: '#2A1C3A', border: '#8232D2', color: '#B84CE8' } },
];

const DEFAULT_VISIBILITY: LayerVisibility = {
  strikes: true, missiles: true, targets: true, assets: true, zones: true, heat: true,
};

export function IntelMap() {
  const { data: mapData } = useMapData();
  const [viewState, setViewState] = useState<MapViewState>(INITIAL_VIEW_STATE);
  const [visibility, setVisibility] = useState<LayerVisibility>(DEFAULT_VISIBILITY);

  const toggleLayer = (key: keyof LayerVisibility) =>
    setVisibility((prev) => ({ ...prev, [key]: !prev[key] }));

  const layers = useMapLayers(visibility, mapData);
  const getTooltip = useCallback(
    (info: PickingInfo) => getMapTooltip(info as PickingInfo<TooltipObject>),
    [],
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1C2127' }}>
      {/* Title Bar */}
      <div style={{ height: 36, background: 'var(--bg-app)', borderBottom: '1px solid var(--bd)', display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8, flexShrink: 0 }}>
        <span style={{ color: '#2D72D2', fontWeight: 700, fontSize: 11, fontFamily: 'monospace' }}>◈ INTEL MAP</span>
        <span style={{ color: '#8F99A8', fontSize: 9, fontFamily: 'monospace', marginLeft: 4 }}>OPERATION EPIC FURY</span>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#32C832', display: 'inline-block', marginLeft: 4 }} />
        <span style={{ color: '#32C832', fontSize: 9, fontFamily: 'monospace' }}>LIVE</span>

        {/* Toggle buttons */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          {BUTTON_CONFIG.map(({ key, label, active }) => {
            const on = visibility[key];
            return (
              <Button
                key={key}
                variant="ghost"
                size="sm"
                onClick={() => toggleLayer(key)}
                className="h-auto px-1.5 py-0.5 rounded-sm text-[8px] font-bold mono"
                style={{
                  border: `1px solid ${on ? active.border : 'var(--bd)'}`,
                  background: on ? active.bg : 'var(--bg-1)',
                  color: on ? active.color : 'var(--t4)',
                }}
              >
                {label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Map Area */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <DeckGL
          viewState={viewState}
          onViewStateChange={({ viewState: vs }) => setViewState(vs as MapViewState)}
          controller={true}
          layers={layers}
          getTooltip={getTooltip}
          style={{ width: '100%', height: '100%' }}
        >
          <Map mapStyle={MAP_STYLE} />
        </DeckGL>

        <IntelMapLegend />

        {/* Coords */}
        <div style={{ position: 'absolute', bottom: 52, right: 12, background: 'rgba(28,33,39,0.85)', border: '1px solid #404854', padding: '4px 8px', fontSize: 9, fontFamily: 'monospace', color: '#5C7080', pointerEvents: 'none' }}>
          {viewState.latitude.toFixed(2)}°N {viewState.longitude.toFixed(2)}°E
        </div>

        <OpenMapButton />
      </div>
    </div>
  );
}

function OpenMapButton() {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      href="/dashboard/map"
      style={{
        position: 'absolute', bottom: 16, right: 12,
        background: hovered ? '#1F4F9B' : '#2D72D2',
        color: 'white', padding: '8px 16px', fontSize: 11, fontWeight: 700,
        fontFamily: 'monospace', border: 'none', borderRadius: 2,
        cursor: 'pointer', letterSpacing: '0.08em', textDecoration: 'none',
        display: 'inline-block', transition: 'background 0.15s ease', zIndex: 10,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      ⤢&nbsp;&nbsp;OPEN FULL MAP
    </Link>
  );
}
