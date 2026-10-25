# Pure Carnage: decisions and inventions

*Written 2026-10-25, at the start of the single-shot build that finishes the 20-level
game.* This repo is a copy of **Taco Shop - Carnage Asada** at `8e18837`. The original
folder was not touched.

This file records two things:

1. **Owner rulings** made at the start of the build, to settle conflicts between the
   docs.
2. **Inventions**, marked **[INVENTED]**. These fill gaps no doc answered. The owner said
   to "invent it all" and to mark it, so every one is listed here to be overruled.

Precedence is unchanged: **authored content beats the GDD, and the ROADMAP beats
RESUME**. Where a ruling below differs from a doc, the ruling wins.

---

## Owner rulings (2026-10-25)

| # | Question | Ruling |
|---|---|---|
| 1 | Gaps in the design | **Invent everything** and mark each invention here. |
| 2 | Music | **Arrange the real MIDIs** from `reference/assets/midi/`, choosing the best songs for each era. Per music.md: a song may be from the level's year or up to 2 years before it, never after. Driving songs are upbeat; kitchen songs are mellow or solo-danceable. |
| 3 | `Migrated/` | Read **the menu and dialogue files only**. `game-design-spec.md` stays closed. |
| 4 | Extensions | **Every 3 completed** deliveries or tickets earn one, wherever they came from. A miss only delays it. *This overrides difficulty.md's "all 3 bags from one load".* |
| 5 | Delivery tip floor | **Keep the $2.00 floor.** The tip starts at $20 and falls at the difficulty's rate, then holds at $2. *This overrides difficulty.md's "runs out".* |
| 6 | Kitchen ticket limit | **Soft limit.** The rail holds 3 tickets. Further customers queue in the OVERHEAD. While anyone is waiting beyond 3, every live ticket's tip drains 50% faster, and customers bark. |
| 7 | Era look | **A full colour grade per era.** *This overrides "no new colour" and the GDD §II.A screenshot rule.* |
| 8 | Control modes | **A, B and C all ship**: keyboard and mouse, arcade (Gamepad API, Button 3 hold-to-aim exactly as GDD §III.B.2) and mobile touch. They are chosen on a mode-select screen. |
| 9 | Era 1 menu | **menu.md stays exactly as authored.** The real Taco Shop menu (Migrated) supplies Eras 2 and 3. |
| 10 | Art | **Code generated from pixel art**, as in the kitchen concept. Reference pixel art goes through `tools/render/bake-*.mjs` into pixel tables in `content/`, decoded at boot. No image files ship. |

## Settled by "authored content wins" (no ruling needed)

- The level table is `levels.md` (GDD §II.G is stale).
- Clock: 3:00 start, plus extensions per difficulty.
- Fines per difficulty, **including the new train fine**.
- The attract loop is **four screens**: title 15s, winners 10s, scores 10s, demo 45s. The
  demo plays a **random level**: a delivery level, or a kitchen level with the kitchen
  autoplayer. The overlay reads `PRESS ESC TO RETURN TO MENU`.
- Winners attribution: `KASH P.V. PATEL, DIRECTOR, FBI`.
- Nav ladder per difficulty, as in the difficulty.md table.
- `TIME_PER_JOB` and `TIME_PERFECT` are gone. A perfect delivery keeps its +$5.

---

## Inventions

### Run structure [INVENTED where marked]

- **Map per era:** Map 1 is the 1970s (levels 1-6), Map 2 the 1980s (7-12), Map 3 the
  1990s (13-20). Each map is a `content/hays*.json` against the same schema, with the
  same streets, the same shop cell and different zoning. **[INVENTED]**
- **Menu per era:** Menu 1, 2 and 3 likewise.
- **Score:** `G.earned` is the **run** total and is what the board stores. Each level
  also keeps its own `levelEarned` for the clear card. **[INVENTED]**
- **The combo resets at the start of every level.** **[INVENTED]**
- **Flow:**

  ```
  title -> mode select -> level card -> shift -> LEVEL CLEAR card -> next level card
  ```

  - After level 20: a **victory card**, then initials if the run qualifies, then
    attract. **[INVENTED]**
  - At 0:00: **GAME OVER**, then initials if the run qualifies, then **CONTINUE? 10s**.
    Yes restarts the level as a new run at $0.
- **Stars:** one per perfect delivery and one per clean kitchen item. They are shown on
  the level clear card, the game over card and the victory card, never on the board.
