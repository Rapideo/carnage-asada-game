/* Behaviour test for src/25_pad.js.
   Loads 00_core, 10_font, 25_pad, 30_art (bundle order) in a node:vm sandbox
   with a fake navigator.getGamepads, matchMedia, window/canvas listeners and
   the px.mjs software canvas, then drives gamepad states and touch events
   through Pad.poll() exactly as 90_main will: poll -> (game reads) -> endFrame. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
import { pathToFileURL, fileURLToPath } from 'node:url';

const REPO = fileURLToPath(new URL('..', import.meta.url));
const { Canvas } = await import(pathToFileURL(join(REPO, 'tools/render/px.mjs')).href);
const S = (f) => readFileSync(join(REPO, 'src', f), 'utf8');
const files = ['00_core.js', '10_font.js', '25_pad.js', '30_art.js'];
const code = files.map((f) => `\n//# ${f}\n` + S(f)).join('\n');

/* ---------- environment ---------- */
const winL = {};
const fire = (type, ev) => { for (const fn of winL[type] || []) fn(ev); };
const canL = {};
const screen = {
  width: 384, height: 216, style: {},
  addEventListener: (type, fn, opt) => (canL[type] ||= []).push({ fn, opt }),
  getBoundingClientRect: () => ({ left: 10, top: 20, width: 1152, height: 648 }),   // 3x, offset
};
let gamepads = [];
const media = {};
const colours = new Set();
function instrument(c) {
  const gc = c.getContext.bind(c);
  c.getContext = () => {
    const ctx = gc();
    if (!ctx.__w) {
      ctx.__w = true;
      const proto = Object.getPrototypeOf(ctx);
      for (const k of ['fillStyle', 'strokeStyle']) {
        const d = Object.getOwnPropertyDescriptor(proto, k);
        Object.defineProperty(ctx, k, {
          configurable: true,
          get() { return d.get.call(this); },
          set(v) { colours.add(String(v).toLowerCase()); d.set.call(this, v); },
        });
      }
    }
    return ctx;
  };
  return c;
}
const sandbox = {
  document: { createElement: (t) => (t === 'canvas' ? instrument(new Canvas(1, 1)) : { style: {} }) },
  navigator: { getGamepads: () => gamepads },
  matchMedia: (q) => ({ matches: !!media[q] }),
  addEventListener: (type, fn) => (winL[type] ||= []).push(fn),
  removeEventListener: () => {},
  console, Math, Date, JSON, Object, Array, String, Number, Boolean, Map, Set,
  Uint8ClampedArray, isNaN, parseInt, parseFloat,
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(code + '\n;globalThis.__x = { Pad, Input, PAL, VW, VH, textW, Art };', sandbox, { filename: 'bundle.js' });
const { Pad, Input, PAL, textW } = sandbox.__x;

/* ---------- assertions ---------- */
let fails = 0, passes = 0;
const ok = (cond, msg) => { if (cond) { passes++; } else { fails++; console.error('  FAIL  ' + msg); } };
const section = (s) => console.log('\n-- ' + s);
const near = (a, b, e = 1e-6) => Math.abs(a - b) <= e;

/* ---------- helpers ---------- */
const DT = 1 / 60;
function mkPad({ b = [], axes = [0, 0], mapping = 'standard', index = 0 } = {}) {
  const buttons = [];
  for (let i = 0; i < 17; i++) buttons.push({ pressed: b.includes(i), value: b.includes(i) ? 1 : 0 });
  return { index, mapping, connected: true, axes: axes.concat([0, 0]), buttons, id: 'fake' };
}
const setPad = (o) => { gamepads = o ? [mkPad(o)] : []; };
/* one fixed step: poll, snapshot what G.update would see, endFrame */
function step(ctx) {
  Pad.poll(ctx, DT);
  const s = {
    down: Object.fromEntries(Object.entries(Input.down).filter(([, v]) => v)),
    hit: Object.keys(Input.hit).filter((k) => Input.hit[k]),
    anyKey: Input.anyKey, mhit: Input.mhit, mdown: Input.mdown, mx: Input.mx, my: Input.my,
    throwNow: Pad.throwNow, aiming: Pad.aiming, aimX: Pad.aimX, aimY: Pad.aimY,
  };
  if (Pad.throwNow) Pad.throwNow = false;      // the game consumes and clears it
  Input.endFrame();
  return s;
}
const run = (ctx, n) => { let s; for (let i = 0; i < n; i++) s = step(ctx); return s; };
const hitFrames = (ctx, code, n) => { const f = []; for (let i = 0; i < n; i++) if (step(ctx).hit.includes(code)) f.push(i); return f; };
function freshInput() {
  Input.down = Object.create(null); Input.hit = Object.create(null);
  Input.mhit = false; Input.mdown = false; Input.anyKey = false; Input.hasMouse = false;
}
function settle(ctx = 'menu') { setPad(null); Pad.setMode('A'); Pad.aimHeading = 0; run(ctx, 2); freshInput(); }
const key = (type, code, keyName) => fire(type, { code, key: keyName || (code.startsWith('Key') ? code.slice(3).toLowerCase() : code), preventDefault() {} });
/* touch: virtual coords -> client coords on the 3x, offset canvas */
let lastEv = null;
function touch(type, id, vx, vy) {
  lastEv = { cancelable: true, prevented: false, preventDefault() { this.prevented = true; },
    changedTouches: [{ identifier: id, clientX: 10 + vx * 3, clientY: 20 + vy * 3 }] };
  for (const l of canL[type] || []) l.fn(lastEv);
}

/* ---------- boot ---------- */
section('boot');
Input.init(screen, () => 3);
Pad.init(screen);
ok(Pad.mode === 'A', 'default mode is A');
for (const t of ['touchstart', 'touchmove', 'touchend', 'touchcancel'])
  ok((canL[t] || []).some((l) => l.opt && l.opt.passive === false), `${t} listener on the canvas, passive:false`);
for (const t of ['gamepadconnected', 'gamepaddisconnected', 'keydown', 'keyup', 'blur'])
  ok((winL[t] || []).length > 0, `window ${t} listener registered`);
ok(screen.style.touchAction === 'none', 'canvas touch-action: none');
fire('gamepadconnected', {}); ok(Pad.connected === 1, 'gamepadconnected counted');
fire('gamepaddisconnected', {}); ok(Pad.connected === 0, 'gamepaddisconnected counted');

/* ---------- Mode A: nothing touched ---------- */
section('mode A leaves the keyboard alone');
settle();
key('keydown', 'KeyW'); key('keydown', 'ArrowLeft');
ok(Input.hit.KeyW && Input.hit.ArrowLeft, '(the keyboard\'s own keydown sets its hits)');
Input.endFrame();                         // ...which belong to the frame they arrived in
for (const ctx of ['menu', 'kitchen', 'drive', 'bogus']) {
  let changed = false;
  for (let i = 0; i < 30; i++) {
    const s = step(ctx);
    if (!s.down.KeyW || !s.down.ArrowLeft || Object.keys(s.down).length !== 2 || s.hit.length || s.mhit) changed = true;
  }
  ok(!changed, `no pad, no touch: ${ctx} poll leaves Input exactly as the keyboard set it`);
}
key('keyup', 'KeyW'); key('keyup', 'ArrowLeft');
ok(!Input.down.KeyW && !Input.down.ArrowLeft, 'keyboard keyup still clears');

/* ---------- menu ---------- */
section('menu: buttons are Enter / Escape, edges only');
settle('menu');
for (const [btn, code, name] of [[0, 'Enter', 'Button 1'], [2, 'Enter', 'Button 3'], [9, 'Enter', 'Start'],
                                 [1, 'Escape', 'Button 2'], [8, 'Escape', 'Back']]) {
  setPad({ b: [btn] });
  const a = step('menu'), b = step('menu'), c = step('menu');
  ok(a.down[code] && a.hit.includes(code) && a.anyKey, `${name} -> ${code}: down + hit on the press`);
  ok(b.down[code] && !b.hit.includes(code) && c.down[code] && !c.hit.includes(code) && !b.anyKey, `${name} held: still down, no second hit, no anyKey`);
  setPad({});
  const d = step('menu');
  ok(!d.down[code] && !d.hit.length, `${name} released: ${code} up, no hit`);
}

section('menu: stick and d-pad, 4-way, auto-repeat 0.35s then 0.15s');
settle('menu');
setPad({ b: [13] });                      // d-pad down
const rep = hitFrames('menu', 'ArrowDown', 60);
ok(JSON.stringify(rep) === JSON.stringify([0, 21, 30, 39, 48, 57]), `d-pad down held 1s hits at frames ${JSON.stringify(rep)} (want [0,21,30,39,48,57])`);
ok(Input.down.ArrowDown === true, 'ArrowDown held down throughout the repeat');
setPad({}); step('menu');
ok(!Input.down.ArrowDown, 'released');
setPad({ axes: [0.9, 0] });
const repR = hitFrames('menu', 'ArrowRight', 40);
ok(JSON.stringify(repR) === JSON.stringify([0, 21, 30, 39]), `stick right repeats the same way ${JSON.stringify(repR)}`);
setPad({ axes: [0, 0.3] }); let s = step('menu');
ok(!s.down.ArrowDown && !s.down.ArrowRight, 'stick at 0.3 is no direction (threshold 0.5)');
setPad({ axes: [0, 0.8] }); s = step('menu'); ok(s.hit.includes('ArrowDown'), 'stick 0.8 down -> ArrowDown');
setPad({ axes: [0, 0.4] }); s = step('menu'); ok(s.down.ArrowDown && !s.hit.length, 'hysteresis: 0.4 keeps ArrowDown, no re-hit');
setPad({ axes: [0, 0.3] }); s = step('menu'); ok(!s.down.ArrowDown, '...and 0.3 lets go');
setPad({ axes: [-0.9, -0.4] }); s = step('menu'); ok(s.hit.join() === 'ArrowLeft', 'diagonal picks the stronger axis (left)');
setPad({ axes: [-0.7, -0.75] }); s = step('menu'); ok(s.down.ArrowLeft && !s.down.ArrowUp && !s.hit.length, 'rolling onto the diagonal keeps the axis already moving');
setPad({ axes: [0, -0.9] }); s = step('menu'); ok(s.hit.join() === 'ArrowUp' && !s.down.ArrowLeft, 'onto up: ArrowUp edge, ArrowLeft released');
setPad({ b: [12, 14] }); step('menu'); setPad({}); step('menu');
setPad({ b: [12, 14] }); s = step('menu'); ok(s.hit.length === 1, `d-pad diagonal from neutral steps one way only (${s.hit})`);
setPad({ b: [12], mapping: '' }); s = run('menu', 3); ok(!s.down.ArrowUp, 'non-standard mapping: button 12 is not read as d-pad up');
setPad({ b: [0], mapping: '' }); s = step('menu'); ok(s.down.Enter, '...but Button 1 still is');
setPad({}); step('menu');

/* ---------- kitchen ---------- */
section('kitchen: select / wrap / serve / pause / mute');
settle('kitchen');
for (const [btn, code, name] of [[0, 'Space', 'Button 1 select'], [1, 'KeyX', 'Button 2 wrap'], [2, 'Enter', 'Button 3 serve'],
                                 [9, 'KeyP', 'Start pause'], [8, 'KeyM', 'Back mute']]) {
  setPad({ b: [btn] });
  const a = step('kitchen'), b = step('kitchen');
  ok(a.down[code] && a.hit.includes(code) && b.down[code] && !b.hit.includes(code), `${name} -> ${code}, edge hit only`);
  setPad({}); s = step('kitchen'); ok(!s.down[code], `${code} released`);
}
setPad({ axes: [0, -1] });
const repK = hitFrames('kitchen', 'ArrowUp', 31);
ok(JSON.stringify(repK) === JSON.stringify([0, 21, 30]), `kitchen cursor auto-repeats ${JSON.stringify(repK)}`);
setPad({}); step('kitchen');

/* ---------- drive ---------- */
section('drive: stick, buttons');
settle('drive');
const driveCase = (o, want, not, msg) => {
  setPad(o); const st = step('drive');
  ok(want.every((k) => st.down[k]) && not.every((k) => !st.down[k]), msg + ` (down: ${Object.keys(st.down)})`);
  setPad({}); step('drive');
};
driveCase({ axes: [-0.3, 0] }, ['ArrowLeft'], ['ArrowRight', 'KeyW', 'KeyS'], 'stick x -0.3 steers left (deadzone 0.25)');
driveCase({ axes: [-0.2, 0] }, [], ['ArrowLeft', 'ArrowRight'], 'stick x -0.2 is inside the deadzone');
driveCase({ axes: [0.9, 0] }, ['ArrowRight'], ['ArrowLeft'], 'stick right steers right');
driveCase({ axes: [0, -0.6] }, ['KeyW'], ['KeyS'], 'stick up accelerates');
driveCase({ axes: [0, 0.6] }, ['KeyS'], ['KeyW'], 'stick down reverses');
driveCase({ axes: [0, -0.4] }, [], ['KeyW'], 'stick up 0.4 does not accelerate');
driveCase({ b: [0] }, ['KeyW'], ['KeyS'], 'Button 1 accelerates');
driveCase({ b: [1] }, ['KeyS'], ['KeyW'], 'Button 2 reverses');
driveCase({ b: [9] }, ['KeyP'], [], 'Start pauses');
driveCase({ b: [8] }, ['KeyM'], [], 'Back mutes');
driveCase({ b: [14] }, ['ArrowLeft'], [], 'd-pad left steers');
driveCase({ b: [0], axes: [-1, 0] }, ['KeyW', 'ArrowLeft'], [], 'gas and steer together');

section('drive: Button 3 hold-to-aim, release-to-throw');
settle('drive');
Pad.aimHeading = 0;
setPad({ b: [0, 2], axes: [-1, 0] });     // gas held, B3 pressed, stick full left
s = step('drive');
ok(s.aiming && near(s.aimX, 60 - 160 * DT) && near(s.aimY, 0), `aim starts 60px ahead along the heading, then moves (${s.aimX.toFixed(3)}, ${s.aimY.toFixed(3)})`);
ok(!s.down.KeyW && !s.down.ArrowLeft && !s.down.KeyS && !s.down.ArrowRight, 'aiming: no throttle, no steering (the car coasts)');
for (let i = 0; i < 29; i++) s = step('drive');
ok(near(s.aimX, -20, 1e-6) && near(s.aimY, 0), `30 frames of full stick moves the aim 80px (aimX ${s.aimX.toFixed(4)})`);
setPad({ b: [0, 2], axes: [0, -1] });
for (let i = 0; i < 60; i++) s = step('drive');
ok(Math.hypot(s.aimX, s.aimY) <= 120 + 1e-9 && s.aimY < -100, `aim clamped to a 120px radius (${Math.hypot(s.aimX, s.aimY).toFixed(3)})`);
const heldAim = [s.aimX, s.aimY];
setPad({ b: [0, 2], axes: [0.1, 0.1] });  // inside the radial deadzone
s = step('drive'); ok(s.aimX === heldAim[0] && s.aimY === heldAim[1], 'stick inside the deadzone leaves the aim still');
setPad({ b: [0], axes: [0, 0] });          // let go of Button 3, gas still held
s = step('drive');
ok(s.throwNow && !s.aiming, 'releasing Button 3 sets throwNow, aiming off');
ok(s.aimX === heldAim[0] && s.aimY === heldAim[1], 'aimX/aimY keep the released aim for the game to read');
ok(s.down.KeyW && s.hit.includes('KeyW'), 'the held Button 1 drives again as soon as aiming ends');
s = step('drive'); ok(!s.throwNow, 'throwNow is a one-shot');
Pad.throwNow = false;
setPad({ b: [2] }); step('drive'); setPad({}); Pad.poll('drive', DT);   // release, but the game does NOT consume it
ok(Pad.throwNow === true, 'throwNow offered on the release step');
Input.endFrame(); Pad.poll('drive', DT);
ok(Pad.throwNow === false, 'an unconsumed throwNow is dropped by the next poll, never deferred');
Input.endFrame();
Pad.aimHeading = Math.PI / 2;
setPad({ b: [2] }); s = step('drive');
ok(near(s.aimX, 0) && near(s.aimY, 60), 'aim start follows Pad.aimHeading (south)');
setPad({ b: [2], axes: [1, 1] }); s = step('drive');
ok(near(Math.hypot(s.aimX - 0, s.aimY - 60), 160 * DT, 1e-9), 'a diagonal moves the aim at full speed, not 1.41x');
setPad({}); step('drive');

section('context change latches held inputs');
settle('menu');
setPad({ b: [0] }); s = step('menu'); ok(s.hit.includes('Enter'), 'menu: Button 1 = Enter (starts the shift)');
s = step('drive');
ok(!s.down.KeyW && !s.down.Enter && !s.hit.length, 'into drive with Button 1 still held: no KeyW, Enter released');
s = run('drive', 5); ok(!s.down.KeyW, '...still nothing while it stays held');
setPad({}); step('drive'); setPad({ b: [0] }); s = step('drive');
ok(s.down.KeyW && s.hit.includes('KeyW'), 'released and pressed again: KeyW');
settle('kitchen');
setPad({ b: [2] }); s = step('kitchen'); ok(s.hit.includes('Enter'), 'kitchen: Button 3 serves (Enter)');
s = step('menu'); ok(!s.hit.includes('Enter') && !s.down.Enter, 'level-clear card (menu) with Button 3 still held: no Enter');
setPad({}); step('menu'); setPad({ b: [2] }); s = step('menu'); ok(s.hit.includes('Enter'), 'a fresh press on the card is Enter');
settle('drive');
Pad.aimHeading = 0;
setPad({ b: [2] }); s = step('drive'); ok(s.aiming, 'aiming in drive');
s = step('menu'); ok(!s.aiming && !s.throwNow, 'context change cancels the aim, no throw');
setPad({}); s = step('menu'); ok(!s.throwNow, 'releasing Button 3 afterwards does not throw');
s = step('drive'); ok(!s.throwNow && !s.aiming, 'and nothing carries back into drive');
settle('menu');
setPad({ axes: [-1, 0] }); step('menu');
s = step('drive'); ok(!s.down.ArrowLeft, 'stick held through the change is latched until re-centred');
setPad({ axes: [0, 0] }); step('drive'); setPad({ axes: [-1, 0] }); s = step('drive'); ok(s.down.ArrowLeft, 're-centred and pushed: steers');
setPad({}); step('drive');
settle('drive');
setPad({ b: [9] }); s = step('drive'); ok(s.hit.includes('KeyP'), 'Start pauses');
s = step('menu'); ok(!s.hit.length, 'paused (menu): the still-held Start does nothing');
setPad({}); step('menu'); setPad({ b: [9] }); s = step('menu'); ok(s.hit.includes('Enter'), 'pressed again it is Enter (resume)');
setPad({}); s = step('drive'); ok(!s.hit.length && !Object.keys(s.down).length, 'back in drive: clean');

section('never stomp the real keyboard');
settle('drive');
key('keydown', 'ArrowLeft'); Input.endFrame();   // the keyboard's own hit is its frame's
setPad({ axes: [-1, 0] }); s = step('drive');
ok(s.down.ArrowLeft && !s.hit.includes('ArrowLeft'), 'pad joins a key the keyboard holds: no extra hit (as keydown would)');
setPad({}); s = step('drive');
ok(s.down.ArrowLeft, 'pad lets go: ArrowLeft stays down, the keyboard still holds it');
key('keyup', 'ArrowLeft'); ok(!Input.down.ArrowLeft, 'keyboard keyup releases it');
setPad({ b: [0] }); step('drive');
key('keydown', 'KeyW'); key('keyup', 'KeyW');
ok(!Input.down.KeyW, '(a keyboard W tapped while the pad holds gas: keyup clears Input.down)');
s = step('drive'); ok(s.down.KeyW && !s.hit.includes('KeyW'), '...and the next poll re-asserts it with no new hit');
fire('blur', {});
ok(!Input.down.KeyW, '(blur wipes Input.down)');
s = step('drive'); ok(s.down.KeyW && !s.hit.length, 'pad still held after a blur: re-asserted, no phantom hit');
setPad({}); s = step('drive'); ok(!s.down.KeyW, 'released');

section('pad selection');
settle('drive');
gamepads = [mkPad({ index: 0, axes: [-1, 0] }), mkPad({ index: 1, b: [0] })];
s = step('drive'); ok(s.down.KeyW && !s.down.ArrowLeft, 'the pad with a button down wins over one with a stuck axis');
gamepads = [mkPad({ index: 0, axes: [-1, 0] }), mkPad({ index: 1 })];
s = step('drive'); ok(!s.down.ArrowLeft, 'and keeps the stick when nothing is pressed anywhere');
gamepads = [null, mkPad({ index: 1, b: [1] })];
s = step('drive'); ok(s.down.KeyS, 'null slots in getGamepads() are skipped');
gamepads = []; step('drive');

section('triggers: right is gas, left is brake (standard mapping)');
settle('drive');
driveCase({ b: [7] }, ['KeyW'], ['KeyS'], 'right trigger accelerates');
driveCase({ b: [6] }, ['KeyS'], ['KeyW'], 'left trigger brakes');
setPad({ b: [7] }); s = step('menu'); ok(!s.down.Enter && !s.down.KeyW, 'a trigger does nothing in a menu');
setPad({}); step('menu');
setPad({ b: [7] }); step('drive'); Pad._reset('drive');
s = step('drive'); ok(!s.down.KeyW, 'a trigger held through a context change is ignored until let go');
setPad({}); step('drive'); setPad({ b: [7] }); s = step('drive'); ok(s.down.KeyW, '...and works again once let go');
setPad({}); step('drive');

section('raw layout: Xbox Wireless Controller (Series X|S) over Bluetooth');
settle('drive');
/* Chrome on Windows reports this pad with no mapping: 15 buttons, 10 axes,
   the triggers on axes 3/4 resting at -1, and the d-pad as a hat on axis 9
   that rests far past +1 */
function xsPad({ b = [], lx = 0, ly = 0, lt = -1, rt = -1, hat = 1227133568, id = 'Unknown Gamepad (Vendor: 045e Product: 0b13)' } = {}) {
  const buttons = [];
  for (let i = 0; i < 15; i++) buttons.push({ pressed: b.includes(i), value: b.includes(i) ? 1 : 0 });
  return { index: 0, mapping: '', connected: true, id, buttons, axes: [lx, ly, 0, lt, rt, 0, 0, 0, 0, hat] };
}
const xs = (o) => { gamepads = [xsPad(o)]; };
const xsCase = (o, ctx, want, not, msg) => {
  xs({}); step(ctx);                       // enter the context with nothing held: a change latches what is down
  xs(o); const st = step(ctx);
  ok(want.every((k) => st.down[k]) && not.every((k) => !st.down[k]), msg + ` (down: ${Object.keys(st.down)})`);
  xs({}); step(ctx);
};
xs({}); s = step('drive'); ok(!Object.keys(s.down).length, 'at rest: nothing held (triggers at -1, hat centred)');
xsCase({ b: [0] }, 'drive', ['KeyW'], ['KeyS'], 'A (0) accelerates');
xsCase({ b: [1] }, 'drive', ['KeyS'], ['KeyW'], 'B (1) reverses');
xsCase({ b: [11] }, 'drive', ['KeyP'], [], 'Menu (11) pauses');
xsCase({ b: [10] }, 'drive', ['KeyM'], [], 'View (10) mutes');
xsCase({ b: [2] }, 'drive', [], ['KeyW', 'KeyS', 'KeyP', 'KeyM'], 'the unused slot 2 does nothing');
xsCase({ rt: 1 }, 'drive', ['KeyW'], ['KeyS'], 'right trigger (axis 4) accelerates');
xsCase({ lt: 1 }, 'drive', ['KeyS'], ['KeyW'], 'left trigger (axis 3) brakes');
xsCase({ rt: -0.6 }, 'drive', [], ['KeyW'], 'a trigger barely touched (20%) does nothing');
xsCase({ hat: -1 }, 'drive', ['KeyW'], [], 'hat up accelerates');
xsCase({ hat: 1 / 7 }, 'drive', ['KeyS'], [], 'hat down reverses');
xsCase({ hat: -3 / 7 }, 'drive', ['ArrowRight'], ['ArrowLeft'], 'hat right steers right');
xsCase({ hat: 5 / 7 }, 'drive', ['ArrowLeft'], ['ArrowRight'], 'hat left steers left');
xsCase({ hat: -5 / 7 }, 'drive', ['KeyW', 'ArrowRight'], [], 'hat up-right is both');
xsCase({ hat: 1 }, 'drive', ['KeyW', 'ArrowLeft'], [], 'hat up-left is both');
xsCase({ b: [0] }, 'menu', ['Enter'], [], 'A confirms in a menu');
xsCase({ b: [1] }, 'menu', ['Escape'], [], 'B goes back in a menu');
xsCase({ b: [11] }, 'menu', ['Enter'], [], 'Menu confirms in a menu');
xsCase({ b: [3] }, 'kitchen', ['Enter'], [], 'X (3) serves in the kitchen');
xs({}); step('menu'); xs({ hat: -1 }); s = step('menu'); ok(s.down.ArrowUp, 'hat up is ArrowUp in a menu'); xs({}); step('menu');
Pad.aimHeading = 0;
xs({}); step('drive');
xs({ b: [3], lx: -1 }); s = step('drive');
ok(s.aiming && near(s.aimX, 60 - 160 * DT), `holding X (3) aims (${s.aimX.toFixed(3)})`);
xs({}); s = step('drive'); ok(s.throwNow && !s.aiming, 'letting go of X throws');
xs({ id: '045e-0b13-Xbox Wireless Controller', b: [3] }); s = step('drive');
ok(s.aiming, 'the macOS / Linux id form is recognised too');
xs({ id: '045e-0b13-Xbox Wireless Controller' }); step('drive');
gamepads = [{ ...xsPad({ b: [2] }), id: 'Unknown Gamepad (Vendor: 1234 Product: 5678)' }];
s = step('drive'); ok(s.aiming, 'an unknown raw pad keeps the old order: index 2 is Button 3');
gamepads = []; step('drive');

/* ---------- touch ---------- */
section('touch: menu taps (any mode)');
for (const m of ['C', 'A', 'B']) {
  settle('menu'); Pad.setMode(m); step('menu');
  touch('touchstart', 1, 100, 50);
  ok(lastEv.prevented, `mode ${m}: touchstart preventDefault (no scroll/zoom/synthetic mouse)`);
  s = step('menu');
  ok(s.hit.includes('Enter') && s.mhit && s.mdown && near(s.mx, 100) && near(s.my, 50) && s.anyKey,
     `mode ${m}: a tap is Enter + mhit at (${s.mx.toFixed(1)}, ${s.my.toFixed(1)})`);
  s = step('menu'); ok(!s.hit.length && !s.mhit && s.mdown, `mode ${m}: held finger: no repeat, mdown stays`);
  touch('touchend', 1, 100, 50); s = step('menu'); ok(!s.mdown && !s.hit.length, `mode ${m}: lift: mdown off`);
}

section('touch: kitchen');
settle('kitchen'); Pad.setMode('C'); step('kitchen');
Pad.touched = false;
touch('touchstart', 7, 120, 130); s = step('kitchen');
ok(s.mhit && s.mdown && near(s.mx, 120) && near(s.my, 130) && !s.hit.includes('Enter'), 'tap: mx/my/mhit/mdown, no Enter');
ok(Input.hasMouse === false && Pad.touched === true, 'hasMouse untouched, Pad.touched set');
touch('touchmove', 7, 150, 131); s = step('kitchen'); ok(near(s.mx, 150) && s.mdown && !s.mhit, 'drag updates mx/my while held');
touch('touchend', 7, 150, 131); s = step('kitchen'); ok(!s.mdown, 'lift: mdown off');

section('touch: Mode C drive overlay');
settle('drive'); Pad.setMode('C'); step('drive');
touch('touchstart', 1, 358, 188); s = step('drive');
ok(s.down.KeyW && s.hit.includes('KeyW') && !s.mhit, 'GAS -> KeyW (and no mhit, so no mouse throw)');
s = step('drive'); ok(s.down.KeyW && !s.hit.length, 'GAS held: no repeat hit');
touch('touchmove', 1, 318, 200); s = step('drive'); ok(s.down.KeyS && !s.down.KeyW, 'thumb rocks onto REV: KeyS, KeyW released');
touch('touchmove', 1, 300, 150); s = step('drive'); ok(s.down.KeyS, 'drifting off the pedal keeps it held');
touch('touchend', 1, 300, 150); s = step('drive'); ok(!s.down.KeyS && !s.down.KeyW, 'lift: released');
touch('touchstart', 2, 318, 205); s = step('drive'); ok(s.down.KeyS, 'REV -> KeyS'); touch('touchend', 2, 318, 205); step('drive');
touch('touchstart', 3, 40, 175); s = step('drive');
ok(!s.down.ArrowLeft && !s.down.ArrowRight && !s.down.KeyW, 'stick touch lands off-centre: no input until it drags (floating)');
touch('touchmove', 3, 28, 175); s = step('drive'); ok(s.down.ArrowLeft, 'drag 12px left (0.5): ArrowLeft');
touch('touchmove', 3, 35, 175); s = step('drive'); ok(!s.down.ArrowLeft, 'drag 5px (0.21): inside the deadzone');
touch('touchmove', 3, 40, 160); s = step('drive'); ok(s.down.KeyW && !s.down.KeyS, 'drag up 15px (0.63): KeyW');
touch('touchmove', 3, 70, 175); s = step('drive'); ok(s.down.ArrowRight, 'drag right past the rim: ArrowRight');
touch('touchstart', 4, 358, 190); s = step('drive'); ok(s.down.ArrowRight && s.down.KeyW, 'multi-touch: steer and hold GAS at once');
touch('touchend', 4, 358, 190); touch('touchend', 3, 70, 175); s = step('drive');
ok(!Object.keys(s.down).length, 'both lifted: nothing held');

section('touch: TOSS hold-to-aim');
Pad.aimHeading = 0;
touch('touchstart', 5, 327, 170); s = step('drive');
ok(s.aiming && near(s.aimX, 60) && near(s.aimY, 0), 'TOSS: aiming, 60px ahead, however off-centre the finger landed');
touch('touchmove', 5, 331, 162); s = step('drive');
ok(near(s.aimX, 70) && near(s.aimY, -20), `drag (+4,-8) moves the aim by 2.5x (${s.aimX}, ${s.aimY})`);
{
  const ax0 = s.aimX, ay0 = s.aimY;
  touch('touchstart', 6, 34, 178); touch('touchmove', 6, 10, 178); s = step('drive');
  ok(s.aiming && !s.down.ArrowLeft && !s.down.KeyW && !s.down.KeyS, 'Mode C: while TOSS is held the stick does not steer or drive (the car coasts)');
  ok(near(s.aimX, ax0 - 160 * DT, 1e-6) && near(s.aimY, ay0), `...it aims, like the controller's stick: full left moves the aim 160px/s (${s.aimX.toFixed(3)} from ${ax0})`);
  touch('touchmove', 5, 335, 162); s = step('drive');
  /* the stick, still held, has moved the base 160*DT left on each of two steps; the finger now sits (+8,-8) from where it landed */
  ok(near(s.aimX, 60 - 2 * 160 * DT + 8 * 2.5, 1e-6) && near(s.aimY, -8 * 2.5, 1e-6),
     `a drag on TOSS still adds its own offset on top of the stick's (${s.aimX.toFixed(3)}, ${s.aimY.toFixed(3)})`);
  touch('touchend', 6, 10, 178); s = step('drive');
  touch('touchmove', 5, 331, 162);
}
touch('touchmove', 5, 380, 100); s = step('drive');
ok(near(Math.hypot(s.aimX, s.aimY), 120, 1e-9), 'aim clamped to 120px');
touch('touchend', 5, 380, 100); s = step('drive');
ok(s.throwNow && !s.aiming, 'lift: throwNow');
s = step('drive'); ok(!s.throwNow, 'one-shot');
touch('touchstart', 8, 324, 167); touch('touchend', 8, 324, 167); s = step('drive');
ok(s.throwNow && near(s.aimX, 60) && near(s.aimY, 0), 'a tap shorter than a frame still throws, straight ahead');
touch('touchstart', 9, 324, 167); s = step('drive'); ok(s.aiming, 'aiming');
touch('touchcancel', 9, 324, 167); s = step('drive'); ok(!s.aiming && !s.throwNow, 'touchcancel aborts the aim, no throw');

section('touch: pause');
touch('touchstart', 10, 192, 9); s = step('drive'); ok(s.hit.includes('KeyP') && !s.down.KeyP, 'PAUSE button: KeyP hit');
touch('touchend', 10, 192, 9); step('drive');
touch('touchstart', 11, 200, 100); s = step('drive'); ok(!s.hit.length, 'one finger outside the controls: nothing');
touch('touchstart', 12, 230, 110); s = step('drive'); ok(s.hit.includes('KeyP'), 'second finger within 0.3s: KeyP');
touch('touchend', 11, 200, 100); touch('touchend', 12, 230, 110); step('drive');
touch('touchstart', 13, 200, 100); run('drive', 30); touch('touchstart', 14, 230, 110); s = step('drive');
ok(!s.hit.length, 'second finger 0.5s later: not a pause');
touch('touchend', 13, 200, 100); touch('touchend', 14, 230, 110); step('drive');

section('touch: other modes in drive, and a context change mid-touch');
settle('drive'); Pad.setMode('B'); step('drive');
touch('touchstart', 20, 358, 188); s = step('drive'); ok(!Object.keys(s.down).length && !s.mhit, 'Mode B: touches do nothing in drive');
touch('touchend', 20, 358, 188); step('drive');
settle('drive');
touch('touchstart', 21, 250, 60); s = step('drive');
ok(s.mhit && Input.hasMouse && near(s.mx, 250), 'Mode A: a tap in drive is a click (mhit, hasMouse) -- throws where tapped');
touch('touchend', 21, 250, 60); step('drive');
settle('drive'); Pad.setMode('C'); step('drive');
touch('touchstart', 22, 358, 188); s = step('drive'); ok(s.down.KeyW, 'GAS held');
s = step('menu'); ok(!s.down.KeyW && !s.hit.includes('Enter'), 'level ends under the thumb: KeyW released, no Enter');
touch('touchmove', 22, 318, 200); s = step('menu'); ok(!s.down.KeyS && !s.down.KeyW, 'the dead touch drives nothing');
touch('touchend', 22, 318, 200); s = step('drive'); ok(!Object.keys(s.down).length, 'and nothing comes back in drive');

/* ---------- detect / label ---------- */
section('detect');
const det = (m, touchProp, pads) => {
  for (const k in media) delete media[k];
  Object.assign(media, m);
  if (touchProp) sandbox.ontouchstart = null; else delete sandbox.ontouchstart;
  gamepads = pads ? [mkPad({})] : [];
  return Pad.detect();
};
ok(det({ '(pointer: coarse)': true }, true, true) === 'C', 'coarse pointer -> C (even with a pad)');
ok(det({}, true, false) === 'C', 'ontouchstart without a fine pointer -> C');
ok(det({ '(any-pointer: fine)': true }, true, false) === 'A', 'touch laptop (fine pointer too) -> A');
ok(det({ '(pointer: fine)': true }, false, true) === 'B', 'gamepad connected -> B');
ok(det({ '(pointer: fine)': true }, false, false) === 'A', 'nothing special -> A');
gamepads = [];

section('label');
Pad.setMode('A'); ok(['drive', 'throw', 'aim', 'pause', 'select', 'wrap', 'serve', 'mute'].every((a) => Pad.label(a) === ''), "mode A: every label is ''");
Pad.setMode('B'); ok(Pad.label('throw') === 'HOLD 3, RELEASE', `B throw: ${Pad.label('throw')}`);
Pad.setMode('C'); ok(Pad.label('throw') === 'HOLD TOSS', `C throw: ${Pad.label('throw')}`);
for (const m of ['B', 'C']) {
  Pad.setMode(m);
  for (const a of ['drive', 'throw', 'aim', 'pause', 'select', 'wrap', 'serve', 'mute']) {
    const L = Pad.label(a);
    ok((L !== '' || (m === 'C' && a === 'mute')) && textW(L) <= 132 && /^[A-Z0-9 ,+\/-]*$/.test(L), `${m} ${a}: '${L}' (${textW(L)}px)`);
  }
}
ok(Pad.label('nonsense') === '', 'unknown action -> empty');

/* ---------- draw ---------- */
section('draw: bounds, palette, no-op outside C/drive');
const bbox = (c, x0, y0, x1, y1) => {
  let a = [1e9, 1e9, -1, -1];
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (c.data[(y * c.width + x) * 4 + 3] > 0) {
    a = [Math.min(a[0], x), Math.min(a[1], y), Math.max(a[2], x), Math.max(a[3], y)];
  }
  return a;
};
const blank = (c) => c.data.every((v) => v === 0);
settle('drive');
let cv = new Canvas(384, 216);
Pad.setMode('A'); Pad.draw(cv.getContext('2d'), 'drive'); ok(blank(cv), 'mode A: draw is a no-op');
Pad.setMode('C'); Pad.draw(cv.getContext('2d'), 'kitchen'); Pad.draw(cv.getContext('2d'), 'menu'); ok(blank(cv), 'mode C, kitchen/menu: draw is a no-op');
colours.clear();
Pad.draw(cv.getContext('2d'), 'drive');
ok(!blank(cv), 'mode C drive: the overlay draws');
const banned = ['cyan', 'cyanLo', 'jade', 'jadeHi', 'jadeLo', 'gold', 'goldLo'].map((k) => PAL[k].toLowerCase());
ok(![...colours].some((c) => banned.includes(c)), `no cyan/jade/gold among the ${colours.size} colours used`);
const L = bbox(cv, 0, 100, 150, 216), Rb = bbox(cv, 250, 100, 384, 216), T = bbox(cv, 100, 0, 300, 40);
ok(L[0] >= 4 && L[1] >= 146 && L[2] <= 70 && L[3] <= 212, `stick idle inside x4..70 y146..212: [${L}]`);
ok(Rb[0] >= 300 && Rb[1] >= 150 && Rb[2] <= 380 && Rb[3] <= 212, `buttons inside x300..380 y150..212: [${Rb}]`);
ok(T[1] >= 4 && T[3] <= 14 && Math.abs((T[0] + T[2]) / 2 - 191.5) <= 1, `pause plate y4..14, top-centre: [${T}]`);
let worst = [1e9, 1e9, -1, -1];
for (let i = 0; i < 16; i++) {
  const a = i / 16 * Math.PI * 2;
  touch('touchstart', 30, 34, 178); touch('touchmove', 30, 34 + Math.cos(a) * 40, 178 + Math.sin(a) * 40); step('drive');
  touch('touchstart', 31, 358, 188); touch('touchstart', 32, 318, 200); touch('touchstart', 33, 324, 167); step('drive');
  const c2 = new Canvas(384, 216); Pad.draw(c2.getContext('2d'), 'drive');
  const b2 = bbox(c2, 0, 100, 150, 216), r2 = bbox(c2, 250, 100, 384, 216);
  worst = [Math.min(worst[0], b2[0], r2[0] < 300 ? r2[0] : 1e9), Math.min(worst[1], b2[1]), Math.max(worst[2], b2[2]), Math.max(worst[3], b2[3], r2[3])];
  ok(r2[0] >= 300 && r2[1] >= 150 && r2[2] <= 380 && r2[3] <= 212, `lit buttons stay inside their rect [${r2}]`);
  for (const id of [30, 31, 32, 33]) touch('touchend', id, 0, 0);
  step('drive');
}
ok(worst[0] >= 4 && worst[1] >= 146 && worst[2] <= 70 && worst[3] <= 212, `knob at full deflection, 16 directions, stays inside x4..70 y146..212: [${worst}]`);

console.log(`\n${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
