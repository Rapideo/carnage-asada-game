# Taco Shop — Carnage Asada

A 16-bit top-down taco delivery arcade game. Drive fast, because the tip shrinks every second you take —
but speed wrecks your aim and attracts the police. The sat-nav is not on your side.

The city is a real place: the eight blocks of **downtown Hays, Kansas** around the actual Taco Shop at
333 W 8th St, with the Union Pacific running through the middle of it.

**Zero dependencies**: no framework, no libraries, no image, font, or audio files. The city, every sprite,
the shop badge, the graffiti title, the bitmap font, and all the audio are generated procedurally at boot.
The whole game is one self-contained ~232 KB HTML file.

**Play:** open `taco-shop.html`. There is no page chrome — the canvas fills the window.

## Controls

| | |
|---|---|
| `W A S D` / arrows | Drive |
| `Shift` | Handbrake |
| Mouse | Aim the toss |
| Click / `Space` | Throw the bag |
| `P` · `M` · `N` | Pause · mute · music |

Press `P` in game for this list — the pause screen is where the controls live.

Land it on the porch to deliver; land it on the doorstep for a **perfect toss** bonus. Miss and the bag
bursts on the pavement — and it still costs you one from your bag of three. Run out and you're driving back
to the shop while the tip keeps draining.

## How it plays

- **The tip decays.** $15.00 down to a $2.00 floor at 55¢/sec. It's the loudest thing on screen for a reason.
- **The TACO-NAV 2000** gives turn-by-turn directions over a green LCD, paints the route on the tarmac, and
  falls apart into `RECALCULATING` the moment you cut across someone's lawn.
- **Heat.** Clip pedestrians or drive on the pavement and a siren comes looking for you.
- **Downtown takes orders too.** The storefronts on the retail spine have flats above them, and they
  order tacos like anyone else. Those doors open straight onto the pavement rather than sitting back
  behind a lawn, so the toss is a little kinder — which is the point, given you had to get through
  the traffic and over the tracks to reach them.
- **The railway splits the map.** A train runs the Union Pacific corridor every 20–40 seconds and the
  tracks are solid except at nine level crossings. The gates are drawn but never solid, so you can always
  run one — you just have to be right. Get it wrong and the train takes your whole load and throws the car
  clear of the rails. The cruiser is not exempt, which makes the crossing a genuine escape.
- Each delivery buys more time on the shift clock. Bank as much as you can before it runs out.
- **The board.** Take-home pay is the score. Beat the tenth place and you sign it with three initials
  on a cabinet wheel — arrows, not typing. It survives a reload, and it shows up in the attract loop
  every other cycle so you know what you are chasing.

Leave it alone and it runs a cabinet-style attract loop — title, a public-service card, then 90 seconds of
the game playing itself. Any key returns to the title.

`?seed=<number>` on the URL reshuffles the houses, props and scenery, deterministically. The street grid,
the street names and the block programme come from `content/hays.json` and stay put — that is the map.

## Development

```bash
node build.mjs           # bundle src/*.js -> taco-shop.html (ship) + index.html (dev)
node serve.mjs           # dev server on http://localhost:8123
node test/headless.mjs   # test suite — runs the real game logic against a stub canvas
```

`src/*.js` are plain scripts concatenated in filename order, so the numeric prefix is the load order.
`taco-shop.html`, `index.html` and `src/05_content.js` are generated — edit `src/`, `shell.html` and
`content/`, then rebuild.

Authored copy lives in `content/`: the attract card in `winners.json`, the attract rotation's timings in
`attract.json`, the factory high-score board in `scores.json`, and the city itself — street names, the
shop's cell and the 8×8 zoning table — in `hays.json`. Both are inlined at build time, so the shipped
file stays self-contained. The build refuses any character the bitmap font cannot draw, a street list of the
wrong length, an unknown block kind, or an address too wide for the order card.

## Docs

- **`ROADMAP.md`** — the punch list: every known bug, unbuilt feature and open question, in one place.
- **`CLAUDE.md`** — architecture: coordinate systems, the baked ground layer, the y-sorted render pass,
  traffic lane rules, and the invariants that keep every address winnable.
- **`JOURNAL.md`** — the original brief, why each design call was made (and which alternatives were
  rejected), the bugs that mattered, and the build order to repeat it.
- **`GAME-SPEC-GUIDE.md`** — how to brief a game like this one so it can be built in a single pass.
