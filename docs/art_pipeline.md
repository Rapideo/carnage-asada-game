# Art pipeline — adding a character

How a reference image becomes a character in the game. Written after doing it once,
end to end, on 2026-08-24; every rule below is here because something went wrong
without it.

**The one-line version:** the likeness is *data*, the variation is *code*. You draw
a reference, `bake-face.mjs` reduces it to a pixel table in source, and the game
decodes that at boot and layers blinks and expressions over it.

---

## Why it works this way

The obvious approach — parameterise a face-drawing routine and give each character
different numbers — was built and rejected. It is still in the tree as
`SMOKER_PARAM` in `reference/kitchen/cast.mjs`, next to the baked version, because
the comparison argues the case better than any paragraph:

**A drawing routine composes axis-aligned rectangles.** That is fine for a car and
hopeless for a face. At 44px a likeness needs irregular, diagonal edges, and every
parameter pass produced a face made of bars — two hard brow strokes, a rectangular
cheek shadow, a ruler-straight hairline. A reduced reference has those edges
because it came from a drawing.

This is not a departure from how the project works. `GLYPH` (the 5×7 font) and
`LOGO` (the 7×9 display face) are both hand-authored pixel tables in source,
decoded at boot. A baked face is the same thing with a bigger table and a
generated one.

**Nothing is fetched, ever.** The pixels live in a source literal. The artifact
runs under a CSP that blocks external hosts, and `fetch()` on a `file://` page is
blocked by CORS, so an image file would blank the screen on the main distribution
path. Reference PNGs live *outside* the repo and are authoring input only.

---

## What the reference art needs to be

**Frame it as a bust.** Head, neck, shoulders, a bit of what they're wearing. The
portrait box grows to fit a bust and the clothing does a lot of characterising work
at this size. You can always crop a bust down to a head; you cannot invent shoulders.

**Leave headroom.** A few percent of empty space above the hair. A crop that clips
the top of the head reads as a mistake, and the baker cannot add what isn't there.

**Flat, plain background.** The baker treats the source's top-left pixel as the
background colour and drops everything within tolerance 18 of it to transparent.
A gradient or a busy backdrop comes through as a halo.

**Keep props inside the frame.** The first Smoker crop cut the cigarette in half
because it extends well to the left of the face. Anything that defines the
character — a cigarette, a hat brim, a collar — has to fit in the crop.

**Resolution does not matter.** Do not shrink the source to "help". The reducer
area-averages whatever you give it; more source pixels per output pixel is
marginally *better*. What matters is framing.

**It does not need to be pixel art.** The Smoker reference is a soft-edged
AI-generated image that only looks pixelated — run lengths in it are 1–2px. The
downsample does the pixel art. Treat any reference as a **shape and character**
reference, not as pixels to lift.

---

## The steps

### 1. Find the crop

```bash
PROBE=1 node tools/render/fit-portrait.mjs ~/Downloads/NewGuy.png
```

Reports the source size, the background colour it detected, and the bounding box of
actual content, then prints a ready-to-paste crop. Preview a candidate at 1:1
before committing to it:

```bash
SRC=~/Downloads/NewGuy.png node tools/render/crop.mjs <x> <y> <w> <h> 1
# -> tools/render/crop.png
```

### 2. Look before you bake

```bash
node tools/render/fit-portrait.mjs ~/Downloads/NewGuy.png <x> <y> <w> <h>
# -> tools/render/portrait-fit.png
```

Four panels: the current parametric face, the reduction at 16 of its own colours,
the same with an ink keyline, and the same snapped to `PAL`.

**Judge the FREE + INK panel.** If it fails here, nothing downstream rescues it —
the bake is the same reduction.

**The SNAPPED TO PAL panel will look terrible, and that is correct.** `PAL` has no
skin ramp; the nearest entries to skin are `dirt`, `porch`, `wallLt` and `gold`, so
a face snapped to it goes blotchy yellow. Faces carry their own 16 colours by
design. That panel exists to stop someone "fixing" the palette later.

### 3. Bake

```bash
# a bust
MAXW=60 MAXH=74 node tools/render/bake-face.mjs newguy ~/Downloads/NewGuy.png <x> <y> <w> <h>

# a floating head (defaults are 54x54)
node tools/render/bake-face.mjs newguy ~/Downloads/NewGuy.png <x> <y> <w> <h>
```

Writes two files:

| file | for |
|---|---|
| `content/faces/newguy.json` | **the game** — `build.mjs` inlines it into `FACES` |
| `reference/kitchen/faces/newguy.mjs` | the reference rigs (`face.mjs`, `dialog.mjs`) |

Read the output. It tells you the bitmap size, the colour count, the run count, the
source cost, the detected eye rects and the round-trip result.

**Anything in `content/faces/` ships, wired up or not.** `build.mjs` inlines the whole
directory, so an experiment you baked and abandoned is still ~3 KB in the artifact.
Delete the JSON when you drop a character; the copy under `reference/kitchen/faces/`
is free to keep, because nothing in `src/` reads it.

**The round trip is the guard.** The baker re-imports what it wrote, decodes it with
the *shipped* decoder, and asserts pixel-identity. An encoder and decoder that
disagree produce a face that is subtly wrong everywhere, which reads as bad art
rather than as a bug.

### 4. Check the eyes

The baker prints them, e.g. `eyes [[9,27,5,6],[20,27,7,6]]`. They should be **level**
(same `y`) and a sensible distance apart. If it warns, or the numbers look wrong,
override them in `reference/kitchen/cast.mjs` — detection is a convenience, not a
contract.

