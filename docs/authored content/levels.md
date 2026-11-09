# levels.md

Twenty levels, Delivery and Kitchen Shifts alternating. The game reads them from
`content/levels.json`.

- Eras : each era has its own map, menu, cast of customers, car paint, music and colour
  grade

  - 1970s : levels 1-6, Map 1, Menu 1 (menu.md Era 1)

  - 1980s : levels 7-12, Map 2, Menu 2

  - 1990s : levels 13-20, Map 3, Menu 3

  The three maps are downtown Hays with the same streets and the same shop; only the
  zoning moves on from era to era.

- Seasons : Summer is the baseline. Winter lays snow over everything but the ploughed
  roads and on every roof. Kitchen customers come in with snow on their hats

- Weather (set per level, 0.9.3) : each level carries its own `weather` and a `windy` flag
  (see its fields below). Summer is **sunny** or **rainy**, winter is **snowy** or **sunny**,
  and **random** rolls it again each time the level is played (summer an even chance of rain;
  winter snowy four times in five, sunny the fifth). A random level also rolls its wind, 30%
  in summer and 25% in winter. A Kitchen level has the weather of its level too, as
  decoration only: no grip, no wind, and Windy is always No.
  - Sunny summer : dry roads, normal grip.
  - Rainy summer : rain falls, the roads are wet and dark with puddles, and the car grips
    at 0.75 of normal.
  - Snowy winter : snow falls, and the car grips at 0.62 of normal, so it slides more and
    the handbrake bites harder.
  - Sunny winter : the old snow stays on the ground and the roofs, nothing falls, and the
    ploughed roads grip at 0.9 of normal.
  - The level card does not name the weather; the road and the sky show it.
  - Windy (Delivery only) : a crosswind drifts the bag on the toss, shown only by the dust
    and the tumbleweeds (no windsock, owner 2026-11-09), with telegraphed gusts that shove the car and
    tumbleweeds.

- Music : names the music.md section the level plays

- Level Card : `LEVEL n` over the date (month and year, for example `JULY 1972`), typed on
  letter by letter under the decade's three-colour stripe, on black. It moves on 2.0 s
  after the date finishes, and any key, click or tap skips it. It shows no menu, target,
  nav mode, roads line or prompt; the Kitchen menu is on the pause screen only

- Clearing : reach the difficulty's level target before the clock runs out (see
  difficulty.md). Then comes the LEVEL CLEAR card and the next level's card; after Level
  20, the victory card

## I. Level 1

- Sequence : 1

- Game Type : Delivery

- Name : SUMMER 1972

- Era : 1970s

- Music : 1972 - Delivery

- Difficulty : Easy

- Season : Summer

- Weather : Sunny

- Windy : No

## II. Level 2

- Sequence : 2

- Game Type : Kitchen

- Name : WINTER 1972

- Era : 1970s

- Music : 1972 - Kitchen

- Difficulty : Easy

- Season : Winter

- Weather : Snowy

- Windy : No

## III. Level 3

- Sequence : 3

- Game Type : Delivery

- Name : WINTER 1975

- Era : 1970s

- Music : 1975 - Delivery

- Difficulty : Easy

- Season : Winter

- Weather : Snowy

- Windy : No

## IV. Level 4

- Sequence : 4

- Game Type : Kitchen

- Name : SUMMER 1975

- Era : 1970s

- Music : 1975 - Kitchen

- Difficulty : Easy

- Season : Summer

- Weather : Sunny

- Windy : No

## V. Level 5

- Sequence : 5

- Game Type : Delivery

- Name : SUMMER 1978

- Era : 1970s

- Music : 1978 - Delivery

- Difficulty : Easy

- Season : Summer

- Weather : Sunny

- Windy : Yes

## VI. Level 6

- Sequence : 6

- Game Type : Kitchen

- Name : WINTER 1978

- Era : 1970s

- Music : 1978 - Kitchen

- Difficulty : Easy

- Season : Winter

- Weather : Snowy

- Windy : No

## VII. Level 7

- Sequence : 7

- Game Type : Delivery

- Name : SUMMER 1981

- Era : 1980s

- Music : 1981 - Delivery

- Difficulty : Medium

- Season : Summer

- Weather : Rainy

- Windy : No

## VIII. Level 8

- Sequence : 8

- Game Type : Kitchen

- Name : WINTER 1981

- Era : 1980s

- Music : 1981 - Kitchen

- Difficulty : Medium

- Season : Winter

- Weather : Snowy

- Windy : No

## IX. Level 9

- Sequence : 9

- Game Type : Delivery

- Name : WINTER 1984

- Era : 1980s

- Music : 1984 - Delivery

- Difficulty : Medium

- Season : Winter

- Weather : Snowy

- Windy : Yes

## X. Level 10

- Sequence : 10

- Game Type : Kitchen

- Name : SUMMER 1984

- Era : 1980s

- Music : 1984 - Kitchen

- Difficulty : Medium

- Season : Summer

- Weather : Rainy

- Windy : No

## XI. Level 11

- Sequence : 11

- Game Type : Delivery

- Name : SUMMER 1987

- Era : 1980s

- Music : 1987 - Delivery

- Difficulty : Medium

- Season : Summer

- Weather : Random

- Windy : No

## XII. Level 12

- Sequence : 12

- Game Type : Kitchen

- Name : WINTER 1987

- Era : 1980s

- Music : 1987 - Kitchen

- Difficulty : Medium

- Season : Winter

- Weather : Snowy

- Windy : No

## XIII. Level 13

- Sequence : 13

- Game Type : Delivery

- Name : SUMMER 1990

- Era : 1990s

- Music : 1990 - Delivery

- Difficulty : Hard

- Season : Summer

- Weather : Rainy

- Windy : Yes

## XIV. Level 14

- Sequence : 14

- Game Type : Kitchen

- Name : WINTER 1990

- Era : 1990s

- Music : 1990 - Kitchen

- Difficulty : Hard

- Season : Winter

- Weather : Snowy

- Windy : No

## XV. Level 15

- Sequence : 15

- Game Type : Delivery

- Name : WINTER 1993

- Era : 1990s

- Music : 1993 - Delivery

- Difficulty : Hard

- Season : Winter

- Weather : Snowy

- Windy : Yes

## XVI. Level 16

- Sequence : 16

- Game Type : Kitchen

- Name : SUMMER 1993

- Era : 1990s

- Music : 1993 - Kitchen

- Difficulty : Hard

- Season : Summer

- Weather : Rainy

- Windy : No

## XVII. Level 17

- Sequence : 17

- Game Type : Delivery

- Name : SUMMER 1996

- Era : 1990s

- Music : 1996 - Delivery

- Difficulty : Hard

- Season : Summer

- Weather : Random

- Windy : No

## XVIII. Level 18

- Sequence : 18

- Game Type : Kitchen

- Name : WINTER 1996

- Era : 1990s

- Music : 1996 - Kitchen

- Difficulty : Hard

- Season : Winter

- Weather : Snowy

- Windy : No

## XIX. Level 19

- Sequence : 19

- Game Type : Delivery

- Name : SUMMER 1999

- Era : 1990s

- Music : 1999 - Delivery

- Difficulty : Supreme

- Season : Summer

- Weather : Rainy

- Windy : Yes

## XX. Level 20

- Sequence : 20

- Game Type : Kitchen

- Name : WINTER 1999

- Era : 1990s

- Music : 1999 - Kitchen

- Difficulty : Supreme

- Season : Winter

- Weather : Snowy

- Windy : No
