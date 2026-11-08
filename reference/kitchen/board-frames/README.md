# Prep-board frames: the approved set

This folder holds the **final prep-board frames for all 26 dishes**, assembled on 2026-11-07. It's the one place to take them from when they are baked into the game.

It's the art director's full set (`../review/2026-11-07-full-board-set/`) with two drop-in patches copied over it, in this order:
1. `../review/2026-11-07-board-readability-patch/`: 21 states (the chili, beans on beef, sauce);
2. `../review/2026-11-07-board-consistency-patch/`: 11 states (the chili finishes, the beans-first chain).

The manifest is the same in all three, byte for byte.

- `states/`: 88 transparent 40×38 PNGs, one per distinct state, named by recipe prefix (`LARGE-BEANS-CHEESE.png`), with finishes named `<DISH>-WRAPPED.png`.
- `manifest.json`: each dish's recipe, build keys, finished key and eras. The recipes match `docs/authored content/menu.md`, which is law.

**Still under the owner's art pin: nothing here is in the game yet.** The rulings and the review history are in `docs/art-direction-welcome.md`.
