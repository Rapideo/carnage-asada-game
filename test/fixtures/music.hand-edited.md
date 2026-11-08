# music.md

Driving Shift songs are intended to be more upbeat; fast-paced and energizing. Kichen Shift songs should be soufully mello, or solo-danceable. 

A level may only play songs from its own year or up to 2 years before it, never after. A song's year is its original release year, and build.mjs checks every level's songs against it and fails the build on one that is too new. Every song also records its release month (the first release, single or album, whichever came first; `tools/music/songs.json` says where each one comes from), and a level's season stands for a month: Summer is July, and Winter is January when that year's Summer level comes after it and December when it comes before, by level order. A same-year song released after its level's month is flagged as a warning, in the build log and the Music panel, but never refused (owner, 2026-11-07): Bohemian Rhapsody (October 1975) stays in Winter 1975, and Cannonball (August 1993) in Summer 1993.

Each list plays in order and then loops. The songs are the real MIDIs from `reference/assets/midi/`, arranged for the game's own chip voices by `tools/music/midi2song.mjs` (the song list is `tools/music/songs.json`). The game reads the lists from `content/music/playlist.json`.

## I. 1972

### A. Driving Shift

Level 1, Summer 1972.

1. Immigrant Song - Led Zeppelin (1970)

2. Black Dog - Led Zeppelin (1971)

### B. Kitchen Shift

Level 2, Winter 1972.

1. Walk on the Wild Side - Lou Reed (1972)

2. Do It Again - Steely Dan (1972)

## II. 1975

### A. Driving Shift

Level 3, Winter 1975.

1. Bohemian Rhapsody (the opera section) - Queen (1975)

2. Bohemian Rhapsody (the hard-rock section) - Queen (1975)

### B. Kitchen Shift

Level 4, Summer 1975.

1. D'yer Mak'er - Led Zeppelin (1973)

2. Kashmir - Led Zeppelin (1975)

## III. 1978

### A. Driving Shift

Level 5, Summer 1978.

1. Mr. Blue Sky - ELO (1977)

2. Just What I Needed - The Cars (1978)

### B. Kitchen Shift

Level 6, Winter 1978.

1. Lovely Day - Bill Withers (1977)

2. Peg - Steely Dan (1977)

## IV. 1981

### A. Delivery Shift

Level 7, Summer 1981.

1. Don't Bring Me Down - ELO (1979)

2. Stand and Deliver - Adam and the Ants (1981)

### B. Kitchen Shift

Level 8, Winter 1981.

1. Just Can't Get Enough - Depeche Mode (1981)

2. Don't You Want Me - The Human League (1981)

## V. 1984

### A. Delivery Shift

Level 9, Winter 1984.

1. Rock the Casbah - The Clash (1982)

2. House of Fun - Madness (1982)

### B. Kitchen Shift

Level 10, Summer 1984.

1. Africa - Toto (1982)

2. Red Red Wine - UB40 (1983)

## VI. 1987

### A. Delivery Shift

Level 11, Summer 1987.

1. Take On Me - a-ha (1985)

2. Never Gonna Give You Up - Rick Astley (1987)

### B. Kitchen Shift

Level 12, Winter 1987.

1. Big Time - Peter Gabriel (1986)

2. If You Leave - OMD (1986)

## VII. 1990

### A. Delivery Shift

Level 13, Summer 1990.

1. Sweet Child o' Mine - Guns N' Roses (1988)

2. Here Comes Your Man - Pixies (1989)

### B. Kitchen Shift

Level 14, Winter 1990.

1. Straight Up - Paula Abdul (1988)

2. Where Is My Mind? - Pixies (1988)

## VIII. 1993

### A. Delivery Shift

Level 15, Winter 1993.

1. Everything About You - Ugly Kid Joe (1991)

2. Alec Eiffel - Pixies (1991)

### B. Kitchen Shift

Level 16, Summer 1993.

1. Two Princes - Spin Doctors (1991)

2. Cannonball - The Breeders (1993)

## IX. 1996

### A. Delivery Shift

Level 17, Summer 1996.

1. Lump - The Presidents of the USA (1995)

2. Common People - Pulp (1995)

### B. Kitchen Shift

Level 18, Winter 1996.

1. Regulate - Warren G and Nate Dogg (1994)

2. Peaches - The Presidents of the USA (1995)

## X. 1999

### A. Delivery Shift

Level 19, Summer 1999.

1. Song 2 - Blur (1997)

2. I Think I'm Paranoid - Garbage (1998)

### B. Kitchen Shift

Level 20, Winter 1999.

1. Bitter Sweet Symphony - The Verve (1997)

2. Steal My Sunshine - Len (1999)

## XI. Title Screen

The title songs play from the title screen through the winners and high-score screens and mode select. The title has no year, so the year rule does not apply to it. The auto-play demo plays the songs of the level it picks.

1. One Step Beyond - Madness (1979)

2. Reelin' in the Years - Steely Dan (1972)
