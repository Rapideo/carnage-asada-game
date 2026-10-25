# Resume here

*Written 2026-10-25, after the build that finished the 20-level game, and updated the same
day once the admin overlay had been designed and planned.* This is the starting point for
a fresh session. It is a snapshot: **`ROADMAP.md` is the living plan**, and if the two
disagree, the roadmap wins.

**Start here:** the next piece of work is the admin overlay (see **Next** below). It is
fully designed and planned, and **nothing of it is built**. Do not start it until the
owner says go. When they do, run the plan with `superpowers:subagent-driven-development`
on a branch `admin-overlay`. The design and the plan are written for a fresh context, so
read them before touching code.

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

**Repo state:** `master` is clean apart from the two files untracked on purpose
(`Migrated/`, `Carnage_Resume.pdf`). The last commit adds the overlay's design and plan,
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
