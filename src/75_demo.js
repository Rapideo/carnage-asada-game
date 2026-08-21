/* ============================================================
   DEMO  --  the attract-mode driver: the game plays itself
   ============================================================ */
'use strict';

/* Nothing here is scripted or faked. It sets the same throttle/steer/hb
   fields Player.control() would, so the demo car runs the real physics, the
   real collision response and the real traffic. Steering and the obstacle
   probe deliberately mirror Cop.update — that logic already works against
   this city, and a second hand-tuned version would only drift from it.

   Note Player.update treats `throttle` as a SIGN, not a magnitude, so easing
   off is throttle 0 (coast) rather than a fraction. */
const Demo = {
  wedgeT: 0, esteer: 1, throwCd: 0, hold: false,

  reset(p) { this.wedgeT = 0; this.esteer = 1; this.throwCd = 0; this.hold = false; },

  drive(dt, G) {
    const p = G.player;
    if (p.spinT > 0) { p.throttle = 0; p.steer = 0; p.hb = false; return; }
    if (!Nav.goal) { p.throttle = 0; p.steer = 0; p.hb = false; return; }

    /* ---- pick a target a car can actually occupy ----
       Never Nav.goal on arrival: that is the porch, which sits in the front
       yard. Steering at it drives the car off the road and wedges it on the
       house, a bush or a hydrant. Houses carry a `curb` point — the spot on
       the street outside — which is where a player stops to throw. */
    let tx, ty;
    if (Nav.route.length && !Nav.arriving) {
      const n = Nav.route[0];
      tx = City.nodeX(n[0]); ty = City.nodeY(n[1]);
    } else if (G.needPickup) {
      tx = City.shop.dock.x; ty = City.shop.dock.y;
    } else if (G.order) {
      tx = G.order.house.curb.x; ty = G.order.house.curb.y;
    } else {
      tx = Nav.goal.x; ty = Nav.goal.y;
    }
    // Off the street, getting back on it beats making progress. This must use
    // classify(), NOT surfaceAt(): parking lots and shop aprons are surfaced
    // S_ROAD, so a surface test lets the car cut across lots full of solid
    // parked cars. Suspended near the target, since the shop's own dock is on
    // an apron rather than a street.
    const onStreet = (wx, wy) => {
      const c = classify((wx / TS) | 0, (wy / TS) | 0);
      return c === T_ROAD || c === T_INTER;
    };
    if (hyp(tx - p.x, ty - p.y) > 70 && !onStreet(p.x, p.y)) {
      tx = City.nodeX(City.nearNodeX(p.x));
      ty = City.nodeY(City.nearNodeY(p.y));
    }
    let want = Math.atan2(ty - p.y, tx - p.x);

    /* ---- crude obstacle probe, same shape as the cop's ---- */
    // Lookahead scales with speed — a fixed 34px is only 0.3s of warning at
    // cruise, which is not enough to steer around a hydrant before clipping
    // it. The two splayed feelers catch corners the centre ray misses.
    const probe = (a, d) => City.isSolid(p.x + Math.cos(a) * d, p.y + Math.sin(a) * d);
    const look = 22 + p.speed * 0.28;
    if (probe(p.ang, look) || probe(p.ang + 0.25, look * 0.8) || probe(p.ang - 0.25, look * 0.8)) {
      const l = probe(p.ang - 0.7, 30), r = probe(p.ang + 0.7, 30);
      want = p.ang + (l && !r ? 0.9 : r && !l ? -0.9 : 1.2);
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
    p.throttle = p.speed < 34 ? 1
               : (Math.abs(err) > 1.2 || p.speed > 115) ? 0 : 1;

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
    // decay rather than reset: a wedged car jiggles, and a hard reset on any
    // single fast frame let it oscillate below the threshold indefinitely
    if (p.throttle > 0 && p.speed < 20) this.wedgeT += dt;
    else this.wedgeT = Math.max(0, this.wedgeT - dt * 0.5);
    if (this.wedgeT > 1.2) { p.throttle = -1; p.steer = this.esteer; }
    if (this.wedgeT > 2.5) {
      p.x = City.nodeX(City.nearNodeX(p.x));
      p.y = City.nodeY(City.nearNodeY(p.y));
      p.vx = p.vy = 0;
      this.wedgeT = 0; this.esteer = -this.esteer;
    }
  },
};
