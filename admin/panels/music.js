/* Service Mode: the Music panel. Three parts.

   Now playing    what Listen is playing, and Stop.
   Library        every MIDI in reference/assets/midi/ (GET /admin/api/midis).
                  A ported one shows its songs (title, artist, year) with
                  Listen. Listen plays the song through the game's own player
                  (Admin.music.listen in admin/apply.js: Music through
                  Audio5.musBus, so what is heard is what ships), releasing the
                  attract or level music, which Stop restores. An unported one
                  shows its filename and Port, which asks for the title, artist,
                  release year and month (and an id, from the title when left
                  empty) and runs midi2song.mjs on the server (POST
                  /admin/api/port). The song is written at once, to
                  content/music/<id>.json and tools/music/songs.json, inert until
                  a saved playlist names it, and never over an existing id.
   Playlists      the title's list, then one per level 1-20, any length: add,
                  remove, and reorder by dragging a song (or with the arrows).
                  The picker asks validate.mjs's songEligible, the build's own
                  rule. The year window greys a song out and says why: a level
                  plays songs from its own year or up to MUSIC_LOOKBACK years
                  before, never after. The release month only warns (owner,
                  2026-11-07): a same-year song released after the level's
                  month (levelMonth: summer July, winter January or December
                  by level order) can be picked, and says so in the picker and
                  on its row. The title has no year.

   Game consts (G, Music) are reached through Admin.music, never globalThis.
   The playlist refresher lives in admin/apply.js. */
import '../fields.js';
import { store } from '../store.js';
import { levelMonth, MONTHS } from '../../tools/content/validate.mjs';
/* interim (music-library Task 1): the old window, until Task 5 rewrites this panel */
const MUSIC_LOOKBACK = 2, songEligible = () => ({ ok: true });

const Admin = (globalThis.Admin = globalThis.Admin || {});
const PL = 'music/playlist.json';
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

let panel = null;
let lib = null;             // [{ file, ids }] from the server, or { error }
let loading = false;
let filter = '';
let open = null;            // the MIDI whose Port form is open
let libMsg = '';
let nowMsg = '';
let dragFrom = null;        // { k, j } while a song is dragged
const forms = {};           // file -> the Port form's state

