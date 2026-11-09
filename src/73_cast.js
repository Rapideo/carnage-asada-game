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
     more than a second left is not talked over, and Cast.say says so by
     returning false, so the caller can fall back to the customer or say
     nothing. A friendly line yields to the cast.
*/
'use strict';

const RIVAL_ODDS = 1 / 3;            // a rival speaks instead of the customer on a miss or a perfect toss
const TROUBLE_QUEUE_ODDS = 0.5;      // a coworker replaces the customer's queue line
const CAST_SECS = 2.4;
const CAST_YIELD = 1;                // a hostile line this close to done may be replaced

/* which moments are hostile (a red name plate): the law and a taunt are; a
   lost pursuit and a rival's grudging praise are not */
const CAST_HOSTILE = { chase: true, fined: true, lost: false, missed: true, perfect: false,
  hint: false, clockin: false, streak: false, trouble: true };

const Cast = {
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
    if (Kitchen.demo) return false;
    if (Dialog.active && Dialog.hostile && DLG_RISE + Dialog.hold - Dialog.t > CAST_YIELD) return false;
    return true;
  },

  /** raise the strip for this role's character in the current era. Returns whether
      it spoke. opts: { vars, hostile, secs, sub } */
  say(role, moment, opts) {
    opts = opts || {};
    if (!this.free()) return false;
    const c = this.who(role, G.era);
    if (!c) return false;
    const line = this.line(c, moment, opts.vars);
    if (!line) return false;
    const hostile = opts.hostile != null ? !!opts.hostile : !!CAST_HOSTILE[moment];
    Dialog.say(c.name, line, {
      face: c.face,
      hostile: hostile,
      hood: hostile ? 3 : 1,
      sub: opts.sub || '',
      secs: opts.secs || CAST_SECS,
    });
    return true;
  },
};
