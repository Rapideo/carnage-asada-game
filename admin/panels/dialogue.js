/* Service Mode: the Dialogue panel.
   A SPEAKER picker over the lines being edited:
     Shared        one section per key of DLG_KEYS (the validator's list, so a key
                   added there gets a section here with no change to this file).
                   `who` is a single text field; every other key is a list of
                   lines with an era dropdown (All eras / 1980s on / 1990s on,
                   stored as no prefix, "2|" or "3|" before the line)
     a cast name   the character's role moments (CAST_MOMENTS[role]), bound at
                   ['cast', key, 'lines', moment, i]; no era
     a customer    a face with personal lines: the nine customer moments, bound at
                   ['people', face, moment, i]; no era. "Add lines for..." lists
                   the customer faces (content/casts.json) that have none yet.
   Every line has
     a text field      bound to dialogue.json, where the validator reports a
                       ContentError, so an over-wide line is flagged on its own field
     a live count      "1 row" / "2 rows" / "too long": rows the way the build wraps
                       them (wrapRows at dlgLimitPx, the validator's own functions).
                       The validator's message, with how much to trim, is the
                       authority and appears on the field.
     Say it            shows the line in the dialogue strip, with that speaker's
                       face and name
     Remove
   and an Add line button per moment. Game consts (G, Kitchen) are read by bare
   name, never globalThis. */
import '../fields.js';
import { store } from '../store.js';
import { DLG_KEYS, DLG_MOMENTS, CAST_MOMENTS, DLG_MAX_ROWS, wrapRows, dlgLimitPx } from '../../tools/content/validate.mjs';

const Admin = (globalThis.Admin = globalThis.Admin || {});
const REL = 'dialogue.json';
const ERAS = [['All eras', ''], ['1980s on', '2|'], ['1990s on', '3|']];
const HOSTILE = ['missed', 'late', 'walkout', 'wrong'];   // the hood the game gives them
const PREFIX = /^([0-9])\|/;
const SAMPLE_ING = 'LETTUCE';                              // stands in for {ING} in a preview

let panel = null;
let speaker = 'shared';                // 'shared' | 'cast:<key>' | 'face:<face>'
const extras = new Set();              // customer faces opened with "Add lines for..." (may still have none)
const counts = new Set();

