/* ============================================================
   THE CAST -- the people who are not the customer
   ============================================================

   Officers chase and fine you, rivals taunt a miss or a perfect toss, and the
   coworkers speak in the kitchen. They are in content/dialogue.json under
   `cast` (DIALOGUE.cast), one entry per character, each placed in an era.

   They speak over the same dialogue strip the customer does, so there are
   rules about who gets it:
   - never in attract mode or either demo: a talking head over the shop window
     reads as a cutscene, and the demo would have the cops chatting at nobody;
   - one line at a time. A hostile line (a walkout, a complaint, a cop) with
     more than a second left is not replaced by the cast: Cast.say returns
     false, so the caller can fall back to the customer or say nothing. A
     friendly line yields to the cast. (The customer's own hostile barks, a
     walkout and G.react are not gated by this and may cut a cast line short.)
*/
'use strict';

const RIVAL_ODDS = 1 / 3;            // a rival speaks instead of the customer on a miss or a perfect toss
const TROUBLE_QUEUE_ODDS = 0.5;      // a coworker replaces the customer's queue line
const CAST_SECS = 2.4;
const CAST_ROW_SECS = 1;             // each extra row of a line holds the strip this much longer
const CAST_YIELD = 1;                // a hostile line this close to done may be replaced

/* which moments are hostile (a red name plate): the law and a taunt are; a
   lost pursuit and a rival's grudging praise are not */
const CAST_HOSTILE = { chase: true, fined: true, lost: false, missed: true, perfect: false,
  hint: false, clockin: false, streak: false, trouble: true };

const Cast = {
  /* The coworker talks a little, not all shift (owner, 2026-11-09: "only say
     something every 4 or 5 times a shift"). At most COWORKER_MAX lines a shift,
     COWORKER_GAP seconds apart, and the clock-in opens only some levels
     (CLOCKIN_ODDS). The hint's blinking bin is untouched: only its spoken line
     is held to the budget. Kitchen.reset calls resetCoworker each shift. */
  COWORKER_MAX: 5, COWORKER_GAP: 20, CLOCKIN_ODDS: 0.5,
  coN: 0, coAt: -1e9,
  resetCoworker() { this.coN = 0; this.coAt = -1e9; },
  /** whether the coworker may speak now, by the per-shift budget */
  coworkerOk() {
    const t = typeof Kitchen !== 'undefined' ? Kitchen.shiftT : 0;
    return this.coN < this.COWORKER_MAX && t - this.coAt >= this.COWORKER_GAP;
  },

  /** the character of this role in this era, or null */
  who(role, era) {
    if (typeof DIALOGUE === 'undefined' || !DIALOGUE.cast) return null;
    for (const k of Object.keys(DIALOGUE.cast)) {
      const c = DIALOGUE.cast[k];
      if (c.role === role && c.era === era) return c;
    }
    return null;
  },

  /** one line for a moment, with {ING} filled in from vars; null when there is none */
  line(entry, moment, vars) {
    const list = entry && entry.lines && entry.lines[moment];
    if (!list || !list.length) return null;
    const s = list[(Math.random() * list.length) | 0];
    return vars && vars.ING != null ? s.split('{ING}').join(vars.ING) : s;
  },

  /** whether a cast member's line is on the strip right now */
  showing() {
    if (!Dialog.active || typeof DIALOGUE === 'undefined' || !DIALOGUE.cast) return false;
    for (const k of Object.keys(DIALOGUE.cast)) if (DIALOGUE.cast[k].name === Dialog.who) return true;
    return false;
  },

  /** whether the strip may be taken now */
  free() {
    if (G.state !== 'play' && G.state !== 'kitchen') return false;
    if (G.state === 'kitchen' && Kitchen.demo) return false;     // Kitchen.demo can be stale outside a kitchen level
    if (Dialog.active && Dialog.hostile && DLG_RISE + Dialog.hold - Dialog.t > CAST_YIELD) return false;
    return true;
  },

  /** raise the strip for this role's character in the current era. Returns whether
      it spoke. opts: { vars, hostile, secs, sub } */
  say(role, moment, opts) {
    opts = opts || {};
    if (!this.free()) return false;
    if (role === 'coworker' && !this.coworkerOk()) return false;
    const c = this.who(role, G.era);
    if (!c) return false;
    const line = this.line(c, moment, opts.vars);
    if (!line) return false;
    const rows = Math.max(1, Dialog.wrap(line, c.face).length);
    const hostile = opts.hostile != null ? !!opts.hostile : !!CAST_HOSTILE[moment];
    Dialog.say(c.name, line, {
      face: c.face,
      hostile: hostile,
      hood: hostile ? 3 : 1,
      sub: opts.sub || '',
      secs: opts.secs || (CAST_SECS + (rows - 1) * CAST_ROW_SECS),
    });
    if (role === 'coworker') { this.coN++; this.coAt = typeof Kitchen !== 'undefined' ? Kitchen.shiftT : 0; }
    return true;
  },
};
