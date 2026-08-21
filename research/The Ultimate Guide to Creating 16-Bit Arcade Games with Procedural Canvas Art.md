# The Ultimate Guide to Creating 16-Bit Arcade Games with Procedural Canvas Art

## TL;DR

- **You can build a convincing 16-bit arcade game in the browser with zero image assets** by treating every "sprite" as a parameterized draw function (stacked `fillRect`/`arc`/path primitives) rendered into a small offscreen buffer (e.g., 320×240), scaled up with `imageSmoothingEnabled=false` plus CSS `image-rendering: pixelated`, and animated purely by feeding time and game state into `Math.sin`/modulo math. This is the same "racing the beam" discipline the Atari 2600 was born under, carried through the demoscene and size-coding cultures.
- **The AI-assisted workflow that actually works** is: tell the agent to *write code that draws, not to generate images*; pin a style-guide file (fixed palette as named constants, proportions, outline rules) that every draw function must obey; and close a screenshot feedback loop — render the running canvas, screenshot it, feed it back, and iterate 2–3 times. Anthropic's own guidance and real developer postmortems confirm this is where quality comes from.
- **Steal from the proven canon:** js13kGames postmortems (asset-free by rule), Frank Force's LittleJS/tweetcart/"City in a Bottle" size-coding work, Belén Albeza's crisp-pixel-art articles, MDN's canvas optimization docs, and Gaffer's fixed-timestep loop. For AI iteration, study Matt Shumer's "Gauntlet Loop" (separate builder and blind critic agents comparing against reference art).

## Key Findings

1. **Constraint is the aesthetic.** The 16-bit look is not nostalgia decoration; it falls out of hard constraints (small resolution, few colors, integer scaling, cheap math). Embracing the constraint — no asset pipeline — is what produces the coherent style and the tiny, hackable codebase.
2. **"Sprites" become pure functions of `(ctx, x, y, t, state)`.** A car, a character, or a food item is a stack of rectangles and arcs drawn relative to an origin, wrapped in `ctx.save()/translate()/rotate()/restore()`. Animation is `Math.sin(t)`-driven limb offsets and `frame % n` cycling — no sprite sheets.
3. **The pixel pipeline is three lines of setup plus discipline.** Draw into a small backbuffer, disable smoothing, integer-scale to the display, and keep all coordinates integers. Palette-as-array and palette swapping give you NES-style variety for free; ordered (Bayer) dithering and cheap scanline overlays sell the CRT look.
4. **Performance at 60fps is a draw-call budget problem.** Cache static layers (backgrounds, UI) onto offscreen canvases and blit them; use path/`fillRect` drawing for shapes and reserve `ImageData` for genuine per-pixel effects (plasmas, palette cycling, dithering passes); drive everything from one `requestAnimationFrame` loop with a fixed-timestep accumulator.
5. **AI agents are unusually good at this specific task** — vanilla JS + Canvas is a "sweet spot" — but weak at *seeing* the result. The entire craft of AI-assisted procedural art is compensating for that blind spot with style-guide files and screenshot loops.

## Details

### 1. Philosophy — constraint-driven rendering

The defining property of an asset-free game is that **there is no asset pipeline at all**. There are no PNGs to load, no sprite atlases to pack, no texture budget — only functions that, given a canvas context and some numbers, paint pixels. This inverts the usual mental model: instead of "an artist makes a sprite and code moves it," *the code is the sprite*. A "sprite" is a parameterized draw function; animation is that function evaluated at different times.

This lineage is old and honorable. The Atari 2600 (VCS), released in 1977, had no framebuffer and only 128 bytes of RAM; programmers had to write each scanline of video to the TV output one line at a time, synchronizing the 6502 CPU with the CRT's electron beam — the practice Nick Montfort and Ian Bogost's 2009 MIT Press book named *Racing the Beam*. To get more than a couple of colors on a line, you literally changed color registers mid-line as the beam swept across ("racing the beam"). The demoscene inherited and weaponized this: on the ZX Spectrum, C64, and even the VCS itself, coders exploited beam timing and register tricks to exceed the machine's nominal limits. Size-coding culture (js1k, js13k, Dwitter's 140-character "dweets," Pico-8 tweetcarts) is the direct modern descendant: when you cannot ship assets, you *generate* everything from math.

