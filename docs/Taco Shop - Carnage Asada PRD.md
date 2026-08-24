# Taco Shop - Carnage Asada

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

#### 2. Mode B:  Arcade

### C. Attract Mode

### D. The Clock

#### 1. Shift Timer

Keeping with with the arcade pacing, each shift, both Driving and Kitchen will be set at 2 minutes. If and when this time expires, the game is over. 

#### 2. Extensions

If the player meets the expectations of the individual levels, dependant on the rules applied there, the user will recieve a time extension, and be allowed to continue play. The player shall recieve no more than FOUR extensions per level.

### E. Scoring

### F. High Scores

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

- Menu : 4

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

- Menu : 4

- Era : 1990s

### H. Dialog System

#### 1. Customers and Drivers

#### 2. Taco Shop Staff

### I. Difficulty Levels

### J. Era

Over the 20 levels, the game will feature 3 "Eras"; the 1970s, 1980's, and 1990s which will impact the global look and feel of the game by utilizing both an Era-Specific color pallete, as well as changes to the meny, music, and delivery geography. 

### K. Seasons

The game levels will also specify a Season, either Summer of Winter, which wil dictate both driving conditiions, hazards, and customer dress. 

### L. Music

By leveraging music from each defined era, the games music will be a direct reflection of the time along with the visual aethstetic. Named below are each of the songs that the game will feature, and during which era they will appear. 

Songs themselves will be derived from MIDI files, passed thru a Note JS conversion process that will leave us with a JSON song structure file, and instruction as to which model of synthesis and instuments to utilize. 

#### 1. 1972

#### 2. 1975

#### 3. 1978

#### 4. 1981

#### 5. 1984

#### 6. 1987

#### 7. 1990

#### 8. 1993

#### 9. 1996

#### 10. 1999

### M. Conclusion

## CONTROL MECHANICS

I would like to make the controls a little more arcade-friendly, and compatible with playing with a joystick. This would require an existing change to the Delivery play; where it would assume the new control scheme:

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

## III: The Delivery Shift

### A. Play Mechanic Updates

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

#### 2. Bonus Schema







n order arrives. It has 1–5 **items** (a customer orders more than one thing). Each item is a menu item — hard taco, bean burrito, sancho, nachos — and each menu item has a **fixed ingredient sequence**. You assemble it by clicking ingredients from a grid **in the correct order**, then hit a finishing action to close the item; when every item on the order is finished, you SERVE the order.

Both the menu, ingredients and build order will be defined in a JSON settings file. This file will also store our ingredient groups which wil define what appears in the bins. 

The rules that made it work, in priority order:

1. **The recipes are hidden.** The player sees **how many steps remain** (a row of pips) and nothing else. You have to *know* that a sancho is tortilla → beef → lettuce → cheese →wrap. Learning the menu **is** the mastery curve.
2. **A wrong click flashes red and is counted.** It doesn't undo your progress — it costs you accuracy and time, and it feeds the bark (below). If the wrong ingredient is selected, it warns you until to select the CORRECT ingredient. 
3. **Incoming order tickets** - Play will start with one ticket, but as play progresses, more will appear. The idea is to keep up the pace to that you never have more than 3 live tickets at any one time. If there are more, customers start complaining.  No one ticket will have more than 5 menu items. 
4. **Scored 1–5 stars**: `served − walkouts − floor(mistakes / 3)`, clamped.
5. **Sound is load-bearing.** Ingredient clicks, order arrival, the walkout, and the SERVE moment. The feel I wrote down at the time was **"slot-machine fun"** — that's the target.



## X. Non-Negotiable Technical Constraints

- **Zero dependencies.** No packages, no asset files, no fetch, no CDN. Sprites, sound and glyphs are generated procedurally at boot — anything you add is drawn in `30_art.js` and voiced in `20_audio.js`.
- 384×216 virtual screen, 5×7 ASCII-only font, all money in **integer cents**.
- `src/*.js` are plain scripts sharing one global scope, concatenated in filename-sort order. A new module needs a numeric prefix after everything it uses at load time. Top-level `const` collisions are fatal and surface only in the bundle.
- Menu data, recipes, abbreviations, bark lines and walkout quotes are **authored content** — they go in `content/*.json`, validated at build time, not hard-coded in `80_game.js`. The build already rejects characters the font can't draw and copy too wide for the screen; extend that validation to cover recipes rather than trusting a comment. A note is not a guard.
- Palette discipline: `PAL.cyan` is reserved for guidance so it reads as machine output,   `PAL.jade`/`PAL.gold` are badge-only and stay off the HUD, amber is money, red is danger.
- Rebuild with `node build.mjs`; `taco-shop.html` does not reflect source edits until you do.

## 

**The bar: I should not be able to tell, from a screenshot, that this mini-game came from somewhere else.**
