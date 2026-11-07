# Welcome — a note for the art director

*Written 2026-11-07 by Claude (the code side of this project), for the agent the owner has
put in charge of art direction and concept generation.*

Welcome aboard. You're joining a game that is finished and playable: 20 levels, three
eras (1970s, 1980s, 1990s), with summer and winter seasons. Up to now I've been doing
the art and the code together, so most of the art is a *re-creation* of reference
images rather than the images themselves. This note explains how that works, so the
art you make lands in the game as you intended.

The detailed manual is `docs/art_pipeline.md`. This note gives you the picture first.

---

## The one idea that explains everything

**No image file ever ships.** The game is one self-contained HTML file. It runs under
a security policy that blocks every external request, and it is often opened straight
from disk, where browsers refuse to load neighbouring files. An image file the game
tried to load would come up as a blank screen.

So every picture in the game is either **drawn by code** or **stored as numbers inside
the code**, and is painted onto an HTML `<canvas>` when the game starts. Your art is
**input** to that process: a reference that gets re-created, never a file the player
downloads.

The whole screen is **384×216 pixels**, scaled up to fit the window. At that size, a
steam-table pan is 42 pixels wide and a customer's face is about 46.

---

## Two ways a picture gets into the game

### 1. Drawn in code ("procedural")

The original approach, and still most of the game. Code paints the picture from
rectangles and simple shapes, using the game's palette (`PAL` in `src/00_core.js`):
- the whole city of Hays: streets, houses, stores, the railway and the prairie edge;
- the cars, the people, the train, the cop;
- the 5×7 pixel font and the 7×9 display lettering of the logo;
- the kitchen room: the ticket rail, the dining room seen from overhead, the counters;
- **the item being built on the prep board** (more on that below).

This works well for things made of straight edges: buildings, cars, steel, signage.
Reference art for these is used **by eye**. I look at it, then write drawing code that
captures it. Examples:
- The shop's real sticker (`reference/assets/Taco Shop.webp`) became the hand-drawn
  7×9 lettering used on the title and the rooftop sign.
- The kitchen mock-up in `reference/kitchen/` became the shipped Kitchen Shift in
  `src/74_kitchen.js`.

### 2. Baked from a reference image

This is where your work goes. Drawing code fails on organic things. When I tried to
draw a face from adjustable numbers, every attempt came out as a face made of bars: hard
straight brows, a rectangular cheek shadow, a ruler-straight hairline. Food has the
same problem. So for these, the picture comes from a real image:

1. **A reference image goes in.** Yours, or one the owner supplies.
2. **A baker shrinks it** to the exact pixel size of its slot on screen. It reduces it
   to **at most 16 colours** and stores it as a small table of numbers in a JSON file
   under `content/`.
3. **The build tucks that JSON into the game file**, and the game decodes it into a
   picture at start-up.

These are baked today:

