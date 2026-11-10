# Every character's own lines, 13 moments (plan)

*2026-11-09. Owner rulings in chat: "each character just needs to have its own lines. There
shouldn't be any shared lines"; "let's get grittier and a little filthier, a little more adult";
"just occasionally let's have a couple characters that are kind of weirdly filthy"; and, on
Claude's proposed list, "Yes, go ahead with all 13 categories". Branch `insults`. Ships as
0.9.13 after the owner reviews the lines.*

## The 13 moments (`DLG_MOMENTS`)

| key | shift | when | trigger |
|---|---|---|---|
| `delivered` | delivery | on time, on the porch | `G.complete`, not perfect, not late |
| `perfect` | delivery | dead centre on the mat | `G.complete(perfect)`, not late (a rival still takes it 1 in 3) |
| `late` | delivery | tip run down | `G.complete`, late |
| `missed` | delivery | bag off the porch | `G.miss` |
| `nearmiss` | delivery | nearly ran a pedestrian down | a ped within `NEAR_PX` at speed, not hit; once per ped |
| `fender` | delivery | crunched another car | the traffic CRUNCH (relative speed > 55) |
| `arrive` | kitchen | new ticket | as today |
| `wait` | kitchen | patience under 30% | as today |
| `queue` | kitchen | line past 3 | as today |
| `wrong` | kitchen | wrong pick | every time the strip is free (93ff60d) |
| `served` | kitchen | ticket served | 35% as today, when not nailed |
| `nailed` | kitchen | clean ticket, served fast | clean and tip >= `NAILED_TIP` of max; always speaks |
| `walkout` | kitchen | patience gone | as today |

`nearmiss` and `fender` are said by a passer-by, not the order's customer: a face from the
era's cast at the level's year (`Kitchen.castFor`), kept per pedestrian, through `G.shout(kind,
face)`, which waits its turn (`SHOUT_GAP` seconds, and never over a line already showing).

## No shared lines

- `content/dialogue.json` keeps `who` (the speaker label), `people` and `cast`; the shared
  pools go. The best of them were adopted into single characters while writing.
- The validator refuses a shared pool key, and refuses any face that is cast in an era with no
  line for a moment (silence is the failure; 3 per moment is the authoring target, asserted in
  the tests for the shipped content).
- `G.lineFor(kind, face)` returns the face's own line or null. `pickLine`, `PERSONAL_ODDS` and
  `TROUBLE_KINDS` go. The era prefix (`2|`) was only for shared lines; personal lines never
  carry it.
- Service Mode's Dialogue tab loses its Shared sections (keeps `who`); each customer shows all
  13 moments. `dialogue.md` loses its Shared section (keeps Who) and lists 13 moments per face.

## Lines

3299 new lines by six writers (`scratchpad/lines2/BRIEF.md`), checked by the build's own rules,
read by Claude, then reviewed by the owner on a one-page sheet before the cut.
