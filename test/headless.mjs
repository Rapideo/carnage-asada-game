/* Runs the real game modules against a stub canvas so every code path
   executes without a browser. Catches ReferenceErrors, NaN drift,
   bad indices and dead loops that a syntax check cannot. */
import { sandbox, deferred, makeCtx, makeCanvas, opCount, runScript } from './sandbox.mjs';


const { G, City, Nav, Art, Input, Demo, textW, money, MAXTHROW, VW, VH, WW, WH,
        Player, Cop, Train, Crossing, carBlocked, ATTRACT, TURN_NAMES, Scores, SCORE_MAX, INI_LEN, INI_ALPHA, ENTRY_TIMEOUT, TS, GW, HSTREETS, VSTREETS, S_ROAD, S_WALK, S_GRASS, S_EDGE, SURF_MUL, classify, SEG0, PITCH, GH, BORDER } = sandbox.__x;
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
/* The attract demo plays a RANDOM level, and a level in another era
   regenerates the city on that era's map. Every section below that inspects
   City expects Map 1, so pin the demo to level 1 here; — kitchen demo —
   exercises the other kind explicitly. */
G.demoPin = 1;
G.weatherPin = 'season';   // weather rolls per play; the driving below was tuned in the season's default
G.setLevel(G.levelN);      // ...and boot has already rolled once, before the pin
ok(City.houses.length > 100, `addressed houses: ${City.houses.length}`);

/* Every car's shadow is baked through rotFrames like the car itself. It was
   three copies of a bare axis-aligned fillRect, so it never turned with the
   car it belonged to — at 45 degrees about a quarter of it lay outside the
   body while the nose and tail cast none. Nothing here can see pixels (every
   draw is a no-op stub), so this asserts the shape of the fix: a rotation set
   of the same length and frame size as the car it sits under. */
ok(Array.isArray(Art.carShadow) && Art.carShadow.length === Art.player.length,
   `car shadow is a rotation set, not a fixed rect (${Art.carShadow.length} frames)`);
ok(Art.carShadow.size === Art.player.size,
   `car shadow frames match the car sprite (${Art.carShadow.size}px)`);
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
/* the version tag: right-aligned in the bottom-right corner of the title and
   pause screens, clear of the title's PRESS ENTER prompt (x 120-264 at y 184) */
{
  const REL = sandbox.__k.RELEASE, tag = 'V' + REL.version;
  ok(/^[0-9]+[.][0-9]+[.][0-9]+$/.test(REL.version) && /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(REL.date), `the release is a version and a date (${REL.version}, ${REL.date})`);
  ok(VW - 4 - textW(tag, 1) > (VW + textW('PRESS ENTER TO CLOCK IN', 1)) / 2 && VH - 11 + 7 <= VH - 2, `the version tag ${tag} fits the corner`);
}
ok(cardFits('HEAD BACK TO THE SHOP'), 'the empty-bag restock line fits the order card');

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
ok(navLeftFits('STOP TO LOAD'), 'the arriving-at-the-shop line fits the nav panel');
ok(navLeftFits('IN 999 M'), 'the distance line fits the nav panel');
ok(navMidFits('RETURN TO ROADWAY', 1), `the off-road line fits the nav panel (${textW('RETURN TO ROADWAY', 1)}px in ${NAV_W})`);
ok(navMidFits('RECALCULATING.', 1), 'the recalculating line fits the nav panel');
ok(navMidFits('STANDBY', 2), 'STANDBY fits the nav panel at scale 2');
ok(NAV_Y0 + NAV_H <= VH, `the nav panel fits above the bottom edge (${NAV_Y0 + NAV_H} <= ${VH})`);

/* the bag label sits at VW-76 and runs right; DELIVERIES is 12px wider than
   the TACO BAG it replaced */
ok(VW - 76 + textW('DELIVERIES', 1) <= VW, `the deliveries label fits the screen (${textW('DELIVERIES', 1)}px from x=${VW - 76})`);

/* attract timings are authored in content/attract.json; — attract — asserts
   the game reads them live from ATTRACT rather than from a stale constant */
ok(ATTRACT.title.wordmarkHold >= 0 && ATTRACT.title.wordmarkHold <= ATTRACT.title.seconds - 2,
   `the wordmark lands with time to spare (hold ${ATTRACT.title.wordmarkHold}s of ${ATTRACT.title.seconds}s)`);

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

/* A cruiser drives into geometry exactly the way a player does, but Cop.update
   never called unwedge(), so a wedged one was stuck for good: 0 of these 12
   sites were escapable, every one frozen at exactly 0px. Same defect as the
   player's, same fix.

   Measure PATH, not net displacement. The cop's obstacle probe is crude and it
   can legitimately circle a tight corner — one site drives 118px to end 38px
   from where it started. Net displacement calls that stuck; it is not. This is
   the same wrong-measure trap already recorded for the demo driver. */
{
  const keepP = { x: G.player.x, y: G.player.y };
  const sites = wedgeSites.slice(0, 12);
  const report = [];
  let ok2 = 0;
  for (const site of sites) {
    G.player.x = Math.min(WW - 40, Math.max(40, site.x + 260));
    G.player.y = Math.min(WH - 40, Math.max(40, site.y + 260));
    const c = new Cop(site.x, site.y, -Math.PI / 2);
    /* ...and measure the END STATE over half a second, not at one instant.
       carBlocked at exactly t=6s calls a cruiser that has driven 457px "still
       blocked" because it happens to be brushing a kerb as the clock stops.
       A car that is actually wedged is blocked every frame; one that is
       driving is not. This is the third time this assertion has been caught
       measuring an instant where it meant a state. */
    let path = 0, px2 = c.x, py2 = c.y, blockedRun = 0;
    for (let i = 0; i < 6 * 60; i++) {
      c.update(1 / 60, G); path += Math.hypot(c.x - px2, c.y - py2); px2 = c.x; py2 = c.y;
      if (i >= 6 * 60 - 30) blockedRun += carBlocked(c.x, c.y, c.ang) ? 1 : 0;
    }
    const stillIn = blockedRun >= 30;
    if (path > 30 && !stillIn) ok2++; else report.push(`${Math.round(path)}px${stillIn ? ' STILL BLOCKED' : ''}`);
  }
  G.player.x = keepP.x; G.player.y = keepP.y;
  ok(ok2 === sites.length,
     `every wedged cop depenetrated and drove away (${ok2}/${sites.length}${report.length ? ': ' + report.join(', ') : ''})`);
}

console.log('\n— guidance —');
/* RECALCULATING is for a new route, not the same one further along: passing
   a junction drops it off the front, swinging round a corner can put it back.
   Flashing for both had the panel saying it 28% of a shift (playtest 2026-11-07). */
ok(Nav.continues('1,1|1,2|1,3', '1,2|1,3') && Nav.continues('1,2|1,3', '1,1|1,2|1,3'),
  'a route with its passed junction dropped (or put back) is not a recalculation');
ok(!Nav.continues('1,1|1,2|1,3', '1,1|2,1|2,2') && !Nav.continues('11,2|1,3', '1,2|1,3'),
  'a genuinely different route is, and node keys match whole, not by digit');
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

/* The head of the route must be a junction the car is heading TOWARD. Nav
   used to seed the search from the NEAREST junction and patch it up by
   dropping the head node when the car was closer to the second node than the
   two nodes are to each other — which fires 12px past on a straight, but never
   on a TURN, because there the second node is perpendicular and a full PITCH
   away wherever the car is. The panel then described somewhere behind you: the
   distance counted UP as you drove and the instruction named the turn you had
   just missed. Measured before the fix, driving straight through such a
   junction: 91 of 151 frames had the head node behind the car.

   Sampled just PAST every junction, on both axes and both directions, which is
   exactly where the old seed failed and where 250-routes-are-contiguous could
   never look. */
let behindHead = 0, sampled = 0, worstBehind = 0;
for (let nx = 0; nx <= 8; nx++) {
  for (let ny = 0; ny <= 8; ny++) {
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const h = City.houses[(Math.random() * City.houses.length) | 0];
      // 30px beyond the junction, still travelling the same way
      const car = { x: City.nodeX(nx) + dx * 30, y: City.nodeY(ny) + dy * 30,
                    ang: Math.atan2(dy, dx), vx: dx * 90, vy: dy * 90 };
      if (car.x < 40 || car.y < 40 || car.x > WW - 40 || car.y > WH - 40) continue;
      Nav.goal = { x: h.curb.x, y: h.curb.y, node: h.node, label: 'x' };
      Nav.recompute(car);
      if (!Nav.route.length) continue;
      sampled++;
      const r = Nav.route[0];
      const back = -((City.nodeX(r[0]) - car.x) * Math.cos(car.ang)
                   + (City.nodeY(r[1]) - car.y) * Math.sin(car.ang));
      // the goal's own junction is allowed to be behind — you have arrived
      const atGoal = r[0] === h.node[0] && r[1] === h.node[1];
      if (back > 8 && !atGoal) { behindHead++; worstBehind = Math.max(worstBehind, back); }
    }
  }
}
Nav.clear();
ok(behindHead === 0,
   `route head is always a junction ahead (${behindHead} of ${sampled} behind` +
   (behindHead ? `, worst ${worstBehind.toFixed(0)}px` : '') + ')');

/* CONTINUE counts down to the next real turn, not to the junction you drive
   straight through: that read "CONTINUE IN 0 M" (playtest 2026-11-07). Same
   samples; whenever the panel says CONTINUE with route left, its distance must
   reach past the head junction. */
let shortContinue = 0, continues = 0;
for (let nx = 0; nx <= 8; nx++) for (let ny = 0; ny <= 8; ny++) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
  const h = City.houses[(Math.random() * City.houses.length) | 0];
  const car = { x: City.nodeX(nx) + dx * 30, y: City.nodeY(ny) + dy * 30, ang: Math.atan2(dy, dx), vx: dx * 90, vy: dy * 90 };
  if (car.x < 40 || car.y < 40 || car.x > WW - 40 || car.y > WH - 40) continue;
  Nav.setGoal({ x: h.curb.x, y: h.curb.y, node: h.node, label: 'x' });
  Nav.update(1 / 60, car);
  if (Nav.arriving || Nav.turn !== 0 || Nav.route.length < 2) continue;
  continues++;
  const r = Nav.route[0], head = Math.hypot(City.nodeX(r[0]) - car.x, City.nodeY(r[1]) - car.y);
  if (Nav.dist <= head + 1) shortContinue++;
}
Nav.clear();
ok(continues > 0 && shortContinue === 0, `CONTINUE counts to the next turn, past the junction ahead (${shortContinue} of ${continues} short)`);

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
  if (G.state === 'over' || G.state === 'clear') { delivered0 = G.stats.delivered; G.startShift(); }
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