The through-line is a single idea: **limitation breeds technique**. When you accept "no images," you rediscover the tricks — symmetry, procedural repetition, trig-driven motion, palette manipulation — that made 8- and 16-bit games look alive on almost no hardware. Frank Force, creator of the LittleJS engine, puts the size-coding rationale plainly: "Working under a hard byte limit forces you to think outside the box and learn new techniques, which turns out to be useful everywhere else."

### 2. The pixel pipeline

The foundation is a **small offscreen buffer scaled up with nearest-neighbor**. You draw the whole game at, say, 320×240, then blit that buffer to a larger on-screen canvas (or scale the canvas via CSS) with smoothing off. This is what produces crisp, fat pixels instead of a blurry mess.

```js
// Backbuffer at native "16-bit" resolution
const W = 320, H = 240, SCALE = 3;
const buffer = document.createElement('canvas');
buffer.width = W; buffer.height = H;
const bctx = buffer.getContext('2d');

// On-screen canvas, integer-scaled
const screen = document.getElementById('game');
screen.width = W * SCALE; screen.height = H * SCALE;
const sctx = screen.getContext('2d');
sctx.imageSmoothingEnabled = false;   // the crucial line

function present() {
  sctx.drawImage(buffer, 0, 0, W, H, 0, 0, W * SCALE, H * SCALE);
}
```

And the CSS half, per Belén Albeza and MDN:

```css
#game {
  image-rendering: -moz-crisp-edges;
  image-rendering: -webkit-crisp-edges;
  image-rendering: pixelated;   /* modern browsers */
}
```

MDN's "Crisp pixel art look" article is explicit that `image-rendering` works with both Canvas2D and WebGL contexts, and that the one caveat is you **must use integer scale factors and integer coordinates** — drawing "a 128×128 pixel image into a 100×100 pixel area" yields fractional pixels "which can lead to blurriness." Belén Albeza's articles (belenalbeza.com) describe the same technique — draw small, scale up with nearest-neighbor, keep coordinates integral — and note Phaser's `setImageRenderingCrisp` / `roundPixels` automate the browser-prefix and rounding chores if you use that engine. MDN's optimization guide reinforces rounding coordinates with `Math.floor()` to avoid sub-pixel anti-aliasing overhead.

**Palette-as-array and palette swapping.** Define your colors once, as named entries, and reference by name — never scatter hex literals. This is both a size trick and a consistency trick, and it enables NES-style palette swapping (recolor the same draw function to make a stronger enemy variant). On real NES hardware a sprite palette was four colors and games like *Final Fantasy* used palette swaps so "a Frost Giant … [is] more powerful than (ordinary) green Giants," recognized by color alone.

```js
const PAL = {
  bg:    '#1a1c2c', ink:  '#000000',
  red:   '#b13e53', redHi:'#ef7d57',
  steel:'#94b0c2', tire:'#333c57', glass:'#41a6f6',
};
// A palette "swap" is just passing a different color object to the same draw fn.
```

For per-pixel work you drop to `ImageData`, whose `data` is a flat `Uint8ClampedArray` of RGBA. Palette *cycling* (animating colors without redrawing geometry) and plasmas are classic `ImageData` cases.

**Dithering.** Ordered (Bayer-matrix) dithering simulates gradients and extra shades with a fixed threshold pattern, giving that authentic 1-bit/limited-palette texture. The canonical 4×4 Bayer matrix (values 0–15 over 16) is tiled across the image; you add the matrix's position-dependent offset to a pixel's brightness before quantizing. Niels Leenheer's `canvas-dither` package implements threshold, Bayer, Floyd–Steinberg, and Atkinson variants directly on `getImageData`/`putImageData` — useful as reference even if you hand-roll a tiny version. For hand-drawn shapes you can also fake dithering cheaply by filling with a 2×2 checker `CanvasPattern`.

**Scanlines / CRT.** The cheapest convincing CRT effect is a static overlay: draw 1px-tall semi-transparent dark lines every other row, once, into a cached canvas, and composite it over the frame. A step up is a Bayer-dithered luminance pass plus a staggered RGB "shadow mask," as documented in several recent write-ups (e.g., Stephen M. Walker II's "Bayer Dither and CRT Mask" and Maxime Heckel's "The Art of Dithering and Retro Shading for the Web") — but for arcade feel, simple scanlines plus a subtle vignette usually suffice and cost almost nothing per frame.

### 3. Sprite construction patterns

The core technique is **layered primitives around a local origin**. Draw the object as if it sits at (0,0), then use the context transform to place, rotate, and scale it. This is exactly how the APB-style car in the requester's project would be built: a body rectangle, a roof rectangle inset and lighter, two dark tire rectangles, a glass-colored windshield arc, headlight dots.

