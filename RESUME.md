# Resume here

*Written 2026-10-25, after the build that finished the 20-level game, and updated the same
day once the admin overlay had been designed and planned. Updated 2026-11-06 with two
pinned art threads (below).* This is the starting point for a fresh session. It is a
snapshot: **`ROADMAP.md` is the living plan**, and if the two disagree, the roadmap wins.

**Start here:** three things are waiting, and **the owner picks which goes first.** Ask;
do not start any of them unprompted.

1. **The admin overlay** (see **Next** below). Fully designed and planned, **nothing of
   it built**. When the owner says go, run the plan with
   `superpowers:subagent-driven-development` on a branch `admin-overlay`.
2. **Real ingredient art for the steam-table wells** (pinned 2026-11-06, see
   **Pinned: the art** below). The owner's **approved set** is in
   `reference/kitchen/ingredients/` (added 2026-11-07); nothing is baked yet.
3. **The assembly-board pictures are rough** (pinned 2026-11-06, same section). The owner
   wants them worked on.

## Pinned: the art (2026-11-06, updated 2026-11-07)

**Still pinned, by the owner, 2026-11-07: do not bake.** The owner has put a separate
Codex agent in charge of **art direction and concept generation**, and more art from it
is coming. Wait for that delivery, and treat the set below as the current approved
source until it arrives, not as final. When new art lands, check it against what is
measured here (bin shape, colour count, key mapping) before baking anything.

**Use the approved set, not the grid.** On 2026-11-07 the owner supplied
`reference/kitchen/ingredients/` ("they are better art, and in the proper orientation"):
**28 approved assets**, 21 ingredient pans and 7 shells/bread, each as a full-size
transparent original (`originals/`, ~1260×1246) and a nearest-neighbour reduction on a
45×46 transparent canvas (`sprites-45x46/`). Its own `README.txt`, `asset-list.csv`,
`prompts.txt` and `preview.png` say what each is; filename numbers are the owner's
approval-list numbers, so the gaps are intentional.

Measured on the 45×46 sprites:
- **Every pan's opaque area is 42 wide × 21–23 tall**, at x 2, y 14. The game's bin
  tray art is **42×24**. The near-square problem described below **is gone** for the
  pans: they are already the bin's shape and size.
- **Colours: 470–730 per sprite**, against the lattice cap of **16**. They are
  downsamples, not hand-pixelled, so the baker's colour reduction does real work here.
  Look at the contact sheet closely; baking from `originals/` might reduce better than
  re-reducing the 45×46 files. Untested.
- **The shells and bread are free-standing objects, not pans** (30–41 × 18–29). They suit
  the base stations and the board, not a bin.

