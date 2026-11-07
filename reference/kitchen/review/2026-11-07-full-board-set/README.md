# Taco Shop – Carnage Asada prep-board sprites

This review pack covers all 26 dishes across the three game eras. It contains 88 transparent 40×38 PNGs. The 78 build states are keyed by recipe prefix. Every dish also has a finished state in the manifest, with 10 additional cutouts for finishes that change the picture.

- **states/** contains the native-size PNGs. For example, `LARGE-BEEF-SAUCE.png` is the large tortilla, beef, and mild sauce in that order.
- **manifest.json** lists each dish's ingredient order, build PNG keys, finished PNG key, and eras. Append `.png` to a key to get its filename in `states/`. The board is empty before the first ingredient pick.
- **proofs/** has labeled sheets at native size and 4×, grouped by the era in which each dish first appears. Both use the game's 16-color palette reducer and a 64×42 wood board cell. The 4× proofs use an approximation of scanlines.
- **contrast-check.json** records per-pick contrast in the reduced board proof at one fixed RGB threshold.
- **source-sheets/** contains the five new image-generated component sheets and their prompts. The approved v2 pilot ZIP contains the earlier source sheets. The build PNGs in this pack incorporate the approved v2 states and new component art.

## Finishes

Hard tacos and nachos reuse the last ingredient frame. Soft tacos fold over their own fillings. The 38×20 closed roll is shared by the plain large-tortilla dishes, including Queso Melt, which follows the game's large-tortilla finish. The wrap key for that common roll is `BEAN-BURRITO-WRAPPED`, carried forward from the pilot.

| Smothered finish | Visible outside the roll |
| --- | --- |
| Enchilada with Meat | Mild red sauce and shredded cheddar |
| Chili Burrito | House chili |
| Chili Enchilada | House chili and shredded cheddar |
| Sanchez | Pale chili con queso |
| Chicken Enchilada | Mild red sauce and diced tomato |
| Chicken Enchilada Supreme | Sour cream |

The ingredient frames show each topping added to the open base at its authored step. The table describes which toppings also appear on the outside once the roll is closed.
