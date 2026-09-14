/* ===================== Level Manager =====================
   Five levels, each themed around its own good deed. They all share
   one safe structural pattern (see buildLevel below) so every level is
   guaranteed completable by all four characters -- ability-based
   "shortcuts" save real time but never create a hard soft-lock, since
   there's always a slightly slower route everyone can take. Only Level
   5 adds the fully cooperative Teamwork Gate near its end.

   Each level is themed differently (colors, decorations, good deed) so
   the five feel distinct while sharing one well-tested layout shape --
   see the README for that scoping note. */

const TOKEN_KINDS = ['kindness', 'helping', 'patience', 'teamwork'];

function collectibleRow(startX, y, count, spacingX){
  const items = [];
  for(let i = 0; i < count; i++){
    items.push({ id: 'c' + startX + '-' + i, x: startX + i * spacingX, y, kind: TOKEN_KINDS[i % TOKEN_KINDS.length], taken: false });
  }
  return items;
}

function buildLevel(cfg){
  const L = cfg.length;
  return {
    id: cfg.id,
    name: cfg.name,
    goodDeedId: cfg.goodDeedId,
    theme: cfg.theme,
    length: L,
    finishX: L - 150,

    groundGaps: [
      { x1: 480, x2: 570 },   // small, jumpable by anyone
      { x1: cfg.wideGapX, x2: cfg.wideGapX + 230 } // wide -- Layla flies it, others wait for the platform
    ],

    platforms: [
      // Small staircase ("hills") near the start.
      { x: 250, y: 350, width: 90 },
      { x: 360, y: 310, width: 90 },
      // A bridge across a decorative river.
      { x: cfg.bridgeX, y: 380, width: 160 },
      // The wide-gap crossing: a slow shuttle platform everyone but Layla can wait for.
      { id: 'shuttle', x: cfg.wideGapX, y: 380, width: 80, moving: { axis: 'x', range: [cfg.wideGapX, cfg.wideGapX + 150], speed: 0.6 } },
      // The "go over the top" detour around the rock/gate shortcut: two
      // platforms well above the blocker's height, so anyone can hop
      // over it (a little slower) while Malik/Amira just go straight
      // through at ground level once it's cleared.
      { x: cfg.hillX - 110, y: 330, width: 50 },
      { x: cfg.hillX - 30, y: 260, width: 140 }
    ],

    springs: [
      { x: cfg.hillX + 260, y: 400, width: 40 },
      { x: L - 900, y: 400, width: 40 }
    ],

    rocks: cfg.shortcut === 'rock' ? [{ id: 'rock1', x: cfg.hillX, y: 400, width: 46, height: 90, broken: false }] : [],
    walls: [],

    switches: cfg.shortcut === 'switch' ? [{ id: 'sw1', x: cfg.hillX - 90, y: 400, activated: false }] : [],
    gates: cfg.shortcut === 'switch' ? [{ id: 'gate1', switchId: 'sw1', x: cfg.hillX, y1: 310, y2: 400, width: 46 }] : [],

    waterZones: [{ x1: cfg.bridgeX - 20, x2: cfg.bridgeX + 180 }],
    hazards: [{ x1: cfg.hazardX, x2: cfg.hazardX + 70 }],

    checkpoints: [
      { id: 'cp1', x: Math.round(L * 0.35) },
      { id: 'cp2', x: Math.round(L * 0.7) }
    ],

    collectibles: [
      ...collectibleRow(300, 300, 3, 45),
      ...collectibleRow(cfg.hillX + 40, 260, 3, 40),
      ...collectibleRow(cfg.wideGapX + 40, 200, 3, 40),
      ...collectibleRow(L - 700, 320, 4, 45)
    ],

    teamworkGate: cfg.teamwork ? {
      x: L - 400,
      y1: 250, y2: 400,
      completed: false,
      parts: [
        { ability: 'speed', x: L - 700, y: 400, done: false },
        { ability: 'flight', x: L - 600, y: 260, done: false },
        { ability: 'power', x: L - 500, y: 400, done: false, rockId: 'teamRock' },
        { ability: 'hammer', x: L - 420, y: 400, done: false, switchId: 'teamSwitch' }
      ]
    } : null,

    decor: cfg.decor
  };
}

