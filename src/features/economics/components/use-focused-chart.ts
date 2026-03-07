'use client';

import { type MutableRefObject,type RefObject, useEffect, useRef } from 'react';

import { AreaSeries, ColorType, createChart, type IChartApi, LineStyle, type UTCTimestamp } from 'lightweight-charts';

import type { MarketResult } from '@/types/domain';

export function useFocusedChart(
  containerRef: RefObject<HTMLDivElement | null>,
  data: MarketResult,
  positive: boolean,
  anchorModeRef: MutableRefObject<boolean>,
  anchorLineRef: MutableRefObject<ReturnType<ReturnType<IChartApi['addSeries']>['createPriceLine']> | null>,
  setCrosshairValue: (v: { price: number; time: number } | null) => void,
  setAnchorPrice: (p: number) => void,
  setAnchorMode: (v: boolean) => void,
) {
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const lineColor = positive ? 'rgba(34,197,94,0.9)' : 'rgba(239,68,68,0.9)';
    const topColor  = positive ? 'rgba(34,197,94,0.18)' : 'rgba(239,68,68,0.18)';

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: 'rgba(255,255,255,0.45)',
        fontSize: 10,
        fontFamily: 'monospace',
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.04)', style: LineStyle.Dotted },
        horzLines: { color: 'rgba(255,255,255,0.04)', style: LineStyle.Dotted },
      },
      rightPriceScale: {
        borderColor: 'rgba(255,255,255,0.08)',
        scaleMargins: { top: 0.1, bottom: 0.06 },
      },
      timeScale: {
        borderColor: 'rgba(255,255,255,0.08)',
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: 1, // normal crosshair
        vertLine: { color: 'rgba(255,255,255,0.25)', width: 1, style: LineStyle.Dashed, labelBackgroundColor: 'var(--bg-app)' },
        horzLine: { color: 'rgba(255,255,255,0.25)', width: 1, style: LineStyle.Dashed, labelBackgroundColor: 'var(--bg-app)' },
      },
      handleScroll: true,
      handleScale: true,

    });

    const series = chart.addSeries(AreaSeries, {
      lineColor,
      topColor,
      bottomColor: 'rgba(0,0,0,0)',
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 5,
    });

    series.setData(data.chart.map(p => ({ time: p.time as UTCTimestamp, value: p.value })));
    chart.timeScale().fitContent();

    // Track crosshair
    chart.subscribeCrosshairMove(param => {
      if (!param.point || !param.time) {
        setCrosshairValue(null);
        return;
      }
      const price = param.seriesData.get(series);
      if (price && 'value' in price) {
        setCrosshairValue({ price: price.value, time: Number(param.time) });
      }
    });

    // Click to set anchor (when anchor mode is active)
    chart.subscribeClick(param => {
      if (!anchorModeRef.current) return;
      const price = param.seriesData.get(series);
      if (price && 'value' in price) {
        const p = price.value;
        setAnchorPrice(p);
        setAnchorMode(false);
        anchorModeRef.current = false;

        // Remove old price line
        if (anchorLineRef.current) {
          try { series.removePriceLine(anchorLineRef.current); } catch { /* price line already removed */ }
        }
        // Add horizontal reference line at anchor
        anchorLineRef.current = series.createPriceLine({
          price: p,
          color: 'rgba(251,191,36,0.7)',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: 'ANCHOR',
        });
      }
    });

    chartRef.current = chart;

    const obs = new ResizeObserver(entries => {
      for (const e of entries) {
        chart.applyOptions({ width: e.contentRect.width, height: e.contentRect.height });
      }
    });
    obs.observe(containerRef.current);

    return () => {
      obs.disconnect();
      chart.remove();
    };
  }, [data, positive]);

  return chartRef;
}
