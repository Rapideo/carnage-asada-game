# Admin Overlay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A dev-only overlay inside the running game that edits every authored content file
through forms, checks each edit with the build's own validator, shows it live in the game,
saves the JSON plus a regenerated `.md` mirror, and has a Test panel that reaches any level
or state.

**Architecture:** The validation in `build.mjs` moves into an import-free ES module that
validates a *source* (the filesystem in Node, an in-memory map in the browser), so the build,
the save endpoint and the live checks all run one implementation. A new localhost-only
server, `admin.mjs`, serves the game with the overlay scripts injected into `index.html` at
request time. It also writes files, regenerates the docs and runs the existing tools as child
processes. The overlay is plain ES modules in `admin/` that mutate the game's content globals
in place.

**Tech Stack:** Node built-ins, plain browser JavaScript (ES modules for `admin/`, classic
scripts for `src/` as today), no dependencies.

**Spec:** `docs/superpowers/specs/2026-10-25-admin-overlay-design.md`. Read it, and the
repo's `CLAUDE.md`, before Task 1. Section references like §4.4 are to the spec.

## Global Constraints

- Zero dependencies: no `package.json`, no npm, no CDN. Node built-ins and browser APIs only.
- Nothing from `admin/`, `admin.mjs` or `/admin/api` may appear in `taco-shop.html`.
- `admin.mjs` binds `127.0.0.1` only, port `8124`. `serve.mjs` is not modified.
- `tools/content/validate.mjs` imports nothing, so the browser can import it unchanged.
- Exactly one implementation of every content check. The overlay never re-codes a rule.
- The JSON is the master copy. The `.md` docs are a mirror rewritten on every save, and
  nothing reads a value *from* an `.md`.
- Save writes files and rebuilds. No git operations, no diff view.
- Every top-level name in `admin/` lives under one `Admin` namespace. Run
  `node tools/collide.mjs <file>` on any file added to `src/`.
- Money is integer cents in JSON, shown as dollars in forms.
- Work on a branch `admin-overlay`. Commit at the end of every task. Never push.
- Write files with the Write/Edit tools, not shell heredocs: heredocs mangle non-ASCII
  here, and the docs contain some.
- Visual work is verified by rendering and looking, in the browser over `node admin.mjs`,
  not by assertion alone.
- After every task: `node build.mjs`, `node test/headless.mjs` and `node test/admin.mjs`
  all pass.

## Review Focus

1. **Typing in a form field drives the game.** Expected: while any overlay control has focus,
   no key reaches `Input` or `Pad`, including arrows, Space, Enter and Escape. Pinned in
   Task 5.
2. **A content file changed on disk after the overlay loaded it** (a hand edit, a
   `git checkout`). Expected: Save refuses with "changed on disk, reload" rather than
   overwriting. Pinned in Task 4.
3. **Two saves at once** (a double-click, or a save during a port or bake). Expected: one runs,
   the other gets a clear "busy" refusal, and no file is half-written. Pinned in Task 4.
4. **Pasted curly quotes or lowercase in any copy field.** Expected: the field flags the
   offending characters by name, exactly as the build would, and lowercase is accepted and
   shown uppercase the way the game draws it. Pinned in Task 1 (the validator names the
   character on its field) and Task 9 (seen in the browser).
5. **A live edit the running state cannot absorb**: deleting a menu item that is on a live
   ticket, shrinking the playlist that is playing, removing the face that is talking.
   Expected: no exception, and the affected screen restarts cleanly. Pinned in Task 5,
   with a case added by each panel task.

---

### Task 1: Shared validator

Move every content check out of `build.mjs` into `tools/content/validate.mjs`, parameterised
by a source. The build's output must be **byte-identical** before and after.

**Files:**
- Create: `tools/content/validate.mjs` (no imports)
- Create: `tools/content/fs-source.mjs` (Node-only, `node:fs`)
- Create: `test/admin.mjs` (zero-dep harness, same `ok(cond, msg)` style and exit code as `test/headless.mjs`)
- Modify: `build.mjs` (lines 1–670 become an import and one call; the emit code from line 672 on stays)

**Interfaces:**
- Produces:
  - `class ContentError extends Error { file: string; path: (string|number)[] }`. `file` is
    the repo-relative path the message already names (`'content/difficulty.json'`). `path`
    is the key path inside it (`['easy','fines','ticket']`, `[]` when there is none).
    `message` is **exactly** today's message text.
  - `validateContent(src) -> Built`, where `Built = { content, maps, attract, scores, faces,
    dialogue, difficulty, menus, levels, lattice, music, playlist }`, the same objects
    `build.mjs` builds today, with notes stripped.
  - Source interface: `{ readJSON(rel) -> any, list(relDir) -> string[] | null }`. `rel` is
    relative to the content dir (`'levels.json'`, `'faces'`, `'music/playlist.json'`).
    `list` returns sorted `.json` names, or `null` if the directory is absent.
    `readJSON` throws `ContentError` on a missing file or bad JSON, with the message format
    `readJSON` uses today.
  - `memSource(files: {[rel]: any}) -> Source` (in `validate.mjs`)
  - `fsSource(dir = 'content') -> Source` (in `fs-source.mjs`)
  - Re-exported constants the overlay will reuse rather than copy: `FONT_CHARS`, `VW`,
    `DIFF_KEYS`, `NAV_KEYS`, `BIN_COUNT`, `NOW_PX`, `nowCost`, `MIN_SECS`, `MAX_SECS`,
    `DLG_MAX_CHARS`, `MUSIC_LOOKBACK`, `SEASONS`, `TYPES`.

- [ ] **Step 1: Record the baseline.** Run `node build.mjs && sha1sum taco-shop.html index.html src/05_content.js > "$SCRATCH/baseline.sha"`, with `$SCRATCH` being the session scratchpad.
- [ ] **Step 2: Write the failing tests** in `test/admin.mjs`, section `— validator —`:

