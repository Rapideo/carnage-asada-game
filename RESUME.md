# Resume here

*Written 2026-10-25, after the build that finished the 20-level game, and updated the same
day once the admin overlay had been designed and planned. Updated 2026-11-06 with two
pinned art threads, and 2026-11-07 with the art director's prep-board work (below), the
kitchen surroundings, and version 0.9.0. Updated 2026-11-07 (evening) for Service Mode, version 0.9.1, and
2026-11-08 for version 0.9.2 (the new customers, their lines, and the speaking cast), and again the same day for 0.9.3.*
This is the starting point for a fresh session. It is a snapshot: **`ROADMAP.md` is the
living plan**, and if the two disagree, the roadmap wins.

**Start here (2026-11-09, late): version 0.9.13 is live on Netlify and pushed (tag `v0.9.13`): every customer says only their own lines at 13 moments (4,689 lines, the owner approved them all), four new moments (perfect, near miss, fender, nailed), and traffic per difficulty (easy 3 cars, a Service Mode setting).** The owner's corner-aiming report was traffic boxing the car in, not the throw (the throw works on phone and pad). Before it: 0.9.12 (happy-moment lines) and 0.9.11 (the music library), both live. `content/music/approved.json` replaces `playlist.json`; songs are placed by decade, shift and "from" year like faces, and a level shuffles every song whose year has arrived. Service Mode's Music tab shows Not converted / Converted / In game, with Delete (`/admin/api/unport`). The owner has not tried the new tab yet. 0.9.9 added `?target=N`, 0.9.10 quieted the coworker.

