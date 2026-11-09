# Music library: three batches, songs placed like faces

*Design, 2026-11-09. From a conversation with the owner, who approved the mockup
(claude.ai artifact AGWykWZvSyJADwzkPfvYXT). Calls marked **(Claude's call)** were not the
owner's; everything else was. A builder read it before hand-over and found nothing that needed
the owner; its smaller points are folded in as Claude's calls.*

## Why

The owner drops MIDI files into the library folder and wants to curate the game's music from
Service Mode without hand-building playlists: convert a file, listen to it as the game plays
it, approve it into the game, and say *when* it may play. Faces already work this way (a
decade's crowd, each face arriving from a year), and the owner wants songs to work the same:
"songs last the entire decade but they're just not released or just don't appear until maybe
a later year."

Success: a new MIDI goes from the folder to playing in the right levels in a few clicks, with
no file edited by hand, and today's game sounds the same on day one.

## Goals

1. **Three batches in the Music tab**, switched by three counters at the top:
   - **Not converted:** every MIDI under `reference/assets/midi/` (subfolders included) that no
     song is made from yet. Each has **Convert…**, which is today's Port: it asks for title,
     artist, release month and year (and an id, defaulting from the title) and runs
     `tools/music/midi2song.mjs` on the server.
   - **Converted:** songs that exist in `content/music/` but are not approved. Each has
     **Listen** (through the game's own player, as today), **Approve…** and **Delete**.
   - **In game:** approved songs, grouped by decade. Each shows its shift and its "from" year,
     both editable in place, with **Listen** and **Take out**.
2. **Approving a song places it** with three choices:
   - a **decade**: '70s (levels 1-6), '80s (7-12) or '90s (13-20);
   - a **shift**: Delivery, Kitchen or Both. The owner kept the existing split: delivery levels
     get upbeat, fast songs; kitchen levels get mellow or solo-danceable ones;
   - a **"from" year**: "from the start" or one of the years that decade's levels are set in
     (1972 / 1975 / 1978, 1981 / 1984 / 1987, 1990 / 1993 / 1996 / 1999), exactly as the Faces
     tab does for a face.
3. **A level plays every approved song that fits it, shuffled fresh each play:** its decade,
   its shift (or Both), and a "from" year at or before the level's year. The list loops as
   lists do today.
4. **Take out** returns a song to Converted with its conversion intact, ready to approve again.
   **Delete** removes a converted, unapproved song's file and its `tools/music/songs.json`
   entry, so its MIDI returns to Not converted.
5. **Day one has the same songs.** Today's 40 level songs start out approved, each in the
   decade, shift and from-year of the level it plays on now (the mockup's In game view shows the
   result; no song is on both shifts today, so none starts as Both). Songs from just before a
   decade sit at its start: Don't Bring Me Down (1979) is '80s from the start. *Same songs, not
   the same list per level:* songs now pile up through a decade, so Level 6 shuffles all six
   '70s kitchen songs where it plays two today. That is the rule the owner asked for ("songs
   last the entire decade"), and the mockup's year strip (4, 8, 12) showed it.

## Non-goals

- Choosing a folder other than `reference/assets/midi/` (owner: "we'll just leave it").
- Uploading MIDIs from the browser; files arrive by being copied into the folder.
- Listening before converting. Converting is cheap and reversible (Delete), so the Converted
  batch is the preview.
- Hand-ordered per-level playlists. They go away.

## Anti-goals (would make this a failure even if it worked)

- **A silent level.** Every level must have at least one song for its shift and year.
- **A song before its time.** A song never plays before its release year.
- **Breaking the shipped single file.** The game still reads only what `build.mjs` inlines; no
  runtime fetch, and no Service Mode code in `taco-shop.html`.
- **Losing work.** Take out and Delete must never touch an approved song's file, and no action
  overwrites an existing song id.

## Rules that change

- **The "no more than two years older" window goes** (`MUSIC_LOOKBACK`, `songEligible`): a
  song lasts the rest of its decade once its year arrives.
- **The release-month warning goes** (`musicWarnings`, the Music tab's month flags, the
  owner's 2026-11-07 ruling and the Level 3 / Level 16 exceptions). The "from" year decides
  when a song plays. **(Claude's call)**
- Songs keep their `month` field; it is still required on a song, for the record.

## Data

**(Claude's call)** `content/music/playlist.json` is replaced by a file shaped like
`content/casts.json`, e.g. `content/music/approved.json`:

```json
{
  "_comment": "…",
  "title": ["one-step-beyond", "reelin-in-the-years"],
  "1": { "delivery": ["immigrant-song", "…"], "kitchen": ["walk-on-the-wild-side", "…"] },
  "2": { "delivery": [], "kitchen": [] },
  "3": { "delivery": [], "kitchen": [] },
  "from": { "kashmir": 1975, "peg": 1978 }
}
```

- A song approved for Both appears in both lists of its decade. A song belongs to one decade.
  **(Claude's call)**
- No `from` entry means "from the start". The validator refuses a `from` year that is not one
  of the decade's level years, a `from` (or decade start) earlier than the song's release year,
  an id with no song file, a song in two decades, and any level whose shift pool has no song
  by its year.
- A song in `content/music/` that no list names is **Converted**; a MIDI no
  `tools/music/songs.json` entry names is **Not converted**.
- **The title screen keeps its own hand-ordered list** (it has no year), edited as today at the
  bottom of In game. **(Claude's call)** Title songs count as in game, not Converted. Any
  converted song may go on the title list, and a title song may also be approved into a decade.
- There is no floor on how old a song may be for its decade. **(Claude's call)**
- Take out drops the song's `from` entry with it. The approved file's name is reserved as a
  song id, as `playlist` is today.

## In the game

Every converted song is still inlined into `MUSIC` (about 3.6 KB a song), so Service Mode can
Listen to an unapproved one through the shipped player. **(Claude's call)**

**(Claude's call)** `build.mjs` keeps emitting `PLAYLIST` with the same keys (`title`, `1`..`20`),
but a level's list is now *every eligible song*, computed by the validator from the approved
file and `levels.json`. `src/22_music.js` is unchanged. `G.playMusic(n)` shuffles a level's list
(a fresh order per play) before `Music.playList`; the title list stays in order. `playMusic`
is also called on the audio unlock, on Stop after Listen and by Service Mode's playlist
refresher, so it reshuffles only when the key or the set of songs changes; otherwise an edit
in Service Mode would restart the music. **(Claude's call)**
Service Mode's `Admin.applyBuilt` keeps working because the built shape is unchanged.

Bohemian Rhapsody arrives as two songs (the opera and rock sections). Shuffled, they may play
apart or out of order. **(Claude's call: accepted)**

## Service Mode

As in the mockup:
- the three counters (Not converted / Converted / In game) with live counts;
- In game per decade: a strip counting, per level year, how many songs each shift shuffles,
  and the songs with shift and from selects (years before a song's release greyed out, as the
  mockup does for Kashmir);
- a new server route to Delete a converted, unapproved song, under the same Host/Origin
  checks and lock as Port. It checks the approved file *on disk*, so it refuses a song that is
  approved, on the title list, or taken out but not yet saved; it also removes the song's
  preview `.wav` in `tools/music/preview/` if there is one;
- Save writes the approved file and the regenerated `music.md` together, as every save does.

## Docs and tests

- `docs/authored content/music.md` stays generated; its renderer (`tools/content/docs/music.mjs`)
  is rewritten for the new file (per decade and shift: the songs and their from years, then the
  title list), keeping prose as the mirror does. The 2026-10-25 note on mood ("delivery upbeat,
  kitchen mellow") stays as prose.
- `test/headless.mjs`: every level has a non-empty, eligible list; no song plays before its
  release or "from" year; shuffling changes the order but not the set; the title list is
  unshuffled.
- `test/admin.mjs`: the validator rules above; the panel's three views and counts; Approve,
  Take out, Delete and their refusals; the docs mirror; the artifact still has no Service Mode.
- `tools/music/check-music.mjs` keeps passing.
- `CLAUDE.md` (the Service Mode section's "Release months are advice" bullet) and `docs/gdd.md`
  (the music rule) are updated to the new rule.

## Left to the builder

The approved file's exact name and comment text, the panel's code structure, how the
migration from `playlist.json` is run (a one-off script is fine), the Delete route's path, and
the music.md layout within the shape above.
