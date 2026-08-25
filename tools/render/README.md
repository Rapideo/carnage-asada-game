# tools/render — headless rendering

Renders the real game, and anything drawn with its modules, to a PNG from Node.
**Zero dependencies**, Node built-ins only, so the repo stays dependency-free.

`test/headless.mjs` runs the modules against a Proxy stub where every drawing
call is a no-op. That catches logic and by design **cannot see a single pixel**.
This closes that gap: several classes of defect in this project — a clipped
banner, an invisible north-facing porch, twelve bin labels touching their own
borders — were correct by every assertion and wrong on screen.

```
node tools/render/drive.mjs [steps]      # render a live Delivery Shift frame
node tools/render/measure.mjs [a] [b]    # score a frame against the real game
node tools/render/crop.mjs x y w h zoom  # magnify a region -> crop.png
node tools/render/audit.mjs              # read pixels back, check label fit
node tools/render/palette.mjs            # the complete palette as a sheet
node tools/render/artboard.mjs           # pre-sized canvases for authoring art
node tools/render/bake-face.mjs <name> <src.png> <x> <y> <w> <h>
node tools/render/bake-lattice.mjs <sheet.png> --tray --pad 2
```

| file | what it is |
|---|---|
| `px.mjs` | software Canvas2D + PNG writer |
| `engine.mjs` | loads the real `src/` modules against it, in a `node:vm` |
| `drive.mjs` | boots the game, drives it, renders a play frame |
| `measure.mjs` | the normalisation score — see PRD §X.1 |
| `crop.mjs` | nearest-neighbour magnifier |
| `audit.mjs` | label-plate clearance, by pixel readback |
| `palette.mjs` | every `PAL` entry as a sheet, grouped by what it is for |
| `reduce.mjs` | reference image → small indexed bitmap; shared so the fit test and the bake cannot disagree |
| `bake-lattice.mjs` | a contact sheet of ingredients → twelve wells; finds the crops rather than being given them |
| `bake-face.mjs` | bake a reference into a source data table, round-tripped against the shipped decoder |
| `png-read.mjs` | decode a PNG we did not write — real filters, so outside reference images load |
| `fit-portrait.mjs` | reduce an outside reference into the 56×56 box and compare against what ships |
| `artboard.mjs` | the lattice wells and the 56×56 face box at 6×, with their constraints drawn on |
| `reference-frame.png` | a checked-in Delivery Shift frame, the comparison target |

## How it works

`engine.mjs` concatenates `src/*.js` in filename-sort order — the same order
`build.mjs` uses — and runs it in a `node:vm` where
`document.createElement('canvas')` returns a `px.mjs` canvas. So `PAL`, the 5×7
font, the `LOGO` face, `Hud.panel` and the CRT `Post` pass are the **shipped**
ones, not copies. `drive.mjs` then calls `G.boot(seed)`, `G.startShift()`, steps
`G.update` with keys held in `Input.down`, and calls `G.render(ctx)`.

## What `px.mjs` had to support, and why

Everything here was discovered by the game crashing:

- **A full 2×3 transform matrix**, not just translate. `Art.buildTrain` flips a
  sprite with `scale(-1, 1)` and `rotFrames()` bakes 32 frames with `rotate()`.
- **`ellipse()`.** `City.genPark` draws the pond with it. Note that pond sits
  behind `rng.chance(0.6)` and does **not** roll under the test seed — the same
  hazard `JOURNAL.md` §11 records for `PAL.sea`. A different seed finds it.
- **A guard on `fillStyle = undefined`.** A real canvas silently keeps the
  previous colour, turning a deleted palette entry into quietly wrong pixels.
  This throws, matching `test/headless.mjs`.

## A caution about `measure.mjs`

It is a scoring function, not a judge.

Two of its metrics have a **floor set by the design's own content** — three
cream paper tickets and a wooden board were 42% of the kitchen frame before a
single ingredient was drawn, so a 19% warm target was unreachable without grey
paper and a board that is not wood. Below about 45% it had stopped measuring a
flaw and started measuring the design.

And a composite metric tells you a frame is wrong, not *what* is wrong. Split it
before acting: the kitchen's excess near-black looked like ink keylines and was
in fact one warm-dark wall — the cool ink was already at parity. See `JOURNAL.md`,
*"How to make a new screen match this one"*.

**Render and look. The number is a second opinion, not the first one.**
