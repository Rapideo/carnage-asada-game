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
  ' ATTRACT_TITLE, ATTRACT_WINNERS, ATTRACT_DEMO, VW, VH, WW, WH, Player, Train, Crossing, carBlocked, ATTRACT, TITLE_HOLD, TURN_NAMES, TS, GW, HSTREETS, VSTREETS };',
  sandbox, { filename: 'bundle.js' });

const { G, City, Nav, Art, Input, textW, MAXTHROW, VW, VH, WW, WH,
        ATTRACT_TITLE, ATTRACT_WINNERS, ATTRACT_DEMO, Player, Train, Crossing, carBlocked, ATTRACT, TITLE_HOLD, TURN_NAMES, TS, GW, HSTREETS, VSTREETS } = sandbox.__x;
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
  'SPLAT!', 'PERFECT TOSS!', 'DELIVERED!', "HAYS PD! LOSE 'EM!", 'PULLED OVER', 'LOST THEM',
  'HIT BY TRAIN', 'THE TRAIN GOT THEM'];
const tooWide = BANNERS.filter((b) => textW(b, 2) + 16 > VW);
ok(tooWide.length === 0, `all ${BANNERS.length} banners fit the screen${tooWide.length ? ': ' + tooWide.join(' | ') : ''}`);

/* The TACO-NAV panel lost its header and was resized around its longest
   possible content, so it needs a guard for the same reason the order card
   does. Mirrors drawNav in 70_hud.js — compare absolute x against absolute x. */
const NAV_W = 118, NAV_H = 24, NAV_X0 = (VW - NAV_W) / 2 | 0, NAV_Y0 = VH - NAV_H - 4;
const NAV_INSET = NAV_X0 + 32, NAV_PAD = 4;
const navLeftFits = (str) => NAV_INSET + textW(str, 1) <= NAV_X0 + NAV_W - NAV_PAD;
const navMidFits = (str, sc) => textW(str, sc) <= NAV_W - NAV_PAD * 2;
const longestTurn = TURN_NAMES.reduce((a, t) => (t.length > a.length ? t : a), '');
ok(navLeftFits(longestTurn), `longest turn name fits the nav panel: "${longestTurn}" (${textW(longestTurn, 1)}px)`);
ok(navLeftFits('TOSS THE BAG'), 'the arriving line fits the nav panel');
ok(navLeftFits('IN 999 M'), 'the distance line fits the nav panel');
ok(navMidFits('RETURN TO ROADWAY', 1), `the off-road line fits the nav panel (${textW('RETURN TO ROADWAY', 1)}px in ${NAV_W})`);
ok(navMidFits('RECALCULATING.', 1), 'the recalculating line fits the nav panel');
ok(navMidFits('STANDBY', 2), 'STANDBY fits the nav panel at scale 2');
ok(NAV_Y0 + NAV_H <= VH, `the nav panel fits above the bottom edge (${NAV_Y0 + NAV_H} <= ${VH})`);

/* the bag label sits at VW-76 and runs right; DELIVERIES is 12px wider than
   the TACO BAG it replaced */
ok(VW - 76 + textW('DELIVERIES', 1) <= VW, `the deliveries label fits the screen (${textW('DELIVERIES', 1)}px from x=${VW - 76})`);

/* attract timings are authored in content/attract.json now, so assert the
   game actually reads them rather than a stale constant */
ok(ATTRACT_TITLE === ATTRACT.title.seconds && ATTRACT_WINNERS === ATTRACT.winners.seconds && ATTRACT_DEMO === ATTRACT.demo.seconds,
   `attract timings come from content: ${ATTRACT_TITLE}/${ATTRACT_WINNERS}/${ATTRACT_DEMO}s`);
ok(TITLE_HOLD >= 0 && TITLE_HOLD <= ATTRACT_TITLE - 2,
   `the wordmark lands with time to spare (hold ${TITLE_HOLD}s of ${ATTRACT_TITLE}s)`);

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

/* "Escapable by ANY input" is the claim, so this has to TRY more than one input.
   It used to rock the throttle while steering permanently right, which reports a
   false failure at any site where that particular circle happens to stay inside
   40px. One such site — a tight spot between a park pond and its trees — failed
   this assertion while reverse-only drove out of it in 0.8s, and cost a full
   investigation before the test was corrected rather than the game. A site is a
   softlock only when EVERY strategy fails, so keep more than one here. */
