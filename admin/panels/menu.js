/* Service Mode: the Menu panel. One tab per era.

   The bin board is the kitchen's: twelve bins in 2x6 (slot i at column i % 6,
   row i / 6), with a base station either side. Each bin shows its well, decoded
   with Faces.decode(LATTICE[key]) and drawn at 2x. A bin never moves between
   eras (the build refuses it), so a bin an earlier era filled is read-only
   here; one this era filled has its name and plate, which carry to the later
   eras holding the same bin; and only an empty slot takes a new ingredient.

   A new ingredient needs well art, made here: pick a well to start from and a
   hue / saturation / value, and Preview runs tools/render/recolor-lattice.mjs
   on the server (POST /admin/api/recolor). That writes
   content/lattice/<key>.json at once, inert until a saved menu names it, and
   never over an existing file. Put in bin then fills the slot (here and in the
   later eras, where it is still empty), and Save writes menus.json.

   Items: name, ticket, short (with the NOW BUILDING budget left, live), the
   base, up to six ingredients from this era's bins, and the price in dollars.
   Every control is bound to content/menus.json at the path the validator
   reports a ContentError on; a recipe with no board art is refused on the
   recipe as a whole. Game consts (G, Faces, LATTICE) are read by bare name,
   never globalThis. The refreshers live in admin/apply.js. */
import '../fields.js';
import { store } from '../store.js';
import { BIN_COUNT, NOW_PX, nowCost } from '../../tools/content/validate.mjs';

const Admin = (globalThis.Admin = globalThis.Admin || {});
const REL = 'menus.json', MAX_ING = 6;

let era = '1';          // the era tab on show
let selBin = null;      // the slot whose details are shown
let panel = null;       // the element the panel was last drawn into
const forms = {};       // 'era:slot' -> the new-ingredient form's state

