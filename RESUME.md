# Resume here — Pure Carnage

*Written 2026-10-25 at the end of the single-shot build that finished the 20-level game.*
This folder is a **copy** of `Taco Shop - Carnage Asada` (copied at `8e18837`). The
original folder was never touched. The git remote was removed on purpose, so nothing
here can push to the original GitHub repo. The work is on branch `pure-carnage` and is
**not committed**.

## What exists now

The whole game is built: 20 levels alternating the Delivery Shift and the Kitchen Shift.

- **The run:** the level card shows the target, the clock rules and the nav level (the
  kitchen card shows the menu). A level is a checkpoint race: 15 completions, or 9 on
  Supreme. Every 3rd completion earns an extension. After that come LEVEL CLEAR, GAME
  OVER, initials and CONTINUE? (10s), and a victory screen after level 20.
- **Kitchen Shift:** `src/74_kitchen.js`.
  - Tickets, plus a queue that complains past 3 (tips drain 1.5x).
  - Hidden recipes. Wrong picks are held red and cost the star and the clean bonus.
  - WRAP IT! / SEND IT!, and the board picture builds up stage by stage.
  - Era casts barking in the shared strip, and an attract-mode cook.
- **Delivery Shift changes:**
  - Money, from content: the tip starts at $20 with a $2 floor, decaying at each
    difficulty's rate, and fines are per difficulty, including the new train fine.
  - The nav ladder, star tally, and level line.
  - Clock: no per-delivery time.
- **Eras:**
  - The city regenerates per era from `content/hays*.json`.
  - A full colour grade per era (`Post.grade`), applied to the world but not the cards.
  - Menus: 9, 13 and 15 items. Faces: 6, 5 and 5 baked from the era sheets.
- **Seasons:** winter snow on the ground, roofs and in the air, and looser grip.
- **Music:** 42 MIDI arrangements, two per level plus the title (`src/22_music.js`,
  `tools/music/`). Year rule: a song is never newer than its level, and at most 2 years
  older.
- **Controls:** Modes A, B and C on a mode-select screen (`src/25_pad.js`).
- **Attract:** title, winners, board, then a random-level demo (delivery or kitchen).

**Every decision and every invention is in `docs/PURE-CARNAGE-DECISIONS.md`. Read it
first.**

## Verified

| check | result |
|---|---|
| `node build.mjs` | clean; `taco-shop.html` 619 KB, 18 modules, all content validated |
| `node test/headless.mjs` | PASS: the original suite plus run structure, kitchen, kitchen demo and copy sections |
| `node tools/check-pad.mjs` | 209 passed |
| `node tools/music/check-music.mjs` | all music checks pass |
| `node tools/render/sweep.mjs 2` | autoplayers clear every level; Hard deliveries 13 and 15 cleared 1 run in 2 |
| rendered frames (`tools/render/frame.mjs`) | title, mode select, every card type, every era's kitchen and city, winter, pause, dialogue, touch overlay |

## Not verified — do these first

1. **A real browser playtest.** Everything above is headless.
   - Two Chrome browsers are connected to the account. The session waited for the
     owner to choose one.
   - Run `node serve.mjs` and open <http://localhost:8123/taco-shop.html>.
   - Play a delivery level and a kitchen level in Mode A.
2. **The music by ear.** The arrangements were chosen by structural heuristics, because
   no agent can listen. `tools/music/preview/*.wav` holds the renders. Swap songs in
   `tools/music/songs.json`, then rerun `node tools/music/midi2song.mjs --batch
   tools/music/songs.json`.
3. **Mode B on a real stick, and Mode C on a real phone.** Note: a gamepad press does
   not count as a gesture for unlocking audio, so a stick-only cabinet needs Chrome
   launched with `--autoplay-policy=no-user-gesture-required`.
4. **Copyright.** The music arranges real songs (the owner's ruling). The public Netlify
   site (`carnage-asada`) still runs the original game. Do not deploy this build there
   until that is decided.

## Known soft spots

- Era faces don't blink: the eye detector missed, so eye rects were cleared. Set them by
  hand in `reference/kitchen/cast.mjs` to bring the blink back.
- The kitchen's winter is light: snow on the customers' hats, and nothing more.
- In Mode C the minimap sits under the on-screen stick.
- The kitchen numbers are still the paper estimates from `difficulty.md`. The sweep says
  they are winnable; a person has to say whether they are fun.
