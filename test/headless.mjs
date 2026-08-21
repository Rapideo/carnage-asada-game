/* Runs the real game modules against a stub canvas so every code path
   executes without a browser. Catches ReferenceErrors, NaN drift,
   bad indices and dead loops that a syntax check cannot. */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';

const SRC = join(process.cwd(), 'src');
const files = readdirSync(SRC).filter((f) => f.endsWith('.js')).sort();
const code = files.map((f) => `\n//# ${f}\n` + readFileSync(join(SRC, f), 'utf8')).join('\n');

/* ---------- stub 2d context ---------- */
let ops = 0;
const noop = () => { ops++; };
function makeCtx(canvas) {
  const g = { addColorStop: noop };
  return new Proxy({
    canvas,
    imageSmoothingEnabled: false,
    globalAlpha: 1, fillStyle: '#000', strokeStyle: '#000', lineWidth: 1,
    createRadialGradient: () => g,
    createLinearGradient: () => g,
    measureText: () => ({ width: 0 }),
  }, {
    get(t, k) {
      if (k in t) return t[k];
      return noop;                       // every drawing call is a no-op
    },
    set(t, k, v) { t[k] = v; return true; },
  });
}
function makeCanvas() {
  const c = { width: 1, height: 1, style: {}, addEventListener: noop,
              clientWidth: 1440, clientHeight: 660,
              getBoundingClientRect: () => ({ left: 0, top: 0, width: 1152, height: 648 }) };
  c.getContext = () => (c._ctx ||= makeCtx(c));
  return c;
}

/* 90_main.js runs its boot IIFE on load; capture its deferred work instead of
   letting it race the test, but still execute resize()/Input.init() for real */
