# Hot Slice

A 16-bit top-down pizza delivery arcade game. Drive fast, because the tip shrinks every second you take —
but speed wrecks your aim and attracts the police. The sat-nav is not on your side.

Built in one session as a Sunday one-shot challenge. **Zero dependencies**: no framework, no libraries, no
image, font, or audio files. The city, every sprite, the bitmap font, and all the audio are generated
procedurally at boot. The whole game is one self-contained ~124 KB HTML file.

**Play:** open `hot-slice.html` — or [play it here](https://claude.ai/code/artifact/b818a61d-e6b2-4d3e-bf72-48c8295deeb8).

## Controls

| | |
|---|---|
| `W A S D` / arrows | Drive |
| `Shift` | Handbrake |
| Mouse | Aim the toss |
| Click / `Space` | Throw the pizza |
| `P` · `M` · `N` | Pause · mute · music |

Land it on the porch to deliver; land it on the doorstep for a **perfect toss** bonus. Miss and the pizza
splatters on the pavement — and it still costs you one from your bag of three. Run out and you're driving
back to the shop while the tip keeps draining.

## How it plays

- **The tip decays.** $15.00 down to a $2.00 floor at 55¢/sec. It's the loudest thing on screen for a reason.
- **The SLICE-NAV 2000** gives turn-by-turn directions over a green LCD, paints the route on the tarmac, and
  falls apart into `RECALCULATING` the moment you cut across someone's lawn.
- **Heat.** Clip pedestrians or drive on the pavement and a siren comes looking for you.
- Each delivery buys more time on the shift clock. Bank as much as you can before it runs out.

`?seed=<number>` on the URL generates a different city, deterministically.

## Development

```bash
node build.mjs           # bundle src/*.js -> hot-slice.html (ship) + index.html (dev)
node serve.mjs           # dev server on http://localhost:8123
node test/headless.mjs   # test suite — runs the real game logic against a stub canvas
```

`src/*.js` are plain scripts concatenated in filename order, so the numeric prefix is the load order.
`hot-slice.html` and `index.html` are generated — edit `src/` and `shell.html`, then rebuild.

## Docs

- **`CLAUDE.md`** — architecture: coordinate systems, the baked ground layer, the y-sorted render pass,
  traffic lane rules, and the invariants that keep every address winnable.
- **`JOURNAL.md`** — the original brief, why each design call was made (and which alternatives were
  rejected), the bugs that mattered, and the build order to repeat it.
- **`GAME-SPEC-GUIDE.md`** — how to brief a game like this one so it can be built in a single pass.