export const LEVELS = [
  buildLevel({
    id: 'kindness-park', name: 'Kindness Park', goodDeedId: 'help-someone',
    length: 2800, wideGapX: 1550, bridgeX: 950, hillX: 1200, hazardX: 2350, shortcut: 'rock',
    theme: { sky: ['#bfe8ff', '#eafff0'], ground: '#8fd18a', accent: '#2e6b58' },
    decor: ['🌳', '🌼', '⛲', '🌉']
  }),
  buildLevel({
    id: 'sharing-village', name: 'Sharing Village', goodDeedId: 'share-food',
    length: 2900, wideGapX: 1600, bridgeX: 1000, hillX: 1250, hazardX: 2400, shortcut: 'switch',
    theme: { sky: ['#ffe1b3', '#fff6e0'], ground: '#e0b978', accent: '#a97c25' },
    decor: ['🏠', '🌴', '🧺', '🌐']
  }),
  buildLevel({
    id: 'clean-community', name: 'Clean Community', goodDeedId: 'clean-park',
    length: 2800, wideGapX: 1550, bridgeX: 950, hillX: 1200, hazardX: 2350, shortcut: 'rock',
    theme: { sky: ['#cdeaff', '#f0faff'], ground: '#9fd6a0', accent: '#1f7a52' },
    decor: ['🏞️', '🗑️', '🌿', '♻️']
  }),
  buildLevel({
    id: 'caring-for-nature', name: 'Caring for Nature', goodDeedId: 'plant-tree',
    length: 3000, wideGapX: 1650, bridgeX: 1050, hillX: 1300, hazardX: 2450, shortcut: 'switch',
    theme: { sky: ['#d7f0d0', '#eefaf0'], ground: '#7db877', accent: '#2e6b58' },
    decor: ['🌲', '🌺', '💧', '⛰️']
  }),
  buildLevel({
    id: 'helping-friends', name: 'Helping Friends', goodDeedId: 'help-friend',
    length: 3300, wideGapX: 1700, bridgeX: 1100, hillX: 1350, hazardX: 2500, shortcut: 'rock', teamwork: true,
    theme: { sky: ['#e6d7ff', '#f6efff'], ground: '#c9b892', accent: '#6b5a3f' },
    decor: ['⛰️', '🌲', '🪨', '🌈']
  })
];

// The teamwork level needs its own dedicated rock/switch for the gate's
// "power" and "hammer" parts, separate from the level's normal shortcut.
const teamworkLevel = LEVELS.find(l => l.teamworkGate);
if(teamworkLevel){
  teamworkLevel.rocks.push({ id: 'teamRock', x: teamworkLevel.length - 520, y: 400, width: 46, height: 90, broken: false });
  teamworkLevel.switches.push({ id: 'teamSwitch', x: teamworkLevel.length - 440, y: 400, activated: false });
}

export function getLevel(id){
  return LEVELS.find(l => l.id === id) || LEVELS[0];
}

export function getLevelIndex(id){
  return LEVELS.findIndex(l => l.id === id);
}

export function resetLevelState(level){
  (level.rocks || []).forEach(r => { r.broken = false; });
  (level.switches || []).forEach(s => { s.activated = false; });
  (level.collectibles || []).forEach(c => { c.taken = false; });
  if(level.teamworkGate){
    level.teamworkGate.completed = false;
    level.teamworkGate.parts.forEach(p => { p.done = false; });
  }
}

const MOVING_PLATFORM_PERIOD = 3.2;
export function updateMovingPlatforms(level, dt, elapsed){
  (level.platforms || []).forEach(p => {
    if(!p.moving) return;
    const [a, b] = p.moving.range;
    const phase = (Math.sin(elapsed * p.moving.speed) + 1) / 2;
    const newX = a + (b - a) * phase;
    p._dx = newX - p.x;
    p.x = newX;
  });
}
