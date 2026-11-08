# Dialogue and the speaking cast: design

**Owner rulings, 2026-11-08** (in conversation). Everything below marked *Claude's call* is a
builder's decision the owner can overrule; everything else is the owner's.

## Intent

The game has one pool of 85 customer lines that any face can say. The owner wants a town of
individuals: every customer face gets lines of its own, the speaking cast (officers, rivals,
coworkers) is wired in and talks, and the 670 unused lines in `Migrated/` all find a speaker.

## The three kinds of line

1. **Shared ("the standard").** The 85 lines in `content/dialogue.json` today, under the nine
   customer moments (`delivered missed late arrive wait queue walkout served wrong`). Any
   customer may say them. All are kept; each is re-checked to sit under the most fitting moment.
   Era prefixes (`2|`, `3|`) keep working.
2. **Personal.** Lines that belong to one customer face, under the same nine moments. Source: all
   670 lines of `Migrated/angry-customer-lines-vol1.md` and `vol2.md` not already used (the
   `taco-shop-angry-dialogue*.md` files are byte-identical copies). Each line is attributed to the
   single most fitting face among the 120 customers (by the character's look, age and decade) and
   to the most fitting moment.
   - **Anachronisms are removed:** a reference from after the speaker's decade is swapped for a
     period one (Yelp becomes the newspaper); a line that cannot be saved that way is reworded.
   - **Accents are kept only where they fit the character;** otherwise the line keeps its joke and
     loses the put-on spelling.
   - **Language is left as written.**
   - A personal line has no era prefix: it belongs to a face, and the face belongs to a decade.
3. **Cast.** The nine named non-customer characters and their lines (the 135 drafts in the
   Casting Call review page, all kept):

   | | '70s | '80s | '90s | moments |
   |---|---|---|---|---|
   | Officer | SGT. PFEIFER | OFC. KARLIN | OFC. DREILING | chase, fined, lost |
   | Rival | DUSTY | ACE | JINX | missed, perfect |
   | Coworker | MARGE | DALE | NIKKI | hint, clockin, streak, trouble |

   A coworker `hint` line carries `{ING}`, replaced by the next bin's plate name (at most 7
   letters: LETTUCE, PEPPERS, CHICKEN).

## Choosing a line

- A customer with personal lines for the moment says one of them **about 3 times in 4**,
  otherwise a shared line; with none for that moment, always a shared line.
- The speaker's name on the strip is CUSTOMER for customers and the character's name for the cast.

## Length: two rows

- A line may wrap to **two rows** in the speech bubble, at word breaks; one row is still the norm
  for short lines.
- The build checks every row against the bubble's real width (beside the widest face), and
  refuses a line that needs three rows or has a word too wide for one row. Nothing may overflow.
- About 34 of the 670 do not fit two rows as written; those are trimmed, keeping the joke.

## When the cast speaks

- **Officer (Delivery):** when a chase starts (the cruiser spawns); when you are fined for what
  they police (pulled over, or hitting a pedestrian; running a crossing gate costs heat, not a
  fine, so it is not a moment); when you lose them (they give up, or the train takes the cruiser).
- **Rival (Delivery, voice only):** on your missed toss and your perfect toss, instead of the
  customer about 1 time in 3 (*Claude's call*: two people talking over one moment reads as noise).
- **Coworker (Kitchen):**
  - **hint**: when the next-ingredient hint fires (below), saying which bin;
  - **clockin**: as the Kitchen Shift starts;
  - **streak**: after 3 clean tickets in a row (*Claude's call*: the count resets after the line);
  - **trouble**: once a shift when the clock first drops under 0:30, and when the line backs up
    (instead of the customer's queue line about 1 time in 2, *Claude's call*).
- The cast never speaks in attract mode or the demo, as customers do not.

## The next-ingredient hint (from the 2026-11-08 roadmap ruling, built here because the coworker voices it)

- The right bin blinks briefly to show what comes next, **after a stall** (no pick for the stall
  delay while an item is being built) **and after a wrong pick**.
- **Easy:** always. **Medium:** only for dishes new to the decade's menu (not on the previous
  decade's menu, or with a changed recipe). **Hard, Supreme:** off.
- Per difficulty in `content/difficulty.json` and Service Mode's Difficulty tab: on/off,
  new-dishes-only, and the stall delay (3 seconds on Easy and Medium). No player switch.
- It replaces today's `kitchen.hint` (a flash after a wrong pick, Easy only).
- The hinted bin must stay visible while the coworker speaks over the strip (*Claude's call*: draw
  the hint plate above the strip when it would be covered).

## The cast portraits

The art director's nine approved portraits (`reference/faces/cast/`) are baked as faces at the
customers' bust size (60x74), keeping their reserved colours per `crop-guide.json`: the olive
cactus on the rivals' caps (14 body colours + ink + the accent), the jade `#1fa37e` and gold
`#f3bd46` on the staff (13 + ink + 2). Eyes are set by hand later in Service Mode, as for the
104 new customers.

## Editing

- `content/dialogue.json` stays the master copy. Service Mode's Dialogue tab gains a character
  picker: Shared, each cast character, and each customer face, each showing its lines by moment.
- `docs/authored content/dialogue.md` mirrors it, grouped: Shared, The cast, Customers.

## Before it ships

The owner sees a proof of the nine cast portraits in the strip, and a readable list of every
speaker and their lines (the Casting Call review page), before the work is merged.

## Not in scope

The rival as a car in the city; regulars across decades; setting eyes on the new faces.
