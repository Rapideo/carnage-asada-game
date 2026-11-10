/* Service Mode: the Music tab, in three batches (owner, 2026-11-09).

   Now playing    what Listen is playing, and Stop.
   Three counters switch the view; each shows its count:
   Not converted  every MIDI in reference/assets/midi/ (GET /admin/api/midis)
                  that no song is made from. Convert… asks only for the
                  title, artist and release year (owner, 2026-11-09), filled
                  in from what the MIDI says about itself (the server's meta,
                  tools/music/midi-meta.mjs) or the file name, and runs
                  midi2song.mjs on the server (POST /admin/api/port), which
                  names the song from the title (-2, -3 if taken). The song is
                  written at once, to content/music/<id>.json and
                  tools/music/songs.json, never over an existing id, and lands
                  in Converted.
   Converted      songs in content/music/ that are not in the game. Listen
                  plays one through the game's own player (Admin.music.listen
                  in admin/apply.js, so what is heard is what ships). Approve…
                  places it: a decade, a shift (Delivery, Kitchen or Both) and a
                  "from" year, the decade's level years, those before the
                  song's release greyed, exactly as the Faces tab does. Delete
                  asks once more, then POST /admin/api/unport throws the
                  conversion away (the server refuses a song the SAVED
                  approved.json still names) and its MIDI is Not converted again.
   In game        per decade, a strip counting the songs each shift shuffles
                  at each level year, then the songs with their shift and from
                  editable in place, Listen and Take out (back to Converted,
                  its conversion kept). Then the title list, hand-ordered: add,
                  remove, and reorder by dragging a song (or with the arrows).

   Every edit goes through store.set on content/music/approved.json, so the
   validator (the build's own rules) judges it and Save writes it with
   music.md. Game consts (G, Music) are reached through Admin.music, never
   globalThis. The playlist refresher lives in admin/apply.js. */
import '../fields.js';
import { store } from '../store.js';
import { APPROVED, SHIFTS, eraYears, songStart, songDecade, inGame } from '../../tools/content/validate.mjs';
import { titleFromFile } from '../../tools/music/midi-meta.mjs';

const Admin = (globalThis.Admin = globalThis.Admin || {});
const SHIFT_LABEL = { delivery: 'Delivery', kitchen: 'Kitchen', both: 'Both' };

let panel = null;
let view = 'game';          // 'raw' | 'conv' | 'game'
let lib = null;             // [{ file, ids }] from the server, or { error }
let loading = false;
let filter = '';
let open = null;            // the MIDI whose Convert form is open
let approving = null;       // the song whose Approve form is open
let sure = null;            // the song whose Delete is asking once more
let libMsg = '';
let nowMsg = '';
const delMsg = {};          // song -> why its Delete was refused
let dragFrom = null;        // { j } while a title song is dragged
const forms = {};           // file -> the Convert form's state
const picks = {};           // song -> the Approve form's state

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

function songsIn(files) {
  const o = {};
  for (const [rel, s] of Object.entries(files)) if (/^music\/[^/]+\.json$/.test(rel) && rel !== APPROVED && s) o[rel.slice(6, -5)] = s;
  return o;
}
const songs = () => songsIn(store.files);
const label = (s) => s.title + ' - ' + s.artist + ' (' + s.year + ')';
const levels = () => ((store.files['levels.json'] || {}).levels || []).slice().sort((a, b) => a.n - b.n);
const approved = () => store.files[APPROVED] || {};
const eras = () => [...new Set(levels().map((l) => String(l.era)))];
const decadeName = (e) => { const L = levels().filter((l) => String(l.era) === e), ns = L.map((l) => l.n);
  return L.length ? "The '" + String(L[0].year).charAt(2) + '0s (levels ' + Math.min(...ns) + '-' + Math.max(...ns) + ')' : 'Decade ' + e; };
export const slug = (t) => String(t).toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/* The three batches. `files` is the working copy (rel -> JSON), `midis` the
   server's library ([{ file, ids }]) or null while it loads. A MIDI is not
   converted when none of the songs made from it has a file; a song is
   converted when nothing in approved.json names it. */
