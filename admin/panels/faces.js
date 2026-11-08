/* Service Mode: the Faces panel. Three parts.

   Cast per era   each era of content/casts.json: its faces, each with Remove,
                  and "add from all faces" (every baked face not already in that
                  era). Kitchen.castFor(era) reads the list; the build refuses a
                  name that is not a face, a repeat, or an empty era.
   Eyes           a face drawn at 4x. Drag a rectangle over each eye (corners
                  snap to the face's pixel grid); a third replaces the nearer
                  of two. Clear empties them. Any edit here also sets the note
                  "_eyesByHand": true, which tells bake-face.mjs to keep these
                  eyes when the face is re-baked; Save writes the face file.
                  Blink shows the face mid-blink through the game's own
                  Faces.draw; Show in strip puts it in the dialogue strip.
   New face       drop (or choose) a PNG, name it, optionally give a crop in
                  the image's pixels, and Bake. The server runs fit-portrait
                  and bake-face (POST /admin/api/face); the face is written at
                  once, inert until a cast names it, and never over an existing
                  one. The result is shown in the dialogue strip at game size.

   Game consts (G, Faces, FACES, Dialog, DIALOGUE) are read by bare name,
   never globalThis. The refreshers live in admin/apply.js. */
import '../fields.js';
import { store } from '../store.js';

const Admin = (globalThis.Admin = globalThis.Admin || {});
const CASTS = 'casts.json', Z = 4;
const NAME = /^[a-z][a-z0-9]{1,23}$/;
const LINE = 'HOW DO I LOOK?';

let panel = null;
let pick = null;            // the face in the eye editor
let blinkOn = false;        // the eye editor shows it mid-blink
let drag = null;            // { x0, y0, x1, y1 } in face pixels, while dragging
const nf = { name: '', png: null, file: '', crop: '', msg: '' };   // the new-face form