const ESCAPES = [
  ['rock, steer right', (p, i) => { p.throttle = ((i / 30) | 0) % 2 ? 1 : -1; p.steer = 1; }],
  ['rock, steer left',  (p, i) => { p.throttle = ((i / 30) | 0) % 2 ? 1 : -1; p.steer = -1; }],
  ['reverse out',       (p) => { p.throttle = -1; p.steer = 0; }],
  ['rock, no steer',    (p, i) => { p.throttle = ((i / 30) | 0) % 2 ? 1 : -1; p.steer = 0; }],
];
let escaped = 0;
const trapped = [];
const stubG = { shake: 0, hitstop: 0, onCrash: () => {} };
for (const s of wedgeSites) {
  let out = false;
  for (const [, drive] of ESCAPES) {
    const p = new Player(s.x, s.y, -Math.PI / 2);
    p.vx = p.vy = 0;
    for (let i = 0; i < 900 && !out; i++) {     // 15s per strategy
      drive(p, i); p.hb = false;
      p.update(1 / 60, stubG);
      if (Math.hypot(p.x - s.x, p.y - s.y) > 40) out = true;
    }
    if (out) break;
  }
  if (out) escaped++;
  else trapped.push(`(${(s.x / TS) | 0},${(s.y / TS) | 0})`);
}
ok(escaped === wedgeSites.length,
   `every wedged car can drive out (${escaped}/${wedgeSites.length})` +
   (trapped.length ? ` — trapped at tile ${trapped.join(' ')}` : ''));

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
// 12s, not 8: a legitimate wait at a closed crossing is roughly 2s of warning
// plus 1.5s of train plus the raise, and the demo can meet one mid-approach.
// The bound still has to catch a wedge. What it must NOT become is a net
// displacement check — that fails on working code, because the demo takes
// orders all over the map and can legitimately finish near where it started.
ok(worstStall < 12, `demo never stalled for long (worst ${worstStall.toFixed(1)}s)`);
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

/* Hays addressing. Which way a block's houses face is a per-block coin flip, so
   these assert the invariants rather than naming a street that may have no
   houses this seed. */
const addrs = City.houses.map((h) => h.addr);
ok(new Set(addrs).size === addrs.length, `all ${addrs.length} addresses are unique`);

const badPrefix = City.houses.filter((h) => {
  const numbered = /\d+(ST|ND|RD|TH) ST$/.test(h.street);
  const prefixed = /^[WE] /.test(h.street);
  return numbered !== prefixed;
});
ok(badPrefix.length === 0,
   `numbered streets carry a W/E prefix and named streets never do${badPrefix.length ? ': "' + badPrefix[0].addr + '"' : ''}`);

const onNumbered = City.houses.filter((h) => /^[WE] /.test(h.street));
const onNamed = City.houses.filter((h) => !/^[WE] /.test(h.street));
ok(onNumbered.length > 0 && onNamed.length > 0,
   `both axes are addressed (${onNumbered.length} numbered, ${onNamed.length} named)`);
ok(onNumbered.every((h) => h.num >= 100 && h.num < 500),
   'numbered-street numbers sit in the 100-400 blocks either side of Main');
ok(onNamed.every((h) => h.num >= 400 && h.num < 1200),
   'named-street numbers sit in the 400-1100 blocks, 4th to 12th');

/* The block programme is the authored table, not a random roll. */
const K = City.kinds || [];
ok(K.length === 8 && K.every((r) => Array.isArray(r) && r.length === 8),
   'City.kinds is the 8x8 authored table');
ok((K[3] || [])[1] === 'shop', `the shop block is Walnut-Ash x 8th-9th, got "${(K[3] || [])[1]}"`);
ok((K[0] || [])[3] === 'retail' && (K[0] || [])[4] === 'retail',
   'the Fort/Main retail spine runs through 11th-12th');
ok((K[2] || []).length === 8 && K[2].every((k) => k === 'rail'),
   'the whole 9th-10th row is the railway corridor');

/* And the shop must physically generate inside the block the table names. */
const SPANT = 12, BORDERT = 2;
const blockOf = (w) => Math.floor((w / TS - BORDERT) / SPANT);
ok(blockOf(City.shop.x) === 1 && blockOf(City.shop.y) === 3,
   `the shop generates inside block [1,3], got [${blockOf(City.shop.x)},${blockOf(City.shop.y)}]`);

console.log('\n— block kinds —');
ok(typeof City.markSolidSafe === 'function', 'City.markSolidSafe exists');