const h = (doc, tag, cls, text) => { const n = doc.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
const btn = (doc, text, act, title) => { const b = h(doc, 'button', 'adm-show', text); b.type = 'button'; b.dataset.act = act; if (title) b.title = title; return b; };
const game = () => (typeof G !== 'undefined' ? G : undefined);
const menus = () => store.files[REL] || {};
const eras = () => Object.keys(menus()).filter((k) => /^\d+$/.test(k)).sort((a, b) => a - b);
const later = (e) => eras().filter((x) => Number(x) > Number(e));
const redraw = () => { if (panel) draw(panel); };

/* ---- wells ------------------------------------------------------------- */

/* the lattice records in the working copy, by record name: a well just made
   by Preview is here before the game's LATTICE has it */
function records() {
  const o = {};
  for (const [rel, f] of Object.entries(store.files)) if (rel.startsWith('lattice/') && f && typeof f.name === 'string') o[f.name] = f;
  return o;
}
const decoded = new WeakMap();
function wellImage(key) {
  if (typeof Faces === 'undefined' || !Faces || typeof Faces.decode !== 'function') return null;
  let rec = null;
  try { rec = typeof LATTICE !== 'undefined' && LATTICE ? LATTICE[key] : null; } catch (e) { rec = null; }
  rec = rec || records()[key];
  if (!rec) return null;
  if (!decoded.has(rec)) {
    try { decoded.set(rec, Faces.decode(rec)); } catch (e) { console.warn('Service Mode: the well ' + key + ' did not decode', e); return null; }
  }
  return decoded.get(rec);
}
function well(doc, key) {
  const img = wellImage(key), c = doc.createElement('canvas');
  c.className = 'adm-well';
  c.dataset.well = key;
  if (img && typeof c.getContext === 'function') {
    c.width = img.width * 2; c.height = img.height * 2;
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    x.drawImage(img, 0, 0, c.width, c.height);
  } else { c.width = 84; c.height = 48; c.title = 'no art for ' + key; }
  return c;
}

/* ---- the bin board ----------------------------------------------------- */

const prevOf = (e) => { const i = eras().indexOf(e); return i > 0 ? menus()[eras()[i - 1]] : null; };
function stateOf(e, i) {
  const m = menus()[e], p = prevOf(e);
  if (!m.bins[i]) return 'empty';
  return p && p.bins[i] ? 'locked' : 'own';
}
const filledIn = (e, i) => eras().find((x) => Number(x) <= Number(e) && menus()[x].bins[i]) || e;

function board(doc, el, e) {
  const m = menus()[e];
  const g = h(doc, 'div', 'adm-binboard');
  const station = (side, key, list) => {
    const s = h(doc, 'div', 'adm-base');
    s.dataset.base = side;
    s.append(well(doc, key), h(doc, 'div', 'adm-plate', list.map((b) => b.name).join(' / ')));
    return s;
  };
  g.appendChild(station('left', 'TORTILLA', m.bases.left));
  const bins = h(doc, 'div', 'adm-bins');
  for (let i = 0; i < BIN_COUNT; i++) {
    const b = m.bins[i], st = stateOf(e, i);
    const cell = h(doc, 'button', 'adm-bin adm-bin-' + st + (selBin === i ? ' on' : ''));
    cell.type = 'button';
    cell.dataset.bin = String(i);
    cell.dataset.state = st;
    cell.title = (i + 1) + '. ' + (b ? b.name + (st === 'locked' ? ' (Era ' + filledIn(e, i) + ')' : '') : 'empty');
    cell.append(well(doc, b ? b.key : 'EMPTY'), h(doc, 'div', 'adm-plate', b ? b.plate : '[EMPTY]'));
    cell.addEventListener('click', () => { selBin = selBin === i ? null : i; redraw(); });
    bins.appendChild(cell);
  }
  g.appendChild(bins);
  g.appendChild(station('right', m.bases.right[0] ? m.bases.right[0].key : 'CHIPS', m.bases.right));
  el.appendChild(g);
}

/* a name or plate edit to this era's bin, carried to the later eras that hold it */
function carry(e, i, field) {
  const v = store.get(REL, [e, 'bins', i, field]), key = store.get(REL, [e, 'bins', i, 'key']);
  for (const x of later(e)) {
    const lb = menus()[x].bins[i];
    if (lb && lb.key === key && lb[field] !== v) store.set(REL, [x, 'bins', i, field], v);
  }
}

function binDetail(doc, el, e, i) {
  const m = menus()[e], b = m.bins[i], st = stateOf(e, i);
  const box = h(doc, 'div', 'adm-screen adm-bindetail');
  box.appendChild(h(doc, 'h3', null, 'Bin ' + (i + 1) + (b ? ': ' + b.name : ': empty')));
  if (st === 'locked') {
    box.appendChild(h(doc, 'p', 'adm-readonly', b.key + ', plate ' + b.plate + '. Filled in Era ' + filledIn(e, i) +
      '; a bin never moves, so it is edited there.'));
  } else if (st === 'own') {
    box.appendChild(h(doc, 'p', 'adm-readonly', 'Key ' + b.key + ' (the well it shows, and what recipes name)'));
    for (const [f, label, title] of [['name', 'Name', 'the bin\'s name'], ['plate', 'Plate', 'the name plate on the board: 7 characters']]) {
      const c = Admin.field(box, { rel: REL, path: [e, 'bins', i, f], kind: 'text', label, title });
      c.addEventListener('input', () => carry(e, i, f));
    }
    const x = btn(doc, 'Empty this bin', 'empty-bin', 'empties it in this era; later eras keep it');
    x.addEventListener('click', () => { store.set(REL, [e, 'bins', i], null); redraw(); });
    box.appendChild(x);
  } else newIngredient(doc, box, e, i);
  el.appendChild(box);
}

/* ---- a new ingredient in an empty bin ---------------------------------- */

function newIngredient(doc, box, e, i) {
  const id = e + ':' + i;
  const f = forms[id] || (forms[id] = { key: '', name: '', plate: '', src: 'BEANS', hue: '0', sat: '1', val: '1', msg: '', made: null });
  const wells = Object.keys(records()).sort();
  box.appendChild(h(doc, 'p', 'adm-readonly', 'A new ingredient needs a well. Start from one, move its colours, and Preview writes '
    + 'content/lattice/<key>.json (never over an existing file). Put in bin fills the slot; Save keeps it.'));
  box.appendChild(h(doc, 'p', 'adm-readonly adm-warn', 'Each Preview writes a new well file, so trying another colour needs another key. '
    + 'Wells you do not use are not deleted: remove them from content/lattice/ by hand.'));
  const inputs = {};
  const row = (k, label, title) => {
    const w = h(doc, 'div', 'adm-field');
    const lab = h(doc, 'label', 'adm-label', label);
    let c;
    if (k === 'src') {
      c = doc.createElement('select');
      wells.forEach((n, j) => { const o = doc.createElement('option'); o.value = String(j); o.textContent = n; c.appendChild(o); });
      c.value = String(Math.max(0, wells.indexOf(f.src)));
    } else {
      c = doc.createElement('input'); c.type = 'text'; c.autocomplete = 'off'; c.spellcheck = false;
      c.value = f[k];
    }
    c.dataset.ni = k;
    if (title) c.title = title;
    w.append(lab, c);
    box.appendChild(w);
    inputs[k] = c;
  };
  row('key', 'Key', 'upper-case letters: the well\'s name, and what recipes name (CHICKEN)');
  row('name', 'Name', 'the ingredient as the menu names it (GRILLED CHICKEN)');
  row('plate', 'Plate', 'the name plate on the board: 7 characters');
  row('src', 'Start from', 'the well whose pixels are kept; only its food colours move');
  row('hue', 'Hue', 'degrees to rotate, e.g. -20');
  row('sat', 'Saturation', 'a multiplier: 1 keeps it');
  row('val', 'Value', 'a multiplier: 1 keeps it');
  const read = () => {
    for (const k of ['key', 'name', 'plate', 'hue', 'sat', 'val']) f[k] = String(inputs[k].value);
    f.key = f.key.trim().toUpperCase();
    f.src = wells[Number(inputs.src.value)] || f.src;
  };
  const msg = h(doc, 'div', 'adm-msg adm-nimsg', f.msg);
  msg.dataset.ni = 'msg';
  const bar = h(doc, 'div', 'adm-row');
  const pv = btn(doc, 'Preview', 'preview', 'recolour the well on the server and show it');
  const fill = btn(doc, 'Put in bin ' + (i + 1), 'fill', 'fill this slot, here and in the later eras where it is empty');
  fill.disabled = !(f.made && f.made.name === f.key);
  bar.append(pv, fill);
  box.append(bar, msg);
  if (f.made) box.appendChild(well(doc, f.made.name));

  pv.addEventListener('click', () => preview(f, read));
  fill.addEventListener('click', () => {
    read();
    if (!f.made || f.made.name !== f.key) return;
    const slot = { key: f.made.name, name: f.name.trim() || f.made.name, plate: f.plate.trim() || f.made.name.slice(0, 7) };
    /* the latest era first, so every step on the way is a valid menu */
    for (const x of later(e).reverse()) if (menus()[x].bins[i] == null) store.set(REL, [x, 'bins', i], { ...slot });
    store.set(REL, [e, 'bins', i], slot);
    delete forms[id];
    redraw();
  });
}

async function preview(f, read) {
  read();
  const body = { src: f.src, name: f.key, hue: Number(f.hue), sat: Number(f.sat), val: Number(f.val) };
  f.made = null;
  if (!/^[A-Z]+$/.test(body.name)) f.msg = 'the key must be upper-case letters, like CHICKEN';
  else if (![body.hue, body.sat, body.val].every(Number.isFinite) || body.sat < 0 || body.val < 0) f.msg = 'hue is degrees; saturation and value are multipliers of 0 or more';
  else {
    f.msg = 'recolouring…'; redraw();
    try {
      const r = await fetch((store.base || '') + '/admin/api/recolor', {
        method: 'POST', headers: { 'content-type': 'application/json', ...store.headers }, body: JSON.stringify(body) });
      const j = await r.json();
      if (r.status === 200) {
        store.adopt(j.rel, j.json, j.stamp);  // already on disk: in the working copy, not dirty, stamped
        f.made = j.json;
        f.msg = 'wrote content/' + j.rel + (j.output ? ': ' + j.output : '');
        applyNow();
      } else if (r.status === 409 && j.error === 'exists') f.msg = 'content/lattice/' + body.name.toLowerCase() + '.json already exists, and nothing overwrites a well: pick another key';
      else if (r.status === 409) f.msg = 'the server is busy: try again in a moment';
      else f.msg = 'not made: ' + (j.output || j.error || 'HTTP ' + r.status);
    } catch (x) { f.msg = 'not made: ' + String(x && x.message || x); }
  }
  redraw();
}

/* the new well into the running game, so a bin that names it draws it */
function applyNow() {
  const v = store.validate();
  if (v.built) {
    try { Admin.applyBuilt(v.built, game(), { skip: ['faces', 'music'] }); store.applyError = null; } catch (x) { store.applyError = x; }
  }
  store.emit();
}

/* ---- items ------------------------------------------------------------- */

function budgetText(it) {
  const steps = it && Array.isArray(it.recipe) ? it.recipe.length : 0, s = String((it && it.short) || '');
  /* characters are counted by asking nowCost itself, so the rule lives in validate.mjs only */
  const fits = (t) => nowCost(t, steps) <= NOW_PX;
  const px = NOW_PX - nowCost(s, steps), ch = (n) => n + ' character' + (n === 1 ? '' : 's');
  if (fits(s)) { let k = 0; while (k < 64 && fits(s + 'X'.repeat(k + 1))) k++; return px + 'px left, ' + ch(k) + ' left'; }
  let t = 1;
  while (t < s.length && !fits(s.slice(0, s.length - t))) t++;
  return 'over by ' + -px + 'px: trim ' + ch(t);
}
/* text that follows the store as you type: the budget, and the item's heading */
const live = new Set();
store.onChange(() => {
  for (const b of [...live]) {
    if (!b.el.isConnected) { live.delete(b); continue; }
    const it = store.get(REL, [b.e, 'items', b.i]);
    b.el.textContent = b.head ? (b.i + 1) + '. ' + (it ? it.name : '') : budgetText(it);
  }
});

function newItem(m) {
  const last = m.items[m.items.length - 1];
  const taken = (v) => m.items.some((x) => x.name === v || x.ticket === v || x.short === v);
  let k = 1, name;
  do { name = 'NEW ITEM' + (k > 1 ? ' ' + k : ''); k++; } while (taken(name));
  let short = 'NEW', s = 2;
  while (taken(short)) short = 'NEW' + s++;
  /* the last item's recipe, whose board frames exist: a recipe with none is refused */
  return { name, ticket: name, short, price: last ? last.price : 0, recipe: last ? last.recipe.slice() : [] };
}

function recipeGroup(doc, box, e, i, it, m) {
  const filled = m.bins.filter(Boolean);
  const binOpts = filled.map((b) => ({ value: b.key, label: b.name }));
  const baseOpts = [...m.bases.left, ...m.bases.right].map((b) => ({ value: b.key, label: b.name }));
  const P = [e, 'items', i, 'recipe'];
  const wrap = h(doc, 'div', 'adm-recipe');
  wrap.dataset.rel = REL;
  wrap.dataset.path = P.join('.');
  const set = (r) => { store.set(REL, P, r); redraw(); };
  const r = Array.isArray(it.recipe) ? it.recipe : [];
  Admin.field(wrap, { rel: REL, path: [...P, 0], kind: 'select', label: 'Base', options: baseOpts, title: 'ingredient 0 is always the base' });
  for (let j = 1; j < r.length; j++) {
    const line = h(doc, 'div', 'adm-ingrow');
    Admin.field(line, { rel: REL, path: [...P, j], kind: 'select', label: 'Ingredient ' + j, options: binOpts });
    if (r.length > 2) {
      const x = btn(doc, '×', 'del-ing', 'remove this ingredient');
      x.dataset.item = String(i); x.dataset.j = String(j);
      x.addEventListener('click', () => { const n = r.slice(); n.splice(j, 1); set(n); });
      line.appendChild(x);
    }
    wrap.appendChild(line);
  }
  if (r.length - 1 < MAX_ING) {
    const add = btn(doc, '+ ingredient', 'add-ing', 'a new step needs board art: an existing recipe\'s sequence builds, a new one is refused until its frames are baked');
    add.dataset.item = String(i);
    add.addEventListener('click', () => {
      const pickK = (filled.find((b) => !r.includes(b.key)) || filled[0] || {}).key;
      if (pickK) set([...r, pickK]);
    });
    wrap.appendChild(add);
  }
  const msg = h(doc, 'div', 'adm-msg');
  wrap.appendChild(msg);
  wrap._show = () => {};
  wrap._msg = msg;
  wrap._local = null;
  Admin.controls.add(wrap);
  box.appendChild(wrap);
}

function items(doc, el, e) {
  const m = menus()[e];
  const sec = h(doc, 'div', 'adm-items');
  sec.appendChild(h(doc, 'h3', 'adm-sub', 'Items'));
  const move = (i, d) => { const a = m.items.slice(); [a[i], a[i + d]] = [a[i + d], a[i]]; store.set(REL, [e, 'items'], a); redraw(); };
  m.items.forEach((it, i) => {
    const box = h(doc, 'div', 'adm-screen adm-menuitem');
    box.dataset.item = String(i);
    const head = h(doc, 'h3'), title = h(doc, 'span', null, (i + 1) + '. ' + it.name);
    live.add({ el: title, e, i, head: true });
    head.appendChild(title);
    const tools = h(doc, 'span', 'adm-tools');
    const tool = (text, act, fn, title) => { const b = btn(doc, text, act, title); b.dataset.item = String(i); b.addEventListener('click', fn); tools.appendChild(b); };
    if (i > 0) tool('↑', 'up', () => move(i, -1), 'move up');
    if (i < m.items.length - 1) tool('↓', 'down', () => move(i, 1), 'move down');
    tool('Remove', 'remove', () => { const a = m.items.slice(); a.splice(i, 1); store.set(REL, [e, 'items'], a); redraw(); }, 'take it off this era\'s menu');
    head.appendChild(tools);
    box.appendChild(head);
    const P = [e, 'items', i];
    Admin.field(box, { rel: REL, path: [...P, 'name'], kind: 'text', label: 'Name' });
    Admin.field(box, { rel: REL, path: [...P, 'ticket'], kind: 'text', label: 'Ticket', title: 'the ticket line: 12 characters' });
    Admin.field(box, { rel: REL, path: [...P, 'short'], kind: 'text', label: 'Short', title: 'the NOW BUILDING readout: 12 x chars + 9 x steps <= ' + NOW_PX });
    const bud = h(doc, 'div', 'adm-budget', budgetText(it));
    bud.dataset.budget = String(i);
    live.add({ el: bud, e, i });
    box.appendChild(bud);
    recipeGroup(doc, box, e, i, it, m);
    Admin.field(box, { rel: REL, path: [...P, 'price'], kind: 'money', label: 'Price', title: 'flavour only: what a ticket pays is difficulty.json' });
    sec.appendChild(box);
  });
  const add = btn(doc, '+ Add item', 'add-item', 'a copy of the last item\'s recipe, under a new name');
  add.addEventListener('click', () => { store.set(REL, [e, 'items'], [...m.items, newItem(m)]); redraw(); });
  sec.appendChild(add);
  el.appendChild(sec);
}

/* ---- the panel --------------------------------------------------------- */

function draw(el) {
  const doc = el.ownerDocument;
  el.textContent = '';
  panel = el;
  const list = eras();
  if (!store.files[REL] || !list.length) { el.appendChild(h(doc, 'p', 'adm-empty', 'No menus.json loaded.')); return; }
  if (!list.includes(era)) era = list[0];

  const bar = h(doc, 'div', 'adm-tabs adm-erabar');
  for (const e of list) {
    const b = h(doc, 'button', 'adm-tab' + (e === era ? ' on' : ''), 'Era ' + e);
    b.type = 'button';
    b.dataset.era = e;
    b.addEventListener('click', () => { era = e; selBin = null; redraw(); });
    bar.appendChild(b);
  }
  el.appendChild(bar);
  board(doc, el, era);
  if (selBin !== null) binDetail(doc, el, era, selBin);
  items(doc, el, era);
  if (Admin.paintErrors) Admin.paintErrors();
}

Admin.tab('menu', 'Menu', draw);
