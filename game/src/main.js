// VORTEX CLASH — the game loop and state machine.
// One clear job: own the match state, run the turn loop, and hand a view
// object to the renderer every frame. Rules live in rules.js, the rival in
// ai.js, drawing in render.js, input in input.js.
import { CANVAS_W, CANVAS_H, HAND_SIZE, SUIT_ORDER } from './config.js';
import { buildDeck, shuffleDeck, drawCards, sortHand, mulberry32 } from './deck.js';
import { resolveClash, applyLoserPower, freshMatchState, matchWinner, lanePointValue } from './rules.js';
import { chooseStance, choosePlay, stanceHint } from './ai.js';
import { render } from './render.js';
import { attachInput } from './input.js';
import { stageShot } from './shots.js';

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seedParam = Number(params.get('seed') || '1');

const canvas = document.getElementById('table');
const ctx = canvas.getContext('2d');

let audioCtx = null;
function blip(freq, ms, type) {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + ms / 1000);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + ms / 1000);
  } catch (err) {
    // Sound is garnish; a silent browser still plays.
  }
}

// ---- match state ----
const S = {
  screen: 'title',
  match: freshMatchState(),
  deck: [],
  discards: [],
  hand: [],
  aiHand: [],
  aiCommit: null,
  selectedCard: null,
  selectedLane: null,
  hoverLane: null,
  reveal: null,
  lastClash: null,
  // one remembered clash per lane: the table keeps its battle record, so
  // every lane shows what happened there instead of standing empty.
  laneHistory: { ember: null, gale: null, tide: null },
  message: 'Welcome to the vortex. Press START DUEL when you are ready.',
  busy: false,
  rand: mulberry32(1),
};

function refill(hand, who) {
  const want = HAND_SIZE - hand.length;
  if (want > 0) {
    const drawn = drawCards(S.deck, S.discards, want, 1234 + S.match.round * 97);
    hand.push(...drawn);
  }
  if (who === 'you') S.hand = sortHand(S.hand);
}

function beginRound() {
  const stance = chooseStance(S.match, S.rand);
  const play = choosePlay(S.match, S.aiHand, stance, S.rand);
  S.aiHand = S.aiHand.filter((c) => c.id !== play.card.id);
  S.aiCommit = { card: play.card, lane: play.lane, stance };
  S.selectedCard = null;
  S.selectedLane = null;
  S.message = `Round ${S.match.round} — NEXA is ${stance.toUpperCase()} on ${play.lane}. ${stanceHint(stance)}. Pick your card, then a lane.`;
}

function startGame() {
  const seed = (Date.now() % 100000) + 7;
  S.rand = mulberry32(seed);
  S.match = freshMatchState();
  S.deck = shuffleDeck(buildDeck(), seed);
  S.discards = [];
  S.hand = sortHand(drawCards(S.deck, S.discards, HAND_SIZE, seed));
  S.aiHand = drawCards(S.deck, S.discards, HAND_SIZE, seed + 31);
  S.lastClash = null;
  S.laneHistory = { ember: null, gale: null, tide: null };
  S.reveal = null;
  S.busy = false;
  S.screen = 'table';
  beginRound();
  blip(520, 120, 'triangle');
}

function finishReveal() {
  const reveal = S.reveal;
  const match = S.match;
  const clash = resolveClash(reveal.youCard, reveal.aiCard, reveal.lane, match);
  S.discards.push(reveal.youCard, reveal.aiCard);
  match.clashes += 1;

  if (clash.kind === 'overload') {
    match.overloads[reveal.lane] = true;
    match.overloadCount += 1;
    S.lastClash = { lane: reveal.lane, youCard: reveal.youCard, aiCard: reveal.aiCard, winner: null, points: 0 };
    S.laneHistory[reveal.lane] = S.lastClash;
    S.message = clash.text;
    blip(180, 300, 'sawtooth');
  } else {
    const power = applyLoserPower(match, clash);
    let scoredLane = clash.lane;
    let points = clash.points;
    if (power.effect && power.effect.type === 'shift') {
      scoredLane = power.effect.to;
      points = lanePointValue(match, scoredLane);
    }
    if (power.effect && power.effect.type === 'lock') {
      match.locked[power.effect.lane] = true;
    }
    if (power.effect && power.effect.type === 'draw') {
      const target = power.effect.who === 'you' ? S.hand : S.aiHand;
      target.push(...drawCards(S.deck, S.discards, 1, 555 + match.round));
      if (power.effect.who === 'you') S.hand = sortHand(S.hand);
    }
    match.powersFired += 1;
    match.laneScore[clash.winner][scoredLane] += points;
    match.scores[clash.winner] += points;
    const who = clash.winner === 'you' ? 'You' : 'NEXA';
    S.lastClash = { lane: reveal.lane, youCard: reveal.youCard, aiCard: reveal.aiCard, winner: clash.winner, points };
    S.laneHistory[reveal.lane] = S.lastClash;
    S.message = `${who} win${clash.winner === 'you' ? '' : 's'} ${clash.lane} — ${clash.winnerCard.value} beats ${clash.loserCard.value}, ${points} pts to ${scoredLane}. ${power.text}`;
    blip(clash.winner === 'you' ? 740 : 300, 160, 'triangle');
  }

  S.reveal = null;
  S.busy = false;
  const winner = matchWinner(match);
  if (winner) {
    S.screen = winner === 'you' ? 'win' : 'loss';
    S.message = winner === 'you' ? 'VORTEX STABILIZED — you win the duel.' : 'VORTEX COLLAPSED — NEXA wins the duel.';
    blip(winner === 'you' ? 880 : 140, 500, 'triangle');
    return;
  }
  refill(S.hand, 'you');
  refill(S.aiHand, 'ai');
  match.round += 1;
  beginRound();
}