Eye rects are what blink and hood operate on. Wrong rects mean a blink that
repaints part of the cheek.

### 5. Wire it up

Build, then point the strip at it:

```bash
node build.mjs
```

Right now `src/72_dialog.js` has a single constant:

```js
const DLG_FACE = 'smokerbust';
```

**This is the extension point.** One character exists, so it is a constant. With a
cast, the face becomes a property of whoever is speaking — pass it through
`Dialog.say(who, line, { face: '<name>', ... })`, which already accepts it, and have
`G.react()` choose. Do not add a second face by adding a second constant.

### 6. Look at it running

```bash
node reference/kitchen/face.mjs        # the cast sheet, native and 6x
node tools/render/drive.mjs --say      # the shipped strip over a live driving frame
node serve.mjs                         # then open http://localhost:8123/taco-shop.html
```

In the browser, `window.TacoShop` exposes `G`, `Dialog` and `Faces`. To hold a frame
for inspection:

```js
const T = TacoShop;
T.G.startShift(); T.step(90);
T.G.react('delivered', T.G.order, false);
T.step(14);
T.G.update = () => {};   // freeze; render keeps drawing the frozen state
T.step(1);
```

Restore `G.update` afterwards or the game stays stuck.

---

## Sizes and budgets

| | value | why |
|---|---|---|
| portrait box floor | **56×56** | the minimap's exact rect (`70_hud.js`, `MM + 4`) |
| floating head | ~46×54, face 33px wide | fits the floor with no overhang |
| bust | ~60×74 | **overhangs the strip upward**; the strip stays 60 rows |
| colour cap | **16** | 15 from median cut + the ink keyline; a run's symbol is one hex digit |
| cost | ~2.6 KB head, ~3.8 KB bust | of source, against a ~250 KB artifact |

**56×56 is a floor, not a ceiling**, and this is the single most useful thing on this
page. Squeezing a bust *into* 56 rows drops the face from 33px wide to 24px, and this
project has already measured that a face works at ~44px and is mush around 21px. So a
taller portrait overhangs, costing a 60×18 patch at the bottom-left corner — where the
minimap already sits, the cheapest real estate on screen — instead of a taller band
across all 376px. Breaking the frame is an arcade idiom, not an accident.

---

## What the build checks, and what nothing checks

`build.mjs` rejects a face whose runs do not cover `w × h`, whose palette exceeds 16,
whose `pix` has an odd length, or whose run points at a palette entry that isn't
there. All of those decode into a smear with no error otherwise.

It also width-checks `content/dialogue.json` — **against the speech bubble, not the
384px screen**. The portrait sits beside the bubble, so the limit is computed from
the widest baked face. Swapping in a wider portrait automatically tightens it and the
build names the line to trim. A line that passes a screen-width check can still
overflow the bubble, and the test suite's drawing stubs cannot see it.

**Nothing checks whether the face looks right.** `test/headless.mjs` draws through
stubs and by design cannot see a pixel. Render it and look — that is not optional
advice, it is how every defect in the table below was found.

---

## Troubleshooting

| symptom | cause | fix |
|---|---|---|
| A "22×22 eye" detected | absolute brightness threshold caught a lit forehead — skin highlights hit luminance 175, an eye white 194 | already fixed: only the top luminance band counts. If it recurs, set `eyes` by hand |
| Eyes detected at different heights | a white collar out-competed the eye whites | already fixed: the baker picks the most *level* pair, not the two biggest |
| Blink barely visible | the rect covered only the sclera, ~3 rows on a hooded face | already fixed: rects are padded up and out to cover the socket |
| A stray fleck of jacket or smoke | the crop caught a corner of something else | already fixed: only the largest connected blob survives. Tighten the crop if it persists |
| The head looks soft, floating on the backing | no ink keyline | the baker adds one; check you didn't bypass `reduceHead` |
| Skin goes blotchy gold | something snapped the face to `PAL` | faces carry their own palette. See step 2 |
| A halo of background around the head | source background is not flat, or is far from the top-left pixel | re-export the reference on a flat backdrop |
| `crop.mjs` throws on an outside PNG | it used to only read filter-0 rows from our own writer | fixed — `png-read.mjs` handles real encoder output. Both use it now |

---

## When *not* to use this

`portrait.mjs` still draws `CLASSIC` from parameters, and the parametric route is
still right for two things:

- **A face nobody needs to recognise.** A background customer does not need a
  reference image and 3.8 KB.
- **Variation on top of a baked face.** Blink and hood are code, layered over the
  baked pixels and never painted into them — repainting part of a likeness in flat
  rectangles puts the bars straight back.

**Mouth variation is not available on a baked face.** For the Smoker that is moot,
because the cigarette occupies his mouth — which is also why his expressions run on
brows and lids alone. A character who needs to talk gets 2–3 mouth frames baked and
switched between, at ~3 KB each.

---

## Adding a new variation state

Variation lives in `Faces.draw` in `src/35_faces.js`, and takes one rule: **it draws
over the baked pixels and never into them.** A new state needs a rect in the face
data to operate on, the way `eyes` works — add it to the baker's output rather than
hard-coding coordinates per character.

Mirror any change into `reference/kitchen/facedata.mjs`, which is the same code as an
ES module so the reference rigs can use it. The two are deliberately kept in step;
the baker's round-trip check runs against the reference copy.

---

## Related

- `CLAUDE.md` — *Faces and the dialogue strip*, and the module table
- `tools/render/README.md` — every tool in the harness
- `reference/kitchen/README.md` — the screen regions and the 44px finding
- `JOURNAL.md` — *"Drawing food at 384×216"* and the two-legible-sizes rule
