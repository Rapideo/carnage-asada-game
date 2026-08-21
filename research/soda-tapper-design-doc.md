# OVERFLOW! — A Single-Lane Tapper Reimagining

*Working title. Alternates: "Fountain Frenzy," "Pour Decisions," "Soda Jerk."*

**Elevator pitch:** Tapper collapsed into one lane. All of the original's spatial multitasking is traded for temporal precision — every cup is a hold-to-fill skill check with foam physics, and the chaos comes from queue management, commitment cost, and a fountain machine that degrades as your shift wears on.

---

## 1. Design Pillars

1. **The pour is the verb.** In Tapper, serving is instant and movement is the skill. Here, serving *takes time* and stopping at the right moment is the skill. Everything in the game exists to make a 0.5–4 second pour feel tense.
2. **Depth replaces breadth.** One lane means difficulty must come from timing windows, queue reading, and commitment decisions — never from splitting attention across screens.
3. **Chaos you can blame yourself for.** Every flood, foam-over, and pileup should trace back to a decision the player made (started the jug too early, skipped the lid, ignored the sputter warning). Randomness creates situations; it never directly causes failure.
4. **Escalation through success.** Like Tapper, doing well makes the game faster. The rush meter is both your multiplier and your doom.

---

## 2. Core Loop

```
Ticket appears → read cup size + drink + modifiers
      ↓
Grab cup (auto) → HOLD to pour → RELEASE before the foam line
      ↓
(optional) Tap LID → FLICK to send down the counter
      ↓
Customer catches it → score + rush meter → next ticket
      ↓
Mistakes return down the lane as obstacles
```

**Controls (one hand, three inputs):**

| Input | Action |
|---|---|
| Hold | Pour |
| Tap (short) | Lid / ice scoop / syrup swap (context) |
| Flick / second button | Send cup down the lane |

Playable on a phone with a thumb, on a keyboard with two keys, or on an arcade stick with one button and a lever. That constraint is deliberate — it's the modern equivalent of Tapper's tap-and-fling economy.

---

## 3. The Pour Mechanic (the heart of the game)

Each cup has three visible lines:

- **Fill line** — the target.
- **Foam line** — the true danger zone, *above* the fill line.
- **Settle preview** — a faint ghost showing where the current pour will land after foam settles (unlockable assist; off by default in Arcade mode).

**The key insight: you stop short and trust the fizz.** Liquid pours to where you release, then foam rises past it, then settles back down. A "Perfect Pour" means the *settled* level kisses the fill line.

**Judgment tiers:**

| Result | Condition | Effect |
|---|---|---|
| PERFECT | Settled level within tight band of fill line | Full score, rush meter +2, satisfying *tsss-clink* |
| GOOD | Slightly under/over, no spill | Normal score, rush +1 |
| SHORT | Visibly underfilled | Customer slides it back — becomes a lane obstacle |
| FOAM-OVER | Foam crests the rim | Cup lost, +1 flood meter, counter gets sticky |

**Per-drink foam profiles** (players internalize these like fighting-game frame data):

| Drink | Fill speed | Foam rise | Settle time | Personality |
|---|---|---|---|---|
| Diet Fizz | Fast | Low | Instant | The gimme |
| Cola Classic | Medium | Medium | Medium | The baseline |
| Root Bear | Medium | **Huge** | Slow | The trap — stop way early |
| Orange Blast | Fast | Low | Fast | Speed check |
| Nitro Cold Brew | Slow | Cascading (rises twice) | Very slow | Late-game boss drink |
| Suicide/Graveyard | Inherits worst trait of all mixed drinks | — | — | Secret order, huge points |

---

## 4. Cup Sizes = Commitment Cost

This is where single-lane chaos actually lives. Big cups aren't just "longer" — they're a *resource decision*, because the queue keeps advancing while you're locked into a pour.

| Cup | Pour time | Notes |
|---|---|---|
| Kiddie | ~0.4s | Pure reflex; often arrives in clusters of 3–4 |
| Small | ~0.8s | Bread and butter |
| Medium | ~1.5s | — |
| Large | ~2.5s | First real commitment decision |
| Mega Jug (64oz) | ~4s | Queue visibly stacks while you pour; huge score |
| The Trough (novelty) | ~6s, two-stage | Requires one mid-pour release-and-resume; wave finale |

**The core dilemma:** a Mega Jug ticket arrives with three Kiddies behind it. Clear the smalls first and risk the Jug customer walking? Or commit to the Jug and let the smalls stack toward the danger zone? There is no correct answer — only reads.

**Modifiers (via ticket):**
- **Light ice** — more liquid, longer pour.
- **Extra ice** — tap ice first, then a shorter pour. Adds a combo input.
- **No ice** — longest pour, but foam settles faster (ice normally traps bubbles).
- **Lid on** — must tap lid before flicking, or the cup spills at high conveyor speed.
- **To stay** — no lid allowed; lidding it counts as a wrong order.

