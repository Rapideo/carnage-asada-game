/* Service Mode: form controls bound to the store.
   Each control carries data-rel and data-path (dotted), which is how a
   ContentError from the validator finds the control that caused it. */
import { store } from './store.js';

const Admin = (globalThis.Admin = globalThis.Admin || {});
const controls = new Set();

/* view conversions per kind: toView(stored) -> string, fromView(string) -> { value } | { msg } */
const KINDS = {
  text: { toView: (v) => (v == null ? '' : String(v)), fromView: (s) => ({ value: s }) },
  int: {
    toView: (v) => (v == null ? '' : String(v)),
    fromView: (s) => (/^-?\d+$/.test(s.trim()) ? { value: Number(s) } : { msg: 'a whole number' }),
  },
  seconds: {
    toView: (v) => (v == null ? '' : String(v)),
    fromView: (s) => (/^\d+(\.\d+)?$/.test(s.trim()) ? { value: Number(s) } : { msg: 'a number of seconds' }),
    unit: 's',
  },
  money: {
    toView: (c) => (c == null ? '' : (c < 0 ? '-' : '') + Math.floor(Math.abs(c) / 100) + '.' + String(Math.abs(c) % 100).padStart(2, '0')),
    fromView: (s) => {
      const m = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(s.trim().replace(/^\$/, ''));
      if (!m) return { msg: 'dollars and cents, like 2.50' };
      return { value: (m[1] ? -1 : 1) * (Number(m[2]) * 100 + Number((m[3] || '').padEnd(2, '0') || 0)) };
    },
    unit: '$',
  },
};

const dotted = (p) => (Array.isArray(p) ? p.join('.') : String(p));

/* Build a control inside `el`. opts: { rel, path, kind, label?, options?, toJSON?, fromJSON?, title? }.
   Returns the input element (the thing that carries data-rel / data-path). */
Admin.field = function (el, opts) {
  const { rel, kind } = opts;
  const path = dotted(opts.path);
  const doc = el.ownerDocument || document;
  const wrap = doc.createElement('div');
  wrap.className = 'adm-field adm-' + kind;
  if (opts.label) {
    const lab = doc.createElement('label');
    lab.className = 'adm-label';
    lab.textContent = opts.label;
    wrap.appendChild(lab);
  }
  let input;
  if (kind === 'bool') {
    input = doc.createElement('input'); input.type = 'checkbox';
  } else if (kind === 'select') {
    input = doc.createElement('select');
    (opts.options || []).forEach((o, i) => {
      const op = doc.createElement('option');
      op.value = String(i);
      op.textContent = o !== null && typeof o === 'object' ? (o.label ?? String(o.value)) : String(o);
      input.appendChild(op);
    });
  } else {
    input = doc.createElement('input'); input.type = 'text'; input.autocomplete = 'off'; input.spellcheck = false;
    if (kind === 'int' || kind === 'money' || kind === 'seconds') input.inputMode = 'decimal';
  }
  input.dataset.rel = rel;
  input.dataset.path = path;
  input.dataset.kind = kind;
  if (opts.title) input.title = opts.title;
  if (opts.label) { const id = 'adm-' + controls.size + '-' + Math.random().toString(36).slice(2, 7); input.id = id; wrap.firstChild.htmlFor = id; }
  wrap.appendChild(input);
  const conv = KINDS[kind];
  if (conv && conv.unit && conv.unit !== '$') { const u = doc.createElement('span'); u.className = 'adm-unit'; u.textContent = conv.unit; wrap.appendChild(u); }
  if (conv && conv.unit === '$') wrap.insertBefore(Object.assign(doc.createElement('span'), { className: 'adm-unit', textContent: '$' }), input);
  const msg = doc.createElement('div');
  msg.className = 'adm-msg';
  wrap.appendChild(msg);
  el.appendChild(wrap);

  const opt = (i) => { const o = (opts.options || [])[i]; return o !== null && typeof o === 'object' ? o.value : o; };
  const stored = () => store.get(rel, path);
  const show = () => {          // stored value -> control
    const v = stored();
    if (kind === 'bool') input.checked = !!v;
    else if (kind === 'select') {
      const i = (opts.options || []).findIndex((o, k) => opt(k) === v);
      input.value = i < 0 ? '' : String(i);
    } else {
      const view = opts.fromJSON ? opts.fromJSON(v) : conv.toView(v);
      input.value = view == null ? '' : String(view);
    }
    input._local = null;
  };
  const commit = () => {        // control -> store
    if (kind === 'bool') return void store.set(rel, path, input.checked);
    if (kind === 'select') return void store.set(rel, path, opt(Number(input.value)));
    const text = input.value;
    if (opts.toJSON) {
      let value;
      try { value = opts.toJSON(text); } catch (e) { input._local = String(e.message || e); paint(); return; }
      input._local = null; store.set(rel, path, value); return;
    }
    const r = conv.fromView(text);
    if (r.msg) { input._local = 'needs ' + r.msg; paint(); return; }
    input._local = null;
    store.set(rel, path, r.value);
  };
  input.addEventListener(kind === 'bool' || kind === 'select' ? 'change' : 'input', commit);
  input.addEventListener('blur', () => { if (!input._local) show(); });   // tidy "2.5" to "2.50" once you leave
  input._show = show;
  input._msg = msg;
  controls.add(input);
  show();
  return input;
};

/* Put each control's message in place: its own parse complaint, else the
   validator's error if it names this control. Returns the error if no control
   claimed it, so the save bar can show it instead. */
export function paint() {
  const err = store.error;
  let claimed = false;
  for (const c of [...controls]) {
    if (!c.isConnected) { controls.delete(c); continue; }
    const mine = err && err.file === 'content/' + c.dataset.rel && err.path.join('.') === c.dataset.path;
    const text = c._local || (mine ? err.message : '');
    c.classList.toggle('adm-bad', !!text);
    c._msg.textContent = text;
    if (mine) claimed = true;
  }
  return err && !claimed ? err : null;
}

/* Reflect edits made elsewhere (another panel, a reload) into untouched controls. */
export function refreshControls(doc) {
  for (const c of [...controls]) {
    if (!c.isConnected) { controls.delete(c); continue; }
    if (doc && doc.activeElement === c) continue;
    c._show();
  }
  return paint();
}

Admin.paintErrors = paint;
Admin.refreshControls = refreshControls;
Admin.controls = controls;

/* ---- tabs ------------------------------------------------------------------
   Panels register here, not in overlay.js, so a panel module can import this
   file alone. overlay.js draws whatever is registered, in TAB_ORDER. */
export const TAB_ORDER = ['levels', 'menu', 'attract', 'music', 'difficulty', 'dialogue', 'faces', 'test'];
export const tabs = new Map();
Admin.tabs = tabs;
Admin.tab = function (id, title, render) {
  tabs.set(id, { id, title, render });
  if (Admin.onTabs) Admin.onTabs();
};
