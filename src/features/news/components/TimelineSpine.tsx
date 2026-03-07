'use client';

import { formatHour,SPINE_Y } from './timeline-constants';

// Types

type Props = {
  hourMarkers: { hour: Date; x: number }[];
};

// Component

export function TimelineSpine({ hourMarkers }: Props) {
  return (
    <>
      {/* ─── Spine ─── */}
      <div
        className="absolute left-0 right-0 h-[3px] bg-white/20"
        style={{ top: `${SPINE_Y}px` }}
      />

      {/* Axis labels */}
      <div
        className="absolute mono text-xs text-white/60 tracking-widest font-bold"
        style={{ top: `${SPINE_Y - 30}px`, left: '24px' }}
      >
        ▲ IMPORTANT
      </div>
      <div
        className="absolute mono text-xs text-white/60 tracking-widest font-bold"
        style={{ top: `${SPINE_Y + 16}px`, left: '24px' }}
      >
        ▼ NICHE
      </div>
      <div
        className="absolute mono text-xs text-white/60 font-bold"
        style={{ top: `${SPINE_Y - 8}px`, right: '30px' }}
      >
        NOW →
      </div>

      {/* ─── Hour markers ─── */}
      {hourMarkers.map(({ hour, x }) => (
        <div key={hour.toISOString()}>
          <div
            className="absolute w-px bg-white/[0.08]"
            style={{ left: `${x}px`, top: '0', bottom: '0' }}
          />
          {/* Above spine */}
          <div
            className="absolute mono text-base font-bold text-white whitespace-nowrap"
            style={{ left: `${x - 22}px`, top: `${SPINE_Y - 50}px` }}
          >
            {formatHour(hour)}
          </div>
          {/* Below spine */}
          <div
            className="absolute mono text-base font-bold text-white whitespace-nowrap"
            style={{ left: `${x - 22}px`, top: `${SPINE_Y + 26}px` }}
          >
            {formatHour(hour)}
          </div>
          {/* Dot */}
          <div
            className="absolute w-5 h-5 rounded-full bg-[#0a0a0f] border-[3px] border-white/50"
            style={{ left: `${x - 10}px`, top: `${SPINE_Y - 9}px` }}
          />
        </div>
      ))}
    </>
  );
}