const h = (doc, tag, cls, text) => { const n = doc.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
const btn = (doc, text, act, title) => { const b = h(doc, 'button', 'adm-show', text); b.type = 'button'; b.dataset.act = act; if (title) b.title = title; return b; };
const game = () => (typeof G !== 'undefined' ? G : undefined);
const relOf = (n) => 'faces/' + n + '.json';
const names = () => Object.keys(store.files).filter((r) => /^faces\/[^/]+\.json$/.test(r)).map((r) => r.slice(6, -5)).sort();
const casts = () => store.files[CASTS] || {};
const eras = () => Object.keys(casts()).filter((k) => /^\d+$/.test(k)).sort((a, b) => a - b);
const redraw = () => {
  if (!panel) return;
  const sc = panel.parentNode, top = sc && typeof sc.scrollTop === 'number' ? sc.scrollTop : null;
  draw(panel);
  if (top !== null) sc.scrollTop = top;
};

/* ---- pictures ------------------------------------------------------------ */

const decoded = new WeakMap();
function faceImage(n) {
  const f = store.files[relOf(n)];
  if (!f || typeof Faces === 'undefined' || !Faces || typeof Faces.decode !== 'function') return null;
  if (!decoded.has(f)) {
    try { decoded.set(f, Faces.decode(f)); } catch (e) { console.warn('Service Mode: the face ' + n + ' did not decode', e); return null; }
  }
  return decoded.get(f);
}
/* the face mid-blink, through the game's own Faces.draw (which reads FACES,
   so it shows the eyes as last applied: the working copy, once it validates) */
function blinkImage(doc, n) {
  const f = store.files[relOf(n)];
  if (!f || typeof Faces === 'undefined' || typeof FACES === 'undefined' || !FACES[n] || !Faces.img || !Faces.img[n]) return null;
  const c = doc.createElement('canvas');
  if (typeof c.getContext !== 'function') return null;
  c.width = f.w; c.height = f.h;
  try { Faces.draw(c.getContext('2d'), n, f.w >> 1, 0, { blink: 1 }); } catch (e) { return null; }
  return c;
}
function thumb(doc, n) {
  const c = h(doc, 'canvas', 'adm-thumb'), img = faceImage(n);
  c.dataset.thumb = n;
  if (img && typeof c.getContext === 'function') {
    c.width = img.width; c.height = img.height;
    c.getContext('2d').drawImage(img, 0, 0);
  } else { c.width = 30; c.height = 37; }
  return c;
}

/* ---- the strip ------------------------------------------------------------ */

/* Admin.test.say (Task 16) when it exists; until then Dialog.say directly. The
   strip is drawn only during a shift, so outside one nothing shows. */
function show(n) {
  if (Admin.test && typeof Admin.test.say === 'function') return Admin.test.say(LINE, n);
  if (typeof Dialog === 'undefined' || !Dialog || typeof Dialog.say !== 'function') return;
  const who = typeof DIALOGUE !== 'undefined' && DIALOGUE && DIALOGUE.who ? DIALOGUE.who : 'CUSTOMER';
  Dialog.say(who, LINE, { face: n, secs: 4 });
}

/* the working copy into the running game, so a new face can be drawn */
function applyNow() {
  const v = store.validate();
  if (v.built) {
    try { Admin.applyBuilt(v.built, game(), { skip: ['lattice', 'music'] }); store.applyError = null; } catch (x) { store.applyError = x; }
  }
  store.emit();
}

/* ---- cast per era --------------------------------------------------------- */

function castSection(doc, el, era) {
  const sec = h(doc, 'div', 'adm-screen');
  sec.dataset.section = 'cast-' + era;
  sec.appendChild(h(doc, 'h3', null, 'Era ' + era));
  const list = Array.isArray(casts()[era]) ? casts()[era] : [];
  const grid = h(doc, 'div', 'adm-cast');
  for (const n of list) {
    const tile = h(doc, 'div', 'adm-tile');
    tile.dataset.cast = era; tile.dataset.face = n;
    const rm = btn(doc, 'Remove', 'uncast', 'take ' + n + ' out of era ' + era);
    rm.dataset.era = era; rm.dataset.face = n;
    rm.addEventListener('click', () => { store.set(CASTS, era, list.filter((x) => x !== n)); redraw(); });
    tile.append(thumb(doc, n), h(doc, 'div', 'adm-tilename', n), rm);
    grid.appendChild(tile);
  }
  sec.appendChild(grid);
  const row = h(doc, 'div', 'adm-row');
  const sel = h(doc, 'select', 'adm-era');
  sel.dataset.add = era;
  sel.title = 'add from all faces';
  for (const n of names().filter((x) => !list.includes(x))) { const o = h(doc, 'option', null, n); o.value = n; sel.appendChild(o); }
  const add = btn(doc, 'Add to era ' + era, 'cast');
  add.dataset.era = era;
  add.addEventListener('click', () => {
    if (!sel.value) return;
    store.set(CASTS, era, [...list, sel.value]);
    redraw();
  });
  row.append(sel, add);
  sec.appendChild(row);
  el.appendChild(sec);
}

/* ---- eyes ----------------------------------------------------------------- */

function setEyes(n, eyes) {
  const rel = relOf(n);
  store.set(rel, '_eyesByHand', true);
  store.set(rel, 'eyes', eyes);
}
function addEye(n, r) {
  const f = store.files[relOf(n)];
  const eyes = (Array.isArray(f.eyes) ? f.eyes : []).map((e) => e.slice());
  if (eyes.length < 2) eyes.push(r);
  else {
    const c = (e) => [e[0] + e[2] / 2, e[1] + e[3] / 2], [nx, ny] = c(r);
    const d = eyes.map((e) => { const [x, y] = c(e); return (x - nx) ** 2 + (y - ny) ** 2; });
    eyes[d[0] <= d[1] ? 0 : 1] = r;
  }
  eyes.sort((a, b) => a[0] - b[0]);
  setEyes(n, eyes);
}

function paintEyes(cv, n) {
  if (typeof cv.getContext !== 'function') return;
  const f = store.files[relOf(n)], x = cv.getContext('2d');
  if (!x) return;
  x.imageSmoothingEnabled = false;
  x.fillStyle = '#2a2438'; x.fillRect(0, 0, cv.width, cv.height);
  const img = (blinkOn && blinkImage(cv.ownerDocument || document, n)) || faceImage(n);
  if (img) x.drawImage(img, 0, 0, f.w * Z, f.h * Z);
  x.lineWidth = 1;
  const box = (e, col) => { x.strokeStyle = col; x.strokeRect(e[0] * Z + 0.5, e[1] * Z + 0.5, e[2] * Z - 1, e[3] * Z - 1); };
  if (!blinkOn) for (const e of Array.isArray(f.eyes) ? f.eyes : []) box(e, '#3fb8b0');
  if (drag) box(rectOf(drag), '#f5c453');
}
const rectOf = (d) => [Math.min(d.x0, d.x1), Math.min(d.y0, d.y1), Math.abs(d.x1 - d.x0), Math.abs(d.y1 - d.y0)];

function eyesSection(doc, el) {
  const sec = h(doc, 'div', 'adm-screen');
  sec.dataset.section = 'eyes';
  sec.appendChild(h(doc, 'h3', null, 'Eyes'));
  const all = names();
  if (!all.includes(pick)) pick = all[0] || null;
  const sel = h(doc, 'select', 'adm-era');
  sel.dataset.pick = 'eyes';
  for (const n of all) { const o = h(doc, 'option', null, n); o.value = n; sel.appendChild(o); }
  sel.value = pick || '';
  sel.addEventListener('change', () => { pick = sel.value; blinkOn = false; drag = null; redraw(); });
  sec.appendChild(sel);
  if (!pick) { el.appendChild(sec); return; }

  const f = store.files[relOf(pick)];
  sec.appendChild(h(doc, 'p', 'adm-note', 'Drag a rectangle over each eye: the lid closes over it on a blink. Saving keeps them through a re-bake.'));
  const cv = h(doc, 'canvas', 'adm-eyes');
  cv.dataset.eyes = pick;
  cv.width = f.w * Z; cv.height = f.h * Z;
  const n = pick;
  const at = (e) => {
    let x = e.offsetX, y = e.offsetY;
    if (typeof cv.getBoundingClientRect === 'function' && e.clientX != null) {
      const r = cv.getBoundingClientRect();
      x = (e.clientX - r.left) * cv.width / (r.width || cv.width);
      y = (e.clientY - r.top) * cv.height / (r.height || cv.height);
    }
    const cl = (v, m) => Math.max(0, Math.min(m, v));
    return [cl(Math.round(x / Z), f.w), cl(Math.round(y / Z), f.h)];
  };
  cv.addEventListener('pointerdown', (e) => {
    if (e.button || blinkOn) return;
    const [x, y] = at(e);
    drag = { x0: x, y0: y, x1: x, y1: y };
    if (typeof cv.setPointerCapture === 'function' && e.pointerId != null) { try { cv.setPointerCapture(e.pointerId); } catch (x2) { /* not capturable */ } }
    if (e.preventDefault) e.preventDefault();
    paintEyes(cv, n);
  });
  cv.addEventListener('pointermove', (e) => {
    if (!drag) return;
    [drag.x1, drag.y1] = at(e);
    paintEyes(cv, n);
  });
  cv.addEventListener('pointerup', (e) => {
    if (!drag) return;
    [drag.x1, drag.y1] = at(e);
    const r = rectOf(drag);
    drag = null;
    if (r[2] >= 1 && r[3] >= 1) { addEye(n, r); redraw(); } else paintEyes(cv, n);
  });
  sec.appendChild(cv);
  paintEyes(cv, n);

  const eyes = Array.isArray(f.eyes) ? f.eyes : [];
  const state = f._eyesByHand ? 'set by hand' : eyes.length ? 'detected' : 'not set: this face does not blink';
  const list = h(doc, 'div', 'adm-note', (eyes.length ? eyes.map((e) => '[' + e.join(',') + ']').join('  ') + ' — ' : '') + state + '  ·  ' + f.w + 'x' + f.h);
  list.dataset.eyelist = n;
  sec.appendChild(list);
  const row = h(doc, 'div', 'adm-row');
  const clear = btn(doc, 'Clear', 'clear-eyes', 'no eyes: the face never blinks (sunglasses, say). Kept through a re-bake.');
  clear.addEventListener('click', () => { setEyes(n, []); redraw(); });
  const blink = btn(doc, blinkOn ? 'Eyes open' : 'Blink', 'blink', 'show it mid-blink, as the game draws it');
  blink.addEventListener('click', () => { blinkOn = !blinkOn; redraw(); });
  const say = btn(doc, 'Show in strip', 'say-face', 'put it in the dialogue strip at game size (during a shift)');
  say.addEventListener('click', () => show(n));
  row.append(clear, blink, say);
  sec.appendChild(row);
  el.appendChild(sec);
}

/* ---- new face ------------------------------------------------------------- */

function base64(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s);
}
async function takeFile(file) {
  if (!file || typeof file.arrayBuffer !== 'function') return;
  try {
    nf.png = base64(new Uint8Array(await file.arrayBuffer()));
    nf.file = String(file.name || 'image');
    nf.msg = '';
    if (!nf.name) { const s = nf.file.replace(/\.[^.]*$/, '').toLowerCase().replace(/[^a-z0-9]/g, ''); if (NAME.test(s)) nf.name = s; }
  } catch (e) { nf.msg = 'could not read the image: ' + String(e && e.message || e); }
  redraw();
}

