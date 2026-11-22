// VORTEX CLASH — configuration: suits, lanes, scoring, layout.
// One clear job: every tunable number and colour lives here so the rest
// of the game reads them instead of hard-coding magic values.
export const CANVAS_W = 1280;
export const CANVAS_H = 720;

export const WIN_SCORE = 20;
export const HAND_SIZE = 5;
export const CARD_VALUES = [1, 2, 3, 4, 5, 6];
export const COPIES_PER_CARD = 2;

// A suit is told apart by colour AND shape, never by text alone.
export const SUITS = {
  ember: {
    key: 'ember',
    name: 'Ember',
    color: '#e8442e',
    dark: '#8f1d10',
    light: '#ff8a5c',
    glow: 'rgba(232, 68, 46, 0.55)',
    shape: 'flame',
    power: 'Draw',
    powerText: 'loser draws a card',
  },
  gale: {
    key: 'gale',
    name: 'Gale',
    color: '#f2b705',
    dark: '#8a6500',
    light: '#ffd94d',
    glow: 'rgba(242, 183, 5, 0.55)',
    shape: 'swirl',
    power: 'Lock',
    powerText: 'loser locks a lane',
  },
  tide: {
    key: 'tide',
    name: 'Tide',
    color: '#2e86e8',
    dark: '#124a8a',
    light: '#6db3ff',
    glow: 'rgba(46, 134, 232, 0.55)',
    shape: 'wave',
    power: 'Shift',
    powerText: 'loser shifts the win',
  },
};

export const SUIT_ORDER = ['ember', 'gale', 'tide'];

// Lane point values: what the clash winner banks when the lane is won.
export const LANE_POINTS = { ember: 3, gale: 2, tide: 4 };

// The rival's readable stances: telegraphed above its committed lane
// before the player picks, so the counter-play is visible in a still image.
export const STANCES = {
  aggressive: { key: 'aggressive', name: 'AGGRESSIVE', color: '#ff5a4e', icon: 'sword' },
  control: { key: 'control', name: 'CONTROL', color: '#f2b705', icon: 'lock' },
  tricky: { key: 'tricky', name: 'TRICKY', color: '#6db3ff', icon: 'mask' },
};

// Layout geometry for the 1280x720 table.
export const LAYOUT = {
  topBarH: 64,
  aiRowY: 84,
  aiCardH: 104,
  lanesY: 216,
  laneH: 268,
  laneGap: 18,
  laneW: 372,
  handY: 512,
  cardW: 118,
  cardH: 164,
  cardGap: 14,
  msgY: 692,
};

export function laneX(index) {
  const total = LAYOUT.laneW * 3 + LAYOUT.laneGap * 2;
  const startX = (CANVAS_W - total) / 2;
  return startX + index * (LAYOUT.laneW + LAYOUT.laneGap);
}

export function laneCenterX(index) {
  return laneX(index) + LAYOUT.laneW / 2;
}

export function handX(index, count) {
  const total = LAYOUT.cardW * count + LAYOUT.cardGap * (count - 1);
  const startX = (CANVAS_W - total) / 2;
  return startX + index * (LAYOUT.cardW + LAYOUT.cardGap);
}
