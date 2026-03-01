'use client';
import { fmtDate } from '@/lib/format';
import { CONFLICT } from '@/data/iranConflict';
import { ACTORS }   from '@/data/iranActors';
import { EVENTS }   from '@/data/iranEvents';
import { ScrollArea } from '@/components/ui/scroll-area';
import Flag from '@/components/shared/Flag';
import { BriefSection, EconChip, ScenarioCard } from '@/components/brief/BriefSection';

const SOURCES = [
  { name: 'Reuters',                     tier: 1, note: 'Primary wire coverage — Tel Aviv, Tehran, Washington' },
  { name: 'New York Times',              tier: 1, note: 'Investigative sourcing + senior Pentagon readouts' },
  { name: 'Associated Press',            tier: 1, note: 'Casualty figures, diplomatic wires' },
  { name: 'CENTCOM official statements', tier: 1, note: 'US KIA, operational updates' },
  { name: 'IDF Spokesperson',            tier: 1, note: 'Strike confirmations, target lists' },
  { name: 'ISW / CTP',                   tier: 1, note: 'Operational analysis, OSINT corroboration' },
  { name: 'IAEA Director General',       tier: 1, note: 'Nuclear facility sensor contact / safeguards' },
  { name: 'Axios',                        tier: 1, note: 'Leadership decapitation confirmations' },
  { name: 'IRNA (Iranian state media)',  tier: 2, note: 'Used for Iranian-side claims only — treat as propaganda unless corroborated' },
  { name: 'CNBC / Trump interview',      tier: 1, note: 'Presidential statements, Mar-a-Lago readout' },
  { name: 'CSIS',                         tier: 1, note: 'Target analysis, nuclear facility BDA' },
  { name: 'Kpler / MarineTraffic',       tier: 2, note: 'Strait of Hormuz vessel tracking, AIS data' },
  { name: 'Maersk customer advisory',   tier: 1, note: 'Commercial shipping disruption, route closures' },
];

const TIER_C: Record<number, string> = { 1: 'var(--success)', 2: 'var(--warning)' };



