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
    difficulty: () => DIFFICULTY, menus: () => MENUS, dialogue: () => DIALOGUE, faces: () => FACES, casts: () => CASTS,
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
    const old = game.level, raw = game.levels()[game.levelN - 1];
    if (!raw) return;
    /* with a Test panel override set, G.level is the overridden copy: compare like with like */
    const now = typeof game.testLevel === 'function' ? game.testLevel(raw) : raw;
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
  /* The kitchen keeps its own copy of the era's menu and builds bins from it,
     so an edit to its era restarts the screen, with the wells decoded afresh
     for any bin that changed. An edit to another era's menu only re-points
     that copy at the new content: no restart per keystroke for a menu that is
     not on screen. */
  Admin.onApply('menus', function (built, game) {
    if (game.stage !== 'kitchen') return;
    const K = typeof Kitchen !== 'undefined' ? Kitchen : null;
    if (K) K.buildWells();
    const now = K && K.menu && typeof MENUS !== 'undefined' ? MENUS[K.era] : null;
    if (now && JSON.stringify(now) === JSON.stringify(K.menu)) { K.menu = now; return; }
    if (KITCHEN_STATES.includes(game.state)) Admin.restartScreen(game);
  });
  /* a new well (a recolour in the Menu panel) is decoded as soon as it exists */
  Admin.onApply('lattice', function () { if (typeof Kitchen !== 'undefined' && Kitchen.wells) Kitchen.buildWells(); });
  /* If the edited list is the one playing, it is put on afresh: a list that
     shrank under the song it was on starts again from its first. Music.playList
     ignores a list identical to the one playing, so an edit to any other list
     changes nothing. While a song is being listened to, G.playMusic only
     records the key (Admin.music below), so the edit waits for Stop. */
  Admin.onApply('playlist', function (built, game) {
    if (game.musicKey != null) game.playMusic(game.musicKey);
  });

  /* Listen (the Music panel): one song through the game's own player, Music
     through Audio5.musBus, so what is heard is what ships. The level or
     attract music is released for it; while it plays, the game's own calls to
     G.playMusic (a new screen, the audio unlock, a playlist edit) only record
     the key, so the song is not cut off. Stop restores the music through
     G.playMusic of the current key. */
  Admin.music = {
    listening: null,
    _game: null, _orig: null,
    listen(id, game) {
      const g = game || (typeof G !== 'undefined' ? G : undefined);
      if (typeof Music === 'undefined' || !Music.has(id)) return false;
      if (typeof Audio5 !== 'undefined' && Audio5.init) { try { Audio5.init(); Audio5.resume(); } catch (e) { /* no WebAudio here */ } }
      /* the game's music is handed over only once the song is actually on:
         a play that fails leaves everything as it was */
      if (!Music.play(id)) return false;
      if (g && !this._orig) {
        this._game = g; this._orig = g.playMusic;
        g.playMusic = function (key) { this.musicKey = key; };
      }
      this.listening = id;
      return true;
    },
    /* also called when the Music tab is left or the overlay is closed (the
       tab's leave hook), so the stub never outlives the panel */
    stop() {
      if (!this.listening && !this._orig) return;
      const g = this._game, orig = this._orig;
      this.listening = null; this._game = null; this._orig = null;
      if (typeof Music !== 'undefined') Music.stop();
      if (g && orig) {
        g.playMusic = orig;
        if (g.musicKey != null) g.playMusic(g.musicKey);
      }
    },
  };
  /* Faces are decoded afresh. A face that is talking, or that a customer in
     the kitchen holds, and is no longer in FACES falls back to DLG_FACE: the
     strip would otherwise draw an empty box. (Kitchen.castFor reads CASTS
     live, so a cast edit needs no refresher.) */
  Admin.onApply('faces', function () {
    if (typeof Faces !== 'undefined') Faces.build();
    if (typeof FACES === 'undefined' || typeof DLG_FACE === 'undefined') return;
    if (typeof Dialog !== 'undefined' && Dialog.face && !FACES[Dialog.face]) Dialog.face = DLG_FACE;
    if (typeof Kitchen !== 'undefined') {
      for (const t of [].concat(Kitchen.tickets || [], Kitchen.queue || [])) if (t && t.cust && t.cust.face && !FACES[t.cust.face]) t.cust.face = DLG_FACE;
    }
  });

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
