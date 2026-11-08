/* Service Mode: push built content into the running game.
   Not an ES module and no imports: the vm tests run it as a plain script in the
   game's own context, and the browser loads it as a side-effect import. Either
   way the game's top-level consts (LEVELS, MENUS, ...) resolve as bare names.
   Everything here lives under Admin; nothing else is declared at top level. */
(function () {
  'use strict';
  const Admin = (globalThis.Admin = globalThis.Admin || {});

  /* built key -> the game's global, read lazily so a missing one is skipped */
  const TARGETS = {
    content: () => CONTENT, attract: () => ATTRACT, scores: () => SCORES, levels: () => LEVELS,
    difficulty: () => DIFFICULTY, menus: () => MENUS, dialogue: () => DIALOGUE, faces: () => FACES,
    lattice: () => LATTICE, music: () => MUSIC, playlist: () => PLAYLIST,
  };

  /* Replace in place: other modules hold these objects by reference. */
  function replaceInPlace(dst, src) {
    if (Array.isArray(dst)) { dst.length = 0; for (const v of src) dst.push(v); return; }
    for (const k of Object.keys(dst)) delete dst[k];
    for (const k of Object.keys(src)) dst[k] = src[k];
  }

  const refreshers = {};
  Admin.onApply = function (kind, fn) { (refreshers[kind] = refreshers[kind] || []).push(fn); };

  /* Which kinds differ, compared by value, then replace those in place and run
     their refreshers. Identical content is a no-op, so a keystroke that only
     touches one file does not make every panel think everything changed. */
  Admin.applyBuilt = function (built, game, opts) {
    /* G is a lexical const, not a property of globalThis: read it by bare name */
    game = game || (typeof G !== 'undefined' ? G : undefined);
    const skip = (opts && opts.skip) || [];
    const changed = [];
    for (const kind of Object.keys(TARGETS)) {
      if (!(kind in built) || skip.includes(kind)) continue;
      let dst;
      try { dst = TARGETS[kind](); } catch (e) { continue; }   // that global does not exist in this build
      if (dst == null) continue;
      if (JSON.stringify(dst) === JSON.stringify(built[kind])) continue;
      replaceInPlace(dst, built[kind]);
      changed.push(kind);
    }
    for (const kind of changed) for (const fn of refreshers[kind] || []) fn(built, game, changed);
    return changed;
  };

  const KITCHEN_STATES = ['card', 'kitchen', 'kdemo'];

  /* Re-enter the current screen from scratch, for edits the live state cannot
     absorb. A shift in progress goes back to its level card. */
  Admin.restartScreen = function (game) {
    const g = game || G;
    const n = g.levelN;
    switch (g.state) {
      case 'title': g.toTitle(); break;
      case 'winners': g.toWinners(); break;
      case 'scores': g.toScores(!!g.scoresFromShift); break;
      case 'demo': case 'kdemo': g.toDemo(n); break;
      case 'card': case 'play': case 'kitchen': case 'clear':
        g.setLevel(n); g.toCard(n); break;
      default: g.setLevel(n);                    // mode, over, entry, cont, victory: just re-point
    }
  };

  /* ---- the refreshers the shell itself needs ------------------------------ */

  /* G.level and G.diff are pointers into the content, and the content objects
     were replaced; point them at the new ones. */
  Admin.onApply('levels', function (built, game) {
    const old = game.level, now = game.levels()[game.levelN - 1];
    if (!now) return;
    game.level = now;
    const shape = (l) => l && [l.type, l.era, l.season, l.map, l.menu, l.year, l.difficulty].join();
    if (shape(old) !== shape(now)) Admin.restartScreen(game);
  });
  Admin.onApply('difficulty', function (built, game) {
    const d = DIFFICULTY[game.diffKey];
    if (!d) return;
    game.diff = d;
    game.nav = d.nav || game.nav;
    if (typeof Kitchen !== 'undefined' && Kitchen.diff && d.kitchen) Kitchen.diff = d.kitchen;
  });
  /* the kitchen keeps its own copy of the era's menu and builds bins from it */
  Admin.onApply('menus', function (built, game) {
    if (game.stage === 'kitchen' && KITCHEN_STATES.includes(game.state)) Admin.restartScreen(game);
  });
  Admin.onApply('playlist', function (built, game) {
    if (game.musicKey != null) game.playMusic(game.musicKey);
  });
  Admin.onApply('faces', function () { if (typeof Faces !== 'undefined') Faces.build(); });

  /* The attract screens set their countdown (and the title its beat) on entry,
     so an edit shows by re-entering the screen. The post-run board shares the
     'scores' state but is not an attract screen, and is left alone. */
  const ATTRACT_STATES = ['title', 'winners', 'demo', 'kdemo'];
  Admin.onApply('attract', function (built, game) {
    if (ATTRACT_STATES.includes(game.state) || (game.state === 'scores' && !game.scoresFromShift)) Admin.restartScreen(game);
  });
  /* the factory board is read into Scores.board by load(); a stored board,
     when there is one, still wins over it, as it does at boot */
  Admin.onApply('scores', function () { if (typeof Scores !== 'undefined') Scores.load(); });
})();