/* the perfect-delivery bonus is difficulty content (G.diff.perfectBonus), not a constant */
{
  const keep = G.diff.perfectBonus, z = { x: 0, y: 0 }, pay = (perfect) => {
    G.combo = 1; G.order.tip = 1000; const e = G.earned; G.complete(perfect, z); return G.earned - e;
  };
  ok(Number.isInteger(keep) && keep > 0, `the difficulty carries a perfect bonus (${keep})`);
  ok(pay(true) - pay(false) === keep, 'a perfect delivery pays perfectBonus more than an imperfect one');
  G.diff.perfectBonus = 777;
  ok(pay(true) - pay(false) === 777, 'and retuning the difficulty retunes the payout');
  G.diff.perfectBonus = keep;
}

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
/* the rotation reads its durations from ATTRACT each time a screen starts, not
   from consts captured at load, so Service Mode's edits reach it live */
{
  const keep = JSON.stringify(ATTRACT);
  ATTRACT.title.seconds = 7; ATTRACT.winners.seconds = 6; ATTRACT.scores.seconds = 5; ATTRACT.demo.seconds = 9;
  ATTRACT.title.wordmarkHold = 3;
  G.toTitle(); const tT = G.attractT;
  G.toWinners(); const tW = G.attractT;
  G.toScores(false); const tS = G.attractT;
  G.toDemo(); const tD = G.attractT, sh = G.shift;
  ok(tT === 7 && tW === 6 && tS === 5 && tD === 9 && sh >= 9 + 30,
     `the rotation reads its durations from ATTRACT (${tT}/${tW}/${tS}/${tD}s, demo clock ${sh | 0}s)`);
  G.toTitle();
  for (let i = 0; i < 4.5 * 60; i++) { G.update(1 / 60); Input.endFrame(); }
  const early = G.titleSlam;
  for (let i = 0; i < 1 * 60; i++) { G.update(1 / 60); Input.endFrame(); }
  ok(!early && G.titleSlam, 'the wordmark lands at ATTRACT.title.wordmarkHold + the grow (a 3s hold lands at 5s, not 3s)');
  const o = JSON.parse(keep);
  for (const k of Object.keys(o)) Object.assign(ATTRACT[k], o[k]);
  ok(JSON.stringify(ATTRACT) === keep, 'ATTRACT restored');
}
G.toTitle();
ok(G.state === 'title', 'attract starts on the title');
step(ATTRACT.title.seconds + 0.5);
ok(G.state === 'winners', `title holds ${ATTRACT.title.seconds}s then shows the winners card`);
step(ATTRACT.winners.seconds + 0.5);
ok(G.state === 'scores', `winners holds ${ATTRACT.winners.seconds}s then shows the board`);
step(ATTRACT.scores.seconds + 0.5);
ok(G.state === 'demo', `the board holds ${ATTRACT.scores.seconds}s then starts the demo`);

/* the demo must actually drive — a car wedged against a wall would still
   satisfy "no NaN", so track distance covered and watch for drift */
let far = 0, bad = 0, moved = 0, stall = 0, worstStall = 0;
let prev = { x: G.player.x, y: G.player.y };
/* ...and it must drive like a driver, not merely move. The demo follows a
   polyline of lane centres; these track whether it actually stays on one.
   All three are fractions over the whole run rather than any single frame,
   because a demo that clips one kerb is fine and one that lives on the
   pavement is not. */
let frames = 0, offTarmac = 0, behind = 0, onTop = 0, laneSum = 0, laneN = 0;
// runs to 5s short of whatever the content file says, rather than a
// hard-coded 85 — the durations are authored in content/attract.json and
// retuning them there should not break the suite
const DEMO_RUN = ATTRACT.demo.seconds - 5;
for (let i = 0; i < DEMO_RUN * 60; i++) {
  G.update(1 / 60); G.render(ctx); Input.endFrame();
  const p = G.player;
  if (!finite(p.x) || !finite(p.y) || !finite(p.ang) || !finite(p.vx) || !finite(p.vy)) { bad++; break; }
  if (p.x < 0 || p.x > WW || p.y < 0 || p.y > WH) { far++; break; }
  const d = Math.hypot(p.x - prev.x, p.y - prev.y);
  moved += d;
  if (d < 0.2) { stall += 1 / 60; worstStall = Math.max(worstStall, stall); } else stall = 0;
  prev = { x: p.x, y: p.y };

  frames++;
  const surf = City.surfaceAt(p.x, p.y);
  if (surf === S_WALK || surf === S_GRASS) offTarmac++;
  const w = Demo.path && Demo.path.length ? Demo.path[0] : null;
  if (w) {
    const dx = w.x - p.x, dy = w.y - p.y;
    // a steering target behind the nose, or one the car is sitting on, is how
    // the old driver spent a third of its life; atan2 of a near-zero vector
    // saturates the wheel
    if (dx * Math.cos(p.ang) + dy * Math.sin(p.ang) < 0) behind++;
    if (Math.hypot(dx, dy) < 24) onTop++;
  }
  // distance from the centre of the lane the car belongs in. Roads are 32px
  // wide and Traffic.laneFixed puts the two lane centres at +8 and +24, so a
  // car driven properly sits near zero. Straights only: a junction has no lane
  if (classify((p.x / TS) | 0, (p.y / TS) | 0) === 1 && Math.hypot(p.vx, p.vy) > 12) {
    const ox = p.x - SEG0 - Math.floor((p.x - SEG0) / PITCH) * PITCH;
    const oy = p.y - SEG0 - Math.floor((p.y - SEG0) / PITCH) * PITCH;
    const across = ox < 32 ? ox : oy;
    if (across < 32) {
      let dir = Math.round(Math.atan2(p.vy, p.vx) / (Math.PI / 2)) % 4; if (dir < 0) dir += 4;
      laneSum += Math.abs(across - ((dir === 0 || dir === 3) ? 24 : 8)); laneN++;
    }
  }
}
ok(bad === 0, `no NaN in the demo driver over ${DEMO_RUN}s`);
ok(far === 0, 'demo car stayed inside the world');
ok(moved > 28 * DEMO_RUN, `demo car actually drove (${Math.round(moved)}px in ${DEMO_RUN}s)`);
// net displacement is NOT a useful check here — the demo takes orders all over
// the map and can legitimately end up near where it started. What must hold is
// that it never wedges permanently.
// 12s, not 8: a legitimate wait at a closed crossing is roughly 2s of warning
// plus 1.5s of train plus the raise, and the demo can meet one mid-approach.
// The bound still has to catch a wedge. What it must NOT become is a net
// displacement check — that fails on working code, because the demo takes
// orders all over the map and can legitimately finish near where it started.
ok(worstStall < 12, `demo never stalled for long (worst ${worstStall.toFixed(1)}s)`);

/* — how well it drives, not just that it does —
   The driver follows a polyline of lane centres built from Nav.route via
   Traffic.laneFixed. Before it did, it steered straight at the next
   intersection CENTRE, which cut every corner and rode the crown of the road;
   measured over 20 minutes, that spent 34.9% of its frames aiming at a point
   behind the car and 27.2% aiming at one under 24px away, and sat 10.0px off
   its lane. These bounds are set well clear of the numbers the lane follower
   actually turns in, because order selection uses Math.random and a short
   sample is noisy — they are here to catch a regression to the old
   behaviour, not to pin the tuning. */
const pctOff = (offTarmac / frames) * 100;
const pctOnTop = (onTop / frames) * 100;
const laneOff = laneSum / Math.max(1, laneN);
// Reported, NOT asserted. Off-tarmac fraction over one demo is too noisy:
// a healthy build ranges 16-36%, because which orders come up decides how much
// cornering the sample contains. It was briefly an ok(< 34) and flaked about
// one run in six, which by this file's own rule is a harness bug rather than
// noise to live with. The two assertions below discriminate the same
// regression and hold steady, so the number is kept for whoever is debugging
// and the guarding is left to them.
console.log(`  --    demo off the tarmac ${pctOff.toFixed(1)}% of the time (not asserted: 16-36% is normal)`);
// These two are the ones that actually discriminate. Old driver: 27.2% and
// 10.0px. Lane follower: 3-5% and 6-7px. Nothing in between is reachable by
// accident — a regression to steering at intersection centres moves both at
// once, because the centre of a junction is neither a lane nor nearby.
ok(pctOnTop < 14, `demo rarely steers at a point on top of itself (${pctOnTop.toFixed(1)}%)`);
ok(laneOff < 9, `demo keeps its lane (${laneOff.toFixed(1)}px off centre, road is 32px wide)`);
// NOT asserted, deliberately: "the steering target is ahead of the nose". It
// is the obvious check and it is wrong for this design — the corner the car is
// about to turn ONTO sits square to its heading, so its dot product with the
// nose is negative while the car is doing exactly the right thing. Retiring
// waypoints on that test is the bug this driver was written to fix; asserting
// it would demand the bug back. `behind` is tracked above for diagnosis only.
void behind;

ok(G.state === 'demo', 'demo still running before its timer expires');
step(6);
ok(G.state === 'title', `demo returns to the title after ${ATTRACT.demo.seconds}s`);

/* any key from winners or demo goes back to the title */
G.toWinners();
Input.anyKey = true;
G.update(1 / 60);
ok(G.state === 'title', 'a keypress on the winners card returns to the title');
Input.anyKey = false; Input.endFrame();

/* The city is a real place — downtown Hays, KS — authored in content/hays.json.
   These assertions are pure reads, so they are safe anywhere in the sequence. */
/* The border is the edge of the playable world and must stay closed. It used
   to be sea; it is prairie now, and the railway runs out through it east and
   west - which is the one place the ring could be opened by accident, because
   drawEdge paints tiles there after the block generators have run. */
{
  let open = 0, checked = 0;
  for (let ty = 0; ty < GH; ty++) for (let tx = 0; tx < GW; tx++) {
    if (tx >= BORDER && ty >= BORDER && tx < GW - BORDER && ty < GH - BORDER) continue;
    checked++;
    if (!City.solid[ty * GW + tx]) open++;
  }
  ok(open === 0, `the map border is closed all the way round (${checked} tiles, ${open} open)`);
  ok(City.surfaceAt(-40, -40) === S_EDGE, 'off the map reads as open ground, not water');
}

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

/* Apartment blocks used to be scenery: this assertion ran the other way, and
   said so, because every address came from genResidential and a second address
   path was not worth that branch. There is no second path -- addAddress serves
   all three generators -- so the flats are deliverable now, and this asserts the
   reversal at the same spot so the decision stays visible rather than merely
   disappearing. Each of the three blocks carries two street doors. */
ok(Art.apts.length > 0, `Art.apts has ${Art.apts.length} blocks of flats`);
const inLot = (h, bx, by) =>
  h.x >= (2 + bx * 12 + 3) * TS && h.x < (2 + bx * 12 + 11) * TS &&
  h.y >= (2 + by * 12 + 3) * TS && h.y < (2 + by * 12 + 11) * TS;
const aptsWithAddresses = [[0, 3], [0, 5], [4, 5]]
  .filter(([bx, by]) => City.houses.some((h) => inLot(h, bx, by)));
ok(aptsWithAddresses.length === 3,
   `every apartment block now generates delivery addresses (${aptsWithAddresses.length}/3)`);

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