const h = (doc, tag, cls, text) => { const n = doc.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
const game = () => (typeof G !== 'undefined' ? G : null);
const pre = (s) => { const m = PREFIX.exec(s || ''); return m ? m[0] : ''; };
const body = (s) => (s || '').slice(pre(s).length);
const title = (k) => k[0].toUpperCase() + k.slice(1);
const dlg = () => store.files[REL] || {};

/* "1 row" / "2 rows" / "too long", counted with the build's own wrap */
function limitPx() {
  const faces = {};
  for (const [rel, f] of Object.entries(store.files)) if (rel.startsWith('faces/') && f && typeof f.w === 'number') faces[rel] = f;
  return dlgLimitPx(faces).limitPx;
}
function rowText(s, limit) {
  const text = body(s).replace(/\{ING\}/g, 'CHICKEN');
  if (!text.trim()) return '0 rows';
  const rows = wrapRows(text, limit);
  if (!rows || rows.length > DLG_MAX_ROWS) return 'too long';
  return rows.length + (rows.length === 1 ? ' row' : ' rows');
}

/* the scrolling box is the panel's parent; keep its place across a rebuild */
const redraw = () => {
  if (!panel) return;
  const sc = panel.parentNode, top = sc && typeof sc.scrollTop === 'number' ? sc.scrollTop : null;
  draw(panel);
  if (top !== null) sc.scrollTop = top;
};

store.onChange(() => {
  const lim = limitPx();
  for (const c of [...counts]) {
    if (!c.el.isConnected) { counts.delete(c); continue; }
    c.el.textContent = rowText(store.get(REL, c.path), lim);
  }
});

/* ---- who is speaking ---- */
const castEntries = () => Object.entries(dlg().cast || {});
const people = () => dlg().people || {};
function customerFaces() {
  const c = store.files['casts.json'] || {};
  const all = new Set();
  for (const [k, v] of Object.entries(c)) if (/^\d+$/.test(k) && Array.isArray(v)) v.forEach((f) => all.add(f));
  return all;
}
/* { id, label } for the picker, in order: Shared, the cast, customers with lines */
function speakers() {
  const out = [{ id: 'shared', label: 'Shared' }];
  for (const [k, ch] of castEntries()) out.push({ id: 'cast:' + k, label: ch.name });
  const faces = new Set([...Object.keys(people()), ...extras]);
  if (speaker.startsWith('face:')) faces.add(speaker.slice(5));
  for (const f of faces) out.push({ id: 'face:' + f, label: f });
  return out;
}
/* what the current speaker's Say it shows: { face, who } */
function voice(path) {
  if (path[0] === 'cast') {
    const ch = (dlg().cast || {})[path[1]];
    return ch ? { face: ch.face, who: ch.name } : { face: null, who: null };
  }
  if (path[0] === 'people') return { face: path[1], who: 'CUSTOMER' };
  return { face: null, who: null };
}

/* The line on the dialogue strip. Admin.test.say (Task 16) does it properly;
   for a shared line without it, G.react is asked with the line pinned as its
   pool, the game put in 'play' (react's guard) and the era raised to the line's
   floor, and all three put back afterwards, so the guard is bypassed for one
   synchronous call and no longer. Cast and personal lines have no react
   fallback (their pools are not DIALOGUE[key]), so they need Admin.test. */
function say(path, moment) {
  const line = store.get(REL, path);
  if (typeof line !== 'string' || !body(line).trim()) return;
  const g = game(), floor = pre(line) ? Number(pre(line)[0]) : 0;
  const who = voice(path);
  const hasTest = Admin.test && typeof Admin.test.say === 'function';
  if (hasTest) {
    let face = who.face;
    if (!face) try { if (typeof Kitchen !== 'undefined' && g) face = Kitchen.castFor(Math.max(g.era, floor))[0]; } catch (e) { face = null; }
    return Admin.test.say(body(line).replace(/\{ING\}/g, SAMPLE_ING), face, who.who);
  }
  if (path.length !== 2 || !g || typeof DIALOGUE === 'undefined' || typeof g.react !== 'function') return;
  const state = g.state, era = g.era, key = path[0], pool = DIALOGUE[key];
  try {
    DIALOGUE[key] = [line];
    g.state = 'play';
    if (floor > era) g.era = floor;
    g.react(key, null, HOSTILE.includes(key));
  } finally {
    DIALOGUE[key] = pool;
    g.state = state;
    g.era = era;
  }
}

/* The list at `listPath`, replaced. A people moment or face that ends up empty
   is dropped (the validator refuses an empty list), and a face that is not in
   `people` yet is added. */
function setList(listPath, list) {
  if (listPath[0] !== 'people') return store.set(REL, listPath, list);
  const all = { ...people() }, [, face, moment] = listPath;
  const lines = { ...(all[face] || {}) };
  if (list.length) lines[moment] = list; else delete lines[moment];
  if (Object.keys(lines).length) all[face] = lines; else delete all[face];
  return store.set(REL, 'people', all);
}

/* one line: [era dropdown for the shared pools], text, count, Say it, Remove.
   `path` is the line's place in the JSON, ending in its index; `moment` is the
   section it sits in (the dataset key the buttons carry). */
function lineRow(doc, el, path, moment, shared) {
  const i = path[path.length - 1], listPath = path.slice(0, -1);
  const id = path.join('.');
  const row = h(doc, 'div', 'adm-dlgline');
  row.dataset.line = id;

  if (shared) {
    const sel = h(doc, 'select', 'adm-era');
    sel.dataset.era = moment + '.' + i;
    sel.title = 'which eras can say this line';
    ERAS.forEach(([label], k) => { const o = h(doc, 'option', null, label); o.value = String(k); sel.appendChild(o); });
    const showEra = () => { const p = pre(store.get(REL, path)); sel.value = String(Math.max(0, ERAS.findIndex(([, v]) => v === p))); };
    sel.addEventListener('change', () => {
      const cur = store.get(REL, path);
      store.set(REL, path, ERAS[Number(sel.value)][1] + body(cur));
    });
    sel._show = showEra;
    sel._msg = h(doc, 'span');
    Admin.controls.add(sel);
    showEra();
    row.appendChild(sel);
  }

  Admin.field(row, {
    rel: REL, path, kind: 'text',
    title: 'ALL CAPS, the 5x7 font only; at most 2 rows, each as wide as the speech bubble beside the widest face',
    fromJSON: (v) => body(v),
    toJSON: (t) => (shared ? pre(store.get(REL, path)) : '') + t.toUpperCase(),   // lowercase is accepted and stored as the game draws it
  });

  const cnt = h(doc, 'span', 'adm-count', rowText(store.get(REL, path), limitPx()));
  cnt.dataset.count = id;
  counts.add({ el: cnt, path });
  row.appendChild(cnt);

  const sayBtn = h(doc, 'button', 'adm-show', 'Say it');
  sayBtn.type = 'button';
  sayBtn.dataset.act = 'say'; sayBtn.dataset.key = moment; sayBtn.dataset.i = String(i);
  sayBtn.title = 'show it on the dialogue strip, on whatever screen the game is on';
  sayBtn.addEventListener('click', () => say(path, moment));
  const rm = h(doc, 'button', 'adm-show', 'Remove');
  rm.type = 'button';
  rm.dataset.act = 'remove'; rm.dataset.key = moment; rm.dataset.i = String(i);
  rm.addEventListener('click', () => {
    const list = store.get(REL, listPath);
    setList(listPath, list.filter((_, k) => k !== i));
    redraw();
  });
  row.append(sayBtn, rm);
  el.appendChild(row);
}

/* a moment's section: its lines and Add line. `listPath` is the list's place. */
function section(doc, el, moment, listPath, shared) {
  const sec = h(doc, 'div', 'adm-screen');
  sec.dataset.section = moment;
  sec.appendChild(h(doc, 'h3', null, title(moment)));
  if (moment === 'who' && shared) {
    Admin.field(sec, { rel: REL, path: 'who', kind: 'text', label: 'Name on the bubble', title: 'who is speaking', toJSON: (t) => t.toUpperCase() });
  } else {
    const list = store.get(REL, listPath);
    (Array.isArray(list) ? list : []).forEach((_, i) => lineRow(doc, sec, [...listPath, i], moment, shared));
    const add = h(doc, 'button', 'adm-show', 'Add line');
    add.type = 'button';
    add.dataset.act = 'add'; add.dataset.key = moment;
    add.addEventListener('click', () => {
      const cur = store.get(REL, listPath);
      setList(listPath, [...(Array.isArray(cur) ? cur : []), '']);
      redraw();
    });
    sec.appendChild(add);
  }
  el.appendChild(sec);
}

function picker(doc, el) {
  const bar = h(doc, 'div', 'adm-field');
  const list = speakers();
  if (!list.some((s) => s.id === speaker)) speaker = 'shared';
  const sel = h(doc, 'select', 'adm-select');
  sel.dataset.pick = 'speaker';
  sel.title = 'whose lines to edit';
  list.forEach((s) => { const o = h(doc, 'option', null, s.label); o.value = s.id; sel.appendChild(o); });
  sel.value = speaker;
  sel.addEventListener('change', () => { speaker = sel.value; redraw(); });
  bar.append(h(doc, 'label', 'adm-label', 'Speaker'), sel);

  const taken = new Set(list.filter((s) => s.id.startsWith('face:')).map((s) => s.id.slice(5)));
  const add = h(doc, 'select', 'adm-select');
  add.dataset.pick = 'addface';
  add.title = 'a customer face with no lines of its own yet';
  const first = h(doc, 'option', null, 'Add lines for...'); first.value = '';
  add.appendChild(first);
  for (const f of customerFaces()) if (!taken.has(f)) { const o = h(doc, 'option', null, f); o.value = f; add.appendChild(o); }
  add.value = '';
  add.addEventListener('change', () => {
    if (!add.value) return;
    extras.add(add.value);
    speaker = 'face:' + add.value;
    redraw();
  });
  bar.appendChild(add);
  el.appendChild(bar);
}

function draw(el) {
  panel = el;
  const doc = el.ownerDocument;
  el.textContent = '';
  if (!store.files[REL]) { el.appendChild(h(doc, 'p', 'adm-empty', 'No dialogue.json loaded.')); return; }
  picker(doc, el);
  if (speaker === 'shared') {
    for (const key of DLG_KEYS) section(doc, el, key, [key], true);
  } else if (speaker.startsWith('cast:')) {
    const key = speaker.slice(5), ch = (dlg().cast || {})[key];
    for (const m of (ch && CAST_MOMENTS[ch.role]) || []) section(doc, el, m, ['cast', key, 'lines', m], false);
  } else {
    const face = speaker.slice(5);
    for (const m of DLG_MOMENTS) section(doc, el, m, ['people', face, m], false);
  }
}

Admin.tab('dialogue', 'Dialogue', draw);