/* The invariant: marking a porch tile solid must be refused, not obeyed. */
let porchTile = -1;
for (let i = 0; i < City.keep.length; i++) if (City.keep[i]) { porchTile = i; break; }
ok(porchTile >= 0, 'found a keep tile to test against');
if (typeof City.markSolidSafe === 'function' && porchTile >= 0) {
  const wasSolid = City.solid[porchTile];
  const refused = City.markSolidSafe(porchTile % GW, (porchTile / GW) | 0, 1, 1);
  ok(refused === 1 && City.solid[porchTile] === wasSolid,
     `markSolidSafe refuses keep tiles (refused ${refused}, solid unchanged ${City.solid[porchTile] === wasSolid})`);
}

ok(Array.isArray(Art.store) && Art.store.length > 0, `Art.store has ${(Art.store || []).length} storefront runs`);

/* What separates downtown from the suburbs is not how much is built — four
   detached houses cover about the same area — but that downtown is an unbroken
   street wall while houses have gaps between them. So count rows that span the
   whole lot with no gap. */
const fullRows = (bx, by) => {
  let n = 0;
  for (let ly = 3; ly <= 10; ly++) {
    let unbroken = true;
    for (let lx = 3; lx <= 10; lx++)
      if (!City.solid[(2 + by * 12 + ly) * GW + (2 + bx * 12 + lx)]) { unbroken = false; break; }
    if (unbroken) n++;
  }
  return n;
};
const retailRows = fullRows(3, 0);         // Fort-Main x 11th-12th, authored 'retail'
const resRows = fullRows(0, 6);            // Elm-Walnut x 5th-6th, authored 'res'
ok(retailRows >= 2, `the retail block forms an unbroken street wall (${retailRows} full-width rows)`);
ok(resRows === 0, `the residential block does not (${resRows} full-width rows)`);

/* Apartment blocks are scenery, not delivery targets — every address in the game
   comes from genResidential, and giving these a second address path is a
   follow-up rather than this branch. Assert it so the decision is visible. */
ok(Art.apts.length > 0, `Art.apts has ${Art.apts.length} blocks of flats`);
const inLot = (h, bx, by) =>
  h.x >= (2 + bx * 12 + 3) * TS && h.x < (2 + bx * 12 + 11) * TS &&
  h.y >= (2 + by * 12 + 3) * TS && h.y < (2 + by * 12 + 11) * TS;
const aptsWithAddresses = [[0, 3], [0, 5], [4, 5]]
  .filter(([bx, by]) => City.houses.some((h) => inLot(h, bx, by)));
ok(aptsWithAddresses.length === 0,
   `apartment blocks generate no delivery addresses${aptsWithAddresses.length ? ' — ' + JSON.stringify(aptsWithAddresses) : ''}`);

/* Civic buildings stand back behind a forecourt — the opposite of retail, which
   builds to the pavement. The setback is the read, so assert it. */
ok(Art.civic.length > 0, `Art.civic has ${Art.civic.length} massings`);
const rowSolid = (bx, by, ly) => {
  let n = 0;
  for (let lx = 3; lx <= 10; lx++) if (City.solid[(2 + by * 12 + ly) * GW + (2 + bx * 12 + lx)]) n++;
  return n;
};
ok(rowSolid(3, 4, 10) === 0 && rowSolid(3, 4, 5) > 0,
   `the Post Office block stands back behind a forecourt (front row ${rowSolid(3, 4, 10)} solid, middle row ${rowSolid(3, 4, 5)})`);

/* The Union Pacific corridor: a real barrier, crossed only where Hays lets you. */
ok(Array.isArray(City.crossings) && City.crossings.length === 9,
   `nine level crossings, one per north-south street (got ${(City.crossings || []).length})`);
ok(typeof City.railY === 'number' && City.railY > 0, `City.railY is the corridor centre (${City.railY})`);
if (City.crossings && City.railY) {
  ok(City.crossings.every((c) => !City.isSolid(c.x, City.railY)), 'every crossing is drivable');
  const railTy = (City.railY / TS) | 0;
  let solid = 0, checked = 0;
  for (let tx = 3; tx < GW - 3; tx++) {
    const wx = tx * TS + 8;
    if (City.crossings.some((c) => Math.abs(c.x - wx) < 26)) continue;   // skip the crossings
    checked++;
    if (City.solid[railTy * GW + tx]) solid++;
  }
  ok(checked > 0 && solid / checked > 0.9,
     `the corridor is solid between crossings (${solid}/${checked} tiles)`);
}

console.log('\n— rail —');
/* This section drives a real shift, so reset the input the earlier sections
   left held. Note it also leaves the game in `play` — which is what finally
   lets `— heat —` below exercise a live pursuit instead of a title screen. */
Input.down = Object.create(null); Input.anyKey = false; Input.mhit = false; Input.hasMouse = false;
G.startShift();

