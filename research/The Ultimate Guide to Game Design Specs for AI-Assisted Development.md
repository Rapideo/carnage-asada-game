# The Ultimate Guide to Game Design Specs for AI-Assisted Development

*A companion to the procedural-canvas art guide — this one covers the design layer that sits above the art layer: how to specify, structure, and communicate the KIND of game you want Claude Code to build.*

## TL;DR

- **The single highest-leverage move is spec-driven design: write a short, layered set of Markdown docs — a lean `CLAUDE.md` for always-loaded rules, plus on-demand design docs (`GAME_DESIGN.md`, `economy.md`, `minigames.md`) — and define the core loop, verbs, and reference games *before* any code.** Real AI-built browser games (e.g. "Grumbulus," described by its author as "~15,000 lines of vanilla JavaScript, 25 files, no frameworks… 0 build steps: open index.html and it works") confirm that genre/reference anchoring plus a play→feedback→fix loop beats both vague "make a game" prompts and exhaustive upfront specs.
- **Communicate FEEL and intent, not just features.** The most productive prompts describe emotional targets and problems ("frost feels too weak," "power-ups should feel powerful") rather than dictating numbers; balance is iteration, not math, and you tune economies/spawn rates/difficulty through repeated play with the agent, ideally with logging/telemetry from day one.
- **Phase the build.** Concept one-pager → core-loop prototype → vertical slice → systems expansion, using Claude Code's plan mode, a `plan.md`/TODO file, and milestone-scoped sessions. Keep balance numbers in data files (JSON), never hardcoded, and keep `CLAUDE.md` short and distilled.

## Key Findings

1. **Spec-driven development (SDD) has matured into the dominant discipline for AI coding agents in 2025–2026**, formalized by GitHub Spec Kit, Amazon Kiro, and others. The pattern is: describe *what* and *why* first (spec), derive a *plan*, break into *tasks*, then implement. This applies cleanly to games if you treat the game design document as the "what/why" layer.
2. **The classic 100-page GDD is dead for this workflow; the living, layered doc has replaced it.** Best practice is a one-page concept doc that grows incrementally, with per-system files split out only when a system gets complex.
3. **Genre vocabulary and reference-game anchoring dramatically raise output quality.** "This is a life-sim where the player runs a Mexican fast-food restaurant, like Diner Dash meets Stardew Valley, with WarioWare-style mini-games embedded as the cooking stations" gives the agent far more usable signal than a feature list.
4. **The most valuable design communication is about feel.** Developers repeatedly find that describing the *problem or emotion* ("this feels weak/slow/boring") produces better AI fixes than prescribing the mechanical change.
5. **Balance is an iterative, playtested loop — not something you can fully specify up front.** Keep tunable values in data, add telemetry/logging early, and consider using the agent (or an LLM agent) as an automated playtester.
6. **`CLAUDE.md` should hold always-loaded rules and only the design context that affects architecture; the full GDD lives in separate, referenced files.** Nobody who does this well puts the whole GDD in `CLAUDE.md`.

## Details

### 1. Communicating game TYPE / genre to an AI agent

**Why precise genre language matters.** An AI coding agent is, as GitHub describes it, a literal-minded pair programmer that excels at pattern recognition but still needs unambiguous instructions. Genre words are compression: "roguelike" implies procedural runs, permadeath, meta-progression; "life sim" implies needs/stats, a time system, relationships. Naming the genre correctly loads a huge amount of correct default structure into the agent's head. Vague requests ("make a good game," "make a racing game") are the number-one documented failure mode; specificity about genre, core verbs, and constraints is the fix.

**The techniques that work, in rough order of leverage:**

- **Core-loop-first descriptions.** Every strong GDD guide agrees: define what the player does over and over, as a short verb chain, *before* anything else. Examples: `explore → fight → loot → upgrade → repeat`; for the restaurant sim, `take order → cook (mini-game) → serve → earn → upgrade → repeat`; for the driving game, `accept job → chase/evade → deliver → bank reward → escalate heat`. Nail this first because every later decision hangs off it.