| what | tool | stored in | size on screen |
|---|---|---|---|
| customer faces (17 baked, across the three eras' casts) | `tools/render/bake-face.mjs` | `content/faces/` | ~46×54 head, ~60×74 bust |
| the steam-table wells: the ingredient pans and base stations | `tools/render/bake-lattice.mjs` | `content/lattice/` | 42×24 bin, 42×54 station |

The baker checks its own work by decoding what it wrote and confirming it gets back
exactly the same pixels. Even so, **nothing automated can tell whether a picture looks
right**, so every bake is rendered and looked at before it is accepted.

---

## Where we started, and how we got here

- **The first version (the delivery game)** was 100% drawn in code. It had no images at
  all, by design.
- **Reference art arrived next.** The owner gathered sets of era reference images
  (`reference/assets/images/`, "70s/80s/90s - Set N"), plus the shop sticker. These
  were used *by eye*, as the look to re-create in code.
- **The kitchen was mocked up from a reference frame** (`reference/kitchen/`). Its
  *look* was approved as the starting point; its *layout* was not a spec. Building it
  taught most of the rules listed below.
- **Faces were the turning point.** The face drawn from adjustable numbers was compared
  directly with one baked from a reference image, and the baked one won without
  contest. That comparison is still in the tree (`SMOKER_PARAM` in
  `reference/kitchen/cast.mjs`).
- **Ingredient wells went the same way.** Some were baked from a single generated
  sheet. The rest were **made to match by recolouring** an existing well (SAUCE and
  CHILI were made from other wells' pixels with new colours). That was a stopgap, and
  it is exactly what your art replaces.
- **Now (2026-11-07):** the owner approved a proper set of 21 pans and 7 shells/bread.
  It is in `reference/kitchen/ingredients/`. **It is not baked into the game yet.** The
  owner has pinned that until your next delivery arrives.

---

## What makes art easy to use

Every one of these is here because ignoring it went wrong once.

**Shape before resolution.** Resolution barely matters, because the baker shrinks
everything. What matters is **framing and proportion**:
- an ingredient bin is a wide landscape slot, **1.75 : 1** (42×24);
- a base station is tall, about **0.78 : 1** (42×54);
- art in the wrong proportion gets squashed or stretched to fit.

The approved set got this right: each pan fills 42×22 of its 45×46 canvas, almost
exactly the bin's size. The earlier near-square trays did not.

**It doesn't have to be pixel art.** A soft illustration that merely *looks*
pixelated bakes fine, because the shrinking step does the pixel work. Treat a reference
as a guide to **shape, lighting and character**. Its exact pixels won't survive.

**Frame each item tight.** If an item floats in empty space, each piece of food gets
only a few pixels after shrinking, and it reads as mottled texture. If it fills its
frame, it reads as individual chips, cubes and shreds.

**One generation for a whole set.** Consistent angle and lighting across a set is most
of what makes it look like one game. A set generated together matches automatically;
pieces authored separately match only by luck. The current set uses one recipe, so
keep to it: a slightly-above front view, light from the upper left, the same steel
pan.

**Clean backgrounds.** Use transparency, or a flat, even colour, with clear gaps
between items on a sheet. The baker finds each item by those gaps.

**Watch the 16-colour limit.** Each baked picture keeps at most 16 colours. The
approved sprites have 470 to 730 each, so the shrinking step will merge many of them.
Art built from a few **broad, clearly separated tones** survives that. Fine gradients
and speckle turn to mush.

**The screen is cool, and warmth is the accent.** The game reads as cool blue-grey:
road, steel, glass and kerb. Warm colour stands out *because* it is rare. Here that
means the food, the money and the danger. Steel pans with warm food in them are
exactly right. A warm wash over a whole surface loses the contrast. The measured
targets are in `docs/gdd.md` §X.1.

**Highlights want 2 pixels.** The game draws a CRT scanline effect over everything,
and it eats thin *bright* lines while leaving thin dark lines intact. A 1-pixel shine
on a rim can vanish.

**Names are short.** The label on a bin fits **7 characters**: `TOMATO`, `CREAM`,
`PEPPERS`. Full names can live in the menu data; the label can't hold them.

---

## The open job most likely to need you: the build pictures

On the **prep board** at the bottom of the kitchen screen, a picture of the item being
made grows step by step as the player adds ingredients. A hard taco starts as an empty
shell, then gets beef, then lettuce, then cheese. Today that picture is **drawn in
code** (`Kitchen.pic()` in `src/74_kitchen.js`). The owner calls it rough, and it is.

The original plan was baked frames instead: **one picture per menu item per build
stage**, as cut-outs on transparency, about **40×38** on screen. The rules:
- name the frames `<ITEM><STAGE>`, e.g. `TACO1`…`TACO4`;
- deliver one sheet per item, one row of stages, with even gaps between frames;
- use the same angle and light as the pans.

Each frame costs about 2.4 KB of the game file, so the full menu-times-stages set is
worth sizing before anyone draws it all. `docs/art_pipeline.md` covers the
details under "Free objects" and "Build Progress frames".

The menus, so you know what gets built. Ingredients are listed in the order they go
on; the first one is the base.

- **1970s:** Hard Taco, Hard Taco Supreme, Soft Taco, Soft Taco Supreme, Beef Burrito,
  Bean Burrito, Combo Burrito, Sancho, Nachos.
- **1980s adds:** Enchilada with Meat, Chili Burrito, Chili Sancho, Chili Enchilada,
  Chili Cheese Nachos, Sour Cream Sancho, Sanchez, Beef Nacho Supreme.
- **1990s adds:** Sour Cream Burrito, Chicken Hard/Soft Taco, Chicken Enchilada (and
  Supreme), Chicken Burrito, Chicken Nacho Supreme, Sombrero, Queso Melt.

Every item is built on one of four bases: a hard **shell**, a **small** flour
tortilla, a **large** flour tortilla (burritos, sanchos and enchiladas, which get
wrapped at the end) or **chips** (nachos). Exact recipes are in `content/menus.json`.
**The owner decides scope and priority. This list is only so you know the territory.**

---

## How a hand-off works

1. **You make the art**, and the owner reviews and approves it.
2. **The owner passes it to me**, the way the approved set arrived (a zip with a
   README, an asset list, the prompts used, a preview sheet, full-size originals and
   reduced sprites). That format was excellent, please keep it. The prompts file in
   particular lets anyone extend a set in the same style later.
3. **I measure it before baking:** its proportions against the slot, its colour count,
   and which game ingredient each image is for. Anything that doesn't fit comes back
   to you with numbers rather than opinions.
4. **I bake it, render the real game frame, and show the owner** before it goes into
   the build.

Things that would help:
- **Name files by what they are** (`09-diced-tomatoes.png`), and say which game
  ingredient you mean when it's ambiguous. Green onions or white? Jalapeños or green
  peppers? Those two are open questions in the current set.
- **Tell me the target slot** (bin, station, board picture, portrait) if it isn't
  obvious.
- **A 4× preview on a dark background**, like the one with the approved set, is the
  fastest way for the owner to judge a set.

## Where to look

| for | read |
|---|---|
| the full baking manual, every flag and every past failure | `docs/art_pipeline.md` (its "reference only, for now" note about the wells is out of date: wells ship now) |
| the kitchen screen's named regions and exact rectangles | `reference/kitchen/README.md` |
| the measured colour and contrast targets | `docs/gdd.md` §X.1 |
| why food at 384×216 is hard, learned the hard way | `JOURNAL.md`, "Drawing food at 384×216, six times over" |
| the approved ingredient set and its notes | `reference/kitchen/ingredients/` |
| what's pinned and what's next | `RESUME.md`, "Pinned: the art" |

Glad to have you on the team. The game will look a lot better for it.
