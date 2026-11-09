/* Runs the real game modules against a stub canvas so every code path
   executes without a browser. Catches ReferenceErrors, NaN drift,
   bad indices and dead loops that a syntax check cannot. */
import { sandbox, deferred, makeCtx, makeCanvas, opCount, runScript } from './sandbox.mjs';


const { G, City, Nav, Art, Input, Demo, textW, money, MAXTHROW, VW, VH, WW, WH,
        Player, Cop, Train, Crossing, carBlocked, ATTRACT, TURN_NAMES, Scores, SCORE_MAX, INI_LEN, INI_ALPHA, ENTRY_TIMEOUT, TS, GW, HSTREETS, VSTREETS, S_ROAD, S_WALK, S_GRASS, S_EDGE, SURF_MUL, classify, SEG0, PITCH, GH, BORDER, WEATHER_GRIP, CAR_COLORS } = sandbox.__x;
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
ok(Art.car.length === CAR_COLORS.length && Art.car[0].length === 32, 'car rotation frames baked, one per CAR_COLORS pair');
ok(WEATHER_GRIP.summer.rainy === 0.75, `rain grip is 0.75 (${WEATHER_GRIP.summer.rainy})`);
ok(!CAR_COLORS.some(([body]) => body.toLowerCase() === '#d94f4f'), 'no red traffic car in CAR_COLORS');
ok(CAR_COLORS.length >= 5, `at least 5 traffic colours remain (${CAR_COLORS.length})`);

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

/* The windsock (windy levels only) sits top centre, in the 110px between the
   order card (right edge x 143) and the clock card (left edge x 253). In Mode C
   it drops below the PAUSE button that shares that gap, and stays above the
   demo's PRESS ESC line at y 52 (51 with its outline). Task 8 moves the
   minimap to a free corner in Mode C; the top centre is not a corner. */
{
  const Hud = runScript('Hud'), PAUSE = sandbox.__k.Pad.PAUSE;
  const ORDER_R = 3 + 140, CLOCK_L = VW - 128 - 3;
  const r = (c) => (typeof Hud.sockRect === 'function' ? Hud.sockRect(c) : null);
  const inGap = (q) => !!q && q.x > ORDER_R + 1 && q.x + q.w < CLOCK_L - 1 && q.y >= 2;
  const a = r(false), c = r(true);
  ok(inGap(a) && a.y + a.h <= 47, `the windsock fits between the order and clock cards (${JSON.stringify(a)})`);
  ok(inGap(c) && c.y > PAUSE.y + PAUSE.h + 1 && c.y + c.h < 51,
     `in Mode C it sits under PAUSE and above the demo line (${JSON.stringify(c)}, PAUSE ends y ${PAUSE.y + PAUSE.h})`);
  ok(!!a && typeof Hud.sockLen === 'function' && Hud.sockLen(1, 1) + 2 <= Math.min(a.w, a.h) / 2,
     `the longest sock (full strength, mid-gust) stays inside its panel (${a && Hud.sockLen ? Hud.sockLen(1, 1).toFixed(1) : '?'}px in ${a ? Math.min(a.w, a.h) / 2 : '?'})`);
}

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

/* Review Focus 1: a gust while the car is against a wall. The same sweep with
   a full-strength gust HELD ON for the whole 15s escape -- a real gust lasts
   1s and the next is 8s or more away -- blowing each of the four ways,
   including straight back into the wall the car is wedged on. The gust only
   adds to the car's velocity before the axis moves, so carBlocked still
   refuses every destination and unwedge still depenetrates.

   A held gust into a wall pins the car there: every frame's shove is a blocked
   axis move, and a blocked move bleeds the other axis (x0.72), so rocking
   along the wall goes nowhere. Pinned is not wedged -- the body is clear of
   the wall, and it ends the moment the gust does -- and driving out of the
   wind still works, so the sweep tries those inputs too. Both are asserted:
   escapable by some input, and never left overlapping geometry. */
{
  const Wind = runScript('typeof Wind === "undefined" ? null : Wind');
  const GUST_ESCAPES = [...ESCAPES,
    ['forward', (p) => { p.throttle = 1; p.steer = 0; }],
    ['forward, steer right', (p) => { p.throttle = 1; p.steer = 1; }],
    ['reverse, steer right', (p) => { p.throttle = -1; p.steer = 1; }],
    ['reverse, steer left', (p) => { p.throttle = -1; p.steer = -1; }]];
  let gEsc = 0, gTot = 0, gOverlap = 0;
  const gTrap = [];
  if (Wind) {
    for (const s of wedgeSites) for (const dir of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
      gTot++;
      let out = false;
      for (const [, drive] of GUST_ESCAPES) {
        const p = new Player(s.x, s.y, -Math.PI / 2);
        let blockedRun = 0, i = 0;
        for (; i < 900 && !out; i++) {
          Wind.on = true; Wind.dir = dir; Wind.strength = 1; Wind.gust = 1;
          drive(p, i); p.hb = false;
          p.update(1 / 60, stubG);
          if (Math.hypot(p.x - s.x, p.y - s.y) > 40) out = true;
          blockedRun = carBlocked(p.x, p.y, p.ang) ? blockedRun + 1 : 0;
        }
        if (!out && blockedRun >= 30) gOverlap++;      // still inside geometry at the end: a wedge
        if (out) break;
      }
      if (out) gEsc++; else gTrap.push(`(${(s.x / TS) | 0},${(s.y / TS) | 0}) dir ${dir.toFixed(2)}`);
    }
    Wind.on = false; Wind.gust = 0; Wind.strength = 0;
  }
  ok(!!Wind && gTot > 40 && gEsc === gTot,
     `every wedged car drives out under a held full gust from each of four sides (${gEsc}/${gTot})` + (gTrap.length ? ' — trapped ' + gTrap.join(' ') : ''));
  ok(!!Wind && gOverlap === 0, `and no strategy, escaping or not, is left overlapping geometry (${gOverlap})`);

  /* ...and a gust never pushes a free car INTO geometry: walls, fences, a
     parking lot's parked cars. Every open spot near something solid, a car
     sitting still in each of two headings, a full gust from each side for
     1.5s: no frame may end with the body overlapping anything. */
  let probes = 0, pierced = 0, movedAny = 0, inLots = 0;
  if (Wind) {
    const spots = [];
    const zoneAt = (tx, ty) => { const z = City.map.zoning, bx = Math.floor((tx - BORDER) / 12), by = Math.floor((ty - BORDER) / 12); return z[by] && z[by][bx]; };
    const tryAt = (tx, ty) => {
      const wx = tx * TS + 8, wy = ty * TS + 8;
      if (carBlocked(wx, wy, 0) || carBlocked(wx, wy, -Math.PI / 2)) return false;
      // something solid a tile and a half away: near enough for a gust to put the car against it
      if (!(City.isSolid(wx + 26, wy) || City.isSolid(wx - 26, wy) || City.isSolid(wx, wy + 26) || City.isSolid(wx, wy - 26))) return false;
      spots.push({ x: wx, y: wy }); return true;
    };
    for (let ty = 4; ty < 96 && spots.length < 160; ty += 3) for (let tx = 4; tx < 96 && spots.length < 160; tx += 5) tryAt(tx, ty);
    /* and every such spot in the parking lots: the auto blocks' rows of parked cars */
    for (let ty = 4; ty < 96; ty++) for (let tx = 4; tx < 96; tx++) if (zoneAt(tx, ty) === 'auto' && tryAt(tx, ty)) inLots++;
    for (const s of spots) for (const ang of [0, -Math.PI / 2]) for (const dir of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
      probes++;
      const p = new Player(s.x, s.y, ang);
      for (let i = 0; i < 90; i++) {
        Wind.on = true; Wind.dir = dir; Wind.strength = 1; Wind.gust = 1;
        p.throttle = 0; p.steer = 0; p.hb = false;
        p.update(1 / 60, stubG);
        if (carBlocked(p.x, p.y, p.ang)) { pierced++; break; }
      }
      if (Math.hypot(p.x - s.x, p.y - s.y) > 2) movedAny++;
    }
    Wind.on = false; Wind.gust = 0; Wind.strength = 0;
  }
  ok(probes > 400 && inLots > 10 && pierced === 0 && movedAny > probes / 4,
     `a gust never pushes a free car into geometry (${pierced} of ${probes} probes beside walls, fences and, at ${inLots} spots, parked cars; ${movedAny} were shoved)`);
}

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

