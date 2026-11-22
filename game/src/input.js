// VORTEX CLASH — input: mouse clicks and keyboard, mapped onto the game.
// One clear job: turn a pointer position or a key into a game action.
import { LAYOUT, SUIT_ORDER, laneX, handX } from './config.js';
import { titleButtons, endButtons } from './render.js';

function inside(px, py, rect) {
  return px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h;
}

// Which lane (if any) sits under this canvas point.
export function laneAt(px, py) {
  if (py < LAYOUT.lanesY || py > LAYOUT.lanesY + LAYOUT.laneH) return null;
  for (let i = 0; i < 3; i++) {
    const x = laneX(i);
    if (px >= x && px <= x + LAYOUT.laneW) return SUIT_ORDER[i];
  }
  return null;
}

// Which hand card (if any) sits under this canvas point.
export function handCardAt(px, py, hand) {
  const y = LAYOUT.handY - 8;
  if (py < y || py > y + LAYOUT.cardH + 16) return null;
  for (let i = 0; i < hand.length; i++) {
    const x = handX(i, hand.length);
    if (px >= x && px <= x + LAYOUT.cardW) return i;
  }
  return null;
}

export function attachInput(canvas, game) {
  canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const px = (event.clientX - rect.left) * (canvas.width / rect.width);
    const py = (event.clientY - rect.top) * (canvas.height / rect.height);
    handleClick(game, px, py);
  });

  canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    const px = (event.clientX - rect.left) * (canvas.width / rect.width);
    const py = (event.clientY - rect.top) * (canvas.height / rect.height);
    game.setHoverLane(laneAt(px, py));
  });

  window.addEventListener('keydown', (event) => {
    handleKey(game, event);
  });
}

export function handleClick(game, px, py) {
  const screen = game.screen();
  if (screen === 'title') {
    if (inside(px, py, titleButtons().start)) game.startGame();
    return;
  }
  if (screen === 'win' || screen === 'loss') {
    if (inside(px, py, endButtons().again)) game.playAgain();
    return;
  }
  if (screen !== 'table' || game.busy()) return;
  const cardIndex = handCardAt(px, py, game.hand());
  if (cardIndex !== null) {
    game.selectCard(cardIndex);
    return;
  }
  const lane = laneAt(px, py);
  if (lane !== null) {
    game.selectLane(lane);
  }
}

export function handleKey(game, event) {
  const screen = game.screen();
  if (screen === 'title' && (event.key === 'Enter' || event.key === ' ')) {
    game.startGame();
    return;
  }
  if ((screen === 'win' || screen === 'loss') && (event.key === 'Enter' || event.key === ' ')) {
    game.playAgain();
    return;
  }
  if (screen !== 'table' || game.busy()) return;
  const hand = game.hand();
  if (event.key >= '1' && event.key <= String(hand.length)) {
    game.selectCard(Number(event.key) - 1);
    return;
  }
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    game.cycleLane(event.key === 'ArrowRight' ? 1 : -1);
    return;
  }
  if (event.key === 'Enter' || event.key === ' ') {
    game.confirmPlay();
    return;
  }
  if (event.key === 'Escape') game.selectCard(null);
}
