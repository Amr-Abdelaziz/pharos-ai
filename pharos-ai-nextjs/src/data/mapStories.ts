export interface StoryEvent {
  time: string;   // ISO timestamp
  label: string;
  type: 'STRIKE' | 'RETALIATION' | 'INTEL' | 'NAVAL' | 'POLITICAL';
}

export interface MapStory {
  id: string;
  title: string;
  tagline: string;
  iconName: string;       // lucide-react icon name
  category: 'STRIKE' | 'RETALIATION' | 'NAVAL' | 'INTEL' | 'DIPLOMATIC';
  narrative: string;
  highlightStrikeIds: string[];
  highlightMissileIds: string[];
  highlightTargetIds: string[];
  highlightAssetIds: string[];
  viewState: { longitude: number; latitude: number; zoom: number };
  keyFacts: string[];
  timestamp: string;      // ISO — primary story moment (used on timeline)
  events: StoryEvent[];   // chronological beats within this story
}

export const MAP_STORIES: MapStory[] = [
  {
    id: 'carrier-corridor',
    title: 'Three-Carrier Corridor',
    tagline: 'Largest US naval concentration in the Gulf since 2003',
    iconName: 'Ship',
    category: 'NAVAL',
    narrative:
      'The United States pre-positioned three carrier strike groups in a 3,000km arc from the Red Sea to the Arabian Sea — the largest US naval concentration in the Middle East since the 2003 Iraq invasion. USS Gerald R. Ford (CVN-78) in the Gulf of Oman provided the primary strike platform. USS Dwight D. Eisenhower (CVN-69) in the Red Sea provided ballistic missile defense coverage for Israel. USS Theodore Roosevelt (CVN-71) in the Arabian Sea served as quick reaction force.',
    highlightStrikeIds: [],
    highlightMissileIds: [],
    highlightTargetIds: [],
    highlightAssetIds: ['a1', 'a2', 'a3'],
    viewState: { longitude: 57.0, latitude: 20.0, zoom: 4.0 },
    keyFacts: [
      '3 carrier strike groups — CVN-78, CVN-69, CVN-71',
      'Combined air wing: ~250 F/A-18, F-35C aircraft',
      'Largest US naval presence in region since 2003',
      'CSGs positioned to cover Red Sea, Gulf of Oman, Arabian Sea',
    ],
    timestamp: '2026-02-28T18:00:00Z',
    events: [
      { time: '2026-02-27T06:00:00Z', label: 'USS Eisenhower ordered from Mediterranean to Red Sea', type: 'NAVAL' },
      { time: '2026-02-28T12:00:00Z', label: 'USS Ford CSG arrives Gulf of Oman — battle stations', type: 'NAVAL' },
      { time: '2026-02-28T15:00:00Z', label: 'USS Roosevelt ordered to Arabian Sea QRF posture', type: 'NAVAL' },
      { time: '2026-02-28T18:00:00Z', label: '3-CSG posture confirmed — SECDEF and CENTCOM briefed', type: 'INTEL' },
      { time: '2026-03-01T02:00:00Z', label: 'All three CSGs at battle stations, air wings launched', type: 'NAVAL' },
    ],
  },
  {
    id: 'b2-sortie',
    title: 'The Long Arm: B-2 Spirit Sortie',
    tagline: 'Diego Garcia to Iranian heartland — 7,000km each way',
    iconName: 'Plane',
    category: 'STRIKE',
    narrative:
      'Five B-2 Spirit stealth bombers launched from Diego Garcia (BIOT) carrying 14 GBU-57 Massive Ordnance Penetrators — the only conventional weapon capable of destroying hardened underground facilities like Fordow. The round-trip mission exceeded 14,000km, requiring multiple aerial refuelings over the Indian Ocean. This represents the longest combat strike mission in US Air Force history.',
    highlightStrikeIds: ['s1', 's2', 's3', 's4', 's5'],
    highlightMissileIds: [],
    highlightTargetIds: ['t1', 't2', 't3', 't4', 't5'],
    highlightAssetIds: ['a13'],
    viewState: { longitude: 62.0, latitude: 14.0, zoom: 3.5 },
    keyFacts: [
      '5x B-2 Spirit stealth bombers deployed',
      '14x GBU-57 Massive Ordnance Penetrators used',
      'Fordow, Natanz, Parchin, Arak all confirmed destroyed',
      '14,000km round trip — longest combat strike in USAF history',
    ],
    timestamp: '2026-03-01T02:00:00Z',
    events: [
      { time: '2026-02-28T20:00:00Z', label: 'B-2s depart Diego Garcia, fuel loads and MOP payloads confirmed', type: 'STRIKE' },
      { time: '2026-02-28T23:30:00Z', label: 'Aerial refueling completed over Indian Ocean — 3x KC-135 tankers', type: 'STRIKE' },
      { time: '2026-03-01T01:45:00Z', label: 'Iranian airspace penetrated — zero radar detection', type: 'INTEL' },
      { time: '2026-03-01T02:14:00Z', label: 'First GBU-57 MOPs released over Fordow underground facility', type: 'STRIKE' },
      { time: '2026-03-01T02:31:00Z', label: 'All 5 targets struck — B-2s begin egress south over Arabian Sea', type: 'STRIKE' },
    ],
  },
  {
    id: 'idf-deep-strike',
    title: 'IDF Deep Strike Package',
    tagline: 'Israeli Air Force strikes deepest into Iran ever recorded',
    iconName: 'Zap',
    category: 'STRIKE',
    narrative:
      "The Israeli Air Force conducted the most ambitious strike package in its history, with F-35I Adir jets flying 1,800km into Iran to strike Tabriz missile production facilities — well beyond any previous IDF operation. Simultaneously, F-15I Ra'am aircraft hit Shahid Nojeh AFB and the nuclear cluster. Operation Roaring Lion was synchronized to the minute with US B-2 strikes to overwhelm Iranian air defenses.",
    highlightStrikeIds: ['s6', 's7', 's8', 's9', 's10', 's11', 's12'],
    highlightMissileIds: [],
    highlightTargetIds: ['t1', 't2', 't3', 't9', 't12'],
    highlightAssetIds: ['a4', 'a5', 'a6', 'a7'],
    viewState: { longitude: 42.0, latitude: 34.0, zoom: 5.0 },
    keyFacts: [
      'F-35I Adir jets struck Tabriz — 1,800km from Israeli bases',
      'Deepest IDF strike ever recorded — surpasses 1981 Osirak',
      'Operation Roaring Lion synchronized to-the-minute with US B-2s',
      '7 nuclear/military sites neutralized by IDF alone',
    ],
    timestamp: '2026-03-01T02:14:00Z',
    events: [
      { time: '2026-02-28T23:00:00Z', label: 'F-35I Adir jets depart Nevatim AFB — full radio silence', type: 'STRIKE' },
      { time: '2026-03-01T01:30:00Z', label: 'F-35Is enter Iranian airspace from western corridor', type: 'STRIKE' },
      { time: '2026-03-01T02:14:00Z', label: 'Tabriz missile production facility struck — synchronized with B-2s', type: 'STRIKE' },
      { time: '2026-03-01T02:19:00Z', label: 'Shahid Nojeh AFB runways cratered — Iranian air force grounded', type: 'STRIKE' },
      { time: '2026-03-01T03:10:00Z', label: 'All IDF aircraft clear Iranian airspace — RTB confirmed', type: 'INTEL' },
    ],
  },
  {
    id: 'nuclear-kill-chain',
    title: 'Nuclear Kill Chain',
    tagline: "Iran's entire nuclear program neutralized in 4 hours",
    iconName: 'Radiation',
    category: 'STRIKE',
    narrative:
      "In a coordinated 4-hour window, the US and Israel systematically struck every significant node of Iran's nuclear program. Fordow's underground centrifuge halls — buried 80m under a mountain — were destroyed by GBU-57 MOPs. Natanz's A-hall and B-hall were obliterated. The Arak IR-40 heavy water reactor, Bushehr power plant, and Isfahan's UCF were simultaneously hit. IAEA Director Grossi called it 'the most consequential event in nuclear non-proliferation history.'",
    highlightStrikeIds: ['s1', 's2', 's3', 's6', 's7', 's8', 's9', 's10'],
    highlightMissileIds: [],
    highlightTargetIds: ['t1', 't2', 't3', 't5', 't6', 't16'],
    highlightAssetIds: ['a4', 'a13'],
    viewState: { longitude: 51.5, latitude: 33.5, zoom: 5.5 },
    keyFacts: [
      'All 6 major nuclear facilities struck simultaneously',
      'Fordow destroyed — 14x GBU-57 MOPs penetrated 80m of rock',
      'IAEA emergency session called by Russia and China',
      "Iran's breakout capability estimated at 25+ years to rebuild",
    ],
    timestamp: '2026-03-01T02:14:00Z',
    events: [
      { time: '2026-03-01T02:14:00Z', label: 'Fordow struck — GBU-57 MOPs penetrate 80m of reinforced bedrock', type: 'STRIKE' },
      { time: '2026-03-01T02:17:00Z', label: 'Natanz A-hall and B-hall destroyed — all centrifuge cascades gone', type: 'STRIKE' },
      { time: '2026-03-01T02:22:00Z', label: 'Isfahan UCF and Arak IR-40 heavy water reactor simultaneously struck', type: 'STRIKE' },
      { time: '2026-03-01T02:35:00Z', label: 'Parchin explosives research complex destroyed', type: 'STRIKE' },
      { time: '2026-03-01T06:30:00Z', label: 'IAEA Director Grossi requests emergency Board of Governors session', type: 'POLITICAL' },
    ],
  },
  {
    id: 'three-front-retaliation',
    title: 'Three-Front Retaliation',
    tagline: 'Iran strikes US bases across 5 Gulf nations simultaneously',
    iconName: 'Crosshair',
    category: 'RETALIATION',
    narrative:
      "Iran's retaliation was calibrated to maximize US casualties across multiple fronts simultaneously — a deliberate strategy to force American withdrawal from the region. Within 90 minutes of the initial strikes, IRGC ballistic missiles hit NSA Bahrain (2 US KIA), Al Udeid Qatar (1 US KIA), Al Dhafra UAE, Prince Sultan AB Saudi Arabia, and Ali Al Salem Kuwait. The coordinated salvo demonstrated pre-planned targeting packages for every US base in theater.",
    highlightStrikeIds: [],
    highlightMissileIds: ['m4', 'm5', 'm6', 'm7', 'm12'],
    highlightTargetIds: [],
    highlightAssetIds: ['a8', 'a9', 'a10', 'a11', 'a12'],
    viewState: { longitude: 51.5, latitude: 26.0, zoom: 5.0 },
    keyFacts: [
      '5 US bases hit in simultaneous IRGC salvo',
      'NSA Bahrain: 2 US KIA — 5th Fleet HQ struck',
      'Al Udeid Qatar: 1 US KIA — CENTCOM FWD HQ struck',
      'Iran pre-planned targeting packages for all regional US bases',
    ],
    timestamp: '2026-03-01T03:42:00Z',
    events: [
      { time: '2026-03-01T03:42:00Z', label: 'IRGC ballistic missiles detected departing Iran — multiple launch points', type: 'INTEL' },
      { time: '2026-03-01T03:47:00Z', label: 'NSA Bahrain (5th Fleet HQ) struck — 2 US KIA, fire on pier', type: 'RETALIATION' },
      { time: '2026-03-01T03:49:00Z', label: 'Al Udeid Qatar struck — 1 US KIA, hangar fire, F-15E damaged', type: 'RETALIATION' },
      { time: '2026-03-01T03:52:00Z', label: 'Al Dhafra UAE and Prince Sultan AB Saudi hit — casualties reported', type: 'RETALIATION' },
      { time: '2026-03-01T04:10:00Z', label: 'IRGC state TV: "Complete success against aggressor bases"', type: 'POLITICAL' },
    ],
  },
  {
    id: 'hormuz-gambit',
    title: 'The Hormuz Gambit',
    tagline: '20% of global oil supply choked — markets in freefall',
    iconName: 'Anchor',
    category: 'NAVAL',
    narrative:
      "Within hours of the strikes, IRGC Navy forces moved to close the Strait of Hormuz — the chokepoint through which 20% of global oil supply transits daily. Over 200 vessels anchored at the strait's approaches as IRGC fast boats and sea mines created an exclusion zone. Brent crude surged 35% in pre-market trading. USS Gerald R. Ford's strike group responded with Tomahawk strikes on IRGC naval facilities at Bandar Abbas.",
    highlightStrikeIds: ['s13', 's14'],
    highlightMissileIds: [],
    highlightTargetIds: ['t10', 't11'],
    highlightAssetIds: ['a1', 'a12'],
    viewState: { longitude: 57.0, latitude: 27.0, zoom: 6.0 },
    keyFacts: [
      'Strait of Hormuz formally closed to commercial traffic',
      "200+ vessels anchored — Lloyd's of London war risk +400%",
      'Oil surged 35% — Brent crude hit $147/barrel',
      'USS Gerald R. Ford CSG engaged IRGC naval forces',
    ],
    timestamp: '2026-03-01T05:30:00Z',
    events: [
      { time: '2026-03-01T04:00:00Z', label: 'IRGC Navy activates Hormuz exclusion protocol — fast boats deployed', type: 'NAVAL' },
      { time: '2026-03-01T04:15:00Z', label: 'First commercial vessel (Maersk Kotka) turned back at gunpoint', type: 'NAVAL' },
      { time: '2026-03-01T05:00:00Z', label: 'Maersk, CMA CGM suspend all Gulf transits — 200+ vessels anchor', type: 'NAVAL' },
      { time: '2026-03-01T05:30:00Z', label: 'Brent crude +27% — NYSE circuit breakers triggered at open', type: 'POLITICAL' },
      { time: '2026-03-01T07:30:00Z', label: 'USS Ford launches Tomahawk salvo against IRGC Bandar Abbas', type: 'STRIKE' },
    ],
  },
  {
    id: 'khamenei-last-hours',
    title: "Khamenei's Last Hours",
    tagline: 'Supreme Leader killed — regime decapitated in 90 minutes',
    iconName: 'Skull',
    category: 'INTEL',
    narrative:
      "Intelligence indicates Khamenei was in his reinforced compound in northern Tehran when B-2-delivered bunker busters struck at 02:14 local time. Iranian state media initially denied his death, but IRGC commanders began communicating via emergency protocols within 20 minutes — a pattern consistent with loss of central command. At 06:47 local time, IRNA confirmed: 'The Supreme Leader has been martyred.' Iranians took to the streets in celebration.",
    highlightStrikeIds: ['s5'],
    highlightMissileIds: [],
    highlightTargetIds: ['t7', 't8', 't17'],
    highlightAssetIds: ['a13'],
    viewState: { longitude: 51.4, latitude: 35.7, zoom: 9.0 },
    keyFacts: [
      'Khamenei killed at 02:14 local time — compound struck by B-2',
      'IRGC emergency comms pattern detected within 20 mins of strike',
      'IRNA confirmed death at 06:47 — 4.5 hours after strike',
      "Iranians celebrate in Tehran streets — 'regime decapitation' achieved",
    ],
    timestamp: '2026-03-01T06:47:00Z',
    events: [
      { time: '2026-03-01T01:55:00Z', label: 'B-2 Spirit releases GBU-57 payload over northern Tehran', type: 'STRIKE' },
      { time: '2026-03-01T02:14:00Z', label: 'Khamenei compound struck — communications go dark', type: 'STRIKE' },
      { time: '2026-03-01T02:34:00Z', label: 'IRGC activates emergency succession protocol — SIGINT detected', type: 'INTEL' },
      { time: '2026-03-01T04:00:00Z', label: 'IRNA initial denial: "Supreme Leader is safe and in command"', type: 'POLITICAL' },
      { time: '2026-03-01T06:47:00Z', label: 'IRNA confirms: "The Supreme Leader has been martyred"', type: 'INTEL' },
    ],
  },
];