console.log('\n— downtown addresses —');
/* Only `res` blocks used to generate deliverable houses, so orders concentrated
   south of the tracks and the Fort/Main retail spine -- the tightest driving in
   the game -- carried traffic and hazard but nothing to deliver to. Section 7 of
   the neighbourhood spec deferred the fix to avoid a *second* address path; the
   answer is that there is still only one, extracted out of genResidential and
   called by the downtown generators too.

   Each house carries the `kind` of the block that made it, which is what lets
   this section find the downtown ones without duplicating the zoning table. */
{
  const downtown = City.houses.filter((h) => h.kind === 'retail' || h.kind === 'apts');
  const retail = downtown.filter((h) => h.kind === 'retail');
  const apts   = downtown.filter((h) => h.kind === 'apts');

  /* 6 retail blocks x 2 store runs, 3 apts blocks x 2 buildings */
  ok(retail.length === 12, 'the six retail blocks carry 12 addresses (got ' + retail.length + ')');
  ok(apts.length === 6, 'the three apts blocks carry 6 addresses (got ' + apts.length + ')');

  const share = downtown.length / City.houses.length;
  ok(share > 0.10 && share < 0.16,
     'downtown takes a share of orders in line with its share of the map (' +
     (share * 100).toFixed(0) + '%)');

  /* the whole point of the feature: they must be reachable and winnable */
  let buried = 0, offStreet = 0, noNode = 0;
  for (const h of downtown) {
    const pcx = h.porch.x + h.porch.w / 2, pcy = h.porch.y + h.porch.h / 2;
    if (City.isSolid(pcx, pcy)) buried++;
    if (City.surfaceAt(h.curb.x, h.curb.y) !== S_ROAD) offStreet++;
    if (!h.node || h.node[0] == null || h.node[1] == null) noNode++;
  }
  ok(buried === 0, 'no downtown porch is buried in geometry (' + buried + ' buried)');
  ok(offStreet === 0, 'every downtown kerb point is on a real street (' + offStreet + ' off)');
  ok(noNode === 0, 'every downtown address resolves to a nav node (' + noNode + ' without)');

  /* addresses are the player-facing key: a duplicate makes one unwinnable */
  const seen = new Map();
  let dupes = [];
  for (const h of City.houses) {
    if (seen.has(h.addr)) dupes.push(h.addr);
    seen.set(h.addr, h);
  }
  ok(dupes.length === 0,
     'every address in the city is still unique' +
     (dupes.length ? ' (' + dupes.length + ' clash, e.g. ' + dupes[0] + ')' : ''));

  /* A north-facing porch is the one case where the building's fake wall height
     rises INTO its own delivery target: statics draw from `y - oy`, so a taller
     wall eats more of the porch below it. Residential houses have oy 9 against a
     15px porch and so show a 6px sliver, which is the convention the game
     shipped with and reads fine. Store runs have oy 14 and showed 1px -- the
     target was there, hittable, and effectively invisible. Assert the sliver
     across every north-facing address, not just downtown, so neither a new block
     kind nor a taller sprite can quietly swallow one again. */
  let thin = [];
  for (const h of City.houses) {
    if (h.dir !== 0) continue;
    const st = City.statics.find((t) => Math.abs(t.x - h.x) < 2 && Math.abs(t.y - h.y) < 2);
    if (!st) continue;
    const visible = (st.y - st.oy) - h.porch.y;
    if (visible < 6) thin.push(h.kind + ' ' + h.addr + ' (' + visible + 'px)');
  }
  ok(thin.length === 0,
     'every north-facing porch stays visible under its own wall' +
     (thin.length ? ' (' + thin.length + ' hidden, e.g. ' + thin[0] + ')' : ''));

  /* and the order card has to be able to draw them */
  let widest = '', ww = 0;
  for (const h of downtown) { const w = textW(h.addr, 1); if (w > ww) { ww = w; widest = h.addr; } }
  ok(ww <= 150, 'the longest downtown address fits the order card: "' + widest + '" (' + ww + 'px)');
}

console.log('\n— shop apron —');
/* The dock is the one place in the game the player MUST leave the road, and
   every restock trip both ends and starts here. genShop paints an apron and a
   driveway onto the ground canvas; if it does not also write S_ROAD into
   `surf`, the paint and the data disagree and the car crosses a 16px band of
   sidewalk at SURF_MUL[S_WALK] = 0.60 -- 60% of both top speed and
   acceleration -- twice per delivery. That is invisible on screen, because the
   driveway is drawn correctly; it shows up only as the car crawling off the
   dock, which reads as bad handling rather than as a bug. */
{
  const shop = City.shop;
  ok(!!shop && !!shop.dock && !!shop.curb, 'the shop has a dock and a kerb');

  /* walk the driveway from the kerb to the dock, sampling every 4px */
  const x0 = shop.curb.x, y0 = shop.curb.y, x1 = shop.dock.x, y1 = shop.dock.y;
  const steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 4);
  const offRoad = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps, sx = x0 + (x1 - x0) * t, sy = y0 + (y1 - y0) * t;
    const su = City.surfaceAt(sx, sy);
    if (su !== S_ROAD)
      offRoad.push(Math.round(sy) + ':' + (su === S_WALK ? 'WALK' : su === S_GRASS ? 'GRASS' : su));
  }
  ok(offRoad.length === 0,
     'the drive from the kerb to the dock is road the whole way' +
     (offRoad.length ? ' (' + offRoad.length + ' samples are not: ' + offRoad.slice(0, 4).join(', ') + ')' : ''));

  /* and the bay itself, across its full painted width */
  let bad = 0, tot = 0;
  for (let dx = -28; dx <= 28; dx += 4) for (let dy = -14; dy <= 14; dy += 4) {
    tot++;
    if (City.surfaceAt(shop.dock.x + dx, shop.dock.y + dy) !== S_ROAD) bad++;
  }
  ok(bad === 0, 'the whole pickup bay is road surface (' + bad + '/' + tot + ' off-road)');

  /* nothing may ever bury the one dock in the game */
  ok(!City.isSolid(shop.dock.x, shop.dock.y), 'the dock itself is not solid');
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

console.log('\n— high scores —');
/* The harness sandbox has no localStorage at all, which is most of the
   file:// case for free: Scores must fall back to the factory board without
   raising, because an unguarded read blanks the game on the exact path the
   artifact is meant to be opened by. */
ok(typeof localStorage === 'undefined', 'the sandbox has no localStorage, so the fallback path is the one under test');
const board0 = Scores.load();
ok(board0.length === SCORE_MAX, `the factory board loads ${SCORE_MAX} places (got ${board0.length})`);
ok(board0.every((e, i) => i === 0 || board0[i - 1].cents >= e.cents), 'the factory board is sorted descending');
ok(board0.every((e) => e.ini.length === INI_LEN), 'every set of initials is 3 characters');
ok(Scores.save() === false, 'saving without storage reports failure rather than throwing');

/* qualification, at the boundary rather than in the middle */
const tenth = Scores.lowest();
ok(Scores.qualifies(tenth + 1), `one cent above tenth place qualifies (${tenth + 1} > ${tenth})`);
ok(!Scores.qualifies(tenth), 'matching tenth place does NOT qualify');
ok(!Scores.qualifies(tenth - 1), 'one cent below tenth place does not qualify');
ok(!Scores.qualifies(0), 'a shift that took nothing never places');

/* insertion keeps the invariants */
const idx = Scores.insert('ZZZ', tenth + 1);
ok(idx === SCORE_MAX - 1, `a barely-qualifying score lands last (index ${idx})`);
ok(Scores.board.length === SCORE_MAX, `the board is still capped at ${SCORE_MAX}`);
ok(Scores.board[SCORE_MAX - 1].ini === 'ZZZ', 'and it is actually on the board');
const topIdx = Scores.insert('AAA', Scores.board[0].cents + 100);
ok(topIdx === 0, 'a new best lands first');
ok(Scores.board.every((e, i) => i === 0 || Scores.board[i - 1].cents >= e.cents), 'the board stays sorted after inserts');
ok(Scores.board.length === SCORE_MAX, 'and stays capped');

/* ties do not displace the incumbent */
Scores.load();
const second = Scores.board[1].cents, wasSecond = Scores.board[1].ini;
Scores.insert('TIE', second);
ok(Scores.board[1].ini === wasSecond && Scores.board[2].ini === 'TIE',
   'a tied score goes below whoever got there first');

/* a corrupt stored board is discarded, not repaired */
Scores.load();
ok(Scores.valid([{ ini: 'ABC', cents: 10 }]), 'a well-formed board validates');
ok(!Scores.valid([{ ini: 'TOOLONG', cents: 10 }]), 'bad initials are rejected');
ok(!Scores.valid([{ ini: 'ABC', cents: 1.5 }]), 'non-integer cents are rejected');
ok(!Scores.valid('not a board'), 'a non-array is rejected');
ok(!Scores.valid([]), 'an empty array is rejected');

/* the board is an attract screen, alternating with the winners card */
Input.down = Object.create(null); Input.anyKey = false; Input.mhit = false; Input.hasMouse = false;
/* attract.md: four screens in a fixed order, the board as its own slot */
G.toTitle();
const seq = [G.state];
for (let i = 0; i < (ATTRACT.title.seconds + ATTRACT.winners.seconds + ATTRACT.scores.seconds + 1.5) * 60; i++) {
  G.update(1 / 60); Input.endFrame();
  if (seq[seq.length - 1] !== G.state) seq.push(G.state);
}
ok(seq.join(' -> ') === 'title -> winners -> scores -> demo',
   `the attract loop runs the four authored screens: ${seq.join(' -> ')}`);
G.toTitle();

/* the widest row the board can ever draw must fit the screen */
const RANK_X = 208, WIDEST_RANK = 'LEGEND OF THE ASADA';
ok(RANK_X + textW(WIDEST_RANK, 1) <= VW - 8,
   `the widest rank title fits the board row (ends at ${RANK_X + textW(WIDEST_RANK, 1)} of ${VW})`);
ok(G.rank.call({ earned: 999999 }) === WIDEST_RANK, 'and it really is the widest title rank() can return');

/* the board renders in both of its two lives without throwing */
G.toScores(false);
ok(G.state === 'scores' && !G.scoresFromShift, 'the attract board is on a timer');
G.render(ctx);
G.toScores(true); G.scoreIdx = 3;
ok(G.scoresFromShift, 'the post-shift board waits for input');
G.render(ctx);

/* the initials wheel: arrows only, by design — the one input scheme the whole
   game uses, and the only one a gamepad maps to */
Scores.load();
G.earned = Scores.lowest() + 500;
G.toEntry();
ok(G.state === 'entry', 'the wheel opens');
ok(G.entryIni.length === INI_LEN && G.entryIni.every((v) => v === 0), 'all three slots start at A');
const press = (code) => { Input.hit[code] = true; G.update(1 / 60); Input.endFrame(); };
press('ArrowUp');                                   // A -> B
ok(INI_ALPHA[G.entryIni[0]] === 'B', `up cycles forward (${INI_ALPHA[G.entryIni[0]]})`);
press('ArrowDown'); press('ArrowDown');             // B -> A -> wrap to space
ok(INI_ALPHA[G.entryIni[0]] === ' ', 'down from A wraps to the end of the alphabet');
press('ArrowUp');                                   // back to A
press('ArrowLeft');
ok(G.entrySlot === 0, 'left on the first slot does nothing');
press('ArrowRight'); press('ArrowUp');              // slot 1 -> B
press('ArrowRight'); press('ArrowUp'); press('ArrowUp');   // slot 2 -> C
ok(G.entrySlot === INI_LEN - 1, 'right walks to the last slot');
press('ArrowRight');
ok(G.entrySlot === INI_LEN - 1, 'right on the last slot does nothing');
const spelled = G.entryIni.map((i) => INI_ALPHA[i]).join('');
ok(spelled === 'ABC', `the wheel spells what was driven into it (${spelled})`);
press('Enter');
ok(G.state === 'scores' && Scores.board.some((e) => e.ini === 'ABC'),
   'enter on the last slot commits and shows the board');
