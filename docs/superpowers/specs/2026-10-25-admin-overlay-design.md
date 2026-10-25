# The admin overlay

*Design, 2026-10-25. Not built. Worked out with the owner in conversation; every
decision below is marked **owner** (they decided it) or **my call** (proposed during
the conversation and not objected to, or settled while writing). The builder may revisit
a "my call"; an "owner" item changes only by asking.*

## 1. What this is, and why

The game's design lives in two places that are kept in step by hand: the authored docs in
`docs/authored content/*.md`, which people read, and `content/*.json`, which the game
reads. Every change is typed twice, and the two have already drifted: `levels.json`
carries a `_fixes` note for typos corrected in the JSON and never in `levels.md`
(`IIXX`, `Leve 20`, Level 20's era). Testing a change means editing a file, rebuilding,
reloading, and playing to the screen in question, which for Level 19 or the victory card
is a long way.

The **admin overlay** fixes both. It runs **inside the dev build of the game itself**
(owner): press a key and editing panels open over the live game. You change a level, a
menu item, a song, a line of dialogue, and the game behind the panel shows it. Save writes
the content files and rebuilds. A **Test** panel gets you anywhere in the game and lets the
game play itself.

It is a tool for the owner, on their own machine. Nobody else uses it.

## 2. Goals, non-goals, anti-goals

**Goals**
- Edit everything in §5 through forms, without opening a JSON or `.md` file.
- Make it impossible to save content the build would reject, and show *why* on the field
  that caused it.
- Keep the `.md` docs and the JSON in agreement automatically.
- See every edit in the real game, not a mock-up of it.
- Reach any level, screen or game state in seconds (§6).

**Non-goals**
- **City zoning.** The `hays*.json` maps are *not* edited by the overlay (owner: left out
  of scope). The Test panel may still pick a seed.
- Git. Save writes files and rebuilds; it does not commit, diff or stage (owner).
- Tuning an individual song arrangement (lead/bass/harmony tracks, bars). A song that
  sounds wrong is *replaced* (owner). The port's settings can stay at `midi2song.mjs`'s
  defaults.
- Anyone but the owner using it; any kind of login or multi-user safety.

**Anti-goals** — it fails even if every panel works, if:
- **Any of it ships.** `taco-shop.html` must contain no overlay code, no write endpoint
  reference, nothing. The public game is unchanged byte-for-byte by this feature apart from
  any content edits made through it.
- **It adds a dependency.** No `package.json`, no npm, no CDN, no framework. Node built-ins
  and plain browser JS, the same as the game.
- **It grows a second validator.** The checks live in `build.mjs` today. If the overlay
  re-implements them in the browser, the two will disagree within a month. See §4.3.
- **It quietly breaks the `.md` prose.** The docs carry reasoning paragraphs alongside the
  values. Regenerating a doc must keep them.

## 3. Constraints from the project

Read `CLAUDE.md` first; these are the parts that bear on this design.

- **Build model.** `src/*.js` are classic scripts concatenated in filename order into one
  `<script>`. Anything placed in `src/` ships. So overlay code **does not live in `src/`**
  (my call: a top-level `admin/` folder). Classic scripts share one global lexical scope,
  so an `admin/*.js` script loaded after the game's scripts can read `G`, `LEVELS`,
  `MENUS`, `Kitchen`, `Demo`, `Faces`, `Music`, `Scores` and the rest directly. Top-level
  `const` bindings cannot be reassigned, but the objects they hold can be mutated in place,
  which is how live edits reach the running game.
- **Name collisions.** A top-level name in `admin/` that matches one in `src/` is a fatal
  redeclaration. Prefix or namespace everything (my call: a single `Admin` object), and
  run `node tools/collide.mjs` against each admin file.
- **Content is inlined, never fetched.** The game reads `CONTENT`, `LEVELS` etc. from the
  generated `src/05_content.js`. The overlay may fetch from its own server, because it only
  ever runs on the dev page, but the game code must never learn to.
- **`build.mjs` is the validator**, and it validates by throwing `Error`s whose messages
  name the file and key. It runs top to bottom as a script today.
- **`serve.mjs` binds every interface** (no host argument), which is presumably how Mode C
  gets tested on a real phone. A server with write endpoints must not do that.
- **The 5×7 font** covers `A-Z 0-9` and a fixed punctuation set; copy is uppercase.
  Curly quotes pasted from documents are the usual failure.

## 4. Shape

### 4.1 The server: `node admin.mjs` (my call)

A new script, separate from `serve.mjs`, which stays exactly as it is (so phone testing over
the LAN keeps working). `admin.mjs`:

- **binds `127.0.0.1` only**, on its own port (8124 suggested);
- serves the repo's static files the way `serve.mjs` does, `no-store`;
- serves `/index.html` **with the admin scripts injected** at request time, after the game's
  `<script>` tags. The `index.html` on disk is untouched. This is what keeps the overlay out
  of everything `build.mjs` writes;
- exposes a small JSON API under `/admin/api/` (§4.3, §5) for: reading all content, saving,
  porting a MIDI, baking a face, recolouring a well, and reporting drift;
- runs the existing scripts (`midi2song.mjs`, `fit-portrait.mjs`, `bake-face.mjs`,
  `recolor-lattice.mjs`, `build.mjs`) as child processes with `node`, and returns their
  output. It does not re-implement any of them.

Open `http://localhost:8124/` and you get the game with the overlay available.

### 4.2 The overlay

- **Toggle:** the backtick key (my call; nothing in the game uses it). Check `Input` and
  `Pad` don't consume it first.
- **While open, the game keeps running** behind or beside the panels and is the preview.
  Keyboard input to form fields must not reach `Input`, or typing a menu name drives the car.
- **Plain HTML panels** in a normal readable UI font (my call), not drawn on the 384×216
  canvas. The canvas is far too small for forms. Layout (side panel vs. floating vs. split)
  is the builder's, as long as the game stays visible while editing.
- **Tabs:** Levels, Menu, Attract, Music, Difficulty, Dialogue, Faces, Test.
- **Edits apply live** (my call). Changing a field mutates the in-memory content object, and
  the overlay does whatever that content needs to take effect: re-run `G.setLevel`,
  `Faces.build()`, restart the playlist, redraw the winners card. Where the game can't take a
  change mid-shift, restarting the current screen is acceptable. Unsaved edits are
  **discarded on reload**; the panel shows clearly that there are unsaved edits.
- **Live checks.** Each field shows its check result as you type (fits / too wide by N chars
  / undrawable characters / out of range). These are a *convenience* for feedback; the
  authority is §4.3.

### 4.3 Saving (owner: write and rebuild, nothing more)

Save:
1. Sends the edited content to the server.
2. The server writes the candidate JSON to a **scratch copy** of `content/` and runs the
   build's validation against it. **If it throws, nothing in the repo is written**, and the
   error comes back mapped to the field it names.
3. Otherwise it writes the JSON into `content/`, regenerates every affected `.md` (§4.4),
   and runs `node build.mjs`.
4. The page reloads its content from the rebuilt `src/05_content.js`.

**One validator.** For step 2 to work, `build.mjs` has to be able to validate a directory
other than `content/` and report failures without writing the bundle. The builder chooses
how: a `--check <dir>` mode, or moving the `buildX()` functions into a module that both
`build.mjs` and `admin.mjs` import. What is fixed is that there is **exactly one
implementation of every content check**, used by the build, the save, and as far as
possible the live checks. If a live check has to run in the browser, the cheap
way is the server's check endpoint, not a JS copy of the rule.

Mapping a build error to a field means the error messages need a machine-readable location
(file + key path). Adding that to the existing messages is in scope.

### 4.4 The `.md` docs and the JSON

**The JSON is the master copy (owner).** The `.md` files become a mirror that the overlay
rewrites on every save. The owner expects to drop the `.md` files at some point, so:

- the JSON must hold **everything** the game and the overlay need; nothing may be read
  *from* an `.md`;
- writing the `.md` should be one step that can be switched off later without touching
  anything else.

This **reverses the 2026-09-26 ruling** that the authored docs win when the two disagree.
Record the reversal in `CLAUDE.md` (the "Related docs" entry for `docs/gdd.md`), in
`docs/gdd.md`, and in `RESUME.md`.

**The docs are structured**, which is what makes regenerating them practical: numbered
headings (`## I. Level 1`, `### A. Bins`, `#### 1. Hard Taco`) over `- Key : value` lists.
They also carry free prose: introductions, rule explanations, the `Short` sizing note in
`menu.md`. Regeneration **rewrites the value lists and the headings, and keeps every prose
paragraph** where it sits (anti-goal, §2). How prose is anchored (to the heading it
follows, say) is the builder's; a round-trip test is the guard (§8).

**Lines in the docs with no JSON behind them (owner).** The docs mix values and notes more
than the headings suggest. Three kinds, three treatments:
- **Tuning that lives in game code** (`difficulty.md`'s Hint, Ticket Limit and the Points
  Bonus amounts; Hint is `G.diffKey === 'easy'` in `74_kitchen.js` today) **moves into
  `difficulty.json`**, validated by the build, read by the game, and editable in the
  Difficulty panel. This is a change to shipped code; behaviour at the current values must
  not change.
- **Notes** ("FBI Director : Kash P.V. Patel", "Overlay Text : …", "Same as Easy", the
  sentences appended to values such as "2.00. The tip falls to it in 54s…") are **kept
  verbatim as prose**, under the prose rule below. The builder audits all seven docs for
  every such line before writing the generator.
- **Display text follows the JSON's form.** Where the doc writes a value differently from
  the JSON ("Level 1 - Summer 1972" vs `SUMMER 1972`, mixed case vs upper case, "Cheese"
  vs "Cheese (shredded)"), the regenerated doc shows the JSON's value. The JSON is master,
  and a mirror that rewrites values into another form is a second source of truth.

**First run.** The docs and JSON disagree today. The JSON wins (owner). On open, the overlay
reports how many values differ, as information; the first save rewrites the docs from the
JSON. The `_fixes` notes in the JSON then describe drift that no longer exists and can be
removed.

**Seven docs.** The five that exist (`levels`, `difficulty`, `menu`, `attract`, `music`)
plus two new ones, **`dialogue.md` and `faces.md`** (owner: "keep it all the same"), in the
same structure.

**The `.md.md` names.** All five files are named `*.md.md`. Rename them to `*.md` as part of
this (my call), and update every reference (there are a handful, in docs and in JSON
`_comment`s).

## 5. The panels

Every field is checked against the same rule the build applies. Where the build has no rule
yet and the design needs one, it is listed as new.

### 5.1 Levels

A list of the 20 levels; select one to edit it. Fields as `levels.md` defines them:
**Sequence, Game Type** (Delivery / Kitchen), **Name**, **Era**, **Music**, **Difficulty**,
**Season**.

- Era, Game Type, Difficulty and Season are pickers. Difficulty lists only keys of
  `difficulty.json`. Music is the level's playlist (§5.4).
- Name is checked against the font and the level card width, and against its season (the
  build requires `WINTER`/`SUMMER` in the name to match).
- No visual level construction (owner: "visually define what needs to be in the level,
  just as the .md does").
- "Play this level" jumps there (the Test panel's jump, §6).

### 5.2 Menu

One tab per era.

- **The bin board:** the 12 bins laid out 2×6 as in the kitchen, with the two base stations
  either side. Each bin shows its ingredient and its baked well art.
- **A bin never moves between eras.** In Eras 2 and 3, bins already filled by an earlier era
  are locked; only `[EMPTY]` slots can be filled. The build already refuses a menu that moves
  a bin.
- **Items:** name, short name, base (Ingredient 0), up to six ingredients, price.
  Ingredients are picked from that era's bins and base stations only. The short-name budget
  `12 × chars + 9 × steps ≤ 127` is shown live as characters remaining. The price is
  entered in dollars and stored in integer cents.
- **A new ingredient in an empty bin needs well art. It is made in the overlay (owner):**
  pick an existing well to start from and set hue / saturation / value; the server runs
  `recolor-lattice.mjs` and the result appears on the bin board before saving. The build's
  existing check that every bin names lattice art stays the guard.

### 5.3 Attract

The four screens in loop order with the total cycle time shown live (1:20 today).

- **Title:** duration; wordmark hold (must not exceed duration − 2s).
- **Winners:** duration; message, attribution as drawn, credit. Font and width checks. The
  slogan and attribution accept multiple lines, as the content already allows.
- **High scores:** duration; the factory board from `scores.json` (initials and amounts),
  with the build's existing checks.
- **Auto-Play:** duration; which levels the demo may pick from (RANDOM today).
- Every duration 3–600s.
- Each screen has a "show it" button that puts the game on that attract screen.

### 5.4 Music

- **Library:** all **203** MIDIs in `reference/assets/midi/`, the ones already ported
  (41 MIDIs, 42 songs, since Bohemian Rhapsody is split in two) marked as such with title,
  artist and year. The other 161 have no catalogue anywhere in the repo, so they are listed
  **by filename**, and their details are typed in when one is ported (my call). No bulk
  research of unported songs.
- **Listen** to any ported song through the game's own player (`Music` through
  `Audio5.musBus`), so what is heard is what ships. Not the MIDI, and not the WAV previews.
- **Port** any unported MIDI (owner: pick from all 203): the overlay asks for title, artist,
  release year and release month (below), the server runs `midi2song.mjs` with them and
  writes the song to `content/music/` and its entry to `tools/music/songs.json`, and the
  owner can listen before it goes in a playlist.
- **Playlists:** the title list and one list per level. **Any length**, with songs added,
  removed and reordered (owner: "more than 2 songs per level, if we want"). The build
  already accepts any non-empty list; only the docs say two.
- **The year rule** is applied as songs are picked: songs too new or more than 2 years old
  for the level are shown as ineligible.
- **New: release month.** `music.md` says a same-year song is kept out of a level whose
  season comes before its release, and that the build enforces it. **The build does not**:
  it checks only the year, because no song records a month. Add a `month` to every song
  (in `songs.json` and the ported JSON), enforce the season rule in the build, and use it in
  the picker. The 42 existing songs need their months researched; use the song's **first
  release, single or album, whichever came first**, consistent with music.md's "original
  release year" (my call). See §9 for what each season means.

### 5.5 Difficulty

One column per difficulty, Easy / Medium / Hard / Supreme, side by side, rows grouped as
`difficulty.json` groups them:

- **Clock:** start, extend, max extensions, target.
- **Tips:** start, floor, decay. Money in dollars, stored in cents.
- **Fines:** ticket, pedestrian, train, remake.
- **Nav aids:** panel, line, dot, edge, beacon (on/off).
- **Kitchen:** tip per item, decay, max items per ticket, ticket interval.
- **New, moved from code (§4.4):** Hint (on/off), Ticket Limit, the Points Bonus amounts.
- A derived, read-only row (my call): seconds for a delivery tip to decay from start to
  floor at each difficulty.

`difficulty.md` carries a lot of explanatory prose (bonus structure, extended play), which
§4.4's prose rule protects.

### 5.6 Dialogue

The ten keys in `dialogue.json` (`who` plus nine moments: arrive, wait, queue, walkout,
served, wrong, delivered, missed, late), each a list of lines.

- The era tag is a dropdown, **All eras / 1980s on / 1990s on**, not a prefix to remember.
  The tag is a **floor**: `2|` means "Era 2 and later" (`this.era >= n` in `80_game.js`),
  and the build rejects `1|` because it would mean nothing. Keep that meaning and the stored
  format (my call, from the code).
- Each line is checked against the **speech-bubble width**, which the build computes from the
  widest baked face. It is narrower than the screen check, so a line that passes the screen
  can still overflow the bubble.
- "Say it" puts the line in the game's dialogue strip with a chosen face (shares the Test
  panel's trigger, §6).
- New doc: `dialogue.md`.

### 5.7 Faces

Owner: cast, eyes, and new faces.

- **Cast per era.** Today the cast is implicit: `Kitchen.castFor(era)` takes every face
  whose key starts `c7` / `c8` / `c9`. Choosing a cast needs it to be data. My call: an
  explicit cast list per era in content (e.g. `content/casts.json`, or a field the build
  reads), validated by the build, with `castFor` reading it. `smokerbust` (the dialogue
  default) stays as it is.
- **Eyes.** All 16 era faces have `"eyes": []` because the bake's eye detector missed, so
  they never blink. Click on a face's eyes to set them. **A re-bake currently writes the
  detector's guess back over hand-set eyes**; the bake must keep eyes that were set by hand.
- **New face.** Drop in a reference image; the server runs the steps
  `docs/art_pipeline.md` describes (`fit-portrait.mjs`, then `bake-face.mjs`), and the
  result is shown in the dialogue strip at game size before saving. The art pipeline's size
  budgets and its troubleshooting table apply. Where the reference image is kept follows
  `docs/art_pipeline.md`.
- New doc: `faces.md` (the cast per era and each face's description).

## 6. The Test panel

Owner: keep all of these.

**Getting somewhere**
- Jump to any level, landing on its card or straight into play.
- Override difficulty, independently of the level.
- Override era or season.
- Set the city seed.

**Letting the game play itself**
- Autoplay at any level: `Demo.drive` for a delivery level, `Kitchen.botStep` for a kitchen
  level. `G.demoPin` and `sweep.mjs` show both can run any level.
- Hand control to the bot and take it back, mid-shift.
- Run the attract loop from any of its screens.

**Skipping**
- Freeze the clock, or set it.
- Add completions, to reach LEVEL CLEAR and the next card without playing them.
- Force GAME OVER, CONTINUE?, initials entry, victory.
- Game speed: pause, single step, slow motion, fast forward (`step(n)` and the fixed-step
  loop in `90_main.js`).

**Making things happen**
- Send a train; raise the heat; spawn a cop.
- Make a customer say a chosen line with a chosen face.

**Seeing what the game sees**
- Draw over the city: solid tiles, the `City.keep` mask, the nav graph, the current route.
- Frame rate.

**Housekeeping**
- Reset the stored high-score board.
- Switch control mode (A / B / C).
- Mute music and sound effects separately.

Test overrides are **session state**, never saved to content, and a run played under any
override must not reach the high-score board (the same rule the demo follows).

## 7. Changes to existing code this implies

Collected from above so nothing is a surprise:

- `build.mjs`: validate a scratch directory without writing (§4.3); machine-readable error
  locations; the song `month` and season rule (§5.4); validate the explicit cast (§5.7).
- `src/74_kitchen.js`: `castFor` reads the explicit cast; Hint and Ticket Limit read
  `difficulty.json`.
- `src/80_game.js` (wherever the Points Bonus amounts live): read `difficulty.json`.
- `build.mjs`: the season-month rule derived from level order (§9); validate the new
  difficulty fields.
- `content/music/playlist.json`: Level 3's two songs replaced (§9).
- `tools/render/bake-face.mjs`: keep hand-set eyes on re-bake.
- `tools/music/midi2song.mjs` / `songs.json`: carry `month`.
- `docs/authored content/`: rename `*.md.md` → `*.md`; add `dialogue.md`, `faces.md`.
- Small hooks in game code where the Test panel needs one (an overlay-only flag to keep
  overridden runs off the board, say). Keep them minimal and harmless when the overlay is
  absent, since they ship.
- `CLAUDE.md`, `docs/gdd.md`, `RESUME.md`, `ROADMAP.md`: the JSON-is-master reversal, the
  overlay, `admin.mjs`, the new docs.

## 8. How it is checked

- **No overlay in the artifact:** a `test/headless.mjs` assertion that `taco-shop.html`
  contains no admin code (search for the `Admin` namespace and `/admin/api`).
- **Doc round-trip:** generate each `.md` from the JSON, parse it back, get the same values;
  and regenerating an unchanged doc leaves its prose byte-identical.
- **Save refuses bad content:** a candidate the build rejects leaves `content/` untouched.
- **The validator is shared:** no rule exists in two places (review, not a test).
- The suite stays one sequential script with labelled sections, per `CLAUDE.md`; new
  sections reset any state they rely on.
- **In a browser:** each panel's edit is seen in the game, saved, survives a reload, and
  `node build.mjs && node test/headless.mjs` passes afterwards. The overlay is checked by
  rendering and looking, not by assertion alone (the owner's standing preference).

## 9. Seasons as months

- **What month does each season mean? Settled (owner): whichever keeps time moving
  forward.** Summer is **July**. Winter is **January** when it comes before that year's
  Summer level (Levels 3, 9, 15) and **December** when it comes after (Levels 2, 6, 8, 12,
  14, 18, 20). The build derives this from the level order; it is not authored per level.
  A song is eligible for a same-year level only if its release month is on or before the
  level's month.

  **Consequence:** Level 3 (Winter 1975, so January 1975) plays both Bohemian Rhapsody
  sections (October 1975), which the rule now refuses, and there is no other 1975 delivery
  level, so Bohemian Rhapsody leaves the game. Level 3 needs two upbeat songs from 1973 up
  to January 1975. My call: the plan proposes candidates from the library, ported through
  the Music panel, for the owner to choose by ear. The rule's enforcement lands in the same
  step, so the build is never red in between. Every other playlist must be re-checked once
  the months are researched; any further failure is brought to the owner the same way.

## 10. Left to the builder

- The overlay's layout and look, within §4.2.
- How `build.mjs` exposes validation (§4.3), and how errors carry their location.
- How `.md` regeneration anchors prose (§4.4).
- How live edits are pushed into each running system (§4.2), and which edits need a screen
  restart.
- The API's shape, the port number, and how long-running jobs (a port, a bake) report
  progress.
- Where `casts` lives (§5.7).
