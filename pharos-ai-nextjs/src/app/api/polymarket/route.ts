import { NextResponse } from 'next/server';
import type { SubMarket, PredictionMarket } from '@/types/domain';

const GAMMA = 'https://gamma-api.polymarket.com';

const QUERIES = [
  'iran', 'israel iran', 'hormuz', 'khamenei', 'nuclear iran',
  'iran strike', 'israel strike iran', 'iran ceasefire',
  'iran oil', 'irgc', 'iran us war', 'persian gulf',
];

interface RawMarket {
  id: string;
  slug?: string;
  question: string;
  conditionId: string;
  outcomes: string;
  outcomePrices: string;
  volume: string | number;
  volume24hr: number;
  volume1wk: number;
  volume1mo: number;
  liquidity: string | number;
  active: boolean;
  closed: boolean;
  endDate?: string;
  startDate?: string;
  groupItemTitle?: string;
  lastTradePrice?: number;
  bestBid?: number;
  bestAsk?: number;
  spread?: number;
  clobTokenIds?: string;
  umaResolutionStatuses?: unknown;
}

interface PolyEvent {
  id: string;
  title: string;
  description: string;
  volume: number;
  volume24hr: number;
  volume1wk: number;
  volume1mo: number;
  volume1yr: number;
  liquidity: number;
  openInterest: number;
  competitive: number;
  active: boolean;
  closed: boolean;
  startDate: string;
  endDate: string;
  image: string;
  markets: RawMarket[];
}

// SubMarket and PredictionMarket are defined in @/types/domain
export type { SubMarket, PredictionMarket } from '@/types/domain';

function parseSubMarket(m: RawMarket): SubMarket {
  let outcomes: string[] = [];
  let prices:   number[] = [];
  let tokenIds: string[] = [];
  try { outcomes = JSON.parse(m.outcomes        ?? '[]'); }                     catch { /* ignore */ }
  try { prices   = (JSON.parse(m.outcomePrices  ?? '[]') as string[]).map(Number); } catch { /* ignore */ }
  try { tokenIds = JSON.parse(m.clobTokenIds    ?? '[]'); }                     catch { /* ignore */ }

  return {
    id:             m.id,
    question:       m.question,
    groupItemTitle: m.groupItemTitle ?? '',
    outcomes,
    prices,
    lastTradePrice: m.lastTradePrice ?? prices[0] ?? 0,
    bestBid:        m.bestBid  ?? 0,
    bestAsk:        m.bestAsk  ?? 0,
    spread:         m.spread   ?? 0,
    volume:         Number(m.volume    ?? 0),
    volume24hr:     m.volume24hr ?? 0,
    volume1wk:      m.volume1wk  ?? 0,
    volume1mo:      m.volume1mo  ?? 0,
    active:         m.active  ?? false,
    closed:         m.closed  ?? false,
    endDate:        m.endDate ?? '',
    yesTokenId:     tokenIds[0] ?? '',
    conditionId:    m.conditionId ?? '',
  };
}

export async function GET() {
  try {
    const results = await Promise.allSettled(
      QUERIES.map(q =>
        fetch(`${GAMMA}/public-search?q=${encodeURIComponent(q)}&limit=20`, {
          next: { revalidate: 120 },
        }).then(r => r.json())
      )
    );

    const seen   = new Set<string>();
    const events: PolyEvent[] = [];

    for (const result of results) {
      if (result.status !== 'fulfilled') continue;
      const data = result.value as { events?: PolyEvent[] };
      for (const event of (data.events ?? [])) {
        if (!seen.has(event.id) && event.markets?.length > 0) {
          seen.add(event.id);
          events.push(event);
        }
      }
    }

    events.sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0));

    const markets: PredictionMarket[] = events
      .filter(event => !event.closed)
      .slice(0, 60)
      .map(event => {
        const subMarkets = event.markets.map(parseSubMarket);
        // primary = highest-volume sub-market (most relevant)
        const primary    = [...subMarkets].sort((a, b) => b.volume - a.volume)[0] ?? subMarkets[0];

        return {
          id:            event.id,
          title:         event.title,
          description:   event.description?.slice(0, 800) ?? '',
          category:      '',
          outcomes:      primary.outcomes,
          prices:        primary.prices,
          lastTradePrice: primary.lastTradePrice,
          bestBid:       primary.bestBid,
          bestAsk:       primary.bestAsk,
          spread:        primary.spread,
          volume:        event.volume       ?? 0,
          volume24hr:    event.volume24hr   ?? 0,
          volume1wk:     event.volume1wk    ?? 0,
          volume1mo:     event.volume1mo    ?? 0,
          volume1yr:     event.volume1yr    ?? 0,
          liquidity:     event.liquidity    ?? 0,
          openInterest:  event.openInterest ?? 0,
          competitive:   event.competitive  ?? 0,
          active:        event.active       ?? false,
          closed:        event.closed       ?? false,
          startDate:     event.startDate    ?? '',
          endDate:       event.endDate      ?? '',
          image:         event.image        ?? '',
          polyUrl:       `https://polymarket.com/event/${event.markets[0]?.slug ?? event.id}`,
          conditionId:   primary.conditionId,
          yesTokenId:    primary.yesTokenId,
          subMarkets,
        };
      });

    return NextResponse.json({ markets, fetchedAt: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json({ error: String(err), markets: [] }, { status: 500 });
  }
}