- **Rank thresholds rescaled for a 20-level run** **[INVENTED]**:

  | rank | run total |
  |---|---|
  | TRAINEE | under $250 |
  | DRIVER | under $1,000 |
  | ACE | under $2,500 |
  | SALSA BARON | under $5,000 |
  | LEGEND OF THE ASADA | $5,000 and up |

  The factory board was rescaled to match.
- **Remake fee** ($1.50 per splatted bag) is kept. difficulty.md is silent on it.
  **[INVENTED: kept as shipped]**
- **A train hit resets the combo** (it is a crash) and charges the difficulty's train
  fine. **[INVENTED: the combo part]**
- **Dev and test aids:** `?level=N` starts a run at level N, and `?seed=` still seeds the
  city.

### Kitchen Shift mechanics [INVENTED unless cited]

- **Layout:** the regions are exactly those in `reference/kitchen/README.md`: TICKET
  RAIL, OVERHEAD, LATTICE, PREP BOARD, DIALOGUE STRIP.
- **The left base station holds three bases** in three stacked zones, top to bottom:
  **small tortilla, taco shell, large tortilla** (the order of the reference rack
  art). The right station is **chips**. The cursor visits each zone as its own stop.
- **Focus is assigned by the game:** always the **oldest ticket on the rail**, and within
  it the next unfinished item, in order. A ticket's items are built top to bottom.
- **Picking:**
  - **Right ingredient:** a pip fills, the bin's plate flashes green, and a "slot
    machine" click plays, pitched up each step.
  - **Wrong ingredient:** the plate flashes red and **stays red until the right one is
    picked** (GDD §IV, rule 2). The click counts as a mistake. The item loses its star
    and the ticket loses its clean bonus. A buzz plays. Progress is not undone.
- **WRAP and SERVE:**
  - Once the last pip is filled, the button reads `WRAP IT!` and pulses. Wrapping puts
    the finished item on the tray.
  - When every item on the focused ticket is wrapped, the button reads `SERVE!`.
    Serving pays out and clears the ticket.
  - Pressing either too early is a buzz. It is not a mistake.
- **Arrivals:** the first ticket arrives at 1.5s. After that, one every *New Ticket
  Every* seconds, and after 0.6s if the rail and queue are both empty. Items per ticket are
  1..*max*, weighted toward 1-2.
- **Patience and tip:** per GDD §IV.F and difficulty.md. A ticket's tip starts at
  `tipPerItem × items` and falls from arrival. At 0 the customer walks out: no pay, the
  combo resets, and the queue figure leaves the room. *Ruling 6 adds the queue drain.*
- **Pay:** `(tip + clean bonus) × combo`. The combo then goes up 0.25, to a maximum of
  x3.
- **Barks** use the shared dialogue strip, with the era's cast. They fire on arrival
  (sometimes), when patience drops below 30%, when queueing past 3, on a walkout, on
  service and on a wrong pick. A rate limit stops the strip being spammed.
- **The kitchen autoplayer** drives the same inputs a player would, at human speed, and
  makes a mistake about 1 pick in 12. It runs in attract mode only.

### Kitchen controls [INVENTED]

| Mode | Move | Select | Wrap | Serve |
|---|---|---|---|---|
| A, keyboard and mouse | arrows / WASD | Space / Z, or a mouse click on a bin | X, or click the button | Enter / C, or click the button |
| B, arcade | the stick | Button 1 | Button 2 | Button 3 |
| C, touch | — | tap a bin or station | tap the button | tap the button |

In Mode A, the mouse jumps the cursor to whatever it hovers over. P / Esc pauses in every
mode.

### Delivery controls in Modes B and C [INVENTED where GDD says YTBD]

