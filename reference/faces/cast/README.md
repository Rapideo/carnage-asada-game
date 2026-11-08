# Speaking cast for Taco Shop – Carnage Asada

The roles recur across the three eras, with a different fictional person in each decade. The police cap and badge, the rival’s brown baseball cap with its olive cactus, and the coworker’s paper cap and apron identify the speaker before the player reads the line.

| Role | ’70s | ’80s | ’90s |
| --- | --- | --- | --- |
| Hays police officer | A by-the-book officer with a carefully combed mustache, an accusatory brow, and a brass wheat badge. | A knowing half-smile, silver badge, and a shoulder radio nearly as wide as her face. | A younger officer with an eight-point cap and the expression of someone quietly counting to three. |
| Rival delivery driver | A shaggy show-off with feathered hair under the cap and a wide cream collar. | A grinning arcade champ in a muted plum and burgundy windbreaker with a popped collar. | A conspiratorial grin, asymmetric bob, flannel collar, and checked delivery-bag strap. |
| Kitchen coworker | A veteran with a pencil behind her ear, an ivory paper hat, and a mustard polo. | A friendly half-smile, oversized glasses, a burgundy visor, a plum polo, and flour on his apron. | A coworker with a jade shop cap, braided bun, brick-red polo, and raised spatula. |

The nine individual PNGs are the full bust references, with a flat black key and roughly 6% headroom. The three labeled sheets are for cast review. `crop-guide.json` gives the full-bust bounds and the tighter upper-chest crop used in the proof. The bottom row of the proof shows one existing game portrait per era for comparison. `prompts.txt` records the image-generation prompts.

### Cactus color in the bake

The default median cut can turn the small green cactus brown. The rival proofs keep it olive at 60×74 and within the 16-color limit. For those three portraits, reduce to 14 body colors plus the ink keyline, then apply the `accent.hex` color to the zero-based `accent.pixelsAfterInk` coordinates in `crop-guide.json`. The proof estimates palette colors from the non-logo pixels. The officers use the standard 15 body colors plus ink.

### Taco Shop uniform colors in the bake

The staff proofs use 13 body colors, the ink keyline, and two uniform accents. `crop-guide.json` gives the zero-based `pixelsAfterInk` positions for jade `#1fa37e` and gold `#f3bd46` under each staff portrait's `accents`. The chest emblem reads as a color badge at native size. The ’90s coordinates also preserve the logo and jade highlights on the cap. The era-grade proof applies the game's own decade tint to all nine.
