/* ============================================================
   DEMO  --  the attract-mode driver: the game plays itself
   ============================================================ */
'use strict';

/* Nothing here is scripted or faked. It sets the same throttle/steer/hb
   fields Player.control() would, so the demo car runs the real physics, the
   real collision response and the real traffic.

   It follows a LANE, not a list of points, and that distinction is the whole
   design. Nav.route is a list of intersection centres. Steering straight at
   the next one -- which is what this did for months -- fails twice over:

     - it cuts every corner, because from 190px out the aim point is on the
       far side of the junction, so the turn starts in the middle of the
       block and crosses the sidewalk;
     - it rides the centreline, because at that range an 8px lateral drift is
       a 2 degree correction, which the car never makes.

   Worse, Nav will not retire a node the car has driven past. Nav.recompute
   drops the head node when the car is closer to the SECOND node than the two
   nodes are to each other; on a straight that fires 12px past the node, but
   on a TURN the second node is perpendicular and a full PITCH away wherever
   the car is, so the head node is never dropped. Measured over 12 minutes of
   attract mode, the old driver spent 38.8% of its frames steering at a point
   BEHIND the car -- 85px behind on average, for up to 9 seconds at a stretch
   -- and 34.9% steering at a point closer than 24px, where atan2 swings
   wildly and clamp(err * 2.2) saturates the wheel. It was off the tarmac
   25.7% of the time.

   Retiring passed nodes on its own makes it WORSE (measured: 32.0% off the
   tarmac, grass time from 2.9% to 8.3%), because the node you advance to is
   around a corner and driving straight at it crosses the block. The two
   halves only work together: turn the route into a polyline of LANE centres
   -- via Traffic.laneFixed, the same right-hand-traffic rule the traffic
   itself obeys -- and pursue a point a short way along it.

   Note Player.update treats `throttle` as a SIGN, not a magnitude, so easing
   off is throttle 0 (coast) rather than a fraction. */