export function batches(files, midis) {
  const all = songsIn(files), ap = files[APPROVED] || {};
  const raw = Array.isArray(midis) ? midis.filter((m) => !m.ids.some((id) => all[id])).map((m) => m.file) : [];
  const conv = Object.keys(all).filter((id) => !inGame(ap, id)).sort();
  const eraOut = {};
  for (const [k, v] of Object.entries(ap)) if (/^\d+$/.test(k) && v) eraOut[k] = { delivery: (v.delivery || []).slice(), kitchen: (v.kitchen || []).slice() };
  return { raw, conv, game: { title: (ap.title || []).slice(), eras: eraOut } };
}

/* the from choices for a song in era e: '' (from the start) and the later
   level years; a year before the song's release is disabled */
function fromChoices(e, song) {
  const ys = eraYears(levels(), e);
  return ys.map((y, i) => ({ value: i === 0 ? '' : String(y), text: i === 0 ? 'from the start (' + y + ')' : 'from ' + y, disabled: !!song && y < song.year }));
}
const shiftOf = (e, id) => {
  const d = approved()[e] || {}, inD = (d.delivery || []).includes(id), inK = (d.kitchen || []).includes(id);
  return inD && inK ? 'both' : inK ? 'kitchen' : 'delivery';
};

/* writes, in an order that never leaves the content invalid on the way: a
   "from" for a song in no decade is dropped by the validator, so it is set
   before the song joins a decade and cleared after it leaves */
function setFrom(id, year) {
  const f = { ...(approved().from || {}) };
  if (year === null) delete f[id]; else f[id] = year;
  if (!approved().from) approved().from = {};
  store.set(APPROVED, ['from'], f);
}
function setShifts(e, id, shift) {
  const d = approved()[e] || { delivery: [], kitchen: [] };
  const next = {};
  for (const s of SHIFTS) {
    const want = shift === 'both' || shift === s, list = (d[s] || []).filter((x) => x !== id);
    next[s] = want ? ((d[s] || []).includes(id) ? d[s].slice() : [...list, id]) : list;
  }
  if (!approved()[e]) approved()[e] = { delivery: [], kitchen: [] };
  store.set(APPROVED, [e], next);
}
function approve(id) {
  const p = picks[id];
  if (!p) return;
  setFrom(id, p.from === '' ? null : Number(p.from));
  setShifts(p.era, id, p.shift);
  approving = null; delete picks[id];
  redraw();
}
function takeOut(id) {
  const e = songDecade(approved(), id);
  if (e !== null) {
    const d = approved()[e];
    store.set(APPROVED, [e], { delivery: (d.delivery || []).filter((x) => x !== id), kitchen: (d.kitchen || []).filter((x) => x !== id) });
  }
  if (approved().from && id in approved().from) setFrom(id, null);
  redraw();
}

/* the working copy into the running game, music table and all: a converted
   song has to be in MUSIC before Listen can play it */
function applyNow() {
  const v = store.validate();
  if (v.built && Admin.applyBuilt) {
    try { Admin.applyBuilt(v.built, game(), { skip: ['faces', 'lattice'] }); store.applyError = null; } catch (x) { store.applyError = x; }
  }
  store.emit();
}