```js
function drawCar(ctx, x, y, angle, pal) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);            // free rotation, no pre-rendered angles
  // body
  ctx.fillStyle = pal.red;   ctx.fillRect(-8, -14, 16, 28);
  // roof / cabin
  ctx.fillStyle = pal.redHi; ctx.fillRect(-6, -6, 12, 14);
  // windshield
  ctx.fillStyle = pal.glass; ctx.fillRect(-5, -6, 10, 4);
  // tires
  ctx.fillStyle = pal.tire;
  ctx.fillRect(-9, -10, 3, 6); ctx.fillRect(6, -10, 3, 6);
  ctx.fillRect(-9,  4,  3, 6); ctx.fillRect(6,  4,  3, 6);
  ctx.restore();
}
```

The pattern `save → translate → rotate → (draw at local origin) → restore` is the standard MDN idiom, and it gives you free rotation from a single definition — you never pre-render 16 rotation frames. (Note: `save/restore` plus transform has real overhead; see Performance below for when to cache.)

**Symmetry tricks.** Draw one half and mirror it with `ctx.scale(-1, 1)`, or loop with `ctx.rotate` to stamp radial features (wheels, propeller blades, star points) — MDN's transformation examples show the radial-stamp loop directly.

**Procedural walk cycles and time-fed animation.** Animation is math, not frames. Feed the elapsed time `t` (or a frame counter) into `Math.sin` to oscillate limbs, bob the body, and swing arms in anti-phase:

```js
function drawWalker(ctx, x, y, t, pal) {
  const step = Math.sin(t * 10);        // leg swing
  const bob  = Math.abs(Math.sin(t*10)) * 2; // vertical bounce
  ctx.save(); ctx.translate(x, y - bob);
  ctx.fillStyle = pal.steel;
  ctx.fillRect(-4, -20, 8, 12);         // torso
  ctx.fillStyle = pal.ink;
  ctx.fillRect(-4, -8, 3, 8 + step*2);  // left leg
  ctx.fillRect( 1, -8, 3, 8 - step*2);  // right leg (anti-phase)
  ctx.restore();
}
```

The Pico-8 tweetcart community has turned this into an art form: as the svntax blog puts it, "The key thing about sine and cosine is that the range is always [-1, 1]. We can use this to basically 'modulate' anything that's a number." Polar motion (`x = cx + r*cos(a); y = cy + r*sin(a)`) gives orbits and circular paths; nesting oscillators of different frequencies gives organic, non-repeating motion.

**Game feel from the same primitives.** The polish that separates a tech demo from a game — what Jan Willem Nijman of Vlambeer ("The Art of Screenshake," 2013) and Martin Jonasson & Petri Purho ("Juice It or Lose It," 2012) codified — is almost all cheap and procedural:

- **Screen shake:** offset the whole backbuffer blit by a few random pixels that decay exponentially, scaled to event magnitude. Directional shake (push along the impact vector) reads better than pure jitter. Crucially for the web, gate it behind `prefers-reduced-motion` — shaking the viewport is a documented motion-sickness trigger.
- **Hit stop / freeze frames:** pause the simulation for 60–80 ms on a heavy hit; the brain reads the pause as weight. As one game-feel write-up (valdemird.com) puts it, "It's the cheapest weight you will ever add to an interface."
- **Particles:** tiny `fillRect` squares with velocity, gravity, and a lifetime; erupt them along the impact vector, bright first then fading to dark.
- **Hit flash:** redraw the sprite in solid white for a frame or two (a "swap the palette to all-white" operation) on damage.
- **Squash & stretch:** non-uniform `ctx.scale` on land/jump.

Layered and tied to a streak or combo, these compound into the feedback loop players don't want to stop.

### 4. Performance

At 60fps you have ~16.7 ms per frame, and on Canvas 2D the binding constraint is usually **draw-call count and state changes**, not fill rate at 320×240. The optimization playbook:

- **Cache static/expensive layers on an offscreen canvas.** MDN's "Optimizing canvas" guide: "If you find yourself repeating some of the same drawing operations on each animation frame, consider offloading them to an offscreen canvas. You can then render the offscreen image to your primary canvas as often as needed." Pre-render the background, the HUD chrome, tiled terrain, and any complex-but-static sprite once, then `drawImage` it. Because you're procedurally drawing, this also means: **draw a sprite once into a small offscreen canvas at creation, then blit that cached canvas each frame** instead of re-running dozens of primitive calls — you keep the "no assets" property (the cache is generated, not loaded) while paying the draw cost only once.
- **`fillRect` beats path-per-pixel; cache beats both.** In Roger Ngo's "HTML5 Canvas Rendering Performance" benchmarks, `fillRect` is "About 86% faster than drawing lines as pixels"; adding a dirty-pixel cache yields a "7.69x increase" over the naive `moveTo/lineTo` approach, and `fillRect` + cache + double buffering reaches "over 12x performance gain." Double-buffering added little at small canvas sizes but widened its lead as canvases grew.
- **`ImageData` vs. path drawing:** use path/`fillRect` for shapes and geometry; reserve `getImageData`/`putImageData` for effects that are inherently per-pixel (plasma, dithering pass, palette cycling, fire). `putImageData` bypasses the transform stack and compositing, so it's fast for full-buffer effects but awkward for moving objects.
- **Round coordinates** with `Math.floor()`/bitwise `| 0` to avoid sub-pixel anti-aliasing — doubly important since it also keeps your pixels crisp.
- **Minimize state changes:** batch by `fillStyle`; avoid needless `save/restore` in hot loops (a car-drawing function called 200×/frame is a place to hoist the transform math out and skip `save/restore`, as Joshua Tenner notes: those calls "have quite a bit of overhead, especially when combined with 4 extra function calls").
- **`OffscreenCanvas` + Web Worker** can move heavy rendering off the main thread via `transferControlToOffscreen`, though for a 320×240 arcade game you rarely need it.

**The loop.** Use one `requestAnimationFrame` loop with a **fixed-timestep accumulator** so physics/animation are deterministic regardless of display refresh — Glenn Fiedler's "Fix Your Timestep!" is the canonical reference. Jake Gordon's JavaScript adaptation:

```js
let last = performance.now(), acc = 0;
const STEP = 1 / 60;
function frame(now) {
  acc += Math.min(1, (now - last) / 1000); // clamp to avoid spiral of death
  while (acc > STEP) { update(STEP); acc -= STEP; }
  render(acc / STEP);          // pass alpha for interpolation if desired
  present();
  last = now;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
```

The `Math.min(1, …)` clamp is important: `requestAnimationFrame` pauses when the tab loses focus, and without the cap you'd get one enormous `dt` on resume (the "spiral of death").

### 5. Community knowledge — the canon worth reading

**js13kGames** (js13kgames.com; Wikipedia has the overview). Founded in 2012 by GitHub Star Andrzej Mazur (@end3r) of Enclave Games, it runs annually from August 13 to September 13. The rule: your game, zipped, must be "smaller than or equal to 13 kilobytes (that's exactly 13,312 bytes …)," and — decisively for this guide — "You can't use any libraries, images or data files hosted on server," which effectively forces procedural graphics and audio. The postmortems are a goldmine:
- Jerome Lecomte's series (medium.com/@herebefrogs), e.g., "A Tourist In Paris" (2017), where accepting "a pixelart style was not to be … forced me to make the most of my procedural placeholders."
- Elliot Nelson's "Harold is Heavy" (7tonshark.com, 2023) — a deliberate "make it so simple I can spend half the time polishing" postmortem, source on GitHub.
- Rémi Vansteelandt's "Path to Glory" (remvst.medium.com), first place desktop *and* mobile in 2023, source on GitHub.
- Eliasku's "Cat Survivors" (eliasku.win, 2025) with concrete canvas perf tips ("Don't render emoji with fillText() … cache them as images and draw them with drawImage()").
- The js13kGames `resources` repo (github.com/js13kgames/resources) and Matt McKenna's list (mtmckenna.com/resources) collect micro-frameworks (Kontra, LittleJS), ZzFX/ZzFXM audio, and minification tricks.

