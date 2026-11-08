# music.md

Driving Shift songs are intended to be more upbeat; fast-paced and energizing. Kichen Shift songs should be soufully mello, or solo-danceable. 

A level may only play songs from its own year or up to 2 years before it, never after. A song's year is its original release year, and build.mjs checks every level's songs against it and fails the build on one that is too new. Every song also records its release month (the first release, single or album, whichever came first; `tools/music/songs.json` says where each one comes from), and a level's season stands for a month: Summer is July, and Winter is January when that year's Summer level comes after it and December when it comes before, by level order. A same-year song released after its level's month is flagged as a warning, in the build log and the Music panel, but never refused (owner, 2026-11-07): Bohemian Rhapsody (October 1975) stays in Winter 1975, and Cannonball (August 1993) in Summer 1993.

Each list plays in order and then loops. The songs are the real MIDIs from `reference/assets/midi/`, arranged for the game's own chip voices by `tools/music/midi2song.mjs` (the song list is `tools/music/songs.json`). The game reads the lists from `content/music/playlist.json`.

## I. 1972

### A. Delivery Shift

Level 1, Summer 1972.

1. IMMIGRANT SONG - LED ZEPPELIN (1970)

2. BLACK DOG - LED ZEPPELIN (1971)

### B. Kitchen Shift

Level 2, Winter 1972.

1. WALK ON THE WILD SIDE - LOU REED (1972)

2. DO IT AGAIN - STEELY DAN (1972)

## II. 1975

### A. Delivery Shift

Level 3, Winter 1975.

1. BOHEMIAN RHAPSODY (the opera section) - QUEEN (1975)

2. BOHEMIAN RHAPSODY (the hard-rock section) - QUEEN (1975)

### B. Kitchen Shift

Level 4, Summer 1975.

1. D'YER MAK'ER - LED ZEPPELIN (1973)

2. KASHMIR - LED ZEPPELIN (1975)

## III. 1978

### A. Delivery Shift

Level 5, Summer 1978.

1. MR. BLUE SKY - ELO (1977)

2. JUST WHAT I NEEDED - THE CARS (1978)

### B. Kitchen Shift

Level 6, Winter 1978.

1. LOVELY DAY - BILL WITHERS (1977)

2. PEG - STEELY DAN (1977)

## IV. 1981

### A. Delivery Shift

Level 7, Summer 1981.

1. DON'T BRING ME DOWN - ELO (1979)

2. STAND AND DELIVER - ADAM AND THE ANTS (1981)

### B. Kitchen Shift

Level 8, Winter 1981.

1. JUST CAN'T GET ENOUGH - DEPECHE MODE (1981)

2. DON'T YOU WANT ME - THE HUMAN LEAGUE (1981)

## V. 1984

### A. Delivery Shift

Level 9, Winter 1984.

1. ROCK THE CASBAH - THE CLASH (1982)

2. HOUSE OF FUN - MADNESS (1982)

### B. Kitchen Shift

Level 10, Summer 1984.

1. AFRICA - TOTO (1982)

2. RED RED WINE - UB40 (1983)

## VI. 1987

### A. Delivery Shift

Level 11, Summer 1987.

1. TAKE ON ME - A-HA (1985)

2. NEVER GONNA GIVE YOU UP - RICK ASTLEY (1987)

### B. Kitchen Shift

Level 12, Winter 1987.

1. BIG TIME - PETER GABRIEL (1986)

2. IF YOU LEAVE - OMD (1986)

## VII. 1990

### A. Delivery Shift

Level 13, Summer 1990.

1. SWEET CHILD O' MINE - GUNS N' ROSES (1988)

2. HERE COMES YOUR MAN - PIXIES (1989)

### B. Kitchen Shift

Level 14, Winter 1990.

1. STRAIGHT UP - PAULA ABDUL (1988)

2. WHERE IS MY MIND? - PIXIES (1988)

## VIII. 1993

### A. Delivery Shift

Level 15, Winter 1993.

1. EVERYTHING ABOUT YOU - UGLY KID JOE (1991)

2. ALEC EIFFEL - PIXIES (1991)

### B. Kitchen Shift

Level 16, Summer 1993.

1. TWO PRINCES - SPIN DOCTORS (1991)

2. CANNONBALL - THE BREEDERS (1993)

## IX. 1996

### A. Delivery Shift

Level 17, Summer 1996.

1. LUMP - THE PRESIDENTS OF THE USA (1995)

2. COMMON PEOPLE - PULP (1995)

### B. Kitchen Shift

Level 18, Winter 1996.

1. REGULATE - WARREN G AND NATE DOGG (1994)

2. PEACHES - THE PRESIDENTS OF THE USA (1995)

## X. 1999

### A. Delivery Shift

Level 19, Summer 1999.

1. SONG 2 - BLUR (1997)

2. I THINK I'M PARANOID - GARBAGE (1998)

### B. Kitchen Shift

Level 20, Winter 1999.

1. BITTER SWEET SYMPHONY - THE VERVE (1997)

2. STEAL MY SUNSHINE - LEN (1999)

## XI. Title Screen

The title songs play from the title screen through the winners and high-score screens and mode select. The title has no year, so the year rule does not apply to it. The auto-play demo plays the songs of the level it picks.

1. ONE STEP BEYOND - MADNESS (1979)

2. REELIN' IN THE YEARS - STEELY DAN (1972)
