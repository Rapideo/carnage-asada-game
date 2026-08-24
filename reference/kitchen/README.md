# Kitchen Shift — reference art

**Status: a kept starting point, not a shipped screen.**

The **look** here is approved as the basis for building the Kitchen Shift — the
palette balance, the silhouette rules, the 44px portrait, the dialogue strip,
and the decision to reuse `Art.ped` for customers.

The **layout** is not a specification. Element positions are a working
arrangement, and the menu, the ingredient names, the recipes and every price in
these frames are **placeholders invented to make a picture**. The PRD is where
those get settled; sections IV.E and IV.F are empty at the time of writing.

Produced 2026-08-24. Reasoning behind every rule is in `JOURNAL.md`, sections
*"Drawing food at 384×216"*, *"The game has a measurable palette fingerprint"*
and *"How to make a new screen match this one"*. The requirements distilled out
of them are PRD §X.1.

---

## Files

| file | what it is |
|---|---|
| `kitchen.png` / `kitchen-x3.png` | the frame, native 384×216 and at 3× |
| `kitchen-dialogue-x3.png` | the same frame with the dialogue strip up |
| `delivery-dialogue-x3.png` | the **same strip over a live Delivery Shift frame** |
| `faces-x6.png` | four portraits at 6×, the character sheet |
| `kitchen.mjs` | draws the frame. Edit this. |
| `portrait.mjs` | the 44px dialogue portrait |
| `dialog.mjs` | the dialogue strip — **shared by both halves of the game** |
| `face.mjs` | portrait test rig; iterate on faces without rebuilding the scene |

```
node reference/kitchen/kitchen.mjs            # redraw the frame
DIALOG=1 node reference/kitchen/kitchen.mjs   # ...with the dialogue strip up
node reference/kitchen/face.mjs               # just the character sheet
node tools/render/measure.mjs                 # score it against the real game
```

---

## Region map

Named regions, so the PRD and the art talk about the same things. All
coordinates are in the 384×216 virtual screen.

```
      0                                  248 249                        384
    0 +--------------------------------------+---------------------------+
      |  TICKET RAIL                         |  OVERHEAD                 |
      |    rail  y0..6                       |    the dining room, seen  |
      |    3 tickets, 78 wide                |    from directly above    |
      |    x4 / x86 / x168                   |                           |
      |    height = 26 + 8*items + 3         |   +---------------------+ |
      |                                      |   | SCORE CARD  (hovers)| |
      |  PANTRY  (behind the tickets)        |   | 253,3  128x44       | |
      |    shelves y72 and y96               |   +---------------------+ |
      |                                      |    SERVICE WINDOW         |
      |                                      |      wall  y48..58        |
      |                                      |      opening x296..336    |
      |                                      |      jambs either side    |
      |                                      |    QUEUE  max 4, facing N |
  104 +--------------------------------------+---------------------------+
      |  LATTICE            2 rows x 8 = 16 cells, 46x28                 |
      |    columns x = 5 52 99 146 193 240 287 334                       |
      |    rows    y = 105, 135                                          |
      |    unused slots are LIDDED, never removed                        |
  164 +------------------------------------------------------------------+
      |  PREP BOARD                                                      |
      |    readout x6..125   |  CUTTING BOARD 138,171 104x41  |  BUILT   |
  216 +------------------------------------------------------------------+

      DIALOGUE STRIP  (overlay, either half)   4,150  376x60
        portrait box  7,152  56x56   <- the minimap's rect
```

### Why the regions are where they are

- **LATTICE is 16 cells and always 16.** The menus scale from twelve
  ingredients to sixteen, and an unused slot is *lidded* rather than absent, so
  an ingredient never changes position between levels. A grid that re-packs at
  level 8 invalidates everything learned at level 2.
- **The lattice is a navigable grid.** A 4-way stick steps a cursor cell to
  cell; a mouse jumps the cursor to whatever it clicks. **Travel distance is a
  real cost**, so which ingredients sit adjacent is level design, not
  decoration. The end columns are also the worst-lit (see below), so they are
  doubly bad seats.
- **WRAP and SERVE are buttons, not cells.** Three buttons: select, wrap,
  serve. That is also why ticket focus cannot be player-selected — there is no
  input left, so the game must assign it.
- **OVERHEAD is the only place a customer exists.** Queue length, who is at the
  window, and a walkout are all there. The QUEUE count on the wall beside the
  opening goes red past three.
- **The SCORE CARD is the Delivery Shift's own card**, at its own rect, with
  only the third row changed (`HAYS PD` → `ERRORS`). It is drawn last, with a
  cast shadow, so it reads as hovering over the room rather than as a hole.
- **The DIALOGUE STRIP takes the bottom band because that is the only region
  non-critical in BOTH halves** — you are not reading the minimap or the nav
  unit during a one-line reaction. Its portrait box is 56×56, the minimap's
  exact rect, which is what forces a floating head rather than a bust: a bust
  needs 66 rows and neither frame has 66 to give.

---

## Tweaking it without breaking it

**Re-render and look. Every time.** A taco sprite here went through five
rewrites — salad dish, plant pot, bucket, basket of soil — and every version
looked correct in the source. `node tools/render/crop.mjs <x> <y> <w> <h> <zoom>`
magnifies any region.

**Then score it.** `node tools/render/measure.mjs` compares the frame against a
live render of the shipped Delivery Shift and prints `WITHIN TOLERANCE` or not.
If a change pushes it out, the change is wrong or the target moved — decide
which, deliberately.

Things that will bite:

- **Warmth is binary** (`r > b+8`). Desaturating a warm colour scores *zero*.
  Move the surface to a different palette family instead.
- **Negative space must be mid-value.** Opening space around an object and
  exposing a near-black backing makes the histogram worse, not better.
- **Don't key new objects in `PAL.ink` by reflex.** The shipped game separates
  by value step and cast shadow; it runs 7.8 hard edges per 100px.
- **Two legible human sizes: 9×15 and ~44px.** Around 21px there are five
  pixels between the eyes and no technique rescues it. Size the box to the
  face, never the face to the box.
- **Feedback must not use a colour the thing it marks might already be** — a
  red mis-click flash is invisible on a red ingredient. Flash the chrome, or
  flash *value*.
- **The vignette costs ~6% of a colour at centre and up to 50% at the edges.**
  Mid-tone art in a corner turns to mud. Check corners specifically.
- **Vertical fit is invisible in code.** `text()` takes the *top* of the run, so
  a 7px glyph at `y` occupies `y..y+6`. `node tools/render/audit.mjs` reads the
  rendered pixels back and asserts a clear row above and below every glyph run
  in a plate.
