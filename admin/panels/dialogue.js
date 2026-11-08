/* Service Mode: the Dialogue panel.
   One section per key of DLG_KEYS (the validator's list, so a key added there
   gets a section here with no change to this file). `who` is a single text
   field; every other key is a list of lines, each with
     an era dropdown   All eras / 1980s on / 1990s on, stored as no prefix,
                       "2|" or "3|" before the line (what the game filters on)
     a text field      the line without its prefix, bound to dialogue.json at
                       [key, index], where the validator reports a ContentError,
                       so an over-wide line is flagged on its own field
     a live count      characters against DLG_MAX_CHARS. The real limit can be
                       tighter (the bubble is narrower beside the widest face);
                       that check is the validator's and its message, with how
                       much to trim, appears on the field. There is one rule and
                       it is not copied here.
     Say it            shows the line in the dialogue strip (play or kitchen
                       only: that is where the strip is drawn)
     Remove
   and an Add line button. Game consts (G, DIALOGUE, Kitchen) are read by bare
   name, never globalThis. */
import '../fields.js';
import { store } from '../store.js';
import { DLG_KEYS, DLG_MAX_CHARS } from '../../tools/content/validate.mjs';

const Admin = (globalThis.Admin = globalThis.Admin || {});
const REL = 'dialogue.json';
const ERAS = [['All eras', ''], ['1980s on', '2|'], ['1990s on', '3|']];
const HOSTILE = ['missed', 'late', 'walkout', 'wrong'];   // the hood the game gives them
const PREFIX = /^([0-9])\|/;

let panel = null;
const counts = new Set();

const h = (doc, tag, cls, text) => { const n = doc.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
const game = () => (typeof G !== 'undefined' ? G : null);
const pre = (s) => { const m = PREFIX.exec(s || ''); return m ? m[0] : ''; };
const body = (s) => (s || '').slice(pre(s).length);
const title = (k) => k[0].toUpperCase() + k.slice(1);
/* the scrolling box is the panel's parent; keep its place across a rebuild */
const redraw = () => {
  if (!panel) return;
  const sc = panel.parentNode, top = sc && typeof sc.scrollTop === 'number' ? sc.scrollTop : null;
  draw(panel);
  if (top !== null) sc.scrollTop = top;
};

store.onChange(() => {
  for (const c of [...counts]) {
    if (!c.el.isConnected) { counts.delete(c); continue; }
    c.el.textContent = body(store.get(REL, [c.key, c.i])).length + '/' + DLG_MAX_CHARS;
  }
});

/* The line on the dialogue strip. Admin.test.say (Task 16) does it properly;
   until it exists, G.react is asked with the line pinned as its pool, the game
   put in 'play' (react's guard) and the era raised to the line's floor, and all
   three put back afterwards, so the guard is bypassed for one synchronous call
   and no longer. */
function say(key, i) {
  const line = store.get(REL, [key, i]);
  if (typeof line !== 'string' || !body(line).trim()) return;
  const g = game(), floor = pre(line) ? Number(pre(line)[0]) : 0;
  if (Admin.test && typeof Admin.test.say === 'function') {
    let face = null;
    try { if (typeof Kitchen !== 'undefined' && g) face = Kitchen.castFor(Math.max(g.era, floor))[0]; } catch (e) { face = null; }
    return Admin.test.say(body(line), face);
  }
  if (!g || typeof DIALOGUE === 'undefined' || typeof g.react !== 'function') return;
  const state = g.state, era = g.era, pool = DIALOGUE[key];
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

function lineRow(doc, el, key, i) {
  const row = h(doc, 'div', 'adm-dlgline');
  row.dataset.line = key + '.' + i;

  const sel = h(doc, 'select', 'adm-era');
  sel.dataset.era = key + '.' + i;
  sel.title = 'which eras can say this line';
  ERAS.forEach(([label], k) => { const o = h(doc, 'option', null, label); o.value = String(k); sel.appendChild(o); });
  const showEra = () => { const p = pre(store.get(REL, [key, i])); sel.value = String(Math.max(0, ERAS.findIndex(([, v]) => v === p))); };
  sel.addEventListener('change', () => {
    const cur = store.get(REL, [key, i]);
    store.set(REL, [key, i], ERAS[Number(sel.value)][1] + body(cur));
  });
  sel._show = showEra;
  sel._msg = h(doc, 'span');
  Admin.controls.add(sel);
  showEra();
  row.appendChild(sel);

  Admin.field(row, {
    rel: REL, path: [key, i], kind: 'text',
    title: 'ALL CAPS, the 5x7 font only; the limit is the speech bubble beside the widest face',
    fromJSON: (v) => body(v),
    toJSON: (t) => pre(store.get(REL, [key, i])) + t.toUpperCase(),   // lowercase is accepted and stored as the game draws it
  });

  const cnt = h(doc, 'span', 'adm-count', body(store.get(REL, [key, i])).length + '/' + DLG_MAX_CHARS);
  cnt.dataset.count = key + '.' + i;
  counts.add({ el: cnt, key, i });
  row.appendChild(cnt);

  const sayBtn = h(doc, 'button', 'adm-show', 'Say it');
  sayBtn.type = 'button';
  sayBtn.dataset.act = 'say'; sayBtn.dataset.key = key; sayBtn.dataset.i = String(i);
  sayBtn.title = 'show it on the dialogue strip, on whatever screen the game is on';
  sayBtn.addEventListener('click', () => say(key, i));
  const rm = h(doc, 'button', 'adm-show', 'Remove');
  rm.type = 'button';
  rm.dataset.act = 'remove'; rm.dataset.key = key; rm.dataset.i = String(i);
  rm.addEventListener('click', () => {
    const list = store.get(REL, key);
    store.set(REL, key, list.filter((_, k) => k !== i));
    redraw();
  });
  row.append(sayBtn, rm);
  el.appendChild(row);
}

function section(doc, el, key) {
  const sec = h(doc, 'div', 'adm-screen');
  sec.dataset.section = key;
  sec.appendChild(h(doc, 'h3', null, title(key)));
  if (key === 'who') {
    Admin.field(sec, { rel: REL, path: 'who', kind: 'text', label: 'Name on the bubble', title: 'who is speaking', toJSON: (t) => t.toUpperCase() });
  } else {
    const list = store.get(REL, key);
    (Array.isArray(list) ? list : []).forEach((_, i) => lineRow(doc, sec, key, i));
    const add = h(doc, 'button', 'adm-show', 'Add line');
    add.type = 'button';
    add.dataset.act = 'add'; add.dataset.key = key;
    add.addEventListener('click', () => {
      const cur = store.get(REL, key);
      store.set(REL, key, [...(Array.isArray(cur) ? cur : []), '']);
      redraw();
    });
    sec.appendChild(add);
  }
  el.appendChild(sec);
}

function draw(el) {
  panel = el;
  const doc = el.ownerDocument;
  el.textContent = '';
  if (!store.files[REL]) { el.appendChild(h(doc, 'p', 'adm-empty', 'No dialogue.json loaded.')); return; }
  for (const key of DLG_KEYS) section(doc, el, key);
}

Admin.tab('dialogue', 'Dialogue', draw);
