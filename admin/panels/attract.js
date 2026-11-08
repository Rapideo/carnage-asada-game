/* Service Mode: the Attract panel.
   The four attract screens in loop order, with the cycle total live. Each
   screen's fields are bound to the file the game reads them from:
     attract.json  every screen's seconds, the title's wordmarkHold, demo.levels
     winners.json  the winners card's slogan, attribution and credit
     scores.json   the factory high-score board
   at the path the validator reports a ContentError on, so a refusal lands on
   the field that caused it. "Show it" puts the game on that screen.

   The refreshers (an attract edit restarts the attract screen on show; a
   factory board edit reloads Scores) live in admin/apply.js beside the
   others, because they run in the game's own scope. Game consts (G) are read
   by bare name, never globalThis. */
import '../fields.js';
import { store } from '../store.js';
import { SCORE_MAX } from '../../tools/content/validate.mjs';

const Admin = (globalThis.Admin = globalThis.Admin || {});
const A = 'attract.json', W = 'winners.json', S = 'scores.json';

const h = (doc, tag, cls, text) => { const n = doc.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
const game = () => (typeof G !== 'undefined' ? G : null);

/* [key, name as attract.md heads it, how to show it] in loop order */
const SCREENS = [
  ['title', 'Title Screen', (g) => g.toTitle()],
  ['winners', 'Winners Screen', (g) => g.toWinners()],
  ['scores', 'High Scores', (g) => g.toScores(false)],
  ['demo', 'Auto-Play', (g) => g.toDemo()],
];

/* 80 -> "1:20", 7.5 -> "0:07.5" (the way attract.md writes a time) */
const mss = (s) => {
  const m = Math.floor(s / 60), r = s - m * 60, w = Math.floor(r), f = Number((r - w).toFixed(2));
  return m + ':' + String(w).padStart(2, '0') + (f ? String(f).slice(1) : '');
};
function cycleText() {
  const secs = SCREENS.map(([k]) => store.get(A, [k, 'seconds']));
  return secs.every((v) => typeof v === 'number' && Number.isFinite(v)) ? 'One loop: ' + mss(secs.reduce((a, b) => a + b, 0)) : 'One loop: —';
}
const cycleEls = new Set();
store.onChange(() => {
  for (const c of [...cycleEls]) {
    if (!c.isConnected) { cycleEls.delete(c); continue; }
    c.textContent = cycleText();
  }
});

function levelCount() {
  const L = store.files['levels.json'] && store.files['levels.json'].levels;
  return Array.isArray(L) && L.length ? L.length : 20;
}

/* demo.levels: Random, or a box per level. One control for the whole set, so
   the validator's error on ['demo', 'levels'] lands on it. */
function demoLevels(doc, el) {
  const N = levelCount(), all = Array.from({ length: N }, (_, i) => i + 1);
  const names = (store.files['levels.json'] && store.files['levels.json'].levels) || [];
  const wrap = h(doc, 'div', 'adm-field adm-demolevels');
  wrap.dataset.rel = A;
  wrap.dataset.path = 'demo.levels';
  wrap.appendChild(h(doc, 'span', 'adm-label', 'Levels'));
  const body = h(doc, 'div');
  const box = (key, text, title) => {
    const lab = h(doc, 'label');
    const cb = doc.createElement('input');
    cb.type = 'checkbox';
    cb.dataset.demo = key;
    if (title) lab.title = title;
    lab.append(cb, ' ' + text);
    return [lab, cb];
  };
  const [rl, rnd] = box('random', 'Random (any level)');
  body.appendChild(rl);
  const grid = h(doc, 'div', 'adm-levels');
  const cbs = all.map((k) => {
    const lv = names[k - 1];
    const [lab, cb] = box(String(k), String(k), lv ? lv.name + (lv.type === 'kitchen' ? ' (kitchen)' : ' (delivery)') : null);
    grid.appendChild(lab);
    return cb;
  });
  body.appendChild(grid);
  wrap.appendChild(body);
  const msg = h(doc, 'div', 'adm-msg');
  wrap.appendChild(msg);
  el.appendChild(wrap);

  const show = () => {
    const v = store.get(A, 'demo.levels'), random = v === 'random';
    rnd.checked = random;
    cbs.forEach((cb, i) => {
      cb.checked = random || (Array.isArray(v) && v.includes(i + 1));
      cb.disabled = random;
      cb.parentNode.className = random ? 'off' : '';
    });
  };
  rnd.addEventListener('change', () => { store.set(A, 'demo.levels', rnd.checked ? 'random' : all.slice()); show(); });
  cbs.forEach((cb, i) => cb.addEventListener('change', () => {
    const v = store.get(A, 'demo.levels'), cur = new Set(Array.isArray(v) ? v : all);
    if (cb.checked) cur.add(i + 1); else cur.delete(i + 1);
    store.set(A, 'demo.levels', [...cur].sort((a, b) => a - b));
    show();
  }));
  wrap._show = show;
  wrap._msg = msg;
  wrap._local = null;
  Admin.controls.add(wrap);
  show();
}

function factoryBoard(doc, el) {
  const grid = h(doc, 'div', 'adm-board');
  for (let i = 0; i < SCORE_MAX; i++) {
    grid.appendChild(h(doc, 'span', 'adm-label', String(i + 1)));
    Admin.field(grid, { rel: S, path: ['board', i, 'ini'], kind: 'text', title: 'three initials' });
    Admin.field(grid, { rel: S, path: ['board', i, 'cents'], kind: 'money', title: 'the run total; the board must stay highest first' });
  }
  el.appendChild(grid);
}

function draw(el) {
  const doc = el.ownerDocument;
  el.textContent = '';
  if (!store.files[A]) { el.appendChild(h(doc, 'p', 'adm-empty', 'No attract.json loaded.')); return; }

  const cyc = h(doc, 'div', 'adm-cycle', cycleText());
  cyc.dataset.cycle = '1';
  cycleEls.add(cyc);
  el.appendChild(cyc);

  for (const [key, name, go] of SCREENS) {
    const sec = h(doc, 'div', 'adm-screen');
    sec.dataset.screen = key;
    const head = h(doc, 'h3', null, name);
    const btn = h(doc, 'button', 'adm-show', 'Show it');
    btn.type = 'button';
    btn.dataset.show = key;
    btn.addEventListener('click', () => { const g = game(); if (g) go(g); });
    head.appendChild(btn);
    sec.appendChild(head);
    Admin.field(sec, { rel: A, path: [key, 'seconds'], kind: 'seconds', label: 'Duration', title: '3 to 600 seconds' });
    if (key === 'title')
      Admin.field(sec, { rel: A, path: ['title', 'wordmarkHold'], kind: 'seconds', label: 'Wordmark hold',
        title: 'seconds the badge stands alone before CARNAGE ASADA grows in; at most the duration less 2s' });
    if (key === 'winners') {
      Admin.field(sec, { rel: W, path: ['slogan'], kind: 'lines', label: 'Message', title: 'one line per row, drawn at scale 2 (31 characters a line)' });
      Admin.field(sec, { rel: W, path: ['attribution'], kind: 'lines', label: 'Attribution as drawn', title: 'one line per row (62 characters a line)' });
      Admin.field(sec, { rel: W, path: ['credit'], kind: 'text', label: 'Credit' });
    }
    if (key === 'scores') {
      sec.appendChild(h(doc, 'div', 'adm-label', 'Factory board (a board saved in the browser still wins over it)'));
      factoryBoard(doc, sec);
    }
    if (key === 'demo') demoLevels(doc, sec);
    el.appendChild(sec);
  }
}

Admin.tab('attract', 'Attract', draw);
