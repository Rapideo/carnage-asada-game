# difficulty.md

The game reads these values from `content/difficulty.json`, which holds them in integer
cents and seconds.

## I. Easy

Levels 1-6, the 1970s.

### A. Shift

- Starting Timer : 3:00 Minutes

- Starting Tip : 20.00 

- Depreciation Rate  : 1.00 / 3 Seconds

- Tip Floor : 2.00. The tip falls to it in 54s and holds there; it never runs out

### B. Bonus Structure

#### 1. Extended Play

- Every 3 Completed : +1:30 Time Bonus

  - Every third delivery or ticket served earns one, wherever they came from: the three
    need not be from one load, and a miss only delays the next one

- Maximum Extensions Per Shift: 5

- Level Target : 15 deliveries / 15 tickets served (3 x the extension cap; see GDD §II.D.3).
  Reaching it clears the level; 0:00 first is game over. Medium and Hard: also 15.
  Supreme: 9

The level clears on the completion that would have earned the last extension.

Time comes only from the starting timer and these extensions, in both shifts. There is no
time per delivery and none for a perfect one.

#### 2. Points Bonus

- Delivery Shift

  - Perfect Delivery (bag lands on the doorstep) : +5.00

  - Combo : x1.00 rising 0.25 per delivery, to x3.00. Reset by a missed throw, a crash (a
    train is a crash), a pedestrian or a police ticket

- Kitchen Shift

  - Clean Ticket (served with no wrong clicks) : +5.00

  - Combo : x1.00 rising 0.25 per ticket served, to x3.00. Reset by a walkout

The combo multiplies everything a delivery or ticket pays, bonus included. It starts at
x1.00 at the start of every level.

- Stars : one per perfect delivery, and one per kitchen item built with no wrong pick.
  They are shown on the level clear, game over and victory cards, and are never part of
  the score

### C. Penalties

- Speeding Ticket : 5.00

- Hitting Pedestrian : 2.00

- Hitting Train : 5.00

- Remake (a splatted bag) : 1.50, at every difficulty

### D. Navigation

- Full : the TACO-NAV turn-by-turn panel, the route line and destination dot on the
  minimap, the off-screen edge pointer, and the beacon over the house

Each difficulty takes one more piece away (settled 2026-09-26):

| | panel | map line | map dot | edge pointer | beacon |
|---|---|---|---|---|---|
| Easy | x | x | x | x | x |
| Medium | x | | x | | x |
| Hard | | | x | | x |
| Supreme | | | | | x |

Supreme leaves the address on the order card, and the beacon once the house is in view.

### E. Kitchen Shift

See GDD §IV.F for how these are used.

- Starting Tip per Item : 5.00

- Depreciation Rate : 1.00 / 8 Seconds

- Maximum Items per Ticket : 3. Tickets are weighted toward 1 and 2 items

- New Ticket Every : 25 Seconds. If the rail empties, the next ticket arrives at once.
  The first ticket of a shift arrives 1.5s in

- Ticket Limit : 3 on the rail, and it is a soft limit. Up to 3 more customers wait in
  the OVERHEAD. While anyone is waiting, every live ticket's tip drains 50% faster, and
  the line complains

- Hint : after a wrong pick, the right bin's plate blinks amber for 1.6s. The star and
  the clean bonus are lost all the same. Easy only

A ticket's tip is also its patience, so these two set how long a customer waits: 40s for
a 1-item ticket, 120s for 3 items. At 0 the customer walks out, and the ticket pays
nothing. A 3-item ticket served 30s after it
arrives pays $11.25, level with an Easy delivery. Paper estimates, set 2026-09-26; tune
them by playtest.

## II. Medium

Levels 7-12, the 1980s. Map 2 and the Era 2 menu add their own difficulty on top of
these numbers. Anything not listed here is the same as Easy.

### A. Shift

- Starting Timer : 3:00 Minutes (same as Easy)

- Starting Tip : 20.00

