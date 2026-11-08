# Resume here

*Written 2026-10-25, after the build that finished the 20-level game, and updated the same
day once the admin overlay had been designed and planned. Updated 2026-11-06 with two
pinned art threads, and 2026-11-07 with the art director's prep-board work (below), the
kitchen surroundings, and version 0.9.0.*
This is the starting point for a fresh session. It is a snapshot: **`ROADMAP.md` is the
living plan**, and if the two disagree, the roadmap wins.

**Start here (2026-11-07): the game is version 0.9.0, feature-complete.** The version is
`content/release.json`, shown in the corner of the title and pause screens; `CHANGELOG.md`
says what is in it, and it is tagged `v0.9.0` (local).

**Next: the owner's full playtest (planned for Monday, 2026-11-09) and the punch list it
produces.** Fix from that list as 0.9.x builds (bump the version and add a changelog entry
for each). Then, only when the owner says go, the admin overlay.

**Driving Chrome:** two Chromes are connected to the owner's account. **Browser 1 is
Windows, this machine; Browser 2 is a Mac.** Pick Browser 1 (`select_browser`) before
loading `localhost`. Both "Chrome can't reach the server" failures on 2026-11-07 were
Browser 2. The server also has to run in the owner's own terminal: a `node serve.mjs`
started from this harness runs in a sandbox that Chrome can't see. The Chrome tool won't
open `file://` URLs at all.

The order the owner set on 2026-11-07, all done:

1. ~~Finish this art pass.~~ **Done 2026-11-07:** the art director's prep-board frames,
   all 26 dishes, are **in the game** (see **The art director and the prep board** below).
   The owner also tried the approved ingredient art in the wells, and **chose to keep
   the old wells.**
2. ~~The owner playtests.~~ **Done 2026-11-07,** as an hour of the autoplayers in Chrome
   with the owner watching. The notes are in **`docs/playtest-2026-11-07.md`**. Everything
   it found was then fixed, the same day:
   - the ticket line running into two-digit tickets;
   - "TOSS THE BAG" at the shop;
   - the edge label on the order card;
   - NO ACTIVE ORDER while restocking;
   - RECALCULATING flashing for 29% of a shift (now about 9%, via `Nav.continues`/`recent`);
   - "CONTINUE IN 0 M";
   - two overlaps at the dock.

   The owner also asked for **weather**, now built: a delivery level rolls sunny or rainy
   in summer, snowy or sunny in winter, each play. There's a **rain sound** too. Police
   chases were left alone, after the corrected numbers (the notes first said there were
   none; there were plenty). The rain sound was checked only against a stub
   AudioContext: Chrome stopped reaching the local server partway through the session.
   **Have the owner listen to it.**
3. **The kitchen levels' surrounding art: done and committed 2026-11-07.** The
   owner's concepts and rulings are in `reference/kitchen/surroundings/` and the
   hand-off log (`docs/art-direction-welcome.md`). The art director mocked up one wall
   per decade, and I redrew them procedurally in `Kitchen.buildBg`:
   - **The wall:** '70s enamel tile, '80s wood paneling, '90s blue laminate and plastic.
   - **The calendar** shows the level's own month and year.
   - **The sign** is jade and gold.
   - **The dining room** gets a rope line, a trash can, a cactus, a condiment stand,
     a door mat and its own floor per decade.
   - **The counter** gets a front lip per decade.

   The owner approved the concept. No 2000s look; it's saved for a sequel. **Known
   limit:** a 4- or 5-item ticket (medium and harder) hangs to y 66–74 and covers the
   top of the calendar and the sign. The owner has been told.

Then version 0.9.0 and a cleanup pass (stale docs, the changelog, `git gc`). Waiting
behind the punch list, and only when the owner says go: **the admin overlay** (see **Next**
below), fully designed and planned, nothing built.

## The art director and the prep board (2026-11-07)

The owner put a **Codex agent in charge of art direction and concept generation**. The two
agents talk only through **`docs/art-direction-welcome.md`**. The top of that file is the
pipeline briefing. Below it is a dated **hand-off log**: each side appends a
`### date · sender → receiver · subject` section, and **OWNER** marks the questions only
the owner can answer. Watch that file for replies. A polling loop over its mtime and
`git status` works; keep it light, because an earlier watcher was killed for low memory.

**Rulings made 2026-11-07, all by the owner:**
- **`docs/authored content/menu.md` is law** for every dish's ingredients and order.
  `content/menus.json` mirrors it, and the two agree today. The real restaurant menu
  (`Migrated/Taco Shop Menu - July 2026.md`, tacoshop.net) is only for how food looks.
- **Twelve bins, no more.** Monterey Jack, olives and Mexicalli rice are dropped from every
  dish; `menu.md` notes each drop. **ONION is green onions.**
- **Hard-shell tacos are drawn side-on**, with the fillings piled above the rim.
- **Cheddar stays orange. Chili con queso is a pale, creamy yellow**, glossy, with small
  red flecks. The v2 Nachos are the reference.