async function bake() {
  const name = nf.name.trim(), crop = nf.crop.trim();
  let box = null;           // null: no crop; false: a crop that is not one
  if (crop) {
    box = crop.split(/[\s,]+/).map(Number);
    if (box.length !== 4 || !box.every((v) => Number.isInteger(v) && v >= 0) || !box[2] || !box[3]) box = false;
  }
  if (!NAME.test(name)) nf.msg = 'the name must be lower-case letters and digits, 2 to 24 of them, starting with a letter (like c80mall)';
  else if (!nf.png) nf.msg = 'drop an image (PNG) here first';
  else if (box === false)
    nf.msg = 'the crop is x y w h in the image\'s own pixels, or empty to let fit-portrait find the bust';
  else {
    nf.msg = 'baking…'; redraw();
    const body = { name, png: nf.png };
    if (box) body.crop = box;
    try {
      const r = await fetch((store.base || '') + '/admin/api/face', {
        method: 'POST', headers: { 'content-type': 'application/json', ...store.headers }, body: JSON.stringify(body) });
      const j = await r.json();
      if (r.status === 200) {
        store.files[j.rel] = j.json;          // already on disk: in the working copy, not dirty
        applyNow();
        pick = name;
        nf.msg = 'wrote content/' + j.rel + '. Add it to a cast to use it.\n' + (j.log || '');
        show(name);
      } else if (r.status === 409 && j.error === 'exists') nf.msg = 'a face called ' + name + ' already exists (' + (j.file || 'content/' + j.rel) + '), and nothing overwrites one: pick another name';
      else if (r.status === 409) nf.msg = 'the server is busy: try again in a moment';
      else if (r.status === 422) nf.msg = 'not baked:\n' + (j.log || '');
      else nf.msg = 'not baked: ' + (j.error || 'HTTP ' + r.status);
    } catch (x) { nf.msg = 'not baked: ' + String(x && x.message || x); }
  }
  redraw();
}

