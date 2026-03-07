'use client';

import { useCallback,useEffect, useRef, useState } from 'react';

import { DEFAULT_ZOOM,MAX_ZOOM, MIN_ZOOM, ZOOM_STEP } from './timeline-constants';

export function useTimelineTransform() {
  const viewportRef = useRef<HTMLDivElement>(null);

  // ── Refs as single source of truth for transform state.
  // Event handlers read/write refs directly — no stale closures.
  // setState only triggers re-render; actual values come from refs.
  const zoomRef = useRef(DEFAULT_ZOOM);
  const panRef = useRef({ x: 0, y: 0 });
  const [transform, setTransform] = useState({ zoom: DEFAULT_ZOOM, pan: { x: 0, y: 0 } });

  const commitTransform = useCallback(() => {
    setTransform({ zoom: zoomRef.current, pan: { ...panRef.current } });
  }, []);

  const zoom = transform.zoom;
  const pan = transform.pan;

  const [isDragging, setIsDragging] = useState(false);
  const dragState = useRef({ active: false, startX: 0, startY: 0, panX: 0, panY: 0, moved: false });

  // Drag-to-pan (stable, ref-based)
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const onDown = (e: MouseEvent) => {
      // Don't intercept clicks on links or buttons
      const target = e.target as HTMLElement;
      if (target.closest('a') || target.closest('button')) return;
      dragState.current = {
        active: true,
        startX: e.clientX, startY: e.clientY,
        panX: panRef.current.x, panY: panRef.current.y,
        moved: false,
      };
      setIsDragging(true);
      // Note: no preventDefault here — lets native link clicks through
    };

    const onMove = (e: MouseEvent) => {
      if (!dragState.current.active) return;
      const dx = e.clientX - dragState.current.startX;
      const dy = e.clientY - dragState.current.startY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        dragState.current.moved = true;
        e.preventDefault(); // only prevent default once we're actually dragging
      }
      if (!dragState.current.moved) return;
      panRef.current = { x: dragState.current.panX + dx, y: dragState.current.panY + dy };
      commitTransform();
    };

    const onClick = (e: MouseEvent) => {
      // Suppress click only if we actually dragged — not on normal clicks
      if (dragState.current.moved) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const onUp = () => {
      dragState.current.active = false;
      setIsDragging(false);
    };

    el.addEventListener('mousedown', onDown);
    el.addEventListener('click', onClick, true);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      el.removeEventListener('mousedown', onDown);
      el.removeEventListener('click', onClick, true);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [commitTransform]);

  // Scroll-to-zoom (stable, ref-based)
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const currentZoom = zoomRef.current;
      const direction = e.deltaY > 0 ? -1 : 1;
      const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, currentZoom + direction * ZOOM_STEP));
      if (newZoom === currentZoom) return;

      const scale = newZoom / currentZoom;
      const px = panRef.current.x;
      const py = panRef.current.y;

      panRef.current = { x: mouseX - scale * (mouseX - px), y: mouseY - scale * (mouseY - py) };
      zoomRef.current = newZoom;
      commitTransform();
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [commitTransform]);

  return { viewportRef, zoom, pan, isDragging, zoomRef, panRef, commitTransform };
}
