/* TEST ARTEFACT -- NOT A DECISION

   The cast, as data. One entry per character.

   This file exists because of what the first four faces got wrong: they shared
   `HEAD`, so they were one person in four shirts. A character's SKULL is the
   thing you recognise them by, so a character is not a colour scheme -- it is
   a silhouette, a set of feature rows, and then colours.

   Adding a character means adding an entry here and nothing else. If you find
   yourself editing portrait.mjs to fit a new face, the parameter you want is
   missing -- add the parameter, do not special-case the character.

   Skull rows are [left, right] of centre, in head rows from the crown. A plain
   number means symmetric. A 3/4 view is asymmetric by nature: the near cheek
   shows and the far side foreshortens.
*/
import { E } from '../../tools/render/engine.mjs';
import smokerBust from './faces/smokerbust.mjs';
import smokerHead from './faces/smoker.mjs';
const { PAL } = E;

/* Two kinds of entry live here, and the difference is which one is REAL:

   `baked`  -- the likeness is a decoded pixel table (faces/*.mjs), and the
               parameters only drive variation on top. This is what ships.
   `skull`  -- the likeness is drawn from parameters by portrait.mjs.

   The parametric route is kept for CLASSIC, and for `smokerParam` below, which
   exists purely so the two can be rendered side by side. It lost: a routine
   that composes axis-aligned rectangles cannot make a likeness at 44px, and
   the comparison is more convincing than the explanation. See facedata.mjs. */

/* ---- SMOKER ----------------------------------------------
   Traced from reference art, 2026-08-24. Gaunt, long-jawed, turned about a
   third away to his right, so we see his left ear and almost none of the
   other side of his face. Heavy lids and a cigarette do the characterising;
   he has no readable mouth, which is deliberate and is also the reason his
   expressions have to run on brows and lids alone. */
const SMOKER_SKULL = [
  [6, 5], [9, 8], [12, 10], [14, 11], [15, 12], [16, 12], [16, 13], [17, 13],
  [17, 13], [17, 13], [17, 13], [17, 13], [17, 13], [17, 13], [17, 13], [17, 13],
  [17, 13], [17, 13], [17, 12], [16, 12], [16, 12], [16, 12], [16, 11], [16, 11],
  [16, 11], [15, 11], [15, 11], [15, 10], [14, 10], [14, 10], [14, 10], [14, 10],
  [13, 10], [13, 9], [13, 9], [13, 9], [12, 9], [12, 8], [11, 8], [11, 7],
  [10, 7], [9, 6], [7, 5], [6, 4], [4, 3],
];

export const CAST = {
  smoker: {
    name: 'SMOKER',
    /* The BUST, not the floating head. A bust squeezed into the 56x56 box
       drops the face from 33px wide to 24px, which is inside the dead zone --
       so the box grows instead and the portrait overhangs the strip upward.
       Costs ~1.6% more of the screen while a line is up, and 1.2 KB more of
       source, for a character who has shoulders, a collar and a jacket. */
    baked: smokerBust,
    eyes: smokerBust.eyes,      // override if a re-bake guesses wrong
    skin: smokerBust.skin,
  },
};

/* the same character as a floating head, kept for the size comparison */
export const SMOKER_HEAD = { name: 'SMOKER / HEAD', baked: smokerHead,
                             eyes: smokerHead.eyes, skin: smokerHead.skin };

/* superseded -- kept only as the other half of the comparison in face.mjs */
export const SMOKER_PARAM = {
    name: 'SMOKER / PARAM',
    skull: SMOKER_SKULL,
    skin: '#d9a66e',
    hair: '#4c3423',
    eyes: '#3a2a1e',
    shirt: '#4a5230',            // the olive jacket, for the bust variant
    locs: true, locsN: 17, locsCap: 10,   // cap low: a tall bare forehead
                                          // is the main thing that read wrong
    gaunt: true,                 // hollow under the cheekbone
    hood: 2,                     // heavy-lidded: the whole read of the face
    browH: 2,
    cig: true, cigDX: -3, cigDY: 1,
    ears: [1],                   // turned away: only the far ear is visible
    earW: 7,
    noseDX: -2,                  // features shift toward the turn
    /* Pushing brow/eye/nose further down was tried and reverted: at 45 rows
       the brow then lands on the hairline and the two dark masses merge into
       one band across the face. The default rows are where they are because
       they work; what a gaunt face needs is NARROWER features, not lower. */
    feat: {
      eyeOut: 15, eyeIn: 3, eyeWR: 7,
      noseTop: 25, noseBaseW: 9,
      mouth: 36, mouthW: 13, cheek: 29, earTop: 22,
    },
    mood: 'flat',
    seed: 41,
};

/* the original face, kept so a regression in the shared drawing code is
   visible rather than inferred -- it is the only thing with a known-good look */
export const CLASSIC = {
  name: 'CLASSIC',
  skin: '#d9a273', hair: '#6b4630', eyes: '#4a7fb5', shirt: PAL.roofC,
  mood: 'glad', seed: 11,
};