- **Reference-game anchoring ("like X meets Y").** This is the single most efficient way to transfer aesthetic and mechanical intent. Real Claude prompts that produced good games lean on this heavily — one widely-shared Opus space-RTS prompt worked precisely because "only the reference game and the closing paragraph changed" between genres. For your three projects:
  - Driving game: *"like APB's cops-and-robbers open world meets Crazy Taxi's arcade urgency meets Retro City Rampage's 16-bit top-down look."*
  - Restaurant sim: *"like Diner Dash's service rush meets Stardew Valley's daily-loop life-sim, with Yakuza/WarioWare-style embedded arcade mini-games at each station."*
  - Narrative adventure: *"like a 16-bit LucasArts point-and-click meets Oxenfree's naturalistic branching dialogue."*

- **Verb / mechanics lists.** After the loop and references, enumerate the concrete player verbs (drive, boost, ram, evade, drift; or take-order, chop, fry, plate, upsell). Verbs map almost one-to-one to input handlers and system code, so this is the most directly implementable layer.

- **The MDA framework (Mechanics-Dynamics-Aesthetics).** MDA was published as Hunicke, LeBlanc & Zubek (2004), "MDA: A Formal Approach to Game Design and Game Research" (Proceedings of the AAAI Workshop on Challenges in Game AI), and was "developed and taught as part of the Game Design and Tuning Workshop at the Game Developers Conference, San Jose 2001–2004." It's a genuinely useful scaffold for a design doc because it separates the three levels the agent must not conflate: *Mechanics* (rules, data, algorithms — what you spec precisely), *Dynamics* (runtime behavior emerging from mechanics + player input — what you playtest for), and *Aesthetics* (the desired emotional response — what you describe as your feel target). Crucially, the designer works M→D→A while the player experiences A→D→M; writing your doc so it states the target Aesthetic first, then the Mechanics that should produce it, gives the agent both the "why" and the "what."

- **Genre-specification prompt pattern (reusable):**
  > *"This is a **[genre]** where the player **[core verb loop]**. Reference games: **[X, Y, Z]** — specifically, take **[element]** from X and **[element]** from Y. The feel target is **[emotional adjectives / pacing]**. Core verbs: **[list]**. Win condition: **[…]**. Lose/fail condition: **[…]**. Session length: **[…]**. It must run in the browser in pure JS on Canvas with procedural art, per style-guide.md."*

### 2. Game design documents for AI-assisted development

**The SDD lineage.** GitHub Spec Kit and Amazon Kiro both formalize the same multi-artifact structure that maps perfectly onto games. Spec Kit's `specify` CLI runs a staged pipeline with a preceding "constitution" step: `/speckit.constitution`, `/speckit.specify`, `/speckit.plan`, and `/speckit.tasks` create `constitution.md`, `spec.md`, `plan.md`, and `tasks.md`, and `/speckit.implement` builds from them. Kiro's three files map onto games as:
- **`requirements.md`** — Kiro uses EARS notation ("Easy Approach to Requirements Syntax," a method originally developed at Rolls-Royce), structured as "WHEN [condition] THE SYSTEM SHALL [behavior]," which is ideal for game rules: *"WHEN the player's energy reaches 0 THE SYSTEM SHALL end the workday and advance to the next morning."*
- **`design.md`** — architecture, data models, scene/state diagrams.
- **`tasks.md`** — discrete, trackable implementation steps.

Kiro stores these under `.kiro/specs/[feature-name]/`. You don't need Kiro to use the pattern — Claude Code plan mode plus three Markdown files does the same job.

**One-page vs. comprehensive.** The consensus across game-design sources and AI-agent practitioners converges on the same rule: **start with a one-page concept/core-loop doc, validate it by prototyping, then expand incrementally.** Writing a full GDD before you've validated the core mechanic is premature; a static, bloated document is one "no one (including you) wants to read." The living-document principle is doubly important with agents because the spec is the ground truth the agent re-reads.

