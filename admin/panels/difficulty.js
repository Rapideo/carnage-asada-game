/* Service Mode: the Difficulty panel.
   One column per difficulty (DIFF_KEYS, in ladder order), one row per value,
   grouped as difficulty.json groups them. Every cell is bound to
   content/difficulty.json at [key, ...path], the path the validator reports a
   ContentError on, so the ladder rule's message lands on the cell it names.

   No refresher here on purpose. apply.js already re-points G.diff, G.nav and
   Kitchen.diff at the new content whenever difficulty.json changes, which is
   what "the current difficulty's values reach G.diff" needs. G.setLevel would do
   that too, but it also re-rolls the weather, so a keystroke here could start
   rain mid-drive. */
import '../fields.js';
import { store } from '../store.js';
import { DIFF_KEYS, NAV_KEYS } from '../../tools/content/validate.mjs';

const Admin = (globalThis.Admin = globalThis.Admin || {});
const REL = 'difficulty.json';
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const h = (doc, tag, cls, text) => { const n = doc.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };

/* A decay is cents per second; the doc and this panel write it as $1.00 / N s
   and the field edits N. 100 / 3 round-trips to the shipped 33.333... exactly.
   N is shown to 2 decimals, so a rate that is not 100 / (a 2-decimal N), such as
   30 cents/s ("3.33"), would be stored as 30.03 if the shown text were read back:
   text equal to what the field shows for the stored value keeps that value. */
const shown = (v) => (typeof v === 'number' && v > 0 ? String(Number((100 / v).toFixed(2))) : '');
const perDollar = (path) => ({
  fromJSON: shown,
  toJSON: (s) => {
    const t = s.trim(), cur = store.get(REL, path);
    if (t !== '' && t === shown(cur)) return cur;
    if (!/^\d+(\.\d+)?$/.test(t) || !(Number(t) > 0)) throw new Error('needs a number of seconds above 0, like 3');
    return 100 / Number(t);
  },
});

/* a wind strength, 0 to 1: typed as a plain number, range-checked by the
   validator so a 1.5 is refused on its cell with the validator's message */
const fraction = {
  fromJSON: (v) => (typeof v === 'number' ? String(v) : ''),
  toJSON: (s) => {
    const t = s.trim();
    if (!/^(\d+(\.\d*)?|\.\d+)$/.test(t)) throw new Error('needs a number from 0 to 1, like 0.55');
    return Number(t);
  },
};

const NAV_LABEL = { panel: 'Nav panel', line: 'Map route line', dot: 'Map dot', edge: 'Edge pointer', beacon: 'Beacon' };

/* [group, [[path, label, kind], ...]]; kind 'rate' is a decay ($1.00 / N s),
   'fraction' a 0-1 number */
const GROUPS = [
  ['Clock', [['start', 'Starting clock', 'seconds'], ['extend', 'Extension adds', 'seconds'],
    ['maxExt', 'Max extensions', 'int'], ['target', 'Level target', 'int']]],
  ['Tips', [['tipStart', 'Starting tip', 'money'], ['tipFloor', 'Tip floor', 'money'], ['tipDecay', 'Tip decay', 'rate']]],
  ['Fines', [['fines.ticket', 'Speeding ticket', 'money'], ['fines.ped', 'Hitting pedestrian', 'money'],
    ['fines.train', 'Hitting train', 'money'], ['fines.remake', 'Remake', 'money']]],
  ['Nav', NAV_KEYS.map((f) => ['nav.' + f, NAV_LABEL[f] || f, 'bool'])],
  ['Kitchen', [['kitchen.tipPerItem', 'Tip per item', 'money'], ['kitchen.decay', 'Tip decay', 'rate'],
    ['kitchen.maxItems', 'Max items per ticket', 'int'], ['kitchen.every', 'New ticket every', 'seconds'],
    ['kitchen.railMax', 'Tickets on the rail', 'int'], ['kitchen.queueMax', 'Customers who queue', 'int'],
    ['kitchen.hint', 'Next-ingredient hint', 'bool'],
    ['kitchen.hintNewOnly', 'Only for new dishes', 'bool'], ['kitchen.hintStall', 'Hint after a stall of', 'seconds'], ['kitchen.cleanBonus', 'Clean ticket bonus', 'money']]],
  ['Bonus', [['perfectBonus', 'Perfect delivery', 'money']]],
  /* Delivery Shift: cars on the road around the player */
  ['Road', [['traffic', 'Cars on the road', 'int']]],
  /* windy Delivery levels only (levels.json says which): 55_wind.js */
  ['Wind', [['wind.strength', 'Wind strength (0-1)', 'fraction'], ['wind.gustEvery.0', 'A gust every, at least', 'seconds'],
    ['wind.gustEvery.1', 'and at most', 'seconds'], ['wind.tumbleweeds', 'Tumbleweeds', 'int']]],
];