function newSection(doc, el) {
  const sec = h(doc, 'div', 'adm-screen adm-drop');
  sec.dataset.section = 'new';
  sec.appendChild(h(doc, 'h3', null, 'New face'));
  sec.appendChild(h(doc, 'p', 'adm-note', 'Drop a bust on a flat background (docs/art_pipeline.md, Part 1). It is baked to 60x74 and kept as reference art.'));
  sec.addEventListener('dragover', (e) => { if (e.preventDefault) e.preventDefault(); });
  sec.addEventListener('drop', (e) => {
    if (e.preventDefault) e.preventDefault();
    const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) takeFile(f);
  });
  const file = h(doc, 'input');
  file.type = 'file'; file.accept = 'image/png'; file.dataset.new = 'file';
  file.addEventListener('change', () => takeFile(file.files && file.files[0]));
  sec.appendChild(file);
  if (nf.png) {
    const img = h(doc, 'img', 'adm-src');
    img.src = 'data:image/png;base64,' + nf.png;
    img.alt = nf.file;
    sec.appendChild(img);
  }
  const field = (label, key, ph) => {
    const wrap = h(doc, 'div', 'adm-field adm-text');
    const lab = h(doc, 'label', 'adm-label', label);
    const inp = h(doc, 'input');
    inp.type = 'text'; inp.autocomplete = 'off'; inp.spellcheck = false; inp.placeholder = ph;
    inp.dataset.new = key; inp.value = nf[key];
    inp.addEventListener('input', () => { nf[key] = inp.value; });
    wrap.append(lab, inp);
    sec.appendChild(wrap);
  };
  field('Name', 'name', 'c80mall');
  field('Crop', 'crop', 'x y w h, or empty for fit-portrait');
  const bk = btn(doc, 'Bake', 'bake', 'run fit-portrait and bake-face on the server');
  bk.addEventListener('click', () => bake());
  sec.appendChild(bk);
  const msg = h(doc, 'pre', 'adm-log', nf.msg);
  msg.dataset.new = 'msg';
  sec.appendChild(msg);
  el.appendChild(sec);
}

function draw(el) {
  panel = el;
  const doc = el.ownerDocument;
  el.textContent = '';
  if (!store.files[CASTS]) { el.appendChild(h(doc, 'p', 'adm-empty', 'No casts.json loaded.')); return; }
  for (const e of eras()) castSection(doc, el, e);
  eyesSection(doc, el);
  newSection(doc, el);
}

Admin.tab('faces', 'Faces', draw);