**Frank Force / "Killed By A Pixel"** (frankforce.com) is the single best size-coding + procedural-JS resource. Creator of **LittleJS** (a dependency-free HTML5 engine listed at 4.2k GitHub stars as of August 6, 2026 — Force's own July 2026 post describes it "approach[ing] 4k stars" four years after release) and **ZzFX** (procedural sound, used in thousands of web games), Force has published 1,500+ tiny demos. Essential reads: the **"City In A Bottle – A 256 Byte Raycasting System"** deep dive (a full animated raycast cityscape in 256 bytes of canvas code, explained line by line; also covered by Simon Willison and on Hacker News), and **"Crafting a 13KB Game: The Story of Space Huggers"** (a procedurally-generated run-and-gun, the origin of LittleJS).

**Pico-8 / tweetcart / demoscene.** Even though Pico-8 uses Lua, the techniques translate 1:1 to canvas: trig modulation, plasma via nested `sin`, palette tables. Study the "PICO-8 Tweetcart Studies" (demobasics.pixienop.net/tweetcarts), svntax's "Trigonometry and Tweetcarts," and the kometbomb tweetjam gist. The core `_draw`-loop-of-math idea *is* your `render(t)` function.

**OneLoneCoder / javidx9** (github.com/OneLoneCoder; YouTube). His olcPixelGameEngine is C++, but the *pedagogy* — "who needs a framebuffer," building 3D projection, mazes, Perlin noise, and game loops from first principles — is exactly the mental model for procedural rendering, and much of it has been ported to JS.

**Belén Albeza** (belenalbeza.com) — "Retro, crisp pixel art in HTML 5 games" and its Phaser follow-up, plus the `belen-albeza/retro-canvas` GitHub demo — is the crispest short reference for the scaling/`image-rendering` technique.

**MDN** — "Crisp pixel art look with image-rendering," "Optimizing canvas," and the Transformations tutorial are the authoritative primary docs.

**Game feel** — Steve Swink's *Game Feel* (the book that named the field), Vlambeer's "The Art of Screenshake," and Jonasson/Purho's "Juice It or Lose It" are the three foundational texts; egmatic.com and gamejuice.co.uk maintain good technique catalogs.

**"Racing the Beam"** by Montfort & Bogost (MIT Press, 2009) is the definitive history of constraint-driven rendering and worth reading for philosophy.

### 6. AI-assisted workflow (the critical section)

AI coding agents are, empirically, very good at pure-JS canvas games and bad at *seeing* them — and the entire craft is engineering around that asymmetry. A well-regarded survey of Claude Code for game dev (Chier Hu, Medium, June 2026) concludes it "is at its best with code-first, text-serialized engines and web frameworks — … Three.js/Phaser/HTML5 Canvas," and that "the single best 'instant gratification' pairing is Claude Code + a browser/… stack." But the same survey warns it "struggles with … anything bottlenecked on bespoke visual assets, and tasks that require seeing the running game (game feel, balance, visual glitches)." Procedural canvas art sidesteps the *asset* weakness entirely — nothing to draw in an image editor — which is precisely why it pairs so well with agents.

**Principle 1 — Tell the agent to write code that draws, not to generate images.** This is the highest-leverage instruction. The dbinky "Claude-Generated Pixel Art Pipeline" (github.com/dbinky/claude-fairy-pixel-art) states it directly: "The key insight is asking Claude to write code that draws, not asking it to generate images. Claude is much better at writing precise pixel-placement code than it is at generating images through other means." Your APB car is a `drawCar()` function the model can *reason about and edit deterministically*, not an opaque PNG.

**Principle 2 — A style-guide file every draw function must obey.** The single most effective structure is a project memory file (`CLAUDE.md` for Claude Code; `.cursorrules` for Cursor; `.github/copilot-instructions.md` for Copilot) that encodes the non-negotiable visual rules. The dbinky project's `graphics-assets.md` "became the single source of truth for the entire art pipeline," defining a "color palette reference with hex codes for every … element," and its lessons-learned are directly reusable:
- **"Palette-by-name: Reference colors as 'rose_light' not '#FF9EAE'. Change a hex value once, everything updates."**
- **"Template + color substitution:"** shared body templates with per-variant color dictionaries — the code equivalent of NES palette swaps.
- **"Seeded randomness:"** generators use a seeded RNG "so the output is reproducible."
- **"Nearest-neighbor scaling:"** draw small, scale up with nearest-neighbor to preserve the pixel look.

The reason this works is well documented in the CLAUDE.md best-practices literature: without explicit constraints, agents "will add drop shadows, use arbitrary border-radius values, introduce new colors outside your palette, and apply animations you did not ask for" (925studios.co). For a pixel game, spell out: exact palette hexes as named constants, base sprite resolution (e.g., 16×16), outline rule (e.g., "every sprite has a 1px `#000` or dark-tint outline"), proportions, and forbidden techniques (no anti-aliasing, no gradients, integer coordinates only). Pixel-art-specific Claude skills already encode opinions like "anti-aliasing is usually wrong, readable silhouettes beat detail, fewer frames often animate better."

**Principle 3 — Close the screenshot feedback loop.** This is Anthropic's own documented recommendation. From Anthropic's "Claude Code: Best practices for agentic coding": "Claude performs best when it has a clear target to iterate against—a visual mock, a test case, or another kind of output." The prescribed loop:
> 1. Give Claude a way to take browser screenshots (e.g., with the Puppeteer MCP server … or manually copy / paste screenshots into Claude).
> 2. Give Claude a visual mock by copying / pasting or drag-dropping an image…
> 3. Ask Claude to implement the design in code, take screenshots of the result, and iterate until its result matches the mock.
> 4. Ask Claude to commit when you're satisfied.

And the payoff line: "Like humans, Claude's outputs tend to improve significantly with iteration. While the first version might be good, after 2-3 iterations it will typically look much better. Give Claude the tools to see its outputs for best results." The updated docs reframe this as "give Claude a check it can run," with a copy-paste prompt: *"[paste screenshot] implement this design. take a screenshot of the result and compare it to the original. list differences and fix them."* Anthropic's own product-design team reinforces the pattern: "Use Command+V to paste screenshots directly into Claude Code - it excels at reading designs and generating functional code."

A subtle but important point for **pure-canvas** games: the Playwright/Puppeteer-MCP advice that usually leans on the accessibility tree (structured DOM) is useless here — your entire game is one `<canvas>` element with no readable DOM. **Actual pixel screenshots are the only viable feedback signal.** Plan for a screenshot capture step (MCP, a Playwright sidecar such as the "Eyes"/"Playwright Sidecar" Claude skills, or manual paste) from day one.

**Principle 4 — Separate the builder from the critic.** For visual quality specifically, the strongest documented pattern is Matt Shumer's **"Gauntlet Loop"** ("How to Run a Gauntlet Loop," somethingbig.ai, July 27, 2026), demonstrated in his "Claude of Duty" project (a ~55,000-line Three.js/WebGL2 FPS across 11 subsystems; the repo hit 1,547 stars and 253 forks within three days, and Shumer's original demo post cited 3.8M views). The core rule: "The builder and critic should be separate agents. The builder has seen every decision it made … That makes it very good at explaining why its work is reasonable. You do not want reasonable. You want an independent judgment. Spawn a fresh critic … Do not give it the builder's history." The critic "should behave almost like an A/B tester. It looks at our output and the reference, without being told which is which," and "should inspect the actual thing: the real pixels." You give it "a real bar" — reference art from a game whose look you're targeting — and loop until the critic stops finding gaps. Anthropic's own docs endorse the same principle for code: "a reviewer running in a fresh subagent context … evaluates the result on its own terms," and "won't be biased toward code it just wrote." The project's concrete critic "non-negotiables" (e.g., "No flat/untextured surfaces … Nothing perfectly straight, clean, or repeated") are a template for how a style guide encodes rules a renderer must satisfy.

