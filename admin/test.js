/* Service Mode: the Test panel's harness, Admin.test.
   Not an ES module and no imports, like apply.js: the vm tests run it as a
   plain script in the game's own context, and the browser loads it as a
   side-effect import. The game's top-level consts (G, Demo, Audio5, ...) are
   read by bare name, behind typeof where the game might not have them.

   Everything here is session state. Nothing is written to content, and a run
   touched by an override, the autopilot, the clock, a forced screen or added
   completions is marked G.testRun, which keeps it off the high-score board
   (timeUp, toVictory and commitEntry all read it). A plain jump to a level is
   not a test run on its own: it is what ?level= does in the shipped game. */
(function () {
  'use strict';
  const Admin = (globalThis.Admin = globalThis.Admin || {});

  const RUN = ['card', 'play', 'kitchen', 'clear'];           // a level is on screen
  const SHIFT = ['play', 'kitchen'];                          // ...and its clock is running
  const SPEED_MIN = 0.1, SPEED_MAX = 4;                       // 90_main runs at most 5 ticks a frame
  const SEASONS = ['summer', 'winter'];

  const game = () => G;
  const quiet = (g) => {                                      // what leaving a shift turns off
    if (typeof Audio5 !== 'undefined') { try { Audio5.engineOff(); Audio5.sirenOff(); } catch (e) { /* no audio */ } }
    if (typeof Nav !== 'undefined') Nav.clear();
    if (typeof Dialog !== 'undefined') Dialog.drop();
    g.cop = null;
  };
  const levelCount = (g) => g.levels().length;
  const clampInt = (v, lo, hi) => Math.max(lo, Math.min(hi, Math.round(Number(v))));

  /* ---- the clock freeze ----------------------------------------------------
     Held by wrapping G.update, so the shipped game needs no hook for it. A
     frame that ticks the clock down has it put back; a frame that raises it
     (an extension) keeps the new time, which is then what is held. Only
     within one shift: a frame that changes state (time up, level clear, a
     new card) is left alone. */
  let frozen = false;
  function installHold(g) {
    if (g.update && g.update.__clockHold) return;
    const orig = g.update;
    const held = function (dt) {
      const s0 = this.state, t0 = this.shift;
      const r = orig.call(this, dt);
      if (frozen && this.state === s0 && SHIFT.includes(s0) && this.shift < t0) this.shift = t0;
      return r;
    };
    held.__clockHold = true;
    held.__orig = orig;
    g.update = held;
  }

  const T = (Admin.test = {
    /* Jump to level n, on its card or straight into play. Always a new run
       from level n (startRun, which is toCard with the run reset), so a jump
       never carries one level's money into another; whether it is a test run
       is startRun's rule: an override set, or the autopilot on. */
    jump(n, where) {
      const g = game();
      n = clampInt(n, 1, levelCount(g));
      quiet(g);
      g.startRun(n);
      if (where === 'play') g.beginShift();
      return true;
    },

    /* { difficulty, era, season }: any of them, empty or unknown values
       dropped. None left is no override (G.test = null). A level on screen is
       restarted on its card so the override shows; otherwise the next
       setLevel picks it up. */
    setOverride(o) {
      const g = game(), t = {};
      o = o || {};
      const diffs = typeof DIFFICULTY !== 'undefined' ? Object.keys(DIFFICULTY).filter((k) => DIFFICULTY[k] && typeof DIFFICULTY[k] === 'object' && 'start' in DIFFICULTY[k]) : [];
      if (o.difficulty && diffs.includes(o.difficulty)) t.difficulty = o.difficulty;
      const era = Number(o.era);
      const eras = g.levels().map((l) => l.era);
      if (o.era !== '' && o.era != null && eras.includes(era)) t.era = era;
      if (SEASONS.includes(o.season)) t.season = o.season;
      g.test = Object.keys(t).length ? t : null;
      // set from any other state (attract, mode select), the next startRun sees G.test and marks the run
      if (g.test && RUN.concat(['over', 'cont', 'entry', 'victory']).includes(g.state)) g.testRun = true;
      if (RUN.includes(g.state)) {
        quiet(g);
        if (Admin.restartScreen) Admin.restartScreen(g); else g.toCard(g.levelN);
      }
      return g.test;
    },

    /* the bot at the controls; G.update resets the demo driver for the car */
    autopilot(on) {
      const g = game();
      g.autopilot = !!on;
      if (on) g.testRun = true;
      return g.autopilot;
    },

    attractFrom(screen) {
      const g = game();
      quiet(g);
      g.toTitle();
      if (screen === 'winners') g.toWinners();
      else if (screen === 'scores') g.toScores(false);
      else if (screen === 'demo') g.toDemo();
      return g.state;
    },

    /* a number of seconds sets the clock; 'freeze' holds it, 'thaw' lets it
       go. A frozen clock is unlimited time, so freezing is a test run too. */
    clock(v) {
      const g = game();
      if (v === 'freeze') { installHold(g); frozen = true; g.testRun = true; return true; }
      if (v === 'thaw') { frozen = false; return true; }
      const s = Number(v);
      if (!Number.isFinite(s) || s < 0) return false;
      g.shift = s;
      g.testRun = true;
      return true;
    },

    get frozen() { return frozen; },

    /* k completions through the same door every delivery and ticket uses */
    complete(k) {
      const g = game();
      const n = clampInt(k, 0, 99);
      g.testRun = true;
      for (let i = 0; i < n; i++) g.onComplete();
      return g.done;
    },

    /* the end-of-shift screens, reached the way the game reaches them */
    force(what) {
      const g = game();
      g.testRun = true;
      switch (what) {
        case 'over': g.timeUp(); break;
        case 'cont': if (SHIFT.includes(g.state)) g.timeUp(); quiet(g); g.toCont(); break;
        case 'entry': if (SHIFT.includes(g.state)) g.timeUp(); quiet(g); g.afterEntry = 'cont'; g.toEntry(); break;
        case 'victory': quiet(g); g.toVictory(); break;
        case 'clear': g.levelClear(); break;
        default: return false;
      }
      return g.state;
    },

    /* any speed but 1, a pause or a step is easier play (slow motion is the
       obvious cheat), so each makes the run a test run */
    speed(x) {
      const g = game(), s = Number(x);
      g.speed = Number.isFinite(s) && s > 0 ? Math.max(SPEED_MIN, Math.min(SPEED_MAX, s)) : 1;
      if (g.speed !== 1) g.testRun = true;
      return g.speed;
    },

    pause(on) {
      const g = game();
      g.testPaused = !!on;
      if (on) g.testRun = true;
      return g.testPaused;
    },

    /* one fixed step (or n), paused or not: the console bridge's step, which
       also renders; without it (the vm tests) the update alone */
    step(n) {
      const g = game(), k = n == null ? 1 : clampInt(n, 1, 600);
      g.testRun = true;
      const bridge = typeof window !== 'undefined' && window.TacoShop;
      if (bridge && typeof bridge.step === 'function') { bridge.step(k); return k; }
      for (let i = 0; i < k; i++) { g.update(1 / 60); if (typeof Input !== 'undefined') Input.endFrame(); }
      return k;
    },

    /* Reload with ?seed=n, other parameters kept. The city is built once at
       boot, so a new seed is a reload, and a reload discards unsaved edits:
       the confirm says how many. opts (for the tests): { dirty, confirm, go, href }. */
    seed(n, opts) {
      opts = opts || {};
      // Number('') is 0, so an empty box would reload with ?seed=0: refuse it
      if (n == null || (typeof n === 'string' && !/^\s*\d+\s*$/.test(n))) return false;
      const s = Number(n);
      if (!Number.isInteger(s) || s < 0) return false;
      const dirty = opts.dirty != null ? opts.dirty : (Admin.store && Admin.store.dirty ? Admin.store.dirty.size : 0);
      const msg = (dirty ? 'You have ' + dirty + ' unsaved edit' + (dirty === 1 ? '' : 's') + '. Reloading discards ' + (dirty === 1 ? 'it' : 'them') + '.\n\n' : '') +
                  'Reload the game with city seed ' + s + '?';
      const ask = opts.confirm || (typeof confirm === 'function' ? confirm : () => false);
      if (!ask(msg)) return false;
      const href = String(opts.href || location.href);
      const hash = href.indexOf('#') >= 0 ? href.slice(href.indexOf('#')) : '';
      const [path, query] = href.slice(0, href.length - hash.length).split('?');
      const q = new URLSearchParams(query || '');
      q.set('seed', String(s));
      const go = opts.go || ((u) => location.assign(u));
      go(path + '?' + q.toString() + hash);
      return true;
    },

    /* what the panel shows */
    status() {
      const g = game();
      return { state: g.state, levelN: g.levelN, shift: g.shift, frozen, speed: g.speed, paused: !!g.testPaused,
               autopilot: !!g.autopilot, test: g.test, testRun: !!g.testRun };
    },
  });
})();
