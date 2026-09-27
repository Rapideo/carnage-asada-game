# Taco Shop - Carnage Asada

## Game Design Document

## I. Overview and Current State

Taco Shop - Carnage Asada started life as a one-shot attempt at generating 16-bit, arcade-stye driving game, with the original mechanic having the driver delivery pizzas. After incredibly impresive results from that effort, it was determined that this would be a great candidate for a game I have made prior attempts at designing - a restraunt-themed game based on a local Hays, KS fast food establishment "Taco Shop". 

We swiftly and effectily adapted the gameplay style to delivery bags of tacos (as oposoed to pizzas) using the same game-lay mechanics; and added a sense of locality to the game. Driving grids are now based on the actual town of Hays, KS; and Taco Shop's actual geographic location. Futher more, we expanded the block-level building options, added a train mechanic, and improved overall driving and delivery experience. 

While the game as it sits is HIGHLY playable, and overall a very impressive effort, it is our intent to expand and improve this game to turn it into a 20-level, 2 disstinct play mechanic game that alternates between our original "Deivery Shift" game, and our new "Kitchen Shift" game. 

Allowing for this requires specific updates to the Delivery Shift game; changes to how the player controls currently work, to map expansion efforts, to difficulty parameters, adding a dialog engine, and more.

**Context Clarification**

*THIS IS NOT A JUST MINI-GAME.* This was introducted to our current project as  new "mini game" but this framing was incorrect. The new "kitchen shift" game will equally represent the "delivery shift" game in the 20 total levels of Carnage Asada, with 10 levels for each. 

The two games, while both contibuting to the overall player's point total - are distinct player efforts, and are not mechanically tied together. Delivery orders have nothing to do with the orders you made during your Kitchen Shift, and vice versa. 

## II. Globals

### A. Look and Feel Target

**Carnage Asada's look and feel are right and are not up for revision.** The frantic pace, the arcade read, the CRT pass, the palette discipline, the procedural chunky sprites, the chip audio — that's the product. The Build is being brought *into* this game's aesthetic, not bolted onto the side of it. If any detail of this fights the way this game looks or sounds, **this game wins**. If it cannot live up to this standard, we scrap it. 

**The bar: I should not be able to tell, from a screenshot, that this this is a different game after this change effort than before it.**

### B. Controls

#### 1. Mode A : Keyboard and Mouse

Mode A, and where our initial version of the game should start, carries over the play controls from our existing Delivery Shift game.  

#### 2. Mode B:  Arcade

Mode B expands these controls (the game should allow for the selection of Control Modes) to allow for game control via Joytick and button presses only, removing the mouse functionality altogether. 

#### 3. Mode C: Mobile

Mode C further expands the Arcade controls from Mode B, adding a joytick and button control overley to the screen during the driving sequences, and a a touch-based interface for the Kitchen Shift. 

### C. Attract Mode

### D. The Clock

#### 1. Shift Timer

Keeping with with the arcade pacing, each shift, both Driving and Kitchen will be set at 2 minutes. If and when this time expires, the game is over. 

#### 2. Extensions

If the player meets the expectations of the individual levels, dependant on the rules applied there, the user will recieve a time extension, and be allowed to continue play. The player shall recieve no more than FOUR extensions per level.

*The starting time, extension length and cap are set per difficulty in `difficulty.md`,
which wins over the 2 minutes and FOUR above (3:00, and up to five on Easy).*

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

### E. Scoring

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

### G. Levels

#### 1. Level 1

- Name : Summer - 1972

- Type : Delivery Shift

- Difficulty Level : Easy

- Map : 1

- Era : 1970s

#### 2. Level 2

- Name : Winter - 1972

- Type : Kitchen Shift

- Difficulty Level : Easy

- Menu : 1

- Era : 1970s

#### 3. Level 3

- Name : Winter - 1975

- Type : Delivery Shift

- Difficulty Level : Easy 

- Map : 1

- Era : 1970s

#### 4. Level 4

- Name : Summer - 1975

- Type : Kitchen Shift

- Difficulty Level : Easy

- Menu : 1

- Era : 1970s

#### 5. Level 5

- Name : Summer - 1978

- Type : Delivery Shift

- Difficulty Level : Medium

- Map : 1

- Era : 1970s

#### 6. Level 6

- Name : Winter - 1978

- Type : Kitchen Shift

- Difficulty Level : Medium

- Menu : 1

- Era : 1970s

#### 7. Level 7

- Name : Winter - 1981

- Type : Delivery Shift

- Difficulty Level : Easy

- Map : 2

- Era : 1980s

#### 8. Level 8

- Name : Summer - 1981

- Type : Kitchen Shift

- Difficulty Level : Easy

- Menu : 2

- Era : 1980s

#### 9. Level 9

- Name : Summer - 1984

- Type : Delivery Shift

- Difficulty Level : Medium

- Map : 2

- Era : 1980s

#### 10. Level 10

- Name : Winter 1984

- Type : Kitchen Shift

- Difficulty Level : Medium

- Menu : 2 

- Era : 1980s

#### 11. Level 11

- Name : Winter - 1987

- Type : Delivery Shift

- Difficulty Level : Medium

- Map : 2

- Era : 1980s

#### 12. Level 12

- Name : Summer 1987

- Type : Kitchen Shift

- Difficulty Level : Medium

- Menu : 2

- Era : 1980s

#### 13. Level 13

- Name : Summer 1990

- Type : Delivery Shift

- Difficulty Level : Easy

- Map : 3

- Era : 1990s

#### 14. Level 14

- Name : Winter 1990

