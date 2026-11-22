// VORTEX CLASH — the rules: clash resolution, suit powers, overloads.
// One clear job: pure functions over a small state shape; no drawing, no input.
//
// The core bet: the HIGHER value wins the lane's points, but the LOWER
// value fires its suit power. Losing on purpose is a legitimate play.
// A tie is an Overload: both cards are destroyed and the lane's point
// value doubles for the rest of the match.
import { LANE_POINTS, SUITS, WIN_SCORE } from './config.js';

export function lanePointValue(state, suit) {
  const base = LANE_POINTS[suit];
  return state.overloads[suit] ? base * 2 : base;
}

// Compare one clash. Returns a plain description of what happened.
export function resolveClash(youCard, aiCard, laneSuit, state) {
  if (youCard.value === aiCard.value) {
    return {
      kind: 'overload',
      winner: null,
      loser: null,
      points: 0,
      lane: laneSuit,
      text: `OVERLOAD! ${youCard.value} meets ${aiCard.value} — both cards shatter and ${SUITS[laneSuit].name} doubles to ${lanePointValue(state, laneSuit) * 2} pts.`,
    };
  }
  const youWin = youCard.value > aiCard.value;
  const winnerCard = youWin ? youCard : aiCard;
  const loserCard = youWin ? aiCard : youCard;
  const points = lanePointValue(state, laneSuit);
  return {
    kind: 'clash',
    winner: youWin ? 'you' : 'ai',
    loser: youWin ? 'ai' : 'you',
    winnerCard,
    loserCard,
    points,
    lane: laneSuit,
    text: '',
  };
}

// Apply the loser's suit power. Returns { text, effect } describing it.
// - Ember: the loser draws a card.
// - Gale: the loser locks the lane where its opponent leads most.
// - Tide: the loser shifts the winner's points into the cheaper adjacent lane.
export function applyLoserPower(state, clash) {
  const loserCard = clash.loserCard;
  const suit = loserCard.suit;
  const loser = clash.loser;
  const winner = clash.winner;

  if (suit === 'ember') {
    return {
      effect: { type: 'draw', who: loser, count: 1 },
      text: `Ember power — ${loser === 'you' ? 'you' : 'NEXA'} lost with Ember and draw${loser === 'you' ? '' : 's'} a card.`,
    };
  }

  if (suit === 'gale') {
    const target = laneToLock(state, winner);
    if (!target) {
      return { effect: null, text: 'Gale power — the last open lane cannot be locked.' };
    }
    return {
      effect: { type: 'lock', lane: target },
      text: `Gale power — ${loser === 'you' ? 'you' : 'NEXA'} lost with Gale and lock${loser === 'you' ? '' : 's'} the ${SUITS[target].name} lane.`,
    };
  }

  // Tide: shift the winner's points to the cheaper neighbouring lane.
  const neighbours = adjacentLanes(clash.lane);
  let cheapest = neighbours[0];
  for (const n of neighbours) {
    if (lanePointValue(state, n) < lanePointValue(state, cheapest)) cheapest = n;
  }
  return {
    effect: { type: 'shift', from: clash.lane, to: cheapest },
    text: `Tide power — ${loser === 'you' ? 'you' : 'NEXA'} lost with Tide and shift${loser === 'you' ? '' : 's'} the win from ${SUITS[clash.lane].name} (${lanePointValue(state, clash.lane)} pts) to ${SUITS[cheapest].name} (${lanePointValue(state, cheapest)} pts).`,
  };
}

export function adjacentLanes(suit) {
  const order = ['ember', 'gale', 'tide'];
  const i = order.indexOf(suit);
  const out = [];
  if (i > 0) out.push(order[i - 1]);
  if (i < order.length - 1) out.push(order[i + 1]);
  return out;
}

// The lane the Gale loser locks: the one where the clash winner leads most
// (and is not already locked); ties fall to the highest-value open lane.
// The last open lane can never be locked — a match must always have a lane
// left to play in.
export function laneToLock(state, winner) {
  const order = ['ember', 'gale', 'tide'];
  const open = order.filter((suit) => !state.locked[suit]);
  if (open.length <= 1) return null;
  let best = null;
  let bestLead = -Infinity;
  for (const suit of open) {
    const lead = (state.laneScore[winner][suit] || 0) - (state.laneScore[winner === 'you' ? 'ai' : 'you'][suit] || 0);
    if (lead > bestLead || (lead === bestLead && best !== null && LANE_POINTS[suit] > LANE_POINTS[best])) {
      best = suit;
      bestLead = lead;
    }
  }
  return best;
}

export function freshMatchState() {
  return {
    round: 1,
    scores: { you: 0, ai: 0 },
    laneScore: { you: { ember: 0, gale: 0, tide: 0 }, ai: { ember: 0, gale: 0, tide: 0 } },
    overloads: { ember: false, gale: false, tide: false },
    locked: { ember: false, gale: false, tide: false },
    overloadCount: 0,
    powersFired: 0,
    clashes: 0,
  };
}

export function matchWinner(state) {
  if (state.scores.you >= WIN_SCORE) return 'you';
  if (state.scores.ai >= WIN_SCORE) return 'ai';
  return null;
}
