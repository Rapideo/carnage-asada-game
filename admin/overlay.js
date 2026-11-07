/* Service Mode: the entry point. The page loads this as a module after the
   game's own scripts; F2 opens a panel beside the running game. */
import './apply.js';
import { store } from './store.js';
import { TAB_ORDER, tabs, paint, refreshControls } from './fields.js';

const Admin = (globalThis.Admin = globalThis.Admin || {});

/* Keys while the overlay is in use. F2 always toggles (and is hidden from the
   game, so Input.anyKey does not drop the attract screen). Any other key whose
   focus is inside the overlay is hidden from the game, so typing a menu name
   never drives the car. Installed in the capture phase on window, ahead of the
   bubble-phase listeners Input and Pad keep on window; it does not
   preventDefault, so the field still types. */
export function makeKeyGate(root, getActive, toggle) {
  return function gate(e) {
    if (e.code === 'F2') {
      e.preventDefault();
      e.stopImmediatePropagation();
      if (e.type === 'keydown' && !e.repeat) toggle();
      return;
    }
    const a = getActive();
    if (a && root.contains(a)) e.stopImmediatePropagation();
  };
}

const PLACEHOLDER = 'Nothing here yet.';

function boot() {
  const doc = document;
  const h = (tag, cls, text) => { const n = doc.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };

  const root = h('aside', 'adm-root');
  root.id = 'admin-root';
  root.hidden = true;
  const head = h('div', 'adm-head');
  head.append(h('div', 'adm-title', 'SERVICE MODE'), h('div', 'adm-hint', 'F2 to close'));
  const tabbar = h('div', 'adm-tabs');
  tabbar.setAttribute('role', 'tablist');
  const body = h('div', 'adm-body');
  const bar = h('div', 'adm-savebar');
  const banner = h('div', 'adm-banner');
  const errBox = h('div', 'adm-errbox');
  const row = h('div', 'adm-row');
  const saveBtn = h('button', 'adm-save', 'Save'); saveBtn.type = 'button';
  const status = h('span', 'adm-status');
  row.append(saveBtn, status);
  bar.append(banner, errBox, row);
  root.append(head, tabbar, body, bar);
  doc.body.appendChild(root);

  let current = TAB_ORDER[0], loaded = false, isOpen = false;

  function drawTabs() {
    tabbar.textContent = '';
    for (const id of TAB_ORDER) {
      const t = tabs.get(id);
      const b = h('button', 'adm-tab' + (id === current ? ' on' : ''), t ? t.title : id[0].toUpperCase() + id.slice(1));
      b.type = 'button'; b.setAttribute('role', 'tab'); b.dataset.tab = id;
      b.addEventListener('click', () => { current = id; drawTabs(); drawPanel(); });
      tabbar.appendChild(b);
    }
  }
  function drawPanel() {
    body.textContent = '';
    const t = tabs.get(current);
    if (!loaded) { body.appendChild(h('p', 'adm-empty', 'Loading content…')); return; }
    if (!t) { body.appendChild(h('p', 'adm-empty', PLACEHOLDER)); return; }
    const el = h('div', 'adm-panel');
    body.appendChild(el);
    t.render(el);
    paint();
  }
  function drawBar() {
    const n = store.dirty.size;
    banner.textContent = n ? 'unsaved edits — reload discards them' : '';
    banner.hidden = !n;
    const orphan = paint();
    const apply = store.applyError;
    errBox.textContent = orphan ? orphan.message : apply ? 'could not apply to the game: ' + apply.message : '';
    errBox.hidden = !errBox.textContent;
    saveBtn.disabled = !n || !!store.error;
  }

  store.onChange(() => { refreshControls(doc); drawBar(); });
  Admin.onTabs = () => { if (isOpen) { drawTabs(); drawPanel(); } };

  const MSG = {
    changed: 'a file changed on disk since this page loaded: reload to pick it up',
    busy: 'the server is busy: try again in a moment',
  };
  saveBtn.addEventListener('click', async () => {
    saveBtn.disabled = true; status.textContent = 'saving…';
    const r = await store.save();
    if (r.ok) status.textContent = r.nothing ? '' : 'saved and rebuilt';
    else if (r.reason === 'build') status.textContent = 'saved, but the build failed: ' + String(r.output || '').split('\n').filter(Boolean).slice(-1)[0];
    else if (r.reason === 'invalid') status.textContent = 'not saved';
    else status.textContent = MSG[r.reason] || ('not saved: ' + (r.message || r.reason));
    drawBar();
  });

  /* The game keeps its own key state; focus moving into the overlay would
     leave a held arrow "down" forever, since the keyup is hidden from it. */
  function releaseGameKeys() {
    try {
      if (typeof Input !== 'undefined') { Input.down = Object.create(null); Input.mdown = false; }
      if (typeof Pad !== 'undefined' && Pad._kb) Pad._kb = Object.create(null);
    } catch (e) { /* the game is not there */ }
  }
  root.addEventListener('focusin', releaseGameKeys);

  async function open(on) {
    isOpen = on;
    root.hidden = !on;
    if (!on && root.contains(doc.activeElement)) doc.activeElement.blur();
    if (on && !loaded) {
      drawTabs(); drawPanel();
      try { await store.load(); loaded = true; status.textContent = ''; }
      catch (e) { status.textContent = String(e.message || e); return; }
    }
    if (on) { drawTabs(); drawPanel(); drawBar(); }
    window.dispatchEvent(new Event('resize'));   // the stage shares the row with the panel
  }
  const toggle = () => open(!isOpen);

  const gate = makeKeyGate(root, () => doc.activeElement, toggle);
  window.addEventListener('keydown', gate, true);
  window.addEventListener('keyup', gate, true);

  Admin.open = open;
  Admin.toggle = toggle;
  Admin.root = root;
}

if (typeof document !== 'undefined' && document.body) boot();