/* The level card (0.9.3): LEVEL n and the date, typed on a black field. No menu,
   no delivery rows, no PRESS ENTER; it advances itself; any key skips. */
{
  const realText = sandbox.text, A5c = KX.Audio5, realSfx = A5c.sfx;
  let seen = [], ticks = 0;
  sandbox.text = (x, s, ...r) => { seen.push(s); return realText(x, s, ...r); };
  A5c.sfx = (k, ...r) => { if (k === 'tick') ticks++; return realSfx.call(A5c, k, ...r); };
  const run = (n) => { for (let i = 0; i < n; i++) { G.update(1 / 60); Input.endFrame(); } };
  const draw = () => { seen = []; G.render(ctx); return seen; };
  const hasAny = (list, re) => list.some((s) => re.test(s));
  try {
    G.toCard(2); ticks = 0;
    run(20);                                         // 0.33s: five letters
    const part = draw(), pd = part.find((s) => /^DEC/.test(s));
    ok(part.includes('LEVEL 2'), 'the card draws LEVEL 2');
    ok(pd && pd.length > 0 && pd.length < 'DECEMBER 1972'.length, `the date types on letter by letter (${pd})`);
    run(60);
    const full = draw();
    ok(full.includes('DECEMBER 1972'), 'the whole date is month name and year: DECEMBER 1972');
    ok(ticks === 12, `a tick per typed letter, none for the space (${ticks})`);
    ok(!hasAny(full, /MENU|PRESS ENTER|TARGET|CLOCK|TIPS|FINES|TACO-NAV|ROADS|CLOCK IN/), 'the card draws no menu, no delivery rows and no PRESS ENTER');
    ok(G.state === 'card', 'still on the card while the date is held');
    run(100);                                        // 13*0.06 + 2.0 = 2.78s < 1.67+1.67
    ok(G.state === 'kitchen', `the card advances by itself after the type-on and CARD_HOLD (${G.state})`);

    G.toCard(1); run(30);                            // mid-typing
    ok(G.state === 'card', 'level 1 card is typing');
    Input.anyKey = true; G.update(1 / 60); Input.endFrame();
    ok(G.state === 'play', 'any key mid-typing goes straight into play');
    G.toCard(2); run(30);
    Input.mhit = true; G.update(1 / 60); Input.endFrame();
    ok(G.state === 'kitchen', 'a click or tap skips the kitchen card too');

    /* the pause overlay still carries the menu (at the cost of clock time) */
    G.paused = true;
    const pz = draw();
    ok(pz.includes('THE MENU'), 'the kitchen pause overlay still shows THE MENU');
    G.paused = false;
  } finally { sandbox.text = realText; A5c.sfx = realSfx; }
  G.toCard(1);
}

/* weather: set per level in content/levels.json (sunny|rainy|snowy, or random,
   which rolls within the season), with a windy flag; the kitchen follows its
   level as decoration only. ?weather= and the Test panel's season win. Every
   (the card no longer names the weather; the road tells you). */
const pinW = G.weatherPin; G.weatherPin = null;
const WLV = G.levels();
let weatherOk = 0, windOk = 0, rainDraws = true, kitchenGrip = true;
for (const lv of WLV) {
  G.toCard(lv.n);
  const fixed = lv.weather !== 'random', pick = lv.season === 'winter' ? ['snowy', 'sunny'] : ['sunny', 'rainy'];
  if (fixed ? G.weather === lv.weather : pick.includes(G.weather)) weatherOk++;
  if (lv.type === 'kitchen' ? G.windy === false : (lv.weather === 'random' ? typeof G.windy === 'boolean' : G.windy === lv.windy)) windOk++;
  if (lv.type === 'kitchen' && Player.gripMul !== 1) kitchenGrip = false;
  if (G.weather === 'rainy' && lv.type === 'delivery') { G.state = 'play'; try { G.update(1 / 60); G.render(ctx); } catch (e) { rainDraws = false; } G.toCard(lv.n); }
}
ok(weatherOk === 20, `all twenty levels play the weather their level sets (${weatherOk}/20)`);
ok(windOk === 20, `G.windy follows the level's flag (${windOk}/20)`);
G.toCard(1);
ok(G.weather === 'sunny' && G.windy === false, 'level 1 is sunny and not windy');
G.toCard(5);
ok(G.weather === 'sunny' && G.windy === true, 'level 5 is sunny and windy');
G.toCard(7);
ok(G.weather === 'rainy' && Player.gripMul === WEATHER_GRIP.summer.rainy, `level 7 is rainy, and the car grips at ${Player.gripMul}`);
G.toCard(9);
ok(G.weather === 'snowy' && G.windy === true && Player.gripMul === WEATHER_GRIP.winter.snowy, 'level 9 is snowy and windy');
/* the kitchen follows its level, as decoration: no grip, no wind */
const kw = {};
for (const n of [2, 4, 10, 16]) { G.toCard(n); kw[n] = G.weather; }
ok(kw[2] === 'snowy' && kw[4] === 'sunny' && kw[10] === 'rainy' && kw[16] === 'rainy', `a kitchen level's weather follows its level (${JSON.stringify(kw)})`);
ok(kitchenGrip && G.windy === false, 'a kitchen applies no grip and no wind');
/* random is a choice: it rolls within the season, every time */
const rolled = { summer: new Set(), winter: new Set() }, windsR = { summer: 0, winter: 0 };
for (let k = 0; k < 600; k++) {
  G.toCard(11); rolled.summer.add(G.weather); if (G.windy) windsR.summer++;
  G.test = { season: 'winter' }; G.toCard(11); rolled.winter.add(G.weather); if (G.windy) windsR.winter++;
  G.test = null;
}
ok(rolled.summer.size === 2 && rolled.summer.has('sunny') && rolled.summer.has('rainy'), `a random summer level rolls sunny or rainy (${[...rolled.summer]})`);
ok(rolled.winter.size === 2 && rolled.winter.has('snowy') && rolled.winter.has('sunny'), `a random level under a winter season override rolls snowy or sunny (${[...rolled.winter]})`);
ok(Math.abs(windsR.summer / 600 - 0.30) < 0.08 && Math.abs(windsR.winter / 600 - 0.25) < 0.08,
   `a random level rolls its wind at 30% summer, 25% winter (${windsR.summer / 6}%, ${windsR.winter / 6}%)`);