**What level of detail helps vs. hurts the agent.** This is the most important and most counter-intuitive finding, and it's well-documented from real builds:
- **Helps:** clear core loop, explicit win/lose conditions, an enumerated verb/mechanics list, a data-driven schema for content (enemy types, upgrades), and a fixed file structure. Heavy upfront design was genuinely useful for establishing *architecture and file structure*.
- **Hurts:** over-specifying balance numbers (they need playtesting), and specifying content in prose the agent then silently fails to wire up. In the Grumbulus build, the developer reported verbatim: "We defined 15 pedestrian behavior flags that were never checked anywhere. The data said riot police block hail. The code didn't care. Every flag needs a corresponding check." Bosses "were in the design but never actually implemented." The lesson: **data-driven designs need code audits**, and every specced flag needs a verified corresponding code check.

**A GDD-for-agents should contain:** core loop; design pillars (3–5) and explicit non-goals; player fantasy / feel target; mechanics & verbs; progression & economy (as data, with a note that values are tuning targets not law); difficulty curve; win/lose conditions; screen/scene flow; input mapping; and a cross-reference to `style-guide.md` and `palette.js` for the art layer.

### 3. Project / folder structure for a Claude Code game project

The clearest real-world pattern, corroborated across public repos and practitioner write-ups:

```
my-game/
├── index.html                 # 0 build steps: open and it runs
├── CLAUDE.md                  # ALWAYS-LOADED rules (keep < ~200 lines)
├── GETTING_STARTED.md         # human-facing setup
├── docs/
│   ├── GAME_DESIGN.md         # the living GDD (core loop, pillars, feel)
│   └── design/
│       ├── economy.md         # split out when a system gets complex
│       ├── minigames.md
│       ├── characters.md
│       └── progression.md
├── style-guide.md             # ART layer (from the companion guide)
├── palette.js
├── .claude/
│   ├── skills/                # SKILL.md workflows (invoked on demand)
│   ├── commands/              # slash commands
│   └── plans/                 # plan-mode artifacts
├── src/
│   ├── core/                  # game loop, state machine, input
│   │   └── CLAUDE.md          # local conventions for this folder
│   ├── systems/               # economy, spawns, waves, scheduling
│   ├── scenes/                # attract, menu, play, minigames
│   ├── entities/              # draw-functions + behavior
│   └── audio/                 # Web Audio synthesis
└── data/
    └── balance.json           # all tunable numbers live here
```

**The division of labor that works:**
- **`CLAUDE.md` (always loaded)** = tech stack, architecture/invariants, coding conventions, folder map, commands, "what NOT to do," and *only the design context that affects architecture* — the core loop summary, key systems list, and the hard rule "NEVER hardcode balance numbers; all balance lives in `data/balance.json`." Keep it short; the widely-cited guidance is to keep it skimmable (under ~200 lines) because everything in it consumes context every session. As the Grumbulus dev noted, a bloated `CLAUDE.md` "is not always helpful," and he mused he might "need to distill the file into a smaller set of rules."
- **Design docs (`docs/`, referenced on demand)** = the full GDD, per-system detail, economy formulas, dialogue trees, level layouts. `CLAUDE.md` should *point to* these ("for balance detail see docs/design/economy.md; don't invent numbers"), not contain them. The Mr. Phil Games CLAUDE.md-for-games template states this explicitly: the design section of `CLAUDE.md` should be "not the full GDD — just what affects architecture decisions," with sub-sections for Core Loop, Key Systems, and Balance Constants.
- **Skills (`.claude/skills/*/SKILL.md`)** = repeatable procedures (e.g. "add a new mini-game," "add a new enemy type," "run a balance-audit checklist"), applied automatically when relevant or invoked directly.
- **Per-directory `CLAUDE.md` files** — Claude Code reads the nearest `CLAUDE.md` up the tree, deeper files winning, so `src/systems/CLAUDE.md` can hold economy-specific conventions without bloating the root.

