You're working in the **Taco Shop: Carnage Asada** repo. Read `CLAUDE.md` first, then the tip-decay
and bag-of-3 reasoning in `JOURNAL.md`, then the **Punch list** and **Playtest notes** sections of
`ROADMAP.md`.

`CLAUDE.md` tells you not to import context from outside this repo. That still holds — everything you
need is below. The mechanic described in "The Build" comes from an earlier project of mine that this
one grew out of; I've written it out here in full **so you never need to go looking for it**. Treat
this prompt as the source, not a pointer. If something seems missing, ask.

## What I Want

THIS IS NOT A JUST MINI-GAME. This is the other half of the game play. Players will alternate between working in the Taco Shop kitchen, and driving deliveries. 

## Global Adjustments

A few things will need to change game-wide to allow of the merging of both of these types of game play. 

## CONTROL MECHANICS

I woudl like to make the controls a little more arcade-friendly, and compatible with playing with a joystick. This would require an existing change to the Delivery play; where it would assume the new control scheme:

4-Way Joytick Control - DRIVE MODE

- Up: Forward (Same as Accelerate Button)

- Down: Reverse (Same as Reverse Button)

- Left: Turn Left

- Right : Turn Right

There are a total of THREE butons:

- Button 1: Accelerate

- Button 2: Reverse

- Button 3: Aim and Release

HOLDING Button 3 puts the Joysick into Aim Mode; where the joystick no longer moves the car, but instaed allows you to direct the path of the throw, much as the mouse does currently. RELEASING Button 3 tosses the bag.  

## TIME PROGRESSION and LEVELS

## DIALOG MECHANISM

## SCORING

## PLAY EXTENSIONS

## DIFFICULTY PROGRESSION



## Level Type One: The Delivery

## Level Type Two - The Kitchen

## Part 1 — Play Mechanic Overview

An order arrives. It has 1–5 **items** (a customer orders more than one thing). Each item is a menu item — hard taco, bean burrito, sancho, nachos — and each menu item has a **fixed ingredient sequence**. You assemble it by clicking ingredients from a grid **in the correct order**, then hit a finishing action to close the item; when every item on the order is finished, you SERVE the order.

Both the menu, ingredients and build order will be defined in a JSON settings file. This file will also store our ingredient groups which wil define what appears in the bins. 

The rules that made it work, in priority order:

1. **The recipes are hidden.** The player sees **how many steps remain** (a row of pips) and nothing else. You have to *know* that a sancho is tortilla → beef → lettuce → cheese →wrap. Learning the menu **is** the mastery curve.
2. **Strict order, no partial credit.** Right ingredient in the wrong position is a mistake.
3. **A wrong click flashes red and is counted.** It doesn't undo your progress — it costs you accuracy and time, and it feeds the bark (below). If the wrong ingredient is selected, it warns you until to select the CORRECT ingredient. 
4. **Incoming order tickets** - Play will start with one ticket, but as play progresses, more will appear. The idea is to keep up the pace to that you never have more than 3 live tickets at any one time. If there are more, customers start complaining.  No one ticket will have more than 5 menu items. 
5. **Difficulty Progression** - As we advance levels, new menu items and ingredients will appear; and the requried pace will quicken. 
6. **Ingredient grid of 10–12**, so the player has to *discriminate*. When every ingredient is used by every recipe the grid is just a sequence to walk, not a choice.
7. **The Clock** : 
8. **The Order Timer** : 
9. **The Dialog System** : 
10. **Escalating correction barks from Bob** The kitchen veteran watching you had three tiers keyed to your mistake count — 1 mistake: *"Easy, kid — slow down."* 3: *"Focus up. I'm watching."* 6: *"Last chance, kid."* Cheap to build, and it did more for the pressure than any timer.
11. **Scored 1–5 stars**: `served − walkouts − floor(mistakes / 3)`, clamped.
12. **Sound is load-bearing.** Ingredient clicks, order arrival, the walkout, and the SERVE moment. The feel I wrote down at the time was **"slot-machine fun"** — that's the target.

Difficulty scaled by lengthening recipes, widening the menu pool, adding items per order, and tightening patience.

## Part 2 — The "Feel" Target

**Carnage Asada's look and feel are right and are not up for revision.** The frantic pace, the arcade read, the CRT pass, the palette discipline, the procedural chunky sprites, the chip audio — that's the product. The Build is being brought *into* this game's aesthetic, not bolted onto the side of it. If any detail of Part 1 fights the way this game looks or sounds, **this game wins** — say so and adapt it.

## Part 3 — The translation problems (this is the actual work)

Each of these is a real conflict between Part 1 and Part 2. Solve them, don't paper over them.

- 
- **There are no image files.** No portraits, no sprites, no fonts on disk — every pixel is generated in `30_art.js` at boot. The walkout beat's customer portrait was a PNG in the old project. Here it's either drawn procedurally or replaced with something that carries the same weight. Your call, argued.
- **There is no dialogue system.** No dialog box, no speaker plate. What exists is `G.say()` banners,n`Fx.pop()` floaters, and the order card in `70_hud.js`. The bark and the walkout quote have to live in that vocabulary, or extend it in its own style.
- **There is no kitchen veteran character in this game.** The bark mechanic is great and the characteris an import. Decide what carries it here — the pass window, a radio, the shop itself — and say why.
- **The abbreviations are a gift to this engine.** The font is 5×7 ASCII-only on a 384px screen, and the TACO-NAV LCD already reads as terse machine output. `CCQ` and `HRDTC` will sit in this game better than they did in the last one. Lean into that.
- **Where the order comes from.** `BAG_MAX` is 3 and `newOrder()` picks a fresh address after each delivery, so a load of three bags is up to three deliveries. Open question worth your thought: do youassemble **three specific orders** at the dock and then have to get the right bag to the right house — the existing `WRONG HOUSE!` penalty is already sitting right there — or one generic load? The first is a much better game if it doesn't overload the player. Argue it.
- **Getting it wrong.** `REMAKE_FEE` ($1.50) currently fires when a bag splats or hits the wrong house. A mis-assembled order rejected at the door is the same family of failure. Consider whether the walkout beat becomes a *doorstep* beat.



## Non-Negotiable Technical Constraints

- **Zero dependencies.** No packages, no asset files, no fetch, no CDN. Sprites, sound and glyphs are generated procedurally at boot — anything you add is drawn in `30_art.js` and voiced in `20_audio.js`.
- 384×216 virtual screen, 5×7 ASCII-only font, all money in **integer cents**.
- `src/*.js` are plain scripts sharing one global scope, concatenated in filename-sort order. A new module needs a numeric prefix after everything it uses at load time. Top-level `const` collisions are fatal and surface only in the bundle.
- Menu data, recipes, abbreviations, bark lines and walkout quotes are **authored content** — they go in `content/*.json`, validated at build time, not hard-coded in `80_game.js`. The build already rejects characters the font can't draw and copy too wide for the screen; extend that validation to cover recipes rather than trusting a comment. A note is not a guard.
- Palette discipline: `PAL.cyan` is reserved for guidance so it reads as machine output,   `PAL.jade`/`PAL.gold` are badge-only and stay off the HUD, amber is money, red is danger.
- Rebuild with `node build.mjs`; `taco-shop.html` does not reflect source edits until you do.



## 

**The bar: I should not be able to tell, from a screenshot, that this mini-game came from somewhere else.**