/* the Test panel's season override on a fixed level the season cannot have: still valid for the season */
const wxBad = new Set();
for (let k = 0; k < 100; k++) { G.test = { season: 'summer' }; G.toCard(3); wxBad.add(G.weather); G.test = { season: 'winter' }; G.toCard(7); wxBad.add(G.weather); }
G.test = null;
ok([...wxBad].every((w) => ['sunny', 'rainy', 'snowy'].includes(w)), `an override that leaves a weather impossible for the season rolls a valid one (${[...wxBad]})`);
G.test = { season: 'summer' }; let snowOnSummer = 0; for (let k = 0; k < 100; k++) { G.toCard(3); if (G.weather === 'snowy') snowOnSummer++; } G.test = null;
ok(snowOnSummer === 0, 'level 3 made summer never snows');
/* the pin wins over the level */
G.weatherPin = 'rainy'; G.toCard(1);
ok(G.weather === 'rainy', '?weather=rainy beats level 1 being sunny');
G.weatherPin = 'season'; G.toCard(7);
ok(G.weather === 'sunny', "?weather=season gives the season's default on a rainy level");
G.weatherPin = 'snowy'; G.toCard(1);
ok(G.weather === 'sunny', 'a pin the season cannot have is ignored, the level stands');
G.weatherPin = null;
/* CONTINUE re-applies the level's weather */
G.startRun(7); G.weather = 'sunny'; Player.gripMul = 1; G.windy = true;
G.startRun(7);
ok(G.weather === 'rainy' && Player.gripMul === WEATHER_GRIP.summer.rainy && G.windy === false, 'starting the level again (CONTINUE) re-applies its weather');
/* the odds of a random roll: winter mostly snowy, summer an even chance (owner ruling, 2026-11-07) */
const wasWinter = G.winter, wasLevel = G.level, odds = {};
G.level = { weather: 'random' };
for (const w of [false, true]) { G.winter = w; let alt = 0; for (let i = 0; i < 4000; i++) if (G.rollWeather() !== (w ? 'snowy' : 'sunny')) alt++; odds[w ? 'winter' : 'summer'] = alt / 4000; }
G.winter = wasWinter; G.level = wasLevel;
G.weatherPin = pinW; G.toCard(1);
ok(odds.winter > 0.14 && odds.winter < 0.26, `a random winter is mostly snowy (sunny ${(odds.winter * 100).toFixed(1)}%)`);
ok(odds.summer > 0.44 && odds.summer < 0.56, `a random summer is an even chance of rain (rainy ${(odds.summer * 100).toFixed(1)}%)`);
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
/* snow tracked in, rain on the glass (0.9.3): baked once into the background. The stubs keep no
   pixels, so buildBg records what it laid down in Kitchen.bgDecor; the real pixels are compared by
   tools/render/frame.mjs. Winter levels get the snow mat and the footprints; rain is the weather's. */
{
  const save = { era: Kt.era, winter: Kt.winter, weather: Kt.weather };
  const decor = (era, winter, weather) => { Kt.era = era; Kt.winter = winter; Kt.weather = weather; Kt.buildBg(); return Kt.bgDecor || {}; };
  const w = decor(1, true, 'snowy'), s = decor(1, false, 'sunny'), r = decor(2, false, 'rainy'), wr = decor(3, true, 'rainy');
  ok(w.snowMat === true && w.footprints > 0, `a winter kitchen has a snow mat and wet footprints (${w.footprints})`);
  ok(!s.snowMat && !s.footprints && !s.rainWindow, 'a sunny summer kitchen has none of it');
  ok(r.rainWindow === true && !r.snowMat && !r.footprints, 'a rainy summer kitchen has rain on the glass and nothing tracked in');
  ok(wr.snowMat === true && wr.rainWindow === true, 'winter and rainy together get both');
  const every = G.levels().filter((l) => l.type === 'kitchen').every((l) => {
    Kt.era = l.era; Kt.winter = l.season === 'winter'; Kt.weather = l.weather === 'rainy' ? 'rainy' : (Kt.winter ? 'snowy' : 'sunny'); Kt.buildBg();
    const d = Kt.bgDecor; return d.snowMat === Kt.winter && !!d.rainWindow === (Kt.weather === 'rainy');
  });
  ok(every, 'every kitchen level bakes the decoration its season and weather call for');
  Kt.era = save.era; Kt.winter = save.winter; Kt.weather = save.weather; Kt.bg = Kt.buildBg();
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
  ok(Kt.menu.items.length * 8 + 72 <= 198, `era ${era}'s menu fits the pause overlay (${Kt.menu.items.length} rows)`);
}
ok(tooWideRecipe === 0, 'every recipe line fits the pause menu');

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

