import { NextRequest, NextResponse } from 'next/server';

import { reassembleCasualties } from '@/server/lib/api-utils';
import { prisma } from '@/server/lib/db';

function escapeXml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toIsoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function asRfc822(date: Date): string {
  return date.toUTCString();
}

function renderFullBriefHtml(snapshot: {
  dayLabel: string;
  summary: string;
  keyFacts: string[];
  escalation: number;
  economicNarrative: string;
  economicChips: { label: string; val: string; sub: string }[];
  scenarios: { label: string; subtitle: string; prob: string; body: string }[];
  casualties: Array<{ faction: string; killed: number; wounded: number; civilians: number; injured: number }>;
}): string {
  const cas = reassembleCasualties(snapshot.casualties);
  const regional = Object.entries(cas.regional)
    .map(([name, row]) => `<li><strong>${escapeXml(name.toUpperCase())}</strong>: ${row.killed} killed, ${row.injured} injured</li>`)
    .join('');

  const facts = snapshot.keyFacts.map(f => `<li>${escapeXml(f)}</li>`).join('');
  const chips = snapshot.economicChips
    .map(c => `<li><strong>${escapeXml(c.label)}:</strong> ${escapeXml(c.val)}${c.sub ? ` (${escapeXml(c.sub)})` : ''}</li>`)
    .join('');
  const scenarios = snapshot.scenarios
    .map(s => `<li><strong>${escapeXml(s.label)}${s.prob ? ` (${escapeXml(s.prob)})` : ''}</strong>${s.subtitle ? ` - ${escapeXml(s.subtitle)}` : ''}<br/>${escapeXml(s.body)}</li>`)
    .join('');

  return [
    `<h2>${escapeXml(snapshot.dayLabel)} - Daily Intelligence Brief</h2>`,
    `<p><strong>Escalation:</strong> ${snapshot.escalation}/100</p>`,
    `<h3>Summary</h3>`,
    `<p>${escapeXml(snapshot.summary)}</p>`,
    `<h3>Key Facts</h3>`,
    `<ul>${facts || '<li>No key facts available.</li>'}</ul>`,
    `<h3>Casualties</h3>`,
    '<ul>',
    `<li><strong>US:</strong> ${cas.us.kia} KIA, ${cas.us.wounded} wounded, ${cas.us.civilians} civilians</li>`,
    `<li><strong>Israel:</strong> ${cas.israel.kia} KIA, ${cas.israel.wounded} wounded, ${cas.israel.civilians} civilians, ${cas.israel.injured} injured</li>`,
    `<li><strong>Iran:</strong> ${cas.iran.killed} killed, ${cas.iran.injured} injured</li>`,
    `<li><strong>Lebanon:</strong> ${cas.lebanon.killed} killed, ${cas.lebanon.injured} injured</li>`,
    regional,
    '</ul>',
    `<h3>Economic Impact</h3>`,
    `<p>${escapeXml(snapshot.economicNarrative || 'No narrative available.')}</p>`,
    `<ul>${chips || '<li>No economic chips available.</li>'}</ul>`,
    `<h3>Scenarios</h3>`,
    `<ul>${scenarios || '<li>No scenarios available.</li>'}</ul>`,
  ].join('');
}

export async function GET(req: NextRequest) {
  const conflictId = req.nextUrl.searchParams.get('conflictId') ?? process.env.NEXT_PUBLIC_CONFLICT_ID ?? 'iran-2026';
  const limitParam = Number(req.nextUrl.searchParams.get('limit') ?? '30');
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 100) : 30;

  const conflict = await prisma.conflict.findUnique({
    where: { id: conflictId },
    select: {
      id: true,
      name: true,
      summary: true,
      daySnapshots: {
        orderBy: { day: 'desc' },
        take: limit,
        include: {
          casualties: true,
          economicChips: { orderBy: { ord: 'asc' } },
          scenarios: { orderBy: { ord: 'asc' } },
        },
      },
    },
  });

  if (!conflict) {
    return NextResponse.json(
      { ok: false, error: { code: 'NOT_FOUND', message: `Conflict ${conflictId} not found` } },
      { status: 404 },
    );
  }

  const origin = req.nextUrl.origin;
  const feedPath = `/api/v1/rss/briefs?conflictId=${encodeURIComponent(conflict.id)}&limit=${limit}`;
  const siteBriefBase = `${origin}/dashboard/brief`;

  const items = conflict.daySnapshots
    .map(snapshot => {
      const day = toIsoDay(snapshot.day);
      const link = `${siteBriefBase}?day=${day}`;
      const title = `${conflict.name} - ${snapshot.dayLabel} Brief`;
      const description = `${snapshot.summary}\n\nEscalation: ${snapshot.escalation}/100`;
      const fullHtml = renderFullBriefHtml(snapshot);
      const guid = `${conflict.id}:${day}`;

      return [
        '<item>',
        `<title>${escapeXml(title)}</title>`,
        `<link>${escapeXml(link)}</link>`,
        `<guid isPermaLink="false">${escapeXml(guid)}</guid>`,
        `<pubDate>${asRfc822(snapshot.day)}</pubDate>`,
        `<description>${escapeXml(description)}</description>`,
        `<content:encoded><![CDATA[${fullHtml}]]></content:encoded>`,
        '</item>',
      ].join('');
    })
    .join('');

  const lastBuildDate = conflict.daySnapshots[0]?.day ?? new Date();
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">',
    '<channel>',
    `<title>${escapeXml(`Pharos Briefs - ${conflict.name}`)}</title>`,
    `<link>${escapeXml(siteBriefBase)}</link>`,
    `<atom:link href="${escapeXml(origin + feedPath)}" rel="self" type="application/rss+xml" />`,
    `<description>${escapeXml(conflict.summary || `Daily intelligence briefs for ${conflict.name}`)}</description>`,
    '<language>en-us</language>',
    `<lastBuildDate>${asRfc822(lastBuildDate)}</lastBuildDate>`,
    items,
    '</channel>',
    '</rss>',
  ].join('');

  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
}