```js
import { validateContent, memSource, ContentError } from '../tools/content/validate.mjs';
import { fsSource } from '../tools/content/fs-source.mjs';
const disk = validateContent(fsSource('content'));
ok(disk.levels.length === 20, 'validates the shipped content from disk');
// the same files, held in memory, validate to the same result
const files = loadAllContentJSON('content');   // helper in the test: walk content/, rel -> JSON.parse
ok(JSON.stringify(validateContent(memSource(files))) === JSON.stringify(disk), 'memory and disk agree');
// a broken value is reported with its location
const bad = structuredClone(files); bad['difficulty.json'].easy.fines.ticket = -1;
let e = null; try { validateContent(memSource(bad)); } catch (x) { e = x; }
ok(e instanceof ContentError && e.file === 'content/difficulty.json'
   && e.path.join('.') === 'easy.fines.ticket', 'error carries file + path');
ok(/must be integer cents/.test(e.message), 'message text unchanged');
const bad2 = structuredClone(files); bad2['winners.json'].slogan = 'WINNERS DON’T';
e = null; try { validateContent(memSource(bad2)); } catch (x) { e = x; }
ok(e && e.file === 'content/winners.json' && e.path[0] === 'slogan' && /’/.test(e.message), 'curly quote named, on its field');
```

- [ ] **Step 3: Run it to see it fail.** `node test/admin.mjs`. Expected: the import fails, because the module does not exist.
- [ ] **Step 4: Implement.** Move `stripNotes`, `drawable`, every `buildX` and its constants into `validate.mjs`. Replace each `readFileSync(join('content', …))` and `JSON.parse(readFileSync(…))` with `src.readJSON(rel)`, and `jsonFiles(join('content', d))` with `src.list(d)`. Replace each of the 111 `throw new Error(msg)` with `fail(file, path, msg)` (`throw new ContentError(...)`), keeping `msg` identical. `build.mjs` then reads `const built = validateContent(fsSource('content'))` and destructures what its emit code already uses.
- [ ] **Step 5: Run the tests.** `node test/admin.mjs` should PASS. Then `node build.mjs && sha1sum -c "$SCRATCH/baseline.sha"` should report all three files OK, and `node test/headless.mjs` should PASS.
- [ ] **Step 6: Commit.** `git checkout -b admin-overlay`, then `git add tools/content test/admin.mjs build.mjs`, then `git commit -m "Content validation is a module the build and the overlay share"`.

---

### Task 2: One JSON format for hand-authored files

Saves rewrite whole files, so every hand-authored file is normalised to the writer's format
**once**, in its own commit, so that later saves produce clean diffs.

**Files:**
- Create: `tools/content/format.mjs`
- Modify (reformat only): `content/winners.json`, `scores.json`, `attract.json`, `levels.json`, `difficulty.json`, `menus.json`, `dialogue.json`, `music/playlist.json`, `tools/music/songs.json`
- Test: `test/admin.mjs`, section `— format —`

**Interfaces:**
- Produces: `formatJSON(value) -> string`. `JSON.stringify(v, null, 2)` with arrays of primitives collapsed onto one line (the `pretty` rule in `build.mjs`), plus a trailing `\n`. `songs.json` keeps one song per line: `formatSongs(value) -> string`.
- Not touched: `content/faces/*`, `content/lattice/*`, `content/music/*.json` except the playlist. Those are written by their tools, in the tools' formats.

- [ ] **Step 1: Write the failing test.** For each listed file: `deepEqual(JSON.parse(formatJSON(x)), x)`, and `formatJSON(JSON.parse(formatJSON(x))) === formatJSON(x)`, where `x` is the parsed file.
- [ ] **Step 2: Run** `node test/admin.mjs` and confirm it FAILS on the missing module.
- [ ] **Step 3: Implement `formatJSON` and `formatSongs`.** Then add `tools/content/normalize.mjs`, a one-shot script that rewrites the listed files with them.
- [ ] **Step 4: Run the script.** Then check: `node test/admin.mjs` PASSes; `node build.mjs` leaves `src/05_content.js` byte-identical, because only whitespace moved; and `git diff --stat` touches only the listed files.
- [ ] **Step 5: Commit.** `"Normalise the hand-authored content files to the overlay's writer"`.

---

### Task 3: Difficulty tuning that lives in code moves into `difficulty.json`

§4.4, the owner's ruling: Hint, Ticket Limit and the Points Bonus amounts become content.
Behaviour at today's values must not change.

**Files:**
- Modify: `content/difficulty.json` (all four difficulties), `tools/content/validate.mjs` (`buildDifficulty`)
- Modify: `src/80_game.js:25-26` (`PERFECT_BONUS` and `CLEAN_BONUS` removed), `:302` (`cleanBonus`), `:522`, `:533`, and the `DIFF_FALLBACK` definition
- Modify: `src/74_kitchen.js:39` (`RAIL_MAX`, `QUEUE_MAX`), `:336` (the hint)
- Test: `test/headless.mjs` (`— kitchen —`, `— scoring —`), `test/admin.mjs` (`— validator —`)

**Interfaces:**
- New fields, per difficulty:
  - `perfectBonus`: integer cents, `500`
  - `kitchen.cleanBonus`: integer cents, `500`
  - `kitchen.hint`: boolean. `true` for easy only.
  - `kitchen.railMax`: integer ≥ 1, `3`
  - `kitchen.queueMax`: integer ≥ 0, `3`
- The game reads `G.diff.perfectBonus`, `G.diff.kitchen.cleanBonus` and `G.diff.kitchen.hint`. `Kitchen.RAIL_MAX` and `Kitchen.QUEUE_MAX` become getters on `G.diff.kitchen`, so existing call sites and tests keep their names. `DIFF_FALLBACK` gains the same fields with the same values.

- [ ] **Step 1: Write the failing tests.**
  - In headless `— kitchen —`: on an easy level, a wrong pick sets `Kitchen.hintT === 1.6`; on medium it stays `0`. After setting `DIFFICULTY.easy.kitchen.railMax = 2` and re-entering a kitchen level, `Kitchen.RAIL_MAX === 2`. Restore it afterwards.
  - In `— scoring —`: a perfect delivery pays `G.diff.perfectBonus` more than an imperfect one.
  - In admin `— validator —`: `kitchen.hint: "yes"` gives a `ContentError` with path `[k,'kitchen','hint']`.
