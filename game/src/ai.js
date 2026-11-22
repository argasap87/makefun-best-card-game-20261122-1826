// VORTEX CLASH — the rival AI: stance, then a committed card + lane.
// One clear job: decide what NEXA does. The stance is telegraphed to the
// player before they pick, so the AI is readable and counterable.
import { LANE_POINTS, SUIT_ORDER } from './config.js';

// Pick a stance for the round. Aggressive when ahead or tied, Control when
// the player leads a lane by a lot, Tricky when behind — with a seeded
// wobble so the rival is not perfectly predictable.
export function chooseStance(match, rand) {
  const diff = match.scores.you - match.scores.ai;
  const roll = rand();
  if (diff >= 6 && roll < 0.55) return 'control';
  if (diff <= -4 && roll < 0.55) return 'tricky';
  if (roll < 0.45) return 'aggressive';
  if (roll < 0.72) return 'control';
  return 'tricky';
}

// Commit one card to one open lane, following the stance.
export function choosePlay(match, hand, stance, rand) {
  const openLanes = SUIT_ORDER.filter((s) => !match.locked[s]);
  const lanes = openLanes.length ? openLanes : SUIT_ORDER;
  const byValueDesc = hand.slice().sort((a, b) => b.value - a.value);
  const byValueAsc = hand.slice().sort((a, b) => a.value - b.value);

  if (stance === 'aggressive') {
    // Highest card into the richest open lane it can win.
    const card = byValueDesc[0];
    const lane = richestLane(match, lanes);
    return { card, lane };
  }

  if (stance === 'control') {
    // A Gale card if held, into the lane the player leads most — the lock
    // that follows will freeze that lead. Otherwise the highest card.
    const gale = hand.find((c) => c.suit === 'gale');
    if (gale) return { card: gale, lane: playerLeadLane(match, lanes) };
    const card = byValueDesc[0];
    return { card, lane: playerLeadLane(match, lanes) };
  }

  // Tricky: the lowest Tide card, played to lose on purpose and trigger
  // the Shift — the win slides into a cheaper lane.
  const tide = byValueAsc.find((c) => c.suit === 'tide');
  if (tide) return { card: tide, lane: richestLane(match, lanes) };
  const card = byValueAsc[0];
  return { card, lane: richestLane(match, lanes) };
}

export function richestLane(match, lanes) {
  let best = lanes[0];
  for (const lane of lanes) {
    const value = LANE_POINTS[lane] * (match.overloads[lane] ? 2 : 1);
    const bestValue = LANE_POINTS[best] * (match.overloads[best] ? 2 : 1);
    if (value > bestValue) best = lane;
  }
  return best;
}

// The lane where the player leads the rival by the most banked points.
export function playerLeadLane(match, lanes) {
  let best = lanes[0];
  let bestLead = -Infinity;
  for (const lane of lanes) {
    const lead = (match.laneScore.you[lane] || 0) - (match.laneScore.ai[lane] || 0);
    if (lead > bestLead) {
      best = lane;
      bestLead = lead;
    }
  }
  return best;
}

// A one-line read of the rival's plan, shown under its stance icon.
export function stanceHint(stance) {
  if (stance === 'aggressive') return 'plays big — beat its number';
  if (stance === 'control') return 'plays Gale — guards its lead';
  return 'plays low Tide — wants the Shift';
}