ok(G.scoreIdx >= 0, `and the board knows which row to highlight (${G.scoreIdx})`);

/* an abandoned cabinet must not block the attract loop forever */
Scores.load();
G.earned = Scores.lowest() + 700;
G.toEntry();
ok(G.entryT > 0, 'the wheel arms an idle timeout');
for (let i = 0; i < (ENTRY_TIMEOUT + 1) * 60 && G.state === 'entry'; i++) { G.update(1 / 60); Input.endFrame(); }
ok(G.state === 'scores', 'and it confirms itself rather than hanging');
ok(Scores.board.some((e) => e.ini === 'AAA'), 'defaulting to AAA rather than blanks');

/* the timeout is idle-based: driving the wheel keeps it alive */
Scores.load();
G.earned = Scores.lowest() + 900;
G.toEntry();
for (let i = 0; i < (ENTRY_TIMEOUT - 2) * 60; i++) { G.update(1 / 60); Input.endFrame(); }
press('ArrowUp');
ok(G.state === 'entry' && G.entryT > ENTRY_TIMEOUT - 1,
   `a keypress rearms the idle timer (${G.entryT.toFixed(1)}s left)`);
G.render(ctx);
G.commitEntry();

/* GDD II.F: at 0:00, GAME OVER; initials FIRST if the run places, then
   CONTINUE? with a 10s countdown. A continue restarts the level you died on
   as a new run at $0.00. */
const waitCard = () => { for (let i = 0; i < 90; i++) { G.update(1 / 60); Input.endFrame(); } };
Scores.load();
Input.down = Object.create(null);
G.startShift();
G.earned = Scores.lowest() + 1000;
G.shift = 0.01;
for (let i = 0; i < 5; i++) { G.update(1 / 60); Input.endFrame(); }
ok(G.state === 'over', 'running out the clock is GAME OVER');
ok(G.placed === true, 'and knows the run placed');
G.render(ctx);
waitCard();
Input.hit['Enter'] = true; G.update(1 / 60); Input.endFrame();
ok(G.state === 'entry', 'enter from a placing game over opens the wheel first');
G.commitEntry();
ok(G.state === 'cont', 'and signing it goes on to CONTINUE?');
G.render(ctx);
const diedOn = G.levelN;
Input.hit['Enter'] = true; G.update(1 / 60); Input.endFrame();
ok(G.state === 'card' && G.levelN === diedOn && G.earned === 0,
   `a continue restarts level ${diedOn} as a new run at $0.00 (${G.state}, ${G.earned})`);

Scores.load();
G.startShift();
G.earned = 1;                       // beats nothing on a full board
G.shift = 0.01;
for (let i = 0; i < 5; i++) { G.update(1 / 60); Input.endFrame(); }
ok(G.placed === false, 'a non-placing run knows it did not place');
G.render(ctx);                      // the BEAT $x line draws without throwing
waitCard();
Input.hit['Enter'] = true; G.update(1 / 60); Input.endFrame();
ok(G.state === 'cont', 'and goes straight to CONTINUE?');
for (let i = 0; i < 11 * 60; i++) { G.update(1 / 60); Input.endFrame(); }
ok(G.state === 'title', 'an unanswered CONTINUE? returns to attract after 10s');

/* the results screen names the target, and it has to fit */
const boardTarget = 'BEAT ' + money(Scores.lowest()) + ' TO MAKE THE BOARD';
ok(textW(boardTarget, 1) <= VW - 16, `the board target line fits: "${boardTarget}" (${textW(boardTarget, 1)}px)`);
ok(textW('NEW HIGH SCORE - ENTER TO SIGN', 1) <= VW - 16, 'the placing prompt fits');

/* the demo still never posts a score, however well it drives */
G.toDemo();
G.earned = 999999;
G.shift = 0.01;
for (let i = 0; i < 5; i++) { G.update(1 / 60); Input.endFrame(); }
ok(G.state === 'title', 'a demo that outlasts the clock returns to the title');
ok(!Scores.board.some((e) => e.cents === 999999), 'and never reaches the board');

/* Hand — heat — below a LIVE game. The sections share one mutable game and run
   in order, and — heat — asserts the state it ran in precisely so this cannot
   rot: leaving the title here silently downgrades it to a pursuit that never
   moves, which is what it used to be before — rail — existed. */
Input.down = Object.create(null);
G.startShift();

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
ok(G.state === 'play' || G.state === 'over', `the pursuit ran in a live state (${G.state})`);

/* ================================================================
   THE FULL GAME -- 2026-10-25
   ================================================================ */
const KX = sandbox.__k;

console.log('\n— run structure —');
Input.down = Object.create(null);
const LV = KX.LEVELS;
ok(LV.length === 20, `twenty levels (${LV.length})`);
ok(LV.every((l, i) => l.type === (i % 2 ? 'kitchen' : 'delivery')), 'the shifts alternate, delivery first');
G.startRun(1);
ok(G.state === 'card' && G.levelN === 1, 'a run opens on the level 1 card');
G.render(ctx);
for (let i = 0; i < 40; i++) { G.update(1 / 60); Input.endFrame(); }
Input.hit['Enter'] = true; G.update(1 / 60); Input.endFrame();
ok(G.state === 'play', 'enter on a delivery card clocks in');
ok(G.shift === G.diff.start, `the clock starts at the difficulty's ${G.diff.start}s, with no per-delivery time`);
const t0Shift = G.shift;
for (let i = 0; i < 2; i++) G.onComplete();
ok(G.shift === t0Shift && G.extUsed === 0, 'two deliveries earn nothing on the clock');
G.onComplete();
ok(G.extUsed === 1 && Math.abs(G.shift - (t0Shift + G.diff.extend)) < 1e-6, `the third earns +${G.diff.extend}s`);
for (let i = 3; i < G.diff.target - 1; i++) G.onComplete();
ok(G.state === 'play' && G.extUsed === G.diff.maxExt - 1, `one short of target: still playing, ${G.extUsed} extensions`);
G.onComplete();
ok(G.state === 'clear', `the ${G.diff.target}th completion clears the level`);
G.render(ctx);
for (let i = 0; i < 70; i++) { G.update(1 / 60); Input.endFrame(); }
Input.hit['Enter'] = true; G.update(1 / 60); Input.endFrame();
ok(G.state === 'card' && G.levelN === 2 && G.stage === 'kitchen', 'level 2 is the kitchen');
G.render(ctx);

/* every level card, every era's map, every season, draws without throwing */
let cardsOk = 0;
for (let n = 1; n <= 20; n++) { G.toCard(n); G.render(ctx); for (let i = 0; i < 3; i++) { G.update(1 / 60); Input.endFrame(); } cardsOk++; }
ok(cardsOk === 20, 'all twenty level cards render');

/* weather: rolled per delivery level, within its season; the kitchen keeps the
   default. Every weather's card title must clear LEVEL n on the 364px card. */
const pinW = G.weatherPin; G.weatherPin = null;
const seen = { summer: new Set(), winter: new Set(), kitchen: new Set() };
let titleTooWide = 0, rainDraws = true;
for (let k = 0; k < 40; k++) for (const n of [1, 2, 3, 13]) {
  G.toCard(n);
  seen[G.stage === 'kitchen' ? 'kitchen' : G.winter ? 'winter' : 'summer'].add(G.weather);
  if (textW('LEVEL ' + n, 2) + 12 + textW(G.levelTitle(), 2) > 352 - 12) titleTooWide++;
  if (G.weather === 'rainy' && k < 3) { G.state = 'play'; G.stage = 'delivery'; try { G.update(1 / 60); G.render(ctx); } catch (e) { rainDraws = false; } G.toCard(n); }
}
/* the odds: winter mostly snowy, summer an even chance (owner ruling, 2026-11-07) */
const wasWinter = G.winter, odds = {};
for (const w of [false, true]) { G.winter = w; let alt = 0; for (let i = 0; i < 4000; i++) if (G.rollWeather() !== (w ? 'snowy' : 'sunny')) alt++; odds[w ? 'winter' : 'summer'] = alt / 4000; }
G.winter = wasWinter;
G.weatherPin = pinW; G.toCard(1);
ok(odds.winter > 0.14 && odds.winter < 0.26, `winter is mostly snowy (sunny ${(odds.winter * 100).toFixed(1)}%)`);
ok(odds.summer > 0.44 && odds.summer < 0.56, `summer is an even chance of rain (rainy ${(odds.summer * 100).toFixed(1)}%)`);
ok(seen.summer.has('sunny') && seen.summer.has('rainy') && seen.summer.size === 2, `summer rolls sunny or rainy (${[...seen.summer]})`);
ok(seen.winter.has('snowy') && seen.winter.has('sunny') && seen.winter.size === 2, `winter rolls snowy or sunny (${[...seen.winter]})`);
ok(seen.kitchen.size === 1 && !seen.kitchen.has('rainy'), `a kitchen level keeps its season's default (${[...seen.kitchen]})`);
ok(titleTooWide === 0, 'every weather\'s level-card title fits beside LEVEL n');
ok(rainDraws, 'a rainy street updates and draws without throwing');
ok(City.houses.length > 80, `the 1990s map has addresses (${City.houses.length})`);

console.log('\n— kitchen —');
G.toCard(2);
for (let i = 0; i < 40; i++) { G.update(1 / 60); Input.endFrame(); }
Input.hit['Enter'] = true; G.update(1 / 60); Input.endFrame();
ok(G.state === 'kitchen', 'enter on a kitchen card starts the kitchen');
const Kt = KX.Kitchen;
/* the cast is data (content/casts.json), not a filename prefix */
ok(KX.CASTS && KX.CASTS['2'] && KX.CASTS['2'].length > 0 && JSON.stringify(Kt.castFor(2)) === JSON.stringify(KX.CASTS['2']),
   `Kitchen.castFor(2) is CASTS['2'] (${Kt.castFor(2).join()})`);