const deferred = [];
const sandbox = {
  document: { createElement: (t) => (t === 'canvas' ? makeCanvas() : { style: {} }), getElementById: () => makeCanvas() },
  window: { addEventListener: noop, innerWidth: 1440, innerHeight: 800 },
  addEventListener: noop, removeEventListener: noop,
  performance: { now: () => Date.now() },
  requestAnimationFrame: noop,
  __deferred: deferred,
  console, Math, Date, JSON, Object, Array, String, Number, Boolean,
  Float32Array, Int32Array, Int16Array, Int8Array, Uint8Array, Uint16Array,
  setTimeout: (fn) => { deferred.push(fn); return 0; },
  clearTimeout: noop, setInterval: () => 0, clearInterval: noop,
  location: { search: '' }, URLSearchParams,
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
// top-level const/let live in the script's lexical scope, not on the global
// object, so hand them out explicitly from inside the same scope
vm.runInContext(code + '\n;globalThis.__x = { G, City, Nav, Art, Input, Fx, Demo, solve, textW, MAXTHROW,' +
  ' ATTRACT_TITLE, ATTRACT_WINNERS, ATTRACT_DEMO, VW, VH, WW, WH, Player, carBlocked, TS, GW, HSTREETS, VSTREETS };',
  sandbox, { filename: 'bundle.js' });

const { G, City, Nav, Art, Input, textW, MAXTHROW, VW, VH, WW, WH,
        ATTRACT_TITLE, ATTRACT_WINNERS, ATTRACT_DEMO, Player, carBlocked, TS, GW, HSTREETS, VSTREETS } = sandbox.__x;
sandbox.solve = sandbox.__x.solve;

/* ---------- assertions ---------- */
let fails = 0;
const ok = (cond, msg) => { if (!cond) { console.error('  FAIL  ' + msg); fails++; } else console.log('  ok    ' + msg); };
const finite = (v) => typeof v === 'number' && Number.isFinite(v);

console.log('\n— boot module —');
ok(deferred.length === 1, 'main IIFE ran (splash + resize + Input.init) without throwing');

console.log('\n— build —');
const t0 = Date.now();
G.boot(20260816);
console.log(`  city built in ${Date.now() - t0}ms`);
ok(City.houses.length > 100, `addressed houses: ${City.houses.length}`);
ok(City.statics.length > 500, `static props: ${City.statics.length}`);
ok(City.shop && City.shop.dock, 'taqueria has a pickup dock');
ok(City.buckets.length === City.BC * City.BC, `spatial buckets: ${City.buckets.length}`);
ok(Art.house.length === 8 && Art.house[0].length === 4, 'house sprites: 8 variants x 4 facings');
ok(Art.car.length === 8 && Art.car[0].length === 32, 'car rotation frames baked');

/* every house must have a sane address, porch and nav node */
let badAddr = 0, badPorch = 0, badNode = 0, dupes = new Map();
for (const h of City.houses) {
  if (!h.addr || !/^\d+ /.test(h.addr)) badAddr++;
  if (!finite(h.porch.x) || h.porch.w < 8 || h.porch.h < 8) badPorch++;
  if (!h.node || h.node[0] < 0 || h.node[0] > 8 || h.node[1] < 0 || h.node[1] > 8) badNode++;
  dupes.set(h.addr, (dupes.get(h.addr) || 0) + 1);
}
ok(badAddr === 0, 'all addresses well-formed');
ok(badPorch === 0, 'all porches valid');
ok(badNode === 0, 'all nav nodes inside the grid');
const collide = [...dupes.values()].filter((n) => n > 1).length;
ok(collide === 0, `no duplicate addresses (${dupes.size} unique)`);

/* porches must not sit inside a building */
let buried = 0;
for (const h of City.houses) {
  const cx = h.porch.x + h.porch.w / 2, cy = h.porch.y + h.porch.h / 2;
  if (City.isSolid(cx, cy)) buried++;
}
ok(buried === 0, `no porch buried in geometry (${buried} bad)`);

/* HUD text must fit its panels. Three separate overflow bugs have shipped in
   this card, so the widths are asserted rather than eyeballed. */
console.log('\n— hud layout —');
// the card sits at x=3 and is 140 wide, so its right border is at 143; text
// is inset to x=8. Compare absolute x against absolute x, not against a width.
const CARD_X0 = 3, CARD_W = 140, TEXT_X = 8, PAD = 3;
const cardFits = (s) => TEXT_X + textW(s, 1) <= CARD_X0 + CARD_W - PAD;
const longestAddr = City.houses.reduce((a, h) => (h.addr.length > a.length ? h.addr : a), '');
ok(cardFits(longestAddr), `longest address fits the order card: "${longestAddr}" (${textW(longestAddr, 1)}px)`);
ok(cardFits(longestAddr + ' WAITING'),
   `restock line fits the order card (${textW(longestAddr + ' WAITING', 1)}px)`);
ok(cardFits('OUT OF TACOS - RESTOCK'), 'restock label fits the order card');

/* banner boxes are textW(str,2)+16 and must fit the 384px screen */
const BANNERS = ['CLOCK IN!', 'OUT OF TACOS - BACK TO SHOP', 'THAT IS NOT ' + longestAddr.split(' ')[0],
  'SPLAT!', 'PERFECT TOSS!', 'DELIVERED!', "HAYS PD! LOSE 'EM!", 'PULLED OVER', 'LOST THEM'];
const tooWide = BANNERS.filter((b) => textW(b, 2) + 16 > VW);
ok(tooWide.length === 0, `all ${BANNERS.length} banners fit the screen${tooWide.length ? ': ' + tooWide.join(' | ') : ''}`);

/* A car whose body overlaps geometry must always be able to drive out.
   carBlocked() is tested at the destination, so before unwedge() existed every
   escape move was rejected too — and steering is speed-gated, so the car could
   not turn out either. 0 of 37 sites were escapable by ANY input. */
console.log('\n— collision —');
const wedgeSites = [];
for (let ty = 4; ty < 96 && wedgeSites.length < 30; ty++) {
  for (let tx = 4; tx < 96; tx++) {
    if (!City.solid[ty * GW + tx]) continue;
    const wx = tx * TS + 8, wy = (ty + 1) * TS + 6;
    if (!City.isSolid(wx, wy) && carBlocked(wx, wy, -Math.PI / 2)) { wedgeSites.push({ x: wx, y: wy }); break; }
  }
}
ok(wedgeSites.length > 10, `found ${wedgeSites.length} wedge sites to test`);
let escaped = 0;
const stubG = { shake: 0, hitstop: 0, onCrash: () => {} };
for (const s of wedgeSites) {
  const p = new Player(s.x, s.y, -Math.PI / 2);
  p.vx = p.vy = 0;
  for (let i = 0; i < 900; i++) {              // 15s of rocking free
    p.throttle = ((i / 30) | 0) % 2 ? 1 : -1; p.steer = 1; p.hb = false;
    p.update(1 / 60, stubG);
    if (Math.hypot(p.x - s.x, p.y - s.y) > 40) { escaped++; break; }
  }
}
ok(escaped === wedgeSites.length, `every wedged car can drive out (${escaped}/${wedgeSites.length})`);

console.log('\n— guidance —');
let routeFail = 0, longest = 0;
for (let i = 0; i < 250; i++) {
  const h = City.houses[(Math.random() * City.houses.length) | 0];
  const s = [(Math.random() * 9) | 0, (Math.random() * 9) | 0];
  const path = sandbox.solve(s, h.node, (Math.random() * 4) | 0);
  if (!path.length) routeFail++;
  else {
    longest = Math.max(longest, path.length);
    const end = path[path.length - 1];
    if (end[0] !== h.node[0] || end[1] !== h.node[1]) routeFail++;
    for (let k = 1; k < path.length; k++) {
      const d = Math.abs(path[k][0] - path[k - 1][0]) + Math.abs(path[k][1] - path[k - 1][1]);
      if (d !== 1) routeFail++;
    }
  }
}
ok(routeFail === 0, `250 routes solved, all contiguous (longest ${longest} nodes)`);

console.log('\n— simulation —');
const ctx = makeCtx(makeCanvas());
G.startShift();
ok(G.order !== null, 'first order issued at clock-in');
ok(Nav.goal !== null, 'nav locked on');

const keys = ['KeyW', 'KeyA', 'KeyD', 'KeyS', 'ShiftLeft'];
let thrown = 0, maxSpeed = 0, nanFrames = 0, delivered0 = 0;
Input.hasMouse = true;

for (let f = 0; f < 9000; f++) {
  // wander: change inputs every ~30 frames
  if (f % 30 === 0) {
    Input.down = Object.create(null);
    Input.down.KeyW = true;
    if (Math.random() < 0.5) Input.down[keys[1 + ((Math.random() * 2) | 0)]] = true;
    if (Math.random() < 0.1) Input.down.ShiftLeft = true;
  }
  // aim somewhere near the goal and toss now and then
  if (Nav.goal) {
    Input.mx = Math.max(0, Math.min(VW, Nav.goal.x - G.cam.x));
    Input.my = Math.max(0, Math.min(VH, Nav.goal.y - G.cam.y));
  }
  Input.mhit = (f % 47 === 0);
  if (Input.mhit) thrown++;

  G.update(1 / 60);
  G.render(ctx);
  Input.endFrame();

  const p = G.player;
  if (!finite(p.x) || !finite(p.y) || !finite(p.ang) || !finite(p.vx) || !finite(p.vy)) { nanFrames++; break; }
  if (p.x < 0 || p.x > WW || p.y < 0 || p.y > WH) { console.error('  player escaped the world at frame ' + f); fails++; break; }
  maxSpeed = Math.max(maxSpeed, Math.hypot(p.vx, p.vy));
  if (G.state === 'results') { delivered0 = G.stats.delivered; G.startShift(); }
}
ok(nanFrames === 0, 'no NaN in player state over 9000 frames');
ok(maxSpeed > 60, `car reaches speed (peak ${maxSpeed.toFixed(0)} px/s)`);
ok(G.traffic.length > 10, `traffic sustained: ${G.traffic.length} cars`);
ok(G.peds.length > 10, `pedestrians sustained: ${G.peds.length}`);
ok(thrown > 100, `${thrown} taco bags thrown without a crash`);

/* forced end-to-end delivery: teleport onto the porch and toss */
console.log('\n— scoring —');
// The fuzz section above leaves driving keys held in Input.down. This section
// parks the car to test a deliberate stationary toss, so release them first —
// otherwise the player drives off the porch, crashes, and spins out, and
// tryThrow() silently no-ops while spinT > 0. That made the two bag/restock
// assertions below fail on roughly 1 run in 20.
Input.down = Object.create(null);
G.startShift();
const target = G.order.house;
const before = G.earned, bagBefore = G.bag;
G.player.x = target.porch.x + target.porch.w / 2;
G.player.y = target.porch.y + target.porch.h / 2 + 40;
G.player.vx = G.player.vy = 0;
G.cam.x = G.player.x - VW / 2; G.cam.y = G.player.y - VH / 2;
Input.hasMouse = true;
Input.mx = target.door.x + target.door.w / 2 - G.cam.x;
Input.my = target.door.y + target.door.h / 2 - G.cam.y;
G.tryThrow();
ok(G.bag === bagBefore - 1, 'throwing consumes a bag');
for (let i = 0; i < 60; i++) G.update(1 / 60);
ok(G.earned > before, `tip banked: ${(G.earned / 100).toFixed(2)}`);
ok(G.stats.delivered === 1, 'delivery counted');
ok(G.stats.perfect === 1, 'doorstep hit scored as perfect');
ok(G.order && G.order.house !== target, 'next order issued automatically');

/* empty bag routes you back to the shop */
G.bag = 1; G.tryThrow();
for (let i = 0; i < 40; i++) G.update(1 / 60);
ok(G.needPickup === true, 'empty bag flips to restock mode');
ok(Nav.goal && Math.abs(Nav.goal.x - City.shop.dock.x) < 2, 'nav redirects to the shop');

/* tip really does shrink */
G.bag = 3; G.needPickup = false; G.syncNav();
const tip0 = G.order.tip;
for (let i = 0; i < 300; i++) G.update(1 / 60);
ok(G.order.tip < tip0, `tip decayed ${(tip0 / 100).toFixed(2)} -> ${(G.order.tip / 100).toFixed(2)} over 5s`);
ok(G.order.tip >= G.order.floor, 'tip never falls through the floor');

/* heat -> cop */
/* attract rotation: title -> winners -> demo -> title, and the demo drives */
console.log('\n— attract —');
const step = (secs) => { for (let i = 0; i < secs * 60; i++) { G.update(1 / 60); G.render(ctx); Input.endFrame(); } };

Input.down = Object.create(null); Input.mhit = false; Input.hasMouse = false;
G.toTitle();
ok(G.state === 'title', 'attract starts on the title');
step(ATTRACT_TITLE + 0.5);
ok(G.state === 'winners', `title holds ${ATTRACT_TITLE}s then shows the winners card`);
step(ATTRACT_WINNERS + 0.5);
ok(G.state === 'demo', `winners holds ${ATTRACT_WINNERS}s then starts the demo`);

/* the demo must actually drive — a car wedged against a wall would still
   satisfy "no NaN", so track distance covered and watch for drift */
let far = 0, bad = 0, moved = 0, stall = 0, worstStall = 0;
let prev = { x: G.player.x, y: G.player.y };
for (let i = 0; i < 85 * 60; i++) {
  G.update(1 / 60); G.render(ctx); Input.endFrame();
  const p = G.player;
  if (!finite(p.x) || !finite(p.y) || !finite(p.ang) || !finite(p.vx) || !finite(p.vy)) { bad++; break; }
  if (p.x < 0 || p.x > WW || p.y < 0 || p.y > WH) { far++; break; }
  const d = Math.hypot(p.x - prev.x, p.y - prev.y);
  moved += d;
  if (d < 0.2) { stall += 1 / 60; worstStall = Math.max(worstStall, stall); } else stall = 0;
  prev = { x: p.x, y: p.y };
}
ok(bad === 0, 'no NaN in the demo driver over 85s');
ok(far === 0, 'demo car stayed inside the world');
ok(moved > 2500, `demo car actually drove (${Math.round(moved)}px covered)`);
// net displacement is NOT a useful check here — the demo takes orders all over
// the map and can legitimately end up near where it started. What must hold is
// that it never wedges permanently.
ok(worstStall < 8, `demo never stalled for long (worst ${worstStall.toFixed(1)}s)`);
ok(G.state === 'demo', 'demo still running before its timer expires');
step(6);
ok(G.state === 'title', `demo returns to the title after ${ATTRACT_DEMO}s`);

/* any key from winners or demo goes back to the title */
G.toWinners();
Input.anyKey = true;
G.update(1 / 60);
ok(G.state === 'title', 'a keypress on the winners card returns to the title');
Input.anyKey = false; Input.endFrame();

/* The city is a real place — downtown Hays, KS — authored in content/hays.json.
   These assertions are pure reads, so they are safe anywhere in the sequence. */
console.log('\n— hays map —');
ok(HSTREETS.length === 9 && VSTREETS.length === 9,
   `9 streets per axis (${HSTREETS.length}, ${VSTREETS.length})`);
ok(HSTREETS[4] === '8TH ST', `8th Street is the 5th east-west street, got "${HSTREETS[4]}"`);
ok(VSTREETS[4] === 'MAIN ST', `Main Street is the 5th north-south street, got "${VSTREETS[4]}"`);
ok(VSTREETS[1] === 'WALNUT ST' && VSTREETS[2] === 'ASH ST',
   'the shop block is bounded by Walnut and Ash');

console.log('\n— heat —');
G.heat = 0; G.cop = null;
for (let i = 0; i < 40; i++) G.bumpHeat(5);
ok(G.cop !== null, 'cop dispatched at max heat');
for (let i = 0; i < 600; i++) G.update(1 / 60);
ok(finite(G.cop ? G.cop.x : 0), 'cop pursuit stable');

console.log(`\n${fails === 0 ? 'PASS' : 'FAIL (' + fails + ')'}  —  ${ops.toLocaleString()} draw calls exercised`);
process.exit(fails ? 1 : 0);
