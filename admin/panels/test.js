/* Service Mode: the Test panel.
   Buttons over Admin.test (admin/test.js), grouped the way spec §6 groups
   them. Nothing here is content and nothing is saved: these are session
   switches, and any run they touch is a test run that never reaches the
   board. Game consts (G, DIFFICULTY) are read by bare name, never globalThis.
   Groups: getting somewhere, the bot, skipping, speed, making things
   happen, debug views (with the FPS counter), housekeeping. */
import '../fields.js';
import { store } from '../store.js';

const Admin = (globalThis.Admin = globalThis.Admin || {});

const SPEEDS = [0.25, 0.5, 1, 2, 4];
const FORCES = [['over', 'GAME OVER'], ['cont', 'CONTINUE?'], ['entry', 'Initials'], ['victory', 'Victory'], ['clear', 'Level clear']];
const ATTRACT = [['title', 'Title'], ['winners', 'Winners'], ['scores', 'Scores'], ['demo', 'Demo']];

let level = null;         // the level picked for a jump (kept across redraws)
const override = { difficulty: '', era: '', season: '' };
let timer = null;
let fpsRaf = null;

const h = (doc, tag, cls, text) => { const n = doc.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
const harness = () => Admin.test;

function levelsOf() {
  try { return G.levels(); } catch (e) { return []; }
}
function difficultyKeys() {
  try { return Object.keys(DIFFICULTY).filter((k) => DIFFICULTY[k] && typeof DIFFICULTY[k] === 'object' && 'start' in DIFFICULTY[k]); }
  catch (e) { return ['easy', 'medium', 'hard', 'supreme']; }
}
function erasOf() {
  const s = [...new Set(levelsOf().map((l) => l.era).filter((e) => e != null))].sort();
  return s.length ? s : [1, 2, 3];
}
function status() {
  try { return harness().status(); } catch (e) { return null; }
}

/* the override as setOverride takes it: only what is set, eras as numbers */
function current() {
  const o = {};
  if (override.difficulty) o.difficulty = override.difficulty;
  if (override.era !== '') o.era = Number(override.era);
  if (override.season) o.season = override.season;
  return o;
}

function draw(el) {
  const doc = el.ownerDocument;
  el.textContent = '';
  const st = status();
  const L = levelsOf();
  if (level == null) level = st && st.levelN ? st.levelN : 1;

  const line = h(doc, 'div', 'adm-teststatus');
  line.dataset.status = '1';
  /* say(msg) replaces the message; say() only refreshes the state after it,
     so the 500ms refresh never wipes an error before the next action does */
  let last = '';
  const say = (msg) => {
    if (msg !== undefined) last = msg;
    msg = last;
    const s = status();
    const base = s ? s.state + ' · level ' + s.levelN + ' · clock ' + Math.max(0, Math.ceil(s.shift || 0)) + 's' +
      (s.frozen ? ' (frozen)' : '') + ' · ' + s.speed + 'x' + (s.paused ? ' · paused' : '') +
      (s.autopilot ? ' · autopilot' : '') + (s.testRun ? ' · test run, off the board' : '') : '';
    line.textContent = msg ? msg + (base ? '  —  ' + base : '') : base;
  };
  el.appendChild(line);

  /* every control goes through here: the call, then focus back to the game so
     its keys drive the car again, then the status line */
  const call = (ev, name, ...args) => {
    let msg = '';
    try { const T = harness(); if (!T || typeof T[name] !== 'function') msg = 'the test harness is not loaded'; else T[name](...args); }
    catch (e) { msg = String(e && e.message || e); console.error(e); }
    const t = ev && ev.target;
    if (t && typeof t.blur === 'function') t.blur();
    say(msg);
    redrawToggles();
  };
  const button = (row, act, label, fn) => {
    const b = h(doc, 'button', 'adm-btn', label);
    b.type = 'button'; b.dataset.act = act;
    b.addEventListener('click', fn);
    row.appendChild(b);
    return b;
  };
  const check = (row, act, label, fn) => {
    const w = h(doc, 'label', 'adm-check');
    const c = h(doc, 'input'); c.type = 'checkbox'; c.dataset.act = act;
    c.addEventListener('change', fn);
    w.append(c, h(doc, 'span', null, ' ' + label));
    row.appendChild(w);
    return c;
  };
  const input = (row, name, value, title) => {
    const i = h(doc, 'input', 'adm-num'); i.type = 'text'; i.autocomplete = 'off'; i.spellcheck = false;
    i.inputMode = 'numeric'; i.dataset.input = name; i.value = String(value); if (title) i.title = title;
    row.appendChild(i);
    return i;
  };
  const select = (row, opts, value, onChange) => {
    const s = h(doc, 'select', 'adm-sel');
    for (const [v, label] of opts) { const o = h(doc, 'option', null, label); o.value = String(v); s.appendChild(o); }
    s.value = String(value);
    s.addEventListener('change', () => onChange(s.value));
    row.appendChild(s);
    return s;
  };
  const rowIn = (sec, label) => {
    const r = h(doc, 'div', 'adm-testrow');
    if (label) r.appendChild(h(doc, 'span', 'adm-label', label));
    sec.appendChild(r);
    return r;
  };

  /* ---- getting somewhere ---- */
  const go = section(el, 'Getting somewhere');
  const r1 = rowIn(go, 'Level');
  const lv = select(r1, L.map((l) => [l.n, l.n + '  ' + (l.type === 'kitchen' ? 'K' : 'D') + '  ' + (l.name || '')]), level, (v) => { level = Number(v); });
  lv.dataset.input = 'level';
  const r1b = rowIn(go, '');
  button(r1b, 'jump-card', 'To its card', (ev) => call(ev, 'jump', level, 'card'));
  button(r1b, 'jump-play', 'Straight into play', (ev) => call(ev, 'jump', level, 'play'));

  const ovSel = {};
  const ov = (key, label, opts) => {
    const r = rowIn(go, label);
    ovSel[key] = select(r, [['', "level's own"]].concat(opts), override[key], (v) => { override[key] = v; call(null, 'setOverride', current()); });
    ovSel[key].dataset.override = key;
  };
  ov('difficulty', 'Difficulty', difficultyKeys().map((k) => [k, k]));
  ov('era', 'Era', erasOf().map((e) => [e, 'Era ' + e]));
  ov('season', 'Season', [['summer', 'summer'], ['winter', 'winter']]);
  const r2 = rowIn(go, '');
  button(r2, 'override-clear', 'Clear overrides', (ev) => {
    override.difficulty = ''; override.era = ''; override.season = '';
    for (const k of Object.keys(ovSel)) ovSel[k].value = '';
    call(ev, 'setOverride', {});
  });
  const r3 = rowIn(go, 'City seed');
  let seed0 = '';
  try { seed0 = String(G.seed); } catch (e) { /* no game */ }
  const seedIn = input(r3, 'seed', seed0, 'a whole number; the page reloads with ?seed=');
  button(r3, 'seed', 'Reload with seed', (ev) => {
    const v = String(seedIn.value).trim();
    if (!/^\d+$/.test(v)) { say('the seed must be a whole number'); return; }
    const ok = harness() && harness().seed(Number(v), { dirty: store.dirty.size });
    say(ok ? '' : 'not reloaded');
    if (ev && ev.target && typeof ev.target.blur === 'function') ev.target.blur();
  });

  /* ---- letting the game play itself ---- */
  const bot = section(el, 'Letting the game play itself');
  const r4 = rowIn(bot, '');
  const ap = check(r4, 'autopilot', 'Autopilot (hand control over, take it back)', (ev) => call(ev, 'autopilot', !!ap.checked));
  const r5 = rowIn(bot, 'Attract from');
  for (const [s, label] of ATTRACT) button(r5, 'attract-' + s, label, (ev) => call(ev, 'attractFrom', s));

  /* ---- skipping ---- */
  const skip = section(el, 'Skipping');
  const r6 = rowIn(skip, 'Clock');
  const clk = input(r6, 'clock', 60, 'seconds');
  button(r6, 'clock-set', 'Set', (ev) => call(ev, 'clock', Number(clk.value)));
  const fz = button(r6, 'clock-freeze', 'Freeze', (ev) => call(ev, 'clock', st2().frozen ? 'thaw' : 'freeze'));
  const r7 = rowIn(skip, 'Completions');
  const cmp = input(r7, 'complete', 3);
  button(r7, 'complete', 'Add', (ev) => call(ev, 'complete', Number(cmp.value)));
  const r8 = rowIn(skip, 'Force');
  for (const [w, label] of FORCES) button(r8, 'force-' + w, label, (ev) => call(ev, 'force', w));

  /* ---- game speed ---- */
  const spd = section(el, 'Game speed');
  const r9 = rowIn(spd, 'Speed');
  const speedBtns = SPEEDS.map((x) => button(r9, 'speed-' + x, x + 'x', (ev) => call(ev, 'speed', x)));
  const r10 = rowIn(spd, '');
  const pz = check(r10, 'pause', 'Pause', (ev) => call(ev, 'pause', !!pz.checked));
  button(r10, 'step', 'Step', (ev) => call(ev, 'step'));

  /* ---- making things happen ---- */
  const ev = section(el, 'Making things happen');
  const e1 = rowIn(ev, '');
  button(e1, 'train', 'Train now', (e) => call(e, 'train'));
  button(e1, 'cop', 'Cop now', (e) => call(e, 'cop'));
  const heatIn = input(e1, 'heat', 20, 'heat to add');
  button(e1, 'heat', 'Add heat', (e) => call(e, 'heat', Number(heatIn.value)));
  const e2 = rowIn(ev, 'Say');
  const sayIn = h(doc, 'input', 'adm-text'); sayIn.type = 'text'; sayIn.dataset.input = 'say'; sayIn.value = 'ONE LINE FOR THE STRIP'; sayIn.maxLength = 34;
  const faceIn = h(doc, 'input', 'adm-text'); faceIn.type = 'text'; faceIn.dataset.input = 'face'; faceIn.placeholder = 'face key'; faceIn.title = 'a face key, e.g. one from the Faces tab; empty for none';
  e2.append(sayIn, faceIn);
  button(e2, 'say', 'Show', (e) => call(e, 'say', sayIn.value, faceIn.value.trim() || null));

  /* ---- debug views ---- */
  const dv = section(el, 'Debug views');
  const d1 = rowIn(dv, '');
  const VIEWS = [['solid', 'Solid tiles (red)'], ['keep', 'Keep-clear (amber)'], ['nodes', 'Nav nodes (bone)'], ['route', 'Live route (magenta)']];
  const viewBoxes = VIEWS.map(([k, label]) => { const c = check(d1, 'view-' + k, label, (e) => call(e, 'view', k, !!c.checked)); return [k, c]; });
  const d2 = rowIn(dv, 'FPS');
  const fpsEl = h(doc, 'span', 'adm-fps', '--'); fpsEl.dataset.fps = '1';
  d2.appendChild(fpsEl);

  /* ---- housekeeping ---- */
  const hk = section(el, 'Housekeeping');
  const k1 = rowIn(hk, '');
  button(k1, 'reset-board', 'Reset high-score board', (e) => {
    const T = harness();
    const ok = T && typeof T.resetBoard === 'function' ? T.resetBoard() : false;
    if (e && e.target && typeof e.target.blur === 'function') e.target.blur();
    say(ok ? 'high-score board reset to the factory board' : 'the board is the factory one for now, but this page cannot store it');
  });
  const k2 = rowIn(hk, 'Controls');
  for (const m of ['A', 'B', 'C']) button(k2, 'mode-' + m, 'Mode ' + m, (e) => call(e, 'mode', m));
  const k3 = rowIn(hk, 'Mute');
  const muteM = check(k3, 'mute-music', 'Music', (e) => call(e, 'mute', 'music', !!muteM.checked));
  const muteS = check(k3, 'mute-sfx', 'Effects', (e) => call(e, 'mute', 'sfx', !!muteS.checked));

  /* the frame rate, from requestAnimationFrame deltas; stops when the panel goes */
  if (fpsRaf != null && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(fpsRaf);
  fpsRaf = null;
  if (typeof requestAnimationFrame === 'function' && typeof performance !== 'undefined') {
    let last = performance.now(), frames = 0, acc = 0;
    const tick = (t) => {
      if (!fpsEl.isConnected) { fpsRaf = null; return; }
      frames++; acc += t - last; last = t;
      if (acc >= 500) { fpsEl.textContent = Math.round(frames * 1000 / acc) + ' fps'; frames = 0; acc = 0; }
      fpsRaf = requestAnimationFrame(tick);
    };
    fpsRaf = requestAnimationFrame(tick);
  }

  function st2() { return status() || {}; }
  function redrawToggles() {
    try { const v = harness().views(); for (const [k, c] of viewBoxes) c.checked = !!v[k]; } catch (e) { /* no harness */ }
    try { const m = harness().muted(); muteM.checked = !!m.music; muteS.checked = !!m.sfx; } catch (e) { /* no harness */ }
    const s = st2();
    ap.checked = !!s.autopilot;
    pz.checked = !!s.paused;
    fz.textContent = s.frozen ? 'Thaw' : 'Freeze';
    speedBtns.forEach((b, i) => b.classList.toggle('on', s.speed === SPEEDS[i]));
  }
  redrawToggles();
  say('');

  /* the clock and the state move on their own: keep the line current while shown */
  if (timer) clearInterval(timer);
  timer = null;
  if (typeof window !== 'undefined' && typeof setInterval === 'function') {
    timer = setInterval(() => { if (!el.isConnected) { clearInterval(timer); timer = null; return; } say(); redrawToggles(); }, 500);
  }
}

/* a titled group of rows; Task 16 adds its own groups the same way */
export function section(el, title) {
  const doc = el.ownerDocument;
  const s = h(doc, 'section', 'adm-testsec');
  s.appendChild(h(doc, 'h3', 'adm-testhead', title));
  el.appendChild(s);
  return s;
}

Admin.tab('test', 'Test', draw, { leave() {
  if (timer) { clearInterval(timer); timer = null; }
  if (fpsRaf != null && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(fpsRaf);
  fpsRaf = null;
} });