- **Mode B:**
  - Stick left and right steer. Up is also accelerate, and down is also brake/reverse
    (the GDD's "YTBD").
  - Button 1 accelerates and Button 2 reverses, as in the GDD.
  - **Holding Button 3** enters aim mode: the stick moves the reticle and the car coasts.
    **Releasing it throws.**
  - Start pauses, and Back/Select mutes.
- **Mode C:** an on-screen stick (bottom left, over the minimap corner) and three
  buttons (bottom right): GAS, REV and a TOSS button that works as hold-to-aim. Dragging
  on the TOSS button aims, and releasing throws.

### Eras [INVENTED]

- **Colour grade:** a per-era tone curve applied to the world frame, before the cards and before the CRT
  pass (scanlines and vignette), so cards keep their true colours.
  - 1970s: warm, lifted blacks, a slight orange-sepia.
  - 1980s: punchy, saturated magenta-cyan.
  - 1990s: cooler and slightly desaturated, with green-teal shadows.
- **Accents per era as well:** the cast of faces and the music. (Per-era car paint sets
  were planned but not built: every era uses the one `CAR_COLORS` set.)
- **Seasons:**
  - **Winter:** a snow overlay with falling flakes, a snow grade on the ground, and
    looser grip (more slide; the handbrake bites harder). Winter kitchen customers get snow on their hats (planned coats were not built).
  - **Summer:** heat shimmer is skipped (it would cost legibility). Summer is the
    baseline.

### Eras 2 and 3 menus (from Migrated, real Taco Shop items) [INVENTED selection]

- **Bins 10-12 fill over time and never move:**
  - Bin 10 is **SAUCE** (Taco Shop sauce), from Era 2.
  - Bin 11 is **CHILI**, from Era 2.
  - Bin 12 is **CHICKEN** (grilled), from Era 3.
- **Where an item lists an ingredient with no bin** (Monterey Jack, olives, green onion,
  rice), it is dropped from the recipe. Each case is noted in `content/menus.json`.
- **Base-mid-build items** (Loco Taco, the real Taco Supreme) are left out, because the
  base is always ingredient 0.

### Characters [INVENTED]

- Each era's customer cast is baked from `reference/assets/images/<era> - Set N.png`
  with `bake-face.mjs`.
- The cast is chosen per era, and `G.react` / `Kitchen` pick a face from it.

### Attract

- **Demo:** a random level from the 20, played by the delivery `Demo` driver or the
  kitchen autoplayer as appropriate.

### Made during the build [INVENTED]

- **The kitchen level card carries the menu.** Recipes are hidden during play
  (GDD IV rule 1), so the card before the shift and the kitchen pause overlay are the
  only places they are written down.
  - Each recipe is the ticket name followed by the build in order, every step in its
    ingredient's colour.
  - Long builds abbreviate to four letters per step.
  - Learning the menu stays the mastery curve, but a new player is never asked to
    guess.
- **Easy kitchens give a hint:** after a wrong pick, the right bin's plate blinks amber
  for 1.6s. The star and the clean bonus are lost all the same.
- **One button, two labels:**
  - `WRAP IT!` while an item is being built.
  - `SEND IT!` once every item on the ticket is wrapped.
  - `SERVE` (5 letters at scale 2) is 58px, and the button is 59px wide.
- **The kitchen clock card has a fourth row, `SERVED n/15`, with the streak.** In the
  delivery half those two sit under the card on the road. In the kitchen that spot is
  the service window, where the customer being served stands.
- **The era grade colours the world, not the cards.** It runs after the city or kitchen
  and the HUD, and before the level cards, menus and pause, so those keep the game's
  own colours in every era.
- **Winter:**
  - grip x0.62
  - snow over every non-road tile (ploughed roads keep a little slush)
  - snow on every building roof
  - falling flakes
  - kitchen customers with snow on their hats
- **Customer faces** are chosen per customer from the era's cast, so the same person
  speaks for the life of their ticket.
- **`?level=N`** starts a run at level N; the mode-select screen says so.
- **Bins 10-12 art.** SAUCE is the baked CCQ well with its food palette rotated to Taco
  Shop red, and CHILI is the baked beans well rotated to chili. Both come from
  `tools/render/recolor-lattice.mjs`, so they stay pixel art from the same sheet rather
  than code-drawn heaps.
- **Cast.**
  - Five or six customers per era, baked from the first sheet of each era.
  - Skipped: portraits whose clothing carries real trademarks (GI Joe, Atari, Iron
    Maiden, Charlotte Hornets, Spice Girls, Nintendo, Intel, Windows), and three bakes
    whose black hair or jacket fell into the black background (disco king, new wave
    guy, R&B singer).
  - Eye rects are cleared on every era face. The detector placed them badly, and a
    blink drawn in the wrong place paints across a cheek. Faces do not blink until
    someone sets `eyes` by hand in `content/faces/<name>.json`. A re-bake writes the
    detector's guess back, so set them again after one.
