/* CONCEPT 2 -- the art director's approved walls (2026-11-07 mockups), redrawn
   procedurally at game fidelity, plus small finishing touches to the dining
   room's line-up and service counter. Painted over Kitchen.buildBg()'s canvas.
   Throwaway: not game code. */
function conceptBg2(base, era, year, month) {
  const t = mkCanvas(VW, VH), x = t.x;
  x.drawImage(base, 0, 0);
  const INK = PAL.ink, SH = 'rgba(12,8,20,0.32)';
  const WALL_W = 248, WALL_H = 104;

  /* outlined block with a lit left edge and a shaded right edge -- the unit
     every piece of stock is built from */
  const blk = (bx, by, w, h, fill, hi, lo) => {
    R(x, INK, bx, by, w, h);
    R(x, fill, bx + 1, by + 1, w - 2, h - 2);
    if (hi) R(x, hi, bx + 1, by + 1, 1, h - 2);
    if (lo) R(x, lo, bx + w - 2, by + 1, 1, h - 2);
  };
  const band = (bx, by, w, col) => R(x, col, bx + 1, by, w - 2, 2);
  /* a can standing on baseline b */
  const can = (cx, b, w, h, body, stripe, lid) => {
    blk(cx, b - h, w, h, body, shade(body, 0.25), shade(body, -0.3));
    R(x, lid || '#a2a8b6', cx + 1, b - h, w - 2, 1);
    if (stripe) band(cx, b - h + ((h / 2) | 0) - 1, w, stripe);
  };
  const jar = (jx, b, w, h, fill, lid) => {
    R(x, INK, jx, b - h, w, h);
    R(x, lid, jx + 1, b - h + 1, w - 2, 2);
    R(x, fill, jx + 1, b - h + 3, w - 2, h - 4);
    R(x, shade(fill, 0.35), jx + 2, b - h + 4, 1, h - 6);
    for (let i = 0; i < 3; i++) R(x, shade(fill, -0.3), jx + 2 + ((i * 3) % (w - 4)), b - h + 5 + i * 3, 2, 1);
  };
  const bottle = (bx, b, h, fill, cap) => {
    R(x, INK, bx + 2, b - h, 3, 4); R(x, INK, bx, b - h + 4, 7, h - 4);
    R(x, cap, bx + 3, b - h + 1, 1, 2);
    R(x, fill, bx + 1, b - h + 5, 5, h - 6); R(x, shade(fill, 0.3), bx + 1, b - h + 5, 1, h - 6);
  };
  const squeeze = (bx, b, h, fill) => {
    R(x, INK, bx + 3, b - h, 2, 3); R(x, INK, bx + 1, b - h + 3, 6, 2); R(x, INK, bx, b - h + 4, 8, h - 4);
    R(x, '#f2e9d0', bx + 2, b - h + 4, 4, 1);
    R(x, fill, bx + 1, b - h + 5, 6, h - 6); R(x, shade(fill, 0.3), bx + 1, b - h + 5, 1, h - 6);
  };
  const carton = (bx, b, w, h, fill, stripe) => {
    blk(bx, b - h, w, h, fill, shade(fill, 0.2), shade(fill, -0.22));
    R(x, shade(fill, -0.12), bx + 1, b - h + 2, w - 2, 1);
    if (stripe) R(x, stripe, bx + 2, b - ((h / 2) | 0) - 1, w - 4, 2);
  };
  const shelf = (x0, x1, sy, top, face, under) => {
    R(x, SH, x0, sy + 4, x1 - x0, 2);
    R(x, INK, x0 - 1, sy - 1, x1 - x0 + 2, 5);
    R(x, top, x0, sy, x1 - x0, 1); R(x, face, x0, sy + 1, x1 - x0, 2);
    if (under) R(x, under, x0, sy + 3, x1 - x0, 1);
  };
  const post = (px, y0, y1, col) => {
    R(x, INK, px - 1, y0, 5, y1 - y0);
    R(x, col, px, y0, 3, y1 - y0); R(x, shade(col, 0.25), px, y0, 1, y1 - y0);
    for (let py = y0 + 3; py < y1 - 2; py += 4) R(x, shade(col, -0.45), px + 1, py, 1, 2);
  };

  /* ------------------------------------------------------------ wall */
  const grid = (y0, h, sz, fill, grout, lit) => {
    R(x, fill, 0, y0, WALL_W, h);
    for (let gy = y0; gy < y0 + h; gy += sz) { R(x, grout, 0, gy, WALL_W, 1); if (lit) R(x, lit, 0, gy + 1, WALL_W, 1); }
    for (let gx = 4; gx < WALL_W; gx += sz) R(x, grout, gx, y0, 1, h);
  };

  /* shared pieces, placed per era */
  let calX, calY, calW, calH, calBand, calInk, calPaper, signX, signY, signW, signH;

  if (era === 1) {
    /* '70s: cool enamel tile, galvanized shelving */
    grid(0, WALL_H, 10, '#8b9b8c', '#6c7b6e', '#9aab9c');
    const G0 = '#8f94a0';
    post(40, 56, 102, G0); post(195, 56, 102, G0);
    shelf(40, 198, 73, '#b4b9c4', G0, '#6a6e80');
    shelf(40, 198, 97, '#b4b9c4', G0, '#6a6e80');
    // top shelf: canned goods in a pyramid, jars, a bottle, an enamel pot
    const C = '#ece2c6', CR = '#b8442e';
    can(50, 73, 13, 9, C, CR); can(63, 73, 13, 9, C, CR); can(57, 64, 13, 8, C, CR);
    can(81, 73, 12, 13, C, CR); can(93, 73, 12, 13, C, CR);
    jar(106, 73, 11, 14, '#8a9a3a', '#3d6b33'); jar(118, 73, 11, 14, '#c0392b', '#3d6b33'); jar(130, 73, 10, 14, '#e0a030', '#3d6b33');
    bottle(143, 73, 19, '#3d6b33', '#d0b04a');
    can(154, 73, 12, 13, C, '#3d6b33'); R(x, '#3d6b33', 155, 67, 10, 1);
    // the enamel coffee pot
    blk(170, 56, 16, 17, '#ece2c6', '#fff8e4', '#c4b394'); R(x, '#2e4a7a', 171, 56, 14, 2); R(x, INK, 175, 53, 6, 3); R(x, '#2e4a7a', 176, 54, 4, 1);
    R(x, INK, 186, 59, 4, 9); R(x, '#ece2c6', 187, 60, 2, 7); R(x, INK, 186, 61, 2, 5);
    // bottom shelf: flour sacks, shell cartons, sheet pans, paper goods
    const sack = (sx) => {
      R(x, INK, sx + 1, 78, 19, 19); R(x, INK, sx, 80, 21, 17);
      R(x, '#d8c7a0', sx + 1, 81, 19, 15); R(x, '#d8c7a0', sx + 2, 79, 17, 2);
      R(x, '#e6d8b8', sx + 2, 81, 2, 14); R(x, '#b49e78', sx + 17, 81, 2, 15);
      R(x, '#b8442e', sx + 1, 87, 19, 2); R(x, '#b49e78', sx + 4, 79, 13, 1);
    };
    sack(48); sack(70);
    const shells = (by) => {
      blk(93, by, 35, 10, '#c98a4a', '#dca064', '#9e6a38');
      R(x, '#f0c03a', 107, by + 3, 8, 4); R(x, '#f0c03a', 109, by + 2, 4, 1); R(x, INK, 107, by + 7, 8, 1);
      R(x, '#b8442e', 97, by + 4, 6, 1); R(x, '#b8442e', 118, by + 4, 6, 1); R(x, '#b8442e', 97, by + 6, 6, 1); R(x, '#b8442e', 118, by + 6, 6, 1);
    };
    shells(78); shells(87);
    for (let i = 0; i < 3; i++) { const py = 86 + i * 4; R(x, INK, 129, py, 32, 4); R(x, '#c9cede', 130, py, 30, 1); R(x, '#8b8f9f', 131, py + 1, 28, 2); }
    blk(163, 80, 11, 17, '#d8c09a', '#e8d4b0', '#b49e78'); R(x, '#8a6849', 167, 80, 3, 1);
    for (let i = 0; i < 4; i++) blk(175, 83 + i * 3 + (i ? 0 : 0), 16, 4 + (i === 3 ? 2 : 0), '#d0b088', '#e0c49c', '#a88a64');
    calX = 7; calY = 63; calW = 27; calH = 34; calBand = '#b8442e'; calInk = '#55413b'; calPaper = '#e9d8b4';
    signX = 205; signY = 69; signW = 39; signH = 25;
  } else if (era === 2) {
    /* '80s: tile above, wood paneling below, wooden shelf boards */
    grid(0, 52, 7, '#6e7896', '#57607c', '#7c86a4');
    const WD = '#8e4c26', WG = '#6e3a1c', WL = '#a05a2e';
    R(x, WD, 0, 52, WALL_W, WALL_H - 52);
    for (let px = 0; px < WALL_W; px += 7) { R(x, WG, px, 55, 1, WALL_H - 55); R(x, WL, px + 1, 55, 1, WALL_H - 55); }
    const r2 = makeRng(1984);
    for (let i = 0; i < 60; i++) R(x, r2.chance(0.5) ? '#7e4220' : '#9a5630', r2.int(WALL_W), 57 + r2.int(45), 1, 3 + r2.int(8));
    R(x, INK, 0, 51, WALL_W, 1); R(x, '#c06a35', 0, 52, WALL_W, 1); R(x, '#a5582a', 0, 53, WALL_W, 2);   // chair rail
    const P = '#7a84a0';
    post(37, 55, 102, P); post(115, 55, 102, P); post(199, 55, 102, P);
    const board = (sy) => { shelf(40, 115, sy, '#d07a40', '#a5582a', '#6e3a1c'); shelf(119, 199, sy, '#d07a40', '#a5582a', '#6e3a1c'); };
    board(73); board(93);
    const RED = '#d0402c', BLU = '#2f5fc0', YEL = '#f0c030', CRM = '#ece2c6';
    // top shelf
    can(42, 73, 12, 15, RED, CRM); can(54, 73, 9, 10, RED, CRM); can(63, 73, 12, 14, BLU, CRM); can(75, 73, 7, 9, BLU, CRM);
    jar(84, 73, 8, 11, '#b09a30', '#3f3f4e'); jar(92, 73, 7, 11, '#d0602c', '#3f3f4e');
    bottle(99, 73, 17, '#c0392b', '#e8d4b0'); bottle(106, 73, 17, '#3d8a3d', '#e8d4b0');
    carton(121, 66, 18, 8, '#ecd8b0', RED); carton(121, 73, 18, 7, '#ecd8b0', BLU);
    blk(141, 58, 13, 15, '#f2ecdc', '#ffffff', '#c9c0a8'); R(x, '#c0392b', 142, 65, 11, 3); R(x, INK, 146, 56, 5, 3); R(x, '#f2ecdc', 147, 57, 3, 1);
    for (let i = 0; i < 3; i++) { const w = 22 - i * 4, px = 158 + i * 2, py = 69 - i * 4; R(x, INK, px, py, w, 4); R(x, '#c9cede', px + 1, py, w - 2, 1); R(x, '#9ba0b0', px + 1, py + 1, w - 2, 2); }
    for (let i = 0; i < 6; i++) { R(x, INK, 185, 59 + i * 2, 12, 2); R(x, i % 2 ? '#c0392b' : '#f2e9d0', 186, 59 + i * 2, 10, 1); }
    R(x, INK, 185, 71, 12, 2);
    // bottom shelf
    const canister = (cx, col) => { blk(cx, 78, 11, 15, CRM, '#fff8e4', '#c4b394'); R(x, '#c9cede', cx + 1, 78, 9, 1); R(x, col, cx + 1, 84, 9, 3); };
    canister(42, '#3d8a3d'); canister(53, '#c0392b'); canister(64, BLU); canister(75, YEL);
    carton(88, 93, 10, 16, RED, null); R(x, CRM, 90, 81, 6, 2);
    carton(97, 93, 9, 16, BLU, null); R(x, CRM, 99, 81, 5, 2);
    carton(105, 93, 9, 6, YEL, null); carton(105, 87, 9, 6, YEL, null);
    for (const [cx, col] of [[120, RED], [134, BLU], [148, YEL]]) { can(cx, 93, 8, 15, col, CRM); can(cx + 8, 93, 6, 9, col, CRM); }
    // a stockpot and a saucepan
    blk(163, 80, 20, 13, '#a2a8b6', '#c9cede', '#7c8292'); R(x, '#c9cede', 162, 79, 22, 2); R(x, INK, 171, 77, 4, 2); R(x, INK, 160, 82, 3, 2); R(x, INK, 183, 82, 3, 2);
    blk(186, 85, 12, 8, '#a2a8b6', '#c9cede', '#7c8292'); R(x, '#c9cede', 185, 84, 14, 2); R(x, INK, 191, 82, 3, 2);
    calX = 6; calY = 61; calW = 26; calH = 34; calBand = '#c0392b'; calInk = '#4e3739'; calPaper = '#e8d7b9';
    signX = 205; signY = 62; signW = 40; signH = 25;
  } else {
    /* '90s: cool blue laminate, purple epoxy shelving, molded totes, one poster */
    grid(0, WALL_H, 10, '#8d9cc4', '#7484ae', '#9cabd0');
    const P = '#5a5f74';
    for (const px of [33, 95, 163, 199]) post(px, 55, 102, P);
    shelf(32, 203, 74, '#c0b4f4', '#9a8ae6', '#5a4ab0');
    shelf(32, 203, 98, '#c0b4f4', '#9a8ae6', '#5a4ab0');
    const tote = (tx, b, w, h, fill, inside) => {
      for (const [k, c] of inside) { R(x, INK, tx + 2 + k, b - h - 3, 8, 5); R(x, c, tx + 3 + k, b - h - 2, 6, 3); }
      blk(tx, b - h, w, h, '#7cb4e8', '#a8d0f4', '#5a8ec4'); R(x, '#4a78b0', tx + (w >> 1) - 3, b - h + 4, 6, 1);
    };
    const CRM = '#f2ecdc';
    // top shelf
    can(38, 74, 12, 15, CRM, '#c0392b'); can(51, 74, 12, 15, CRM, '#3fa35a');
    tote(67, 74, 27, 9, null, [[0, '#d0428a'], [10, '#f0c030']]);
    squeeze(99, 74, 18, '#e0402c'); squeeze(108, 74, 18, '#f0c030'); squeeze(117, 74, 18, '#3fa35a');
    for (const [cx, col] of [[129, '#4a8fd0'], [140, '#c0392b'], [151, '#3fa35a']]) { blk(cx, 59, 11, 15, CRM, '#ffffff', '#c9c0a8'); R(x, col, cx + 1, 63, 9, 2); R(x, INK, cx + 2, 58, 7, 1); }
    for (let i = 0; i < 2; i++) { const py = 61 + i * 6; R(x, INK, 168, py, 22, 6); R(x, '#c9cede', 169, py, 20, 1); R(x, '#9ba0b0', 169, py + 1, 20, 4); R(x, INK, 190, py + 1, 6, 2); }
    // bottom shelf
    const stripes = (sx, sy, cols) => { blk(sx, sy, 23, 9, CRM, '#ffffff', '#c9c0a8'); R(x, cols, sx + 1, sy + 3, 21, 2); };
    stripes(38, 80, '#c0392b'); stripes(38, 89, '#3fa35a');
    carton(61, 98, 12, 18, '#e8702c', null); for (let i = 0; i < 3; i++) R(x, '#f0a050', 62, 83 + i * 5, 10, 1);
    tote(76, 98, 23, 11, null, [[1, '#f2ecdc'], [9, '#f2ecdc']]);
    tote(101, 98, 23, 11, null, [[1, '#a8815c'], [9, '#a8815c']]);
    squeeze(124, 98, 18, '#e0402c'); squeeze(132, 98, 18, '#e8802c'); squeeze(140, 98, 18, '#d0405a');
    for (const [cx, col] of [[151, '#f0c030'], [162, '#4a8fd0']]) { blk(cx, 82, 11, 16, CRM, '#ffffff', '#c9c0a8'); R(x, col, cx + 1, 88, 9, 2); }
    const cupStack = (cx, h) => { blk(cx, 98 - h, 11, h, '#f2ecdc', '#ffffff', '#c9c0a8'); for (let py = 98 - h + 3; py < 97; py += 4) R(x, '#d0428a', cx + 1, py, 9, 1); };
    cupStack(176, 19); cupStack(188, 14);
    calX = 4; calY = 60; calW = 27; calH = 35; calBand = '#3a78c8'; calInk = '#364658'; calPaper = '#e9e1cb';
    signX = 207; signY = 69; signW = 38; signH = 25;
    // the promo poster: peeks out under the third ticket
    blk(205, 34, 41, 28, '#f0c030', null, null);
    x.save(); x.beginPath(); x.rect(206, 35, 39, 26); x.clip();
    for (let i = 0; i < 26; i++) { R(x, '#d0428a', 206, 35 + i, Math.max(0, 22 - i), 1); R(x, '#3a8ad0', 245 - Math.max(0, i - 6), 35 + i, Math.max(0, i - 6), 1); }
    R(x, INK, 213, 44, 20, 10); R(x, '#f0c030', 214, 45, 18, 8); R(x, '#3d8a3d', 215, 45, 16, 2); R(x, '#c0392b', 218, 45, 2, 1); R(x, '#c0392b', 225, 45, 2, 1); R(x, '#8a5a2a', 215, 47, 3, 3);
    x.restore();
  }

  /* the calendar: real month and year, from the level */
  R(x, SH, calX + 2, calY + 2, calW, calH);
  blk(calX, calY, calW, calH, calPaper, null, shade(calPaper, -0.12));
  R(x, calBand, calX + 1, calY + 1, calW - 2, 5);
  if (era === 3) R(x, '#f0c030', calX + 1, calY + 6, calW - 2, 1);
  for (const rx of era === 1 ? [calX + (calW >> 1) - 2] : [calX + 5, calX + calW - 8]) { R(x, INK, rx, calY - 3, 4, 5); R(x, '#a2a8b6', rx + 1, calY - 2, 2, 3); }
  text(x, month, calX + calW / 2, calY + 10, calInk, 1, 1);
  text(x, String(year), calX + calW / 2, calY + 19, calInk, 1, 1);
  for (let c = 0; c < 6; c++) R(x, shade(calPaper, -0.2), calX + 3 + c * 4, calY + calH - 5, 2, 1);
  R(x, shade(calPaper, -0.12), calX + 1, calY + calH - 2, calW - 2, 1);

  /* the sign: jade and gold, the shop's own lettering */
  R(x, SH, signX + 2, signY + 2, signW, signH);
  R(x, INK, signX, signY, signW, signH);
  R(x, PAL.goldLo, signX + 1, signY + 1, signW - 2, signH - 2);
  R(x, PAL.jadeLo, signX + 2, signY + 2, signW - 4, signH - 4);
  for (const [dx, dy] of [[3, 3], [signW - 4, 3], [3, signH - 4], [signW - 4, signH - 4]]) R(x, PAL.gold, signX + dx, signY + dy, 1, 1);
  const cx = signX + signW / 2;
  logoText(x, 'TACO', cx + 1, signY + 3, 1, 0, '#0e3d30'); logoText(x, 'SHOP', cx + 1, signY + 13, 1, 0, '#0e3d30');
  logoText(x, 'TACO', cx, signY + 2, 1, 0, PAL.gold); logoText(x, 'SHOP', cx, signY + 12, 1, 0, PAL.gold);

  /* the rail goes back over the wall */
  const ST_D = PAL.roadLo, ST_X = PAL.road, ST_M = PAL.walk, ST_H = PAL.walkHi;
  R(x, ST_X, 2, 1, 250, 6); R(x, ST_H, 2, 1, 250, 1); R(x, ST_M, 2, 2, 250, 1);
  R(x, shade(ST_X, -0.4), 2, 6, 250, 1);
  for (const bx of [2, 249]) { R(x, ST_D, bx, 0, 3, 10); R(x, ST_M, bx, 0, 3, 1); }

  /* ----------------------------------------------- the prep counter */
  /* the surface stays quiet behind NOW BUILDING; only the front lip says
     which decade it is */
  const lip = era === 1 ? ['#b4bac8', '#8b8f9f', '#6a6e80'] :     // brushed steel
              era === 2 ? ['#5e3d2a', '#3a2418', '#2a1810'] :     // dark laminate
                          ['#b0a4f0', '#8a7ae0', '#5a4ab0'];      // plastic bumper
  R(x, INK, 0, VH - 6, VW, 1);
  R(x, lip[0], 0, VH - 5, VW, 1); R(x, lip[1], 0, VH - 4, VW, 3); R(x, lip[2], 0, VH - 1, VW, 1);

  /* ------------------------------------------- the customer side */
  const OX = Kitchen.OV_X, OH = Kitchen.OV_H, wy = 48, wh = 11, ox = OX + 47, ow = 40;
  // floor, below the service wall
  const F = era === 1 ? ['#7c7f8c', '#8a8d98'] : era === 2 ? ['#6e7080', '#787a8a'] : ['#8d93a6', '#979db0'];
  R(x, F[0], OX + 1, wy + wh, VW - OX - 1, OH - wy - wh);
  for (let ty = wy + wh; ty < OH; ty += 8)
    for (let tx = OX + 1; tx < VW; tx += 8) {
      if (era === 1 && ((tx + ty) >> 3) % 2) R(x, F[1], tx, ty, 8, 8);
      if (era === 2) { R(x, F[1], tx, ty, 7, 7); R(x, '#5a5266', tx + 7, ty, 1, 8); R(x, '#5a5266', tx, ty + 7, 8, 1); }
    }
  if (era === 3) { const r4 = makeRng(1993); for (let i = 0; i < 26; i++) R(x, r4.pick(['#d0428a', '#4a8fd0', '#e8d24a', '#7c8292']), OX + 2 + r4.int(VW - OX - 3), wy + wh + r4.int(OH - wy - wh), 1, 1); }
  // the jambs go back on
  for (const jx of [ox - 5, ox + ow]) {
    R(x, INK, jx, wy + wh, 5, 16);
    R(x, shade(PAL.wallMd, -0.34), jx + 1, wy + wh, 3, 15);
    R(x, shade(PAL.wallLt, -0.30), jx + 1, wy + wh, 1, 15);
    R(x, 'rgba(12,8,20,0.34)', jx + 4, wy + wh, 3, 15);
  }
  // the door, and a mat inside it
  R(x, shade(PAL.walk, -0.40), VW - 12, 80, 12, 24);
  R(x, shade(PAL.walk, -0.12), VW - 12, 80, 1, 24);
  const MAT = era === 1 ? '#5c5040' : era === 2 ? '#7a2f3a' : '#3a5a8a';
  R(x, INK, VW - 26, 84, 13, 16); R(x, MAT, VW - 25, 85, 11, 14);
  for (let i = 0; i < 6; i++) R(x, shade(MAT, -0.25), VW - 24, 86 + i * 2, 9, 1);

  // the rope line the queue forms along
  const ROPE = era === 3 ? '#3a78c8' : '#a02a2a';
  const stanchion = (px, py) => { R(x, SH, px, py + 2, 4, 2); R(x, INK, px - 1, py - 1, 5, 5); R(x, era === 2 ? '#d0a040' : '#c9cede', px, py, 3, 3); R(x, '#ffffff', px, py, 1, 1); };
  const rope = (x0, y0, y1) => { R(x, shade(ROPE, -0.4), x0 + 2, y0 + 2, 1, y1 - y0); R(x, ROPE, x0 + 1, y0 + 2, 1, y1 - y0); };
  rope(286, 64, 93); rope(345, 64, 93);
  stanchion(286, 63); stanchion(286, 78); stanchion(286, 93);
  stanchion(345, 63); stanchion(345, 78); stanchion(345, 93);

  // a trash can with a tray shelf, and a potted cactus
  R(x, SH, 254, 77, 14, 4); R(x, INK, 252, 63, 15, 15);
  R(x, era === 3 ? '#8a5fc0' : era === 2 ? '#6b4630' : '#8b8f9f', 253, 64, 13, 13);
  R(x, INK, 255, 66, 9, 3); R(x, '#c9cede', 253, 64, 13, 1);
  R(x, era === 3 ? '#b38ae0' : era === 2 ? '#8a5c3e' : '#a2a8b6', 253, 71, 13, 2);   // the tray stack on top
  R(x, SH, 358, 70, 11, 3); R(x, INK, 356, 61, 11, 10); R(x, '#a8603a', 357, 62, 9, 8);
  R(x, INK, 358, 58, 7, 7); R(x, PAL.tree, 359, 59, 5, 5); R(x, PAL.treeHi, 360, 59, 1, 4); R(x, PAL.treeHi, 362, 60, 1, 3);

  // the service counter: a register on the left, napkins and straws on the right
  const REG = era === 1 ? ['#a2a8b6', '#7c8292', '#d0b04a'] : era === 2 ? ['#d8ccb0', '#a8a088', '#3fa35a'] : ['#3f3f4e', '#2a2a35', '#3fb8b0'];
  // a condiment stand by the exit: napkins, straws, a register-less tip jar
  R(x, SH, 352, 82, 14, 3); R(x, INK, 350, 76, 14, 8); R(x, REG[0], 351, 77, 12, 6);
  R(x, INK, 352, 74, 5, 5); R(x, '#f2e9d0', 353, 75, 3, 3);
  R(x, INK, 358, 73, 4, 6); for (let i = 0; i < 2; i++) R(x, ['#c0392b', '#3a78c8'][i], 359 + i, 74, 1, 4);
  return t.c;
}