const Demo = {
  wedgeT: 0, esteer: 1, throwCd: 0, hold: false, path: [], pathKey: '',
  progX: 0, progY: 0, progT: 0,

  reset(p) {
    this.wedgeT = 0; this.esteer = 1; this.throwCd = 0; this.hold = false;
    this.path = []; this.pathKey = '';
    this.progX = p ? p.x : 0; this.progY = p ? p.y : 0; this.progT = 0;
  },

  /* ---- the route, as lane centres --------------------------
     A car travelling `dir` along a road sits at Traffic.laneFixed(perp, dir)
     on the cross axis, where `perp` is the index of the perpendicular road.
     Two consecutive legs are perpendicular, so their lane centrelines cross
     at exactly one point, and that crossing IS the corner to drive round.
     Left and right turns fall out of it with no special case -- the same
     trick Traffic uses for its own turns.

     Note what is deliberately NOT in the polyline: the node the car is
     sitting on. Corners are emitted between PAIRS of legs, so the first one
     lands on the next junction ahead, and the passed-node problem never
     arises for the body of the route. Only the head node needs handling, and
     it gets it below. */
  buildPath(p, G) {
    const r = Nav.route;
    // the head corner depends on which way the car is pointing, so the
    // cached path has to be invalidated when that changes, not just when
    // the route does
    const head = Math.abs(Math.cos(p.ang)) >= Math.abs(Math.sin(p.ang))
      ? (Math.cos(p.ang) >= 0 ? 'E' : 'W') : (Math.sin(p.ang) >= 0 ? 'S' : 'N');
    const key = r.map((n) => n[0] + ',' + n[1]).join('|') +
                '#' + head + (G.needPickup ? 'p' : '') +
                (G.order ? G.order.house.curb.x + ',' + G.order.house.curb.y : '');
    if (key === this.pathKey) return;
    this.pathKey = key;

    const end = G.needPickup ? City.shop.dock
              : G.order      ? G.order.house.curb
              :                Nav.goal;
    const pts = [];

    /* Built for EVERY route with a node in it, including the short ones and
       the arrival. The chain is axis-aligned end to end -- consecutive route
       nodes are adjacent, and a kerb is by construction on the street its
       own node sits on -- which is the property `aim` relies on to tell the
       along-lane axis from the lateral error. Skipping the build for short
       routes left a single far, diagonal point to project against, and the
       projection axis then came out of a coin toss. */
    if (r.length >= 1) {
      /* every leg of the route, plus a final one from the last node to the
         delivery kerb -- the kerb is up to half a block off the last node
         and can sit on a perpendicular street, which needs a corner too */
      const way = r.map((n) => ({ x: City.nodeX(n[0]), y: City.nodeY(n[1]) }));
      way.push({ x: end.x, y: end.y });
      const legs = [];
      for (let i = 0; i < way.length - 1; i++) {
        const a = way[i], b = way[i + 1];
        const dx = b.x - a.x, dy = b.y - a.y;
        if (Math.abs(dx) < 4 && Math.abs(dy) < 4) continue;
        const horiz = Math.abs(dx) >= Math.abs(dy);
        const dir = horiz ? (dx >= 0 ? 0 : 2) : (dy >= 0 ? 1 : 3);
        const perp = horiz ? City.nearNodeY(a.y) : City.nearNodeX(a.x);
        legs.push({ horiz, fixed: Traffic.laneFixed(perp, dir) });
      }

      /* the turn at the head node itself. The body of the route is covered
         by leg pairs, but the first leg has no predecessor -- so a route
         that turns at the node the car is on or has just passed would have
         no corner at all, and the car would strike out diagonally across
         the block. The car's own lane is the missing predecessor. */
      if (legs.length) {
        const choriz = head === 'E' || head === 'W';
        if (choriz !== legs[0].horiz) {
          const cdir = head === 'E' ? 0 : head === 'S' ? 1 : head === 'W' ? 2 : 3;
          const cfix = Traffic.laneFixed(choriz ? City.nearNodeY(p.y) : City.nearNodeX(p.x), cdir);
          pts.push(choriz ? { x: legs[0].fixed, y: cfix } : { x: cfix, y: legs[0].fixed });
        }
      }
      for (let i = 0; i < legs.length - 1; i++) {
        const u = legs[i], v = legs[i + 1];
        if (u.horiz === v.horiz) continue;              // straight on, no corner
        pts.push(u.horiz ? { x: v.fixed, y: u.fixed } : { x: u.fixed, y: v.fixed });
      }
    }
    pts.push({ x: end.x, y: end.y });
    this.path = pts;
  },

  /* ---- pure pursuit along that polyline --------------------
     Retire anything already passed, project the car sideways onto the lane
     it is supposed to be in, then walk a short distance along the polyline
     and steer at where that lands. The projection is what carries lateral
     error into the steering: aiming at a point 190px away cannot see an 8px
     drift, aiming at one 40px away turns it into a 12 degree correction. */
  aim(p) {
    const path = this.path;
    if (!path.length) return null;

    /* Retire a corner only once the car is genuinely past it, measured ALONG
       THE LEG IT LEADS INTO — never against the car's nose. A nose test looks
       right and is catastrophically wrong: the corner you are about to turn
       onto sits square to your heading, so its dot product with the nose is
       negative and the test throws away the very waypoint you were braking
       for. The path then collapses to the delivery kerb, which can be most of
       the map away and diagonal, and the car drives at it in a straight line.
       That single sign was worth 6 points of off-tarmac time on its own. */
    while (path.length > 1) {
      const w = path[0], n = path[1];
      const len = hyp(n.x - w.x, n.y - w.y) || 1;
      const ux = (n.x - w.x) / len, uy = (n.y - w.y) / len;
      const along = (p.x - w.x) * ux + (p.y - w.y) * uy;
      // ...and it must be ON that leg, not merely level with it. Distance
      // along alone is not enough: sitting 7px off-centre in a 16px lane
      // reads as 7px "past" a corner still 80px up the road, and retires it.
      const lateral = Math.abs((p.x - w.x) * -uy + (p.y - w.y) * ux);
      if ((along > 6 && lateral < 24) || hyp(w.x - p.x, w.y - p.y) < 14) path.shift();
      else break;
    }

    const first = path[0];
    const dx = first.x - p.x, dy = first.y - p.y;
    // close in -- and on the last approach to the kerb -- just go to it.
    // Projecting onto a lane makes no sense once the car is on top of it.
    if (hyp(dx, dy) < 40) return first;

    /* Legs are axis-aligned and `first` sits on the current leg's lane
       centreline, so projecting the car onto that centreline is just taking
       one coordinate from each. No need to re-derive laneFixed here. */
    const horiz = Math.abs(dx) >= Math.abs(dy);
    let cx = horiz ? p.x : first.x;
    let cy = horiz ? first.y : p.y;

    /* Lookahead has to stay near the car's own turning radius. Pure pursuit
       cuts a corner by roughly its lookahead, and the carriageway is only
       32px wide, so the 26 + speed * 0.34 this started life with (38px at
       the speed floor, 65px at the cap) put the car on the pavement at every
       junction -- measurably worse than the naive driver it replaced. At the
       corner speed the governor below enforces, the radius is ~24px. */
    let rem = 18 + p.speed * 0.20;                      // ~25px slow, ~40px fast
    for (let i = 0; i < path.length; i++) {
      const t = path[i];
      const d = hyp(t.x - cx, t.y - cy);
      if (d < 0.001) continue;
      if (d >= rem || i === path.length - 1) {
        const s = Math.min(rem, d) / d;
        return { x: cx + (t.x - cx) * s, y: cy + (t.y - cy) * s };
      }
      rem -= d; cx = t.x; cy = t.y;
    }
    return path[path.length - 1];
  },

  drive(dt, G) {
    const p = G.player;
    if (p.spinT > 0) { p.throttle = 0; p.steer = 0; p.hb = false; return; }
    if (!Nav.goal) { p.throttle = 0; p.steer = 0; p.hb = false; return; }

    this.buildPath(p, G);
    const a = this.aim(p);
    let tx = a ? a.x : Nav.goal.x, ty = a ? a.y : Nav.goal.y;

    // Off the street, getting back on it beats making progress. This must use
    // classify(), NOT surfaceAt(): parking lots and shop aprons are surfaced
    // S_ROAD, so a surface test lets the car cut across lots full of solid
    // parked cars. Suspended near the target, since the shop's own dock is on
    // an apron rather than a street.
    const onStreet = (wx, wy) => {
      const c = classify((wx / TS) | 0, (wy / TS) | 0);
      return c === T_ROAD || c === T_INTER;
    };
    const goal = this.path.length ? this.path[this.path.length - 1] : Nav.goal;
    const off = hyp(goal.x - p.x, goal.y - p.y) > 70 && !onStreet(p.x, p.y);
    if (off) {
      /* Head for the nearest CARRIAGEWAY, not the nearest junction. A junction
         is up to half a block away on BOTH axes, and the straight line to it
         runs diagonally through the middle of the block — houses, fences,
         parked cars — so aiming at one turns a clipped kerb into a car
         grinding across a back garden. Measured: 74% of the frames the demo
         spends slow under power are off the carriageway and two thirds of
         those are genuinely blocked. The nearest road is perpendicular, never
         more than half a block, and the way it came in. */
      const rx = City.nodeX(City.nearNodeX(p.x)), ry = City.nodeY(City.nearNodeY(p.y));
      if (Math.abs(rx - p.x) < Math.abs(ry - p.y)) { tx = rx; ty = p.y; }
      else                                         { tx = p.x; ty = ry; }
    }
    let want = Math.atan2(ty - p.y, tx - p.x);

    /* ---- crude obstacle probe, same shape as the cop's ---- */
    // Lookahead scales with speed — a fixed 34px is only 0.3s of warning at
    // cruise, which is not enough to steer around a hydrant before clipping
    // it. The two splayed feelers catch corners the centre ray misses.
    //
    // It BIASES the pursuit heading rather than replacing it. The old version
    // overwrote `want` with p.ang +- 1.2 rad, a 69 degree swing off whatever
    // the car was doing, which regularly pointed it clean off the carriageway
    // and was the start of a fifth of the mid-block excursions. Blending
    // keeps the lane in the answer: enough to miss a hydrant, not enough to
    // leave the road.
    const probe = (a2, d) => City.isSolid(p.x + Math.cos(a2) * d, p.y + Math.sin(a2) * d);
    const look = 22 + p.speed * 0.28;
    if (probe(p.ang, look) || probe(p.ang + 0.25, look * 0.8) || probe(p.ang - 0.25, look * 0.8)) {
      const l = probe(p.ang - 0.7, 30), r = probe(p.ang + 0.7, 30);
      const swing = l && !r ? 0.9 : r && !l ? -0.9 : 1.2;
      want = p.ang + clamp(angDiff(p.ang, want) + swing, -1.2, 1.2);
    }

    const err = angDiff(p.ang, want);
    p.steer = clamp(err * 2.2, -1, 1);
    p.hb = false;

    // Coast through hard turns and on the approach — throw spread scales with
    // speed, so arriving slowly is what lands the tosses. The speed floor is
    // essential, not a refinement: Player.update scales steering by speed, so
    // a stopped car cannot turn. Cut the throttle while pointed the wrong way
    // and it coasts to a halt, unable to steer, stuck for good. The floor also
    // means it never fully stops at the kerb, so it can always drive away.
    // Cruise between a floor and a cap rather than slowing at the target.
    // Slowing near the kerb made it orbit the point at walking pace and drift
    // into the yard; a real delivery driver throws on the move. The cap keeps
    // throw spread (speed/MAXSPD * 22) under ~14px against a 28px porch.
    //
    // And it slows FOR the corner rather than during it. The turn radius is
    // speed / (TURNRATE * (1 - 0.28 * speed / MAXSPD)): ~37px at 100 but
    // ~24px at 70. Worked against a 32px carriageway, a right turn — the
    // tight one, here as in life — only stays on the tarmac below about 70.
    // Left turns have room to spare. Cornering at the 115 cruise cap is what
    // put the lane-following driver on the pavement more often than the
    // naive one it replaced; no aim point can fix a speed the car cannot
    // turn at. Coast early, brake late, and only for a real corner — path[0]
    // is a corner whenever something follows it, since the last point is
    // always the destination.
    const corner = this.path.length > 1 ? hyp(this.path[0].x - p.x, this.path[0].y - p.y) : 1e9;
    p.throttle = p.speed < 34 ? 1
               : (off && p.speed > 55) ? 0
               : (Math.abs(err) > 1.2 || p.speed > 115) ? 0
               : (corner < 30 && p.speed > 82) ? -1
               : (corner < 64 && p.speed > 70) ? 0 : 1;

    /* ---- hold at a closed crossing ----
       The demo plays by the same rules as a player, which includes being
       allowed to run a gate. It should not: the attract loop showing the car
       flattened by a train reads as the game being broken, not as a hazard.

       Latched, deliberately. The test that STARTS the hold needs a direction
       of travel, and a stopped car has none — so unlatched it stops, stops
       detecting, creeps forward again under the speed floor above, and jitters
       into the gate instead of waiting behind it. */
    if (G.crossings) {
      let near = null;
      for (const c of G.crossings)
        if (Math.abs(c.x - p.x) < 34 && Math.abs(c.y - p.y) < 130) { near = c; break; }
      if (!near || !near.down) this.hold = false;
      else if (this.hold || (City.railY - p.y) * sign(p.vy || (ty - p.y)) > 24) this.hold = true;
      if (this.hold) {
        // brake to a stop, then coast. Never reverse: the road behind is live.
        p.throttle = p.fwdSpeed > 10 ? -1 : 0;
        p.steer = 0; p.hb = false;
        this.wedgeT = 0;                    // waiting is not wedging
      }
    }

    /* ---- toss once the porch is in range ---- */
    this.throwCd -= dt;
    if (G.order && !G.needPickup) {
      const r = G.order.house.porch;
      const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
      G.demoAim = { x: cx, y: cy };          // the reticle tracks the porch
      if (this.throwCd <= 0 && G.bag > 0 && hyp(cx - p.x, cy - p.y) < MAXTHROW * 0.8) {
        G.tryThrow();
        this.throwCd = 1.4;
      }
    }

    /* ---- wedge recovery ----
       A car under power that is not moving is jammed against geometry, and it
       cannot steer out because steering needs speed. Back out first; if that
       fails too, put it back on a road. In a city this full of props there is
       always a corner reversing cannot escape, so the hard reset has to exist. */
    /* Judged on PROGRESS over half a second, not on speed in a single frame.
       Both of the obvious per-frame signals fail here, and each failed for its
       own reason:

         - `speed < 20` misses the commonest case outright. A car grinding
           along a fence reads 21-29 and never trips it. Worse, when it does
           trip, any single frame that ticks over 20 decays the accumulator
           again, so a jiggling car oscillates below the threshold forever and
           the 2.5s hard reset never fires. One traced excursion ran 8.8s that
           way, creeping backwards along a wall the whole time. The defect is
           the ratchet, not the number.
         - `carBlocked` looked like the honest question — under power and
           refused by collision — but measured, it is never sustained on any
           build: 1.0% of frames, longest run 0.12s, because Player.update
           calls unwedge() every frame and depenetrates. It catches contact,
           not entrapment.

       Net displacement over a window catches what both miss, because a car
       that is genuinely stuck is not going anywhere by definition, whatever
       its speedometer says or whoever it is touching. Suspended near the
       target, where circling the dock is the job rather than a fault — the
       same exemption the off-street test above uses.

       20px in half a second is 40px/s, against a cruise of 70-115 and the
       traced grinder's 22, and the bar was swept rather than picked. It is the
       knee: every teleport is a visible jump, so a bar set too low buys nothing
       and one set too high buys jumps. Over twenty minutes, entrapments longer
       than four seconds against hard resets — 50px/s: 10 and 44. 40px/s: 7 and
       25. 30px/s: 9 and 14, but the worst grind climbs back to 14.9s. Against
       the speed test this replaced: 41 and 9. So this trades sixteen extra
       teleports for five sixths of the long entrapments, and halves the worst
       one from 16.8s to 9.1s, while off-tarmac time and deliveries both stay
       where they were. */
    this.progT += dt;
    if (this.progT >= 0.5) {
      const moved = hyp(p.x - this.progX, p.y - this.progY);
      const busy = hyp(goal.x - p.x, goal.y - p.y) < 70;
      if (moved < 20 && !busy) this.wedgeT += 0.5;
      // Decay matches the accumulation rate, and that symmetry was measured
      // rather than assumed. Halving it -- which is what the old per-frame
      // version did -- shortens the worst grind further, 11.3s to 7.2s, but
      // quadruples the hard resets, 10 to 47 over twenty minutes. A hard reset
      // teleports the car to the nearest junction, so that is one visible
      // disappearance every 25 seconds of attract mode, which is a worse thing
      // to watch than the grind it prevents.
      else this.wedgeT = Math.max(0, this.wedgeT - 0.5);
      this.progX = p.x; this.progY = p.y; this.progT = 0;
    }
    if (this.wedgeT > 1.2) { p.throttle = -1; p.steer = this.esteer; }
    if (this.wedgeT > 2.5) {
      p.x = City.nodeX(City.nearNodeX(p.x));
      p.y = City.nodeY(City.nearNodeY(p.y));
      p.vx = p.vy = 0;
      this.wedgeT = 0; this.esteer = -this.esteer;
      this.pathKey = '';                    // the teleport invalidates the path
      // and it is not progress: re-mark, or the jump counts as 190px of it
      this.progX = p.x; this.progY = p.y; this.progT = 0;
    }
  },
};
