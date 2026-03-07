import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/server/lib/db';

import type { Prisma } from '@/generated/prisma/client';

function escapeXml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function asRfc822(date: Date): string {
  return date.toUTCString();
}

function parseDayRange(day: string): { gte: Date; lt: Date } {
  const gte = new Date(day + 'T00:00:00Z');
  const lt = new Date(gte);
  lt.setUTCDate(lt.getUTCDate() + 1);
  return { gte, lt };
}

function renderEventHtml(event: {
  title: string;
  severity: string;
  type: string;
  location: string;
  timestamp: Date;
  summary: string;
  fullContent: string;
  verified: boolean;
  tags: string[];
  sources: Array<{ name: string; tier: number; reliability: number; url: string | null }>;
  actorResponses: Array<{ actorName: string; stance: string; type: string; statement: string }>;
}): string {
  const tags = event.tags.length
    ? `<p><strong>Tags:</strong> ${escapeXml(event.tags.join(', '))}</p>`
    : '';

  const sources = event.sources.length
    ? `<h3>Sources</h3><ul>${event.sources
      .map(s => `<li><strong>${escapeXml(s.name)}</strong> (Tier ${s.tier}, Reliability ${s.reliability}${s.url ? `) - <a href="${escapeXml(s.url)}">${escapeXml(s.url)}</a>` : ')'}</li>`)
      .join('')}</ul>`
    : '<h3>Sources</h3><p>No sources attached.</p>';

  const responses = event.actorResponses.length
    ? `<h3>Actor Responses</h3><ul>${event.actorResponses
      .map(r => `<li><strong>${escapeXml(r.actorName)}</strong> [${escapeXml(r.stance)} / ${escapeXml(r.type)}]: ${escapeXml(r.statement)}</li>`)
      .join('')}</ul>`
    : '';

  return [
    `<h2>${escapeXml(event.title)}</h2>`,
    `<p><strong>Severity:</strong> ${escapeXml(event.severity)}<br/><strong>Type:</strong> ${escapeXml(event.type)}<br/><strong>Location:</strong> ${escapeXml(event.location)}<br/><strong>Time:</strong> ${escapeXml(event.timestamp.toISOString())}<br/><strong>Verified:</strong> ${event.verified ? 'Yes' : 'No'}</p>`,
    '<h3>Summary</h3>',
    `<p>${escapeXml(event.summary)}</p>`,
    '<h3>Full Content</h3>',
    `<p>${escapeXml(event.fullContent || event.summary)}</p>`,
    tags,
    sources,
    responses,
  ].join('');
}

export async function GET(req: NextRequest) {
  const conflictId = req.nextUrl.searchParams.get('conflictId') ?? process.env.NEXT_PUBLIC_CONFLICT_ID ?? 'iran-2026';
  const limitParam = Number(req.nextUrl.searchParams.get('limit') ?? '100');
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 500) : 100;

  const severity = req.nextUrl.searchParams.get('severity');
  const type = req.nextUrl.searchParams.get('type');
  const verified = req.nextUrl.searchParams.get('verified');
  const day = req.nextUrl.searchParams.get('day');

  const where: Prisma.IntelEventWhereInput = { conflictId };
  if (severity) where.severity = severity as Prisma.EnumSeverityFilter['equals'];
  if (type) where.type = type as Prisma.EnumEventTypeFilter['equals'];
  if (verified !== null) where.verified = verified === 'true';
  if (day) {
    const range = parseDayRange(day);
    where.timestamp = { gte: range.gte, lt: range.lt };
  }

  const conflict = await prisma.conflict.findUnique({
    where: { id: conflictId },
    select: { id: true, name: true, summary: true },
  });

  if (!conflict) {
    return NextResponse.json(
      { ok: false, error: { code: 'NOT_FOUND', message: `Conflict ${conflictId} not found` } },
      { status: 404 },
    );
  }

  const events = await prisma.intelEvent.findMany({
    where,
    orderBy: { timestamp: 'desc' },
    take: limit,
    include: {
      sources: true,
      actorResponses: true,
    },
  });

  const origin = req.nextUrl.origin;
  const feedPath = `/api/v1/rss/events?conflictId=${encodeURIComponent(conflict.id)}&limit=${limit}`;
  const channelLink = `${origin}/dashboard/feed`;

  const items = events
    .map(event => {
      const eventLink = `${channelLink}?event=${encodeURIComponent(event.id)}`;
      const title = `${event.severity} - ${event.title}`;
      const description = `${event.summary}\n\n${event.location} · ${event.type}`;
      const guid = `${conflict.id}:${event.id}`;
      const fullHtml = renderEventHtml(event);

      return [
        '<item>',
        `<title>${escapeXml(title)}</title>`,
        `<link>${escapeXml(eventLink)}</link>`,
        `<guid isPermaLink="false">${escapeXml(guid)}</guid>`,
        `<pubDate>${asRfc822(event.timestamp)}</pubDate>`,
        `<description>${escapeXml(description)}</description>`,
        `<content:encoded><![CDATA[${fullHtml}]]></content:encoded>`,
        '</item>',
      ].join('');
    })
    .join('');

  const lastBuildDate = events[0]?.timestamp ?? new Date();
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">',
    '<channel>',
    `<title>${escapeXml(`Pharos Events - ${conflict.name}`)}</title>`,
    `<link>${escapeXml(channelLink)}</link>`,
    `<atom:link href="${escapeXml(origin + feedPath)}" rel="self" type="application/rss+xml" />`,
    `<description>${escapeXml(conflict.summary || `Latest intelligence events for ${conflict.name}`)}</description>`,
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
      'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
    },
  });
}
