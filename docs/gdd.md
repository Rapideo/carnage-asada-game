# Taco Shop - Carnage Asada

## Game Design Document

## I. Overview and Current State

Taco Shop - Carnage Asada started life as a one-shot attempt at generating 16-bit, arcade-stye driving game, with the original mechanic having the driver delivery pizzas. After incredibly impresive results from that effort, it was determined that this would be a great candidate for a game I have made prior attempts at designing - a restraunt-themed game based on a local Hays, KS fast food establishment "Taco Shop". 

We swiftly and effectily adapted the gameplay style to delivery bags of tacos (as oposoed to pizzas) using the same game-lay mechanics; and added a sense of locality to the game. Driving grids are now based on the actual town of Hays, KS; and Taco Shop's actual geographic location. Futher more, we expanded the block-level building options, added a train mechanic, and improved overall driving and delivery experience. 

While the game as it sits is HIGHLY playable, and overall a very impressive effort, it is our intent to expand and improve this game to turn it into a 20-level, 2 disstinct play mechanic game that alternates between our original "Deivery Shift" game, and our new "Kitchen Shift" game. 

Allowing for this requires specific updates to the Delivery Shift game; changes to how the player controls currently work, to map expansion efforts, to difficulty parameters, adding a dialog engine, and more.

**Current state (2026-10-25).** That game now exists. The 2026-10-25 build finished it:

- 20 levels that alternate the Delivery Shift and the Kitchen Shift, ten of each.
- Three eras (1970s, 1980s, 1990s), each with its own map, menu, customer cast, colour
  grade and music.
- Two seasons. Winter puts snow on the city and loosens the car's grip.
- Three control modes (A, B and C), chosen on a mode-select screen.
- A four-screen attract loop.

The rules below describe the game as built. The values (level table, difficulty numbers,
menus, attract timings, songs) live in `content/*.json`, which is the master copy (owner,
2026-10-25, in force since 0.9.1); `docs/authored content/*.md` are generated from it by
Service Mode, so they read as the same values and are never hand-edited. Every ruling and invention from the build is recorded in
`docs/PURE-CARNAGE-DECISIONS.md`. Section XI lists the inventions.

**Context Clarification**

*THIS IS NOT A JUST MINI-GAME.* This was introducted to our current project as  new "mini game" but this framing was incorrect. The new "kitchen shift" game will equally represent the "delivery shift" game in the 20 total levels of Carnage Asada, with 10 levels for each. 

The two games, while both contibuting to the overall player's point total - are distinct player efforts, and are not mechanically tied together. Delivery orders have nothing to do with the orders you made during your Kitchen Shift, and vice versa. 

## II. Globals

### A. Look and Feel Target

**Carnage Asada's look and feel are right and are not up for revision.** The frantic pace, the arcade read, the CRT pass, the palette discipline, the procedural chunky sprites, the chip audio — that's the product. The Build is being brought *into* this game's aesthetic, not bolted onto the side of it. If any detail of this fights the way this game looks or sounds, **this game wins**. If it cannot live up to this standard, we scrap it. 

**The bar: I should not be able to tell, from a screenshot, that this this is a different game after this change effort than before it.**

*Owner's ruling, 2026-10-25: each era gets **a full colour grade** (§II.J), which
overrides the screenshot rule above and the old "no new colour" rule. Everything else in
this section stands. The grade colours the world: the city or the kitchen, and the HUD
inside it. The level cards, menus and pause screen are drawn after the grade, so they keep
the game's own colours in every era.*

### B. Controls

#### 1. Mode A : Keyboard and Mouse

Mode A, and where our initial version of the game should start, carries over the play controls from our existing Delivery Shift game.  

#### 2. Mode B:  Arcade

Mode B expands these controls (the game should allow for the selection of Control Modes) to allow for game control via Joytick and button presses only, removing the mouse functionality altogether. 

#### 3. Mode C: Mobile

Mode C further expands the Arcade controls from Mode B, adding a joytick and button control overley to the screen during the driving sequences, and a a touch-based interface for the Kitchen Shift. 

#### 4. As built