- **Smothered dishes are built open and shown smothered only on the wrapped frame.**
- **About 250 KB of extra file size** for the board frames is approved.

**The format the art director delivers**, which is what the game will load:
- one transparent **40×38 PNG per distinct build state**, named by recipe prefix
  (`LARGE-BEANS-CHEESE.png`), with shared states drawn once;
- a separate wrapped frame where the dish changes when wrapped (rolls about 38×20);
- a `manifest.json` mapping each dish's build and finished state.

The full menu is 78 build states plus 26 wrapped frames, 104 frames at most.

**Where it stands:** the pilot (Hard Taco Supreme, Bean Burrito, Nachos) went two rounds
and **v2 is approved**: `reference/kitchen/review/2026-11-07-board-pilot-v2.zip`. Round 1
failed on taco fillings too thin to read at 1×, which the 4× proofs hid. Measure each pick
at 1× on the board's colours: a pick should strongly change roughly 100+ pixels, and
the v2 taco does 99–155. The renders are `reference/kitchen/review/*-review-x5.png`.

The scripts that made them live in the session scratchpad and are gone. The method:
reduce each state to 15 colours with `reduce.mjs` (`medianCut` + `snap`), centre it in a
64×42 cell of `PAL.dirt` with a 2-row `PAL.porch` edge, darken alternate rows by 18%,
and upscale ×5. For the pick test, diff consecutive states and count pixels whose RGB
distance is over 180.

**Done (2026-11-07).** The full set went through one fix round and two drop-in patches.
The chili was redrawn as a maroon stew with beans, because it had read the same as the
beef and sauce. The refried beans were unified to one lighter colour. **The owner
approved it.** The assembled set, the full pack with both patches applied, is
**`reference/kitchen/board-frames/`**: 88 transparent 40×38 PNGs plus `manifest.json`
(each dish's recipe, build keys, finished key and eras), 253 KB as PNG. Every recipe
matches `menu.md`. The packs and renders behind it are in `reference/kitchen/review/`.

**In the game (2026-11-07).** `tools/render/bake-board.mjs` bakes `board-frames/` into
`content/board/` (one 16-colour table per frame) and `content/board.json` (the finishes
that differ from the last build frame). `build.mjs` inlines them as `BOARD` and
`BOARD_FINISH`, and **fails if any dish on any menu is missing a step or finish frame**.
`Kitchen.pic()` now draws `BOARD[Kitchen.frameKey(def, step, done)]`, and the procedural
board code (`picShell`, `picOpen`, `picBurrito`, `picSoft`, `picNachos`) is deleted. The
cost: 145 KB of tables, taking `taco-shop.html` from 634 KB to 763 KB. Tests: `— kitchen —`
looks up all 204 step and finish frames through `frameKey`. **A new dish or a changed
recipe now needs its frames drawn and baked before the build passes**, which is the
art director's job (`docs/art-direction-welcome.md`). See `docs/art_pipeline.md`,
"Build Progress frames".

## The well art: tried, and the old wells kept (2026-11-07)

**Decided by the owner on 2026-11-07: keep the old wells.** The approved pans were baked
into `content/lattice/` and rendered in place, then reverted. In place they read worse:
- **They don't match the table.** They are free-standing silver pans seen at an angle,
  while the cells, and the EMPTY wells, are sunken wells.
- **Less food shows.** About half of each pan is its side.
- **The greens are hard to tell apart.** Lettuce, green onion and jalapeño all read as
  green piles.
- **The beans read as a smooth stripe.**

Don't re-bake the wells from this set unless the owner asks. The ONION well is still
white onion, although the owner ruled ONION is green onions on the board. That is the one
mismatch; it was raised, and the owner kept the old wells anyway. What follows is the
earlier analysis, kept for its reasoning.

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

Every menu key has a match, confirmed 2026-11-07: BEEF 01, CHICKEN 02, BEANS 04,
LETTUCE 05, CHEESE 06, CREAM 08, TOMATO 09, ONION 10 (green onions, the owner's ruling;
the current well is white), PEPPERS 12 (jalapeños; the current colour is a green
pepper), CCQ 15, CHILI 16, SAUCE 17 (mild/Taco Shop sauce). Bases: SHELL 31, SMALL 32,
LARGE 33, CHIPS 36. Unused for now: 03 shredded pork, 07 jack, 11 olives,
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
cutout that exists. **Decided 2026-11-07: baked art from the art director**, one frame
per distinct state (see **The art director and the prep board** above).

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

**Repo state (2026-11-07):** `master` is clean apart from the files untracked on purpose
(`Migrated/`, `Carnage_Resume.pdf`, and since 2026-11-06
`Pixel-Art Taco Shop Ingredient Grid.png`). Since 2026-11-06 the commits have been docs,
reference art and `menu.md` only. **No game code has changed**, so the build and test
results below still hold. As of the admin overlay's design commit, re-checked:
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
