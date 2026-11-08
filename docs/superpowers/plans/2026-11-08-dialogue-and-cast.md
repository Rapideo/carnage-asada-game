# Dialogue and the Speaking Cast Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every customer face its own lines, wire in the nine speaking cast characters, and make room for two-row lines, with all 670 `Migrated/` lines attributed.

**Architecture:** `content/dialogue.json` keeps its shared pools and gains `people` (personal lines per face) and `cast` (nine named characters). The one validator (`tools/content/validate.mjs`) checks all of it, including two-row wrapping against the real bubble width. The game picks lines through one function, and a small new module (`src/73_cast.js`) makes the cast speak at their moments. Service Mode's Dialogue tab and the `dialogue.md` mirror follow the same shape.

**Tech Stack:** Plain browser JS concatenated by `build.mjs` (no imports in `src/`), Node ESM tools, zero dependencies; tests in `test/headless.mjs` and `test/admin.mjs`.

**Spec:** `docs/superpowers/specs/2026-11-08-dialogue-and-cast-design.md`

## Global Constraints

- Zero dependencies; no asset files at runtime; nothing fetched (CLAUDE.md).
- Every line ALL CAPS, drawable by the 5x7 font, at most **2 rows**, each row no wider than the bubble beside the widest face (the validator computes it; never hard-code a pixel limit outside it).
- Shared lines keep era prefixes `2|` / `3|`; personal and cast lines carry none.
- `{ING}` is allowed only in coworker `hint` lines; width is checked with `CHICKEN` substituted.
- Customer moments: `delivered missed late arrive wait queue walkout served wrong`. Cast moments: officer `chase fined lost`; rival `missed perfect`; coworker `hint clockin streak trouble`.
- Cast names, verbatim: SGT. PFEIFER, OFC. KARLIN, OFC. DREILING (officers '70s/'80s/'90s); DUSTY, ACE, JINX (rivals); MARGE, DALE, NIKKI (coworkers).
- Cast face keys: `cop70 cop80 cop90 rival70 rival80 rival90 staff70 staff80 staff90`.
- Personal lines used about 3 in 4 when the face has some for the moment (`PERSONAL_ODDS = 0.75`).
- Rival speaks instead of the customer on a miss or perfect toss 1 in 3 (`RIVAL_ODDS = 1/3`); coworker replaces the customer's queue line 1 in 2 (`TROUBLE_QUEUE_ODDS = 0.5`).
- The cast never speaks in attract mode or the demo.
- `content/dialogue.json` is the master copy; `docs/authored content/dialogue.md` is generated (never hand-edit).
- Commit after each task on branch `playtest-0.9.2`; never push. Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Use the Write/Edit tools for any file containing backslashes (shell heredocs have mangled `\d` in this repo).
- Both `node test/headless.mjs` and `node test/admin.mjs` must print PASS at the end of every task; `node build.mjs` must succeed.

## Review Focus

1. **A word too long for a row** (a 30-letter "HELLOOOO…" line): the build must refuse it with a message naming the line, never let it overflow. Test in Task 1.
2. **Two speakers on one moment** (customer and rival on the same miss; coworker hint while a customer barks): exactly one line shows, no flicker. Test in Task 4 and Task 6.
3. **The cast in attract mode or the demo:** a chase or miss during the demo must not raise a cast line. Test in Task 4.
4. **`{ING}` for a base** (the next step is SMALL / SHELL / LARGE or CHIPS): the plate name of the station is used, not undefined. Test in Task 6.
5. **A face with personal lines for some moments but not others:** a moment with none falls back to shared lines every time. Test in Task 2.

---

### Task 1: Two-row lines

**Files:**
- Modify: `tools/content/validate.mjs` (`buildDialogue`, around the `textPx(body, 1)` width check)
- Modify: `src/72_dialog.js` (`Dialog.say`, `Dialog.draw`)
- Test: `test/admin.mjs` (dialogue validator section), `test/headless.mjs` (`— hud layout —` or a new `— dialogue —` section)

**Interfaces:**
- Produces: `export function wrapRows(body: string, limitPx: number): string[] | null` in `validate.mjs` (greedy word wrap with `textPx`; `null` when a single word is wider than `limitPx`).
- Produces: `export const DLG_MAX_ROWS = 2` in `validate.mjs`.
- Produces: `dlgLimitPx(faces): number` (internal) — the existing `limitPx` computation, reused by Tasks 2 and 4.
- Produces in `src/72_dialog.js`: `Dialog.wrap(line: string, face: string|null): string[]` — the same greedy wrap with `textW`, against the bubble width for that face; `Dialog.say` wraps a single string with it.

- [ ] **Step 1: Write the failing tests** in `test/admin.mjs`: a 50-character shared line made of short words validates and `wrapRows` returns 2 rows; a line needing 3 rows is a ContentError whose message contains `3 rows`; a line with a 40-letter word is a ContentError whose message contains `too wide`. In `test/headless.mjs`: `Dialog.say('CUSTOMER', <the 50-char line>, {face: <widest face key>})` gives `Dialog.lines.length === 2` and every row's `textW` fits the bubble width computed as in `Dialog.draw`.
- [ ] **Step 2: Run both suites; the new assertions FAIL.**
- [ ] **Step 3: Implement.** Validator: replace the one-row width check with `wrapRows`; fail on `null` (`…a word is too wide for one row…`) and on more than `DLG_MAX_ROWS` rows (`…needs N rows; the bubble holds 2…`). Keep the existing error for one-row overflow wording only where it still applies. `Dialog.say`: when `line` is a string, `this.lines = this.wrap(line, o.face)`; an array is used as given. `Dialog.draw` already lays out `n > 1` rows at `by + 9 + i * 11`; confirm both rows sit inside the 34px bubble.
- [ ] **Step 4: Run `node build.mjs`, both suites; PASS.**
- [ ] **Step 5: Render** `node tools/render/frame.mjs 2 12 --say` and check the strip; then commit: `Dialogue: lines may wrap to two rows, checked against the bubble`.

### Task 2: Personal lines in the data and the game

**Files:**
- Modify: `tools/content/validate.mjs` (`buildDialogue`, `DLG_KEYS` stays the shared list), `src/80_game.js` (`pickLine`, `react`), `src/74_kitchen.js` (`bark`)
- Test: `test/admin.mjs`, `test/headless.mjs`

**Interfaces:**
- Consumes: `wrapRows`, `dlgLimitPx` (Task 1).
- Produces: `DIALOGUE.people: { [faceKey: string]: { [moment: string]: string[] } }` (built; empty object when absent).
- Produces: `export const DLG_MOMENTS = ['delivered','missed','late','arrive','wait','queue','walkout','served','wrong']` in `validate.mjs` (DLG_KEYS minus `who`).
- Produces in `src/80_game.js`: `G.lineFor(kind: string, face: string|null): string|null` — personal line with probability `PERSONAL_ODDS` (0.75) when `DIALOGUE.people[face][kind]` is non-empty, else `pickLine(kind)`.

- [ ] **Step 1: Write the failing tests.** `test/admin.mjs`: `people` with a known face and moment validates; an unknown face key, an unknown moment, a lowercase line, an era-prefixed personal line, and a 3-row personal line are each a ContentError on path `['people', face, moment, i]`. `test/headless.mjs`: with `DIALOGUE.people = { c70trucker: { wait: ['ONLY MINE'] } }` and `Math.random` stubbed to 0.1 then 0.9, `G.lineFor('wait','c70trucker')` returns `'ONLY MINE'` then a shared `wait` line; `G.lineFor('served','c70trucker')` (no personal `served`) returns a shared line for both stubs.
- [ ] **Step 2: Run; FAIL.**
- [ ] **Step 3: Implement** the `people` validation in `buildDialogue` (keys must be faces in `content/faces/`, moments in `DLG_MOMENTS`, lines as Task 1 without prefixes) and emit it. Add `G.lineFor`; `G.react` chooses the face first, then the line with `lineFor(kind, face)`; `Kitchen.bark` uses `G.lineFor(kind, t && t.cust ? t.cust.face : null)`.
- [ ] **Step 4: build + both suites PASS.**
- [ ] **Step 5: Commit** `Dialogue: personal lines per face, used 3 in 4`.

### Task 3: Bake the nine cast portraits

**Files:**
- Modify: `tools/render/bake-face.mjs` (env `COLOURS`, env `ACCENTS`)
- Create: `tools/render/bake-cast.mjs`
- Create: `content/faces/cop70.json` … `staff90.json` (9, generated)
- Track: `reference/faces/cast/` (the approved art and `crop-guide.json`; commit it)
- Test: `test/admin.mjs` (`— build —` or faces section)

**Interfaces:**
- Produces: nine faces at 60x74 under the keys in Global Constraints, eyes `[]`.
- `bake-face.mjs`: `COLOURS` (default 15) sets the body colour count; `ACCENTS` is a JSON file path of `[{ "hex": "#94a754", "pixelsAfterInk": [[x,y],...] }, ...]` painted onto the reduced, inked canvas before the palette is taken. Unset, behaviour is unchanged.
- `bake-cast.mjs`: for each of the nine entries in `reference/faces/cast/crop-guide.json`, `<role>-<decade>s` → key per Global Constraints; source `reference/faces/cast/<entry>.png`, crop `bakeCrop`, `MAXW=60 MAXH=74`; officers `COLOURS=15`; rivals `COLOURS=14` + their `accent`; staff `COLOURS=13` + their `accents`.

- [ ] **Step 1: Write the failing test:** each of the nine keys is in `FACES`, is 60x74, has at most 16 palette entries; `rival70`'s palette includes `#94a754`; `staff70`'s includes `#1fa37e` and `#f3bd46`.
- [ ] **Step 2: Run; FAIL.**
- [ ] **Step 3: Implement** the two env options and `bake-cast.mjs`; run it; clear the detected eyes to `[]` as `bake-picks` did (detection is unreliable on these sheets).
- [ ] **Step 4: build + both suites PASS** (the faces appear under "Not in a cast" in `faces.md`; regenerate it with `writeDocs`).
- [ ] **Step 5: Render a proof** of the nine in the strip with each decade's grade (adapt the scratchpad proof approach: `G.toCard` a level of the decade, `Dialog.say(name, 'PROOF', {face})`, crop the portrait) to `reference/faces/cast/baked-proof.png`; commit `Cast: the nine portraits baked with their reserved colours`.

### Task 4: The cast module, officers and rivals

**Files:**
- Create: `src/73_cast.js`
- Modify: `tools/content/validate.mjs` (`cast` in `buildDialogue`), `content/dialogue.json` (`cast` with the officer and rival drafts), `src/80_game.js` (`spawnCop`, pulled-over ticket, pedestrian fine, `LOST THEM`, `THE TRAIN GOT THEM`, `miss`, `complete`)
- Test: `test/admin.mjs`, `test/headless.mjs` (new `— cast —` section)

**Interfaces:**
- Consumes: `wrapRows` (Task 1); the nine faces (Task 3).
- Produces: `DIALOGUE.cast: { [key: string]: { name: string, face: string, era: 1|2|3, role: 'officer'|'rival'|'coworker', lines: { [moment: string]: string[] } } }`, keys `pfeifer karlin dreiling dusty ace jinx marge dale nikki`.
- Produces in `src/73_cast.js`: `const Cast = { who(role, era) -> entry|null, line(entry, moment, vars) -> string|null, say(role, moment, opts) -> boolean }`. `say` returns false (and says nothing) unless `G.state` is `'play'` or `'kitchen'` and `Kitchen.demo` is false (so never in `demo`/`kdemo` or attract), and the strip is not already showing a hostile line with more than 1 second left (a walkout or a complaint wins). `opts.vars.ING` replaces `{ING}`.
- Produces: constants `RIVAL_ODDS = 1 / 3` and `TROUBLE_QUEUE_ODDS = 0.5` in `src/73_cast.js`.

- [ ] **Step 1: Write the failing tests.** Validator: a cast entry with an unknown role, a moment not in its role's list, a face not in `content/faces/`, or `{ING}` outside a coworker `hint` line is a ContentError. Headless (`— cast —`): in a delivery level of era 1, `G.spawnCop()` raises the strip with `Dialog.who === 'SGT. PFEIFER'`; the pulled-over path and `dropCop` via LOST THEM each raise an officer line; with `Math.random` stubbed below `RIVAL_ODDS`, `G.miss(...)` shows `DUSTY` and not CUSTOMER, and above it shows CUSTOMER; with `G.state = 'demo'`, `G.spawnCop()` raises nothing.
- [ ] **Step 2: Run; FAIL.**
- [ ] **Step 3: Implement** the validation and emission of `cast`; write the officer and rival entries into `content/dialogue.json` from the drafts in `reference/assets/dialogue-candidates.json` (`drafts`, by `who` and `moment`, text verbatim); add `src/73_cast.js`; call `Cast.say('officer','chase')` in `spawnCop`, `'fined'` on the pulled-over ticket and the pedestrian fine, `'lost'` at LOST THEM and THE TRAIN GOT THEM; in `miss` and `complete(perfect)`, `if (Math.random() < RIVAL_ODDS && Cast.say('rival', perfect ? 'perfect' : 'missed')) skip the customer's react`.
- [ ] **Step 4: build + both suites PASS.**
- [ ] **Step 5: Commit** `Cast: officers and rivals speak`.

### Task 5: The next-ingredient hint

**Files:**
- Modify: `content/difficulty.json` (kitchen: `hint`, new `hintNewOnly`, new `hintStall`), `tools/content/validate.mjs` (difficulty kitchen checks), `src/74_kitchen.js` (stall timer, hint trigger, new-dish set), `admin/panels/difficulty.js` (two new rows), `tools/content/docs/difficulty.mjs` (mirror)
- Test: `test/admin.mjs`, `test/headless.mjs` (`— kitchen —`)

**Interfaces:**
- Produces: `diff.kitchen.hint: boolean`, `diff.kitchen.hintNewOnly: boolean`, `diff.kitchen.hintStall: number` (seconds, > 0). Values: easy `true,false,3`; medium `true,true,3`; hard and supreme `false,false,3`.
- Produces in `Kitchen`: `newDishes: Set<string>` (item names new to this era: not on `MENUS[era-1].items` by name, or with a different `recipe`; all items in era 1), `stallT: number`, `hintFor(item) -> boolean`, `fireHint(G, why: 'stall'|'wrong')` (sets `hintT = 1.6` and calls `Cast.say('coworker','hint', {vars:{ING: plateName(want)}})` once per item step).

- [ ] **Step 1: Write the failing tests.** Headless: on an Easy kitchen level, building an item and advancing `hintStall + 0.1` seconds with no pick sets `Kitchen.hintT > 0`; a pick resets `stallT`; on a Medium level an old dish never hints and a dish in `newDishes` does; on Hard nothing hints; a wrong pick on Easy hints. Admin: `hintStall` of `0` or `"3"` is a ContentError; the Difficulty tab renders rows for `kitchen.hintNewOnly` and `kitchen.hintStall`.
- [ ] **Step 2: Run; FAIL.**
- [ ] **Step 3: Implement**; the existing wrong-pick flash now goes through `fireHint(G, 'wrong')`, gated by `hintFor`. Rename the Difficulty row label to `Next-ingredient hint` and add `Only for new dishes` (bool) and `Hint after a stall of` (seconds). Extend `difficulty.md`'s Hint field to describe the three values.
- [ ] **Step 4: build, regenerate docs (`writeDocs`), both suites PASS.**
- [ ] **Step 5: Commit** `Kitchen: the next-ingredient hint after a stall or a wrong pick`.

### Task 6: Coworkers speak

**Files:**
- Modify: `content/dialogue.json` (coworker entries from the drafts), `src/74_kitchen.js` (clock-in, clean streak, trouble, hint plate over the strip), `src/80_game.js` only if the kitchen clock check lives there
- Test: `test/headless.mjs` (`— cast —`)

**Interfaces:**
- Consumes: `Cast.say` (Task 4), `fireHint` (Task 5).
- Produces in `Kitchen`: `cleanRun: number` (clean tickets in a row; reset by a dirty ticket and after the streak line), `troubleSaid: boolean` (per shift, for the clock).

- [ ] **Step 1: Write the failing tests.** On a kitchen level of each era, entering raises the coworker for that era within the first second (`Dialog.who` is MARGE / DALE / NIKKI); serving 3 clean tickets raises a `streak` line and resets `cleanRun`; setting `G.shift = 29.9` raises `trouble` once and not again; a hint whose next step is a base (`SHELL`) says a line containing `SHELL`, and one for `LETTUCE` contains `LETTUCE`; a coworker hint never fires in `kdemo`; while the coworker speaks a hint for a lower-row bin, the hint plate is drawn after `Dialog.draw` (assert via a draw-order spy).
- [ ] **Step 2: Run; FAIL.**
- [ ] **Step 3: Implement**, with the queue replacement at `TROUBLE_QUEUE_ODDS = 0.5`.
- [ ] **Step 4: build + both suites PASS; render a kitchen frame with a coworker hint** and check the plate shows.
- [ ] **Step 5: Commit** `Cast: coworkers speak, and voice the hint`.

### Task 7: Shared lines re-checked, and the 670 attributed

**Files:**
- Modify: `content/dialogue.json` (shared moments re-checked; `people` filled)
- Create: `reference/assets/line-attribution.json` (the working record: source section, original text, final text, face, moment, what changed and why)
- Test: build and both suites

**Interfaces:**
- Consumes: `people` (Task 2), the 120 customer faces (`content/casts.json`, labels in `reference/assets/casting-picks.json` and `reference/assets/art-inventory.json`; the 16 originals' labels are in `art-inventory.json` with `faceKey`).
- Source lines: `reference/assets/dialogue-candidates.json` (`candidates`: 670, with `section`, `text`, `flags`), from `Migrated/angry-customer-lines-vol1.md` and `vol2.md` (owner pointed at them, 2026-11-08).

- [ ] **Step 1: Re-check the 85 shared lines' moments;** move a line only where another moment clearly fits better, and record each move in the commit message.
- [ ] **Step 2: Attribute in three batches** (lines 1-225, 226-450, 451-670), each to `line-attribution.json`: one face (any of the 120, by look, age and decade) and one customer moment per line, applying the spec's rules (anachronisms out, accents only where the character fits, language as written, at most 2 rows, the 34 longest trimmed keeping the joke). A line's references must fit the face's decade and anything after 1999 never appears.
- [ ] **Step 3: Write `people` from `line-attribution.json`; `node build.mjs` must accept every line** (fix any the validator refuses, in the record too).
- [ ] **Step 4: Report the spread:** lines per face (min, median, max) and faces with none; no face should hold more than 15 unless its character clearly calls for it.
- [ ] **Step 5: Both suites PASS; commit** `Dialogue: the 670 Migrated lines, each with its speaker`.

### Task 8: Service Mode and the docs mirror

**Files:**
- Modify: `admin/panels/dialogue.js` (character picker), `tools/content/docs/dialogue.mjs` (Shared / The cast / Customers), `test/admin.mjs`
- Regenerate: `docs/authored content/dialogue.md`

**Interfaces:**
- Consumes: `people`, `cast` (Tasks 2, 4, 6).
- Panel: a picker of `Shared`, the nine cast names, and every face with personal lines (plus an "add lines for…" face list); the chosen speaker's moments render with the existing row builder, bound to `[key, i]`, `['people', face, moment, i]` or `['cast', key, 'lines', moment, i]`; Say it uses the speaker's face and name.
- Docs: `## I. Shared lines` (by moment, as today), `## II. The cast` (`### <name>` per character, moments as fields), `## III. Customers` (`### <face>` per face with lines); `read(text)` returns `{ shared, cast, people }` for the round-trip test.

- [ ] **Step 1: Write the failing tests:** picking `MARGE` shows her four moments; editing a personal line writes `['people', face, moment, i]`; `dialogue.md` renders the three sections and round-trips through `read`.
- [ ] **Step 2: Run; FAIL.**
- [ ] **Step 3: Implement; regenerate the doc with `writeDocs`.**
- [ ] **Step 4: Both suites PASS.**
- [ ] **Step 5: Commit** `Service Mode: dialogue by speaker; dialogue.md grouped by speaker`.

### Task 9: The owner's proof, and the docs

**Files:**
- Modify: the Casting Call review page sources in the scratchpad (`review/template.html`, `review/build.mjs`): a read-only **Who says what** tab (shared lines; each cast character with portrait and lines; each customer face with portrait and personal lines), plus the Task 3 cast proof image; republish to `https://claude.ai/artifact/LFMAnoCD9cA4GdK49k6SdS`.
- Modify: `CLAUDE.md` (Faces and the dialogue strip; Authored copy: `people`, `cast`, two rows), `ROADMAP.md` (Q7 and the hint marked done), `docs/gdd.md` only where it states the line rules.

- [ ] **Step 1: Build the tab** from `content/dialogue.json` and the proof tiles; publish.
- [ ] **Step 2: Update the docs.**
- [ ] **Step 3: Full verification:** `node build.mjs`, both suites PASS, renders of one delivery and one kitchen frame with a cast line.
- [ ] **Step 4: Commit** `Docs: the speaking cast and personal lines`.
