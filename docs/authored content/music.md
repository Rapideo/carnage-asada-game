# music.md

Driving Shift songs are intended to be more upbeat; fast-paced and energizing. Kichen Shift songs should be soufully mello, or solo-danceable. 

A level plays every song approved for its decade and its shift, shuffled fresh each time it plays and then looped. Songs are placed the way faces are (owner, 2026-11-09): each approved song belongs to one decade, plays on the Delivery Shift, the Kitchen Shift or both, and has a "from" year, the first level year it plays; from then on it lasts the rest of its decade. "From the start" is the decade's first level. A song never plays before its release year (its original release; build.mjs refuses a "from" earlier than that), and every level must have at least one song. Each song still records its release month (the first release, single or album; `tools/music/songs.json` says where each one comes from), for the record only.

The songs are the real MIDIs from `reference/assets/midi/`, arranged for the game's own chip voices by `tools/music/midi2song.mjs` (the song list is `tools/music/songs.json`). The game reads `content/music/approved.json` and the songs in `content/music/`, and Service Mode (Music) converts, approves and places them.

## I. The '70s (levels 1-6)

### A. Delivery Shift

1. IMMIGRANT SONG - LED ZEPPELIN (1970), from the start

2. BLACK DOG - LED ZEPPELIN (1971), from the start

3. BOHEMIAN RHAPSODY (the opera section) - QUEEN (1975), from 1975

4. BOHEMIAN RHAPSODY (the hard-rock section) - QUEEN (1975), from 1975

5. MR. BLUE SKY - ELO (1977), from 1978

6. JUST WHAT I NEEDED - THE CARS (1978), from 1978

### B. Kitchen Shift

1. WALK ON THE WILD SIDE - LOU REED (1972), from the start

2. DO IT AGAIN - STEELY DAN (1972), from the start

3. D'YER MAK'ER - LED ZEPPELIN (1973), from 1975

4. KASHMIR - LED ZEPPELIN (1975), from 1975

5. LOVELY DAY - BILL WITHERS (1977), from 1978

6. PEG - STEELY DAN (1977), from 1978

## II. The '80s (levels 7-12)

### A. Delivery Shift

1. DON'T BRING ME DOWN - ELO (1979), from the start

2. STAND AND DELIVER - ADAM AND THE ANTS (1981), from the start

3. ROCK THE CASBAH - THE CLASH (1982), from 1984

4. HOUSE OF FUN - MADNESS (1982), from 1984

5. TAKE ON ME - A-HA (1985), from 1987

6. NEVER GONNA GIVE YOU UP - RICK ASTLEY (1987), from 1987

### B. Kitchen Shift

1. JUST CAN'T GET ENOUGH - DEPECHE MODE (1981), from the start

2. DON'T YOU WANT ME - THE HUMAN LEAGUE (1981), from the start

3. AFRICA - TOTO (1982), from 1984

4. RED RED WINE - UB40 (1983), from 1987

5. BIG TIME - PETER GABRIEL (1986), from 1987

6. IF YOU LEAVE - OMD (1986), from 1987

## III. The '90s (levels 13-20)

### A. Delivery Shift

1. SWEET CHILD O' MINE - GUNS N' ROSES (1988), from the start

2. HERE COMES YOUR MAN - PIXIES (1989), from the start

3. EVERYTHING ABOUT YOU - UGLY KID JOE (1991), from 1993

4. ALEC EIFFEL - PIXIES (1991), from 1993

5. LUMP - THE PRESIDENTS OF THE USA (1995), from 1996

6. COMMON PEOPLE - PULP (1995), from 1996

7. SONG 2 - BLUR (1997), from 1999

8. I THINK I'M PARANOID - GARBAGE (1998), from 1999

### B. Kitchen Shift

1. STRAIGHT UP - PAULA ABDUL (1988), from the start

2. WHERE IS MY MIND? - PIXIES (1988), from the start

3. TWO PRINCES - SPIN DOCTORS (1991), from 1993

4. CANNONBALL - THE BREEDERS (1993), from 1993

5. REGULATE - WARREN G AND NATE DOGG (1994), from 1996

6. PEACHES - THE PRESIDENTS OF THE USA (1995), from 1996

7. BITTER SWEET SYMPHONY - THE VERVE (1997), from 1999

8. STEAL MY SUNSHINE - LEN (1999), from 1999

## IV. Title Screen

The title songs play in this order from the title screen through the winners and high-score screens and mode select. The title has no year, so the release rule does not apply to it. The auto-play demo plays the songs of the level it picks.

1. ONE STEP BEYOND - MADNESS (1979)

2. REELIN' IN THE YEARS - STEELY DAN (1972)
