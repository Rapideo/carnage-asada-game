/* ============================================================
   SCORES  --  the high-score board: factory content, storage, ranking
   ============================================================ */
'use strict';

/* Model only. Scores never touches a canvas and G never touches storage; the
   board is drawn by overlayScores/overlayEntry in 80_game.js. */

const SCORE_MAX = 10;                                 // places on the board
const INI_LEN = 3;                                    // characters in a set of initials
const INI_ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ ';      // 27, wraps both ways

const Scores = {
  KEY: 'tacoshop.scores.v1',
  board: [],
  stored: false,                    // did a stored board actually load this session?

  /* Storage is wrapped because reading it can THROW, not merely fail: Chrome
     treats a file:// page as an opaque origin and raises SecurityError on
     touch, and taco-shop.html is meant to be opened exactly that way. The
     headless harness has no localStorage at all and exercises the same path.
     A board that lives only in memory is a small loss; a game that will not
     boot from a file:// page is a total one. */
  _read() {
    try {
      if (typeof localStorage === 'undefined' || !localStorage) return null;
      return localStorage.getItem(this.KEY);
    } catch (e) { return null; }
  },
  _write(s) {
    try {
      if (typeof localStorage === 'undefined' || !localStorage) return false;
      localStorage.setItem(this.KEY, s);
      return true;
    } catch (e) { return false; }    // opaque origin, quota, or private mode
  },

  factory() {
    return SCORES.board.map((e) => ({ ini: String(e.ini).toUpperCase().slice(0, INI_LEN), cents: e.cents | 0 }));
  },

  valid(v) {
    return Array.isArray(v) && v.length > 0 && v.length <= SCORE_MAX &&
      v.every((e) => e && typeof e === 'object' &&
        typeof e.ini === 'string' && e.ini.length === INI_LEN &&
        Number.isInteger(e.cents) && e.cents >= 0);
  },

  /* Anything unexpected in storage is DISCARDED in favour of the factory
     board rather than repaired — a half-understood board is worse than a
     known one, and there is nothing here worth salvaging. */
  load() {
    this.board = this.factory();
    this.stored = false;
    const raw = this._read();
    if (raw) {
      let v = null;
      try { v = JSON.parse(raw); } catch (e) { v = null; }
      if (this.valid(v)) {
        this.board = v.map((e) => ({ ini: e.ini.toUpperCase(), cents: e.cents }));
        this.stored = true;
      }
    }
    this.sort();
    return this.board;
  },

  sort() {
    this.board.sort((a, b) => b.cents - a.cents);
    if (this.board.length > SCORE_MAX) this.board.length = SCORE_MAX;
  },

  save() { return this._write(JSON.stringify(this.board)); },

  lowest() { return this.board.length ? this.board[this.board.length - 1].cents : 0; },

  /* A shift that took nothing never places, however empty the board is. */
  qualifies(cents) {
    if (!(cents > 0)) return false;
    if (this.board.length < SCORE_MAX) return true;
    return cents > this.board[SCORE_MAX - 1].cents;
  },

  /* Returns the index it landed at, or -1 if it did not place. Ties go BELOW
     the incumbent: matching a score does not displace whoever got there first. */
  insert(ini, cents) {
    if (!this.qualifies(cents)) return -1;
    const e = { ini: String(ini).toUpperCase().slice(0, INI_LEN), cents: cents | 0 };
    let i = 0;
    while (i < this.board.length && this.board[i].cents >= e.cents) i++;
    this.board.splice(i, 0, e);
    if (this.board.length > SCORE_MAX) this.board.length = SCORE_MAX;
    this.save();
    return i;
  },
};