ok(Kt.castFor(9).join() === 'smokerbust', 'an era with no cast falls back to the dialogue default');
/* the crowd grows through the decade: CASTS.from is each face's first year (owner, 2026-11-08) */
{
  const F = KX.CASTS.from || {};
  const at = (era, y) => Kt.castFor(era, y);
  const grows = [1, 2, 3].every((era) => {
    const ys = [...new Set(KX.LEVELS.filter((l) => l.era === era).map((l) => l.year))].sort((a, b) => a - b);
    const n = ys.map((y) => at(era, y).length);
    return n[0] > 0 && n.every((v, i) => !i || v >= n[i - 1]) && n[n.length - 1] === KX.CASTS[era].length;
  });
  ok(grows, `each decade's crowd only grows, from its first level to the whole cast by its last (${[1, 2, 3].map((e) => [1972, 1981, 1990][e - 1] + ':' + at(e, [1972, 1981, 1990][e - 1]).length + '/' + KX.CASTS[e].length).join(' ')})`);
  ok(!at(1, 1972).some((n) => F[n] > 1972) && at(1, 1978).includes('c70magician') && !at(1, 1975).includes('c70magician'),
     'nobody appears before their first year: the Magician joins in 1978');
}
/* the surroundings: one wall per decade, baked per level (owner, 2026-11-07).
   The stubs cannot see a pixel; what they can check is that every kitchen
   level bakes without a missing colour, that the calendar shows that level's
   month and year and fits on its page, and that the calendar and the sign sit
   where a 3-item ticket leaves them whole and the bins never reach. */
{
  const kl = G.levels().filter((l) => l.type === 'kitchen');
  let baked = 0, calOk = 0, placed = 0;
  const lowest3 = 5 + 26 + 3 * 8 + 3;              // a 3-item ticket's bottom edge
  /* the month is the season rule's (validate.mjs levelMonth), carried on LEVELS:
     every winter kitchen level is December, since no summer of its year follows */
  const MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const cal = [];
  for (const l of kl) {
    try { Kt.era = l.era; Kt.year = l.year; Kt.month = l.month; Kt.winter = l.season === 'winter'; Kt.buildBg(); baked++; } catch (e) { console.log('   ', l.n, e.message); }
    const [mon, yr] = Kt.calendarText(), c = Kt.calRect, sg = Kt.signRect;
    cal.push(l.n + ':' + mon);
    if (Number.isInteger(l.month) && mon === MON[l.month - 1] && yr === String(l.year) && textW(yr) <= c.w - 4 && textW(mon) <= c.w - 4) calOk++;
    if (c.y + 10 >= lowest3 && sg.y >= lowest3 && c.y + c.h <= 104 && sg.y + sg.h <= 104 && sg.x + sg.w <= Kt.OV_X) placed++;
  }
  ok(baked === kl.length, `every kitchen level bakes its decade's wall (${baked}/${kl.length})`);
  ok(calOk === kl.length, `the calendar shows each level's month and year, and fits (${calOk}/${kl.length})`);
  const winterK = kl.filter((l) => l.season === 'winter');
  ok(winterK.length === 7 && winterK.every((l) => cal.includes(l.n + ':DEC')), `every winter kitchen level's calendar says DEC (${cal.join(' ')})`);
  ok(G.levels()[2].month === 1 && G.levels()[8].month === 1 && G.levels()[1].month === 12 && G.levels()[0].month === 7,
     `LEVELS carries each level's month: level 3 January, level 2 December, level 1 July (${G.levels().map((l) => l.month).join()})`);
  ok(placed === kl.length, `calendar text and sign clear a 3-item ticket and the bins (${placed}/${kl.length})`);
  Kt.era = G.level.era; Kt.year = G.level.year; Kt.month = G.level.month; Kt.winter = G.level.season === 'winter'; Kt.bg = Kt.buildBg();
}
for (let i = 0; i < 120; i++) { G.update(1 / 60); G.render(ctx); Input.endFrame(); }
ok(Kt.tickets.length >= 1, `the first ticket is up within 2s (${Kt.tickets.length})`);
const tk = Kt.tickets[0], it0 = tk.items[0];
ok(tk.max === G.diff.kitchen.tipPerItem * tk.items.length, `starting tip is ${money(G.diff.kitchen.tipPerItem)} x ${tk.items.length} items`);
/* drive the real cursor to a cell and pick it, the way a player does */
const pickKey = (key) => { const c = Kt.cellOf(key); Kt.cur.c = c.c; Kt.cur.r = c.r; Kt.cur.z = c.z; Kt.select(G); };
const recipe = it0.def.recipe;
const wrongKey = Kt.bins.find((b) => b && !recipe.includes(b.key)).key;
pickKey(recipe[0]);
ok(it0.step === 1, 'the right base fills a pip');
pickKey(wrongKey);
ok(it0.step === 1 && !it0.clean && !tk.clean, 'a wrong pick costs the star and the clean bonus, not the progress');
ok(Kt.wrongKey === wrongKey, 'and the red plate holds');
for (let i = 1; i < recipe.length; i++) pickKey(recipe[i]);
ok(it0.step === recipe.length && Kt.wrongKey === null, 'finishing the build clears the red plate');
const starsBefore = G.levelStars;
/* WRAP IT! is reachable without a mouse: Down past the bottom row, then select */
Kt.cur.c = 3; Kt.cur.r = 0; Kt.onBtn = false;
Kt.move(0, 1); ok(!Kt.onBtn && Kt.cur.r === 1, 'Down from the top row reaches the bottom row, not the button');
Kt.move(0, 1); ok(Kt.onBtn, 'Down from the bottom row steps onto WRAP IT!');
Kt.move(0, 1); ok(Kt.onBtn, 'and Down again stays there');
Kt.select(G);
ok(it0.wrapped && G.levelStars === starsBefore, 'select on the button wraps; a dirty item banks no star');
Kt.move(0, -1); ok(!Kt.onBtn && Kt.cur.c === 3 && Kt.cur.r === 1, 'Up steps back to the bin it came from');
/* the tortilla rack: each cursor sits on its own tray, and the mouse agrees */
{
  const rk = Kt.rack();
  ok(!!rk, 'the baked tortilla rack is there to measure');
  if (rk) {
    const rects = [0, 1, 2].map((z) => Kt.cellRect(0, z >= 2 ? 1 : 0, z));
    const W = Kt.wells.TORTILLA;
    ok(rects.every(([x, y, w, h]) => x - 2 >= rk.x && x + w + 2 <= rk.x + W.width && y - 2 >= rk.y && y + h + 2 <= rk.y + W.height),
      'every tray cursor fits inside the rack art');
    ok(rects.every((r, z) => !z || rects[z - 1][1] + rects[z - 1][3] <= r[1] - 2), 'the tray cursors do not overlap');
    ok(rects.every(([x, y, w, h], z) => { const t = Kt.hitTest(x + w / 2, y + h / 2); return t && t.c === 0 && t.z === z; }),
      'a click in the middle of each tray picks that tray');
  }
}
const buildAll = () => { for (const it of tk.items) if (!it.wrapped) { for (const k of it.def.recipe.slice(it.step)) pickKey(k); Kt.wrap(G); } };
buildAll();
const paidBefore = G.earned, doneBefore = G.done;
Kt.serve(G);
ok(G.earned > paidBefore && G.done === doneBefore + 1, `serving pays (${money(G.earned - paidBefore)}) and counts toward the target`);

/* a clean ticket banks a star per item */
for (let i = 0; i < 60 * 30 && !Kt.tickets.length; i++) { G.update(1 / 60); Input.endFrame(); }
const tk2 = Kt.tickets[0], s0 = G.levelStars;
for (const it of tk2.items) { for (const k of it.def.recipe) pickKey(k); Kt.wrap(G); }
ok(tk2.clean && G.levelStars === s0 + tk2.items.length, `a clean ticket banks ${tk2.items.length} star(s)`);
const e0 = G.earned, combo0 = G.combo, tip2 = Math.round(tk2.tip);
Kt.serve(G);
ok(G.earned - e0 === Math.round((tip2 + 500) * combo0), 'and pays tip + $5.00 clean, times the combo');

/* patience: a ticket left alone walks out, pays nothing, resets the combo */
G.combo = 2;
Kt.tickets.length = 0; Kt.queue.length = 0; Kt.arrive(G);
const lone = Kt.tickets[0];
lone.tip = 3;
const wo = Kt.stats.walkouts, eW = G.earned;
for (let i = 0; i < 30; i++) { G.update(1 / 60); Input.endFrame(); }
ok(Kt.stats.walkouts === wo + 1 && G.combo === 1 && G.earned === eW, 'a customer whose tip runs out walks out: no pay, combo reset');

/* the soft limit: past three, the queue complains and every tip drains faster */
Kt.tickets.length = 0; Kt.queue.length = 0;
for (let i = 0; i < 4; i++) Kt.arrive(G);
ok(Kt.tickets.length === 3 && Kt.queue.length === 1, 'the rail holds three; the fourth customer queues');
const before4 = Kt.tickets.map((t) => t.tip);
Kt.update(1, G);
const drained = before4.map((b, i) => b - Kt.tickets[i].tip);
ok(drained.every((d) => Math.abs(d - G.diff.kitchen.decay * 1.5) < 0.01), `while they queue, every tip drains at 1.5x (${drained[0].toFixed(2)}c/s)`);
Kt.tickets.length = 0; Kt.queue.length = 0;

/* hint, ticket limit and clean bonus are difficulty content */
{
  const D = KX.DIFFICULTY, lv = (d) => G.levels().find((l) => l.type === 'kitchen' && l.difficulty === d);
  const wrongPickHint = (d) => {
    G.diffKey = d; G.diff = D[d]; Kt.enter(lv(d), D[d], true); Kt.arrive(G);
    const t = Kt.tickets[0], it = t.items[0], rc = it.def.recipe;
    const bad = Kt.bins.find((b) => b && !rc.includes(b.key)).key;
    const c = Kt.cellOf(bad); Kt.cur.c = c.c; Kt.cur.r = c.r; Kt.cur.z = c.z; Kt.hintT = 0; Kt.select(G);
    return Kt.hintT;
  };
  ok(wrongPickHint('easy') === 1.6, 'easy: a wrong pick shows the hint for 1.6s');
  ok(wrongPickHint('hard') === 0, 'hard: a wrong pick shows no hint');
  /* the next-ingredient hint: a stall, a wrong pick, new dishes only */
  const kl = (d, era) => G.levels().find((l) => l.type === 'kitchen' && l.difficulty === d && (!era || l.era >= era));
  const setup = (l) => { const d = D[l.difficulty]; G.diffKey = l.difficulty; G.diff = d; Kt.enter(l, d, false); Kt.tickets.length = 0; Kt.queue.length = 0; Kt.arrive(G); Kt.arriveT = 999; return Kt.item(); };
  const idle = (secs) => { for (let i = 0; i < secs * 60; i++) Kt.update(1 / 60, G); };
  ok(D.easy.kitchen.hintStall === 3 && D.easy.kitchen.hintNewOnly === false && D.medium.kitchen.hintNewOnly === true && D.hard.kitchen.hint === false, 'hint dials: easy 3s all dishes, medium new only, hard off');
  { const it = setup(kl('easy'));
    idle(D.easy.kitchen.hintStall - 0.3);
    ok(Kt.hintT === 0, 'easy: no hint before the stall');
    idle(0.5);
    ok(Kt.hintT > 0, 'easy: a stall of hintStall seconds blinks the hint');
    ok(Kt.stallT < 1, 'firing the hint restarts the stall clock');
    const said = [];
    const CastX = sandbox.__c.Cast, keepSay = CastX.say; CastX.say = (r, m, o) => { said.push([r, m, o && o.vars && o.vars.ING]); return true; };
    Kt.hintItem = null; idle(3.2); idle(3.2);
    CastX.say = keepSay;
    ok(said.length === 1 && said[0][0] === 'coworker' && said[0][1] === 'hint' && said[0][2] === Kt.plateName(it.def.recipe[it.step]), 'the coworker hints once per item step, with the plate name (' + JSON.stringify(said) + ')');
    const k = it.def.recipe[it.step], cc = Kt.cellOf(k); Kt.cur.c = cc.c; Kt.cur.r = cc.r; Kt.cur.z = cc.z;
    idle(2); Kt.select(G);
    ok(Kt.stallT === 0 && it.step === 1, 'a pick resets the stall clock');
    ok(wrongPickHint('easy') === 1.6, 'easy: a wrong pick still hints'); }
  { const it = setup(kl('hard')); idle(10); ok(Kt.hintT === 0 && !Kt.hintFor(it), 'hard: nothing hints'); }
  { const l = kl('medium', 2) || kl('medium');
    const it = setup(l);
    const old = Kt.menu.items.find((d) => !Kt.newDishes.has(d.name)), nw = Kt.menu.items.find((d) => Kt.newDishes.has(d.name));
    ok(!old || !Kt.hintFor({ def: old }), 'medium: an old dish never hints');
    ok(!nw || Kt.hintFor({ def: nw }), 'medium: a new dish hints');
    if (old) { it.def = old; it.step = 0; Kt.stallT = 0; Kt.hintT = 0; idle(5); ok(Kt.hintT === 0, 'medium: no stall hint on an old dish'); }
    if (nw) { it.def = nw; it.step = 0; Kt.stallT = 0; Kt.hintT = 0; idle(3.3); ok(Kt.hintT > 0, 'medium: stall hint on a new dish'); }
    const e1 = new Set(); Kt.era = 1; ok(Kt.findNewDishes().size === Kt.menu.items.length, 'era 1: every dish is new'); }
  const keepR = D.easy.kitchen.railMax, keepQ = D.easy.kitchen.queueMax;
  D.easy.kitchen.railMax = 2; D.easy.kitchen.queueMax = 1;
  G.diffKey = 'easy'; G.diff = D.easy; Kt.enter(lv('easy'), D.easy, true);
  ok(Kt.RAIL_MAX === 2 && Kt.QUEUE_MAX === 1, 'RAIL_MAX and QUEUE_MAX read the difficulty (' + Kt.RAIL_MAX + '/' + Kt.QUEUE_MAX + ')');
  D.easy.kitchen.railMax = keepR; D.easy.kitchen.queueMax = keepQ;
  ok(Kt.RAIL_MAX === 3 && Kt.QUEUE_MAX === 3, 'and they restore');
  G.diffKey = G.level.difficulty; G.diff = D[G.diffKey]; Kt.enter(G.level, G.diff, false);
}