**Epistemic caution.** The critic pattern is powerful but not magic. In Claude of Duty's own logs, eleven independent critics scored the AAA-targeted result "3.59, then 4.14, then 4.05, then 5.05 out of ten," two shots reached "close," and in a blind A/B "every critic in every round picked the real Call of Duty frame." Critics can also be confidently wrong — the project's most valuable fix came from *contradicting* three rounds of critics who wrongly reported an "untextured" weapon that was actually specular-dominated. The lesson: treat "one prompt built a whole game" demos skeptically (EnterpriseDNA advises discounting one-shot demos by ~50%); the real value is the *human-designed, deterministic verification harness* (reproducible screenshots, pixel diffs), not agent autonomy.

**Real-world confirmations.** Multiple independent developers report the same shape of workflow. Grigory Sapunov's "How We Built a Full Browser Game in Two Evenings with Claude" (gonzoml.substack.com; the game "Grumbulus" is live at cloud-heavy-industries.com/grumbulus) describes ~15,000 lines of AI-written code across 21 JS files — "All vanilla JavaScript, no frameworks, no external assets. Every pixel drawn on HTML5 Canvas, every sound synthesized via Web Audio API." Claude "caught and fixed 18 integration bugs" before first play; the design had "fourteen pedestrian types with unique behaviors"; a boss failed to appear because of "a silent `if (pedManager.spawnBoss)` check that always returned false"; the economy was "adjusted five times." Most tellingly, drawing a Thor sprite took **six attempts** ("he was invisible, then headless, then the hammer was behind him, then lightning came from his elbow") — a vivid illustration of why the screenshot loop is mandatory for procedural sprites. The Linuxbeast postmortem ("How I Built 3 Browser Games in One Day With Claude AI") reports ~1,950 lines of vanilla JS, three games, "no dependencies, no transpilation, no build step," with "procedurally generated sound effects, no audio files to load," from someone who had "never built anything with HTML5 Canvas before." The Thirdbear "retro game generator" post even shows the meta-prompt pattern: "You develop HTML5 vanilla JS games … inspired by console games from the Atari, NES, and SNES eras."