/* a stand-in control, so the validator's error on a path lands here */
function asControl(doc, node, path) {
  node.dataset.rel = APPROVED;
  node.dataset.path = path.join('.');
  const msg = h(doc, 'div', 'adm-msg');
  node.appendChild(msg);
  node._show = () => {};
  node._msg = msg;
  node._local = null;
  if (Admin.controls) Admin.controls.add(node);
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
const listenBtn = (doc, id, extra) => {
  const b = btn(doc, 'Listen', 'listen', 'play it through the game\'s own player');
  b.dataset.id = id;
  if (extra) Object.assign(b.dataset, extra);
  b.addEventListener('click', () => listen(id));
  return b;
};

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

/* ---- the library (not converted) ---------------------------------------------- */

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

/* the form starts from what the MIDI says about itself (the server's meta, read by
   tools/music/midi-meta.mjs), or the file name for the title. Only title, artist
   and year (owner, 2026-11-09): the server names the song from the title. */
function convertForm(doc, box, file) {
  const m = ((Array.isArray(lib) && lib.find((x) => x.file === file)) || {}).meta || null;
  const f = forms[file] || (forms[file] = {
    title: m && m.title ? m.title : titleFromFile(file), artist: m && m.artist ? m.artist : '', year: m && m.year ? String(m.year) : '', msg: '' });
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
  field('year', 'Year', 'four digits, e.g. 1977', 'the original release year: a song never plays before it');
  form.appendChild(h(doc, 'p', 'adm-note', 'Converts it for the game\'s chip voices. It goes to Converted for you to listen to; nothing plays in the game until it is approved.'));
  const go = btn(doc, 'Convert', 'convert', 'arrange it with midi2song.mjs on the server');
  go.dataset.midi = file;
  go.addEventListener('click', () => convert(file));
  const close = btn(doc, 'Cancel', 'convert-close');
  close.addEventListener('click', () => { open = null; redraw(); });
  const row = h(doc, 'div', 'adm-row');
  row.append(go, close);
  form.appendChild(row);
  const msg = h(doc, 'pre', 'adm-log', f.msg);
  msg.dataset.port = 'msg';
  form.appendChild(msg);
  box.appendChild(form);
}

async function convert(file) {
  const f = forms[file];
  const title = f.title.trim().toUpperCase(), artist = f.artist.trim().toUpperCase();
  const ys = f.year.trim();
  if (!title || !artist) f.msg = 'a title and an artist, as the game will show them';
  else if (!/^\d{4}$/.test(ys)) f.msg = 'the year is the original release year, four digits, like 1987';
  else if (!slug(title)) f.msg = 'the title needs a letter or a digit to name the song by';
  else {
    f.msg = 'arranging…'; redraw();
    /* the server names the song from the title: a-hazy-shade-of-winter, -2 if taken */
    const body = { file, title, artist, year: Number(ys) };
    try {
      const r = await fetch((store.base || '') + '/admin/api/port', {
        method: 'POST', headers: { 'content-type': 'application/json', ...store.headers }, body: JSON.stringify(body) });
      const j = await r.json();
      if (r.status === 200) {
        store.adopt(j.rel, j.json, j.stamp);  // already on disk: in the working copy, not dirty, stamped
        applyNow();
        const m = Array.isArray(lib) && lib.find((x) => x.file === file), id = j.rel.slice(6, -5);
        if (m && !m.ids.includes(id)) m.ids.push(id);
        delete forms[file];
        open = null;
        libMsg = 'Converted ' + file + ' to content/' + j.rel + '. It is in Converted: listen to it, then approve it.';
      } else if (r.status === 409 && j.error === 'exists') f.msg = 'a song by that name already exists (content/' + (j.rel || '') + '), and nothing overwrites one: try again';
      else if (r.status === 409) f.msg = 'the server is busy: try again in a moment';
      else if (r.status === 422) f.msg = 'not converted:\n' + (j.log || j.error || '');
      else f.msg = 'not converted: ' + (j.message || j.error || 'HTTP ' + r.status);
    } catch (x) { f.msg = 'not converted: ' + String(x && x.message || x); }
  }
  redraw();
}

function rawView(doc, el, B) {
  const sec = h(doc, 'div', 'adm-screen');
  sec.dataset.section = 'raw';
  const head = h(doc, 'h3', null, 'Not converted');
  const re = btn(doc, 'Reload', 'refresh-lib', 'read the MIDI folder again');
  re.addEventListener('click', () => { lib = null; loadLib(); redraw(); });
  head.appendChild(re);
  sec.appendChild(head);
  if (libMsg) sec.appendChild(h(doc, 'p', 'adm-note', libMsg));
  if (lib === null) { sec.appendChild(h(doc, 'p', 'adm-empty', 'Loading the MIDI library…')); el.appendChild(sec); return; }
  if (!Array.isArray(lib)) { sec.appendChild(h(doc, 'p', 'adm-empty', 'Could not list the MIDIs: ' + lib.error)); el.appendChild(sec); return; }
  sec.appendChild(h(doc, 'p', 'adm-note', lib.length + ' MIDI files in reference/assets/midi/; ' + B.raw.length + ' not converted. Copy new ones into the folder and press Reload.'));
  const fw = h(doc, 'div', 'adm-field');
  const fi = h(doc, 'input');
  fi.type = 'text'; fi.autocomplete = 'off'; fi.spellcheck = false; fi.placeholder = 'filter by file name';
  fi.dataset.lib = 'filter'; fi.value = filter;
  fw.appendChild(fi);
  sec.appendChild(fw);
  const list = h(doc, 'div', 'adm-lib');
  const fill = () => {
    list.textContent = '';
    const q = filter.trim().toLowerCase();
    for (const file of B.raw) {
      if (q && !file.toLowerCase().includes(q)) continue;
      const row = h(doc, 'div', 'adm-midi');
      row.dataset.midi = file;
      const t = h(doc, 'div', 'adm-tune');
      t.appendChild(h(doc, 'span', 'adm-midifile', file));
      if (open !== file) {
        const b = btn(doc, 'Convert…', 'convert-open', 'arrange this MIDI for the game\'s chip voices');
        b.dataset.midi = file;
        b.addEventListener('click', () => { open = file; redraw(); });
        t.appendChild(b);
      }
      row.appendChild(t);
      if (open === file) convertForm(doc, row, file);
      list.appendChild(row);
    }
  };
  fi.addEventListener('input', () => { filter = fi.value; fill(); });
  fill();
  sec.appendChild(list);
  el.appendChild(sec);
}

/* ---- converted ---------------------------------------------------------------- */

async function remove(id) {
  sure = null;
  delete delMsg[id];
  try {
    const r = await fetch((store.base || '') + '/admin/api/unport', {
      method: 'POST', headers: { 'content-type': 'application/json', ...store.headers }, body: JSON.stringify({ id }) });
    const j = await r.json();
    if (r.status === 200) {
      store.forget(j.rel || 'music/' + id + '.json');
      applyNow();
      libMsg = 'Deleted ' + id + '; its MIDI is back in Not converted.';
      lib = null; loadLib();
    } else if (r.status === 409 && j.error === 'in game') delMsg[id] = 'The saved approved.json still has it in the game. Save first, then delete it.';
    else if (r.status === 409) delMsg[id] = 'the server is busy: try again in a moment';
    else delMsg[id] = 'not deleted: ' + (j.message || j.error || 'HTTP ' + r.status);   // 409 invalid / no approved file carry a message
  } catch (x) { delMsg[id] = 'not deleted: ' + String(x && x.message || x); }
  redraw();
}

function approveForm(doc, box, id, s) {
  const E = eras();
  const p = picks[id] || (picks[id] = { era: E.find((e) => eraYears(levels(), e).some((y) => y >= s.year)) || E[E.length - 1], shift: 'delivery', from: null });
  const opts = fromChoices(p.era, s);
  if (p.from === null || !opts.some((o) => o.value === p.from && !o.disabled)) { const ok = opts.find((o) => !o.disabled); p.from = ok ? ok.value : ''; }
  const form = h(doc, 'div', 'adm-port');
  const select = (k, labelText, options, onChange) => {
    const wrap = h(doc, 'div', 'adm-field');
    const sel = h(doc, 'select', 'adm-era');
    sel.dataset.approve = k; sel.dataset.song = id;
    for (const o of options) { const op = h(doc, 'option', null, o.text); op.value = o.value; op.disabled = !!o.disabled; sel.appendChild(op); }
    sel.value = p[k];
    sel.addEventListener('change', () => { p[k] = sel.value; if (onChange) onChange(); });
    wrap.append(h(doc, 'label', 'adm-label', labelText), sel);
    form.appendChild(wrap);
  };
  select('era', 'Decade', E.map((e) => ({ value: e, text: decadeName(e) })), () => { p.from = null; redraw(); });
  select('shift', 'Shift', ['delivery', 'kitchen', 'both'].map((v) => ({ value: v, text: SHIFT_LABEL[v] })));
  select('from', 'Plays', opts);
  form.appendChild(h(doc, 'p', 'adm-note', 'It joins every level of that decade and shift from that year on, shuffled with the others. A year before its release (' + s.year + ') is greyed.'));
  const go = btn(doc, 'Approve', 'approve', 'put it in the game');
  go.dataset.song = id;
  go.addEventListener('click', () => approve(id));
  const close = btn(doc, 'Cancel', 'approve-close');
  close.addEventListener('click', () => { approving = null; redraw(); });
  const row = h(doc, 'div', 'adm-row');
  row.append(go, close);
  form.appendChild(row);
  box.appendChild(form);
}

function convView(doc, el, B) {
  const sec = h(doc, 'div', 'adm-screen');
  sec.dataset.section = 'conv';
  sec.appendChild(h(doc, 'h3', null, 'Converted'));
  sec.appendChild(h(doc, 'p', 'adm-note', 'Converted but not in the game. Listen, then approve or delete. A deleted song\'s MIDI goes back to Not converted.'));
  if (libMsg) sec.appendChild(h(doc, 'p', 'adm-note', libMsg));
  if (!B.conv.length) sec.appendChild(h(doc, 'p', 'adm-empty', 'Nothing waiting: every converted song is in the game.'));
  const all = songs();
  for (const id of B.conv) {
    const s = all[id];
    const row = h(doc, 'div', 'adm-entry adm-midi');
    row.dataset.song = id;
    const t = h(doc, 'div', 'adm-tune');
    t.appendChild(h(doc, 'span', null, label(s)));
    const tools = h(doc, 'span', 'adm-tools');
    tools.appendChild(listenBtn(doc, id));
    const ab = btn(doc, 'Approve…', 'approve-open', 'choose its decade, shift and first year');
    ab.dataset.song = id;
    ab.addEventListener('click', () => { approving = id; sure = null; redraw(); });
    tools.appendChild(ab);
    if (sure === id) {
      const yes = btn(doc, 'Delete it', 'delete-sure', 'delete the conversion: its file and songs.json entry');
      yes.dataset.song = id;
      yes.addEventListener('click', () => remove(id));
      const no = btn(doc, 'Keep', 'delete-keep');
      no.dataset.song = id;
      no.addEventListener('click', () => { sure = null; redraw(); });
      tools.append(yes, no);
    } else {
      const db = btn(doc, 'Delete', 'delete', 'throw the conversion away; the MIDI stays');
      db.dataset.song = id;
      db.addEventListener('click', () => { sure = id; redraw(); });
      tools.appendChild(db);
    }
    t.appendChild(tools);
    row.appendChild(t);
    if (delMsg[id]) { const m = h(doc, 'p', 'adm-warn', delMsg[id]); m.dataset.delmsg = id; row.appendChild(m); }
    if (approving === id) approveForm(doc, row, id, s);
    sec.appendChild(row);
  }
  el.appendChild(sec);
}

/* ---- in game -------------------------------------------------------------------- */

function eraSection(doc, el, e, all) {
  const ap = approved(), L = levels(), d = ap[e] || {};
  const sec = h(doc, 'div', 'adm-screen adm-decade');
  sec.dataset.era = e;
  sec.appendChild(h(doc, 'h3', null, decadeName(e)));
  /* the strip: per level year, how many songs each shift shuffles */
  const strip = h(doc, 'div', 'adm-strip');
  strip.dataset.strip = e;
  for (const y of eraYears(L, e)) {
    const n = (s) => (d[s] || []).filter((id) => songStart(ap, L, id) <= y).length;
    const c = h(doc, 'div', 'adm-cell');
    c.dataset.cell = e + ':' + y; c.dataset.d = String(n('delivery')); c.dataset.k = String(n('kitchen'));
    c.append(h(doc, 'span', null, String(y)), h(doc, 'b', null, 'D ' + n('delivery') + ' · K ' + n('kitchen')));
    c.title = y + ': ' + n('delivery') + ' delivery and ' + n('kitchen') + ' kitchen songs shuffle';
    strip.appendChild(c);
  }
  sec.appendChild(strip);
  /* stand-ins for a shift left empty ([e, shift]) and the decade itself */
  for (const s of SHIFTS) { const z = h(doc, 'div', 'adm-pool'); asControl(doc, z, [e, s]); sec.appendChild(z); }
  const ids = [...new Set([...(d.delivery || []), ...(d.kitchen || [])])];
  if (!ids.length) sec.appendChild(h(doc, 'p', 'adm-empty', 'No songs approved for this decade.'));
  for (const id of ids) {
    const s = all[id];
    const row = h(doc, 'div', 'adm-entry adm-ingame');
    row.dataset.song = id;
    row.appendChild(h(doc, 'span', 'adm-songname', s ? label(s) : id + ' (no such song)'));
    const sh = h(doc, 'select', 'adm-era');
    sh.dataset.shift = id;
    for (const v of ['delivery', 'kitchen', 'both']) { const op = h(doc, 'option', null, SHIFT_LABEL[v]); op.value = v; sh.appendChild(op); }
    sh.value = shiftOf(e, id);
    sh.addEventListener('change', () => { setShifts(e, id, sh.value); redraw(); });
    const fr = h(doc, 'select', 'adm-era');
    fr.dataset.from = id;
    for (const o of fromChoices(e, s)) { const op = h(doc, 'option', null, o.text); op.value = o.value; op.disabled = o.disabled; fr.appendChild(op); }
    const f = (ap.from || {})[id];
    fr.value = Number.isInteger(f) && f !== eraYears(L, e)[0] ? String(f) : '';
    fr.addEventListener('change', () => { setFrom(id, fr.value === '' ? null : Number(fr.value)); redraw(); });
    const tools = h(doc, 'span', 'adm-tools');
    if (s) tools.appendChild(listenBtn(doc, id));
    const out = btn(doc, 'Take out', 'take-out', 'back to Converted; its conversion is kept');
    out.dataset.song = id;
    out.addEventListener('click', () => takeOut(id));
    tools.appendChild(out);
    row.append(sh, fr, tools);
    asControl(doc, row, ['from', id]);
    sec.appendChild(row);
  }
  asControl(doc, sec, [e]);
  el.appendChild(sec);
}

function titleSection(doc, el, all) {
  const list = (approved().title || []).slice();
  const setTitle = (arr) => { store.set(APPROVED, ['title'], arr); redraw(); };
  const sec = h(doc, 'div', 'adm-screen adm-playlist');
  sec.dataset.list = 'title';
  sec.appendChild(h(doc, 'h3', null, 'Title screen'));
  sec.appendChild(h(doc, 'p', 'adm-note', 'Its own list, played in this order from the title screen through the winners and high-score screens. The title has no year, so any song can play.'));
  list.forEach((id, j) => {
    const s = all[id];
    const row = h(doc, 'div', 'adm-song');
    row.dataset.list = 'title'; row.dataset.j = String(j); row.dataset.id = id;
    row.draggable = true;
    row.append(h(doc, 'span', 'adm-grip', '≡'), h(doc, 'span', 'adm-songname', (j + 1) + '. ' + (s ? label(s) : id + ' (no such song)')));
    const tools = h(doc, 'span', 'adm-tools');
    const tool = (text, act, fn, title) => {
      const b = btn(doc, text, act, title);
      b.dataset.list = 'title'; b.dataset.j = String(j); b.dataset.id = id;
      b.addEventListener('click', fn);
      tools.appendChild(b);
      return b;
    };
    const move = (from, to) => { const a = list.slice(); const [x] = a.splice(from, 1); a.splice(to, 0, x); setTitle(a); };
    if (s) tools.appendChild(listenBtn(doc, id, { list: 'title' }));
    /* a title song in no decade can be approved into one as well (it stays on the title list) */
    if (s && songDecade(approved(), id) === null) {
      const ab = btn(doc, 'Approve…', 'approve-open', "also play it in a decade's levels");
      ab.dataset.song = id;
      ab.addEventListener('click', () => { approving = id; redraw(); });
      tools.appendChild(ab);
    }
    if (j > 0) tool('↑', 'song-up', () => move(j, j - 1), 'play it earlier');
    if (j < list.length - 1) tool('↓', 'song-down', () => move(j, j + 1), 'play it later');
    const rm = tool('×', 'song-remove', () => { if (list.length > 1) setTitle(list.filter((x, i) => i !== j)); },
      list.length > 1 ? 'take it off the title list' : 'the title needs at least one song');
    rm.disabled = list.length <= 1;
    row.appendChild(tools);
    row.addEventListener('dragstart', (ev) => {
      dragFrom = { j };
      if (ev && ev.dataTransfer) { ev.dataTransfer.effectAllowed = 'move'; try { ev.dataTransfer.setData('text/plain', id); } catch (x) { /* not settable */ } }
    });
    row.addEventListener('dragover', (ev) => { if (dragFrom) { if (ev.preventDefault) ev.preventDefault(); row.classList.add('adm-over'); } });
    row.addEventListener('dragleave', () => row.classList.remove('adm-over'));
    row.addEventListener('dragend', () => { dragFrom = null; });
    row.addEventListener('drop', (ev) => {
      if (ev.preventDefault) ev.preventDefault();
      const from = dragFrom;
      dragFrom = null;
      row.classList.remove('adm-over');
      if (from && from.j !== j) move(from.j, j);
    });
    if (approving === id && s && songDecade(approved(), id) === null) approveForm(doc, row, id, s);
    asControl(doc, row, ['title', j]);
    sec.appendChild(row);
  });
  const row = h(doc, 'div', 'adm-row');
  const sel = h(doc, 'select', 'adm-era');
  sel.dataset.pick = 'title';
  const ph = h(doc, 'option', null, 'add a song…'); ph.value = '';
  sel.appendChild(ph);
  const ids = Object.keys(all).sort((a, b) => String(all[a].title).localeCompare(String(all[b].title)));
  for (const id of ids) {
    const op = h(doc, 'option', null, label(all[id]) + (list.includes(id) ? ' — on the list' : ''));
    op.value = id;
    op.disabled = list.includes(id);
    sel.appendChild(op);
  }
  const add = btn(doc, 'Add', 'song-add', 'add it at the end of the title list');
  add.dataset.list = 'title';
  add.addEventListener('click', () => { const id = sel.value; if (all[id] && !list.includes(id)) setTitle([...list, id]); });
  row.append(sel, add);
  sec.appendChild(row);
  asControl(doc, sec, ['title']);
  el.appendChild(sec);
}

function gameView(doc, el) {
  const all = songs();
  const sec = h(doc, 'div', 'adm-screen');
  sec.dataset.section = 'game';
  sec.appendChild(h(doc, 'p', 'adm-note', 'Approved songs. A level shuffles every song of its decade and shift whose year has arrived; the strip counts them per level year. '
    + 'Change a song\'s shift or first year in place. Save writes content/music/approved.json and music.md.'));
  el.appendChild(sec);
  for (const e of eras()) eraSection(doc, el, e, all);
  titleSection(doc, el, all);
}

/* ---- the panel ------------------------------------------------------------------ */

function draw(el) {
  panel = el;
  const doc = el.ownerDocument;
  el.textContent = '';
  if (!store.files[APPROVED]) { el.appendChild(h(doc, 'p', 'adm-empty', 'No ' + APPROVED + ' loaded.')); return; }
  if (lib === null && !loading) loadLib();
  nowSection(doc, el);
  const B = batches(store.files, lib);
  const inGameN = new Set([...B.game.title, ...Object.values(B.game.eras).flatMap((d) => [...d.delivery, ...d.kitchen])]).size;
  const seg = h(doc, 'div', 'adm-seg');
  for (const [v, n, text] of [['raw', Array.isArray(lib) ? B.raw.length : '…', 'Not converted'], ['conv', B.conv.length, 'Converted'], ['game', inGameN, 'In game']]) {
    const b = h(doc, 'button', 'adm-view' + (view === v ? ' adm-on' : ''));
    b.type = 'button'; b.dataset.view = v;
    b.append(h(doc, 'b', null, String(n)), h(doc, 'span', null, text));
    b.addEventListener('click', () => { view = v; redraw(); });
    seg.appendChild(b);
  }
  el.appendChild(seg);
  if (view === 'raw') rawView(doc, el, B);
  else if (view === 'conv') convView(doc, el, B);
  else gameView(doc, el);
  if (Admin.paintErrors) Admin.paintErrors();
}

/* leaving the tab or closing the overlay ends a listen: the level's music
   comes back and G.playMusic is the game's own again */
function leave() {
  if (Admin.music && Admin.music.listening && typeof Admin.music.stop === 'function') Admin.music.stop();
  nowMsg = '';
}

Admin.tab('music', 'Music', draw, { leave });