/* the read-only row: seconds for a delivery tip to fall from start to floor */
function toFloor(k) {
  const d = store.get(REL, [k]);
  if (!d) return '—';
  const v = (d.tipStart - d.tipFloor) / d.tipDecay;
  return Number.isFinite(v) && v >= 0 ? v.toFixed(0) + 's' : '—';
}
const derivedCells = new Set();
store.onChange(() => {
  for (const c of [...derivedCells]) {
    if (!c.isConnected) { derivedCells.delete(c); continue; }
    c.textContent = toFloor(c.dataset.derived);
  }
});

function draw(el) {
  const doc = el.ownerDocument;
  el.textContent = '';
  derivedCells.clear();
  const D = store.files[REL];
  if (!D) { el.appendChild(h(doc, 'p', 'adm-empty', 'No difficulty.json loaded.')); return; }

  const table = h(doc, 'table', 'adm-diff');
  const head = h(doc, 'tr');
  head.appendChild(h(doc, 'th', 'adm-rowhead'));
  for (const k of DIFF_KEYS) { const th = h(doc, 'th', 'adm-colhead', cap(k)); th.dataset.diff = k; head.appendChild(th); }
  table.appendChild(head);

  const row = (label, title) => {
    const tr = h(doc, 'tr');
    const th = h(doc, 'th', 'adm-rowhead', label);
    if (title) th.title = title;
    tr.appendChild(th);
    table.appendChild(tr);
    return tr;
  };
  for (const [group, rows] of GROUPS) {
    const gr = h(doc, 'tr', 'adm-group');
    const gth = h(doc, 'th', null, group);
    gth.colSpan = DIFF_KEYS.length + 1;
    gr.appendChild(gth);
    table.appendChild(gr);
    for (const [p, label, kind] of rows) {
      const tr = row(label, 'difficulty.json: <difficulty>.' + p);
      for (const k of DIFF_KEYS) {
        const td = h(doc, 'td');
        const path = [k, ...p.split('.')];
        if (kind === 'rate') Admin.field(td, { rel: REL, path, kind: 'seconds', label: '$1.00 /', ...perDollar(path), title: 'cents per second, as $1.00 every N seconds' });
        else if (kind === 'fraction') Admin.field(td, { rel: REL, path, kind: 'text', ...fraction, title: '0 is still air, 1 the strongest wind' });
        else Admin.field(td, { rel: REL, path, kind });
        tr.appendChild(td);
      }
    }
    if (group === 'Tips') {
      const tr = row('tip reaches the floor', '(tipStart - tipFloor) / tipDecay: read only');
      tr.className = 'adm-derivedrow';
      for (const k of DIFF_KEYS) {
        const td = h(doc, 'td', 'adm-readonly adm-derived', toFloor(k));
        td.dataset.derived = k;
        derivedCells.add(td);
        tr.appendChild(td);
      }
    }
  }
  el.appendChild(table);
}

Admin.tab('difficulty', 'Difficulty', draw);
