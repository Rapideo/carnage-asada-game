/* Service Mode: the Levels panel.
   A list of the 20 levels; the one selected gets its editable fields. Every
   field is bound to content/levels.json at ['levels', i, ...], which is the
   path the validator reports a ContentError on. Game consts (G, DIFFICULTY,
   PLAYLIST) are read by bare name, never globalThis. */
import '../fields.js';
import { store } from '../store.js';
import { TYPES, SEASONS } from '../../tools/content/validate.mjs';

const Admin = (globalThis.Admin = globalThis.Admin || {});
const REL = 'levels.json';

let sel = 0;            // index of the selected level
let panel = null;       // the element the panel was last drawn into
let drift;              // undefined = not asked, null = failed, else [{ file, lines }]

const h = (doc, tag, cls, text) => { const n = doc.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };

function playlistOf(n) {
  try {
    const ids = PLAYLIST[String(n)];
    return Array.isArray(ids) && ids.length ? ids.join(', ') : '(none)';
  } catch (e) { return '(not loaded)'; }
}

function difficultyKeys() {
  try { return Object.keys(DIFFICULTY); } catch (e) { return ['easy', 'medium', 'hard']; }
}

/* "Play this level": the Test panel's jump (admin/test.js), onto the level's
   card; the run itself only if the harness did not load. */
function play(n) {
  if (Admin.test && typeof Admin.test.jump === 'function') return Admin.test.jump(n, 'card');
  G.startRun(n);
}

function driftLine(doc, el) {
  const line = h(doc, 'div', 'adm-drift');
  el.appendChild(line);
  const say = (list) => {
    const n = (list || []).reduce((s, d) => s + (d.lines || 0), 0);
    line.textContent = n ? n + ' lines in the docs differ from the JSON; the next save rewrites them.' : '';
    line.hidden = !n;
  };
  if (drift !== undefined) return say(drift);
  line.hidden = true;
  fetch((store.base || '') + '/admin/api/drift')
    .then((r) => (r.ok ? r.json() : null))
    .then((j) => { drift = Array.isArray(j) ? j : null; say(drift); })
    .catch(() => { drift = null; });
}

function draw(el) {
  const doc = el.ownerDocument;
  el.textContent = '';
  panel = el;
  const levels = (store.files[REL] && store.files[REL].levels) || [];
  if (!levels.length) { el.appendChild(h(doc, 'p', 'adm-empty', 'No levels loaded.')); return; }
  if (sel >= levels.length) sel = levels.length - 1;

  driftLine(doc, el);

  const list = h(doc, 'div', 'adm-list');
  levels.forEach((lv, i) => {
    const b = h(doc, 'button', 'adm-item' + (i === sel ? ' on' : ''), lv.n + '  ' + (lv.type === 'kitchen' ? 'K' : 'D') + '  ' + lv.name);
    b.type = 'button';
    b.dataset.level = String(i);
    b.addEventListener('click', () => { sel = i; draw(el); });
    list.appendChild(b);
  });
  el.appendChild(list);

  const lv = levels[sel];
  const form = h(doc, 'div', 'adm-form');
  const ro = (label, text) => {
    const w = h(doc, 'div', 'adm-field');
    w.append(h(doc, 'span', 'adm-label', label), h(doc, 'span', 'adm-readonly', text));
    form.appendChild(w);
    return w;
  };
  const path = (k) => ['levels', sel, k];
  ro('Sequence', 'Level ' + lv.n + ' of ' + levels.length);
  Admin.field(form, { rel: REL, path: path('type'), kind: 'select', label: 'Game Type', options: TYPES });
  Admin.field(form, { rel: REL, path: path('name'), kind: 'text', label: 'Name' });
  Admin.field(form, { rel: REL, path: path('year'), kind: 'int', label: 'Year', title: 'Year, 1970 to 1999; era and name must agree with it' });
  Admin.field(form, { rel: REL, path: path('era'), kind: 'select', label: 'Era', options: [1, 2, 3] });
  Admin.field(form, { rel: REL, path: path('difficulty'), kind: 'select', label: 'Difficulty', options: difficultyKeys() });
  Admin.field(form, { rel: REL, path: path('season'), kind: 'select', label: 'Season', options: SEASONS });
  const mus = ro('Music', playlistOf(lv.n) + '  ');
  const link = h(doc, 'a', 'adm-link', 'edit in the Music tab');
  link.href = '#';
  link.addEventListener('click', (ev) => {
    ev.preventDefault();
    const t = doc.querySelector('.adm-tab[data-tab="music"]');
    if (t) t.click();
  });
  mus.querySelector('.adm-readonly').appendChild(link);
  el.appendChild(form);

  const go = h(doc, 'button', 'adm-save adm-play', 'Play this level');
  go.type = 'button';
  go.addEventListener('click', () => play(lv.n));
  el.appendChild(go);
}

Admin.tab('levels', 'Levels', draw);

/* No refresher here on purpose: apply.js already repoints G.level at the new
   content and restarts the screen only when a gameplay field of the current
   level changed (type, era, year, season, difficulty, map, menu). A rename
   alone must not restart a run per keystroke. */
