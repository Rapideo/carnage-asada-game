# Changelog

The version lives in `content/release.json` and shows in the bottom-right corner of the
title and pause screens. To cut a version: bump `version` and `date` there, add an entry
here, run `node build.mjs` and the tests, commit, and tag it (`git tag v<version>`, local).

Numbering: **0.9.x** is the run-up to release, with fixes from playtest punch lists.
**1.0.0** is when the owner calls it released.

## 0.9.2 (2026-11-08): the town talks

**Customers**
- **104 new customers**, picked by the owner from the art sheets and baked to match the
  originals: 38 in the '70s, 45 in the '80s, 37 in the '90s.
- **Each decade's crowd grows year by year.** A face first appears in the year the owner set
  and stays to the decade's end.
- **Every customer has lines of their own:** 670 in all, 4 to 7 each, cast by look, age and
  decade, with nothing from after their time. A customer uses one of their own lines about 3
  times in 4, and otherwise one of the 85 shared lines.
- **Speech can run to two rows** in the bubble. A two-row line stays up a second longer.

**The speaking cast**
- **Officers** (SGT. PFEIFER, OFC. KARLIN, OFC. DREILING) speak:
  - when a chase starts;
  - when you're pulled over or hit a pedestrian;
  - when you lose them.
- **Rival drivers** (DUSTY, ACE, JINX) needle your missed tosses and your perfect ones.
- **Coworkers** (MARGE, DALE, NIKKI) speak:
  - at clock-in;
  - after three clean tickets;
  - when the clock is low or the line backs up;
  - with the hint.
- One face per decade for each role, from the art director's approved portraits.

**Kitchen**
- **The next-ingredient hint:** the right bin blinks after a 3-second stall or a wrong pick,
  and the coworker says which.
  - Easy: always.
  - Medium: only for dishes new to the decade.
  - Hard and Supreme: off.
- **WRAP IT! can be reached without a mouse:** press Down past the bins, then select.
- **The tortilla rack's cursor** now fits each tray.

**Fixes**
- The speaker's name tag no longer cuts off the bottom of its letters.

**Service Mode**
- The Dialogue tab works by speaker: shared lines, each of the cast, and each customer.
- The Difficulty tab has the hint's three settings.
- The Faces tab sets each customer's first year.

Not yet: the new faces don't blink until their eyes are set by hand in Service Mode.

## 0.9.1 (2026-11-07): Service Mode

A tool for the owner, not a change to how the game plays. The public game
(`taco-shop.html`) contains none of it.

**Service Mode** (named after the arcade cabinet's service switch)
- Run `node admin.mjs` in your own terminal, open `http://localhost:8124/`, and press
  **F2**: editing panels open over the live game, and Save can write files. (`node serve.mjs`
  on port 8123 stays the plain dev server, with no Service Mode.)
- Tabs: **Levels, Menu, Attract, Music, Difficulty, Dialogue, Faces, Test**.
- Save checks everything the build would check, shows the reason on the field that caused
  it, writes the content files, and rebuilds.
- The **JSON in `content/` is now the master copy**, and the `.md` files in
  `docs/authored content/` are generated from it, so they cannot drift. This reverses
  the 2026-09-26 ruling that the authored docs win.
- **Music:** the whole MIDI library is listable and playable through the game's own
  player, and a level's playlist can be any length. Every song records its release month.
  A song released after its level's month is a warning, never a refusal.
- **Test tab:** jump to any level or screen, override the weather or season, let the game
  play itself, speed it up or step it, and call up debug views.
- The **15 decade customers blink again**: their eyes were hand-set in the Faces tab.
- A song's list, a menu item or a line of dialogue edited in Service Mode shows in the
  game behind the panel straight away.

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