**When to split design docs per system:** split when a section stops fitting on a screen or when a system has its own vocabulary and rules (economy, mini-games, characters/relationships, dialogue). Until then, keep it in one `GAME_DESIGN.md`.

**Real repos to study:** The *World of ClaudeCraft* public repo shows the cleanest committed doc structure: root `CLAUDE.md` (rules/invariants) + `docs/design/` + `docs/prd/` + per-directory `CLAUDE.md` files + `.claude/skills/` and `.claude/agents/`; the root file explicitly defers balance detail to design docs ("Don't invent balance numbers. Gameplay math follows real classic-era MMO formulas… see README.md and docs/design/"). The Grumbulus devlog is the closest real vanilla-JS/Canvas match (25 files, all procedural, Web Audio, hosted on Cloudflare Pages with PostHog analytics). Template/scaffold repos (Claude-Code-Game-Studios with a `design/` folder for GDDs, gstack-game auditing a `docs/gdd.md` against an 8-section standard) are useful checklists even if you don't adopt the full frameworks.

### 4. Specifying game FEEL and design intent, not just features

**Say what's wrong, not how to fix it.** The strongest and most repeated lesson from real AI game builds: describe the *problem or feeling*, let the agent design the fix. "Frost feels too weak" led the agent to invent shatter chains, area damage, and freeze combos; "increase frost damage by 20%" would only have bumped a number. "Power-ups feel weak" led to a whole "unlimited everything for 12 seconds" philosophy. This is exactly the MDA insight in practice: you specify the target Aesthetic, the agent explores Mechanics to hit it.

**How to communicate feel in a doc:**
- **Player fantasy / emotional target** — one sentence: "you are a god of the storm," "you're a frazzled line cook barely keeping up," "you're a detective piecing together a quiet tragedy."
- **Pacing** — session length, tension curve, "quarter-muncher" spike vs. cozy drift. Arcade sessions are typically designed to run ~3–5 minutes with difficulty ramping to challenge experts by that mark.
- **Juice expectations** — juice is the non-functional feedback layer (screen shake, hit-stop, particles, sound) that, per designer Lisa Brown's oft-quoted framing, means "picking a feeling that your game should communicate and juicing *that* feeling." Spec it as intent ("impacts should feel crunchy; every serve should pop") and cross-reference the art guide's draw-function conventions.
- **Tone** — humor, melancholy, adrenaline. The Grumbulus dev found that giving pedestrians funny dialogue "transformed the game… stopped being a score-chaser and became something people wanted to show friends" — personality is a design lever worth speccing.

**Playtesting loops with the agent.**
- **Human-in-the-loop (the practical default):** you play, you report feel problems, the agent fixes. Cycles of 2–5 minutes. Add analytics/logging *early* — the Grumbulus team regretted adding PostHog late, noting it "would have been useful earlier to see where players actually die, which power-ups they collect."
- **Agent-as-playtester (emerging):** LLM agents are increasingly viable automated testers; research shows LLM-agent difficulty ratings correlate with human ratings even when raw skill lags (e.g., in Wordle a Pearson correlation of r=0.624 between LLM and human average guesses), and multi-agent systems can simulate many runs to surface balance issues and first-player advantages. For a browser game, you can have Claude Code write a headless simulation harness that plays the core loop thousands of times and logs win rates, average score, and death locations — then tune from that data.

**Iterating on balance.** Treat it as iteration, not math. Keep every tunable in `data/balance.json`; ask the agent to expose spawn rates, costs, and difficulty as data; then run play sessions and adjust. Expect to change key numbers many times — as the Grumbulus dev put it, "Balance is iteration, not math. Storm Points changed five times (and may change more). Frost damage changed three times."

### 5. Design patterns for specific genres (and how to spec each)