### 7. Case studies

**A. "City In A Bottle" (Frank Force, 256 bytes).** A complete animated, raycast, procedurally-generated cityscape in 256 bytes of canvas JavaScript. Technique to steal: the entire "world" is implicit — buildings are derived from bitwise operations on coordinates, shading from distance fading, all inside one `setInterval` `for`-loop that both raycasts and does shadow bounces. It's the purest possible demonstration that geometry + math replaces assets. Force's line-by-line write-up is on frankforce.com.

**B. "Space Huggers" (Frank Force, js13k → LittleJS).** A run-and-gun roguelike with procedurally generated levels and a pixel-art style, built in 13 KB in pure JS, later open-sourced as the LittleJS engine. Steal: the architecture — a tiny object-oriented engine where sprites, particles, and physics are all code, plus ZzFX for procedural audio. It proves the approach scales from a tweet to a real game.

**C. js13kGames winners generally (e.g., "Path to Glory," "Harold is Heavy").** Because the 13,312-byte rule bans external assets, *every* entry is a case study in procedural or minimal-asset rendering. Steal: minification and code-organization patterns (a stripped-back reusable "engine" template, as several postmortems describe), and the discipline of designing small enough to polish. Source code for most winners is linked from their postmortems.

**D. "Grumbulus" / storm-cloud game (Sapunov, Claude-built).** A full arcade game — parallax city, 14 pedestrian types, particles, screen shake, procedural music — entirely code-drawn on canvas, built with Claude over two evenings. Steal: the *workflow* (design doc → parallel file generation → tight play-test loop) and the honest catalog of failure modes (sprites drawn wrong, silent dead-code flags, economy tuning) that show where human direction is irreplaceable.

### 8. Practical appendix — a Claude Code project structure

**Recommended layout:**
```
/game
  CLAUDE.md            # project memory: rules the agent must always follow
  style-guide.md       # the visual bible (palette, proportions, outline rules)
  index.html           # canvas element + CSS image-rendering: pixelated
  src/
    engine.js          # rAF loop, fixed timestep, input, screen shake
    pixel.js           # backbuffer, present(), palette, dithering, scanlines
    palette.js         # PAL = { name: '#hex', ... }  (single source of truth)
    sprites.js         # drawCar(ctx,x,y,t,pal), drawWalker(...), etc.
    particles.js       # generic particle system
    game.js            # state, spawning, collisions
  tools/
    screenshot.md      # how to capture the running canvas for the feedback loop
```

**`style-guide.md` pattern (the highest-value file):**
```md
# Visual style guide — draw functions MUST obey these
## Resolution
- Backbuffer 320x240, integer SCALE only. All coords via | 0.
## Palette (reference by NAME, never inline hex)
- bg #1a1c2c | ink #000000 | red #b13e53 | redHi #ef7d57
- steel #94b0c2 | tire #333c57 | glass #41a6f6
- (16 colors max — this is a fixed palette; do not introduce new colors)
## Sprite rules
- Base sprite box 16x16 unless noted.
- Every sprite has a 1px dark outline (ink or a darkened tint).
- No gradients. No anti-aliasing. No drop shadows. No blur.
- 2–3 shading levels per surface (base, highlight, shadow).
## Animation
- Time-driven only: pass `t`; use Math.sin(t*speed) for cycles.
- Walk cycle: legs anti-phase, body bob = abs(sin).
## Draw-function contract
- Signature: draw<Thing>(ctx, x, y, t, pal, state)
- Draw at local origin; caller does translate/rotate.
- Pure: no globals except PAL; no state mutation.
```

**Draw-function conventions:** one function per visual entity; consistent signature `(ctx, x, y, t, pal, state)`; draw at local origin and let the caller position; keep them pure so the agent (and the critic) can reason about them in isolation; put the palette in its own module and pass it in (enables instant palette swaps and reskins).