Every menu key has a match (Claude's mapping; confirm the doubtful ones): BEEF 01,
CHICKEN 02, BEANS 04, LETTUCE 05, CHEESE 06, CREAM 08, TOMATO 09, ONION 10 (*green*
onions; the current well is white), PEPPERS 12 (jalapeños? the current colour is a
green pepper), CCQ 15, CHILI 16, SAUCE 17 (mild/Taco Shop sauce). Bases: SHELL 31,
SMALL 32, LARGE 33, CHIPS 36. Unused for now: 03 shredded pork, 07 jack, 11 olives,
13 guacamole, 14 rice, 18 hot sauce, 19 salsa, 24 black beans, 30 pico, 37 fried flour
shells, 38 tostada shells, 39 buns.

The earlier grid, below, is **superseded** by this set. It is still untracked at the repo
root; ask the owner before deleting it.

### The first look (2026-11-06), kept for its reasoning

The owner added **`Pixel-Art Taco Shop Ingredient Grid.png`** to the repo root
(1536×1024 RGB, 2.6 MB, **untracked**: the owner has not said where it should live, so
it was left where they put it; `reference/kitchen/` is the obvious home, but ask). It is
a sheet of **40 pixel-art steam-table trays, 8 columns × 5 rows**. The owner's framing:
until now the wells were made to match by **recolouring** (`recolor-lattice.mjs` made
SAUCE and CHILI out of other wells); now there is real art to draw from instead.

The session only checked feasibility, at the owner's request ("i waned to make sure we
could use the art"), and stopped there. What was found:

- **The pipeline already fits it.** `tools/render/bake-lattice.mjs --tray` cuts a grid
  of trays into `content/lattice/*.json`, which `build.mjs` inlines as `LATTICE`. Probe
  first (`--probe`), bake to a contact sheet, look, then build. See
  `docs/art_pipeline.md`.
- **Every bin key the three menus use has a tray on the sheet**, read by eye (row,
  col from 1): BEEF (1,1), CHICKEN (1,2), CHILI (1,7, beans in red), CCQ (1,8, queso),
  LETTUCE (2,1), CHEESE (2,2, cheddar), TOMATO (2,4), ONION (2,5), PEPPERS (2,6 or
  3,4), CREAM (3,1), SAUCE (4,4), BEANS (1,4 refried, or 3,8). Bases on row 5: hard
  shells (5,1), flour tortillas (5,2/5,3), chips (5,8). These identifications are
  Claude's guesses; confirm any ambiguous one with the owner.
- **About 20 trays have no menu slot yet** (rice, shredded beef, black beans, jack,
  pico, guacamole, olives, jalapeños, corn, chorizo, salsa verde, burger buns...).
  Room for later eras to fill the empty bins; not a request.
- **Aspect is the real problem.** The trays are near-square; a bin is 42×24 (1.75:1),
  and the baker squashes to fit. Likely answer: crop **food only** and let the game's
  steel frame it. Bake a test contact sheet before deciding.
- **The left base station** is one double-height slot holding three stacked bases; the
  sheet has three separate square trays. That needs its own treatment.
- **Open question put to the owner, unanswered:** is the goal every well looking like
  one artist's set (re-bake them all), or mainly replacing the recoloured ones that look
  off? This decides the scope. Brainstorm it with them before building.

**Assembly pictures.** The item on the prep board is **drawn procedurally**, not baked:
`Kitchen.pic()` and `picShell` / `picOpen` / `picBurrito` / `picSoft` / `picNachos` in
`src/74_kitchen.js`, cached by item × stage, with filling colours from `Kitchen.ING`. The
owner calls them **rough** and wants them worked on. The roadmap's original intent was
**baked cutouts, one frame per `<ITEM><STAGE>`** (`--keyed --size 40x38`, see
`docs/art_pipeline.md`, "Free objects"); `content/lattice/burrito.json` is the one such
cutout that exists. Nothing was decided beyond "they need work"; ask the owner what bugs
them before choosing between better drawing code and baked art.

## Where things stand

The whole game is built: 20 levels alternating the Delivery Shift and the Kitchen Shift,
from Summer 1972 to Winter 1999.

The build was done in one session in a copy of this repo, `Desktop\Pure Carnage`, and
fast-forwarded back onto `master` here. History is one straight line:
`8e18837` (where the copy was taken) → `89ecd52` (the game) → `aa77007` (the docs).
The copy is archived as `Desktop\Pure Carnage.zip` (verified) and the folder is deleted;
nothing in it is needed. Every ruling and invention from that day is logged in
`docs/PURE-CARNAGE-DECISIONS.md`. The GDD and the authored content were updated to match
the build; the GDD ends with a list of what was invented.

**Repo state:** `master` is clean apart from the files untracked on purpose
(`Migrated/`, `Carnage_Resume.pdf`, and since 2026-11-06
`Pixel-Art Taco Shop Ingredient Grid.png`). The last commit adds the overlay's design and plan,
and points `ROADMAP.md`, this file and `CLAUDE.md` at them. Re-checked then:
`node build.mjs` was clean, reproduced every generated file byte for byte, and
`node test/headless.mjs` passed. `master` is **ahead of `origin/master` and not pushed**;
push only when the owner says so. The music previews (`tools/music/preview/`, git-ignored)
were copied in from the archive, so they are present here.

- **The run:**
  - The level card shows the target, the clock rules and the nav level; the kitchen card
    shows the menu.
  - A level is a checkpoint race: 15 completions, or 9 on Supreme. Every 3rd completion
    earns an extension.
  - After that come LEVEL CLEAR, GAME OVER, initials and CONTINUE? (10s), and a victory
    screen after level 20.
- **Kitchen Shift:** `src/74_kitchen.js`.
  - Tickets, plus a queue that complains past 3 (tips drain 1.5x).
  - Hidden recipes. Wrong picks are held red and cost the star and the clean bonus.
  - WRAP IT! / SEND IT!, era casts barking in the shared strip, and an attract-mode cook.
- **Delivery Shift:**
  - Money comes from content: the tip starts at $20 with a $2 floor, and fines are per
    difficulty.
  - The nav ladder, the star tally and the level line.
- **Eras:**
  - A city per era (`content/hays*.json`) and a full colour grade per era (`Post.grade`).
  - Menus of 9, 13 and 15 items; Eras 2 and 3 come from the real menu in `Migrated/`.
  - Faces: 6, 5 and 5.
- **Seasons:** winter snow on the ground, roofs and in the air, and looser grip.
- **Music:** 42 MIDI arrangements, two per level plus the title (`src/22_music.js`,
  `tools/music/`). A song is never newer than its level, and at most 2 years older.
- **Controls:** Modes A, B and C on a mode-select screen (`src/25_pad.js`).
- **Attract:** title, winners, board, then a random-level demo (delivery or kitchen).

## Verified

| check | result |
|---|---|
| `node build.mjs` | clean; `taco-shop.html` ~620 KB, 18 modules, all content validated |
| `node test/headless.mjs` | PASS, including run structure, kitchen, kitchen demo and copy sections |
| `node tools/check-pad.mjs` | 209 passed |
| `node tools/music/check-music.mjs` | all music checks pass |
| `node tools/render/sweep.mjs 2` | autoplayers clear every level; Hard deliveries 13 and 15 cleared 1 run in 2 |
| browser | loads and runs in Chrome over `node serve.mjs`, no console errors; the owner has seen it running |

## Next

**The admin overlay**, the tooling for the authored content. It was designed and planned
on 2026-10-25, but **not started**: the owner did not want to begin that day.

- Design: `docs/superpowers/specs/2026-10-25-admin-overlay-design.md`
- Plan: `docs/superpowers/plans/2026-10-25-admin-overlay.md`

When the owner says go, execute the plan **subagent-driven**, which was the owner's
choice. See `ROADMAP.md` for the one owner checkpoint.

## Still open

1. **Depth of playtest.** The kitchen numbers are still the paper estimates from
   `difficulty.md`. The sweep says they are winnable, but nobody has played them long
   enough to say they are fun.
2. **The music by ear.** The arrangements were chosen by structural heuristics.
   - Run `node tools/music/midi2song.mjs --batch tools/music/songs.json --preview` to
     regenerate the WAV previews in `tools/music/preview/`. They are git-ignored.
   - Swap songs in `tools/music/songs.json` and `content/music/playlist.json`.
3. **Mode B on a real stick, and Mode C on a real phone.** A gamepad press is not a gesture
   for unlocking audio, so a stick-only cabinet needs Chrome launched with
   `--autoplay-policy=no-user-gesture-required`.
4. **Music clearance** before any public deploy. This is the owner's action; the owner
   expects to get it.

Known soft spots:
- The era faces don't blink: the eye detector missed. Set `eyes` by hand in
  `content/faces/c70*.json`, `c80*` and `c90*` (they are `[]`); a re-bake writes the
  detector's wrong guess back.
- The kitchen's winter is light: hats only.
- In Mode C the minimap sits under the on-screen stick.

## Deployment

- **<https://carnage-asada.netlify.app>** is public, but it runs the **pre-2026-10-25**
  game, deployed 2026-10-02 from `5f9700f`.
  - Netlify project `carnage-asada`, team Rapideo
    ([admin](https://app.netlify.com/projects/carnage-asada)).
- **It is not wired to GitHub**: a push does not redeploy it.
- **To update it:**
  1. Run `node build.mjs` and `node test/headless.mjs`.
  2. Wrap `taco-shop.html` as the only file in a folder, named `index.html`. The wrap adds
     `<!doctype html>`, `<meta charset="utf-8">` and the viewport tag, the way `build.mjs`
     does for the dev `index.html`; Netlify does not add them.
  3. Run `netlify deploy --prod --dir <folder> --site 4e57ea7d-9859-443a-a44d-7d9c4c60b46d`.
- Never deploy the repo itself: it holds the reference art, the MIDI library and
  `Migrated/`.
- The "Powered by Netlify" badge is off (`built_with_badge_enabled: false`).
