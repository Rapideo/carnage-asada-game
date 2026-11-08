# attract.md

## I. Sequence

The following sequence will loop while the game is in attract mode. 

1. Title Screen

2. Winners Screen

3. High Scores Screen

4. Auto-Play

One loop is 1:20. Any key or click on the Winners, High Scores or Auto-Play screen returns
to the Title Screen. On the Title Screen, Enter, Space or a click goes to mode select.

The game reads these durations from `content/attract.json`.

## II. Screens

### A. Title Screen

- Duration : 0:15 seconds

- Wordmark : the badge stands alone, `IN` appears at 0:00.5, and CARNAGE ASADA grows in
  from 0:01 over 2 seconds, landing with a rumble. The prompt blinks once it has landed

- Music : the title songs (see music.md). They keep playing through the Winners and High
  Scores screens and mode select

### B. Winners Screen

- Duration : 0:10 seconds

- Message : Winners Don't Use Drugs. They Drink. 

- FBI Director : Kash P.V. Patel

- Attribution as drawn : KASH P.V. PATEL, DIRECTOR, FBI

- Credit : CREDIT: 0

### C. High Scores

- Duration : 0:10 seconds

### D. Auto-Play

- Duration : 0:45 seconds

- Levels : RANDOM

  - Any of the 20 levels, with that level's era, season, map, menu and music

  - A Delivery level is driven by the demo driver, with full navigation whatever the
    level's difficulty

  - A Kitchen level is cooked by the kitchen autoplayer, which uses the same inputs a
    player would, at human speed, and makes a wrong pick about 1 time in 12

  - The demo never scores and never reaches the high-score board

- Overlay Text : Press ESC to Return to Menu
