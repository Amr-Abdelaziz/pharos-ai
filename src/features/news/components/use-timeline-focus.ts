'use client';

import { type MutableRefObject,type RefObject, useCallback, useEffect, useRef, useState } from 'react';

import { CARD_W, DEFAULT_ZOOM,SPINE_Y, type TimelineArticle } from './timeline-constants';

// Types

type Layout = {
  positioned: { article: TimelineArticle; x: number; above: boolean; yOffset: number }[];
  hourMarkers: { hour: Date; x: number }[];
  totalWidth: number;
};

type TransformRefs = {
  viewportRef: RefObject<HTMLDivElement | null>;
  zoomRef: MutableRefObject<number>;
  panRef: MutableRefObject<{ x: number; y: number }>;
  commitTransform: () => void;
};

export function useTimelineFocus(layout: Layout, transform: TransformRefs) {
  const { viewportRef, zoomRef, panRef, commitTransform } = transform;
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const savedTransform = useRef<{ zoom: number; pan: { x: number; y: number } } | null>(null);
  const initialCenterDone = useRef(false);

  const centerOnNewest = useCallback(() => {
    const vp = viewportRef.current;
    if (!vp || layout.positioned.length === 0) return;
    const rect = vp.getBoundingClientRect();
    const last = layout.positioned[layout.positioned.length - 1];
    const targetX = last.x + CARD_W / 2;
    const z = zoomRef.current;
    panRef.current = {
      x: rect.width - targetX * z - 200,
      y: (rect.height / 2) - SPINE_Y * z,
    };
    commitTransform();
  }, [layout, commitTransform, viewportRef, zoomRef, panRef]);

  useEffect(() => {
    if (initialCenterDone.current || layout.positioned.length === 0) return;
    initialCenterDone.current = true;
    requestAnimationFrame(centerOnNewest);
  }, [layout.positioned.length, centerOnNewest]);

  const resetView = useCallback(() => {
    zoomRef.current = DEFAULT_ZOOM;
    requestAnimationFrame(() => {
      const vp = viewportRef.current;
      if (!vp || layout.positioned.length === 0) return;
      const rect = vp.getBoundingClientRect();
      const last = layout.positioned[layout.positioned.length - 1];
      const targetX = last.x + CARD_W / 2;
      panRef.current = {
        x: rect.width - targetX * DEFAULT_ZOOM - 200,
        y: (rect.height / 2) - SPINE_Y * DEFAULT_ZOOM,
      };
      commitTransform();
    });
  }, [layout, commitTransform, viewportRef, zoomRef, panRef]);

  const focusCard = useCallback((article: TimelineArticle, cardX: number, cardTop: number) => {
    const vp = viewportRef.current;
    if (!vp) return;
    const rect = vp.getBoundingClientRect();
    savedTransform.current = { zoom: zoomRef.current, pan: { ...panRef.current } };
    const TARGET_ZOOM = 1.0;
    const EXP_W = CARD_W + 160;
    const expLeft = Math.max(20, cardX - (EXP_W - CARD_W) / 2);
    const expandedCenterX = expLeft + EXP_W / 2;
    const expCardH = (article.imageUrl ? 180 : 0) + 200;
    const expandedCenterY = cardTop + expCardH / 2;
    panRef.current = {
      x: rect.width / 2 - expandedCenterX * TARGET_ZOOM,
      y: rect.height / 2 - expandedCenterY * TARGET_ZOOM,
    };
    zoomRef.current = TARGET_ZOOM;
    commitTransform();
    setFocusedId(article.id);
  }, [commitTransform, viewportRef, zoomRef, panRef]);

  const defocus = useCallback(() => {
    if (savedTransform.current) {
      panRef.current = savedTransform.current.pan;
      zoomRef.current = savedTransform.current.zoom;
      savedTransform.current = null;
      commitTransform();
    }
    setFocusedId(null);
  }, [commitTransform, zoomRef, panRef]);

  // Escape key to defocus
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') defocus(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [defocus]);

  return { focusedId, focusCard, defocus, centerOnNewest, resetView };
}
