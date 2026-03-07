export const BRIEF_SOURCES = [
  { name: 'Reuters',                     tier: 1, note: 'Primary wire coverage — Tel Aviv, Tehran, Washington, Muscat' },
  { name: 'New York Times',              tier: 1, note: 'Investigative sourcing + senior Pentagon readouts' },
  { name: 'Associated Press',            tier: 1, note: 'Casualty figures, diplomatic wires, Pakistan protests' },
  { name: 'CENTCOM official statements', tier: 1, note: 'US KIA, strike footage, fact-checks, friendly fire disclosure' },
  { name: 'IDF Spokesperson',            tier: 1, note: 'Strike confirmations, target lists, Northern Front operations' },
  { name: 'NBC News / Richard Engel',    tier: 1, note: 'On-ground reporting, verified footage, Trump interviews' },
  { name: 'The Guardian',                tier: 1, note: 'Live blog, RAF Akrotiri, IAEA, UK govt statements' },
  { name: 'IAEA Director General',       tier: 1, note: 'Nuclear facility safeguards, radiation monitoring, reactor warnings' },
  { name: 'Bloomberg / Javier Blas',     tier: 1, note: 'Energy markets, Ras Tanura shutdown, OPEC+ analysis' },
  { name: 'Al Jazeera',                  tier: 1, note: 'Gulf civilian damage, Iran leadership council, Larijani rejection' },
  { name: 'UK gov.uk / MoD',            tier: 1, note: 'E3 joint statement, RAF Akrotiri response, base authorization' },
  { name: 'IRNA / PressTV (Iran state)', tier: 2, note: 'Iranian claims — treat as propaganda unless corroborated by tier 1' },
  { name: 'Times of Israel',             tier: 2, note: 'Israeli domestic coverage, Beit Shemesh details, northern sirens' },
  { name: 'Kpler / MarineTraffic',       tier: 2, note: 'Strait of Hormuz vessel tracking, tanker strikes' },
  { name: 'Cirium (aviation)',            tier: 2, note: 'Flight cancellation tracking — 6,000+ across 3 days' },
];

export const TIER_C: Record<number, string> = { 1: 'var(--success)', 2: 'var(--warning)' };