- [ ] **Step 2: Run both suites** and confirm the new assertions FAIL.
- [ ] **Step 3: Implement.** Add the fields to the JSON and the validator (cents through `isCents`, booleans through `typeof`), then make the game reads listed above. Update the `CLAUDE.md` sentence "`80_game.js` keeps only `PERFECT_BONUS`, `CLEAN_BONUS`, `BAG_MAX` and a `DIFF_FALLBACK`" to drop the two bonuses.
- [ ] **Step 4: Run all three suites** and confirm they PASS. Then `node tools/render/sweep.mjs 2` should still clear every level.
- [ ] **Step 5: Commit.** `"Hint, ticket limit and the bonuses are difficulty content"`.

---

### Task 4: The admin server

**Files:**
- Create: `admin.mjs` (CLI: `node admin.mjs`), `tools/content/server.mjs` (the testable core)
- Test: `test/admin.mjs`, section `— server —`

**Interfaces:**
- Consumes: `validateContent` and `memSource` (Task 1), `fsSource` (Task 1), `formatJSON` and `formatSongs` (Task 2).
- Produces: `startAdmin({ root, host = '127.0.0.1', port = 8124 }) -> Promise<{ url, close() }>`. `admin.mjs` calls it with `root = process.cwd()`.
- Routes:
  - `GET /`, `GET /index.html`: the on-disk `index.html`, with `<link rel="stylesheet" href="/admin/overlay.css"><script type="module" src="/admin/overlay.js"></script>` inserted before `</body>`. Nothing is written to disk.
  - Any other `GET`: a static file under `root`, `no-store`, with the `..` guard `serve.mjs` uses, and `.mjs` served as `text/javascript`.
  - `GET /admin/api/content` returns `{ files: {rel: raw JSON with notes}, stamp: {rel: mtimeMs} }` for every `.json` under `content/`.
  - `POST /admin/api/save` takes `{ files: {rel: raw}, stamp: {rel: mtimeMs} }` (changed files only) and responds:
    - `409 {error:'changed', files:[rel]}` if any file's on-disk mtime differs from its stamp;
    - `409 {error:'busy'}` if a save or a job is already running;
    - `422 {error:'invalid', file, path, message}` from a `ContentError`, with nothing written;
    - `200 {ok:true, build: stdout, stamp}` after it writes every file (`formatJSON`), calls the `afterWrite(files)` hook (a no-op until Task 6) and runs `node build.mjs` with `cwd = root`;
    - `500 {error:'build', output}` if the build itself fails.
  - Every `POST` is refused `403` unless `Origin` is `http://127.0.0.1:<port>` or `http://localhost:<port>`.
  - `runJob(cmd: string[], { cwd }) -> Promise<{ code, stdout, stderr }>` is an exported helper that later tasks use for the tool scripts. It shares the busy lock with save.

