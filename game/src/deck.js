// VORTEX CLASH — the deck: build, seeded shuffle, draw and discard.
// One clear job: nothing here knows about lanes, scores or the AI.
import { CARD_VALUES, COPIES_PER_CARD, SUIT_ORDER } from './config.js';

// mulberry32: a small seeded PRNG so screenshot scenes are reproducible.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeCard(suit, value, id) {
  return { id, suit, value };
}

// 3 suits x values 1-6 x 2 copies = 36 cards.
export function buildDeck() {
  const deck = [];
  let id = 0;
  for (const suit of SUIT_ORDER) {
    for (const value of CARD_VALUES) {
      for (let c = 0; c < COPIES_PER_CARD; c++) {
        deck.push(makeCard(suit, value, id++));
      }
    }
  }
  return deck;
}

export function shuffleDeck(deck, seed) {
  const rand = mulberry32(seed);
  const out = deck.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

export function drawCards(deck, discards, count, seed) {
  const drawn = [];
  for (let i = 0; i < count; i++) {
    if (deck.length === 0) {
      if (discards.length === 0) break;
      const fresh = shuffleDeck(discards, seed + 7919);
      discards.length = 0;
      deck.push(...fresh);
    }
    drawn.push(deck.pop());
  }
  return drawn;
}

export function sortHand(hand) {
  const suitRank = { ember: 0, gale: 1, tide: 2 };
  return hand.slice().sort((a, b) => suitRank[a.suit] - suitRank[b.suit] || b.value - a.value);
}
