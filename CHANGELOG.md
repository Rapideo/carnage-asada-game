# Changelog

The version lives in `content/release.json` and shows in the bottom-right corner of the
title and pause screens. To cut a version: bump `version` and `date` there, add an entry
here, run `node build.mjs` and the tests, commit, and tag it (`git tag v<version>`, local).

Numbering: **0.9.x** is the run-up to release, with fixes from playtest punch lists.
**1.0.0** is when the owner calls it released.

## 0.9.0 (2026-11-07): feature-complete

The first numbered build. Everything the design calls for is in. Next comes the owner's
full playtest punch list.

**The game**
- Twenty levels, summer 1972 to winter 1999, alternating the **Delivery Shift** and
  the **Kitchen Shift**.
- Three eras (1970s, 1980s, 1990s), each with its own:
  - colour grade;
  - map of downtown Hays;
  - menu;
  - customers;
  - music.
- Four difficulties, Easy to Supreme.
- One score, the money across the whole run, with a ten-place high-score board,
  initials entry and CONTINUE.
- Three control modes: keyboard and mouse, arcade stick (any gamepad), and touch.
- An attract mode: title, winners card, high scores, and a demo of a random level,
  driven or cooked by the game itself.

**Delivery Shift**
- Downtown Hays and the Union Pacific through it, with crossing gates you can run.
- Traffic, pedestrians, and police chases.
- The TACO-NAV 2000 route guidance.
- **Weather, rolled each play:**
  - summer is sunny or rainy (an even chance; rain is a little slick and has its own
    sound);
  - winter is snowy four times in five, sunny the fifth.

**Kitchen Shift**
- Twelve fixed bins and three bases.
- Tickets on a rail, built from memory and wrapped.
- Customers queue, complain, and walk out.
- The art director's baked frames on the prep board, for every step of all 26 dishes.
- Surroundings for each decade:
  - '70s enamel tile;
  - '80s wood paneling;
  - '90s laminate and plastic.

  Each decade has its own stocked pantry, a calendar showing the level's month and
  year, the shop sign, and a dining room with its rope line.

**Under the hood**
- One self-contained HTML file, about 790 KB, with zero runtime dependencies.
- Everything authored is in `content/`, validated and inlined at build time.
- 241 headless checks, plus a renderer for looking at real frames.
