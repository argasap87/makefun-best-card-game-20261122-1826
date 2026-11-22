// VORTEX CLASH — the renderer: every pixel on the 1280x720 canvas.
// One clear job: draw a view object. No rules, no input, no state changes.
import {
  CANVAS_W, CANVAS_H, SUITS, SUIT_ORDER, STANCES, WIN_SCORE,
  LAYOUT, laneX, laneCenterX, handX,
} from './config.js';
import { lanePointValue } from './rules.js';

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, weight, align) {
  ctx.fillStyle = color;
  ctx.font = `${weight || 700} ${size}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  ctx.textAlign = align || 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

// Suit glyphs: flame, swirl and wave — drawn paths, never text alone.
export function drawSuitGlyph(ctx, shape, cx, cy, size, color) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, size * 0.09);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const s = size / 2;
  if (shape === 'flame') {
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.bezierCurveTo(s * 0.55, -s * 0.35, s * 0.95, s * 0.1, s * 0.62, s * 0.72);
    ctx.bezierCurveTo(s * 0.35, s * 1.0, -s * 0.35, s * 1.0, -s * 0.62, s * 0.72);
    ctx.bezierCurveTo(-s * 0.95, s * 0.1, -s * 0.55, -s * 0.35, 0, -s);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.moveTo(0, s * 0.15);
    ctx.bezierCurveTo(s * 0.28, s * 0.35, s * 0.3, s * 0.62, 0, s * 0.78);
    ctx.bezierCurveTo(-s * 0.3, s * 0.62, -s * 0.28, s * 0.35, 0, s * 0.15);
    ctx.fill();
  } else if (shape === 'swirl') {
    ctx.beginPath();
    for (let a = 0; a <= Math.PI * 4.4; a += 0.12) {
      const r = (a / (Math.PI * 4.4)) * s;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (a === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.14, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // wave: two stacked crests
    ctx.beginPath();
    ctx.moveTo(-s, -s * 0.15);
    ctx.bezierCurveTo(-s * 0.5, -s * 0.75, -s * 0.1, s * 0.3, s * 0.3, -s * 0.2);
    ctx.bezierCurveTo(s * 0.55, -s * 0.5, s * 0.8, -s * 0.35, s, -s * 0.15);
    ctx.bezierCurveTo(s * 0.6, s * 0.25, s * 0.2, s * 0.55, -s * 0.2, s * 0.3);
    ctx.bezierCurveTo(-s * 0.6, s * 0.05, -s * 0.8, s * 0.1, -s, -s * 0.15);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-s, s * 0.55);
    ctx.bezierCurveTo(-s * 0.4, s * 0.15, s * 0.1, s * 0.95, s * 0.6, s * 0.45);
    ctx.bezierCurveTo(s * 0.85, s * 0.25, s, s * 0.4, s, s * 0.55);
    ctx.bezierCurveTo(s * 0.5, s * 0.85, -s * 0.4, s * 0.95, -s, s * 0.55);
    ctx.fill();
  }
  ctx.restore();
}

function drawCardBack(ctx, x, y, w, h) {
  roundRect(ctx, x, y, w, h, 10);
  ctx.fillStyle = '#241a4d';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#6d5bd0';
  ctx.stroke();
  roundRect(ctx, x + 6, y + 6, w - 12, h - 12, 7);
  ctx.strokeStyle = 'rgba(150,130,255,0.5)';
  ctx.stroke();
  drawSuitGlyph(ctx, 'swirl', x + w / 2, y + h / 2, Math.min(w, h) * 0.55, '#8f7bff');
}

// A face-up card: big numeral, suit glyph, colour band. Legible at 300px.
export function drawCard(ctx, card, x, y, w, h, opts) {
  const o = opts || {};
  const suit = SUITS[card.suit];
  ctx.save();
  if (o.ghost) ctx.globalAlpha = 0.45;
  if (o.flipT !== undefined && o.flipT < 1) {
    const s = Math.abs(Math.cos(o.flipT * Math.PI));
    ctx.translate(x + w / 2, y + h / 2);
    ctx.scale(Math.max(0.08, s), 1);
    ctx.translate(-(x + w / 2), -(y + h / 2));
    if (o.flipT < 0.5) {
      // still face-down: the back of the card, edge-on at the midpoint
      drawCardBack(ctx, x, y, w, h);
      ctx.restore();
      return;
    }
  }
  roundRect(ctx, x, y, w, h, 10);
  ctx.fillStyle = '#f7f3ea';
  ctx.fill();
  ctx.lineWidth = o.selected ? 4 : 2;
  ctx.strokeStyle = o.selected ? '#ffd94d' : suit.dark;
  ctx.stroke();
  // colour band across the top
  ctx.save();
  roundRect(ctx, x, y, w, h, 10);
  ctx.clip();
  ctx.fillStyle = suit.color;
  ctx.fillRect(x, y, w, 26);
  ctx.restore();
  text(ctx, suit.name.toUpperCase(), x + w / 2, y + 14, 13, '#ffffff', 800);
  // big numeral
  text(ctx, String(card.value), x + w / 2, y + h * 0.52, Math.round(h * 0.42), suit.dark, 900);
  // suit glyph under the numeral
  drawSuitGlyph(ctx, suit.shape, x + w / 2, y + h * 0.82, Math.min(w, h) * 0.26, suit.color);
  // power tag at the bottom
  text(ctx, suit.power.toUpperCase(), x + w / 2, y + h - 12, 10, '#6b6257', 800);
  if (o.selected) {
    ctx.shadowColor = suit.glow;
    ctx.shadowBlur = 22;
    roundRect(ctx, x, y, w, h, 10);
    ctx.strokeStyle = '#ffd94d';
    ctx.lineWidth = 4;
    ctx.stroke();
  }
  ctx.restore();
}

// Stance icons: sword (aggressive), lock (control), mask (tricky).
export function drawStanceIcon(ctx, stanceKey, cx, cy, size) {
  const stance = STANCES[stanceKey];
  const s = size / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = stance.color;
  ctx.strokeStyle = stance.color;
  ctx.lineWidth = Math.max(3, size * 0.08);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (stance.icon === 'sword') {
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(s * 0.28, -s * 0.2);
    ctx.lineTo(s * 0.12, s * 0.45);
    ctx.lineTo(-s * 0.12, s * 0.45);
    ctx.lineTo(-s * 0.28, -s * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-s * 0.55, s * 0.55);
    ctx.lineTo(s * 0.55, s * 0.55);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, s * 0.55);
    ctx.lineTo(0, s * 0.95);
    ctx.stroke();
  } else if (stance.icon === 'lock') {
    ctx.beginPath();
    ctx.arc(0, -s * 0.15, s * 0.42, Math.PI, 0);
    ctx.stroke();
    roundRect(ctx, -s * 0.62, -s * 0.15, s * 1.24, s * 0.95, 6);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, s * 0.28, s * 0.12, 0, Math.PI * 2);
    ctx.fillStyle = '#241a4d';
    ctx.fill();
  } else {
    // mask: two eyes in a domino shape
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.7);
    ctx.lineTo(s * 0.95, 0);
    ctx.lineTo(0, s * 0.7);
    ctx.lineTo(-s * 0.95, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#241a4d';
    ctx.beginPath();
    ctx.ellipse(-s * 0.38, -s * 0.05, s * 0.2, s * 0.13, 0, 0, Math.PI * 2);
    ctx.ellipse(s * 0.38, -s * 0.05, s * 0.2, s * 0.13, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawButton(ctx, rect, label, fill, fg) {
  roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 12);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.stroke();
  text(ctx, label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 1, 22, fg, 800);
}

export function titleButtons() {
  return { start: { x: 490, y: 470, w: 300, h: 62 } };
}

export function endButtons() {
  return { again: { x: 490, y: 560, w: 300, h: 62 } };
}

function drawBackdrop(ctx) {
  const g = ctx.createRadialGradient(640, 300, 60, 640, 360, 760);
  g.addColorStop(0, '#2c2066');
  g.addColorStop(0.55, '#1b1445');
  g.addColorStop(1, '#100b2a');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  // faint vortex rings
  ctx.save();
  ctx.globalAlpha = 0.10;
  ctx.strokeStyle = '#8f7bff';
  ctx.lineWidth = 2;
  for (let r = 90; r <= 420; r += 66) {
    ctx.beginPath();
    ctx.arc(640, 360, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
  // drifting ember motes: fixed positions, a little light in motion
  const motes = [
    [120, 130, 3, '#ff8a5c'], [1150, 110, 2.5, '#6db3ff'], [90, 620, 2.5, '#ffd94d'],
    [1190, 600, 3, '#ff8a5c'], [420, 90, 2, '#6db3ff'], [880, 660, 2, '#ffd94d'],
    [200, 360, 2, '#8f7bff'], [1080, 380, 2, '#8f7bff'],
  ];
  for (const [mx, my, mr, mc] of motes) {
    const mg = ctx.createRadialGradient(mx, my, 0, mx, my, mr * 4);
    mg.addColorStop(0, mc);
    mg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = mg;
    ctx.beginPath();
    ctx.arc(mx, my, mr * 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawTopBar(ctx, view) {
  const m = view.match;
  ctx.fillStyle = 'rgba(8, 5, 24, 0.55)';
  ctx.fillRect(0, 0, CANVAS_W, LAYOUT.topBarH);
  text(ctx, 'VORTEX CLASH', 116, 34, 24, '#ffffff', 900, 'left');
  text(ctx, `ROUND ${m.round}`, 330, 34, 16, '#b9aef5', 700, 'left');
  // score bar: first to 20
  const barX = 470;
  const barW = 340;
  const barY = 22;
  text(ctx, 'YOU', barX - 14, 34, 18, '#ffd94d', 900, 'right');
  text(ctx, 'NEXA', barX + barW + 14, 34, 18, '#ff8a7a', 900, 'left');
  roundRect(ctx, barX, barY, barW, 20, 10);
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  ctx.fill();
  const youW = (barW / 2) * Math.min(1, m.scores.you / WIN_SCORE);
  const aiW = (barW / 2) * Math.min(1, m.scores.ai / WIN_SCORE);
  ctx.fillStyle = '#ffd94d';
  ctx.fillRect(barX, barY, youW, 20);
  ctx.fillStyle = '#ff5a4e';
  ctx.fillRect(barX + barW - aiW, barY, aiW, 20);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(barX + barW / 2 - 1, barY - 3, 2, 26);
  // dark pill behind the score so the numbers read on gold and red
  roundRect(ctx, barX + barW / 2 - 52, barY - 2, 104, 24, 12);
  ctx.fillStyle = 'rgba(8, 5, 24, 0.85)';
  ctx.fill();
  text(ctx, `${m.scores.you} — ${m.scores.ai}`, 640, 34, 15, '#ffffff', 900);
  text(ctx, `FIRST TO ${WIN_SCORE}`, 640, 54, 10, '#b9aef5', 700);
  text(ctx, `DECK ${view.deckCount}`, 1064, 30, 14, '#b9aef5', 700, 'left');
  text(ctx, `DISCARD ${view.discardCount}`, 1064, 50, 14, '#b9aef5', 700, 'left');
}

function drawAiRow(ctx, view) {
  text(ctx, 'NEXA  ·  THE RIVAL', 116, 96, 15, '#ff8a7a', 800, 'left');
  const w = 62;
  const h = 92;
  const gap = 10;
  const total = w * 5 + gap * 4;
  const startX = (CANVAS_W - total) / 2;
  for (let i = 0; i < 5; i++) {
    if (i < view.aiHandCount) drawCardBack(ctx, startX + i * (w + gap), 84, w, h);
  }
  // stance icon above the AI's committed lane, in the gap over the lanes
  if (view.aiCommit) {
    const laneIdx = SUIT_ORDER.indexOf(view.aiCommit.lane);
    const cx = laneCenterX(laneIdx);
    const cy = 196;
    ctx.save();
    ctx.shadowColor = STANCES[view.aiCommit.stance].color;
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(8,5,24,0.85)';
    ctx.fill();
    ctx.restore();
    ctx.lineWidth = 3;
    ctx.strokeStyle = STANCES[view.aiCommit.stance].color;
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, Math.PI * 2);
    ctx.stroke();
    drawStanceIcon(ctx, view.aiCommit.stance, cx, cy, 26);
    text(ctx, STANCES[view.aiCommit.stance].name, cx + 30, cy, 12, STANCES[view.aiCommit.stance].color, 900, 'left');
  }
}

function drawLanes(ctx, view) {
  const m = view.match;
  SUIT_ORDER.forEach((suit, i) => {
    const x = laneX(i);
    const y = LAYOUT.lanesY;
    const w = LAYOUT.laneW;
    const h = LAYOUT.laneH;
    const s = SUITS[suit];
    const locked = m.locked[suit];
    const value = lanePointValue(m, suit);
    const hovered = view.hoverLane === suit && view.selectedCard !== null && !locked;
    roundRect(ctx, x, y, w, h, 16);
    ctx.fillStyle = hovered ? 'rgba(255,217,77,0.16)' : 'rgba(8,5,24,0.45)';
    ctx.fill();
    ctx.lineWidth = hovered ? 3 : 2;
    ctx.strokeStyle = locked ? '#5a5478' : s.color;
    ctx.stroke();
    // header: glyph + name + point badge
    drawSuitGlyph(ctx, s.shape, x + 34, y + 30, 34, locked ? '#8a84a8' : s.color);
    text(ctx, s.name.toUpperCase(), x + 58, y + 30, 20, locked ? '#8a84a8' : '#ffffff', 900, 'left');
    text(ctx, s.powerText, x + 58, y + 54, 11, '#b9aef5', 700, 'left');
    roundRect(ctx, x + w - 92, y + 12, 78, 34, 9);
    ctx.fillStyle = m.overloads[suit] ? '#ffd94d' : s.color;
    ctx.fill();
    text(ctx, `${value} PTS`, x + w - 53, y + 30, 15, m.overloads[suit] ? '#241a00' : '#ffffff', 900);
    if (m.overloads[suit]) text(ctx, 'OVERLOAD ×2', x + w - 53, y + 62, 10, '#ffd94d', 800);
    if (locked) {
      drawStanceIcon(ctx, 'control', x + w - 40, y + 92, 30);
      text(ctx, 'LOCKED', x + w - 40, y + 122, 11, '#f2b705', 900);
    }
    // lane score tally, under the header — clear of the clash result below
    text(ctx, `YOU ${m.laneScore.you[suit]} · NEXA ${m.laneScore.ai[suit]}`, x + w / 2, y + 84, 13, '#cfc6f2', 700);
    // played cards in this lane: the clash now revealing, else the lane's
    // remembered clash (the table keeps its battle record)
    const revealing = view.reveal && view.reveal.lane === suit ? view.reveal : null;
    const history = (view.laneHistory || {})[suit] || null;
    const last = !revealing && history ? history : null;
    if (revealing) {
      const cw = 84;
      const ch = 118;
      const cy = y + 108;
      const cxYou = x + w / 2 - cw - 10;
      const cxAi = x + w / 2 + 10;
      drawCard(ctx, revealing.youCard, cxYou, cy, cw, ch, {});
      drawCard(ctx, revealing.aiCard, cxAi, cy, cw, ch, { flipT: revealing.t });
      text(ctx, 'REVEAL…', x + w / 2, cy + ch + 18, 13, '#ffffff', 900);
    } else if (last) {
      const cw = 84;
      const ch = 118;
      const cy = y + 108;
      const cxYou = x + w / 2 - cw - 10;
      const cxAi = x + w / 2 + 10;
      drawCard(ctx, last.youCard, cxYou, cy, cw, ch, {});
      drawCard(ctx, last.aiCard, cxAi, cy, cw, ch, {});
      const mark = last.winner === 'you' ? 'YOU WIN' : last.winner === 'ai' ? 'NEXA WINS' : 'OVERLOAD';
      text(ctx, mark, x + w / 2, cy + ch + 18, 13, last.winner === 'you' ? '#ffd94d' : last.winner === 'ai' ? '#ff8a7a' : '#ffffff', 900);
    } else if (view.aiCommit && view.aiCommit.lane === suit && !view.reveal) {
      // the rival's face-down commit sits in its lane
      drawCardBack(ctx, x + w / 2 - 42, y + 108, 84, 118);
      text(ctx, 'NEXA COMMITTED', x + w / 2, y + 108 + 118 + 18, 12, '#ff8a7a', 800);
    }
  });
}

function drawHand(ctx, view) {
  text(ctx, 'YOUR HAND — click a card, then a lane  ·  keys 1–5 + ← → + Enter', 640, 496, 13, '#b9aef5', 700);
  view.hand.forEach((card, i) => {
    const x = handX(i, view.hand.length);
    const y = LAYOUT.handY + (view.selectedCard === i ? -8 : 0);
    drawCard(ctx, card, x, y, LAYOUT.cardW, LAYOUT.cardH, { selected: view.selectedCard === i });
  });
}

function drawMessage(ctx, view) {
  ctx.fillStyle = 'rgba(8, 5, 24, 0.55)';
  ctx.fillRect(0, LAYOUT.msgY - 16, CANVAS_W, 44);
  text(ctx, view.message, 640, LAYOUT.msgY + 6, 16, '#ffffff', 700);
}

function drawTable(ctx, view) {
  drawBackdrop(ctx);
  drawTopBar(ctx, view);
  drawAiRow(ctx, view);
  drawLanes(ctx, view);
  drawHand(ctx, view);
  drawMessage(ctx, view);
}

function drawTitle(ctx, view) {
  drawBackdrop(ctx);
  // fanned decorative cards
  const fan = [
    { suit: 'ember', value: 6 },
    { suit: 'gale', value: 5 },
    { suit: 'tide', value: 4 },
  ];
  fan.forEach((card, i) => {
    ctx.save();
    ctx.translate(640 + (i - 1) * 150, 210);
    ctx.rotate((i - 1) * 0.16);
    drawCard(ctx, card, -59, -82, 118, 164, {});
    ctx.restore();
  });
  text(ctx, 'VORTEX', 640, 330, 84, '#ffffff', 900);
  text(ctx, 'CLASH', 640, 408, 84, '#ffd94d', 900);
  text(ctx, 'Lose the clash, steal the power — every card is a bet between points and sabotage.', 640, 452, 19, '#e8e2ff', 700);
  const btn = titleButtons().start;
  drawButton(ctx, btn, '▶  START DUEL', '#e8442e', '#ffffff');
  // 3-step how-to strip
  const steps = [
    ['1 · COMMIT', 'NEXA shows its stance — pick card + lane'],
    ['2 · CLASH', 'Higher value takes the lane points'],
    ['3 · STEAL', 'Loser fires its power — Draw, Lock, Shift'],
  ];
  const sw = 372;
  steps.forEach((step, i) => {
    const x = laneX(i);
    roundRect(ctx, x, 560, sw, 92, 14);
    ctx.fillStyle = 'rgba(8,5,24,0.55)';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = SUITS[SUIT_ORDER[i]].color;
    ctx.stroke();
    text(ctx, step[0], x + sw / 2, 586, 16, SUITS[SUIT_ORDER[i]].color, 900);
    text(ctx, step[1], x + sw / 2, 620, 13, '#e8e2ff', 700);
  });
}

function drawEnd(ctx, view, won) {
  drawBackdrop(ctx);
  const m = view.match;
  const banner = won ? 'VORTEX STABILIZED' : 'VORTEX COLLAPSED';
  const color = won ? '#ffd94d' : '#ff5a4e';
  text(ctx, won ? '★  YOU WIN  ★' : '✕  YOU LOSE  ✕', 640, 130, 26, color, 900);
  text(ctx, banner, 640, 196, 56, '#ffffff', 900);
  text(ctx, won ? 'First to 20 — the vortex holds. NEXA bows out.' : 'NEXA reached 20 first — the vortex breaks apart.', 640, 246, 18, '#e8e2ff', 700);
  // lane-by-lane breakdown
  text(ctx, 'LANE BREAKDOWN', 640, 300, 16, '#b9aef5', 900);
  SUIT_ORDER.forEach((suit, i) => {
    const s = SUITS[suit];
    const x = laneX(i);
    roundRect(ctx, x, 322, LAYOUT.laneW, 120, 14);
    ctx.fillStyle = 'rgba(8,5,24,0.55)';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = s.color;
    ctx.stroke();
    drawSuitGlyph(ctx, s.shape, x + 44, 366, 40, s.color);
    text(ctx, s.name.toUpperCase(), x + 74, 352, 18, '#ffffff', 900, 'left');
    text(ctx, `${m.laneScore.you[suit]} pts you  ·  ${m.laneScore.ai[suit]} pts NEXA`, x + 74, 380, 14, '#cfc6f2', 700, 'left');
    const lead = m.laneScore.you[suit] - m.laneScore.ai[suit];
    text(ctx, lead > 0 ? 'YOUR LANE' : lead < 0 ? "NEXA'S LANE" : 'EVEN', x + 74, 410, 13, lead > 0 ? '#ffd94d' : lead < 0 ? '#ff8a7a' : '#b9aef5', 800, 'left');
    if (m.overloads[suit]) text(ctx, 'OVERLOAD ×2', x + LAYOUT.laneW - 24, 352, 12, '#ffd94d', 900, 'right');
    if (m.locked[suit]) text(ctx, 'LOCKED', x + LAYOUT.laneW - 24, 380, 12, '#f2b705', 900, 'right');
  });
  text(ctx, `FINAL  ${m.scores.you} — ${m.scores.ai}   ·   ${m.clashes} clashes   ·   ${m.overloadCount} overloads   ·   ${m.powersFired} powers fired`, 640, 486, 16, '#ffffff', 800);
  const btn = endButtons().again;
  drawButton(ctx, btn, won ? '↻  PLAY AGAIN' : '↻  RETRY THE DUEL', won ? '#e8442e' : '#2e86e8', '#ffffff');
}

export function render(ctx, view) {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  if (view.screen === 'title') drawTitle(ctx, view);
  else if (view.screen === 'win') drawEnd(ctx, view, true);
  else if (view.screen === 'loss') drawEnd(ctx, view, false);
  else drawTable(ctx, view);
}