const h = (doc, tag, cls, text) => { const n = doc.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
const btn = (doc, text, act, title) => { const b = h(doc, 'button', 'adm-show', text); b.type = 'button'; b.dataset.act = act; if (title) b.title = title; return b; };
const game = () => (typeof G !== 'undefined' ? G : undefined);
const redraw = () => {
  if (!panel) return;
  const sc = panel.parentNode, top = sc && typeof sc.scrollTop === 'number' ? sc.scrollTop : null;
  draw(panel);
  if (top !== null) sc.scrollTop = top;
};

/* ---- the content ------------------------------------------------------------ */

function songs() {
  const o = {};
  for (const [rel, s] of Object.entries(store.files)) if (/^music\/[^/]+\.json$/.test(rel) && rel !== PL && s) o[rel.slice(6, -5)] = s;
  return o;
}
const label = (s) => s.title + ' - ' + s.artist + ' (' + s.year + ')';
const levels = () => ((store.files['levels.json'] || {}).levels || []).slice().sort((a, b) => a.n - b.n);
const raw = () => store.files[PL] || {};
/* the file is { "1": [...], ..., "title": [...] }, or { levels: {...}, title }: both validate */
const nested = () => !!(raw().levels && typeof raw().levels === 'object' && !Array.isArray(raw().levels));
const pathOf = (k) => (nested() && k !== 'title' ? ['levels', k] : [k]);
const listOf = (k) => { const l = store.get(PL, pathOf(k)); return Array.isArray(l) ? l : []; };
const setList = (k, arr) => { store.set(PL, pathOf(k), arr); redraw(); };
export const slug = (t) => String(t).toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/* may list k play this song? { ok, why?, warn? } from songEligible, against
   the working copy's levels in order. The title takes anything. */
export function eligible(song, k) {
  if (k === 'title' || !song) return { ok: true };
  const L = levels(), i = L.findIndex((l) => String(l.n) === String(k));
  return i < 0 ? { ok: true } : songEligible(song, L, i);
}
const monthOf = (k) => { const L = levels(), i = L.findIndex((l) => String(l.n) === String(k)); return i < 0 ? null : MONTHS[levelMonth(L, i) - 1]; };

/* the working copy into the running game, music table and all: a ported song
   has to be in MUSIC before Listen can play it */
function applyNow() {
  const v = store.validate();
  if (v.built && Admin.applyBuilt) {
    try { Admin.applyBuilt(v.built, game(), { skip: ['faces', 'lattice'] }); store.applyError = null; } catch (x) { store.applyError = x; }
  }
  store.emit();
}

/* ---- now playing ------------------------------------------------------------- */

function listen(id) {
  const M = Admin.music;
  if (!M || typeof M.listen !== 'function') nowMsg = 'the game is not running here, so nothing can play';
  else if (!M.listen(id)) nowMsg = id + ' is not in the game\'s music yet';
  else nowMsg = '';
  redraw();
}
function stop() { if (Admin.music && typeof Admin.music.stop === 'function') Admin.music.stop(); nowMsg = ''; redraw(); }

function nowSection(doc, el) {
  const sec = h(doc, 'div', 'adm-screen');
  sec.dataset.section = 'now';
  const id = Admin.music && Admin.music.listening, s = id && songs()[id];
  if (id) {
    const row = h(doc, 'div', 'adm-now');
    row.append(h(doc, 'span', null, 'Listening: ' + (s ? label(s) : id)));
    const st = btn(doc, 'Stop', 'stop', 'stop, and put the level or attract music back');
    st.addEventListener('click', stop);
    row.appendChild(st);
    sec.appendChild(row);
  } else sec.appendChild(h(doc, 'p', 'adm-note', 'Listen plays a song through the game\'s own player, as it ships. The music toggle (M) has to be on, and the page needs one click first for sound.'));
  if (nowMsg) sec.appendChild(h(doc, 'p', 'adm-note', nowMsg));
  el.appendChild(sec);
}

/* ---- library ----------------------------------------------------------------- */

async function loadLib() {
  if (loading) return;
  loading = true;
  try {
    const r = await fetch((store.base || '') + '/admin/api/midis');
    const j = await r.json();
    lib = r.status === 200 && Array.isArray(j) ? j : { error: (j && (j.message || j.error)) || 'HTTP ' + r.status };
  } catch (x) { lib = { error: String(x && x.message || x) }; }
  loading = false;
  redraw();
}

function portForm(doc, box, file) {
  const f = forms[file] || (forms[file] = { title: '', artist: '', year: '', month: '', id: '', msg: '' });
  const form = h(doc, 'div', 'adm-port');
  const field = (k, labelText, ph, title) => {
    const wrap = h(doc, 'div', 'adm-field');
    const lab = h(doc, 'label', 'adm-label', labelText);
    const inp = h(doc, 'input');
    inp.type = 'text'; inp.autocomplete = 'off'; inp.spellcheck = false; inp.placeholder = ph;
    if (title) inp.title = title;
    inp.dataset.port = k; inp.value = f[k];
    inp.addEventListener('input', () => { f[k] = inp.value; });
    wrap.append(lab, inp);
    form.appendChild(wrap);
  };
  field('title', 'Title', 'as the game shows it', 'upper case, the way the game draws it');
  field('artist', 'Artist', 'as the game shows it');
  field('year', 'Year', '1987', 'the original release year: what the year rule checks');
  field('month', 'Month', '1-12', 'the release month, 1 = January: the first release, single or album, whichever came first');
  field('id', 'Id', 'from the title', 'the song\'s file, content/music/<id>.json: lower-case letters, digits and dashes');
  const go = btn(doc, 'Port', 'port', 'arrange it with midi2song.mjs on the server');
  go.dataset.midi = file;
  go.addEventListener('click', () => port(file));
  const close = btn(doc, 'Cancel', 'port-close');
  close.addEventListener('click', () => { open = null; redraw(); });
  const row = h(doc, 'div', 'adm-row');
  row.append(go, close);
  form.appendChild(row);
  const msg = h(doc, 'pre', 'adm-log', f.msg);
  msg.dataset.port = 'msg';
  form.appendChild(msg);
  box.appendChild(form);
}

async function port(file) {
  const f = forms[file];
  const title = f.title.trim().toUpperCase(), artist = f.artist.trim().toUpperCase();
  const ys = f.year.trim(), ms = f.month.trim(), id = f.id.trim() || slug(title);
  if (!title || !artist) f.msg = 'a title and an artist, as the game will show them';
  else if (!/^\d{4}$/.test(ys)) f.msg = 'the year is the original release year, four digits, like 1987';
  else if (!(/^\d{1,2}$/.test(ms) && +ms >= 1 && +ms <= 12)) f.msg = 'the release month is 1-12 (1 = January), and every song needs one: the first release, single or album, whichever came first';
  else if (!ID.test(id) || id === 'playlist' || id.length > 48) f.msg = 'the id is lower-case letters, digits and dashes, like a-hazy-shade-of-winter';
  else {
    f.msg = 'arranging…'; redraw();
    const body = { file, id, title, artist, year: Number(ys), month: Number(ms) };
    try {
      const r = await fetch((store.base || '') + '/admin/api/port', {
        method: 'POST', headers: { 'content-type': 'application/json', ...store.headers }, body: JSON.stringify(body) });
      const j = await r.json();
      if (r.status === 200) {
        store.adopt(j.rel, j.json, j.stamp);  // already on disk: in the working copy, not dirty, stamped
        applyNow();
        const m = Array.isArray(lib) && lib.find((x) => x.file === file);
        if (m && !m.ids.includes(id)) m.ids.push(id);
        delete forms[file];
        open = null;
        libMsg = 'Ported ' + file + ' to content/' + j.rel + '. Listen to it, then add it to a playlist and Save.';
      } else if (r.status === 409 && j.error === 'exists') f.msg = 'a song called ' + id + ' already exists (content/' + (j.rel || 'music/' + id + '.json') + '), and nothing overwrites one: pick another id';
      else if (r.status === 409) f.msg = 'the server is busy: try again in a moment';
      else if (r.status === 422) f.msg = 'not ported:\n' + (j.log || j.error || '');
      else f.msg = 'not ported: ' + (j.message || j.error || 'HTTP ' + r.status);
    } catch (x) { f.msg = 'not ported: ' + String(x && x.message || x); }
  }
  redraw();
}

function fillLib(doc, list) {
  list.textContent = '';
  const all = songs(), q = filter.trim().toLowerCase();
  for (const m of lib) {
    const names = m.ids.map((id) => (all[id] ? label(all[id]) : id));
    if (q && !(m.file.toLowerCase().includes(q) || names.some((n) => n.toLowerCase().includes(q)))) continue;
    const row = h(doc, 'div', 'adm-midi');
    row.dataset.midi = m.file;
    if (m.ids.length) {
      m.ids.forEach((id, i) => {
        const t = h(doc, 'div', 'adm-tune');
        t.appendChild(h(doc, 'span', null, names[i] + (all[id] ? '' : ' (no song file)')));
        if (all[id]) {
          const b = btn(doc, 'Listen', 'listen', 'play it through the game\'s own player');
          b.dataset.id = id;
          b.addEventListener('click', () => listen(id));
          t.appendChild(b);
        }
        row.appendChild(t);
      });
      row.appendChild(h(doc, 'div', 'adm-midifile', m.file));
    } else {
      const t = h(doc, 'div', 'adm-tune');
      t.appendChild(h(doc, 'span', 'adm-midifile', m.file));
      if (open !== m.file) {
        const b = btn(doc, 'Port…', 'port-open', 'arrange this MIDI for the game\'s chip voices');
        b.dataset.midi = m.file;
        b.addEventListener('click', () => { open = m.file; redraw(); });
        t.appendChild(b);
      }
      row.appendChild(t);
      if (open === m.file) portForm(doc, row, m.file);
    }
    list.appendChild(row);
  }
}

function librarySection(doc, el) {
  const sec = h(doc, 'div', 'adm-screen');
  sec.dataset.section = 'library';
  const head = h(doc, 'h3', null, 'Library');
  const re = btn(doc, 'Reload', 'refresh-lib', 'read the MIDI folder again');
  re.addEventListener('click', () => { lib = null; loadLib(); redraw(); });
  head.appendChild(re);
  sec.appendChild(head);
  if (lib === null) {
    sec.appendChild(h(doc, 'p', 'adm-empty', 'Loading the MIDI library…'));
    if (!loading) loadLib();
    el.appendChild(sec);
    return;
  }
  if (!Array.isArray(lib)) { sec.appendChild(h(doc, 'p', 'adm-empty', 'Could not list the MIDIs: ' + lib.error)); el.appendChild(sec); return; }
  const ported = lib.filter((m) => m.ids.length).length, nsongs = lib.reduce((s, m) => s + m.ids.length, 0);
  sec.appendChild(h(doc, 'p', 'adm-note', lib.length + ' MIDIs in reference/assets/midi/, ' + ported + ' ported (' + nsongs + ' songs). '
    + 'The others are listed by file name: their details are typed in when one is ported.'));
  if (libMsg) sec.appendChild(h(doc, 'p', 'adm-note', libMsg));
  const fw = h(doc, 'div', 'adm-field');
  const fi = h(doc, 'input');
  fi.type = 'text'; fi.autocomplete = 'off'; fi.spellcheck = false; fi.placeholder = 'filter by file, title or artist';
  fi.dataset.lib = 'filter'; fi.value = filter;
  fw.appendChild(fi);
  sec.appendChild(fw);
  const list = h(doc, 'div', 'adm-lib');
  fi.addEventListener('input', () => { filter = fi.value; fillLib(doc, list); });
  fillLib(doc, list);
  sec.appendChild(list);
  el.appendChild(sec);
}

/* ---- playlists --------------------------------------------------------------- */

/* a stand-in control, so the validator's error on [k] or [k, j] lands here */
function asControl(doc, node, path) {
  node.dataset.rel = PL;
  node.dataset.path = path.join('.');
  const msg = h(doc, 'div', 'adm-msg');
  node.appendChild(msg);
  node._show = () => {};
  node._msg = msg;
  node._local = null;
  if (Admin.controls) Admin.controls.add(node);
}

function songRow(doc, sec, k, j, list, all) {
  const id = list[j], s = all[id];
  const row = h(doc, 'div', 'adm-song');
  row.dataset.list = k; row.dataset.j = String(j); row.dataset.id = id;
  row.draggable = true;
  row.append(h(doc, 'span', 'adm-grip', '≡'), h(doc, 'span', 'adm-songname', (j + 1) + '. ' + (s ? label(s) : id + ' (no such song)')));
  const tools = h(doc, 'span', 'adm-tools');
  const tool = (text, act, fn, title) => {
    const b = btn(doc, text, act, title);
    b.dataset.list = k; b.dataset.j = String(j); b.dataset.id = id;
    b.addEventListener('click', fn);
    tools.appendChild(b);
    return b;
  };
  const move = (from, to) => { const a = list.slice(); const [x] = a.splice(from, 1); a.splice(to, 0, x); setList(k, a); };
  if (s) tool('Listen', 'listen', () => listen(id), 'play it through the game\'s own player');
  if (j > 0) tool('↑', 'song-up', () => move(j, j - 1), 'play it earlier');
  if (j < list.length - 1) tool('↓', 'song-down', () => move(j, j + 1), 'play it later');
  const rm = tool('×', 'song-remove', () => { if (list.length > 1) setList(k, list.filter((x, i) => i !== j)); },
    list.length > 1 ? 'take it out of this list' : 'a list needs at least one song');
  rm.disabled = list.length <= 1;
  row.appendChild(tools);
  /* the season rule is advice: a late song stays, and says so */
  const el = s ? eligible(s, k) : { ok: true };
  if (el.warn) {
    const w = h(doc, 'div', 'adm-warn', 'Warning: ' + el.warn + '. It still plays; the build only flags it.');
    w.dataset.list = k; w.dataset.id = id;
    row.appendChild(w);
  }
  row.addEventListener('dragstart', (e) => {
    dragFrom = { k, j };
    if (e && e.dataTransfer) { e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', id); } catch (x) { /* not settable */ } }
  });
  row.addEventListener('dragover', (e) => { if (dragFrom && dragFrom.k === k) { if (e.preventDefault) e.preventDefault(); row.classList.add('adm-over'); } });
  row.addEventListener('dragleave', () => row.classList.remove('adm-over'));
  row.addEventListener('dragend', () => { dragFrom = null; });
  row.addEventListener('drop', (e) => {
    if (e.preventDefault) e.preventDefault();
    const from = dragFrom;
    dragFrom = null;
    row.classList.remove('adm-over');
    if (from && from.k === k && from.j !== j) move(from.j, j);
  });
  asControl(doc, row, [k, j]);
  sec.appendChild(row);
}

function playlist(doc, el, k, lv, all) {
  const list = listOf(k);
  const sec = h(doc, 'div', 'adm-screen adm-playlist');
  sec.dataset.list = k;
  sec.appendChild(h(doc, 'h3', null, lv ? 'Level ' + lv.n + ' · ' + lv.name + ' · ' + (lv.type === 'kitchen' ? 'Kitchen' : 'Delivery') : 'Title'));
  sec.appendChild(h(doc, 'p', 'adm-note', lv ? 'Songs from ' + (lv.year - MUSIC_LOOKBACK) + '-' + lv.year + ': its own year or up to ' + MUSIC_LOOKBACK + ' before, never after. '
    + 'Its month is ' + monthOf(k) + ' ' + lv.year + ': a ' + lv.year + ' song released after that is flagged, not refused.'
    : 'From the title screen through the winners and high-score screens. The title has no year, so any song can play.'));
  for (let j = 0; j < list.length; j++) songRow(doc, sec, k, j, list, all);
  const row = h(doc, 'div', 'adm-row');
  const sel = h(doc, 'select', 'adm-era');
  sel.dataset.pick = k;
  const ph = h(doc, 'option', null, 'add a song…'); ph.value = '';
  sel.appendChild(ph);
  const opts = Object.keys(all).map((id) => {
    const r = eligible(all[id], k);
    return { id, s: all[id], why: list.includes(id) ? 'in this list' : (r.ok ? null : r.why), warn: r.warn || null };
  }).sort((a, b) => (!!a.why - !!b.why) || (b.s.year - a.s.year) || String(a.s.title).localeCompare(String(b.s.title)));
  for (const o of opts) {
    const op = h(doc, 'option', null, label(o.s) + (o.why ? ' — ' + o.why : o.warn ? ' — warning: ' + o.warn : ''));
    op.value = o.id;
    op.disabled = !!o.why;
    sel.appendChild(op);
  }
  const add = btn(doc, 'Add', 'song-add', 'add it at the end of the list');
  add.dataset.list = k;
  add.addEventListener('click', () => {
    const id = sel.value, o = opts.find((x) => x.id === id);
    if (!o || o.why) return;
    setList(k, [...list, id]);
  });
  row.append(sel, add);
  sec.appendChild(row);
  asControl(doc, sec, [k]);
  el.appendChild(sec);
}

function draw(el) {
  panel = el;
  const doc = el.ownerDocument;
  el.textContent = '';
  if (!store.files[PL]) { el.appendChild(h(doc, 'p', 'adm-empty', 'No music/playlist.json loaded.')); return; }
  nowSection(doc, el);
  librarySection(doc, el);
  const pls = h(doc, 'div', 'adm-screen');
  pls.appendChild(h(doc, 'h3', null, 'Playlists'));
  pls.appendChild(h(doc, 'p', 'adm-note', 'Each list plays in order and then loops, and can be any length. Drag a song (or use the arrows) to reorder. '
    + 'Greyed songs are ones the list may not play; Save writes content/music/playlist.json and music.md.'));
  el.appendChild(pls);
  const all = songs();
  playlist(doc, el, 'title', null, all);
  for (const lv of levels()) playlist(doc, el, String(lv.n), lv, all);
  if (Admin.paintErrors) Admin.paintErrors();
}

/* leaving the tab or closing the overlay ends a listen: the level's music
   comes back and G.playMusic is the game's own again */
function leave() {
  if (Admin.music && Admin.music.listening && typeof Admin.music.stop === 'function') Admin.music.stop();
  nowMsg = '';
}

Admin.tab('music', 'Music', draw, { leave });