**(a) Arcade action (your APB-style driving game).**
- **Structure:** wave/level escalation, a defined scoring formula shown to the player, a lives/continues system, and an attract mode (title → high-score table → gameplay demo, the classic loop that also solved score-display for competition). Spec whether continues reset the score (pure skill-contest) or not.
- **Difficulty:** start easy, escalate fast; deaths must be legible ("the player must understand why they died"), never random. Design a "wave-like" difficulty curve with cooldown periods after peaks, not a monotonic ramp. Late game needs *variety* (mutators, bounties, boss variety), not just higher numbers — the Grumbulus postmortem is explicit: "Late game needs variety, not just difficulty."
- **How to spec it:** a `waves.md` table (wave #, spawn composition, speed multiplier, special modifiers), a scoring section with the exact formula and combo/multiplier rules, and a lives/continue policy. EARS works well: "WHEN the player completes wave N THE SYSTEM SHALL increase spawn rate by X and, every 5 waves, apply a random mutator."

**(b) Life simulation (your Mexican fast-food restaurant).**
- **Core systems:** a **needs/stats** model (money, energy, reputation, customer patience) that deplete/replenish over time and penalize neglect; a **time system** (the day split into chunks/time-slots, most actions consuming a chunk — the pattern real life-sim devlogs adopt when moving from linear to sim structure); **relationships** (regulars, staff — track meaningful outcomes, not raw interactions); and **event scheduling** (random and triggered events, where triggering one can temporarily disable others).
- **Embedding mini-games (the key pattern for your project):** this is the WarioWare / Yakuza "Club Sega" model — the sim is a *wrapper/hub* and each station (grill, fryer, register, salsa bar) launches a self-contained micro-game. WarioWare's microgames are the reference: a one/two-word prompt ("Flip!", "Eat!"), one action, a few seconds, escalating speed, with a shared lives system across the gauntlet (WarioWare: Mega Microgames! deducts one of four lives per failed microgame). Spec the *contract* between wrapper and mini-game explicitly: what the sim passes in (difficulty level, time budget), what the mini-game returns (success/score/quality), and how that result feeds the sim's economy (better cook result → happier customer → more money/reputation).
- **How to spec it:** split into `needs.md`, `time.md`, `relationships.md`, `minigames.md`. In `minigames.md`, define each micro-game as {trigger station, prompt, verb, duration, difficulty scaling, success→reward mapping}. Give the wrapper↔mini-game interface as a tiny API so the agent builds them as pluggable modules.

**(c) Narrative adventure.**
- **Core systems:** dialogue trees, **state flags**, and a scene graph. The critical best-practice (which prevents the agent building an unmaintainable tangle): **don't encode game state in the tree structure — keep the tree flat and gate nodes on external flags.** Track *meaningful outcomes* ("player_was_rude") not every raw choice — as one branching-narrative guide puts it, that's "one flag, not twelve." Use logic-gate/condition nodes ("if reputation > threshold") and avoid soft-locks by gating progression info behind story progress, not missable choices. Avoid fake choices where all options converge (the "illusion of agency" pitfall).
- **How to spec it:** a `dialogue.md` describing the flag schema (name, type, set-by, read-by), a scene-graph doc listing scenes and transitions, and per-conversation node tables. This maps naturally to data files the agent can load and a small finite-state machine.

### 6. Workflow: from idea to spec to build

**Recommended sequence:**
1. **Concept one-pager** — genre, references, core loop, feel target, win/lose, one screen mockup described in prose. (See appendix template.)
2. **Core-loop prototype** — in plan mode, have the agent build *only* the loop: one screen, one level, real input, minimal audio feedback. This is the vertical-slice discipline — one complete loop proving the experience — applied at micro scale. Believe the evidence it gives you before expanding.
3. **Vertical slice** — one fully polished representative chunk (one restaurant day with two working mini-games; one driving job with heat/escape). Cut scope *after* the slice, because now you know which systems were harder than expected.
4. **Systems expansion** — add waves/stations/scenes, economy depth, progression, attract mode, save system.

**Phasing Claude Code sessions:**
- **Plan mode first.** Claude Code's plan mode runs a read-only explore→design→review→plan flow and writes a plan file (by default under `~/.claude/plans/`) before touching code; the practitioner rule is "before executing any task that touches more than 3 files, produce a plan and wait for approval." For large work, ask it to plan *in phases*, one phase per concern, approving each.
- **Use a `plan.md` / TODO file.** Have the agent write architecture + a phased, atomic todo list to `plan.md`; if brainstorming consumes more than ~1/3 of context, save `plan.md` and restart the session fresh. Convert the plan into Claude Code's task tracker and work step by step. Add "check the todo list before starting each step" to `CLAUDE.md` if the agent skips it.
- **Milestone-scoped sessions.** Size each session to a phase; clear context between phases.

**Managing scope creep.** The eternal indie killer. Define the core loop and *perfect that* before secondary features; prefer a polished vertical slice over a broad shallow one; "learn to kill your darlings." With an agent this is *more* dangerous, not less, because the agent will enthusiastically build whatever you suggest — Grumbulus grew from "add power-ups" into 12 power-ups with a 5-slot inventory, 35 achievements, and a secret Norse-god combo (combine X + X + Y and Thor descends). Use explicit non-goals in the GDD and a "parking lot" doc for post-slice ideas.

**When to let the agent design vs. dictate.** Let the agent design *breadth and invention* within a system ("add power-ups" → it designs a good set); dictate *the core loop, the pillars, the feel target, and the non-negotiable constraints* (pure JS, procedural art, no external assets). The documented sweet spot: "let it be creative" on content, but own every creative *vision* decision yourself.

### 7. Real-world examples and postmortems

- **Grumbulus (Gonzo ML / Grigory Sapunov, Mar 2026).** The best-documented vanilla-JS/Canvas AI-built game: "~15,000 lines of vanilla JavaScript, 25 files, no frameworks," all procedural art + Web Audio, "0 build steps: open index.html and it works." Claude generated the design (originally a file structure for 21 JS files) from a one-line concept, then the human directed via a play→feedback→fix loop of 2–5 minute cycles. Key lessons, quoted: "Play early, play often. The game design doc was impressive on paper, but dozens of bugs and missing features only surfaced by actually playing. The play→feedback→fix loop was 10x more productive than trying to spec everything upfront." Also: say what's wrong not how to fix it; data-driven designs need code audits; balance is iteration; personality makes the game; late game needs variety; add analytics from day one.
- **Mr. Phil Games (Philip Ludington) — "Stellar Throne" workflow & CLAUDE.md-for-games template.** The most explicit public breakdown of the GDD-vs-`CLAUDE.md` division: `CLAUDE.md` holds rules + only the design context that affects architecture (core loop, key systems, balance constants), with the full GDD separate; larger projects use `.claude/combat.md`, `.claude/ui.md`, `.claude/economy.md`. Lessons: "Claude co-wrote the Game Design Document… probably the most complete and thoughtful GDD I've ever produced"; "Claude is great at broad strokes… but it sometimes stumbles on small, specific details"; "Every minute you spend on CLAUDE.md saves ten minutes of correcting AI-generated code"; start small and grow it; "NEVER hardcode balance numbers"; "Don't confuse reasonable with correct."
- **World of ClaudeCraft (public repo).** A browser micro-MMO with the cleanest committed doc structure: root `CLAUDE.md` (rules/invariants) + `docs/design/` + `docs/prd/` + per-directory `CLAUDE.md` files + `.claude/skills/` and `.claude/agents/`; the root file explicitly defers balance detail to design docs.
- **Template/tooling repos** — Claude-Code-Game-Studios (multi-agent studio scaffold with a `design/` folder for "GDDs, narrative docs, level designs") and gstack-game (a skill that audits a `docs/gdd.md` against an 8-section standard: core loop, systems, progression, economy, player motivation, etc.). Useful as checklists even if you don't adopt the full frameworks.

### 8. Practical appendix — reusable templates

**(a) `GAME_DESIGN.md` template — arcade game with embedded mini-games (fits the restaurant sim):**

```markdown
# GAME_DESIGN.md — [Working Title]

## 1. Concept (one paragraph)
[Genre] where the player [core verb loop]. Like [X] meets [Y].
Feel target: [emotional adjectives].

## 2. Design Pillars (3–5)
- Pillar 1 (e.g., "controlled chaos — always slightly overwhelmed")
- Pillar 2
## Non-Goals (explicit)
- No [feature we are deliberately NOT building]

## 3. Core Loop
[take order → cook (mini-game) → serve → earn → upgrade → repeat]

## 4. Player Fantasy & Tone
[One sentence + tone notes]

## 5. Verbs / Mechanics
- [verb]: [what it does, input]

## 6. Screen / Scene Flow
attract → menu → day-start → service (hub) → [station mini-games] → day-end summary → shop → next day
(also: pause, game-over)

## 7. Mini-Game Contract
Wrapper passes: { station, difficulty, timeBudget }
Mini-game returns: { success, score, quality }
Result mapping: quality → customer happiness → money + reputation
### Mini-games
- Grill: prompt "FLIP!", verb=timing tap, duration 5s, scales with day #
- Register: prompt "CHANGE!", verb=arithmetic, ...

## 8. Economy & Progression  (values are TUNING TARGETS; live in data/balance.json)
- Currencies: money, reputation
- Costs: [upgrade → cost]
- Progression: new stations/recipes unlock at reputation thresholds

## 9. Difficulty Curve
Days ramp: customer volume + patience decay + mini-game speed.
Wave-like: busy lunch rush → calmer afternoon.

## 10. Win / Lose Conditions
Win: [e.g., hit revenue goal / survive N days]
Lose: [e.g., reputation hits 0 / bankrupt]

## 11. Input Mapping
[key → action]

## 12. Art & Audio Cross-Reference
Visuals per ./style-guide.md and ./palette.js (procedural Canvas, no image assets).
Draw-function conventions per style-guide.md §[x]. Audio: Web Audio synthesis only.
```

**(b) Genre-specification prompt pattern:**
> *"This is a **[genre]** where the player **[core verb loop]**. Reference games: **[X, Y, Z]** — take **[element]** from X and **[element]** from Y. The feel target is **[adjectives + pacing]**. Core verbs: **[list]**. Progression: **[…]**. Win: **[…]**. Lose: **[…]**. Session length: **[…]**. Constraints: pure JavaScript, HTML5 Canvas, procedural art per style-guide.md, Web Audio synthesis, no external assets, 0 build steps. Before writing code, read GAME_DESIGN.md and produce a phased plan; wait for my approval."*

**(c) Phased build plan template (`plan.md`) for Claude Code sessions:**

```markdown
# plan.md — [Title]

## Architecture
- Vanilla JS, Canvas, module structure per CLAUDE.md
- State machine: attract → menu → play → …
- Balance in data/balance.json

## Phase 1 — Core loop (vertical slice)
- [ ] Game loop + fixed timestep
- [ ] One playable screen + input
- [ ] The single core-loop verb chain end to end
- [ ] Minimal HUD + one sound
  ↳ APPROVAL GATE: does the loop feel right?

## Phase 2 — One full slice
- [ ] One complete day / job / scene, fully polished
- [ ] One embedded mini-game with the wrapper contract
  ↳ APPROVAL GATE: cut scope now based on what was hard

## Phase 3 — Systems expansion
- [ ] Economy + progression from balance.json
- [ ] Waves / stations / scenes
- [ ] Attract mode + high scores + save

## Phase 4 — Juice & balance
- [ ] Screen shake / particles / hit-stop per style-guide.md
- [ ] Telemetry logging (deaths, economy, choices)
- [ ] Balance-tuning passes from playtest data
```

**(d) How design docs and the art style-guide cross-reference each other:**
- **In `CLAUDE.md`:** one line each — "Design: see docs/GAME_DESIGN.md (+ docs/design/*). Art: see style-guide.md + palette.js. Never invent balance numbers; never add image assets."
- **In `GAME_DESIGN.md`:** each entity/scene names its visual authority ("the grill mini-game uses the kitchen palette in palette.js; sizzle particles per style-guide.md juice conventions"). Design owns *what and why*; the style-guide owns *how it looks*.
- **In `style-guide.md`:** reference back to the design doc for context ("draw functions for enemy types enumerated in docs/design/characters.md").
- **Keep the boundary clean:** design docs never hardcode hex colors or pixel dimensions (that's the palette/style-guide's job); the style-guide never defines mechanics. Both are referenced on demand; only the thin rules live in `CLAUDE.md`.

## Recommendations

1. **Start every project with a one-page `GAME_DESIGN.md` and a lean `CLAUDE.md`, in that order.** Put the core loop, 3–5 pillars, explicit non-goals, reference games, and feel target on the page. Do *not* write a 20-page GDD up front. Threshold to expand: only split out `economy.md`/`minigames.md`/`characters.md` when a section outgrows a screen.
2. **Anchor genre with references and lead with the core loop verb chain.** Use the appendix prompt pattern verbatim. If the agent's first build feels generically wrong, your reference anchoring or feel target was too thin — add a second reference game and a sharper emotional adjective before adding features.
3. **Put every tunable number in `data/balance.json` from day one and forbid hardcoding in `CLAUDE.md`.** This is the single change that makes iterative balancing possible. Benchmark: if you ever find yourself asking the agent to "change the number in the code," stop and move that value to data.
4. **Build in phases with plan mode and approval gates; prototype the core loop before anything else.** Don't let the agent build breadth until the loop feels right. Cut scope after the vertical slice, not before.
5. **Communicate feel, not fixes.** When something's off, describe the *feeling* and let the agent design the solution; reserve exact numbers for final polish tuning.
6. **Add logging/telemetry early and use the agent as a playtester.** Have Claude Code build a headless simulation harness for the core loop and tune from win-rate/death-location data; escalate to more elaborate telemetry (e.g., PostHog) once the game is playable.
7. **Run a "code audit" pass whenever you add data-driven content.** Every specced flag/behavior needs a verified code path — ask the agent explicitly to check that each data field is actually read and used, to avoid "ghost" features that exist only in the doc.
8. **Guard scope with explicit non-goals and a parking-lot doc.** Because the agent will build anything you suggest, discipline has to live in the documents.

**Thresholds that change the plan:** if `CLAUDE.md` exceeds ~200 lines, distill it and move detail into referenced docs. If a session's context exceeds ~1/3 used during planning, write `plan.md` and restart. If the core-loop prototype isn't fun after a few iterations, fix the loop or the references — do *not* proceed to systems expansion.

## Caveats

- **Recency and hype.** SDD tooling (Spec Kit, Kiro) and Claude Code features are evolving fast (2025–2026); specific commands, plan-mode internals, and skill mechanics may have changed since the sources cited. Treat tool-specific details as directional and verify against current docs.
- **Vendor/marketing sources.** Several "prompt-to-game" and AI-testing claims come from vendor marketing (e.g., "millions of scenarios," "90% faster") and should be read skeptically; the load-bearing evidence here is from named practitioner devlogs (Grumbulus, Mr. Phil Games) and public repos, not vendor benchmarks.
- **Agent-as-playtester is still emerging.** LLM playtesting research is promising but shows LLM agents' raw skill lags humans even when their *difficulty rankings* correlate; use them to surface balance signals and crashes, not as a full substitute for human feel judgment.
- **Genre coverage.** The genre patterns here are tuned to your three project types (arcade action, life sim with embedded mini-games, narrative adventure). Roguelike, puzzle, and strategy specifics differ and would need their own system docs.
- **The counter-intuitive core finding bears repeating:** more upfront design detail is *not* strictly better. It helps for architecture and structure but hurts for balance and can create features that exist only on paper. The reliable pattern is a lean spec plus a tight play→feedback→fix loop.