ok(Array.isArray(City.tracks) && City.tracks.length === 2,
   `two track centre lines in the corridor: ${(City.tracks || []).join(' / ')}`);
ok(Array.isArray(Art.loco) && Art.loco.length === 2 && Art.boxcar.length > 1,
   `a locomotive both ways and ${(Art.boxcar || []).length} boxcar liveries`);

/* a train crosses the whole map and despawns, without the scheduler quietly
   starting a second one underneath the assertion */
G.trainT = 999;
G.train = new Train(1, City.tracks[1]);
ok(G.train.len > 300, `the consist is ${G.train.len}px nose to tail`);
let ran = 0;
for (let i = 0; i < 20 * 60 && G.train; i++) {
  G.update(1 / 60); G.render(ctx); Input.endFrame();
  if (G.train) { ran++; if (!finite(G.train.x)) break; }
}
ok(G.train === null, `the train crossed the map and despawned (${(ran / 60).toFixed(1)}s)`);
ok(ran > 5 * 60, 'it took several seconds to do it, rather than teleporting');

ok(G.crossings.length === City.crossings.length,
   `${G.crossings.length} live crossings built from the ${City.crossings.length} in the city`);
ok(City.crossings.every((c) => Array.isArray(c.masts) && c.masts.length === 2),
   'every crossing carries two gate pivots');
/* The mast sprite's head sits 26px above its anchor. A pivot any nearer than
   ~42 puts that head on the south track, where the train draws straight
   through it — which is exactly what the first render showed. */
ok(City.crossings.every((c) => c.masts.every((m) => Math.abs(m[1] - City.railY) > 40)),
   'both gate pivots stand clear of the tracks');

/* gates go down for a train and come back up after it */
G.trainT = 999;
G.train = new Train(1, City.tracks[1]);
let sawDown = false;
for (let i = 0; i < 20 * 60 && G.train; i++) {
  G.update(1 / 60); G.render(ctx); Input.endFrame();
  if (G.crossings.some((c) => c.down)) sawDown = true;
}
ok(sawDown, 'gates went down as the train passed');
for (let i = 0; i < 120; i++) { G.update(1 / 60); G.render(ctx); Input.endFrame(); }
ok(G.crossings.every((c) => c.t === 0 && !c.down),
   'every gate came back up — none stuck closed');

/* THE softlock guard. A wreck that leaves the car on the rails is a repeat-hit
   loop — unescapable by any input, the same class of defect as the collision
   wedge that unwedge() exists to prevent. */
G.trainT = 999; G.train = null;
const cross = G.crossings[4];
G.player.x = cross.x; G.player.y = City.railY;
G.player.vx = G.player.vy = 0; G.player.ang = -Math.PI / 2; G.player.spinT = 0;
G.bag = 3; G.needPickup = false; G.wreckCd = 0;
G.train = new Train(1, City.tracks[1]);
G.train.x = cross.x - 140;
let wrecked = false;
for (let i = 0; i < 5 * 60; i++) {
  G.update(1 / 60); G.render(ctx); Input.endFrame();
  if (G.banner === 'HIT BY TRAIN') wrecked = true;
}
ok(wrecked, 'a car parked on the rails is hit by the train');
const off = Math.abs(G.player.y - City.railY);
ok(off > 40, `the wreck threw the car clear of the corridor (${off.toFixed(0)}px off the rails)`);
ok(!carBlocked(G.player.x, G.player.y, G.player.ang),
   'and left it somewhere it can actually drive out of');
ok(G.bag === 0 && G.needPickup, 'the load is lost and the nav sends you back to the shop');

/* One crossing is thin evidence for the feature's whole safety property, so
   sweep them all — both approach headings, both train directions. Note the
   banner reset each time: G.say holds a banner for 1.6s, and a sweep that
   forgets to clear it reads the PREVIOUS case's wreck on frame one and
   reports every case after the first as a failure to move. */