**Prompting with inspiration images:** paste a reference screenshot or mock (⌘V into Claude Code pastes images directly, as Anthropic's own design team notes) and instruct: *"Study this reference. Extract a fixed palette of ≤16 hex colors into palette.js. Then write drawCar() that reproduces this car's proportions and outline style at 16×28 px using only those palette names. Do not generate an image — write canvas code."* Then run the screenshot loop: render, screenshot, and prompt *"compare your output to the reference; list the differences and fix them,"* iterating 2–3 times.

**Iteration tips:**
- Build the pixel pipeline and one sprite first; verify crisp scaling before adding gameplay.
- Add "juice" (shake, particles, hit-flash) early — it's cheap and reveals feel problems.
- Keep a `tools/screenshot` path so the agent can *see* results; without it, procedural sprites drift (recall the six-attempt Thor).
- For quality passes, spin a fresh critic sub-agent with the style guide + a reference image and no build history; act on its diff, but sanity-check its claims (critics can be confidently wrong).
- Gate screen shake and flashing behind `prefers-reduced-motion`.
- Commit when a visual milestone looks right, so you can revert cleanly — starting over is often faster than un-breaking a bad visual change.

## Recommendations

1. **Start with the pipeline, not the game.** In your first Claude Code session, build only: backbuffer + `present()` with `imageSmoothingEnabled=false`, the CSS `image-rendering: pixelated`, `palette.js`, and one `drawCar()`. Confirm crisp integer scaling on a real monitor. *Threshold to proceed:* pixels are sharp at 3× and the car rotates cleanly via `save/translate/rotate`.
2. **Write `style-guide.md` and `CLAUDE.md` before generating sprites.** Encode the fixed ≤16-color palette (by name), base resolution, outline rule, and the "write code that draws, not images" mandate. *Benchmark that would change this:* if the agent keeps introducing off-palette colors or gradients, the style guide is too vague — add explicit "do not" rules.
3. **Stand up the screenshot loop immediately.** Wire a Puppeteer/Playwright screenshot step or a manual paste habit. *Threshold:* you can, in one message, get the agent to render → screenshot → self-critique → fix. Until this exists, expect procedural sprites to come out "headless" and stay that way.
4. **Adopt the fixed-timestep loop and offscreen caching from the start** — retrofitting them is painful. *Benchmark:* stable 60fps with the frame-time clamp in place; if you drop frames, profile draw-call count and cache the heaviest static layers before reaching for `OffscreenCanvas`/Workers.
5. **For polish, run a separate blind critic against reference art** (Gauntlet Loop). *Threshold to stop:* the critic can no longer name a concrete gap — but verify its specific claims, and don't chase a "AAA in one prompt" fantasy; the win is the disciplined harness, not autonomy.
6. **Study, in order:** Belén Albeza (crisp pixels) → MDN (optimization + transforms) → Gaffer (timestep) → a couple of js13k postmortems → Frank Force's "City In A Bottle" and "Space Huggers." That sequence takes you from pipeline to shipping mindset.

## Caveats

- **AI hype vs. reality.** Marketing-grade claims like "40–60% time reduction" or one-prompt AAA games trace to vendor/SEO blogs and one-shot demos, not controlled studies; treat them skeptically. The documented reality is fast *prototyping* with heavy human direction on feel, balance, and visual correctness.
- **Agents can't see well.** Every reliable account (six-attempt Thor; "tasks that require seeing the running game" as a weak spot) confirms that without a screenshot loop, procedural visuals degrade silently. This is the single biggest failure mode.
- **Some sources are secondary or promotional.** Several Claude-Code-for-games write-ups cited here are agency/vendor blogs; I've leaned on primary sources (Anthropic docs, MDN, named developer postmortems, Frank Force's own write-ups, Shumer's own essay/repo) where it matters, and flagged the promotional ones.
- **Techniques translate, engines don't.** Pico-8 (Lua) and olcPixelGameEngine (C++) are cited for *technique*; you'll port the ideas (trig modulation, palette tables, framebuffer discipline) to JS canvas, not the code.
- **Accessibility.** Scanline flicker, screen shake, and hit-flashes can trigger motion sickness or photosensitivity; gate them behind `prefers-reduced-motion` and keep flash frequencies conservative.
- **Currency of AI tooling.** Specific tool names, MCP servers, and Claude Code features evolve quickly; verify the exact screenshot/MCP mechanism against current docs when you build.