/* every menu item in every era can be built, and its Short name clears the board */
let unbuildable = 0, crowded = 0, items = 0;
for (const era of [1, 2, 3]) {
  Kt.enter({ era }, G.diff, true);
  for (const def of Kt.menu.items) {
    items++;
    if (!def.recipe.every((k) => Kt.cellOf(k))) unbuildable++;
    const lx = 6 + textW(def.short, 2) + 7, tot = def.recipe.length * 9 - 1;
    if (lx + tot > Kt.BX - 1) crowded++;      // menu.md: 12*chars + 9*steps <= 127 ends the pips at x136, the board border is x137
  }
}
ok(unbuildable === 0, `every item in all three menus is buildable from the lattice (${items} items)`);
ok(crowded === 0, 'every Short name leaves its pips clear of the board');

/* every step of every item, and its finish, has a baked board frame. build.mjs
   refuses a menu with one missing; this checks the game asks for the same keys
   the build checked, so a change to how pic() names a frame cannot blank the
   board while the build still passes. */
let noFrame = [], lookedUp = 0;
for (const era of [1, 2, 3]) {
  Kt.enter({ era }, G.diff, true);
  for (const def of Kt.menu.items)
    for (let s = 1; s <= def.recipe.length + 1; s++) {
      const key = Kt.frameKey(def, Math.min(s, def.recipe.length), s > def.recipe.length);
      lookedUp++;
      if (!KX.BOARD[key]) noFrame.push(key);
    }
}
ok(noFrame.length === 0, `every build step and finish has a board frame (${lookedUp} looked up${noFrame.length ? ', missing ' + noFrame.slice(0, 3).join(' ') : ''})`);
ok(KX.BOARD['LARGE-BEANS-CHEESE'] && Kt.frameKey({ name: 'BEAN BURRITO', recipe: ['LARGE', 'BEANS', 'CHEESE'] }, 3, true) === 'BEAN-BURRITO-WRAPPED',
  'a rolled dish finishes on its roll, not its last build frame');

/* the recipe card fits: ticket name + plates, abbreviated if long */
let tooWideRecipe = 0;
for (const era of [1, 2, 3]) {
  Kt.enter({ era }, G.diff, true);
  for (const def of Kt.menu.items) {
    const parts = def.recipe.map((k) => Kt.plateName(k));
    let w = 78 + textW(parts.join(' '), 1);
    if (w > 340) w = 78 + parts.reduce((a, p) => a + textW(p.slice(0, 4), 1) + 6, 0);
    if (w > 344) tooWideRecipe++;
  }
  ok(Kt.menu.items.length * 8 + 72 <= 198, `era ${era}'s menu fits the level card (${Kt.menu.items.length} rows)`);
}
ok(tooWideRecipe === 0, 'every recipe line fits the menu card');

/* The wrap rule exists twice: wrapRows in validate.mjs (the build) and Dialog.wrap
   (the game; src/ cannot import). This keeps them from drifting. */
console.log('\n— dialogue —');
{
  const { wrapRows, DLG_MAX_ROWS } = await import('../tools/content/validate.mjs');
  const { Dialog, FACES, DLG_BOX } = sandbox.__k;
  const widestKey = Object.keys(FACES).reduce((a, k) => (FACES[k].w > FACES[a].w ? k : a));
  const fw = Math.max(DLG_BOX, FACES[widestKey].w + 4);
  const bw = (4 + 376 - 6) - (4 + 3 + fw + 10);       // as in Dialog.draw
  const L50 = 'WE ARE SO SORRY ABOUT THE WAIT HERE IS YOUR TACOS';
  Dialog.say('CUSTOMER', L50, { face: widestKey });
  ok(Dialog.lines.length === 2, `a 50-character line wraps to two rows (${Dialog.lines.length})`);
  ok(Dialog.lines.every((r) => textW(r, 1) <= bw - 2), `every row fits the bubble beside the widest face (${Dialog.lines.map((r) => textW(r, 1)).join('/')} in ${bw - 2}px)`);
  const tests = [L50, 'SHORT', 'ONE TWO THREE FOUR FIVE SIX SEVEN EIGHT NINE TEN', 'THANKS A MILLION FOR THE FAST DELIVERY PAL'];
  const bad = tests.filter((s) => Dialog.wrap(s, widestKey).length !== wrapRows(s, Math.min(bw - 8, 34 * 6 - 1)).length);
  ok(bad.length === 0 && DLG_MAX_ROWS === 2, 'Dialog.wrap and the validator\'s wrapRows agree on the row count' + (bad.length ? ': ' + bad.join(' | ') : ''));
  Dialog.say('CUSTOMER', ['ONE', 'TWO'], { face: widestKey });
  ok(Dialog.lines.join() === 'ONE,TWO', 'an array of rows is used as given');
  Dialog.drop();
}

console.log('\n— kitchen demo —');
/* the demo's level set is content: attract.demo.levels, "random" or a list */
{
  const pin = G.demoPin, was = ATTRACT.demo.levels;
  G.demoPin = 0; ATTRACT.demo.levels = [2];
  const picks = [];
  try { for (let i = 0; i < 20; i++) { G.toDemo(); picks.push(G.levelN); } }
  finally { G.demoPin = pin; ATTRACT.demo.levels = was; }
  ok(picks.length === 20 && picks.every((n) => n === 2), `with demo.levels [2], 20 demos all play level 2 (${picks.join(',')})`);
  ok(was === 'random', `attract.json ships demo.levels "random" (${JSON.stringify(was)})`);
}
G.toDemo(2);
ok(G.state === 'kdemo', 'the attract demo can play a kitchen level');
let kBad = 0;
for (let i = 0; i < 40 * 60; i++) {
  G.update(1 / 60); G.render(ctx); Input.endFrame();
  if (!Number.isFinite(G.earned)) { kBad++; break; }
  if (G.state !== 'kdemo') break;
}
ok(kBad === 0, 'no NaN in 40s of the kitchen autoplayer');
ok(Kt.stats.served >= 2, `the autoplayer actually serves (${Kt.stats.served} tickets in 40s)`);
ok(!Scores.board.some((e) => e.cents === G.earned && e.cents > 0 && e.ini === 'ZZZ'), 'and never posts a score');
G.toTitle();

