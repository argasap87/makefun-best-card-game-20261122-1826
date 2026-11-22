// VORTEX CLASH — staged screenshot scenes with fixed seeds.
// One clear job: build the exact view each ?shot= scene shows, so the
// screenshots are real renders of the game's own code, deterministic.
import { freshMatchState } from './rules.js';

function baseMatch() {
  const match = freshMatchState();
  match.round = 5;
  match.scores = { you: 12, ai: 9 };
  match.laneScore = {
    you: { ember: 6, gale: 4, tide: 2 },
    ai: { ember: 3, gale: 4, tide: 2 },
  };
  match.overloads = { ember: false, gale: true, tide: false };
  match.locked = { ember: false, gale: false, tide: false };
  match.overloadCount = 1;
  match.powersFired = 3;
  match.clashes = 4;
  return match;
}

function baseView(match) {
  return {
    screen: 'table',
    match,
    hand: [],
    aiHandCount: 5,
    aiCommit: null,
    reveal: null,
    selectedCard: null,
    hoverLane: null,
    message: '',
    lastClash: null,
    laneHistory: { ember: null, gale: null, tide: null },
    deckCount: 18,
    discardCount: 8,
  };
}

// Mid-game table: the cover. Dense, bright, every system visible at once —
// a clash just resolved in Ember, a NEXA win remembered in Gale, an
// Overload doubling Gale, NEXA committed to Tide with an AGGRESSIVE stance,
// and a card selected in the hand.
export function stageTable() {
  const view = baseView(baseMatch());
  view.hand = [
    { id: 101, suit: 'ember', value: 6 },
    { id: 102, suit: 'gale', value: 2 },
    { id: 103, suit: 'tide', value: 5 },
    { id: 104, suit: 'ember', value: 3 },
    { id: 105, suit: 'gale', value: 4 },
  ];
  view.selectedCard = 2;
  view.hoverLane = 'gale';
  view.aiCommit = { card: { id: 201, suit: 'tide', value: 5 }, lane: 'tide', stance: 'aggressive' };
  view.lastClash = {
    lane: 'ember',
    youCard: { id: 106, suit: 'ember', value: 6 },
    aiCard: { id: 202, suit: 'ember', value: 4 },
    winner: 'you',
    points: 3,
    powerText: 'Ember power: NEXA draws a card.',
  };
  view.laneHistory = {
    ember: view.lastClash,
    gale: {
      lane: 'gale',
      youCard: { id: 107, suit: 'gale', value: 2 },
      aiCard: { id: 203, suit: 'gale', value: 5 },
      winner: 'ai',
      points: 4,
    },
    tide: null,
  };
  view.message = 'Round 5 — your Ember 6 beats NEXA’s Ember 4. You bank 3 pts. Ember power: NEXA draws a card.';
  return view;
}

export function stageTitle() {
  const view = baseView(freshMatchState());
  view.screen = 'title';
  return view;
}

export function stageWin() {
  const match = freshMatchState();
  match.round = 9;
  match.scores = { you: 20, ai: 14 };
  match.laneScore = {
    you: { ember: 9, gale: 6, tide: 5 },
    ai: { ember: 6, gale: 4, tide: 4 },
  };
  match.overloads = { ember: false, gale: true, tide: false };
  match.locked = { ember: false, gale: false, tide: true };
  match.overloadCount = 1;
  match.powersFired = 5;
  match.clashes = 8;
  const view = baseView(match);
  view.screen = 'win';
  return view;
}

export function stageLoss() {
  const match = freshMatchState();
  match.round = 9;
  match.scores = { you: 13, ai: 20 };
  match.laneScore = {
    you: { ember: 6, gale: 4, tide: 3 },
    ai: { ember: 9, gale: 5, tide: 6 },
  };
  match.overloads = { ember: true, gale: false, tide: false };
  match.locked = { ember: false, gale: true, tide: false };
  match.overloadCount = 1;
  match.powersFired = 4;
  match.clashes = 8;
  const view = baseView(match);
  view.screen = 'loss';
  return view;
}

export const SHOT_STAGES = { table: stageTable, title: stageTitle, win: stageWin, loss: stageLoss };

export function stageShot(name) {
  const stage = SHOT_STAGES[name];
  return stage ? stage() : null;
}