export default function BriefPage() {
  const recentEvents = [...EVENTS]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 8);
  void recentEvents; // available if needed by future sections

  const majorActors = ACTORS.filter(a => ['us', 'idf', 'iran', 'irgc', 'houthis'].includes(a.id));

  return (
    <ScrollArea style={{ flex: 1, background: 'var(--bg-1)' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px 60px' }}>

        {/* Classification header */}
        <div style={{ textAlign: 'center', marginBottom: 32, paddingBottom: 20, borderBottom: '2px solid var(--bd)' }}>
          <div style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', color: 'var(--t4)', fontFamily: 'SFMono-Regular, monospace', textTransform: 'uppercase' }}>
              UNCLASSIFIED // PHAROS ANALYTICAL
            </span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--t1)', letterSpacing: '0.04em', marginBottom: 6, fontFamily: 'SFMono-Regular, monospace' }}>
            DAILY INTELLIGENCE BRIEF
          </h1>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--danger)', letterSpacing: '0.08em', marginBottom: 10, fontFamily: 'SFMono-Regular, monospace' }}>
            OPERATION EPIC FURY / ROARING LION
          </h2>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 20 }}>
            <span className="mono" style={{ fontSize: 10, color: 'var(--t3)' }}>DATE: 2026-03-01</span>
            <span className="mono" style={{ fontSize: 10, color: 'var(--t3)' }}>AS OF: 14:00 UTC</span>
            <span className="mono" style={{ fontSize: 10, color: 'var(--t3)' }}>DAY 2 OF OPERATIONS</span>
          </div>
        </div>

        <BriefSection number="1" title="EXECUTIVE SUMMARY">
          <p style={{ lineHeight: 1.8, color: 'var(--t1)', marginBottom: 12 }}>{CONFLICT.summary}</p>
          <p style={{ lineHeight: 1.8, color: 'var(--t2)', marginBottom: 12 }}>
            As of 14:00 UTC on March 1, 2026 — Day 2 of operations — the United States and Israel continue to conduct active strikes against Iranian nuclear, missile, and military infrastructure. Iran's transitional government has vowed continued retaliation but appears to be operating on pre-delegated retaliatory protocols rather than coherent centralized command.
          </p>
          <p style={{ lineHeight: 1.8, color: 'var(--t2)' }}>
            The economic dimension of the conflict has escalated sharply. IRGC closure of the Strait of Hormuz combined with Houthi resumption of Red Sea attacks has effectively closed both major maritime chokepoints simultaneously — the most severe supply disruption since 1973. Brent crude is trading at $143/barrel (+35%).
          </p>
        </BriefSection>

        <BriefSection number="2" title="KEY DEVELOPMENTS — LAST 24 HOURS">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {CONFLICT.keyFacts.map((fact, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '8px 12px', background: 'var(--bg-2)', border: '1px solid var(--bd)', borderLeft: '3px solid var(--danger)' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--danger)', flexShrink: 0, fontFamily: 'monospace', paddingTop: 1 }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <p style={{ fontSize: 12.5, color: 'var(--t1)', lineHeight: 1.5 }}>{fact}</p>
              </div>
            ))}
          </div>
        </BriefSection>

        <BriefSection number="3" title="SITUATION BY ACTOR">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {majorActors.map(actor => (
              <div key={actor.id} style={{ padding: '12px 16px', background: 'var(--bg-2)', border: '1px solid var(--bd)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  {actor.countryCode && <Flag code={actor.countryCode} size={18} />}
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>{actor.fullName}</span>
                  <span style={{ fontSize: 8, fontWeight: 700, padding: '2px 6px', background: 'var(--danger-dim)', color: 'var(--danger)', marginLeft: 'auto' }}>
                    {actor.activityLevel}
                  </span>
                  <span style={{ fontSize: 8, fontWeight: 700, padding: '2px 6px', background: 'var(--bg-3)', color: 'var(--t2)' }}>
                    {actor.stance}
                  </span>
                </div>
                <p style={{ fontSize: 12.5, color: 'var(--t2)', lineHeight: 1.7 }}>{actor.assessment}</p>
              </div>
            ))}
          </div>
        </BriefSection>

        <BriefSection number="4" title="ECONOMIC IMPACT">
          <p style={{ lineHeight: 1.8, color: 'var(--t2)', marginBottom: 12 }}>
            The simultaneous closure of the Strait of Hormuz and Bab el-Mandeb Strait represents an unprecedented dual-chokepoint disruption. The Strait of Hormuz carries approximately 20% of global seaborne oil and 30% of global LNG — roughly 14 million barrels per day. Both are effectively closed.
          </p>
          <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
            <EconChip label="Brent Crude"     val="$143/bbl" sub="+35% ↑" color="var(--danger)" />
            <EconChip label="WTI"             val="$138/bbl" sub="+33% ↑" color="var(--danger)" />
            <EconChip label="LNG Asia"        val="+29%"     sub="spot"    color="var(--warning)" />
            <EconChip label="Hormuz Transit"  val="ZERO"     sub="vessels" color="var(--danger)" />
          </div>
          <p style={{ lineHeight: 1.8, color: 'var(--t2)' }}>
            <strong style={{ color: 'var(--warning)' }}>Economic risk threshold:</strong> If Hormuz closure exceeds 2 weeks, Bloomberg Economics estimates a global GDP shock of 0.8–1.4%. Oil at $180–200/bbl is analytically plausible under 3-week+ closure.
          </p>
        </BriefSection>

        <BriefSection number="5" title="OUTLOOK — THREE SCENARIOS">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <ScenarioCard label="BEST CASE"  subtitle="Ceasefire within 72 hours"           color="var(--success)" prob="15%"
              body="Iran's transitional government signals willingness for back-channel ceasefire negotiations via Oman. US and Israel agree to pause strikes contingent on IRGC stand-down and nominal Hormuz reopening. Oil prices partially retrace to $110–120/bbl." />
            <ScenarioCard label="BASE CASE"  subtitle="5–7 day operation; limited ceasefire" color="var(--warning)" prob="55%"
              body="US and Israel complete nuclear and missile infrastructure destruction over 5–7 days. Iran's retaliatory capability is significantly degraded but Hormuz closure persists 10–14 days. Oil spikes to $155–165/bbl before beginning to retrace once Hormuz reopening is signaled." />
            <ScenarioCard label="WORST CASE" subtitle="Wider regional war — Hezbollah front opens" color="var(--danger)" prob="30%"
              body="Hezbollah opens a sustained northern front against Israel. Israel is forced to conduct a ground incursion into southern Lebanon. Hormuz closure extends beyond 3 weeks. Oil surpasses $180/bbl. Iran's nuclear program is destroyed but at the cost of a 6-month regional war." />
          </div>
        </BriefSection>

        <BriefSection number="6" title="SOURCES">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {SOURCES.map((src, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', border: '1px solid var(--bd)' }}>
                <span style={{ fontSize: 8, fontWeight: 700, padding: '1px 5px', background: TIER_C[src.tier] + '22', color: TIER_C[src.tier], flexShrink: 0 }}>
                  T{src.tier}
                </span>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--t1)', minWidth: 180 }}>{src.name}</span>
                <span style={{ fontSize: 10, color: 'var(--t3)', flex: 1 }}>{src.note}</span>
              </div>
            ))}
          </div>
        </BriefSection>

        <div style={{ marginTop: 40, paddingTop: 16, borderTop: '1px solid var(--bd)', textAlign: 'center' }}>
          <span className="label" style={{ fontSize: 8, color: 'var(--t4)' }}>
            UNCLASSIFIED // PHAROS ANALYTICAL // OPERATION EPIC FURY // {fmtDate(CONFLICT.startDate)}
          </span>
        </div>
      </div>
    </ScrollArea>
  );
}