- Type : Kitchen Shift

- Difficulty Level : Easy

- Menu : 3

- Era : 1990s

#### 15. Level 15

- Name : Winter 1993

- Type : Delivery Shift

- Difficulty Level : Medium

- Map : 3

- Era : 1990s

#### 16. Level 16

- Name : Summer 1993

- Type : Kitchen Shift

- Difficulty Level : Medium

- Menu : 3

- Era : 1990s

#### 17. Level 17

- Name : Winter 1996

- Type : Delivery Shift

- Difficulty Level : Medium

- Map : 3

- Era : 1990s

#### 18. Level 18

- Name : Summer 1996

- Type : Kitchen Shift

- Difficulty Level : Medium

- Menu : 3

- Era : 1990s

#### 19. Level 19

- Name : Summer 1999

- Type : Delivery Shift

- Difficulty Level : Hard

- Map : 3

- Era : 1990s

#### 20. Level 20

- Name : Winter 1999

- Type : Kitchen Shift

- Difficulty Level : Hard

- Menu : 3

- Era : 1990s

### H. Characters and Dialog System

#### 1. Customers - move to game type

#### 2.  Drivers - move to game type

#### 2. Taco Shop Staff - move to game type

### J. Eras

Over the 20 levels, the game will feature 3 "Eras"; the 1970s, 1980's, and 1990s which will impact the global look and feel of the game by utilizing both an Era-Specific color pallete, as well as changes to the menus, characters, and dialog. 

#### 1. 1970s

#### 2. 1980s

#### 3. 1990s

### K. Seasons

The game levels will also specify a Season, either Summer of Winter, which wil dictate both driving conditiions, hazards, and customer dress. 

### L. Music

By leveraging music from each defined era, the games music will be a direct reflection of the time along with the visual aethstetic. Named below are each of the songs that the game will feature, and during which era they will appear.

Songs themselves will be derived from MIDI files, passed thru a Note JS conversion process that will leave us with a JSON song structure file, and instruction as to which model of synthesis and instuments to utilize.

### III. Authored Content

## A. Attract Mode (attract.md)

## B. Levels (levels.md)

## C. Difficulty (difficulty.md)

- ## D. Menu (menu.md)

- Era 1

- Era 2

- Era 3

## E. Characters (characters.md)

- Era 1 

- Era 2

- Era 3

### F. Dialog (dialog.md)

- Era 1

- Era 2 

- Era 3

## G. Music (music.md)

To minimize anacronisms, music will be specific to the Year defined in the Level. While songs don't need to come from the exact year of play, they should be current or prior by no more than 1-2 years to add to the time-realism of the game. 

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

### 

## CONTROL MECHANICS

## III: The Delivery Shift

### A. Play Mechanics

### B. Control Mechanics

#### 1. Mode A : Keyboard/Mouse

#### 2. Mode B: Arcade Mode

4-Way Joytick Control - DRIVE MODE

- Up: YTBD

- Down: YTBD

- Left: Turn Left

- Right : Turn Right

There are a total of THREE butons:

- Button 1: Accelerate

- Button 2: Reverse

- Button 3: Aim and Release

HOLDING Button 3 puts the Joysick into Aim Mode; where the joystick no longer moves the car, but instaed allows you to direct the path of the throw, much as the mouse does currently. RELEASING Button 3 tosses the bag.

#### 3. Mode C: Mobile Mode

### B. UI and Interaction Updates

#### 1. Map Expansion

#### 2. Era Themes

#### 3. Music

### C. Maps

#### 1. Map 1

#### 2. Map 2

#### 3. Map 3

### C. Control Updates

### D. Difficulty Schemas

### E. Scoring

#### 1. Points Schema

- **Stars** (2026-09-26): each **perfect delivery**, a bag that lands on the doorstep,
  earns a star. It is the delivery version of the kitchen's clean item (§IV.F.1), and
  the same throw that already pays +$5. Stars are a report card only: a tally at level
  clear and game over, never money and never on the board.

#### 2. Bonus Schema

## IV: The Kitchen Shift

### A. Play Mechanics

## B. UI and Player Interactions

### B. Dialog

### C. Control Mechanics

### D. Difficulty Schemas

Difficulty scaled by lengthening recipes, widening the menu pool, adding items per order, and tightening patience.

### E. Menus,  Ingredient Grid, and Assembly

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

#### 2. Bonus Schema

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

## X. Non-Negotiable Technical Constraints

- **Zero dependencies.** No packages, no asset files, no fetch, no CDN. Sprites, sound and glyphs are generated procedurally at boot — anything you add is drawn in `30_art.js` and voiced in `20_audio.js`.
- 384×216 virtual screen, 5×7 ASCII-only font, all money in **integer cents**.
- `src/*.js` are plain scripts sharing one global scope, concatenated in filename-sort order. A new module needs a numeric prefix after everything it uses at load time. Top-level `const` collisions are fatal and surface only in the bundle.
- Menu data, recipes, abbreviations, bark lines and walkout quotes are **authored content** — they go in `content/*.json`, validated at build time, not hard-coded in `80_game.js`. The build already rejects characters the font can't draw and copy too wide for the screen; extend that validation to cover recipes rather than trusting a comment. A note is not a guard.
- Palette discipline: `PAL.cyan` is reserved for guidance so it reads as machine output,   `PAL.jade`/`PAL.gold` are badge-only and stay off the HUD, amber is money, red is danger.
- Rebuild with `node build.mjs`; `taco-shop.html` does not reflect source edits until you do.

### X.1 Art Requirements — matching the Delivery Shift

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

## 

*