console.log('\n— one face per address —');
{
  const rnd = (v) => runScript('globalThis.__rnd = Math.random; Math.random = () => ' + v + ';');
  const unrnd = () => runScript('if (globalThis.__rnd) Math.random = globalThis.__rnd;');
  const { Dialog: Dg, Kitchen: Kc, CASTS: CS } = KX;
  const realSay = Dg.say, savedState = G.state;
  const said = [];
  Dg.say = (who, line, o) => { said.push(o && o.face); };
  try {
    G.startRun(1);
    G.state = 'play';
    const hs = City.houses;
    const hA = { addr: hs[0].addr }, hB = { addr: hs[1].addr };
    ok(G.addrFaces && G.addrFaces.size === 0, 'startRun leaves no address with a face yet');
    said.length = 0;
    rnd(0.05); G.react('wait', { house: hA, tip: 1, floor: 0, max: 2 }, false); unrnd();
    rnd(0.95); G.react('wait', { house: hA, tip: 1, floor: 0, max: 2 }, false); unrnd();
    ok(said.length === 2 && said[0] && said[0] === said[1], `the same house keeps its face whatever the roll (${said.join()})`);
    ok(G.addrFaces.size === 1, 'one address, one entry');
    const cast = Kc.castFor(G.era, G.level.year);
    ok(cast.length > 1, 'the first level has a cast to choose from (' + cast.length + ')');
    rnd(0.0); const fa = G.faceFor(hA), fb0 = G.faceFor(hB); unrnd();
    G.addrFaces.clear();
    rnd(0.99); const fb = G.faceFor(hB); unrnd();
    ok(fb0 === cast[0] && fb === cast[cast.length - 1] && fb !== fb0, 'a different house may get a different face');
    G.addrFaces.clear();
    for (let i = 0; i < 60; i++) G.faceFor({ addr: 'T' + i });
    const from = CS.from || {};
    ok([...G.addrFaces.values()].every((f) => cast.includes(f) && (!(f in from) || from[f] <= 1972)),
       'every face picked in 1972 has arrived by 1972');
    G.react('wait', null, false);
    ok(said[said.length - 1], 'a react with no order still picks a face');
    G.startRun(1);
    ok(G.addrFaces.size === 0, 'startRun (and so CONTINUE) clears the map');
  } finally { Dg.say = realSay; unrnd(); G.state = savedState; }
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

    /* a kitchen attract demo must not leave the cast silenced for the next run */
    reset0();
    G.toDemo(2); G.toTitle(); reset0(); G.startRun(1); G.beginShift(); quiet(); G.cop = null;
    ok(G.state === 'play' && G.stage === 'delivery', 'a delivery run starts after the attract demo');
    G.spawnCop();
    ok(Dialog.active && Dialog.who === 'SGT. PFEIFER', 'after a kitchen attract demo the officer still speaks (' + Dialog.who + ', Kitchen.demo=' + Kt.demo + ')');
    G.cop = null; quiet();

    /* a cast line holds longer when it wraps to two rows */
    {
      const keepLine = Cast.line;
      try {
        Cast.line = () => 'OK.';
        quiet(); G.state = 'play'; Cast.say('rival', 'missed');
        ok(Math.abs(Dialog.hold - 2.4) < 1e-9, 'a one-row cast line holds 2.4s (' + Dialog.hold + ')');
        Cast.line = () => 'THIS LINE IS LONG ENOUGH TO WRAP TWICE.';
        quiet(); Cast.say('rival', 'missed');
        ok(Dialog.lines.length === 2 && Math.abs(Dialog.hold - 3.4) < 1e-9, 'a two-row cast line holds 3.4s (' + Dialog.lines.length + ' rows, ' + Dialog.hold + ')');
      } finally { Cast.line = keepLine; quiet(); }
    }

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
      /* a bark holds 1.9s, plus 1.0s for each extra row */
      {
        const keepLF = G.lineFor;
        try {
          begin(1); tick(1.1); quiet(); Kx.arrive(G);
          G.lineFor = () => 'SHORT.'; Kx.barkT = 0; Kx.bark(G, 'served', Kx.focus(), false);
          ok(Dialog.lines.length === 1 && Math.abs(Dialog.hold - 1.9) < 1e-9, 'a one-row bark holds 1.9s (' + Dialog.hold + ')');
          G.lineFor = () => 'THIS LINE IS LONG ENOUGH TO WRAP TWICE.';
          Kx.barkT = 0; Kx.bark(G, 'served', Kx.focus(), false);
          ok(Dialog.lines.length === 2 && Math.abs(Dialog.hold - 2.9) < 1e-9, 'a two-row bark holds 2.9s (' + Dialog.lines.length + ' rows, ' + Dialog.hold + ')');
        } finally { G.lineFor = keepLF; quiet(); }
      }
      /* a correct pick inside the hint blink ends the blink (no free hint for the next step) */
      {
        begin(1); tick(1.1); quiet(); Kx.arrive(G); Kx.hintItem = null;
        const it = Kx.item(); Kx.fireHint(G, 'stall');
        ok(Kx.hintT > 0, 'the hint is blinking');
        const key = it.def.recipe[it.step], c = Kx.cellOf(key);
        Kx.cur.c = c.c; Kx.cur.r = c.r; Kx.cur.z = c.z; Kx.onBtn = false;
        const step0 = it.step; Kx.select(G);
        ok(it.step === step0 + 1 && Kx.hintT === 0, 'a correct pick clears the hint blink (hintT=' + Kx.hintT + ')');
      }
      /* a hint the strip refused is not marked as said */
      {
        begin(1); tick(1.1); quiet(); Kx.arrive(G); Kx.hintItem = null; Kx.hintStep = -1;
        Dialog.say('CUSTOMER', 'WALKOUT', { hostile: true, secs: 9 });
        Kx.fireHint(G, 'stall');
        ok(Dialog.who === 'CUSTOMER' && Kx.hintItem === null, 'a refused hint line does not record hintItem');
        quiet(); Kx.fireHint(G, 'stall');
        ok(Dialog.active && Dialog.who === 'MARGE', 'and the coworker voices it once the strip is free (' + Dialog.who + ')');
      }
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

/* Windy (0.9.3, spec section 7): a crosswind on the toss, gusts that shove the
   car, tumbleweeds. Delivery only, and with the level not windy the game is
   exactly what it was. State is reset before and after: the sections share
   one game. */
console.log('\n— wind —');
{
  const Wind = runScript('typeof Wind === "undefined" ? null : Wind');
  const Tumbleweed = runScript('typeof Tumbleweed === "undefined" ? null : Tumbleweed');
  const Bag = runScript('Bag'), Hud = runScript('Hud'), A5 = KX.Audio5, KD = KX.DIFFICULTY;
  const has = !!(Wind && Tumbleweed);
  ok(has, 'Wind and Tumbleweed exist');
  const reset = () => {
    G.test = null; G.autopilot = false; G.testRun = false;
    Input.down = Object.create(null); Input.hit = Object.create(null); Input.mhit = false; Input.hasMouse = false;
  };
  const weeds = () => G.weeds || [];
  reset();

  /* the authored values, verbatim from the brief */
  const WV = { easy: [0.35, [12, 16], 3], medium: [0.55, [10, 14], 4], hard: [0.75, [8, 12], 5], supreme: [0.9, [8, 11], 6] };
  ok(Object.entries(WV).every(([k, [s, g, t]]) => KD[k].wind && KD[k].wind.strength === s && KD[k].wind.gustEvery[0] === g[0]
     && KD[k].wind.gustEvery[1] === g[1] && KD[k].wind.tumbleweeds === t), 'difficulty.json carries wind { strength, gustEvery, tumbleweeds } per difficulty');

  /* --- not windy: exactly as before --- */
  /* the bag's flight with no wind is the shipped one, step for step: the same
     integration as before 0.9.3, written out here so a change to it shows */
  const oldFlight = (x, y, tx, ty) => {
    const T = 0.5, g = 260, z0 = 5;
    let vx = (tx - x) / T, vy = (ty - y) / T, vz = (0 - z0 + 0.5 * g * T * T) / T, z = z0, n = 0;
    for (;;) { x += vx / 60; y += vy / 60; vz -= g / 60; z += vz / 60; n++; if (z <= 0) return { x, y, n }; }
  };
  const fly = (x, y, tx, ty) => {
    const b = new Bag(x, y, tx, ty, 0); let n = 0;
    while (!b.dead && n < 200) { b.update(1 / 60); n++; }
    return { x: b.x, y: b.y, n };
  };
  if (Wind) { Wind.on = false; Wind.gust = 0; }
  const o1 = oldFlight(500, 500, 500, 400), f1 = fly(500, 500, 500, 400);
  ok(f1.x === o1.x && f1.y === o1.y && f1.n === o1.n, `with no wind a 100px toss lands exactly where it always has (${f1.x.toFixed(2)},${f1.y.toFixed(2)} in ${f1.n} frames)`);

  G.startRun(1); G.beginShift();
  ok(G.state === 'play' && G.windy === false && !!Wind && Wind.on === false, 'level 1 is not windy: the wind is off');
  let maxWeeds = 0, gusted = 0, warned = 0, socks = 0, gustSfx = 0;
  const realSock = Hud.drawSock, realSfx = A5.sfx;
  if (realSock) Hud.drawSock = function (...a) { socks++; return realSock.apply(this, a); };
  A5.sfx = function (n, ...a) { if (n === 'gust') gustSfx++; return realSfx.call(this, n, ...a); };
  try {
    for (let i = 0; i < 20 * 60; i++) {
      Input.down = Object.create(null); Input.down.KeyW = (i / 90 | 0) % 2 === 0; Input.down.KeyA = (i / 140 | 0) % 3 === 0;
      G.shift = Math.max(G.shift, 60);
      G.update(1 / 60); if (i % 10 === 0) G.render(ctx); Input.endFrame();
      maxWeeds = Math.max(maxWeeds, weeds().length);
      if (Wind && Wind.gust > 0) gusted++;
      if (Wind && Wind.telegraph > 0) warned++;
    }
  } finally { Hud.drawSock = realSock; A5.sfx = realSfx; }
  ok(maxWeeds === 0 && gusted === 0 && warned === 0 && gustSfx === 0 && socks === 0,
     `20s of a calm level: no tumbleweed, no gust, no telegraph, no GUST sound, no windsock (${maxWeeds}, ${gusted}, ${warned}, ${gustSfx}, ${socks})`);

  /* the kitchen is never windy, even right after a windy delivery level */
  reset(); G.startRun(5); G.beginShift();
  const wasOn = !!Wind && Wind.on;
  G.startRun(6); G.beginShift();
  ok(wasOn && G.state === 'kitchen' && Wind.on === false && weeds().length === 0, 'a kitchen level after a windy one has no wind and no tumbleweeds');

  /* --- the crosswind on the toss --- */
  /* A fixed 100px toss due north with the wind due east, per difficulty. The
     flight is a fixed 0.5s, so the drift is the same for any length of toss:
     strength x 200px/s/s over half a second. Easy is gentle, Supreme strong. */
  const drift = {};
  if (Wind) {
    for (const k of ['easy', 'medium', 'hard', 'supreme']) {
      Wind.reset(true, KD[k]); Wind.dir = 0; Wind.gust = 0; Wind.gustT = 99;
      const f = fly(500, 500, 500, 400);
      drift[k] = f.x - o1.x;
    }
    Wind.reset(false, KD.easy);
  }
  const dv = Object.values(drift);
  console.log('  --    bag drift on a 100px toss, by difficulty: ' + Object.entries(drift).map(([k, v]) => k + ' ' + v.toFixed(1) + 'px').join(', '));
  ok(dv.length === 4 && dv.every((v, i) => v > 0 && (i === 0 || v > dv[i - 1])), 'a bag lands downwind of its no-wind landing, more so up the ladder');
  ok(drift.supreme >= 15 && drift.supreme <= 30 && drift.easy >= 5, `noticeable but beatable: Supreme drifts ${(drift.supreme || 0).toFixed(1)}px (15-30), Easy ${(drift.easy || 0).toFixed(1)}px`);

  /* and through the game's own toss, on windy level 5 */
  reset(); G.startRun(5); G.beginShift();
  ok(G.windy === true && !!Wind && Wind.on === true && Wind.strength === G.diff.wind.strength,
     `level 5 is windy, at its difficulty's strength (${Wind && Wind.strength})`);
  if (Wind) {
    G.cop = null; G.traffic.length = 0; G.peds.length = 0; G.weeds && (G.weeds.length = 0);
    Wind.gustT = 99; Wind.gust = 0; Wind.dir = Math.PI / 2;           // due south, no gust
    const p = G.player; p.x = 600; p.y = 600; p.vx = p.vy = 0; p.ang = 0;
    G.cam.x = p.x - VW / 2; G.cam.y = p.y - VH / 2;
    Input.hasMouse = true; Input.mx = VW / 2 + 100; Input.my = VH / 2;   // 100px due east
    G.throwCd = 0; G.bag = 3; G.needPickup = false;
    G.tryThrow();
    const b = G.flying[G.flying.length - 1];
    let n = 0; while (G.flying.includes(b) && n < 90) { G.update(1 / 60); Input.endFrame(); n++; }
    ok(b && Math.abs(b.x - (600 + 100)) < 4 && b.y - 600 > 0.6 * 0.35 * 200 / 8,
       `the toss drifts downwind: aimed 100px east, landed ${b ? (b.y - 600).toFixed(1) : '?'}px south of the line`);
    Input.hasMouse = false;
  }

  /* --- gusts --- */
  /* a coasting car on a north-south street, broadside to an east wind */
  const RX = SEG0 + 4 * PITCH + 16, RY = SEG0 + 4 * PITCH + 110;
  const coast = (gust) => {
    const p = new Player(RX, RY, -Math.PI / 2); p.vy = -40;
    for (let i = 0; i < 90; i++) {
      Wind.on = true; Wind.dir = 0; Wind.strength = KD.supreme.wind.strength; Wind.gust = gust && i < 60 ? Math.sin(Math.PI * i / 60) : 0;
      p.throttle = 0; p.steer = 0; p.hb = false; p.update(1 / 60, stubG);
    }
    return p.x;
  };
  let shove = 0;
  if (Wind) { shove = coast(true) - coast(false); Wind.on = false; Wind.gust = 0; }
  console.log(`  --    a Supreme gust shoves a coasting car ${shove.toFixed(1)}px sideways over 1.5s`);
  ok(!carBlocked(RX, RY, -Math.PI / 2) && shove > 6 && shove < 40, `a gust displaces a coasting car sideways, downwind (${shove.toFixed(1)}px)`);

  /* the cycle: telegraph (dust and a GUST sound) about 1s ahead, then the
     gust, every gustEvery seconds */
  let warnAt = -1, gustAt = -1, sfxAt = -1, cycles = 0, gaps = [], lastGust = -1, dust = 0;
  if (Wind) {
    reset(); G.test = { difficulty: 'supreme' }; G.startRun(5); G.beginShift(); G.test = null;
    const real = A5.sfx;
    A5.sfx = function (n, ...a) { if (n === 'gust' && sfxAt < 0) sfxAt = G.time; return real.call(this, n, ...a); };
    let was = 0;
    try {
      for (let i = 0; i < 40 * 60; i++) {
        G.shift = Math.max(G.shift, 60); G.cop = null;
        G.update(1 / 60); if (i % 15 === 0) G.render(ctx); Input.endFrame();
        if (warnAt < 0 && Wind.telegraph > 0) warnAt = G.time;
        if (Wind.telegraph > 0.5 && Wind.streaks) dust = Math.max(dust, Wind.streaks.length);
        if (gustAt < 0 && Wind.gust > 0) gustAt = G.time;
        if (Wind.gust > 0 && was === 0) { cycles++; if (lastGust >= 0) gaps.push(G.time - lastGust); lastGust = G.time; }
        was = Wind.gust;
      }
    } finally { A5.sfx = real; }
  }
  const lead = gustAt - warnAt;
  ok(warnAt >= 0 && gustAt > warnAt && lead > 0.8 && lead < 1.2 && Math.abs(sfxAt - warnAt) < 0.05,
     `a gust is telegraphed about 1s ahead, with the GUST sound (${lead.toFixed(2)}s)`);
  ok(cycles >= 3 && gaps.every((g) => g >= KD.supreme.wind.gustEvery[0] - 0.1 && g <= KD.supreme.wind.gustEvery[1] + 0.1),
     `gusts come every gustEvery seconds (${cycles} in 40s, gaps ${gaps.map((g) => g.toFixed(1)).join(' ')})`);
  ok(dust > 10, `dust streaks blow across the screen during the telegraph (${dust} at once)`);

  /* --- tumbleweeds --- */
  let onRoad = true, onPorch = 0, samples = 0, axial = 0, along = 0, rlWeeds = 0;
  const porchHit = (w) => City.houses.some((h) => w.x > h.porch.x - 4 && w.x < h.porch.x + h.porch.w + 4 && w.y > h.porch.y - 4 && w.y < h.porch.y + h.porch.h + 4);
  if (has) {
    reset(); G.startRun(5); G.beginShift(); G.autopilot = true;
    for (let i = 0; i < 25 * 60; i++) {
      G.shift = Math.max(G.shift, 60);
      G.update(1 / 60); Input.endFrame();
      if (i % 20 === 0) {
        G.render(ctx);
        rlWeeds = Math.max(rlWeeds, G.rl.filter((it) => it.e instanceof Tumbleweed).length);
        for (const w of weeds()) {
          samples++;
          const c = classify((w.x / TS) | 0, (w.y / TS) | 0);
          if (G.nearScreen(w.x, w.y) && c !== 1 && c !== 2) onRoad = false;      // T_ROAD 1, T_INTER 2
          if (porchHit(w)) onPorch++;
          const wx = Math.cos(Wind.dir), wy = Math.sin(Wind.dir);
          if (w.vx * wx + w.vy * wy > 0) along++;
          if (Math.abs(w.vx) < 1e-6 || Math.abs(w.vy) < 1e-6) axial++;       // rolls along one street axis
        }
      }
    }
    G.autopilot = false;
  }
  ok(has && weeds().length === G.diff.wind.tumbleweeds, `level 5 keeps its ${G.diff.wind && G.diff.wind.tumbleweeds} tumbleweeds rolling around the player (${weeds().length})`);
  ok(samples > 100 && onRoad && onPorch === 0, `they roll on the streets, never over a porch (${samples} samples, ${onPorch} on a porch)`);
  ok(samples > 0 && along === samples && axial === samples, `with the wind, along one street axis (${along}/${samples} downwind)`);
  ok(rlWeeds > 0, `they are entities in the y-sorted sprite list (${rlWeeds} on screen at once)`);

  /* driving through one: it bursts into twigs, the car wobbles, no fine, nothing solid */
  if (has) {
    reset(); G.startRun(5); G.beginShift();
    G.cop = null; G.traffic.length = 0; G.peds.length = 0;
    const p = G.player; p.x = RX; p.y = RY; p.ang = -Math.PI / 2; p.vx = 0; p.vy = -90;
    G.cam.x = p.x - VW / 2; G.cam.y = p.y - VH / 2;
    const w = new Tumbleweed(RX, RY - 6, 0, 0);
    G.weeds.length = 0; G.weeds.push(w);
    const e0 = G.earned, l0 = G.levelEarned, fx0 = runScript('Fx.ps.length'), h0 = G.heat;
    Input.down = Object.create(null); Input.down.KeyW = true;
    let wob = 0;
    for (let i = 0; i < 6; i++) { G.update(1 / 60); Input.endFrame(); wob = Math.max(wob, p.wobble || 0); }
    ok(!G.weeds.includes(w) || w.dead, 'driving through a tumbleweed bursts it');
    ok(runScript('Fx.ps.length') > fx0 + 4, `into twigs (${runScript('Fx.ps.length') - fx0} particles)`);
    ok(wob > 0.3 && wob <= 0.4, `and the car wobbles for about 0.4s (${wob.toFixed(2)})`);
    ok(G.earned === e0 && G.levelEarned === l0 && G.heat <= h0, 'with no fine and no heat');
    ok(p.y < RY - 6, `and nothing solid: the car drove on through (${(RY - p.y).toFixed(1)}px)`);
    Input.down = Object.create(null);
  }

  /* --- Review Focus 2: the demo on a windy level still delivers --- */
  const pin = G.demoPin;
  let runs = 0, delivered = 0;
  try {
    G.demoPin = 5;
    for (let r = 0; r < 10; r++) {
      reset(); G.toDemo(); runs++;
      const d0 = G.stats.delivered;
      for (let i = 0; i < ATTRACT.demo.seconds * 60 && G.state === 'demo'; i++) { G.update(1 / 60); Input.endFrame(); }
      if (G.stats.delivered > d0) delivered++;
    }
  } finally { G.demoPin = pin; }
  console.log(`  --    windy demo (level 5): a delivery in ${delivered} of ${runs} ${ATTRACT.demo.seconds}s runs`);
  ok(G.windy !== undefined && delivered >= 6, `the attract demo on windy level 5 still delivers in most runs (${delivered}/${runs})`);

  reset(); G.toTitle();
  ok(!!Wind && Wind.on === false && weeds().length === 0, 'the title is calm');
}

/* Task 8 (0.9.3): Mode C on a landscape phone puts ghost controls in the side
   margins, outside the game picture (concept C, owner rulings 2026-11-08: the
   stick at the vertical middle of the left margin, TOSS / GAS / REV centred on
   the right, the kitchen with no controls but pause). Pad.layout is pure and
   in CSS px; hit-testing and drawing both read it. Everything else -- Modes A
   and B, and Mode C in portrait -- must draw exactly as it did. */
console.log('\n— touch layout —');
{
  const { readFileSync, existsSync } = await import('node:fs');
  const Pad = KX.Pad, Hud = runScript('Hud'), MMv = runScript('MM');
  const MMPX = 160 / 25.4;                  // CSS px per mm: on Android 1 CSS px is 1 dp, 1/160 in
  const Z = { top: 0, right: 0, bottom: 0, left: 0 };
  const has = typeof Pad.layout === 'function';
  const lay = (vw, vh, dpr, ins, mode, context) => (has ? Pad.layout(vw, vh, dpr, ins || Z, { mode, context }) : null);
  const cl = (v, a, b) => Math.max(a, Math.min(b, v));
  const hitsRect = (c, r) => Math.hypot(c.cx - cl(c.cx, r.x, r.x + r.w), c.cy - cl(c.cy, r.y, r.y + r.h)) < c.r;
  const c80 = (p) => ({ x: p.x + p.w * 0.1, y: p.y + p.h * 0.1, w: p.w * 0.8, h: p.h * 0.8 });
  const inView = (c, vw, vh) => c.cx - c.r >= -0.01 && c.cx + c.r <= vw + 0.01 && c.cy - c.r >= -0.01 && c.cy + c.r <= vh + 0.01;
  const circles = (L) => [L.stick, ...L.buttons, L.pause].filter(Boolean);
  const apart = (a, b) => Math.hypot(a.cx - b.cx, a.cy - b.cy) >= a.r + b.r;

  /* --- the Pixel 10 in landscape, the estimate from reference/touch-concepts/NOTE.md --- */
  const P = lay(923, 411, 2.625, Z, 'C', 'drive');
  ok(!!P && P.landscape === true, 'Pixel 10 landscape (923x411 @2.625) gets the margin layout');
  if (P && P.landscape) {
    const pic = P.picture;
    ok(pic.h >= 411 - VH * 0.05 && pic.h <= 411 && Math.abs(pic.w / pic.h - VW / VH) < 1e-9,
       `the picture fills the height (${pic.w.toFixed(1)}x${pic.h.toFixed(1)})`);
    ok(Math.abs(pic.x - (923 - pic.w) / 2) < 0.01 && Math.abs(pic.y - (411 - pic.h) / 2) < 0.01, 'the picture is centred, as #stage centres the canvas');
    ok(!!P.stick && Math.abs(P.stick.cy - 411 / 2) <= 1, `the stick is centred vertically (cy ${P.stick && P.stick.cy.toFixed(1)}, vh/2 ${411 / 2})`);
    /* "fully left of the picture" cannot hold at 17 mm: the margin is 96.7 CSS
       px, 15.3 mm, so concept C bleeds the stick onto the picture's edge. The
       guard is that its centre is in the margin and it stays off the centre 80%. */
    ok(!!P.stick && P.stick.cx < pic.x && !hitsRect(P.stick, c80(pic)),
       `the stick sits in the left margin, clear of the picture's centre 80% (right edge ${P.stick && (P.stick.cx + P.stick.r).toFixed(1)}, picture ${pic.x.toFixed(1)})`);
    ok(!!P.stick && 2 * P.stick.r >= 17 * MMPX, `the stick is at least 17 mm across (${P.stick && (2 * P.stick.r / MMPX).toFixed(1)} mm)`);
    ok(!!P.stick && Math.abs(P.stick.cx - P.stick.r - 2.5 * MMPX) < 0.5, 'and 2.5 mm off the left edge');
    const ids = P.buttons.map((b) => b.id).join(',');
    ok(ids === 'toss,gas,rev', `TOSS, GAS and REV, top to bottom, on the right (${ids})`);
    ok(P.buttons.every((b) => b.cx > pic.x + pic.w && !hitsRect(b, c80(pic))), 'every button is centred in the right margin, clear of the centre 80%');
    const top = Math.min(...P.buttons.map((b) => b.cy - b.r)), bot = Math.max(...P.buttons.map((b) => b.cy + b.r));
    ok(Math.abs((top + bot) / 2 - 411 / 2) <= 1, `the three are centred vertically as a group (${top.toFixed(1)}..${bot.toFixed(1)})`);
    const mm = (id) => { const b = P.buttons.find((q) => q.id === id); return b ? 2 * b.r / MMPX : 0; };
    ok(Math.abs(mm('gas') - 15) < 0.1 && Math.abs(mm('toss') - 12.7) < 0.1 && Math.abs(mm('rev') - 10) < 0.1,
       `sizes from mm: GAS ${mm('gas').toFixed(1)}, TOSS ${mm('toss').toFixed(1)}, REV ${mm('rev').toFixed(1)}`);
    ok(Math.max(...P.buttons.map((b) => b.cx + b.r)) <= 923 - 2.5 * MMPX + 0.5, 'and 2.5 mm off the right edge');
    ok(P.buttons.every((a, i) => P.buttons.every((b, j) => i === j || apart(a, b))), 'no two buttons overlap');
    ok(!!P.pause && P.pause.cx + P.pause.r <= pic.x && circles(P).every((c) => inView(c, 923, 411)),
       'PAUSE sits in the left margin, and every control is on the screen');
    ok(!!P.pause && apart(P.pause, P.stick), 'PAUSE does not overlap the stick');

    /* the camera cutout: controls stay inside the safe area */
    const I = lay(923, 411, 2.625, { top: 0, right: 0, bottom: 0, left: 40 }, 'C', 'drive');
    ok(!!I && Math.abs(I.stick.cx - P.stick.cx - 40) < 0.01 && Math.abs(I.pause.cx - P.pause.cx - 40) < 0.01, 'a 40px left inset moves the stick and PAUSE in by 40px');
    const Ir = lay(923, 411, 2.625, { top: 0, right: 30, bottom: 0, left: 0 }, 'C', 'drive');
    ok(!!Ir && Ir.buttons.every((b, i) => Math.abs(b.cx - P.buttons[i].cx + 30) < 0.01), 'a 30px right inset moves the buttons in by 30px');

    /* the minimap: a free corner in Mode C, never under the stick, never on the windsock (Ledger Ruling 1) */
    ok(typeof Hud.mapRect === 'function', 'Hud.mapRect says where the minimap is');
    if (typeof Hud.mapRect === 'function') {
      const m = Hud.mapRect(), s = pic.w / VW;
      const css = { x: pic.x + (m.x - 2) * s, y: pic.y + (m.y - 2) * s, w: (m.w + 4) * s, h: (m.h + 4) * s };
      ok(!hitsRect(P.stick, css) && P.buttons.every((b) => !hitsRect(b, css)), `the minimap is not under the stick or a button (${JSON.stringify(m)})`);
      const sk = Hud.sockRect(false);
      const ov = !(sk.x + sk.w <= m.x - 2 || m.x + m.w + 2 <= sk.x || sk.y + sk.h <= m.y - 2 || m.y + m.h + 2 <= sk.y);
      ok(!ov, `the windsock and the minimap do not overlap (${JSON.stringify(sk)})`);
      ok(m.x === 4 && m.y === VH - MMv - 4 && m.w === MMv, 'the minimap is in the bottom-left corner (the stick, now mid-height, left it free)');
    }
  }

  /* --- other phones and windows: never on the picture's centre 80%, never off the screen --- */
  for (const [vw, vh, dpr] of [[914, 410, 3.125], [921, 414, 3.25], [740, 360, 3], [800, 360, 2], [640, 360, 2], [1280, 720, 1], [1920, 1080, 1], [2000, 800, 1], [1600, 1000, 1]]) {
    const L = lay(vw, vh, dpr, Z, 'C', 'drive');
    const okL = !!L && L.landscape && L.stick && L.buttons.length === 3 && circles(L).every((c) => !hitsRect(c, c80(L.picture)) && inView(c, vw, vh))
      && Math.abs(L.stick.cy - vh / 2) <= 1 && L.picture.h <= vh && L.picture.w <= vw;
    ok(okL, `${vw}x${vh} @${dpr}: controls clear of the picture's centre 80% and on the screen` +
       (L && L.picture ? ` (picture ${L.picture.w.toFixed(0)}x${L.picture.h.toFixed(0)})` : ''));
  }

  /* --- the Kitchen Shift: the player taps the bins; only PAUSE --- */
  const K = lay(923, 411, 2.625, Z, 'C', 'kitchen');
  ok(!!K && K.landscape && !K.stick && K.buttons.length === 0 && !!K.pause, 'the Kitchen Shift has no stick and no buttons, only PAUSE');
  ok(!!K && !!P && JSON.stringify(K.picture) === JSON.stringify(P.picture), 'and the same picture, so nothing jumps between shifts');

  /* --- portrait, and Modes A and B: today's layout --- */
  const Po = lay(411, 923, 2.625, Z, 'C', 'drive');
  ok(!!Po && Po.landscape === false && !!Po.stick && Po.stick.cx === Pad.STICK.x && Po.stick.cy === Pad.STICK.y && Po.stick.r === Pad.STICK.r,
     'portrait (411x923) keeps today\'s on-canvas stick');
  ok(!!Po && Po.buttons.length === 3 && Po.buttons.every((b) => { const B = Pad.BTN[b.id]; return B && b.cx === B.x && b.cy === B.y && b.r === B.r; }),
     'and today\'s buttons');
  ok(!!Po && !!Po.pause && Po.pause.x === Pad.PAUSE.x && Po.pause.y === Pad.PAUSE.y && Po.pause.w === Pad.PAUSE.w, 'and today\'s PAUSE');
  for (const m of ['A', 'B']) {
    const L = lay(923, 411, 2.625, Z, m, 'drive');
    ok(!!L && L.landscape === false && !L.stick && L.buttons.length === 0 && Math.abs(L.scale - 1.9) < 1e-9, `Mode ${m} in landscape: no overlay, today's fit (scale ${L && L.scale})`);
  }

  /* --- Modes A, B and C portrait draw exactly as before; C landscape draws nothing on the picture --- */
  const rec = () => {
    const log = [];
    const fmt = (v) => (v && typeof v === 'object' ? (v.width ? 'img' + v.width + 'x' + v.height : 'o') : typeof v === 'number' ? +v.toFixed(3) : String(v));
    const o = { globalAlpha: 1, fillStyle: '#000', strokeStyle: '#000', lineWidth: 1, imageSmoothingEnabled: false, canvas: {}, measureText: () => ({ width: 0 }),
                createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }) };
    const x = new Proxy(o, {
      get(t, k) { if (k in t) return t[k]; return (...a) => { log.push(String(k) + '(' + a.map(fmt).join(',') + ')'); }; },
      set(t, k, v) { t[k] = v; log.push(String(k) + '=' + fmt(v)); return true; },
    });
    return { x, log };
  };
  const m0 = Pad.mode, lay0 = Pad._lay;
  G.startShift();
  const hudLog = () => { const r = rec(); Hud.draw(r.x, G); return r.log.join('\n'); };
  const padLog = () => { const r = rec(); Pad.draw(r.x, 'drive'); return r.log.join('\n'); };
  const relay = (vw, vh, dpr) => { if (typeof Pad.relayout === 'function') Pad.relayout(vw, vh, dpr, Z); };
  Pad.setMode('A'); Pad._lay = null;
  const hudA = hudLog();
  for (const m of ['A', 'B']) {
    Pad.setMode(m); Pad._lay = null;
    const h0 = hudLog(), p0 = padLog();
    relay(923, 411, 2.625);
    ok(hudLog() === h0 && padLog() === p0 && p0 === '', `Mode ${m}: the HUD draws the same with a landscape layout as without one`);
    relay(411, 923, 2.625);
    ok(hudLog() === h0 && padLog() === p0, `Mode ${m}: ...and with a portrait one`);
  }
  Pad.setMode('C'); Pad._lay = null;
  const hC = hudLog(), pC = padLog();
  relay(411, 923, 2.625);
  ok(hudLog() === hC && padLog() === pC && pC.includes('drawImage'), 'Mode C portrait draws exactly as before: the same HUD and the on-canvas controls');
  ok(hC !== hudA, '(and that HUD is the Mode C one, with the bag moved up)');
  relay(923, 411, 2.625);
  ok(typeof Pad.onCanvas === 'function' && Pad.onCanvas() === false, 'Mode C landscape: the controls are not on the canvas');
  ok(padLog() === '', 'Mode C landscape draws no controls on the game picture');
  ok(hudLog() === hudA, 'Mode C landscape: the HUD is the keyboard one (bag, windsock and edge arrow back where Mode A has them)');

  /* --- hit-testing in CSS px, before the game's clamped mapping --- */
  if (P && typeof Pad.relayout === 'function') {
    Pad.relayout(923, 411, 2.625, Z);
    const L = Pad._lay, gas = L.buttons.find((b) => b.id === 'gas'), toss = L.buttons.find((b) => b.id === 'toss');
    Input.down = Object.create(null); Input.hit = Object.create(null); Input.mhit = false;
    const step = (ctx) => { Pad.poll(ctx, 1 / 60); };
    let id = 900;
    const touch = (x, y) => { const i = id++; Pad._push('s', i, x, y); return i; };
    let t = touch(gas.cx, gas.cy); step('drive');
    ok(Input.down.KeyW === true, 'a thumb on GAS, in the right margin, holds KeyW');
    Pad._push('e', t, gas.cx, gas.cy); step('drive');
    ok(!Input.down.KeyW, 'and letting go releases it');
    t = touch(30, 411 / 2); Pad._push('m', t, 30 + L.stick.r, 411 / 2); step('drive');
    ok(Input.down.ArrowRight === true && !Input.down.ArrowLeft, 'a thumb in the left margin, dragged right, steers right');
    Pad._push('e', t, 30 + L.stick.r, 411 / 2); step('drive');
    t = touch(toss.cx, toss.cy); step('drive');
    ok(Pad.aiming === true, 'TOSS in the margin starts the aim');
    const ax0 = Pad.aimX;
    Pad._push('m', t, toss.cx - 20, toss.cy); step('drive');
    ok(Pad.aimX < ax0 - 1, `dragging inside the margin moves the reticle (the margin is not clamped to the picture's edge: ${ax0.toFixed(1)} -> ${Pad.aimX.toFixed(1)})`);
    Pad._push('e', t, toss.cx - 20, toss.cy); step('drive');
    ok(Pad.throwNow === true && Pad.aiming === false, 'and letting go throws');
    Input.endFrame();
    t = touch(L.pause.cx, L.pause.cy); step('drive');
    ok(Input.hit.KeyP === true, 'PAUSE in the margin pauses'); Pad._push('e', t, L.pause.cx, L.pause.cy); Input.endFrame();
    step('kitchen'); Input.endFrame(); Input.mhit = false;
    t = touch(gas.cx, gas.cy); step('kitchen');
    ok(!Input.mhit && !Input.down.KeyW, 'in the kitchen, a touch in the margin is not a tap on the edge bin');
    Pad._push('e', t, gas.cx, gas.cy); step('kitchen'); Input.endFrame();
    t = touch(L.pause.cx, L.pause.cy); step('kitchen');
    ok(Input.hit.KeyP === true, 'PAUSE still pauses the kitchen'); Pad._push('e', t, L.pause.cx, L.pause.cy); step('kitchen'); Input.endFrame();
    t = touch(461, 200); step('kitchen');
    ok(Input.mhit === true, 'and a touch on the picture is still a tap');
    Pad._push('e', t, 461, 200); step('kitchen'); Input.endFrame();
    step('menu'); Input.endFrame();
    t = touch(gas.cx, gas.cy); step('menu');
    ok(Input.hit.Enter === true || Input.anyKey === true, 'on a card, a touch on a ghost control is "any key"');
    Pad._push('e', t, gas.cx, gas.cy); step('menu'); Input.endFrame();
    Input.down = Object.create(null); Input.mhit = false;
  }
  Pad.setMode(m0); Pad._lay = lay0;
  G.toTitle();

  /* --- the page: near-native on a phone, the single file still self-contained --- */
  const shell = readFileSync('shell.html', 'utf8'), dev = readFileSync('index.html', 'utf8'), ship = readFileSync('taco-shop.html', 'utf8');
  ok(/viewport-fit=cover/.test(dev), 'the dev page\'s viewport covers the cutout (viewport-fit=cover)');
  ok(/overscroll-behavior:\s*none/.test(shell) && /#stage\{[^}]*touch-action:\s*none/.test(shell), 'no pull-to-refresh, no double-tap zoom (overscroll-behavior, touch-action on #stage)');
  ok(/env\(safe-area-inset/.test(ship), 'the safe-area insets are read');
  ok(!/rel=["']?manifest/i.test(ship) && !/webmanifest/i.test(ship), 'taco-shop.html links no manifest (that is deploy-only)');
  const src90 = readFileSync('src/90_main.js', 'utf8');
  ok(/requestFullscreen/.test(src90) && /orientation\.lock\(\s*'landscape'\s*\)/.test(src90) && /wakeLock\.request\(\s*'screen'\s*\)/.test(src90),
     'full screen, the landscape lock and the wake lock are asked for');
  const TS_ = sandbox.window.TacoShop;
  ok(!!TS_ && typeof TS_.layoutInfo === 'function', 'window.TacoShop.layoutInfo() reports the viewport for remote debugging');
  if (TS_ && typeof TS_.layoutInfo === 'function') {
    const li = TS_.layoutInfo();
    ok(['innerWidth', 'innerHeight', 'devicePixelRatio', 'insets', 'layout'].every((k) => k in li), `it has innerWidth, innerHeight, devicePixelRatio, insets and layout (${Object.keys(li).join(', ')})`);
  }
  let man = null;
  try { man = JSON.parse(readFileSync('deploy/manifest.webmanifest', 'utf8')); } catch (e) { man = null; }
  ok(!!man && man.display === 'fullscreen' && man.orientation === 'landscape', 'deploy/manifest.webmanifest: display fullscreen, landscape');
  const png = (f) => { try { const b = readFileSync(f); return b.readUInt32BE(16) + 'x' + b.readUInt32BE(20); } catch (e) { return null; } };
  ok(png('deploy/icon-192.png') === '192x192' && png('deploy/icon-512.png') === '512x512', `the icons are 192 and 512 (${png('deploy/icon-192.png')}, ${png('deploy/icon-512.png')})`);
  ok(!!man && Array.isArray(man.icons) && ['192x192', '512x512'].every((s) => man.icons.some((i) => i.sizes === s && existsSync('deploy/' + i.src))), 'and the manifest names them');
}

console.log('\n— copy —');
const dl = KX.DIALOGUE;
{
  const { Dialog: Dg, FACES: FC } = KX;
  const widest = Object.keys(FC).reduce((m, k) => (FC[k].w > FC[m].w ? k : m), Object.keys(FC)[0]);
  const rows = (s, face) => Dg.wrap(s.replace(/^\d\|/, ''), face).length;
  let bad = 0, total = 0;
  const chk = (s, face) => { total++; if (rows(s, face) > 2) { bad++; console.log('    over two rows: ' + s); } };
  for (const k of Object.keys(dl)) if (Array.isArray(dl[k])) for (const s of dl[k]) if (typeof s === 'string') chk(s, widest);
  for (const f of Object.keys(dl.people || {})) for (const m of Object.keys(dl.people[f])) if (Array.isArray(dl.people[f][m])) for (const s of dl.people[f][m]) chk(s, f);
  for (const c of Object.values(dl.cast || {})) for (const m of Object.keys(c.lines)) for (const s of c.lines[m]) chk(s, c.face);
  ok(total > 100 && bad === 0, 'every shared, personal and cast line wraps to at most two rows (' + total + ' checked, ' + bad + ' over)');
}
for (const b of ['ORDER UP!', 'WALKOUT!', '+1:30 EXTENSION', 'LEVEL 20 CLEAR!'])
  ok(textW(b, 2) + 16 <= VW || textW(b, 3) <= VW, `"${b}" fits`);

console.log(`\n${fails === 0 ? 'PASS' : 'FAIL (' + fails + ')'}  —  ${opCount().toLocaleString()} draw calls exercised`);
process.exit(fails ? 1 : 0);