- Depreciation Rate : 1.00 / 2.5 Seconds (reaches the 2.00 floor at 45s; Easy 54s)

### B. Bonus Structure

- Same as Easy

### C. Penalties

- Speeding Ticket : 10.00

- Hitting Pedestrian : 4.00

- Hitting Train : 10.00

- Remake : 1.50 (same as Easy)

### D. Navigation

- Partial : panel, minimap destination dot, beacon. No minimap route line, no edge pointer

### E. Kitchen Shift

- Starting Tip per Item : 5.00

- Depreciation Rate : 1.00 / 6 Seconds

- Maximum Items per Ticket : 4

- New Ticket Every : 20 Seconds. If the rail empties, the next ticket arrives at once

- Hint : none

A 1-item ticket lasts 30s (Easy 40s), 3 items 90s, 4 items 120s. A 3-item ticket served
30s after it arrives pays $10.00.

Hard and Supreme allow 5 items per ticket.

## III. Hard

Levels 13-18, the 1990s. Map 3 and the Era 3 menu add their own difficulty on top of
these numbers. Anything not listed here is the same as Medium.

### A. Shift

- Starting Timer : 3:00 Minutes (same as Easy)

- Starting Tip : 20.00

- Depreciation Rate : 1.00 / 2 Seconds (reaches the 2.00 floor at 36s; Medium 45s)

### B. Bonus Structure

#### 1. Extended Play

- Every 3 Completed : +1:00 Time Bonus (Easy and Medium +1:30)

- Maximum Extensions Per Shift : 5 (longest shift 8:00; Easy and Medium 10:30)

#### 2. Points Bonus

- Same as Easy

### C. Penalties

- Same as Medium : Speeding Ticket 10.00, Hitting Pedestrian 4.00, Hitting Train 10.00,
  Remake 1.50. Held rather than raised on purpose: flat fines against smaller tips
  already cost more

### D. Navigation

- Minimal : minimap destination dot and beacon. No panel, no route line, no edge pointer

### E. Kitchen Shift

- Starting Tip per Item : 5.00

- Depreciation Rate : 1.00 / 5 Seconds

- Maximum Items per Ticket : 5

- New Ticket Every : 18 Seconds. If the rail empties, the next ticket arrives at once

A 1-item ticket lasts 25s (Medium 30s), 3 items 75s, 5 items 125s. A 3-item ticket served
30s after it arrives pays $9.00. At an estimated ~15s to build an average ticket, the rail
keeps up until a run of big tickets backs it up.

## IV. Supreme

Levels 19-20, Summer and Winter 1999: the finale. Anything not listed here is the same
as Hard.

### A. Shift

- Starting Timer : 3:00 Minutes (same as Easy)

- Starting Tip : 20.00

- Depreciation Rate : 1.00 / 2 Seconds (same as Hard; reaches the 2.00 floor at 36s).
  Held on purpose: beacon-only navigation already makes every drive longer

### B. Bonus Structure

#### 1. Extended Play

- Every 3 Completed : +1:00 Time Bonus (same as Hard)

- Maximum Extensions Per Shift : 3 (longest shift 6:00; Hard 8:00)

- Level Target : 9 deliveries / 9 tickets served (Easy to Hard: 15)

#### 2. Points Bonus

- Same as Easy

### C. Penalties

- Speeding Ticket : 15.00

- Hitting Pedestrian : 6.00

- Hitting Train : 15.00

- Remake : 1.50 (same as Easy)

Fines are flat from Medium through Hard; the finale is where they rise again.

### D. Navigation

- Beacon only : the address on the order card, and the beacon once the house is in view

### E. Kitchen Shift

- Starting Tip per Item : 5.00

- Depreciation Rate : 1.00 / 5 Seconds (same as Hard)

- Maximum Items per Ticket : 5

- New Ticket Every : 15 Seconds. If the rail empties, the next ticket arrives at once

Tickets arrive about as fast as an average one can be built (~15s, estimated), so the
rail stays full and the 3-ticket limit is the finale's constant pressure.