**Before that (2026-11-09, night): the live game was version 0.9.8, and the owner says it is "playing wonderfully" on the Pixel.** 0.9.6 eased Hard and toughened Supreme; 0.9.7 made the touch stick aim while TOSS is held, and the owner had it reverted in 0.9.8, which instead gives TOSS four arrow pips and lifts it to 3 rows under ORDERS. The right end of the streak line now sits partly behind TOSS: **the owner has accepted that overlap for now**, so do not "fix" it unasked. A phone checklist is open (claude.ai artifact 7rKhSJctnKCc7oZmLtJvUJ, collection `checks`); read it when the owner says it is done. Before that came 0.9.5, on `master`, tagged
`v0.9.5`, pushed and deployed to Netlify (https://carnage-asada.netlify.app).** The owner's full
playtest of 0.9.3 passed 30 of 33 checks (a checklist page, claude.ai artifact
LtGvNjXd6zubSeEpFQVRBF, its notes in the page's `checks` collection), and everything it found
shipped the same day:
- **0.9.4:** the owner's controller is an **Xbox Wireless Controller (Series X|S) over
  Bluetooth**, which Chrome reports without the standard mapping, so X (the throw), Menu, View and
  the d-pad were read from the wrong slots. `Pad.RAW_LAYOUTS` maps it by vendor:product (layout
  measured on the pad). The triggers are now gas and brake on any pad. Also yesterday's TOSS move
  (checked on the phone) and the 3 s gust minimum.
- **0.9.5:** the dialogue strip is drawn after the vignette and the grade (portraits 25-60%
  brighter; the owner: "the face tweaks were nice"); the windsock is removed (drift kept, by
  ruling); the gust warning's dust is denser, with a dark underline, so it shows on snow.

`frame.mjs` gained `--face <key>` and `--gust`. Branches `tweaks-0.9.4` and `tweaks-0.9.5` are merged
and local only.

**Next:** the open items in `ROADMAP.md`, chiefly **operator settings** (configurable controller
buttons, owner 2026-11-09; nothing designed yet) and the owner's judgement calls left over from
the 0.9.x list (police cost, downtown targets, the Hard delivery levels 13 and 15).

**Deploying** (Netlify is not wired to git): build and test, wrap `taco-shop.html` as `index.html`
with doctype, charset, `viewport-fit=cover` and the manifest link, beside `deploy/manifest.webmanifest`,
the two icons and `deploy/_headers`, then `netlify deploy --prod` (see Deployment below).

`docs/art-direction-welcome.md` holds the owner's own uncommitted edits: leave it alone.

Before that, 0.9.2 was on `master`, tagged `v0.9.2`, pushed and deployed to Netlify. It added:
- 104 new customers, growing through each decade;
- their 670 lines of their own;
- the nine-character speaking cast;
- the next-ingredient hint;
- two-row speech.

0.9.1 added Service Mode to the feature-complete 0.9.0. The version is `content/release.json`,
shown in the corner of the title and pause screens; `CHANGELOG.md` says what is in each.
(0.9.2's "next" list, the eyes on the 113 new faces and the Pixel 10 touch controls, is done in 0.9.3.)

**Service Mode** is the owner's name for the admin overlay: run `node admin.mjs` in your
own terminal, open <http://localhost:8124/>, press **F2**. It edits Levels, Menu, Attract,
Music, Difficulty, Dialogue and Faces, and has a Test tab. Its code is `admin/` and
`tools/content/`; `CLAUDE.md` has the architecture. The JSON in `content/` is now the master
copy, and `docs/authored content/*.md` are generated from it (do not hand-edit them).

**The owner's full playtest (Monday, 2026-11-09). The 0.9.x list below is DONE in 0.9.3**
(full list in `ROADMAP.md`, "NEXT: the 0.9.x list"):
- rain grip 0.84 to 0.75; remove red (#d94f4f) from the traffic colours;
- one customer face per address for the whole run;
- snow tracked in on winter kitchen levels; the Mode C landscape stick moved to mid-left, which
  frees the minimap's corner (the minimap itself did not move).
(The nine-portrait cast was 0.9.2 and the kitchen calendar 0.9.1; both are in `CHANGELOG.md`.)
Decisions needing no work (keep mouse-aim, police cost, downtown targets, long tickets over
the calendar, the flaky demo test, the branch name `master`) are in the roadmap too, along
with E5: judge graded frames by eye, not by the GDD X.1 targets. **E8, music clearance, is
closed.** Bump the version and add a changelog entry for each 0.9.x build.

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

Then version 0.9.0 and a cleanup pass (stale docs, the changelog, `git gc`), and then
Service Mode (0.9.1, see above).

## The art director and the prep board (2026-11-07)

The owner put a **Codex agent in charge of art direction and concept generation**. The two
agents talk only through **`docs/art-direction-welcome.md`**. The top of that file is the
pipeline briefing. Below it is a dated **hand-off log**: each side appends a
`### date · sender → receiver · subject` section, and **OWNER** marks the questions only
the owner can answer. Watch that file for replies. A polling loop over its mtime and
`git status` works; keep it light, because an earlier watcher was killed for low memory.

**Rulings made 2026-11-07, all by the owner:**
- **`docs/authored content/menu.md` was law** for every dish's ingredients and order.
  `content/menus.json` mirrored it. Since 0.9.1 the JSON is the master copy and `menu.md` is
  generated from it, but the two still agree, and the ruling's content stands. The real restaurant menu
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

**Repo state (2026-11-07, 0.9.1):** the work is on branch `admin-overlay`, ahead of `master`
and never pushed. Untracked on purpose: `Migrated/`, `reference/faces/` and `Art Director (Codex)/`.
Earlier note: `master` was clean apart from the files untracked on purpose
(`Migrated/`, `Carnage_Resume.pdf`, and since 2026-11-06
`Pixel-Art Taco Shop Ingredient Grid.png`). Since 2026-11-06 the commits have been docs,
reference art and `menu.md` only. **No game code has changed**, so the build and test
results below still hold (they were last re-checked at 0.9.1; see **Verified**). Earlier, as of the admin overlay's design commit:
`node build.mjs` was clean, reproduced every generated file byte for byte, and
`node test/headless.mjs` passed. `master` is **ahead of `origin/master` and not pushed**;
push only when the owner says so. The music previews (`tools/music/preview/`, git-ignored)
were copied in from the archive, so they are present here.

- **The run:**
  - The level card shows the target, the clock rules and the nav level; the kitchen card
    shows the menu.
  - A level is a checkpoint race: 15 completions, or 12 on Supreme. Every 3rd completion
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
  *(0.9.11: songs are now approved by decade, shift and "from" year, and a level shuffles every
  song whose year has arrived; see `CLAUDE.md`.)*
- **Controls:** Modes A, B and C on a mode-select screen (`src/25_pad.js`).
- **Attract:** title, winners, board, then a random-level demo (delivery or kitchen).

## Verified

| check | result |
|---|---|
| `node build.mjs` | clean (0.9.1); `taco-shop.html` ~794 KB, 18 modules, all content validated; three season warnings (levels 3 and 16, by owner ruling) |
| `node test/headless.mjs` | PASS (about 280 assertions), including run structure, kitchen, kitchen demo, test hooks and copy sections |
| `node test/admin.mjs` | PASS (about 650 assertions): validator, server, every panel, the docs mirror, and that the artifact holds no Service Mode |
| `node tools/check-pad.mjs` | 209 passed |
| `node tools/music/check-music.mjs` | all music checks pass |
| `node tools/render/sweep.mjs 2` | autoplayers clear every level; Hard deliveries 13 and 15 cleared 1 run in 2 |
| browser | loads and runs in Chrome over `node serve.mjs`, no console errors; the owner has seen it running |

## Next

The Monday playtest and the 0.9.x list above. **Service Mode is done** (0.9.1). Not done by
design, per its spec: city zoning (`hays*.json`) is not editable in it, and it never commits.

The remaining era faces' eyes beyond the 15 decade faces, and the nine new cast faces once
baked, are set by the owner in the Faces tab.

## Still open

1. **Depth of playtest.** The kitchen numbers are still the paper estimates from
   `difficulty.md`. The sweep says they are winnable, but nobody has played them long
   enough to say they are fun.
2. **The music by ear.** The arrangements were chosen by structural heuristics.
   - Run `node tools/music/midi2song.mjs --batch tools/music/songs.json --preview` to
     regenerate the WAV previews in `tools/music/preview/`. They are git-ignored.
   - Curate songs in Service Mode's Music tab (convert, listen, approve, place); it writes
     `tools/music/songs.json` and `content/music/approved.json`.
3. **Mode B on a real stick, and Mode C on a real phone.** A gamepad press is not a gesture
   for unlocking audio, so a stick-only cabinet needs Chrome launched with
   `--autoplay-policy=no-user-gesture-required`.
4. ~~**Music clearance.**~~ **Closed 2026-11-07:** the owner ruled it is not a concern.

Known soft spots:
- ~~The era faces don't blink.~~ Fixed 2026-11-07: eyes hand-set on the 15 decade faces in
  the Faces tab, and they survive a re-bake.
- The kitchen's winter is light: hats only.
- In Mode C **portrait** the minimap sits under the on-screen stick (portrait is unchanged
  by ruling). In landscape (0.9.3) the stick is mid-left in the margin and clears it.

## Deployment

- **<https://carnage-asada.netlify.app>** is public and runs **0.9.13**, deployed
  2026-11-09 from the commit tagged `v0.9.13` (pushed to GitHub the same day). Earlier the same day,
  0.9.12 was deployed from `v0.9.12`, 0.9.11 was deployed from `v0.9.11` and 0.9.3 from `v0.9.3`; 0.9.2 was
  deployed on 2026-11-08 from `v0.9.2`. 0.9.0 was
  deployed on 2026-11-07 from `d717fee`. The owner
  ruled the same day that music clearance is not a concern for deploying; don't raise it
  again.
  - Netlify project `carnage-asada`, team Rapideo
    ([admin](https://app.netlify.com/projects/carnage-asada)).
- **It is not wired to GitHub**: a push does not redeploy it.
- **To update it:**
  1. Run `node build.mjs` and `node test/headless.mjs`.
  2. Wrap `taco-shop.html` in a folder as `index.html`. The wrap adds `<!doctype html>`,
     `<meta charset="utf-8">`, the viewport tag
     `<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">`
     (`viewport-fit=cover` is what lets the safe-area insets see the camera cutout) and
     `<link rel="manifest" href="manifest.webmanifest">`. `build.mjs` adds none of these to
     `taco-shop.html` (its dev `index.html` wrapper has the doctype and charset only), and
     Netlify does not add them, so the deploy wrapper must.
     **`viewport-fit=cover` is essential:** without it the safe-area insets read 0 and the
     stick sits under the camera.
  3. Copy `deploy/manifest.webmanifest`, `deploy/icon-192.png` and `deploy/icon-512.png`
     into the same folder, beside `index.html`, and `deploy/_headers` too (it serves the
     manifest as `application/manifest+json`; Netlify would otherwise send it as a binary). They make it installable to the home
     screen (`display: fullscreen`, landscape). Redraw the icons with
     `node tools/render/icons.mjs`. **The manifest link goes in the deployed wrapper only,
     never in `taco-shop.html`**: the single file stays free of external requests, and
     `— artifact —` in `test/admin.mjs` checks it.
  4. Run `netlify deploy --prod --dir <folder> --site 4e57ea7d-9859-443a-a44d-7d9c4c60b46d`.
- Never deploy the repo itself: it holds the reference art, the MIDI library and
  `Migrated/`.
- The "Powered by Netlify" badge is off (`built_with_badge_enabled: false`).
