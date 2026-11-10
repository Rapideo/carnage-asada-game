# Music Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hand-made per-level playlists with songs approved by decade, shift and "from" year (like faces), and split Service Mode's Music tab into Not converted / Converted / In game.

**Architecture:** A new `content/music/approved.json` (shaped like `content/casts.json`) replaces `content/music/playlist.json`. The validator computes each level's eligible songs from it and `levels.json`, so `build.mjs` still emits `PLAYLIST` with keys `title`, `1`..`20` and `src/22_music.js` is untouched; `G.playMusic` shuffles a level's list. A new server route deletes an unapproved conversion; the Music panel is rewritten around three batches.

**Tech Stack:** Plain JS (game scripts, no modules), Node ESM tools with no dependencies, `node test/headless.mjs`, `node test/admin.mjs`, `node tools/music/check-music.mjs`.

**Spec:** `docs/superpowers/specs/2026-11-09-music-library-design.md`

## Global Constraints

- Zero dependencies; nothing fetched at runtime; `taco-shop.html` contains no Service Mode code (`test/admin.mjs` `— artifact —`).
- `content/` JSON is the master copy; `docs/authored content/music.md` is generated (never hand-edit values).
- Decades and their level years come from `levels.json`: '70s 1972/1975/1978, '80s 1981/1984/1987, '90s 1990/1993/1996/1999.
- A song never plays before its release year; every level has at least one song for its shift and year.
- Delete and Take out never touch an approved song's file; no action overwrites an existing song id.
- Songs keep their required `month`; the release-month warning and `MUSIC_LOOKBACK` go.
- Branch `music-library`, version `0.9.11` at the end (owner's numbering: 0.9.10, 0.9.11, ...).

## Review Focus

1. **A song taken out while it is the only song for some level and shift.** Expect Save to refuse, naming the level and shift, and nothing written. (Task 1 test.)
2. **Changing a song's "from" to a year before its release** (e.g. Kashmir 1975 to "from the start", 1972). Expect the panel to grey that option and the validator to refuse it. (Tasks 1 and 5.)
3. **Delete on a song that was taken out but not yet saved.** Expect 409 and nothing deleted, because the approved file on disk still names it. (Task 4.)
4. **A Service Mode edit while the level's music plays.** Expect no restart: same key and same song set keep the same order. (Task 2.)
5. **A song on the title list and in a decade at once.** Expect both to work and Delete to refuse it. (Tasks 1 and 4.)

---

### Task 1: approved.json, the validator, and the migration

**Files:**
- Create: `tools/music/migrate-approved.mjs` (one-off; delete it in the same commit after running it)
- Create: `content/music/approved.json` (written by the migration); Delete: `content/music/playlist.json`
- Modify: `tools/content/validate.mjs` (music section), `build.mjs` (drop `musicWarnings`), `admin/store.js:89` (`music/approved.json` instead of `music/playlist.json`), `tools/content/normalize.mjs:7`, `tools/content/server.mjs:301` (reserve id `approved` as well as `playlist`), `tools/music/check-music.mjs:18-19`, `admin/panels/levels.js` (`playlistOf` reads the built `PLAYLIST`, unchanged shape), `tools/content/docs/attract.mjs:36` (comment)
- Test: `test/admin.mjs` `— validator —`, `test/headless.mjs` (new `— music —` section after `— cast —`)

**Interfaces:**
- Produces, exported from `tools/content/validate.mjs`:
  - `APPROVED = 'music/approved.json'`
  - `SHIFTS = ['delivery', 'kitchen']`
  - `eraYears(levels, era) -> number[]` (sorted level years of that era; `era` string or number)
  - `songStart(approved, levels, id) -> number | null` (the `from` year, else its decade's first year; null when not in a decade)
  - `songDecade(approved, id) -> string | null` (`'1'`/`'2'`/`'3'`)
  - `levelSongs(approved, levels, i) -> string[]` (level index i: its era's list for `levels[i].type === 'kitchen' ? 'kitchen' : 'delivery'`, filtered to `songStart <= levels[i].year`, in list order)
  - `inGame(approved, id) -> boolean` (on the title list or in any decade)
  - `validateContent(...)` still returns `playlist` = `{ title: [...], '1': levelSongs(..., 0), ..., '20': ... }`, and now also `approved` (notes stripped).
- Removed: `MUSIC_LOOKBACK`, `songEligible`, `musicWarnings`. `levelMonth` and `MONTHS` stay (the kitchen calendar uses `levelMonth`).

approved.json shape (Both = the id in both lists):
```json
{ "_comment": "...", "title": ["one-step-beyond", "reelin-in-the-years"],
  "1": { "delivery": ["immigrant-song"], "kitchen": ["walk-on-the-wild-side"] }, "2": {...}, "3": {...},
  "from": { "kashmir": 1975 } }
```

- [ ] **Step 1: Write the failing validator tests** in `test/admin.mjs` `— validator —`, replacing the playlist-window and month-warning tests (lines ~149-200 use `music/playlist.json`). Each refusal is a `ContentError` with `file === 'content/music/approved.json'` and the path shown:
  - an id with no song file → path `['1','delivery',j]`;
  - a song in two decades → path `['2','kitchen',j]` (the second occurrence);
  - `from` not a level year of its decade (`kashmir: 1976`) → path `['from','kashmir']`;
  - a start before release (`kashmir` in '70s with no `from`) → path `['from','kashmir']`, message names 1975 and 1972;
  - a level with no song (empty `'1'.kitchen`) → path `['1','kitchen']`, message names level 2 (WINTER 1972) and "kitchen";
  - unknown key `"4"` → path `['4']`; empty or missing `title` → path `['title']`;
  - a stray `from` for a song in no decade is dropped, not refused (as casts do);
  - on disk: `levelSongs` for level 6 equals the six '70s kitchen songs (`walk-on-the-wild-side`, `do-it-again`, `dyer-maker`, `kashmir`, `lovely-day`, `peg`, as sets) and level 1 equals `immigrant-song`, `black-dog`;
  - `inGame` is true for `one-step-beyond` (title only) and `africa`, false for an id in no list.
- [ ] **Step 2: Run** `node test/admin.mjs`. Expected: the new tests FAIL (no `approved.json`, no exports).
- [ ] **Step 3: Write `tools/music/migrate-approved.mjs`.** It reads `content/music/playlist.json` and `content/levels.json`; for each level n (numeric keys only) and each id: decade = `levels[n-1].era`, shift = `levels[n-1].type === 'kitchen' ? 'kitchen' : 'delivery'`, from = the earliest such level year; it omits `from` when it equals the decade's first year; `title` copies over. It writes `content/music/approved.json` through `formatJSON` from `tools/content/format.mjs` with a `_comment` stating the rule ("a level plays every song in its decade and shift whose year has arrived, shuffled; title is in order"). Run it, then delete `playlist.json`.
- [ ] **Step 4: Implement** the exports above and rewrite `buildMusic(src, levels)` to read `APPROVED` (keep the existing tolerant "no approved.json yet" note path), apply the refusals in Step 1, and return `{ music, playlist, approved, note }`. Thread `approved` out of `validateContent`. Update the other files listed under Modify.
- [ ] **Step 5: Add `— music —` to `test/headless.mjs`:** for every level n, `PLAYLIST[n]` is non-empty and every id's `MUSIC[id].year <= level.year`.
- [ ] **Step 6: Run** `node build.mjs`, `node test/headless.mjs`, `node test/admin.mjs`, `node tools/music/check-music.mjs`. Expected: build prints no "warning: level" lines; all PASS. (Docs-mirror tests for music.md may fail until Task 3; note which and leave them for it.)
- [ ] **Step 7: Commit** ("Music: approved.json replaces playlist.json; levels play their decade's songs").

### Task 2: The game shuffles a level's songs

**Files:** Modify `src/80_game.js` (`playMusic`, ~line 460). Test: `test/headless.mjs` `— music —`; `test/admin.mjs` `— apply —` (the Listen/Stop tests around lines 597-655 build lists through `music/playlist.json`: move them to `approved.json`).

**Interfaces:** Consumes `PLAYLIST` (Task 1). Produces `G.musicOrder(key) -> string[]`: for `'title'` the list as is; for a level key a shuffled copy, cached on `G` as `{ key, sig, ids }` where `sig` is the sorted list joined, so the same key and the same set return the same order and anything else reshuffles. `playMusic(key)` plays `musicOrder(key)`.

- [ ] **Step 1: Failing tests** in `— music —`: `musicOrder('title')` deep-equals `PLAYLIST.title`; `musicOrder(6)` has the same set as `PLAYLIST['6']`; two calls with `6` return the identical array; over 20 fresh orders (clearing the cache between) at least two differ; after replacing `PLAYLIST['6']` with a different set, the next call returns the new set.
- [ ] **Step 2: Run** `node test/headless.mjs`; expected FAIL (`musicOrder` undefined).
- [ ] **Step 3: Implement** `musicOrder` (Fisher-Yates with `Math.random`) and use it in `playMusic`. Update the `— apply —` tests to edit `music/approved.json` instead of `music/playlist.json`; the assertion that an edit to the playing list re-plays it should now assert the edited level's new *set*.
- [ ] **Step 4: Run** both suites; expected PASS.
- [ ] **Step 5: Commit** ("Music: a level shuffles its songs, once per key and set").

### Task 3: music.md from approved.json

**Files:** Rewrite `tools/content/docs/music.mjs`; regenerate `docs/authored content/music.md`; Test: `test/admin.mjs` `— docs —` (music cases) and `— docs in step —`. The fixture `test/fixtures/music.hand-edited.md` belongs to the 0.9.1 migration test: retire that test if it can no longer apply, saying so in the commit.

**Interfaces:** `render(files, prevText) -> string` as every doc module. Shape: the rule paragraphs (prose, kept); then one `##` section per decade, e.g. `## I. The '70s (levels 1-6)`, each with `### A. Delivery Shift` and `### B. Kitchen Shift`, each a numbered list `1. <TITLE> - <ARTIST> (<year>), from <from year | the start>`; then `## <roman>. Title Screen` (its prose note, then the numbered title list, in order). A bracketed note after a title is kept as today.

- [ ] **Step 1: Failing tests:** rendering the on-disk content yields the '70s delivery list containing `KASHMIR - LED ZEPPELIN (1975), from 1975`; a prose paragraph added under a decade heading survives a re-render; rendering is stable (render of the render is identical); the generated file on disk equals the render (`— docs in step —`).
- [ ] **Step 2: Run** `node test/admin.mjs`; expected FAIL.
- [ ] **Step 3: Implement** the renderer; rewrite the rule paragraph prose at the top of `music.md` once to the new rule (decade, shift, from year, shuffled; the 2026-10-25 mood split kept), then regenerate it with `renderAll` (`tools/content/docs/index.mjs`, as `retune` did for `difficulty.md`).
- [ ] **Step 4: Run** `node test/admin.mjs`; expected PASS.
- [ ] **Step 5: Commit** ("music.md: generated from approved.json, by decade and shift").

### Task 4: Delete a conversion (server and store)

**Files:** Modify `tools/content/server.mjs` (new builtin route), `admin/store.js` (new `forget`). Test: `test/admin.mjs` `— server —` and `— store —`.

**Interfaces:**
- `POST /admin/api/unport { id }`, registered in `builtin` beside `/admin/api/port`, same Host/Origin checks and `withBusy` lock. Reads `content/music/approved.json` *from disk*; refuses `409 { error: 'in game' }` when `inGame(approved, id)`; `404 { error: 'no such song' }` when there is no `content/music/<id>.json`; `400` for a bad id (same `SONG_ID` rule). On success removes `content/music/<id>.json`, its `tools/music/songs.json` entry (written through `formatSongs`), and `tools/music/preview/<id>.wav` if present; returns `200 { rel: 'music/<id>.json' }`.
- `store.forget(rel)`: removes `rel` from the store's files, base copies, dirty and added sets, so a later save does not resurrect it.

- [ ] **Step 1: Failing tests** in a temp repo copy (as the port tests do, `test/admin.mjs` ~361): unport of a freshly ported unapproved song is 200 and removes the song file, its songs.json entry and a dummy `tools/music/preview/<id>.wav`; unport of `kashmir` (in a decade) and `one-step-beyond` (title only) is 409 with nothing changed; unport of an unknown id is 404; a bad id (`../x`, `Bad`) is 400; a wrong Origin is refused as other POSTs are. Store: after `forget('music/x.json')`, `store.files['music/x.json']` is undefined and the next `save()` body does not include it.
- [ ] **Step 2: Run** `node test/admin.mjs`; expected FAIL.
- [ ] **Step 3: Implement** the route and `store.forget`.
- [ ] **Step 4: Run** `node test/admin.mjs`; expected PASS.
- [ ] **Step 5: Commit** ("Service Mode: delete an unapproved conversion").

### Task 5: The Music panel in three batches

**Files:** Rewrite `admin/panels/music.js` (keep its header comment's role, rewritten); styles in `admin/overlay.css`. Test: `test/admin.mjs` `— music panel —` (rewrite its playlist tests).

**Interfaces:** Consumes Task 1's exports (`APPROVED`, `SHIFTS`, `eraYears`, `songStart`, `songDecade`, `inGame`), Task 4's route and `store.forget`, and today's `/admin/api/midis`, `/admin/api/port`, `Admin.music.listen/stop`. Produces, exported for tests, `batches(files, midis) -> { raw: string[] /* midi files with no song */, conv: string[] /* song ids not in game */, game: { title: string[], eras: { [era]: { delivery: string[], kitchen: string[] } } } }`.

Elements the tests find by data attribute (the mockup is the look: artifact AGWykWZvSyJADwzkPfvYXT):
- counters `button[data-view="raw"|"conv"|"game"]` showing their counts; one view shown at a time;
- Not converted rows `[data-midi]` with `[data-act="convert-open"]`; the form is today's Port form (`[data-act="convert"]`);
- Converted rows `[data-song]` with `[data-act="listen"]`, `[data-act="approve-open"]`, `[data-act="delete"]`; the approve form has `select[data-approve="era"]` (three decades), `select[data-approve="shift"]` (`delivery`, `kitchen`, `both`), `select[data-approve="from"]` (`''` = from the start, then the decade's later level years; options before the song's year `disabled`), and `[data-act="approve"]`;
- In game: per decade a year strip `[data-strip]` with one cell per level year showing the delivery and kitchen counts; rows `[data-song]` with `select[data-shift]`, `select[data-from]` (same disabling) and `[data-act="take-out"]`, `[data-act="listen"]`; then the title list with today's add / remove / reorder controls.

Behaviour: Approve writes the id into `approved.json` (both lists for Both) and sets or clears `from[id]`; changing shift or from edits in place; Take out removes the id from its decade's lists and drops `from[id]` (title untouched); Delete calls the route, then `store.forget('music/<id>.json')` and reloads the library. All edits go through `store.set` and are saved by the normal Save bar.

- [ ] **Step 1: Failing tests:** `batches` on the on-disk content gives `game.eras['1'].kitchen` containing `kashmir`, `conv` empty, and `raw` containing `80s/HazyShadeOfWinter.mid`; the drawn panel shows three counters with those counts; approving a converted song as '80s, both, from 1984 puts its id in `2.delivery` and `2.kitchen` and `from[id] = 1984`; Kashmir's `from` select has the 1972 option disabled; Take out of `africa` removes it from `2.delivery` and drops nothing else; Delete calls `/admin/api/unport` with the id (stub `fetch`) and forgets the file; the title list's add/remove/reorder still edit `approved.json` `title`.
- [ ] **Step 2: Run** `node test/admin.mjs`; expected FAIL.
- [ ] **Step 3: Implement** the panel.
- [ ] **Step 4: Run** `node test/admin.mjs` and `node test/headless.mjs`; expected PASS.
- [ ] **Step 5: Commit** ("Service Mode: the Music tab in three batches").

### Task 6: Docs, version, and the whole check

**Files:** `CLAUDE.md` (the Service Mode bullet "Release months are advice", the `22_music` and `05_content` table rows, "Authored copy" where it lists music), `docs/gdd.md` (the music rule), `ROADMAP.md` (tick the Music tab item), `CHANGELOG.md` (0.9.11 entry), `content/release.json` (`0.9.11`, today's date), `RESUME.md` (start-here line).

- [ ] **Step 1:** Update the docs to the new rule: a level plays every approved song in its decade and shift whose "from" year has arrived, shuffled; the title list is hand-ordered; the release month is recorded, not used.
- [ ] **Step 2: Run** `node build.mjs`, `node test/headless.mjs`, `node test/admin.mjs`, `node tools/check-pad.mjs`, `node tools/music/check-music.mjs`. Expected: all PASS, no build warnings, the artifact free of Service Mode.
- [ ] **Step 3: Commit** ("0.9.11: the music library"), merge to `master`, tag `v0.9.11` locally. Deploy and push only when the owner says so.
