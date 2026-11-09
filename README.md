# Taco Shop — Carnage Asada

A 16-bit arcade game in two halves: **twenty shifts** at the Taco Shop in Hays, Kansas, from the summer
of 1972 to the winter of 1999, alternating between the **Delivery Shift** (drive, toss, don't get caught)
and the **Kitchen Shift** (build the order from memory, before the customer walks out).

The city is a real place: the eight blocks of **downtown Hays, Kansas** around the actual Taco Shop at
333 W 8th St, with the Union Pacific running through the middle of it. It is rezoned for each decade.

**Zero runtime dependencies**: no framework, no libraries, no image, font, or audio files at runtime. The
city, every sprite, the customers' faces, the ingredient wells, the bitmap font and all the audio are
generated at boot from data in the file. Faces and ingredients are pixel art baked into source tables by
`tools/render/`; the music is arranged from MIDI into chip-synth data by `tools/music/`. The whole game is
one self-contained HTML file.

**Play:** open `taco-shop.html`. There is no page chrome — the canvas fills the window.
`?level=N` starts a run at level N.

**Version 0.9.1** (2026-11-07): feature-complete, ahead of release, with Service Mode for the owner. The version shows in the
corner of the title and pause screens; `CHANGELOG.md` has what each build contains.

## The run

| | |
|---|---|
| Levels | 20, alternating Delivery and Kitchen, delivery first |
| Eras | 1970s (levels 1–6), 1980s (7–12), 1990s (13–20) — each with its own colour grade, map, menu, customers and music |
| Seasons | summer and winter, with weather rolled each play: summer is sunny or rainy (rain is a little slick), winter is mostly snowy (snow takes the grip out of your tyres) and sometimes sunny |
| Difficulty | Easy 1–6, Medium 7–12, Hard 13–18, Supreme 19–20 |
| A level | a checkpoint race: 15 deliveries or 15 tickets served (9 on Supreme) before 0:00 |
| The clock | 3:00, plus an extension for every third completion (up to 5; 3 on Supreme) |
| Score | the money, across the whole run. Stars are a report card and never go on the board |
| Game over | initials first if you placed, then CONTINUE? for 10 seconds: restart the level as a new run at $0.00 |

## Controls

Pick a mode after the title: **A** keyboard + mouse, **B** arcade stick (any browser gamepad),
**C** touch.

**Delivery Shift**

| Mode A | Mode B | |
|---|---|---|
| `W A S D` / arrows | stick, Button 1 gas, Button 2 reverse | Drive |
| `Shift` | — | Handbrake |
| Mouse | hold Button 3, stick aims | Aim the toss |
| Click / `Space` | release Button 3 | Throw the bag |

**Kitchen Shift**

| Mode A | Mode B | |
|---|---|---|
| arrows / `WASD`, or the mouse | stick | Move along the line |
| `Space` / `Z` / click | Button 1 | Pick the ingredient |
| `X` / click the button, or Down past the bins and `Space` | Button 2, or stick down past the bins and Button 1 | Wrap the item |
| `Enter` / `C` / click the button | Button 3 | Send the ticket |

`P` pauses (Start on a stick), `M` mutes, `N` toggles music. The pause screen lists the controls for the
mode you chose — and in the kitchen it shows the menu, at the cost of clock time.

## How it plays

**Delivery.** The tip starts at $20.00 and drains to a $2.00 floor — faster every difficulty. Land the
bag on the porch to deliver, on the doorstep for a **perfect toss** (+$5 and a star). Miss and it bursts,
and still costs one from your bag of three. The **TACO-NAV** helps less as you go: full guidance on Easy,
just the beacon over the house on Supreme. Clip pedestrians or drive on the pavement and Hays PD comes
looking. The Union Pacific splits the map; the gates are drawn, not solid, so you can always run one.

**Kitchen.** Tickets clip to the rail; the customer queues in the dining room above. The **recipes are
hidden** — the pips say how many steps, not which — so the menu on the level card is the one look you
get. Pick the base from a station, the ingredients from the twelve bins, in order; wrap each item, send
the ticket. A wrong pick flashes the bin's plate red and holds it until you pick the right one: it costs
the item's star and the ticket's +$5 clean bonus, but never your progress. A ticket's tip is the
customer's patience — at zero they walk out. More than three waiting and the line complains, and every
tip drains half again as fast. Bins never move between levels; the 1980s fill two empty ones (sauce,
chili), the 1990s the last (chicken). On Easy (and for new dishes on Medium) a stall or a wrong pick blinks the right bin, and your coworker says what's next.

Leave it alone and it runs a cabinet-style attract loop: title, a public-service card, the high-score
board, then a random level playing itself.

## Development

```bash
node build.mjs           # validate content/, bundle src/*.js -> taco-shop.html (ship) + index.html (dev)
node serve.mjs           # dev server on http://localhost:8123
node test/headless.mjs   # test suite — runs the real game logic against a stub canvas
node admin.mjs           # Service Mode: the game plus the content editor on http://localhost:8124 (F2)
node test/admin.mjs      # Service Mode's tests
node tools/render/frame.mjs <level> [secs] [--card|--clear|--over|--pause|--say]   # a real frame to PNG
```

`src/*.js` are plain scripts concatenated in filename order, so the numeric prefix is the load order.
`taco-shop.html`, `index.html` and `src/05_content.js` are generated — edit `src/`, `shell.html` and
`content/`, then rebuild.

Everything authored lives in `content/` and is inlined and validated at build time: the release version, the levels, the
difficulties, the three menus, the three maps, the dialogue, the attract card and timings, the factory
board, the baked faces and ingredient wells, and the arranged music. The build refuses anything the
bitmap font cannot draw, copy too wide for where it is drawn, a bin that moves between eras, a recipe that
cannot be built, a Short name whose pips would hit the board, and a song newer than its level.

**Service Mode** is the owner's editor for all of it. Run `node admin.mjs` in your own terminal, open
<http://localhost:8124/> and press **F2**: tabs for Levels, Menu, Attract, Music, Difficulty, Dialogue, Faces and
Test (jump to any level, override the weather, let the game play itself). Save checks the content the way the
build does, writes it and rebuilds. The JSON in `content/` is the master copy and `docs/authored content/*.md`
are generated from it, so do not edit those by hand. `node serve.mjs` stays the plain dev server, without it.
None of it is in `taco-shop.html`.

## Docs

- **`docs/PURE-CARNAGE-DECISIONS.md`** — the owner's rulings for this build, and every invention, marked.
- **`docs/gdd.md`** and **`docs/authored content/`** — the design (the latter generated from `content/`).
- **`ROADMAP.md`** — the punch list.
- **`CLAUDE.md`** — architecture and invariants.
- **`JOURNAL.md`** — why each design call was made, and the bugs that mattered.
- **`docs/art_pipeline.md`** — how a face or an ingredient becomes source data.