// ---- the game API input.js calls ----
const game = {
  screen: () => S.screen,
  busy: () => S.busy,
  hand: () => S.hand,
  setHoverLane: (lane) => { S.hoverLane = lane; },
  selectCard: (index) => {
    if (S.screen !== 'table' || S.busy) return;
    if (index === null) { S.selectedCard = null; return; }
    S.selectedCard = S.selectedCard === index ? null : index;
    if (S.selectedCard !== null) blip(660, 60, 'sine');
  },
  selectLane: (lane) => {
    if (S.screen !== 'table' || S.busy) return;
    if (S.selectedCard === null) {
      S.message = 'Pick a card from your hand first, then a lane.';
      return;
    }
    if (S.match.locked[lane]) {
      S.message = `The ${lane} lane is locked — no more cards there. Pick another lane.`;
      return;
    }
    S.selectedLane = lane;
    game.confirmPlay();
  },
  cycleLane: (dir) => {
    if (S.selectedCard === null) return;
    const current = S.selectedLane ? SUIT_ORDER.indexOf(S.selectedLane) : -1;
    const next = (current + dir + 3) % 3;
    S.selectedLane = SUIT_ORDER[next];
  },
  confirmPlay: () => {
    if (S.screen !== 'table' || S.busy) return;
    if (S.selectedCard === null || S.selectedLane === null) return;
    if (S.match.locked[S.selectedLane]) {
      S.message = `The ${S.selectedLane} lane is locked — no more cards there. Pick another lane.`;
      return;
    }
    const youCard = S.hand[S.selectedCard];
    S.hand = S.hand.filter((c) => c.id !== youCard.id);
    S.reveal = { youCard, aiCard: S.aiCommit.card, lane: S.selectedLane, t: 0 };
    S.busy = true;
    S.selectedCard = null;
    S.selectedLane = null;
    blip(440, 90, 'triangle');
  },
  startGame,
  playAgain: () => startGame(),
};

function buildView() {
  return {
    screen: S.screen,
    match: S.match,
    hand: S.hand,
    aiHandCount: S.aiHand.length,
    aiCommit: S.aiCommit,
    reveal: S.reveal,
    selectedCard: S.selectedCard,
    hoverLane: S.hoverLane,
    message: S.message,
    lastClash: S.lastClash,
    laneHistory: S.laneHistory,
    deckCount: S.deck.length,
    discardCount: S.discards.length,
  };
}

// ---- shot mode: one staged frame, then signal readiness ----
if (shotName) {
  const staged = stageShot(shotName);
  if (staged) {
    document.title = `Vortex Clash — ${shotName}`;
    render(ctx, staged);
    requestAnimationFrame(() => {
      render(ctx, staged);
      window.__shotReady = true;
    });
  } else {
    document.title = 'Vortex Clash — unknown shot';
    window.__shotReady = true;
  }
} else {
  // ---- interactive mode ----
  attachInput(canvas, game);
  // Read-only probe for automated play-testing (screen, round, scores).
  window.__vortex = {
    state: () => ({
      screen: S.screen,
      round: S.match.round,
      scores: { ...S.match.scores },
      busy: S.busy,
      handCount: S.hand.length,
      locked: { ...S.match.locked },
    }),
  };
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (S.reveal && S.reveal.t < 1) {
      S.reveal.t = Math.min(1, S.reveal.t + dt / 0.6);
      if (S.reveal.t >= 1) finishReveal();
    }
    render(ctx, buildView());
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}