console.log('\n— test hooks —');
/* Service Mode's Test panel drives the game through a handful of plain G
   fields. They ship, so with G.test null and the autopilot never on the game
   must be exactly what it was: that is the last block here. State is reset
   before and after, since the sections share one game. */
{
  const KD = KX.DIFFICULTY, LVS = KX.LEVELS;
  const reset = () => {
    G.test = null; G.autopilot = false; G.testRun = false;
    Input.down = Object.create(null); Input.hit = Object.create(null); Input.mhit = false;
  };
  const run = (secs, each) => {
    let threw = null;
    try { for (let i = 0; i < secs * 60; i++) { G.update(1 / 60); Input.endFrame(); if (each && each() === false) break; } } catch (e) { threw = e; }
    return threw;
  };
  reset();
  ok(G.test === null && G.autopilot === false && G.testRun === false && G.speed === 1 && G.testPaused === false,
     'the hooks default off: G.test null, autopilot off, not a test run, speed 1, not frozen');

  /* overrides: applied by setLevel after it reads the level, never into the content */
  G.test = { difficulty: 'supreme' }; G.setLevel(1);
  ok(G.diffKey === 'supreme' && G.diff === KD.supreme, `G.test {difficulty: supreme} gives level 1 supreme (${G.diffKey})`);
  G.test = { era: 3, season: 'winter' }; G.setLevel(1);
  ok(G.era === 3 && G.winter && G.mapN === 3 && G.level.era === 3 && LVS[0].era === 1 && LVS[0].season === 'summer',
     `era and season override level 1 (era ${G.era}, map ${G.mapN}, winter ${G.winter}); levels.json is untouched`);
  ok(G.level.year === 1990 && G.level.month === 12, `and the month follows: winter 1990 is December, as level 14 says (${G.level.year} ${G.level.month})`);
  G.test = { season: 'winter' }; G.setLevel(1);
  ok(G.level.month === LVS[1].month && G.level.month === 12, `level 1 made winter takes winter 1972's month from LEVELS (${G.level.month})`);
  G.test = { season: 'summer' }; G.setLevel(3);
  ok(G.level.month === 7 && LVS[2].month === 1, `level 3 made summer is July (${G.level.month})`);
  G.test = { difficulty: 'hard' }; G.setLevel(3);
  ok(G.level.month === 1, `an override that leaves the season and year leaves the month (${G.level.month})`);
  G.test = null; G.setLevel(1);
  ok(G.diffKey === 'easy' && G.era === 1 && !G.winter && G.mapN === 1 && G.level === LVS[0], 'G.test null: level 1 as authored, the map back to 1');
  G.test = { difficulty: 'hard' }; G.startRun(1);
  ok(G.testRun === true && G.diffKey === 'hard', 'a run started under an override is a test run');
  reset();

  /* the autopilot: Demo.drive at the wheel of a real shift, no keys held */
  G.startRun(1); G.beginShift();
  ok(G.state === 'play' && G.testRun === false, 'a run started with no override and the autopilot off is not a test run');
  G.autopilot = true;
  let path = 0, px = G.player.x, py = G.player.y;                    // startShift built this Player: read it after
  const threw = run(30, () => { const q = G.player; path += Math.hypot(q.x - px, q.y - py); px = q.x; py = q.y; return G.state === 'play'; });
  ok(!threw && path > 200, `the autopilot drives a delivery shift: ${path | 0}px of path in 30s with no keys held` + (threw ? ' — ' + threw.stack : ''));
  ok(G.testRun === true, 'and having had the autopilot on makes it a test run');

  /* Level 19, straight into play, autopilot on, off and on again. Kept on the
     clock so 30s is 30s of driving; a delivery is a throw that landed, which
     is the aim point following the porch, not just the steering. */
  G.startRun(19); G.beginShift(); G.autopilot = true;
  const d0 = G.stats.delivered;
  let flips = 0;
  const t19 = run(30, () => {
    G.shift = Math.max(G.shift, 60);
    if (++flips === 600) G.autopilot = false; else if (flips === 660) G.autopilot = true;
    return G.state === 'play';
  });
  ok(!t19 && G.state === 'play', 'level 19 with the autopilot on, off and on again runs 30s without throwing' + (t19 ? ' — ' + t19.stack : ''));
  /* measured over 140 runs: first delivery at a median of ~15s, 139 inside
     90s and the slowest at 141s. The budget is 180s so this is not a flake;
     it ends the moment one lands. */
  const t19b = run(150, () => { G.shift = Math.max(G.shift, 60); return G.state === 'play' && G.stats.delivered === d0; });
  ok(!t19b && G.stats.delivered > d0, `and delivers (${G.stats.delivered - d0} within 180s)`);

  /* the kitchen cook */
  G.autopilot = false;
  G.startRun(2); G.beginShift(); G.autopilot = true;
  const s0 = KX.Kitchen.stats.served;
  const tk = run(40, () => { G.shift = Math.max(G.shift, 60); return G.state === 'kitchen'; });
  ok(!tk && KX.Kitchen.stats.served > s0, `the autopilot cooks a kitchen shift (${KX.Kitchen.stats.served - s0} tickets in 40s)`);

  /* a test run never places */
  G.autopilot = false;
  ok(G.testRun === true, 'still a test run with the autopilot off again');
  G.earned = 99999999;
  ok(Scores.qualifies(G.earned), 'the score would qualify');
  G.timeUp();
  ok(G.state === 'over' && G.placed === false, 'under G.testRun, GAME OVER on a qualifying score does not place');
  G.afterOver();
  ok(G.state === 'cont', 'so it goes to CONTINUE?, with no initials prompt');
  G.toVictory();
  ok(G.placed === false, 'nor does victory');
  reset();

  /* the debug-view hook and the train spawn: both ship, both inert by default */
  ok(G.debugDraw === null, 'G.debugDraw is null by default');
  G.startRun(1); G.beginShift();
  let dd = 0, ddArgs = null;
  G.debugDraw = (c, cam) => { dd++; ddArgs = [c, cam]; };
  G.render(ctx);
  ok(dd === 1 && ddArgs[0] === ctx && typeof ddArgs[1].x === 'number' && typeof ddArgs[1].y === 'number',
     `one G.render calls G.debugDraw once, with the context and a cam (${dd})`);
  G.debugDraw = null;
  G.render(ctx);
  ok(dd === 1, 'and with it null nothing is called');
  G.train = null;
  const tr1 = G.spawnTrain(1);
  ok(tr1 && tr1.dir === 1 && tr1.y === City.tracks[1] && G.train === tr1, `spawnTrain(1) puts a train on the south track and makes it G.train (${tr1 && tr1.y} vs ${City.tracks[1]})`);
  G.train = null;
  const trN = G.spawnTrain(-1);
  ok(trN && trN.dir === -1 && trN.y === City.tracks[0] && G.train === trN, `spawnTrain(-1) puts it on the north track (${trN && trN.y} vs ${City.tracks[0]})`);
  G.train = null;
  G.toTitle();
  reset();

  /* and with G.test null and the autopilot never on, the score loop is as it was */
  G.startRun(1); G.beginShift();
  ok(!G.testRun, 'a plain run is not a test run');
  G.earned = 0;
  G.timeUp();
  ok(G.placed === Scores.qualifies(0), `GAME OVER on $0.00 places exactly when the board says it qualifies (${G.placed})`);
  G.startRun(1); G.beginShift(); G.earned = 99999999;
  G.timeUp();
  ok(G.placed === true, 'GAME OVER on a qualifying score places');
  G.afterOver();
  ok(G.state === 'entry' && G.afterEntry === 'cont', 'and the initials come first, then CONTINUE?');
  G.state = 'play'; G.toVictory();
  ok(G.placed === true, 'victory on a qualifying score places');
  G.toTitle();
  reset();
}

console.log('\n— personal lines —');
{
  const D = KX.DIALOGUE, keep = D.people;
  const rnd = (v) => runScript('globalThis.__rnd = Math.random; Math.random = () => ' + v + ';');
  const unrnd = () => runScript('if (globalThis.__rnd) Math.random = globalThis.__rnd;');
  const shared = (k) => D[k].map((s) => s.replace(/^\d\|/, ''));
  try {
    D.people = { c70trucker: { wait: ['ONLY MINE'] } };
    rnd(0.1); const a = G.lineFor('wait', 'c70trucker'); unrnd();
    rnd(0.9); const b = G.lineFor('wait', 'c70trucker'); unrnd();
    ok(a === 'ONLY MINE', 'a personal line plays when the roll is under PERSONAL_ODDS (' + a + ')');
    ok(b !== 'ONLY MINE' && shared('wait').includes(b), 'and a shared line plays above it (' + b + ')');
    let allShared = true;
    for (const v of [0.1, 0.5, 0.9]) { rnd(v); const l = G.lineFor('served', 'c70trucker'); unrnd(); if (!shared('served').includes(l)) allShared = false; }
    ok(allShared, 'a moment the face has no personal lines for always falls back to shared');
    rnd(0.1); const n1 = G.lineFor('wait', null), n2 = G.lineFor('wait', 'nobody'); unrnd();
    ok(shared('wait').includes(n1) && shared('wait').includes(n2), 'no face, or a face with no entry, is shared');
    D.people = undefined;
    ok(shared('wait').includes(G.lineFor('wait', 'c70trucker')), 'with no people table at all it is shared');
  } finally { D.people = keep; unrnd(); }
}