- [ ] **Step 1: Write the failing tests.** Copy `build.mjs`, `shell.html`, `src/`, `content/` and `tools/content/` into a fresh temp dir, then `startAdmin({ root: tmp, port: 0 })`.
  - `GET /` contains `/admin/overlay.js`, and the temp dir's `index.html` on disk does not.
  - A save with `levels.json` level 1's `season` set to `'spring'` returns 422 with path `[0,'season']`, and the file on disk is byte-unchanged.
  - A valid save (level 1's name reformatted, still valid) returns 200 and the file on disk equals `formatJSON(edited)`.
  - A save with a stale stamp returns 409 `changed`.
  - Two saves fired together: exactly one 200 and one 409 `busy`.
  - A POST with `Origin: http://evil.example` returns 403.
  - The server's address is `127.0.0.1`.
- [ ] **Step 2: Run** `node test/admin.mjs` and confirm it FAILS on the missing module.
- [ ] **Step 3: Implement `startAdmin`, the routes and `runJob`.** Write each file to `<file>.tmp` and then rename it over the original, so a crash never leaves half a file.
- [ ] **Step 4: Run the tests** and confirm they PASS. Run `node admin.mjs` and open `http://localhost:8124/`: the game plays, and the console shows only a 404 for `overlay.js`, which is expected until Task 5.
- [ ] **Step 5: Add a test that keeps admin code out of the ship.** In `test/admin.mjs` (`— artifact —`), after `node build.mjs`, `taco-shop.html` contains none of `Admin`, `/admin/`, `admin.mjs`. Commit: `"admin.mjs: a localhost server that writes content through the validator"`.

---

### Task 5: The overlay shell

**Files:**
- Create: `admin/overlay.js` (entry point: toggle, tabs, save bar), `admin/store.js` (raw files, dirty tracking, validate, apply), `admin/fields.js` (bound form controls), `admin/apply.js` (pushes built content into the game), `admin/overlay.css`
- Create: `test/sandbox.mjs`, the game-in-a-vm loader taken out of `test/headless.mjs` lines 1–78. Modify `test/headless.mjs` to import it. Its assertions are unchanged.
- Modify: `src/90_main.js` if `Input` needs a guard (see Step 3)

**Interfaces:**
- Consumes: `GET /admin/api/content` and `POST /admin/api/save` (Task 4); `validateContent` and `memSource` (Task 1, imported from `/tools/content/validate.mjs`).
- Produces:
  - `Admin.store`: `{ files, stamp, dirty: Set<rel>, get(rel, path), set(rel, path, value), validate() -> {built} | {error: ContentError}, save() -> Promise }`. `set` marks the file dirty, then validates and applies.
  - `Admin.tab(id, title, render(el))` registers a panel, which later tasks call. Tab order: Levels, Menu, Attract, Music, Difficulty, Dialogue, Faces, Test.
  - `Admin.field(el, { rel, path, kind, options?, toJSON?, fromJSON? })` creates a control bound to `store`. `kind` is one of `'text' | 'int' | 'money' | 'bool' | 'select' | 'seconds'`. `'money'` shows dollars and stores cents. Every control carries `data-rel` and `data-path`, so a `ContentError` lands on its control (red outline, message under it). An error whose path matches no control shows in the save bar.
  - `Admin.applyBuilt(built, game)` replaces in place: `CONTENT`, `ATTRACT`, `SCORES`, `LEVELS`, `DIFFICULTY`, `MENUS`, `DIALOGUE`, `FACES`, `LATTICE`, `MUSIC`, `PLAYLIST`. For an object it deletes the keys and then assigns; for an array it sets `length = 0` and pushes. Then it runs every refresher registered with `Admin.onApply(kind, fn)` for the kinds that changed.
  - `Admin.restartScreen()` re-enters the current state through `G.setLevel(G.levelN)` and then `G.toCard(G.levelN)`, or through the attract entry point for an attract state. Refreshers call it when the live state cannot absorb an edit.
- Toggle: backtick (`Backquote`). The game keeps running while the overlay is open.
- A banner reads "unsaved edits — reload discards them" while `dirty` is non-empty.

- [ ] **Step 1: Write the failing tests** in `test/admin.mjs`, section `— apply —`. Use `test/sandbox.mjs` to boot the game in a vm, load `admin/apply.js` into the same context, and then:
  - start a kitchen level with a live ticket for item 0, remove that item from `MENUS[era].items`, call `applyBuilt`, then run 120 `G.update(1/60)` frames without throwing;
  - on `play` with level 1, set `PLAYLIST['1']` to a single other song, `applyBuilt`, and 60 frames run without throwing;
  - after `applyBuilt`, `LEVELS === <the same array object as before>`, because identity is kept.
- [ ] **Step 2: Run** `node test/admin.mjs` and confirm it FAILS.
- [ ] **Step 3: Implement the five files.** Input isolation: a `keydown`/`keyup` listener on `window` in the **capture** phase that calls `stopImmediatePropagation()` whenever `document.activeElement` is inside the overlay. Check that `Input` and `Pad` attach their listeners to `window` or `document` in the bubble phase; if either uses capture, change it to bubble in `src/` and say so in the commit. Backtick toggles the overlay even while a field has focus.
- [ ] **Step 4: Run the tests** and confirm they PASS. **Browser check:** `node admin.mjs`, open `http://localhost:8124/`, and press backtick: the empty tabs appear over the running game. Focus any text box and hold the arrow keys and Space: the car does not move. Screenshot it.
- [ ] **Step 5: Commit.** `"The admin overlay shell: tabs, bound fields, live apply, save"`.

---

### Task 6: The docs mirror engine, the rename, and `levels.md`

**Files:**
- Rename: `git mv` each of `docs/authored content/{attract,difficulty,levels,menu,music}.md.md` to `*.md`. Update every reference (`grep -rn "md\.md"`), including `_comment` strings in JSON, `docs/gdd.md` and `CLAUDE.md`.
- Create: `tools/content/docs/engine.mjs`, `tools/content/docs/levels.mjs`, `tools/content/docs/index.mjs`
- Modify: `tools/content/server.mjs`: `afterWrite` renders every registered doc; new route `GET /admin/api/drift`
- Modify: `content/levels.json`: remove the `_fixes` note once `levels.md` is regenerated
- Test: `test/admin.mjs`, section `— docs —`

**Interfaces:**
- `engine.mjs`:
  - `parseMd(text) -> Node`, where `Node = { heading: string|null, depth, lines: string[], children: Node[] }`. `toMd(node) -> string` must give `toMd(parseMd(t)) === t` for every doc.
  - `setField(node, key, valueText, { match: RegExp })`. The node's line `- <key> : <old><tail>` becomes `- <key> : <valueText><tail>`, where `<old>` is the leading run of the line that `match` accepts and `<tail>` is everything after it, which is how notes after a value survive. `Key: v` with no space before the colon is normalised to `Key : v`. If the key is missing, the line is appended after the node's last field line.
  - `syncList(parent, items, { heading(item, i), fill(node, item, i) })`. This makes `parent.children` one node per item in order, reusing existing nodes by position, creating new ones and dropping extras. Prose lines inside a reused node are kept.
  - `roman(n)`, `letter(i)`: the numbering the docs use (`I.`, `A.`, `1.`).
  - **Same-as rule:** a node whose only non-blank line matches `/^Same as (\w+)/` is left alone while every field it would own equals that difficulty's or section's values. Otherwise the line is replaced by the fields.
- A doc module exports `{ file: 'levels.md', render(files, prevText) -> string }`. `index.mjs` exports `DOCS = [levels, …]`, which later tasks extend, and `renderAll(files, readDoc) -> {file: text}`.
- `GET /admin/api/drift` returns `[{ file, lines: number }]`: per doc, the count of lines that differ between the doc on disk and `render(files, onDisk)`.
- **levels.md schema.** Per level, under `## <roman(n)>. Level <n>`:
  - `Sequence`: `n`
  - `Game Type`: `Delivery` / `Kitchen`
  - `Name`: the JSON `name`, as stored
  - `Era`: `1970s` / `1980s` / `1990s`
  - `Music`: `<year> - <Delivery|Kitchen>`
  - `Difficulty`: capitalised key
  - `Season`: `Summer` / `Winter`

  The preamble before `## I.` is prose, and stays.

- [ ] **Step 1: Write the failing tests:**
  - `toMd(parseMd(t)) === t` for all five docs.
  - Rendering `levels.md` from today's JSON: the result contains `## XVIII. Level 18` and `## XX. Level 20`, and contains neither `IIXX` nor `Leve 20`.
  - Every line of the preamble survives.
  - Idempotent: `render(f, render(f, t)) === render(f, t)`.
  - With level 5's `season` set to `'winter'`, the `Level 5` node contains `- Season : Winter`.
  - In a temp root, a valid save rewrites `docs/authored content/levels.md`.
- [ ] **Step 2: Run** `node test/admin.mjs` and confirm it FAILS.
- [ ] **Step 3: Do the rename** and implement the engine, `levels.mjs`, the `afterWrite` wiring and the drift route.
- [ ] **Step 4: Run all suites** and confirm they PASS. Then run the renderer once over the real repo, read the regenerated `levels.md` end to end, and remove `_fixes` from `levels.json`.
- [ ] **Step 5: Commit.** `"Docs mirror: the authored docs are generated from the JSON; levels.md first"`.

---

### Task 7: Levels panel

**Files:** Create `admin/panels/levels.js`. Modify `admin/overlay.js` to import it.

**Interfaces:**
- Consumes: `Admin.tab`, `Admin.field`, `Admin.store` and `Admin.onApply` (Task 5).
- A list of the 20 levels; selecting one shows Sequence (read-only), Game Type, Name, Era, Difficulty, Season and Music (read-only text: the level's playlist, linking to the Music tab).
  - Difficulty options come from `Object.keys(DIFFICULTY)`; Game Type, Era and Season from `TYPES`, `[1,2,3]` and `SEASONS`.
  - "Play this level" calls `Admin.test.jump(n, 'card')`. Until Task 15 that falls back to `G.startRun(n)`.
- Refresher `levels`: if the edited level is the current one, `Admin.restartScreen()`.
- On first open, the drift report appears as one line: "N lines in the docs differ from the JSON; the next save rewrites them."

- [ ] **Step 1: Write the failing test.** In `test/admin.mjs` (`— docs —`): a level whose name is `'SUMMER 1972'` but whose season is `winter` produces a `ContentError` whose path is `[0,'name']`, which is what the panel highlights.
- [ ] **Step 2: Run it and confirm it FAILS.** If the existing check reports the path as `[0,'season']`, fix the path in `validate.mjs`; the field the message names is `name`.
- [ ] **Step 3: Implement the panel.**
- [ ] **Step 4: Browser check.** Change Level 3 to Summer: the name field goes red until the name says SUMMER. Fix the name and Save: `levels.json` and `levels.md` both change, and the build output appears in the save bar. Reload, and the edit is still there. Undo it with `git checkout content/levels.json "docs/authored content/levels.md"`.
- [ ] **Step 5: Commit.** `"Levels panel"`.

---

### Task 8: Difficulty panel and `difficulty.md`

**Files:** Create `admin/panels/difficulty.js` and `tools/content/docs/difficulty.mjs`; register the doc in `index.mjs`.

**Interfaces:**
- One column per key of `DIFF_KEYS`. Rows:
  - **Clock:** start, extend, maxExt, target
  - **Tips:** tipStart, tipFloor, tipDecay
  - **Fines:** ticket, ped, train, remake
  - **Nav:** the five keys of `NAV_KEYS`
  - **Kitchen:** tipPerItem, decay, maxItems, every, railMax, queueMax, hint, cleanBonus
  - **Bonus:** perfectBonus
- A read-only row: `((tipStart - tipFloor) / tipDecay).toFixed(0) + 's'`, captioned "tip reaches the floor".
- Money fields use `kind: 'money'`. `tipDecay` and `kitchen.decay` are cents per second and are shown as `$1.00 / N s`; the field edits N.
- `difficulty.md` schema: map each `- Key : value` line the doc has today to its JSON path. Audit the whole file and list the mapping as a table at the top of `difficulty.mjs`. Lines not in the table are prose. The Same-as rule from Task 6 handles the "Same as Easy" sections.
- Refresher `difficulty`: `G.setLevel(G.levelN)` (the current difficulty's values reach `G.diff`).

- [ ] **Step 1: Write the failing tests** (`— docs —`):
  - `difficulty.md` round-trips and is idempotent.
  - Setting `medium.fines.ticket = 1200` makes the Medium Penalties node read `- Speeding Ticket : 12.00`.
  - With Medium equal to Easy in a section, its "Same as Easy" line survives; with them different, it is replaced by fields.
  - The line `Starting Tip per Item : 5.00` keeps its tail when the value changes.
- [ ] **Step 2: Run them and confirm they FAIL.**
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Browser check.** Turn Easy's `nav.line` off and the validator refuses it with the ladder message on that cell. Change Easy's `tipDecay` and the derived row updates. Save, then read the regenerated `difficulty.md`: its prose is intact.
- [ ] **Step 5: Commit.** `"Difficulty panel and difficulty.md"`.

---

### Task 9: Attract panel and `attract.md`

**Files:**
- Create: `admin/panels/attract.js`, `tools/content/docs/attract.mjs`
- Modify: `src/80_game.js:44-48`. Remove `ATTRACT_TITLE`, `ATTRACT_WINNERS`, `ATTRACT_DEMO`, `ATTRACT_SCORES` and `TITLE_HOLD`, and read `ATTRACT.<screen>.seconds` and `ATTRACT.title.wordmarkHold` where they were used. Update `test/headless.mjs` references.
- Modify: `content/attract.json`, adding `demo.levels`, and `validate.mjs` (`buildAttract`) and `G.toDemo`.

**Interfaces:**
- `attract.demo.levels`: `"random"` or a non-empty array of distinct integers 1..20. `G.toDemo(n)` picks `n || this.demoPin ||` a random member of that set.
- Panel:
  - the four screens in order, each with seconds (`kind: 'seconds'`, 3–600), plus the cycle total;
  - title: `wordmarkHold`;
  - winners: `slogan`, `attribution` (each string or lines; a textarea, one line per row), `credit`;
  - scores: the factory board as 10 rows of `ini` + money;
  - demo: Random, or a checkbox per level.
- "Show it" per screen: `G.toTitle()`, `G.toWinners()`, `G.toScores()`, `G.toDemo()`.
- Refreshers:
  - `attract`: if in an attract state, restart that screen.
  - `scores`: `Scores.load()`, because the factory board changed.

- [ ] **Step 1: Write the failing tests:**
  - headless `— attract —`: the rotation still reads its durations, now from `ATTRACT`;
  - with `ATTRACT.demo.levels = [2]`, 20 calls to `G.toDemo()` all pick level 2 (clear `G.demoPin` around it, then restore);
  - admin `— validator —`: `demo.levels: [0]` is refused with path `['demo','levels']`;
  - `— docs —`: `attract.md` round-trips, the "FBI Director" and "Overlay Text" lines survive as prose, and a changed `winners.seconds` shows as `- Duration : 0:12 seconds`.
- [ ] **Step 2: Run them and confirm they FAIL.**
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Browser check.** Paste `WINNERS DON’T` (curly apostrophe) into the slogan: the field names `’` exactly as the build would. Type lowercase: it is accepted and shown uppercase on the card behind the panel. "Show it" on Winners: the card shows the edit live. Screenshot both.
- [ ] **Step 5: Commit.** `"Attract panel and attract.md; the demo's level set is content"`.

---

### Task 10: Menu panel, well recolouring and `menu.md`

**Files:**
- Create: `admin/panels/menu.js`, `tools/content/docs/menu.mjs`
- Modify: `tools/content/server.mjs`, adding `POST /admin/api/recolor`

**Interfaces:**
- `POST /admin/api/recolor` takes `{ src, name, hue, sat, val }` and runs `runJob(['node','tools/render/recolor-lattice.mjs', src, name, hue, sat, val])`. It responds `409 {error:'exists'}` if `content/lattice/<name>.json` already exists, and otherwise `200 { rel, json }`. **Generated assets are written when generated:** they are inert until a save references them, and no endpoint overwrites an existing file.
- Panel, one tab per era:
  - **The bin board:** a 2×6 grid with base stations either side. Each bin shows its well, decoded with `Faces.decode(LATTICE[key])` and drawn to a small canvas at 2×. Bins filled by an earlier era are read-only, and only empty slots take a new ingredient.
  - **Items:** name, short (shows `NOW_PX - nowCost(short, steps)` px left, and characters left), base (a select of base stations), up to 6 ingredients (selects from this era's filled bins), and price (`money`). Add, remove and reorder items.
  - **New ingredient in an empty bin:** an ingredient name, a source well and hue/sat/val, with a Preview button that calls recolor and shows the result. The ingredient joins the bin on Save.
- Refresher `menus`: if `G.stage === 'kitchen'`, `Kitchen.buildWells()` then `Admin.restartScreen()`.
- `menu.md` schema: per era `## <roman>. Era <n>`, then `### A. Bins` with `#### <i>. <name>` (`[EMPTY]` for none), then `### A.1 Base Stations`, then `### B. Items` with `#### <i>. <name>` and fields Short, Ingredient 0..k, Price. Prose under `### A.1` and `### B.` (the Short sizing note) survives.

- [ ] **Step 1: Write the failing tests:**
  - `— server —`: recolor into an existing name returns 409; a new name returns 200 and writes `content/lattice/<name>.json` in the temp root;
  - `— docs —`: `menu.md` round-trips; adding an item to Era 1 adds `#### 10. <name>` with its fields; the sizing note survives;
  - `— apply —` (Review Focus 5) is already covered by Task 5's removed-item case, so extend it to a removed *bin*.
- [ ] **Step 2: Run them and confirm they FAIL.**
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Browser check.** Lengthen a short name past the budget and watch the field refuse it with characters to trim. Recolour CHILI from BEANS under a test name to see the preview, then delete the test file. Change a price on a kitchen level and see it on the next ticket.
- [ ] **Step 5: Commit.** `"Menu panel, in-tool well recolouring, and menu.md"`.

---

### Task 11: Dialogue panel and the new `dialogue.md`

**Files:**
- Create: `admin/panels/dialogue.js`, `tools/content/docs/dialogue.mjs`, `docs/authored content/dialogue.md` (generated, then committed)

**Interfaces:**
- One section per key of `DLG_KEYS`. `who` is a single text field; every other key is a list of lines. Each line has an era dropdown: **All eras / 1980s on / 1990s on**, stored as no prefix, `2|` or `3|`.
- The width check is the validator's (bubble width derived from the widest face). The live field shows it.
- "Say it" calls `Admin.test.say(line, face)` (Task 16). Until then it falls back to `G.react` with a temporarily pinned line.
- `dialogue.md` structure: a one-paragraph preamble (written once, then kept as prose), then `## <roman>. <Key>` per key and a numbered list of lines in JSON form, with `(1980s on)` / `(1990s on)` after tagged lines.

- [ ] **Step 1: Write the failing tests** (`— docs —`): `dialogue.md` renders from the JSON; a `2|` line appears with `(1980s on)`; the render is idempotent; and an over-wide line is a `ContentError` with path `[key, index]`.
- [ ] **Step 2: Run them and confirm they FAIL.**
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Browser check.** Add an over-wide line and watch it flag. Shorten it, then "Say it" with an era face: it shows in the strip. Screenshot.
- [ ] **Step 5: Commit.** `"Dialogue panel and dialogue.md"`.

---

### Task 12: Faces: explicit casts, hand-set eyes, new faces, `faces.md`

**Files:**
- Create: `content/casts.json` (`{ "1": [6 keys], "2": [5 keys], "3": [5 keys] }`, today's prefix result), `admin/panels/faces.js`, `tools/content/docs/faces.mjs`, `docs/authored content/faces.md`
- Modify: `tools/content/validate.mjs` (add `casts` to `Built`: every key names a face, and no era is empty), `build.mjs` (emit `const CASTS`), `src/74_kitchen.js:190` (`castFor` returns `CASTS[era]`, falling back to `[DLG_FACE]`), `test/headless.mjs` (hand out `CASTS` in `__k`), `tools/render/bake-face.mjs` (keep hand-set eyes)
- Modify: `tools/content/server.mjs`, adding `POST /admin/api/face`

**Interfaces:**
- Hand-set eyes are marked by the note key `"_eyesByHand": true` in the face JSON, stripped from the ship like every note. `bake-face.mjs` gains an exported `keptEyes(prev: object|null, detected: number[][]) -> { eyes, byHand: boolean }`, which returns `prev.eyes` and `true` when `prev?._eyesByHand`, and `detected` and `false` otherwise. Before writing, the bake reads the existing `content/faces/<name>.json` and writes what `keptEyes` returns. Guard the script's CLI body so that importing it for the test does not run a bake.
- Eyes are `[[x, y, w, h], …]` in face pixels, the format `smokerbust.json` already uses.
- `POST /admin/api/face` takes `{ name, png: base64, crop?: [x,y,w,h] }`. It saves the image where `docs/art_pipeline.md` keeps reference art, and runs `fit-portrait.mjs` and `bake-face.mjs` with the size budget and arguments that doc gives. It responds `409` if the face exists, `200 { rel, json, log }` on success, and `422 { log }` when the pipeline fails, so its output reaches the panel.
- Panel:
  - **Cast per era:** each era's faces, plus "add from all faces".
  - **Eyes:** the selected face drawn at 4×; drag a rectangle per eye; Clear. Saving sets `_eyesByHand`.
  - **New face:** drop an image, optionally crop, then Bake. The result is drawn in the dialogue strip at game size via `Admin.test.say`.
- Refresher `faces`: `Faces.build()`. If the face that is talking was removed, `Dialog` falls back to `DLG_FACE`.
- `faces.md`: per era, the cast and each face's name, size and whether its eyes are set.

- [ ] **Step 1: Write the failing tests:**
  - headless `— kitchen —`: `Kitchen.castFor(2)` equals `CASTS['2']`;
  - admin `— validator —`: a cast naming a missing face is refused with path `['1', i]`;
  - `keptEyes({ eyes: [[1,2,3,4]], _eyesByHand: true }, [[9,9,9,9]])` returns eyes `[[1,2,3,4]]` and byHand `true`; `keptEyes({ eyes: [] }, [[9,9,9,9]])` and `keptEyes(null, [[9,9,9,9]])` both return `[[9,9,9,9]]` and `false`.
- [ ] **Step 2: Run them and confirm they FAIL.**
- [ ] **Step 3: Implement.** Run `node tools/collide.mjs` against `CASTS`.
- [ ] **Step 4: Browser check.** Set the eyes on `c70teacher`, Save, and watch it blink in the strip. Screenshot mid-blink. Then hand the remaining 15 era faces to the owner to set, rather than guessing them.
- [ ] **Step 5: Commit.** `"Faces panel: explicit casts, hand-set eyes that survive a re-bake, new faces, faces.md"`.

---

### Task 13: Music panel: library, listen, playlists, porting, `music.md`

**Files:**
- Create: `admin/panels/music.js`, `tools/content/docs/music.mjs`
- Modify: `tools/content/server.mjs`, adding `GET /admin/api/midis` and `POST /admin/api/port`
- Modify: `tools/music/midi2song.mjs`, accepting `--month M` and writing `month` into the song JSON
- Modify: `tools/content/validate.mjs` (`buildMusic`): an optional `month` must be an integer 1–12 when present

**Interfaces:**
- `GET /admin/api/midis` returns `[{ file: '70s/X.mid', ids: [song ids from songs.json with this file] }]` for every `.mid`/`.midi` under `reference/assets/midi/`, sorted.
- `POST /admin/api/port` takes `{ file, id, title, artist, year, month }` and runs `midi2song.mjs reference/assets/midi/<file> --id --title --artist --year --month --out content/music/<id>.json`. It appends the entry to `tools/music/songs.json` (`formatSongs`) and responds `409` if the id exists, `200 { rel, json }` otherwise.
- Panel:
  - **Library:** every MIDI. Ported ones show title, artist and year; unported ones show the filename and a Port form with those fields plus month.
  - **Listen:** `Music.play(id)`; Stop: `Music.stop()`. During play, the attract or level music is released and then restored by `G.playMusic` of the current key.
  - **Playlists:** Title, then 1..20, any length, with add, remove and drag to reorder. The picker greys out songs `songEligible` refuses and says why (Task 14 adds the function; until then it greys by year alone, using `MUSIC_LOOKBACK`).
- Refresher `playlist`: if the edited list is playing, `G.playMusic` of the current key.
- `music.md`: per year `## <roman>. <year>`, `### A. Driving Shift` / `### B. Kitchen Shift` with the `Level n, <Season> <year>.` line, then the numbered songs `<TITLE> - <ARTIST> (<year>)`. A title section comes first. The preamble (the rule paragraphs) stays as prose.

- [ ] **Step 1: Write the failing tests:**
  - `— server —`: port into an existing id returns 409; porting a small MIDI from the library into a temp root returns 200 and produces a song that validates;
  - `— docs —`: `music.md` round-trips, and a level with 3 songs renders 3 numbered lines;
  - `— apply —`: shrinking a playing list does not throw (Review Focus 5).
- [ ] **Step 2: Run them and confirm they FAIL.**
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Browser check.** Play two ported songs and stop. Port one unported MIDI, listen, add it as a third song to a level, and Save. Hear it come round in that level. Then revert that content.
- [ ] **Step 5: Commit.** `"Music panel: the whole MIDI library, listen through the game's player, any-length playlists, music.md"`.

---

### Task 14: Release months and the season rule

§9, the owner's ruling. This is the only task with an **owner checkpoint**.

**Files:**
- Modify: `tools/music/songs.json` and every `content/music/<id>.json` (add `month`), `tools/content/validate.mjs`, `content/music/playlist.json` (level 3), `docs/authored content/music.md` (regenerated)

**Interfaces:**
- `levelMonth(levels, i) -> 1..12`. A summer level is `7`. A winter level is `1` if another level in the same `year` is summer and comes after it in `levels` order, and `12` otherwise.
- `songEligible(song, levels, i) -> { ok: boolean, why?: string }`. It refuses when `song.year > level.year`, when `song.year < level.year - MUSIC_LOOKBACK`, and when `song.year === level.year && song.month > levelMonth(levels, i)`. The title list is unrestricted.
- `month` becomes **required** on every song. `buildMusic` refuses an ineligible song with today's message style, naming both months.

- [ ] **Step 1: Write the failing tests** (`— validator —`):
  - `levelMonth` gives L1 7, L2 12, L3 1, L4 7, L9 1, L15 1 and L20 12;
  - `songEligible({year:1975, month:10}, LEVELS, 2).ok === false` (level 3);
  - `songEligible({year:1975, month:10}, LEVELS, 3)` (level 4, July) is `false`;
  - `songEligible({year:1984, month:5}, LEVELS, 8)` (level 9) is `false`;
  - a song with no `month` is refused.
- [ ] **Step 2: Run them and confirm they FAIL.**
- [ ] **Step 3: Research the months.** Find a release month for each of the 42 songs: the first release, single or album, whichever came first. Record the source of each in a `_month` note on its `songs.json` entry. Write the months into `songs.json` and each song JSON.
- [ ] **Step 4: Implement** `levelMonth`, `songEligible` and the required field. Wire `songEligible` into the Music panel picker. Run the build: it should now fail on Level 3, and on any other playlist the months catch.
- [ ] **Step 5: OWNER CHECKPOINT.** Propose upbeat candidates for Level 3, from 1973 to January 1975. Port the four or so best through the Music panel. For every other playlist the months broke, propose replacements the same way. **The owner chooses by ear in the Music panel.** Do not pick for them. Save their choice, which regenerates `music.md`.
- [ ] **Step 6: Run** all three suites and `node tools/music/check-music.mjs`, and confirm they PASS.
- [ ] **Step 7: Rewrite** `music.md`'s season sentence (it is prose) to state the rule as built: July, and January/December by order. Commit: `"Release months and the season rule; Level 3's new songs"`.

---

### Task 15: Test panel: getting somewhere, autoplay, skipping, speed

**Files:**
- Create: `admin/panels/test.js` (this and Task 16), `admin/test.js` (`Admin.test`)
- Modify: `src/80_game.js`: the `G.test` and `G.autopilot` hooks below; `src/74_kitchen.js:244`; `src/90_main.js`: speed and pause

**Interfaces:**
- **`G.test`**: `null` in normal play, so the ship is unaffected, or `{ difficulty?, era?, season? }`.
  - `G.setLevel(n)` applies any present override after reading the level.
  - **Any run started while `G.test` is non-null, or with `G.autopilot` ever on, sets `G.testRun = true`.** `timeUp` and `toVictory` set `this.placed = !this.testRun && Scores.qualifies(...)`.
- **`G.autopilot`**: boolean.
  - Line 854 becomes `if (demo || this.autopilot) Demo.drive(dt, this); else p.control(Input);`.
  - Kitchen line 244 becomes `if (this.demo || G.autopilot) this.botStep(dt, G);`.
  - Toggling it mid-shift hands control over at once.
- **`G.speed`** (default `1`) multiplies the dt accumulated in `90_main`'s loop. **`G.paused`** skips accumulation. `TacoShop.step(n)` still steps.
- **`Admin.test`:**
  - `jump(n, 'card'|'play')`: `G.startRun(n)` or `G.toCard(n)`, then `G.beginShift()` for `'play'`
  - `setOverride({difficulty, era, season})`
  - `autopilot(on)`
  - `attractFrom('title'|'winners'|'scores'|'demo')`
  - `clock(secs | 'freeze' | 'thaw')`: sets `G.shift`; freeze holds it each frame
  - `complete(k)`: calls `G.onComplete()` k times
  - `force('over'|'cont'|'entry'|'victory'|'clear')`: `timeUp`, `toCont`, `toEntry`, `toVictory`, `levelClear`
  - `speed(x)`, `pause(on)`, `step()`
  - `seed(n)`: reload with `?seed=n` after a confirm that warns about unsaved edits

- [ ] **Step 1: Write the failing tests** (headless, new section `— test hooks —` placed after `— kitchen demo —`, with state reset before and after):
  - With `G.test = {difficulty:'supreme'}`, `G.setLevel(1)` gives `G.diffKey === 'supreme'`.
  - With `G.autopilot = true` on a delivery level, 30s of updates with no keys held move the player more than 200px of path.
  - Under `G.testRun`, a qualifying score gives `G.placed === false`.
  - With `G.test = null` and the autopilot never on, the score loop behaves as before.
- [ ] **Step 2: Run them and confirm they FAIL.**
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Browser check.**
  - Jump to Level 19 in play, then autopilot on, off and on again.
  - Freeze the clock, add 9 completions, and confirm LEVEL CLEAR.
  - Force CONTINUE?.
  - Run at 4×, pause and step.
  - Play an overridden run to GAME OVER: no initials prompt.
- [ ] **Step 5: Commit.** `"Test panel: jump, override, autopilot, skip, speed"`.

---

### Task 16: Test panel: events, debug views, housekeeping

**Files:** Modify `admin/panels/test.js` and `admin/test.js`. Modify `src/80_game.js` to add one debug draw hook.

**Interfaces:**
- `Admin.test.train()`: spawn the next train now, through the code path at `80_game.js:930`. Expose it as `G.spawnTrain(dir)` if it is inline.
- `Admin.test.heat(n)`: `G.bumpHeat(n)`.
- `Admin.test.cop()`: `G.spawnCop()`.
- `Admin.test.say(line, faceKey)`: shows the line in the dialogue strip with that face, through the same `Dialog` call `G.react` uses, bypassing its play-only guard for this call only.
- **Debug views:** `G.debugDraw` is `null`, or a function `(ctx, cam)` that `G.render` calls after the sprite pass and before the HUD. `Admin` supplies one that draws whichever of these are toggled on:
  - solid tiles (`City.isSolid`)
  - `City.keep`
  - nav nodes (`City.nodeX`, `City.nodeY`)
  - the live route (`Nav.route`)

  Cyan is reserved for guidance, so draw these in red, amber, bone and magenta.
- **FPS:** a DOM counter in the overlay from `requestAnimationFrame` deltas.
- **Housekeeping:**
  - `Admin.test.resetBoard()`: write the factory board through `Scores`' own guarded write, then `Scores.load()`.
  - `Admin.test.mode('A'|'B'|'C')`: `Pad.setMode`.
  - `Admin.test.mute('music'|'sfx', on)`: set `Audio5.musBus` / `Audio5.sfxBus` gain to `0`, or back to `0.30` / `0.9`.

- [ ] **Step 1: Write the failing tests** (headless `— test hooks —`):
  - with `G.debugDraw` set to a counting function, one `G.render(ctx)` calls it once;
  - `G.spawnTrain(1)` (if added) puts a train on `City.tracks[1]`.
- [ ] **Step 2: Run them and confirm they FAIL.**
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Browser check.** Each button does what it says while you watch. Screenshot the four debug views together over a downtown block, and check none of them uses cyan.
- [ ] **Step 5: Commit.** `"Test panel: events, debug views, housekeeping"`.

---

### Task 17: The project's own docs

**Files:** Modify `CLAUDE.md`, `docs/gdd.md`, `RESUME.md`, `ROADMAP.md` and `README.md`.

- [ ] **Step 1: Update `CLAUDE.md`.**
  - Commands: add `node admin.mjs` and `node test/admin.mjs`.
  - Generated files: the `.md` docs are now generated from `content/`, and `src/05_content.js` gains `CASTS`.
  - Authored copy: **the JSON is the master copy and the docs are its mirror (owner, 2026-10-25), reversing the 2026-09-26 ruling.**
  - Add a module/tool line for `tools/content/` and an "Admin overlay" architecture section covering `admin.mjs`, the injection, `Admin.applyBuilt`, `G.test`, `G.autopilot` and `G.debugDraw`, and why none of it ships.
  - Add `— test hooks —` to the section list.
- [ ] **Step 2: Update the other docs.**
  - `docs/gdd.md`: the same reversal, and the season rule as built.
  - `ROADMAP.md`: tick the content-tools item and add what remains (the remaining era faces' eyes, set by the owner in the Faces panel).
  - `RESUME.md`: rewrite "Where things stand" and "Next".
- [ ] **Step 3: Run** `node build.mjs && node test/headless.mjs && node test/admin.mjs` and confirm all three PASS.
- [ ] **Step 4: Commit.** `"Docs: the admin overlay, and the JSON is the master copy"`.
