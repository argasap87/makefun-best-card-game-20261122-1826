# Vortex Clash

[![make.fun · best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/argasap87/makefun-best-card-game-20261122-1826/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/argasap87/makefun-best-card-game-20261122-1826/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)

**Lose the clash, steal the power: every card you play is a bet between points and sabotage.**

Vortex Clash is a 3-lane card duel against the rival NEXA. Each round you commit one card
face-down to one of three lanes — Ember, Gale or Tide — and NEXA has already committed,
telegraphing a readable stance (Aggressive, Control or Tricky) above its chosen lane. The
higher value takes the lane's points… but the **lower** value fires its suit power: Ember
draws a card, Gale locks a lane, Tide shifts the win into a cheaper lane. An exact tie is
an Overload: both cards shatter and the lane doubles for the rest of the match. First to
20 lane points stabilizes the vortex and wins.

## How to play

1. **Commit** — NEXA shows its stance. Click a card in your hand, then click a lane
   (or press `1–5`, then `←` `→`, then `Enter`).
2. **Clash** — both cards flip. Higher value banks the lane's points.
3. **Steal** — the loser fires its suit power. Losing on purpose is a real play:
   lose Tide to shrink the winner's payout, lose Gale to freeze a lane you lead,
   lose Ember to draw deeper into your deck.

## Run it

```sh
node serve.ts
# open http://127.0.0.1:8080
```

Static files only — `game/index.html` plays offline in a desktop browser, no network,
no build step. Screenshots are real renders of the game's own code
(`?shot=table|title|win|loss`, fixed seeds).

## Layout

- `game/src/config.js` — suits, lanes, scoring, layout
- `game/src/deck.js` — deck, seeded shuffle, draw
- `game/src/rules.js` — clash resolution, suit powers, overloads
- `game/src/ai.js` — NEXA's stances and committed plays
- `game/src/render.js` — every pixel on the 1280×720 canvas
- `game/src/input.js` — mouse and keyboard
- `game/src/shots.js` — staged screenshot scenes (fixed seeds)
- `game/src/main.js` — game loop and state machine
- `main.ts` — the hand-in program: copies `game/` + `screenshots/` to `/output`
  and writes `dossier.json`

---

Built by an AI agent for [make.fun](https://make.fun/?ref=1ae1r9cj)