console.log('\n— cast —');
{
  const rnd = (v) => runScript('globalThis.__rnd = Math.random; Math.random = () => ' + v + ';');
  const unrnd = () => runScript('if (globalThis.__rnd) Math.random = globalThis.__rnd;');
  const Cx = sandbox.__c;
  const { Dialog, DIALOGUE: D } = KX;
  const quiet = () => { Dialog.drop(); Dialog.who = ''; };
  try {
    ok(Cx && Cx.Cast && Cx.RIVAL_ODDS === 1 / 3 && Cx.TROUBLE_QUEUE_ODDS === 0.5, 'Cast exists, RIVAL_ODDS is 1/3 and TROUBLE_QUEUE_ODDS is 1/2');
    const Cast = Cx.Cast;
    ok(Cast.who('officer', 1).name === 'SGT. PFEIFER' && Cast.who('officer', 2).name === 'OFC. KARLIN' && Cast.who('officer', 3).name === 'OFC. DREILING', 'Cast.who finds the officer of each era');
    ok(Cast.who('rival', 1).name === 'DUSTY' && Cast.who('rival', 2).name === 'ACE' && Cast.who('rival', 3).name === 'JINX', 'and the rival of each era');
    ok(Cast.who('coworker', 1).name === 'MARGE' && Cast.who('coworker', 2).name === 'DALE' && Cast.who('coworker', 3).name === 'NIKKI', 'and the coworker of each era');
    ok(Cast.who('nobody', 1) === null, 'a role with nobody in the cast is null');
    ok(Cast.line(Cast.who('officer', 1), 'chase') !== null && Cast.line(Cast.who('officer', 1), 'nonsense') === null, 'Cast.line picks a line for a moment, or null');
    ok(Cast.line({ lines: { hint: ['TRY {ING} NEXT.'] } }, 'hint', { ING: 'BEEF' }) === 'TRY BEEF NEXT.', '{ING} is replaced from vars');

    reset0();
    G.startRun(1); G.beginShift();
    ok(G.state === 'play' && G.era === 1 && G.stage === 'delivery', 'a delivery level of era 1 is in play');
    quiet(); G.cop = null;
    G.spawnCop();
    ok(Dialog.active && Dialog.who === 'SGT. PFEIFER' && Dialog.face === 'cop70' && Dialog.hostile, 'spawnCop raises the strip with SGT. PFEIFER, hostile (' + Dialog.who + ')');
    ok(D.cast.pfeifer.lines.chase.includes(Dialog.lines.join(' ')), 'and the line is one of his chase lines');

    /* pulled over */
    quiet();
    G.dropCop(); G.cop = new Cop(G.player.x, G.player.y, 0); G.cop.hitCd = 0; G.heat = 100;
    G.update(1 / 60);
    ok(Dialog.active && Dialog.who === 'SGT. PFEIFER' && D.cast.pfeifer.lines.fined.includes(Dialog.lines.join(' ')), 'the ticket raises a fined line');

    /* the pedestrian fine */
    quiet(); G.cop = null;
    const pp = G.player; pp.vx = 80; pp.vy = 0;
    G.peds.length = 0; G.spawnPed(); const q = G.peds[0]; q.x = pp.x; q.y = pp.y; q.tumble = 0; q.update = () => {};
    G.update(1 / 60);
    ok(Dialog.active && Dialog.who === 'SGT. PFEIFER' && D.cast.pfeifer.lines.fined.includes(Dialog.lines.join(' ')), 'the pedestrian fine raises a fined line');

    /* lost them */
    quiet(); G.dropCop(); G.cop = new Cop(G.player.x + 700, G.player.y, 0); G.heat = 20; G.copT = 20;
    G.update(1 / 60);
    ok(G.cop === null && Dialog.active && Dialog.who === 'SGT. PFEIFER' && !Dialog.hostile && D.cast.pfeifer.lines.lost.includes(Dialog.lines.join(' ')), 'losing the cop raises a lost line, not hostile');

    /* a miss: the rival 1 in 3, else the customer */
    G.state = 'play'; if (!G.order) G.newOrder();
    quiet(); rnd(0.1); G.miss({ x: G.player.x, y: G.player.y }, false); unrnd();
    ok(Dialog.active && Dialog.who === 'DUSTY' && Dialog.hostile && Dialog.face === 'rival70' && Dialog.who !== D.who, 'a miss under RIVAL_ODDS shows DUSTY and not the customer (' + Dialog.who + ')');
    ok(!Dialog.lines.length || D.cast.dusty.lines.missed.includes(Dialog.lines.join(' ')), 'with one of his missed lines');
    quiet(); if (!G.order) G.newOrder(); rnd(0.9); G.miss({ x: G.player.x, y: G.player.y }, false); unrnd();
    ok(Dialog.active && Dialog.who === D.who, 'a miss over RIVAL_ODDS shows the customer (' + Dialog.who + ')');

    /* a perfect toss: the rival's is not hostile */
    quiet(); if (!G.order) G.newOrder(); rnd(0.1); G.complete(true, { x: G.player.x, y: G.player.y }); unrnd();
    ok(Dialog.active && Dialog.who === 'DUSTY' && !Dialog.hostile && D.cast.dusty.lines.perfect.includes(Dialog.lines.join(' ')), 'a perfect toss under RIVAL_ODDS shows DUSTY, not hostile');
    quiet(); if (!G.order) G.newOrder(); rnd(0.1); G.complete(false, { x: G.player.x, y: G.player.y }); unrnd();
    ok(Dialog.active && Dialog.who === D.who, 'a plain delivery is never a rival moment');

    /* one line shows: a hostile line with more than a second left wins */
    quiet(); Dialog.say('CUSTOMER', 'WALKOUT', { hostile: true, secs: 3 });
    ok(Cast.say('rival', 'missed') === false && Dialog.who === 'CUSTOMER', 'a hostile line with more than 1s left is not interrupted');
    Dialog.t = 0.16 + 2.5;
    ok(Cast.say('rival', 'missed') === true && Dialog.who === 'DUSTY', 'with 1s or less left it may be replaced');
    quiet(); Dialog.say('CUSTOMER', 'FINE', { hostile: false, secs: 3 });
    ok(Cast.say('rival', 'missed') === true && Dialog.who === 'DUSTY', 'a friendly line does not block the cast');
    /* and when the rival cannot speak the customer does */
    if (!G.order) G.newOrder();
    quiet(); Dialog.say('CUSTOMER', 'WALKOUT', { hostile: true, secs: 3 });
    rnd(0.1); G.miss({ x: G.player.x, y: G.player.y }, false); unrnd();
    ok(Dialog.who !== 'DUSTY', 'a miss while a hostile line shows does not let the rival cut in (' + Dialog.who + ')');

    /* never in the demo, attract or the kitchen demo */
    for (const st of ['demo', 'kdemo', 'title', 'winners', 'scores']) {
      G.state = st; quiet(); G.cop = null;
      G.spawnCop();
      ok(!Dialog.active, 'G.spawnCop raises nothing in ' + st);
      ok(Cast.say('rival', 'missed') === false && Cast.say('officer', 'lost') === false && !Dialog.active, 'Cast.say returns false in ' + st);
    }
    G.state = 'play'; G.cop = null; quiet();

    /* ---- coworkers ---- */
    {
      const Kx = Kt, L = G.levels();
      const kIdx = (era) => L.findIndex((l) => l.type === 'kitchen' && l.era === era && l.difficulty === 'easy') + 1 || L.findIndex((l) => l.type === 'kitchen' && l.era === era) + 1;
      const begin = (era) => { reset0(); G.startRun(kIdx(era)); G.beginShift(); quiet(); Kx.tickets.length = 0; Kx.queue.length = 0; Kx.arriveT = 999; };
      const tick = (secs) => { for (let i = 0; i < secs * 60; i++) Kx.update(1 / 60, G); };
      const names = ['MARGE', 'DALE', 'NIKKI'], keys = ['marge', 'dale', 'nikki'];
      ok(D.cast.marge.face === 'staff70' && D.cast.dale.face === 'staff80' && D.cast.nikki.face === 'staff90', 'the coworkers wear staff70/80/90');
      for (let era = 1; era <= 3; era++) {
        begin(era);
        ok(G.state === 'kitchen' && G.era === era, 'a kitchen level of era ' + era + ' is running');
        ok(!Dialog.active, 'the strip is quiet at the moment of the clock-in');
        tick(1);
        ok(Dialog.active && Dialog.who === names[era - 1] && !Dialog.hostile && D.cast[keys[era - 1]].lines.clockin.includes(Dialog.lines.join(' ')), 'era ' + era + ': the clock-in line from ' + names[era - 1] + ' within the first second (' + Dialog.who + ')');
        quiet(); tick(3);
        ok(!(Dialog.active && D.cast[keys[era - 1]].lines.clockin.includes(Dialog.lines.join(' '))), 'and the clock-in is said once per shift');
      }
      /* streak */
      begin(1);
      const clean = (c) => { Kx.arrive(G); const t = Kx.tickets[0] || Kx.queue[0]; t.items.forEach((it) => { it.wrapped = true; }); t.clean = c; Kx.serve(G); };
      tick(1.1); quiet();
      Kx.cleanRun = 0; clean(true); clean(true);
      ok(Kx.cleanRun === 2 && !(Dialog.active && Dialog.who === 'MARGE'), 'two clean tickets in a row: counted, nothing said');
      clean(true);
      ok(Dialog.active && Dialog.who === 'MARGE' && D.cast.marge.lines.streak.includes(Dialog.lines.join(' ')) && Kx.cleanRun === 0, 'the third clean ticket raises a streak line and resets cleanRun');
      quiet(); clean(true); clean(false); clean(true);
      ok(Kx.cleanRun === 1, 'a dirty ticket resets the run');
      /* trouble: once per shift when the clock drops under 30 */
      begin(2); tick(1.1); quiet();
      G.shift = 29.9; tick(0.1);
      ok(Dialog.active && Dialog.who === 'DALE' && Dialog.hostile && D.cast.dale.lines.trouble.includes(Dialog.lines.join(' ')), 'the clock under 30 raises a trouble line, hostile (' + Dialog.who + ')');
      quiet(); G.shift = 25; tick(0.5);
      ok(!Dialog.active && Kx.troubleSaid === true, 'and not again');
      /* a backed-up line: the coworker replaces the customer's queue line half the time */
      const backUp = (r) => {
        begin(3); tick(1.1); quiet();
        for (let i = 0; i < 3; i++) Kx.arrive(G);
        Kx.complained = false; quiet(); Kx.barkT = 0;
        rnd(r); Kx.arrive(G); unrnd();
      };
      backUp(0.1);
      ok(Kx.queue.length >= 1 && Dialog.active && Dialog.who === 'NIKKI' && Dialog.hostile, 'a backed-up line: the coworker speaks under TROUBLE_QUEUE_ODDS (' + Dialog.who + ')');
      backUp(0.9);
      ok(Kx.queue.length >= 1 && Dialog.active && Dialog.who !== 'NIKKI', 'over the odds the customer barks as before (' + Dialog.who + ')');
      /* one speaker: a customer bark does not overwrite a coworker line */
      begin(1); tick(1.1); quiet();
      Kx.arrive(G); Kx.hintItem = null; Kx.barkT = 0;
      Kx.fireHint(G, 'stall');
      const who0 = Dialog.who, lines0 = Dialog.lines.join(' ');
      Kx.bark(G, 'wrong', Kx.focus(), true); Kx.barkT = 0; Kx.bark(G, 'served', Kx.focus(), false);
      ok(who0 === 'MARGE' && Dialog.who === who0 && Dialog.lines.join(' ') === lines0, 'a customer bark does not overwrite a coworker line');
      Kx.bark(G, 'walkout', Kx.focus(), true, true);
      ok(Dialog.who !== 'MARGE', 'a walkout still speaks (it earns it)');
      /* {ING}: bases use the station plate, bins the bin plate */
      const forced = (key) => {
        begin(1); tick(1.1); quiet();
        const def = Kx.menu.items.find((d) => d.recipe.includes(key)); if (!def) return null;
        Kx.tickets.length = 0; Kx.arrive(G); const it = Kx.item(); it.def = def; it.step = def.recipe.indexOf(key);
        Kx.hintItem = null; Kx.hintStep = -1; quiet(); Kx.barkT = 0; Kx.fireHint(G, 'stall');
        return { text: Dialog.lines.join(' '), plate: Kx.plateName(key) };
      };
      begin(1);
      const baseKey = Kx.menu.items.map((d) => d.recipe[0]).find((k) => Kx.left.some((b) => b.key === k) && k !== 'SMALL') || 'SHELL';
      const binKey = Kx.bins.find((b) => b && Kx.menu.items.some((d) => d.recipe.includes(b.key))).key;
      const fb = forced(baseKey), fi = forced(binKey);
      ok(fb && fb.text.includes(fb.plate) && !/undefined|\{ING\}/.test(fb.text), 'a hint for a base (' + baseKey + ') names the station plate: "' + (fb && fb.text) + '"');
      ok(fi && fi.text.includes(fi.plate) && !/undefined|\{ING\}/.test(fi.text), 'a hint for a bin (' + binKey + ') names the bin plate: "' + (fi && fi.text) + '"');
      /* not in the kitchen demo */
      begin(1); Kx.demo = true; G.state = 'kdemo'; quiet(); Kx.arrive(G); Kx.hintItem = null; Kx.fireHint(G, 'stall'); tick(1.5);
      G.shift = 10; tick(0.2);
      ok(!Dialog.active, 'no coworker line fires in kdemo (hint, clockin, trouble)');
      Kx.demo = false; G.state = 'kitchen';
      /* the hint plate is drawn again after the strip */
      begin(1); tick(1.1); quiet(); Kx.arrive(G); Kx.hintItem = null; Kx.fireHint(G, 'stall');
      ok(Dialog.active && Kx.hintT > 0, 'a hint is blinking under a speaking coworker');
      const order = [], kPlate = Kx.plate, dDraw = Dialog.draw;
      Kx.plate = function (x, key, col, a) { order.push('plate'); return kPlate.call(this, x, key, col, a); };
      Dialog.draw = function (x) { order.push('strip'); return dDraw.call(this, x); };
      try { for (let f = 0; f < 8; f++) { G.time = f * 0.1; order.length = 0; Kx.hintT = 1.6; G.renderKitchen(ctx); if (order.length > 2) break; } }
      finally { Kx.plate = kPlate; Dialog.draw = dDraw; }
      ok(order.indexOf('strip') >= 0 && order.lastIndexOf('plate') > order.indexOf('strip'), 'the hint plate is drawn after the strip (' + order.join(',') + ')');
      G.state = 'play'; quiet(); Kx.demo = false;
    }
  } finally { unrnd(); G.state = 'play'; }
  function reset0() { G.test = null; G.autopilot = false; G.testRun = false; Input.down = Object.create(null); Input.hit = Object.create(null); }
}

console.log('\n— copy —');
const dl = KX.DIALOGUE;
let longLine = 0;
for (const k of ['arrive', 'wait', 'queue', 'walkout', 'served', 'wrong', 'late'])
  for (const s of dl[k] || []) if (textW(s.replace(/^\d\|/, ''), 1) > 34 * 6) longLine++;
ok(longLine === 0, 'every kitchen bark fits the bubble');
for (const b of ['ORDER UP!', 'WALKOUT!', '+1:30 EXTENSION', 'LEVEL 20 CLEAR!'])
  ok(textW(b, 2) + 16 <= VW || textW(b, 3) <= VW, `"${b}" fits`);

console.log(`\n${fails === 0 ? 'PASS' : 'FAIL (' + fails + ')'}  —  ${opCount().toLocaleString()} draw calls exercised`);
process.exit(fails ? 1 : 0);