- **All three modes ship** (owner's ruling, 2026-10-25).
- **The mode is chosen on a mode-select screen**, between the title and the first level
  card. It preselects one:
  - C on a touch-first device;
  - B when a gamepad has been seen;
  - otherwise A.

  A gamepad is invisible to the browser until one of its buttons is pressed, so the
  screen keeps checking until the player picks a mode.
- **Modes B and C do not add a second input path.** `src/25_pad.js` (`Pad`) turns the
  stick, the buttons or the touch overlay into the same key codes and mouse fields the
  game already reads. Anything still held when the context changes (menu, drive,
  kitchen) is ignored until it is let go. Without that, the button that serves the last
  ticket would also skip the level-clear card.
- **In every mode, P / Esc pauses.** The pause overlay is the only place the controls are
  written down, and it shows the current mode's labels.
- The per-shift maps are in §III.B (driving) and §IV.C (kitchen).
- **Audio note for Mode B:** browsers do not count a gamepad press as a gesture that
  unlocks audio. A stick-only cabinet needs Chrome launched with
  `--autoplay-policy=no-user-gesture-required`.

### C. Attract Mode

The cabinet loop is **four screens**, in order: title, winners, high scores, then a demo.
The durations are in `attract.md` (carried into `content/attract.json`).

- **Title:** the badge, `IN`, and the `CARNAGE ASADA` wordmark landing with a rumble, over
  Map 1. Enter, Space or a click goes to mode select.
- **Winners:** the period "Winners Don't Use Drugs" card, with the slogan and attribution
  from `attract.md` (carried into `content/winners.json`).
- **High scores:** the board, as its own screen.
- **Demo:** **a random level** of the 20.
  - A delivery level is driven by the attract driver (`Demo`).
  - A kitchen level is cooked by the kitchen autoplayer. It plays at a human pace and gets
    about one pick in twelve wrong, so the demo shows what a wrong pick looks like.
  - The demo always shows full navigation, scores nothing, and keeps the dialogue strip
    quiet.
  - The overlay blinks `PRESS ESC TO RETURN TO MENU`. Any key returns to the title.

### D. The Clock

#### 1. Shift Timer

Keeping with with the arcade pacing, each shift, both Driving and Kitchen will be set at 2 minutes. If and when this time expires, the game is over. 

#### 2. Extensions

If the player meets the expectations of the individual levels, dependant on the rules applied there, the user will recieve a time extension, and be allowed to continue play. The player shall recieve no more than FOUR extensions per level.

*The starting time, extension length and cap are set per difficulty in `difficulty.md`,
which wins over the 2 minutes and FOUR above (3:00, and up to five on Easy).*

*Owner's ruling, 2026-10-25: **every 3 completed deliveries or tickets earn one
extension**, however they came about. They do not have to be one bag load, and a miss only
delays the extension. This overrides `difficulty.md`'s "all 3 bags from one load". Time
comes only from the starting clock and the extensions. There is no time per delivery.*

#### 3. Level End

*Settled 2026-09-26.* Each level is a **checkpoint race**, like the classic arcade games:

- Every level has a **target**: deliveries made in a Delivery Shift, tickets served in a
  Kitchen Shift. Every 3 earns an extension.
- **Reaching the target clears the level**, and play moves on to the next one.
- **If the clock reaches 0:00 first, the game is over.**
- The target is **3 × the difficulty's extension cap**: 15 on Easy, Medium and Hard, 9 on
  Supreme. The level clears on the load that would have earned the last extension, so
  every extension the cap allows is used and none past it is ever needed.
- The score is the money earned across every level played, so a run that ends on level 7
  still keeps its money for the high-score board.
- **Continues:** at game over the player may continue from **the start of the level they
  died on**, but **the score restarts at $0.00**. A continue buys the chance to see the
  rest of the game, not a better score.

A full 20-level run is expected to take around two hours, and that is intended
(2026-09-26). There is no save between sessions.

Rough estimate, at ~25-30s per delivery or ticket: a level runs 6-7 minutes (about 4 on
Supreme), and a full 20-level run takes about two hours.

#### 4. The Run, Screen by Screen

```
title -> mode select -> level card -> shift -> LEVEL CLEAR -> next level card -> ...
0:00          -> GAME OVER -> initials (if the run places) -> CONTINUE? 10s
level 20 done -> victory   -> initials (if the run places) -> high scores -> attract
```

- **The level card** comes before every shift. The shift is already set up behind it, so
  it reads as the start of a shift rather than a loading screen.
  - It shows only `LEVEL n` and the date (month and year), typed on letter by letter
    (a tick per letter) under the decade's three-colour stripe, on black.
  - There is no menu, target, nav mode, roads line or prompt. The kitchen's menu is on the
    pause screen only (§IV.B).
  - It moves on by itself 2.0 s after the date finishes, and any key, click or tap skips it.
    A held key does not: only a fresh press skips.
- **LEVEL CLEAR** shows the level's own tally and stars (§II.E), the money from this shift,
  the run total, and what the next level is.
- **GAME OVER** (`TIME'S UP`) shows the level you died on, the run total, the run's stars
  and rank, and either `NEW HIGH SCORE!` or what the board's lowest entry is.
- **Victory**, after level 20, shows the run total, stars and rank. It then goes to initials
  if the run places, and then to the board.
- **Development aids:** `?level=N` starts a run at level N (the mode-select screen says
  so), and `?seed=` still seeds the city.

### E. Scoring

- **The score is the money**, in integer cents, as it always was. `G.earned` is the
  **run** total, which is what the board stores. Each level also keeps its own total for
  the LEVEL CLEAR card.
- **Both shifts pay tips** (§III.E, §IV.F), and both multiply what they pay by a
  **combo**. The combo starts at x1.00, rises 0.25 per completion to x3.00, and **resets at
  the start of every level**. Each shift also has its own reset rules.
- **Fines and fees come off the run total and the level total**, and neither goes below
  $0.00. The amounts are per difficulty in `difficulty.md`.
- **Stars** are a report card, never money (§III.E.1, §IV.F.1).
  - A level's stars appear on its LEVEL CLEAR card.
  - The run's stars appear on the GAME OVER and victory cards.
  - Stars never appear on the board.
- **Rank titles** are rescaled for a 20-level run. The board's factory entries
  (`content/scores.json`) were rescaled to match. The title is derived from the cents
  when it is drawn, so retuning these thresholds reflows the whole board (`G.rank()` in
  `src/80_game.js`):

  | rank | run total |
  |---|---|
  | TRAINEE | under $250 |
  | DRIVER | under $1,000 |
  | ACE | under $2,500 |
  | SALSA BARON | under $5,000 |
  | LEGEND OF THE ASADA | $5,000 and up |

### F. High Scores

*Settled 2026-09-26.* At game over, in the arcade order:

1. **If the run qualifies, enter initials first.** The run is saved to the board before
   anything else can happen to it.
2. **Then CONTINUE?, with a 10-second countdown.**
   - **Yes:** the level you died on restarts, as a **new run at $0.00**. That run can
     make the board on its own when it ends.
   - **No, or the countdown runs out:** back to attract mode.

The board is unchanged: an entry is `{ ini, cents }`, entered with the arrow keys, and
30 seconds idle saves it as `AAA` (see `docs/superpowers/specs/2026-08-21-high-scores-design.md`).
Stars never appear on it.

A run that clears level 20 goes from the victory card to initials (if it places), then to
the board, and from there back to the title.

### G. Levels

The level table is **`content/levels.json`**, and `levels.md` is generated from it. The
level-by-level list that used to be here was retired in the 2026-10-25 build, because it had
drifted (its seasons for levels 7-12 and 17-18 and its difficulty curve were wrong). The
JSON wins.

The structure the table follows:

- **Odd levels are Delivery Shifts and even levels are Kitchen Shifts**, so each pair
  shares a year: 1972, 1975, 1978, then on in three-year steps to 1999.
- **Era:** levels 1-6 are the 1970s, 7-12 the 1980s, and 13-20 the 1990s.
- **Map and menu follow the era.** Map 1 and Menu 1 go with the 1970s, Map 2 and Menu 2
  with the 1980s, Map 3 and Menu 3 with the 1990s.
- **Difficulty** runs Easy for levels 1-6, Medium for 7-12, Hard for 13-18, and Supreme
  for the two 1999 finales.
- **Season** alternates within a year's pair, so every level is either Summer or Winter.

### H. Characters and Dialog System

One dialogue mechanism serves both halves: the bottom **DIALOGUE STRIP**
(`src/72_dialog.js`). It has a portrait box, a speech bubble and a slide-in, and it is
drawn the same way over a live delivery frame and over the kitchen.

- **The lines** are in `content/dialogue.json`, grouped by moment:
  - Delivery: `delivered`, `late`, `missed`.
  - Kitchen: `arrive`, `wait`, `queue`, `walkout`, `served`, `wrong`.
  - **A line wraps to at most two rows** in the bubble; the build checks every row.
  - `people`: personal lines for 120 customer faces, used three times in four.
  - `cast`: the nine named characters' lines (see 2 and 3 below).
- **A line can carry an era floor.** For example, `2|HELLOOO? MCFLY?` only plays from the
  1980s on, so nobody quotes a film that has not come out yet.
- **The strip is rate-limited in the kitchen**, because it covers the lower bins. A
  walkout always speaks.
- **It stays silent in attract mode.** A talking head over the demo reads as a cutscene
  rather than as play.

#### 1. Customers - move to game type

Customers are the main speakers (the officers, rivals and staff below speak too). Each era has its own **cast** of baked portraits:

- six for the 1970s, five for the 1980s and five for the 1990s;
- baked from the first reference sheet of each era with `tools/render/bake-face.mjs`
  (`docs/art_pipeline.md`), and stored in `content/faces/c70*`, `c80*` and `c90*`.

Two kinds of reference portrait were left out:

- any whose clothing carries a real trademark;
- any whose black hair or jacket was lost into the black background when baked.

How each shift uses the cast:

- **Delivery Shift:** a face is picked from the era's cast for each reaction.
- **Kitchen Shift:** each customer gets a face when they arrive, and keeps it for the life
  of their ticket.

Era faces do not blink yet. The eye detector misplaced the eyes, so their eye rects were
cleared in the shipped face data. Setting them by hand brings the blink back.

#### 2.  Drivers - move to game type

Built 2026-11-08, as a voice only, with no car in the city. The rivals (DUSTY '70s, ACE '80s, JINX '90s)
speak on your missed toss and your perfect toss, instead of the customer one time in three. The officers
(SGT. PFEIFER, OFC. KARLIN, OFC. DREILING) speak when a chase starts, when you are fined (pulled over or a
pedestrian) and when you lose them.

#### 3. Taco Shop Staff - move to game type

Built 2026-11-08. The coworker (MARGE '70s, DALE '80s, NIKKI '90s) speaks at clock-in, after three clean
tickets, when the clock first drops under 0:30, when the line backs up (one time in two), and with the
next-ingredient hint ("CHEESE NEXT, HON"). The hint blinks the right bin after a stall or a wrong pick: Easy
always, Medium for dishes new to the decade, Hard and Supreme off. None of them speak in the demo or attract mode.

### J. Eras

Over the 20 levels, the game will feature 3 "Eras"; the 1970s, 1980's, and 1990s which will impact the global look and feel of the game by utilizing both an Era-Specific color pallete, as well as changes to the menus, characters, and dialog. 

As built, an era changes:

- **the map:** the same streets and the same shop cell, but different zoning (§III.C.1);
- **the menu** (§IV.E);
- **the customer cast** (§II.H.1);
- **the dialogue:** lines with a later era floor join the pool;
- **the music:** songs from the level's years (§II.L);
- **the colour grade:** a per-pixel tone curve over the world (§II.A).

#### 1. 1970s

Levels 1-6, Map 1, Menu 1. The grade is warm and lifted, a little sepia, and the blacks are
never quite black.

#### 2. 1980s

Levels 7-12, Map 2, Menu 2. The grade is punchy: more saturation and contrast, with magenta
in the shadows.

#### 3. 1990s

Levels 13-20, Map 3, Menu 3. The grade is cooler and a touch desaturated, with teal in the
shadows.

### K. Seasons

The game levels will also specify a Season, either Summer of Winter, which wil dictate both driving conditiions, hazards, and customer dress. 

As built:

- **Summer** is the baseline. Heat shimmer was considered and skipped, because it would
  cost legibility.
- **Winter, in the Delivery Shift:**
  - Snow lies on everything that is not road. The ploughed streets keep a little slush.
  - Every building roof has snow on it, and snow falls across the screen.
  - The car's grip drops to x0.62, so the back end steps out. The road itself is the
    warning; the level card no longer says anything about it.
- **Winter, in the Kitchen Shift:** the customers have snow on their hats. Nothing else
  changes.

**Weather (owner ruling, 2026-11-07; set per level from 0.9.3).** Each level's weather is
authored in `content/levels.json`: `sunny` or `rainy` in summer, `snowy` or `sunny` in winter,
or `random`. A `random` level rolls its weather each time it is played (summer: sunny or rainy,
an even chance; winter: snowy four times in five and sunny the fifth). A separate `windy`
flag exists on Delivery levels only; a `random` level also rolls wind, at 30% in summer and
25% in winter. The values are in `levels.md`, and the code is `G.rollWeather` and the
`WEATHER_*` constants in `80_game.js`.
- **Rain:** a baked wet-road layer (darker tarmac, pale sky streaks, the odd puddle), an
  overcast tint, falling rain with splashes, and grip x0.75.
- **Sunny winter:** the snow on the ground and roofs stays, because that is the winter
  look, but nothing falls and the ploughed roads grip at x0.9.
- **Kitchen levels** follow their level's weather as decoration only: snow tracked in on
  winter levels, rain on the window. It changes nothing about play.
- **Windy (Delivery only):** a crosswind pushes the bag on the toss, with a windsock at the
  top centre of the screen, telegraphed gusts that shove the car, and tumbleweeds. Values are
  in `content/difficulty.json` `wind`.

### L. Music

By leveraging music from each defined era, the games music will be a direct reflection of the time along with the visual aethstetic. Named below are each of the songs that the game will feature, and during which era they will appear.

Songs themselves will be derived from MIDI files, passed thru a Note JS conversion process that will leave us with a JSON song structure file, and instruction as to which model of synthesis and instuments to utilize.

As built (owner's ruling, 2026-10-25: arrange the real MIDIs):

- **The songs are arranged from real MIDI files** in `reference/assets/midi/`.
- **The conversion:** `tools/music/midi2song.mjs` reduces each MIDI to a bass, a lead, up
  to two harmony voices and a drum kit, written as one JSON file per song in
  `content/music/`. The input list, with any part or window overrides, is
  `tools/music/songs.json`.
- **Playback:** `src/22_music.js` plays the songs through the game's own chip voices
  (square, triangle, pulse, noise). M and N still toggle sound and music.
- **The playlist:** `content/music/playlist.json` gives each level **two songs**, played in
  order and looped, and gives the title its own pair.
  - Delivery songs are upbeat.
  - Kitchen songs are mellow or solo-danceable.
- **The year rule is a build check, not a note.** A level's song may come from the level's
  year or up to 2 years before it, never after. `build.mjs` checks each song's release
  year.
- **The season rule is advice, and is built as such (owner, 2026-11-07).** Every song records
  its release month. A level's month follows its season: July for a summer level; for a winter
  level, January if a summer level of the same year comes later, otherwise December. A
  same-year song released after its level's month is named as a **warning** by the build and
  in Service Mode's Music tab and is never refused. Level 3 keeps both Bohemian Rhapsody
  songs and Level 16 keeps Cannonball by owner ruling.
- **The song list is in `music.md`** (and in `playlist.json`).
- **Because no agent can listen,** the arrangements were chosen by structural heuristics.
  `tools/music/preview/*.wav` holds renders to check by ear.

### M. Authored Content

The values the rules above use. **The `content/*.json` files are the master copy** and the game
reads them; `build.mjs` validates each one at build time. The markdown files named below are
generated from the JSON (by Service Mode's save) so people can read the values; they are a mirror,
and this reverses the 2026-09-26 ruling that the authored docs win. Do not hand-edit them.

#### A. Attract Mode (attract.md)

Screen order and durations, the winners card copy, and the demo overlay text.
Carried into: `content/attract.json`, `content/winners.json`

#### B. Levels (levels.md)

The 20-level table: type, name, era, season, difficulty, music slot.
Carried into: `content/levels.json`

#### C. Difficulty (difficulty.md)

Per difficulty, for both shifts:

- the clock and extensions;
- the level target;
- the delivery tip and its decay;
- the fines;
- the navigation ladder;
- the kitchen tip, patience, items per ticket and arrival rate.

Carried into: `content/difficulty.json`

#### D. Menu (menu.md)

The kitchen menu.
Carried into: `content/menus.json`

- Era 1: `menu.md` exactly as authored (owner's ruling, 2026-10-25).

- Era 2: real Taco Shop items, with Sauce and Chili added in bins 10 and 11.

- Era 3: real Taco Shop items, with Chicken added in bin 12.

#### E. Characters (characters.md)

There is no `characters.md`. The casts are the baked faces in `content/faces/` (their
sources are `reference/kitchen/faces/`). A face joins its era's cast by its file-name
prefix (§II.H.1).

- Era 1 : six faces, `c70*`

- Era 2 : five faces, `c80*`

- Era 3 : five faces, `c90*`

#### F. Dialog (dialog.md)

There is no `dialog.md`. The lines are in `content/dialogue.json`, and a line's era floor
places it (§II.H).

- Era 1 : lines with no floor

- Era 2 : adds lines marked `2|`

- Era 3 : adds lines marked `3|`

#### G. Music (music.md)

To minimize anacronisms, music will be specific to the Year defined in the Level. While songs don't need to come from the exact year of play, they should be current or prior by no more than 1-2 years to add to the time-realism of the game. 

Two songs per level: a delivery pair and a kitchen pair for each year.
Carried into: `content/music/playlist.json`, `content/music/*.json`

- 1972

- 1975

- 1978

- 1981

- 1984

- 1987

- 1990

- 1993

- 1996

- 1999

## III: The Delivery Shift

### A. Play Mechanics

The Delivery Shift is the original game, now played as a level against a target
(§II.D.3). The engine (physics, collision, nav, traffic, the railway) is documented in
`CLAUDE.md` and `JOURNAL.md`.

- **Orders:** there is one live order at a time, to an address in the era's map.
- **The tip:** it starts at the difficulty's starting tip and falls at its decay rate.
  - It **holds at a $2.00 floor** (owner's ruling, 2026-10-25), overriding
    `difficulty.md`'s "runs out".
  - Speed is still worth money, but a late delivery always pays something, and on a late
    job the perfect bonus is most of the payout.
- **The bag holds 3.** A throw uses a bag immediately. An empty bag sends the nav back to
  the shop, where a 1-second restock hold refills it. The order and its falling tip stay
  live while you go.
- **Throwing:**
  - A bag on the porch delivers.
  - A bag on the doorstep is a **perfect** delivery.
  - Anything else is a splat. A splat costs the $1.50 remake fee and resets the combo.
  - Throw spread grows with speed.
- **Heat and Hays PD:**
  - Bad driving, crashes, pedestrians and running a lowered crossing all build heat.
  - At full heat a cruiser comes after you. If it catches you, it writes the difficulty's
    speeding ticket.
- **The Union Pacific:** a train hit is a wreck. You are thrown clear of the tracks, your
  bags are spilled, the combo resets, and you pay the difficulty's **train fine**.

### B. Control Mechanics

#### 1. Mode A : Keyboard/Mouse

As the game always played:

| action | keys |
|---|---|
| drive | W A S D / arrows |
| handbrake | Shift |
| aim the toss | mouse (without a mouse, the toss goes a fixed distance ahead of the car) |
| throw | click / Space |
| sound / music | M / N |
| pause | P / Esc |

#### 2. Mode B: Arcade Mode

4-Way Joytick Control - DRIVE MODE

- Up: Accelerate, the same as Button 1 *(was YTBD; settled in the 2026-10-25 build)*

- Down: Brake / Reverse, the same as Button 2 *(was YTBD; settled in the 2026-10-25 build)*

- Left: Turn Left

- Right : Turn Right

There are a total of THREE butons:

- Button 1: Accelerate

- Button 2: Reverse

- Button 3: Aim and Release

HOLDING Button 3 puts the Joysick into Aim Mode; where the joystick no longer moves the car, but instaed allows you to direct the path of the throw, much as the mouse does currently. RELEASING Button 3 tosses the bag.

While aiming, the car coasts. Start pauses, and Back / Select toggles sound. Mode B has no
handbrake. In menus, Button 1, Button 3 and Start confirm, and Button 2 and Back go back.

#### 3. Mode C: Mobile Mode

- **An on-screen stick** sits bottom left, over the minimap corner. It steers, and pushing
  it up or down also accelerates or brakes.
- **Three buttons** sit bottom right:
  - **GAS**, the largest, nearest the corner, where the right thumb rests.
  - **REV**.
  - **TOSS**, up and in from GAS. Hold it to aim and drag on it to move the reticle;
    release to throw. Unlike Mode B, the stick keeps steering while TOSS is held, because
    a phone has a thumb free for it.
- **A PAUSE button** sits at the top centre.

The minimap sits under the stick in this mode.

### C. UI and Interaction Updates

#### 1. Map Expansion

There is one map per era. Each is a `content/hays*.json` against the same schema, with the
same nine streets per axis, the same shop cell at 333 W 8th St and the same rail corridor,
parks and civic blocks. Only the zoning moves on. The city regenerates when a level's era
changes.

- **Map 1, the 1970s** (`content/hays.json`): downtown Hays as the neighbourhood pass
  built it.
- **Map 2, the 1980s** (`content/hays-1980s.json`): the oil-boom years put up apartments
  at four corners, and the retail spine spreads a block east along 10th.
- **Map 3, the 1990s** (`content/hays-1990s.json`): student housing for Fort Hays State, a
  strip centre on 8th, and storefronts down Oak.

#### 2. Era Themes

The era's colour grade and winter snow (§II.J, §II.K). The cast speaking in the dialogue
strip changes with the era (§II.H.1).

#### 3. Music

Each delivery level plays its two upbeat songs (§II.L).

#### 4. The HUD in a Level

Under the clock card:

- `ORDERS n/15`, the progress toward the target;
- the level's stars;
- the streak (`X1.50 STREAK`) while the combo is above x1.

Delivery is the original HUD otherwise, minus the navigation pieces the difficulty takes
away (§III.D).

### D. Difficulty Schemas

The numbers are in `difficulty.md`. Difficulty works on the Delivery Shift through:

- **the tip's decay rate**, which is faster on harder difficulties, down to the $2.00
  floor;
- **the fines**: speeding ticket, pedestrian and train;
- **the extension length and cap**, and so the level target;
- **the navigation ladder.** Each step up takes one piece of TACO-NAV away: the
  turn-by-turn panel, the minimap route line, the minimap dot, the off-screen edge pointer
  and the beacon over the house. Supreme leaves only the address on the order card and the
  beacon once the house is in view.

### E. Scoring

#### 1. Points Schema

- **Stars** (2026-09-26): each **perfect delivery**, a bag that lands on the doorstep,
  earns a star. It is the delivery version of the kitchen's clean item (§IV.F.1), and
  the same throw that already pays +$5. Stars are a report card only: a tally at level
  clear and game over, never money and never on the board.

#### 2. Bonus Schema

*Settled 2026-09-26; values in `difficulty.md` → Points Bonus.* A perfect delivery pays
+$5.00. The combo runs ×1.00 to ×3.00, up 0.25 per delivery, and multiplies everything a
delivery pays; a missed throw, a crash, a pedestrian or a police ticket resets it.

A delivery pays `(tip + perfect bonus) × combo`.

The combo is reset by:

- a missed throw;
- a crash into traffic;
- a pedestrian;
- a police ticket;
- **a train hit**, which counts as a crash.

The combo also starts again at x1.00 every level (§II.E).

The **remake fee** of $1.50 per splatted bag is kept from the original game.

## IV: The Kitchen Shift

### A. Play Mechanics

The core loop is the owner's paragraph and rules under §IV.F.2. The built rules:

- **The screen** uses the regions of the reference art (`reference/kitchen/README.md`):
  TICKET RAIL, OVERHEAD (the dining room from above, the only place a customer exists),
  LATTICE, PREP BOARD and the DIALOGUE STRIP. The code is one `Kitchen` object in
  `src/74_kitchen.js`.
- **Focus is assigned by the game.** It is always **the oldest ticket on the rail**, and
  within it the next unfinished item. A ticket's items are built top to bottom. Select,
  wrap and serve use all three buttons, so there is no input left for choosing focus.
- **Arrivals:**
  - The first ticket arrives 1.5s into the shift.
  - After that, one arrives every *New Ticket Every* seconds, and almost at once whenever
    the room is empty.
  - A ticket has 1 to *Maximum Items* items, weighted toward 1 and 2. A five-item ticket
    is an event, not the norm.
- **The rail holds 3 tickets. Customers past that queue in the OVERHEAD** (owner's
  ruling, 2026-10-25: a soft limit).
  - While anyone is queueing, **every ticket on the rail loses its tip 50% faster**, and a
    queueing customer complains.
  - A queued customer's own tip does not start until their ticket goes up on the rail.
  - The room holds three in the queue. While it is full, no one else comes in.
- **The tip is the patience** (§IV.F.1). It starts when the ticket goes on the rail.
  Below 30% the customer says so. At zero they **walk out**: no pay, the combo resets, and
  they leave the room.
- **Picking:**
  - **The right ingredient:** a pip fills, the bin's plate flashes, and a "slot machine"
    click plays, pitched up a step each time.
  - **A wrong ingredient:** the plate flashes red and **stays red until the right one is
    picked** (rule 2). It counts as a mistake. The item loses its star and the ticket
    loses its clean bonus, and a buzz plays. Progress is never undone.
  - **On Easy only,** a wrong pick also makes the right bin's plate blink amber for 1.6s.
    The star and the bonus are lost all the same.
- **One button, two labels:**
  - **WRAP IT!** once the last pip is filled. Wrapping puts the item on the tray, and a
    clean item banks its star.
  - **SEND IT!** once every item on the focused ticket is wrapped. Sending pays out and
    clears the ticket.
  - Pressing either too early is a buzz, not a mistake.

### B. UI and Player Interactions

- **TICKET RAIL:** three dockets. Each shows its items and a tip bar that is also the
  customer's patience. The rail slides left as tickets come off it.
- **OVERHEAD:** the dining room. The customers are `Art.ped`, the same sprites that walk
  the pavements in the Delivery Shift. The person being served stands at the service
  window, the queue lines up behind them, and anyone who walks out leaves through the
  front.
- **LATTICE:** twelve bins in 2 rows × 6, with a base station either side (§IV.E). A
  cursor frame moves bin to bin.
- **PREP BOARD:**
  - The BUILD PROGRESS readout: `NOW BUILDING`, the item's Short name, its pips, and
    `ITEM n OF m` with the star at stake beside it. That star is lit while the item is
    clean, and dims after the first wrong pick.
  - A picture of the item on the assembly board, which builds up stage by stage.
  - The WRAP IT! / SEND IT! button.
- **The clock card** has four rows: the clock, the money, `STARS` (the shift's banked
  tally), and `SERVED n/15` with the streak. In the Delivery Shift those last two sit
  under the card. In the kitchen that spot is the service window.
- **Where the menu is shown.** The recipes are hidden during play (rule 1), so they are
  written down in one place: **the kitchen pause screen**, at the cost of clock time. The
  level card does not carry them.

  Each recipe is the ticket name followed by the build in order, each step in its
  ingredient's colour. Long builds shorten every step to four letters. Learning the menu
  is still the mastery curve, but a new player never has to guess.

#### 1. Dialog

Customers bark in the shared strip (§II.H), in the era's cast. A customer may bark:

- sometimes on arrival;
- when their patience drops below 30%;
- the first time the queue backs up past three;
- on a walkout (always);
- sometimes on being served;
- sometimes after a wrong pick.

A rate limit stops the strip from covering the bins all shift.

### C. Control Mechanics

| Mode | Move the cursor | Pick | Wrap | Send |
|---|---|---|---|---|
| A, keyboard and mouse | arrows / WASD, or hover with the mouse | Space / Z, or click a bin | X, or click the button | Enter / C, or click the button |
| B, arcade | the stick (4-way, with auto-repeat) | Button 1 | Button 2 | Button 3 |
| C, touch | tap where you mean | tap a bin or station | tap the button | tap the button |

- In Mode A, the mouse moves the cursor only when it actually moves, so a resting pointer
  never fights the arrows.
- Clicking or tapping the button does whichever of wrap or send is next.
- The clock card is a pause button, because a phone has no Esc. P / Esc pauses in every
  mode, and Start pauses in Mode B.

### D. Difficulty Schemas

Difficulty scaled by lengthening recipes, widening the menu pool, adding items per order, and tightening patience.

As built:

- **The menu pool widens with the era:** 9 items, then 13, then 15 (§IV.E).
- **Per difficulty** (`difficulty.md`): items per ticket, the rate a ticket's tip runs
  down (which is how long a customer waits), and how often a new ticket arrives.

The kitchen numbers are still the paper estimates of 2026-09-26. The autoplayers clear
every level, but whether the numbers are fun is a playtest question.

### E. Menus,  Ingredient Grid, and Assembly

- **The lattice is always twelve bins, and no bin ever moves.** A key set in one era sits
  at the same index in every later era, and a later era may only fill a slot that was
  empty. Bins 10-12 fill over time:
  - bin 10, **SAUCE**, from Era 2;
  - bin 11, **CHILI**, from Era 2;
  - bin 12, **CHICKEN**, from Era 3.

  Their art is pixel art recoloured from the same baked sheet, not code-drawn heaps.
- **The two base stations** hold what an item is built *on*:
  - The left station stacks the three tortilla and shell bases in three zones, and the
    cursor visits each zone as its own stop.
  - The right station is chips.
- **Each era's menu** is in `menu.md` and `content/menus.json`.
  - **Era 1 is `menu.md` exactly** (owner's ruling).
  - **Eras 2 and 3 are real Taco Shop items** (owner's ruling).
  - Where a real item lists an ingredient with no bin (Monterey Jack, olives, green onion,
    rice), that ingredient is dropped and the drop is noted on the item.
  - Items whose base comes mid-build, or that need a second base, are left out.
    Ingredient 0 is always the base.
- **`build.mjs` enforces the menu rules**, loudly:
  - exactly 12 bin slots, and no bin moved;
  - plate and ticket name widths;
  - each item's Short-name limit (`12 × chars + 9 × steps ≤ 127`);
  - 2 to 7 keys per recipe, with the base first and only first;
  - every key a bin of that era;
  - prices in integer cents. Prices are flavour only and are never scored.

### F. Scoring

#### 1. Points Schema

*Settled 2026-09-26. The amounts are per difficulty and live in `difficulty.md`.*

- **A served ticket pays a tip, not its menu price.** The Delivery Shift pays tips too, so
  both halves score on the same scale. The menu prices ($0.29–$0.69) are printed on the
  ticket for period flavour and are never scored. At those prices a kitchen level would
  earn about a tenth of a delivery level.
- **The starting tip is per item:** `starting tip = tip per item × items on the ticket`. A
  5-item ticket takes longer, so it is worth more. That keeps a big ticket a choice
  rather than something to avoid.
- **The tip runs down from the moment the ticket arrives** on the rail, at a fixed rate
  set by difficulty. It keeps running whether or not the ticket is in focus.
- **The tip is the customer's patience.** When it reaches zero the customer **walks out**:
  the ticket leaves the rail, pays nothing, and resets the combo. There is **no fine**.
  The lost tip is the money cost, and there is no second patience meter to read.
- **Stars are earned per clean item** (2026-09-26, replacing the 1–5 formula). Every item
  finished without a wrong click earns a star. A wrong click costs that item's star, the
  ticket's clean-ticket bonus, and the time it takes to recover. So one slip on a 5-item
  ticket loses the $5 but still earns 4 stars.
- **Stars are a report card, not a score.** They are shown as a tally when a level clears
  and at game over ("28 of 31 items clean"), with a running total for the run. They never
  change the money or the high-score board, which keeps storing initials and cents only.
  The Delivery Shift earns a star for each perfect delivery (bag on the doorstep); see
  §III.E.

*Two additions from the 2026-10-25 build:*

- While customers are queueing past the rail, every live ticket's tip runs down 50%
  faster (§IV.A).
- A served ticket pays `(tip + clean bonus) × combo`.

#### 2. Bonus Schema

*Settled 2026-09-26; values in `difficulty.md` → Points Bonus.* A clean ticket (served
with no wrong clicks) pays +$5.00. The combo runs ×1.00 to ×3.00, up 0.25 per ticket
served, and a walkout resets it. A wrong click does not reset it: it already costs the
item's star and the clean-ticket bonus.

*The paragraph and rules below describe the core loop and belong under §IV.A. They are
left here, where the owner wrote them, until the owner moves them.*

n order arrives. It has 1–5 **items** (a customer orders more than one thing). Each item is a menu item — hard taco, bean burrito, sancho, nachos — and each menu item has a **fixed ingredient sequence**. You assemble it by clicking ingredients from a grid **in the correct order**, then hit a finishing action to close the item; when every item on the order is finished, you SERVE the order.

Both the menu, ingredients and build order will be defined in a JSON settings file. This file will also store our ingredient groups which wil define what appears in the bins. 

The rules that made it work, in priority order:

1. **The recipes are hidden.** The player sees **how many steps remain** (a row of pips) and nothing else. You have to *know* that a sancho is tortilla → beef → lettuce → cheese →wrap. Learning the menu **is** the mastery curve.
2. **A wrong click flashes red and is counted.** It doesn't undo your progress — it costs you accuracy and time, and it feeds the bark (below). If the wrong ingredient is selected, it warns you until to select the CORRECT ingredient. 
3. **Incoming order tickets** - Play will start with one ticket, but as play progresses, more will appear. The idea is to keep up the pace to that you never have more than 3 live tickets at any one time. If there are more, customers start complaining.  No one ticket will have more than 5 menu items. 
4. ~~**Scored 1–5 stars**: `served − walkouts − floor(mistakes / 3)`, clamped.~~ *Replaced
   2026-09-26: a star for every item made without a wrong click, shown as a tally. See
   §IV.F.1.*
5. **Sound is load-bearing.** Ingredient clicks, order arrival, the walkout, and the SERVE moment. The feel I wrote down at the time was **"slot-machine fun"** — that's the target.

*How rule 3 was built (owner's ruling, 2026-10-25):* past three, customers queue in the
OVERHEAD and every live ticket drains 50% faster while they wait (§IV.A).

## X. Non-Negotiable Technical Constraints

- **Zero dependencies.** No packages, no asset files, no fetch, no CDN. Sprites, sound and glyphs are generated procedurally at boot — anything you add is drawn in `30_art.js` and voiced in `20_audio.js`.
  *Since the 2026-10-25 build:*
  - Music is played by `22_music.js`.
  - Reference pixel art (faces, lattice wells) is baked by `tools/render/bake-*.mjs` into
    pixel tables in `content/`. `build.mjs` inlines those tables, and they are decoded at
    boot. No image or audio file ships.
- 384×216 virtual screen, 5×7 ASCII-only font, all money in **integer cents**.
- `src/*.js` are plain scripts sharing one global scope, concatenated in filename-sort order. A new module needs a numeric prefix after everything it uses at load time. Top-level `const` collisions are fatal and surface only in the bundle.
- Menu data, recipes, abbreviations, bark lines and walkout quotes are **authored content** — they go in `content/*.json`, validated at build time, not hard-coded in `80_game.js`. The build already rejects characters the font can't draw and copy too wide for the screen; extend that validation to cover recipes rather than trusting a comment. A note is not a guard.
- Palette discipline: `PAL.cyan` is reserved for guidance so it reads as machine output,   `PAL.jade`/`PAL.gold` are badge-only and stay off the HUD, amber is money, red is danger.
- Rebuild with `node build.mjs`; `taco-shop.html` does not reflect source edits until you do.

### X.1 Art Requirements — matching the Delivery Shift

> **Retired for graded frames (owner, 2026-11-07).** The numeric targets below were set on
> ungraded frames. Every era now runs through `Post.grade`, which moves the whole histogram
> on purpose, so a graded frame is judged by eye, not against this table. The table and the
> rules after it still describe how the ungraded Delivery Shift reads and are kept for the
> reasoning; `measure.mjs` stays a scoring function, not a judge.

**The bar at the end of this section is testable, not a matter of taste.** A live
frame of the shipped Delivery Shift measures as follows, and any new screen must
land within tolerance of it:

| metric                            | target    | tolerance |
| --------------------------------- | --------- | --------- |
| mean value (0–255)                | 93        | ±10       |
| mean saturation                   | 34%       | ±5        |
| warm pixels (`r > b+8`)           | 19%       | +6        |
| near-black (`max < 70`)           | 29%       | +6        |
| mid-range mass                    | 71%       | −10       |
| calm 8×8 blocks / busy 8×8 blocks | 22% / 29% | —         |

The rules below are how a screen gets there. Every one was learned by getting it
wrong first; the reasoning and the measurements are in `JOURNAL.md` under
*"How to make a new screen match this one"* and *"The game has a measurable
palette fingerprint"*.

- **Warmth is an accent, never a ground.** The game is cool-dominant — road,
  kerb, walk and glass are blue-greys. Warmth signifies *because* it is rare: the
  centre line, the money, one red car. Cool the surfaces and let the food, the
  cash and the danger be the warm things. A screen that is warm everywhere has
  not gained warmth, it has lost contrast.
- **Surfaces move palette families; they do not get tinted.** `warm` is a binary
  test, so desaturating a warm colour scores *zero*. Re-derive the whole surface
  from a palette entry that is already the hue you want. Beware `shade()` — it
  collapses absolute chroma, so shading a wrong-hue entry reads flat.
- **Spend reclaimed warmth as an island.** One small saturated object on a cool
  ground, the way the shipped game does it. A warm wash across a whole surface
  drains the frame instead of warming it.
- **Separate by value step and cast shadow, not by an ink keyline.** The shipped
  frame runs 7.8 hard edges per 100px. Houses, cars and trees sit on the ground
  with almost no outline. Keying every new object in `PAL.ink` is the single
  most-missed rule and turns a screen into a grid.
- **One hero object with space around it beats a full-bleed texture.** Anything
  drawn edge-to-edge in its container reads as noise; a discrete outlined object
  with bare ground showing around it reads as craft. The bare ground is not
  waste — it is the negative space that makes the object legible.
- **Negative space must be mid-value.** Opening up space around an object and
  exposing a near-black backing makes the histogram *worse*. `PAL.roadLo` is the
  value the game already uses for rest.
- **Reuse before you draw.** The strongest continuity move is not matching an
  existing asset but pointing it at the new problem. The dining-room customers
  are `Art.ped` — the same sprites that walk the pavements outside — and cost no
  new art. `Art.buildPeds(rng)` can be called without the rest of `Art.build()`.
- **Two legible human sizes: 9×15 and roughly 44px, with nothing in between.**
  At ~21px there are about five pixels between the eyes and every feature is a
  1px decision; faces drawn there cannot be rescued by technique. Pick a size
  first and build the layout around it — size the box to the face, never the
  face to the box.
- **Feedback must not be drawn in a colour the thing it marks might already be.**
  A red mis-click flash is invisible on a red-toned ingredient. Flash a neutral
  chrome element, or flash *value* (black/white) rather than hue.
- **Aspect ratio decides a silhouette; shading never rescues one.** A symmetric U
  with a level top is a bowl however it is shaded. Change the proportion or break
  the symmetry.
- **Check vertical fit by reading the pixels back.** The build validates copy
  *width*; nothing validates height, and `text()` takes the top of the run, so a
  7px glyph at `y` occupies `y..y+6`. Assert a clear row above and below every
  glyph run by reading the rendered frame, not by arithmetic.

## XI. Invented During the 2026-10-25 Build

The owner asked for every gap to be filled and for each invention to be listed, so that
any of them can be overruled. The full record, with the owner's rulings, is
`docs/PURE-CARNAGE-DECISIONS.md`. Each line below gives where the invention now lives in
this document.

- One map per era (Map 1/2/3 = 1970s/1980s/1990s), the same streets with different zoning,
  and the 1980s and 1990s zoning changes. See §III.C.1.
- The run total as the score, with a separate per-level total for the clear card. See
  §II.E.
- The combo resets at the start of every level. See §II.E.
- The flow: mode select, level cards, LEVEL CLEAR, and a victory card after level 20. See
  §II.D.4.
- The kitchen pause screen carries the menu (the level card shows only the level and date).
  See §IV.B.
- Rank thresholds rescaled for a 20-level run, and the factory board with them. See §II.E.
- The $1.50 remake fee is kept. See §III.E.2.
- A train hit resets the combo. See §III.E.2.
- `?level=N` as a development aid. See §II.D.4.
- Mode B: stick up and down drive like Buttons 1 and 2, the car coasts while aiming,
  Start pauses and Back toggles sound. See §III.B.2.
- The Mode C layout: stick bottom left; GAS, REV and a hold-to-aim TOSS bottom right;
  PAUSE top centre. See §III.B.3.
- The mode-select screen and its preselection. See §II.B.4.
- The kitchen control map for all three modes, and the clock card as a pause button. See
  §IV.C.
- Kitchen focus assigned to the oldest ticket, with items built top to bottom. See §IV.A.
- The left base station as three stacked zones, each its own cursor stop. See §IV.E.
- The picking feedback: the plate flash, the pitched click, and the red that holds until
  the right pick. See §IV.A.
- One button labelled WRAP IT! then SEND IT!, and an early press is a buzz, not a
  mistake. See §IV.A.
- The Easy-only amber hint after a wrong pick. See §IV.A.
- Ticket arrivals: the first at 1.5s, almost at once when the room is empty, and items
  weighted toward 1-2. See §IV.A.
- Rail and queue: a queued customer's tip starts only when their ticket reaches the rail,
  the queue holds three, and the room takes no one else while it is full. See §IV.A.
- Kitchen pay as `(tip + clean bonus) × combo`. See §IV.F.1.
- The kitchen clock card's fourth row, `SERVED n/15` with the streak. See §IV.B.
- When customers bark, and the rate limit. See §IV.B.1.
- The kitchen autoplayer for the attract demo. See §II.C.
- The three era grades, and the rule that the grade colours the world but not the cards.
  See §II.A and §II.J.
- Winter: grip x0.62, snow on the ground and the roofs, falling flakes, and snow on the
  kitchen customers' hats. Heat shimmer skipped in summer. See §II.K.
- The Era 2 and 3 menu selection from the real Taco Shop menu, the dropped ingredients,
  and bins 10-12 (SAUCE, CHILI, CHICKEN) with their recoloured art. See §IV.E.
- The era casts (6/5/5), what was skipped, and the face held for a customer's whole
  ticket. See §II.H.1.
- The dialogue era floor (`2|`, `3|`). See §II.H.
- The choice of songs for each level, picked by structural heuristics. See §II.L.