let ejFail = 0, ejMin = 1e9;
for (let ci = 0; ci < G.crossings.length; ci++) {
  for (const ang of [-Math.PI / 2, Math.PI / 2]) {
    for (const dir of [1, -1]) {
      const c = G.crossings[ci];
      G.trainT = 9999; G.banner = ''; G.bannerT = 0; G.wreckCd = 0;
      G.player.x = c.x; G.player.y = City.railY; G.player.ang = ang;
      G.player.vx = G.player.vy = 0; G.player.spinT = 0;
      G.train = new Train(dir, City.tracks[dir > 0 ? 1 : 0]);
      G.train.x = dir > 0 ? c.x - 160 : c.x + 160;
      let hit = false;
      for (let i = 0; i < 3 * 60 && !hit; i++) { G.update(1 / 60); if (G.banner === 'HIT BY TRAIN') hit = true; }
      const d = Math.abs(G.player.y - City.railY);
      ejMin = Math.min(ejMin, d);
      if (!hit || d <= 40 || City.isSolid(G.player.x, G.player.y)) ejFail++;
      G.train = null;
    }
  }
}
ok(ejFail === 0,
   `all ${G.crossings.length * 4} wreck cases threw the car clear and unstuck (worst ${ejMin}px off the rails)`);

/* the cruiser is not exempt — beat the train across and the pursuit eats it */
G.trainT = 9999; G.train = null; G.wreckCd = 0; G.banner = '';
/* Park the player well clear. A cop that CATCHES you also despawns and zeroes
   the heat, via the ticket path — so a lazy `cop === null` here passes with no
   train involved at all, which is exactly what it did before the banner check
   was added. Assert the train did it, not merely that the cop went away. */
G.player.x = cross.x; G.player.y = City.railY + 400;
G.heat = 0; G.cop = null;
for (let i = 0; i < 40; i++) G.bumpHeat(5);
ok(G.cop !== null, 'a cop is on you');
G.cop.x = cross.x; G.cop.y = City.tracks[1];
/* Straddle the crossing rather than approach it. A cop accelerates away from
   where it is put — 285px/s² is 45px in half a second — so an approaching
   train can legitimately miss one placed by hand, and that flake would read as
   the rule not working. */
G.banner = '';
G.train = new Train(1, City.tracks[1]);
G.train.x = cross.x + 120;
for (let i = 0; i < 90 && G.cop; i++) { G.update(1 / 60); G.render(ctx); Input.endFrame(); }
ok(G.cop === null && G.banner === 'THE TRAIN GOT THEM',
   `the train took the cruiser (cop ${G.cop ? 'still there' : 'gone'}, banner "${G.banner}")`);
ok(G.heat === 0, `and the heat reset (${G.heat})`);
G.train = null;

/* a wrecked cop must not respawn under the train */
ok(G.onRail(cross.x, City.railY) && !G.onRail(cross.x, City.railY + 200),
   'the corridor is a refused spawn, the street beyond it is not');
G.player.x = cross.x; G.player.y = City.railY + 120;
let onTracks = 0;
for (let i = 0; i < 200; i++) { G.cop = null; G.spawnCop(); if (G.cop && G.onRail(G.cop.x, G.cop.y)) onTracks++; }
ok(onTracks === 0, `none of 200 cop spawns landed in the corridor (${onTracks})`);
G.cop = null; G.heat = 0;

/* running a closed gate is allowed, and it is what costs you */
G.crossings.forEach((c) => { c.t = 1; c.down = true; });
G.player.x = cross.x; G.player.y = City.railY - 60;
G.railSide = -1;
G.player.y = City.railY + 60;
G.railCheck();
ok(G.heat >= 20, `running a closed crossing adds heat (${G.heat})`);
G.heat = 0; G.cop = null; G.crossings.forEach((c) => { c.t = 0; c.down = false; });

console.log('\n— heat —');
G.heat = 0; G.cop = null;
for (let i = 0; i < 40; i++) G.bumpHeat(5);
ok(G.cop !== null, 'cop dispatched at max heat');
for (let i = 0; i < 600; i++) G.update(1 / 60);
ok(finite(G.cop ? G.cop.x : 0), 'cop pursuit stable');
/* Until the — rail — section above existed, every section after — attract —
   left the game in `title`, where update() returns before the cop is ever
   touched — so this section was asserting against a cruiser that never moved.
   — rail — calls startShift(), so the pursuit is now genuinely simulated.
   Assert the state, or that quietly rots the next time a section is reordered.

   NOT asserted: that the cruiser covered ground. It wedges about a third of
   the time — measured 19 of 60 dispatches — because Cop.update never calls
   unwedge() the way Player.update does. That is pre-existing and unrelated to
   the railway (17 of those 19 jammed 166-272px away from the corridor, in
   ordinary city geometry), so it is on the ROADMAP punch list rather than
   papered over with a looser bound here. */
ok(G.state === 'play' || G.state === 'results', `the pursuit ran in a live state (${G.state})`);

console.log(`\n${fails === 0 ? 'PASS' : 'FAIL (' + fails + ')'}  —  ${ops.toLocaleString()} draw calls exercised`);
process.exit(fails ? 1 : 0);