---

## 5. Single-Lane Chaos Systems

Replacing Tapper's four-lane panic with same-lane friction:

1. **Two-way traffic.** New cups and customers advance toward you; rejected/short-poured cups slide back *down the same lane*, physically blocking incoming orders. You must flick returns into the sink (a tap when they reach you) — dead time that punishes sloppiness twice.
2. **Sticky counter.** Each foam-over leaves a sticky patch. Cups flicked across a sticky patch slow down and can stall mid-lane, where an advancing customer can collide with them (spill = flood meter tick). Wipe patches during lulls with a hold-on-empty-lane.
3. **Rush meter.** Perfect pours charge it. Full meter = RUSH MODE: 2x score, conveyor speeds up, tickets arrive faster, foam physics get 10% twitchier. The game rewards you by trying to kill you — pure Tapper DNA.
4. **Machine degradation (per-shift arc):**
   - **Sputter** — fill rate stutters unpredictably for one cup (telegraphed by a rattle sound one ticket ahead).
   - **Pressure surge** — one cup fills at 2x speed (telegraphed by a gauge flick).
   - **Syrup out** — mid-shift, one flavor runs dry; a syrup-swap tap sequence (3 quick taps) blocks the lane for a beat. Ignore it and every cup of that flavor pours clear "water" — auto-rejected.
   - **The Drip** — late-game: the nozzle drips between pours, slowly filling the *next* cup before you start. Your target window shifts every single time.

---

## 6. Fail States & Session Structure

- **Flood meter (3 strikes):** foam-overs, lane collisions, and walked-out customers fill it. Third strike triggers the slip-and-slide game-over animation — your soda jerk hydroplanes down the counter on a puddle, cups cartwheeling. (Homage to Tapper's bartender-dragged-down-the-bar.)
- **Shift structure:** waves of ~15–25 tickets with escalating cup mix and machine degradation, punctuated by bonus rounds. A "shift" is 5 waves; survival mode is an endless shift with compounding degradation.

**Bonus rounds:**
- **The Soda Bandit** (Tapper's can-shake homage): between waves, six cups sit on the counter; the Bandit taps one, leaving a hairline crack. Cups shuffle. Fill the cracked one and it leaks everywhere — spot it and flick it into the sink for bonus points.
- **Free Refill Frenzy:** 15 seconds, endless Kiddie cups, no fail state — pure perfect-pour rhythm scoring.
- **The Regular:** one customer, one enormous custom order read aloud ticket-style ("large root bear, light ice, lid, easy foam") — a single high-stakes pour worth a wave's score.

---

## 7. Scoring & Mastery

- **Perfect chains** — consecutive perfects multiply (x2, x3, x5, capped x8). A GOOD doesn't break the chain but freezes it; SHORT/FOAM-OVER resets it.
- **Style bonuses** — lidding a cup during another cup's foam-settle window ("multitask lid"), flicking a cup that lands exactly as the customer's hand opens ("catch pour"), clearing a return and a serve in one motion.
- **Ghost data / leaderboards** — since it's all timing, replays are tiny (a list of hold/release timestamps). Watch the #1 player's shift as a translucent ghost pouring alongside you.

---

## 8. Presentation

- **Look:** chrome-and-neon 50s soda fountain filtered through a 16-bit arcade palette. Every drink has a distinct liquid color and foam texture so reads are instant at speed.
- **Audio is the real UI.** The pour pitch rises as the cup fills — players can eventually pour *by ear*, eyes on the queue. Each drink's carbonation hiss is distinct. The rattle-before-sputter and gauge-flick-before-surge warnings are audio-first.
- **Juice:** foam-over gets a full slapstick eruption; perfect pours get a crisp freeze-frame *ding* with the settled line flashing. Screen-edge stickiness creeps in visually as the flood meter rises.

---

## 9. Why This Works (Design Rationale)

Tapper's genius was a simple verb under spatial pressure. Collapsing to one lane could easily produce a boring reflex test — the design avoids that by making sure there are always **two clocks running**: the pour you're committed to, and the queue you're neglecting. Every mechanic above (cup sizes, modifiers, returns, degradation) exists to sharpen that tension between the clocks. The result keeps Tapper's serve-clear-manage rhythm but suits one-handed, browser, and mobile play far better than four lanes ever did.

---

## 10. Prototype Scope (v0.1)

Build order for a "is the pour fun?" vertical slice:

1. Hold-to-fill with foam rise/settle, three drinks (Diet Fizz, Cola, Root Bear), judgment tiers.
2. Three cup sizes (Kiddie, Medium, Mega Jug) on a scrolling ticket queue.
3. Flick-to-serve + returns-as-obstacles.
4. Rush meter + flood meter + slip game-over.
5. One 3-wave shift with the sputter mechanic only.

Everything else (lids, ice, bandit, ghosts) waits until the core pour is proven fun with a keyboard and a stopwatch.
