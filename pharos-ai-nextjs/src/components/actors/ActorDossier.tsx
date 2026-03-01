'use client';
import { CheckCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { IntelTabBar, TabsContent } from '@/components/shared/IntelTabs';
import { SectionDivider } from '@/components/shared/SectionDivider';
import Flag from '@/components/shared/Flag';
import XPostCard from '@/components/shared/XPostCard';
import { ACT_C, STA_C, type Actor } from '@/data/iranActors';
import { getPostsForActor } from '@/data/iranXPosts';

const TYPE_C: Record<string, string> = {
  MILITARY: 'var(--danger)', DIPLOMATIC: 'var(--info)',
  POLITICAL: 'var(--cyber)', ECONOMIC: 'var(--warning)', INTELLIGENCE: 'var(--t2)',
};

interface Props {
  actor: Actor;
  tab: 'intel' | 'signals';
  onTabChange: (t: 'intel' | 'signals') => void;
}

export function ActorDossier({ actor, tab, onTabChange }: Props) {
  const actC   = ACT_C[actor.activityLevel] ?? 'var(--t2)';
  const staC   = STA_C[actor.stance] ?? 'var(--t2)';
  const xPosts = getPostsForActor(actor.id);

  const tabs = [
    { value: 'intel'   as const, label: 'ACTOR INTELLIGENCE' },
    { value: 'signals' as const, label: `𝕏 SIGNALS${xPosts.length > 0 ? ` (${xPosts.length})` : ''}` },
  ];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--bd)', background: 'var(--bg-2)', flexShrink: 0 }}>
        <div className="label" style={{ fontSize: 8, color: 'var(--t3)', marginBottom: 8 }}>
          ACTOR INTELLIGENCE DOSSIER // PHAROS THREAT ANALYSIS // OPERATION EPIC FURY
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 10 }}>
          {actor.countryCode && <Flag code={actor.countryCode} size={36} />}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <h1 style={{ fontSize: 16, fontWeight: 700, color: 'var(--t1)', lineHeight: 1.1 }}>
                {actor.name.toUpperCase()}
              </h1>
              <span style={{ fontSize: 8, padding: '2px 8px', border: `1px solid ${actC}`, color: actC, fontWeight: 700, letterSpacing: '.06em' }}>
                {actor.activityLevel}
              </span>
              <span style={{ fontSize: 8, padding: '2px 8px', border: `1px solid ${staC}`, color: staC, fontWeight: 700, letterSpacing: '.06em' }}>
                {actor.stance}
              </span>
            </div>
            <span className="mono" style={{ fontSize: 10, color: 'var(--t2)' }}>{actor.fullName}</span>
            <span className="label" style={{ marginLeft: 10, fontSize: 8, color: 'var(--t3)' }}>{actor.type}</span>
          </div>
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ height: 6, width: 80, background: 'var(--bd)' }}>
              <div style={{ width: `${actor.activityScore}%`, height: '100%', background: actC }} />
            </div>
            <span className="mono" style={{ fontSize: 11, color: actC }}>{actor.activityScore}%</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <IntelTabBar value={tab} onValueChange={onTabChange} tabs={tabs}>
        <TabsContent value="intel" style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <ScrollArea style={{ height: '100%' }}>
            <div style={{ padding: '18px 22px' }}>
              <div style={{ marginBottom: 20 }}>
                <SectionDivider label="SAYING — OFFICIAL POSITION" />
                <div style={{ borderLeft: `3px solid ${staC}`, paddingLeft: 12 }}>
                  <p style={{ fontSize: 12.5, color: 'var(--t1)', lineHeight: 1.7, fontStyle: 'italic' }}>
                    {actor.saying}
                  </p>
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <SectionDivider label="DOING — VERIFIED ACTIONS" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {actor.doing.map((action, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, padding: '6px 10px', border: '1px solid var(--bd)' }}>
                      <span style={{ color: actC, fontSize: 12, flexShrink: 0, marginTop: 1 }}>▸</span>
                      <span style={{ fontSize: 12, color: 'var(--t1)', lineHeight: 1.4 }}>{action}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <SectionDivider label="PHAROS ASSESSMENT" />
                <div style={{ borderLeft: '3px solid var(--blue)', paddingLeft: 12 }}>
                  <p style={{ fontSize: 12.5, color: 'var(--t1)', lineHeight: 1.7 }}>{actor.assessment}</p>
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <SectionDivider label={`RECENT ACTIONS (${actor.recentActions.length})`} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {actor.recentActions.map((action, i) => {
                    const ac = TYPE_C[action.type] ?? 'var(--t2)';
                    return (
                      <div key={i} style={{
                        display: 'grid', gridTemplateColumns: '86px 64px 1fr',
                        padding: '6px 0', borderBottom: '1px solid var(--bd-s)',
                      }}>
                        <span className="mono" style={{ fontSize: 10, color: 'var(--t3)', alignSelf: 'flex-start', paddingTop: 1 }}>
                          {action.date}
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <span style={{ fontSize: 8, fontWeight: 700, padding: '1px 5px', background: ac + '18', color: ac, letterSpacing: '.04em' }}>
                            {action.type}
                          </span>
                          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                            {action.verified
                              ? <CheckCircle size={8} style={{ color: 'var(--success)' }} strokeWidth={2} />
                              : <span className="mono" style={{ fontSize: 8, color: 'var(--t4)' }}>UNCFMD</span>
                            }
                          </div>
                        </div>
                        <p style={{ fontSize: 11.5, color: 'var(--t1)', lineHeight: 1.4, paddingLeft: 4 }}>
                          {action.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <SectionDivider label="KEY FIGURES" />
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {actor.keyFigures.map((fig, i) => (
                    <div key={i} style={{ padding: '3px 10px', border: '1px solid var(--bd)', background: 'var(--bg-2)' }}>
                      <span style={{ fontSize: 10, color: 'var(--t2)' }}>{fig}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="signals" style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <ScrollArea style={{ height: '100%' }}>
            <div style={{ padding: '12px 16px' }}>
              {xPosts.length === 0 ? (
                <div style={{ padding: 48, textAlign: 'center' }}>
                  <span style={{ fontSize: 20, color: 'var(--t3)' }}>𝕏</span>
                  <p className="label" style={{ color: 'var(--t3)', marginTop: 8 }}>
                    No signals indexed for this actor
                  </p>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: 10 }}>
                    <span className="label" style={{ fontSize: 8 }}>
                      {xPosts.length} POSTS · PHAROS-CURATED · {actor.name.toUpperCase()}
                    </span>
                  </div>
                  {xPosts.map(p => <XPostCard key={p.id} post={p as import('@/data/iranXPosts').XPost} />)}
                </>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </IntelTabBar>
    </div>
  );
}
