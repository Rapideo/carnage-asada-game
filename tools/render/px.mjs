/* Part of the headless render harness -- see tools/render/README.md.
   Zero dependencies, Node built-ins only, so the repo stays dependency-free.
   -------------------------------------------------------------- */
/* ============================================================
   px.mjs -- a minimal software Canvas2D + PNG writer.
   Node built-ins only, so the repo stays zero-dependency.

   Enough of the 2D API for the game's own drawing code to run
   unmodified: fillRect / strokeRect / drawImage (nearest) /
   globalAlpha / radial+linear gradients / translate.
   ============================================================ */
'use strict';
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';

/* ---------- colour ---------------------------------------- */
function parseColor(s) {
  if (s && typeof s === 'object' && s.__grad) return s;
  if (typeof s !== 'string') return [255, 0, 255, 1];
  s = s.trim();
  if (s[0] === '#') {
    if (s.length === 4) return [parseInt(s[1] + s[1], 16), parseInt(s[2] + s[2], 16), parseInt(s[3] + s[3], 16), 1];
    return [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16), 1];
  }
  const m = s.match(/^rgba?\(([^)]+)\)$/i);
  if (m) {
    const p = m[1].split(',').map((v) => parseFloat(v));
    return [p[0] | 0, p[1] | 0, p[2] | 0, p.length > 3 ? p[3] : 1];
  }
  if (s === 'white') return [255, 255, 255, 1];
  if (s === 'black') return [0, 0, 0, 1];
  throw new Error('px: cannot parse colour ' + JSON.stringify(s));
}

class Gradient {
  constructor(kind, a) { this.__grad = true; this.kind = kind; this.a = a; this.stops = []; }
  addColorStop(t, c) { this.stops.push([t, parseColor(c)]); this.stops.sort((p, q) => p[0] - q[0]); }
  at(px, py) {
    const s = this.stops;
    if (!s.length) return [0, 0, 0, 0];
    let t;
    if (this.kind === 'radial') {
      const [x0, y0, r0, x1, y1, r1] = this.a;
      // the game only ever uses concentric circles, so distance from the
      // shared centre is exact rather than an approximation
      const d = Math.hypot(px - x1, py - y1);
      t = r1 === r0 ? 0 : (d - r0) / (r1 - r0);
    } else {
      const [x0, y0, x1, y1] = this.a;
      const dx = x1 - x0, dy = y1 - y0, L = dx * dx + dy * dy;
      t = L === 0 ? 0 : ((px - x0) * dx + (py - y0) * dy) / L;
    }
    if (t <= s[0][0]) return s[0][1];
    if (t >= s[s.length - 1][0]) return s[s.length - 1][1];
    for (let i = 1; i < s.length; i++) {
      if (t <= s[i][0]) {
        const [ta, ca] = s[i - 1], [tb, cb] = s[i];
        const f = tb === ta ? 0 : (t - ta) / (tb - ta);
        return [ca[0] + (cb[0] - ca[0]) * f, ca[1] + (cb[1] - ca[1]) * f,
                ca[2] + (cb[2] - ca[2]) * f, ca[3] + (cb[3] - ca[3]) * f];
      }
    }
    return s[s.length - 1][1];
  }
}

/* ---------- context --------------------------------------- */
class Ctx {
  constructor(canvas) {
    this.canvas = canvas;
    this.d = canvas.data; this.w = canvas.width; this.h = canvas.height;
    this._fill = '#000'; this._stroke = '#000';
    this.lineWidth = 1; this.globalAlpha = 1;
    this.imageSmoothingEnabled = false;
    /* Full 2x3 matrix, not just a translate. Art.buildTrain flips a sprite
       with scale(-1,1) and rotFrames() spins one with rotate(), so the real
       game cannot be rendered without both. [a b c d e f]:
         x' = a*x + c*y + e     y' = b*x + d*y + f  */
    this.m = [1, 0, 0, 1, 0, 0];
    this.stack = [];
    this.path = [];
  }
  get tx() { return this.m[4]; }
  get ty() { return this.m[5]; }
  _mul(n) {
    const m = this.m;
    this.m = [
      m[0] * n[0] + m[2] * n[1],
      m[1] * n[0] + m[3] * n[1],
      m[0] * n[2] + m[2] * n[3],
      m[1] * n[2] + m[3] * n[3],
      m[0] * n[4] + m[2] * n[5] + m[4],
      m[1] * n[4] + m[3] * n[5] + m[5],
    ];
  }
  _pt(px, py) {
    const m = this.m;
    return [m[0] * px + m[2] * py + m[4], m[1] * px + m[3] * py + m[5]];
  }
  _inv() {
    const [a, b, c, d, e, f] = this.m;
    const det = a * d - b * c;
    if (!det) return null;
    return [d / det, -b / det, -c / det, a / det,
            (c * f - d * e) / det, (b * e - a * f) / det];
  }
  _axisAligned() { return Math.abs(this.m[1]) < 1e-9 && Math.abs(this.m[2]) < 1e-9; }
  /* A real canvas silently keeps the previous colour when handed undefined,
     which turns a missing palette entry into quietly wrong pixels rather
     than an error. Refuse it, the way test/headless.mjs does. */
  set fillStyle(v) { if (v == null) throw new Error('ctx.fillStyle set to ' + v + ' -- a palette entry is missing'); this._fill = v; }
  get fillStyle() { return this._fill; }
  set strokeStyle(v) { if (v == null) throw new Error('ctx.strokeStyle set to ' + v + ' -- a palette entry is missing'); this._stroke = v; }
  get strokeStyle() { return this._stroke; }

  save() { this.stack.push([this._fill, this._stroke, this.lineWidth, this.globalAlpha, this.m.slice()]); }
  restore() {
    const s = this.stack.pop(); if (!s) return;
    [this._fill, this._stroke, this.lineWidth, this.globalAlpha, this.m] = s;
  }
  translate(dx, dy) { this._mul([1, 0, 0, 1, dx, dy]); }
  scale(sx, sy) { this._mul([sx, 0, 0, sy, 0, 0]); }
  rotate(th) { const c = Math.cos(th), s = Math.sin(th); this._mul([c, s, -s, c, 0, 0]); }
  transform(a, b, c, d, e, f) { this._mul([a, b, c, d, e, f]); }
  setTransform(a, b, c, d, e, f) { this.m = [a, b, c, d, e, f]; }
  resetTransform() { this.m = [1, 0, 0, 1, 0, 0]; }

  createRadialGradient(...a) { return new Gradient('radial', a); }
  createLinearGradient(...a) { return new Gradient('linear', a); }
  measureText(s) { return { width: s.length * 6 }; }

  _blend(i, r, g, b, a) {
    if (a <= 0) return;
    const d = this.d;
    if (a >= 1) { d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255; return; }
    d[i]     = d[i]     + (r - d[i])     * a;
    d[i + 1] = d[i + 1] + (g - d[i + 1]) * a;
    d[i + 2] = d[i + 2] + (b - d[i + 2]) * a;
    d[i + 3] = d[i + 3] + (255 - d[i + 3]) * a;
  }

  _rect(style, x, y, w, h) {
    const col = parseColor(style);
    const ga = this.globalAlpha;
    const put = (px, py) => {
      if (px < 0 || py < 0 || px >= this.w || py >= this.h) return;
      const i = (py * this.w + px) * 4;
      if (col.__grad) { const c = col.at(px + 0.5, py + 0.5); this._blend(i, c[0], c[1], c[2], c[3] * ga); }
      else this._blend(i, col[0], col[1], col[2], col[3] * ga);
    };

    if (this._axisAligned()) {                    // the common case, kept exact
      let [ax, ay] = this._pt(x, y), [bx, by] = this._pt(x + w, y + h);
      let x0 = Math.round(ax), y0 = Math.round(ay), x1 = Math.round(bx), y1 = Math.round(by);
      if (x1 < x0) [x0, x1] = [x1, x0];
      if (y1 < y0) [y0, y1] = [y1, y0];
      x0 = Math.max(0, x0); y0 = Math.max(0, y0);
      x1 = Math.min(this.w, x1); y1 = Math.min(this.h, y1);
      for (let py = y0; py < y1; py++) for (let px = x0; px < x1; px++) put(px, py);
      return;
    }

    // rotated: walk the destination bounding box, test each pixel in local space
    const inv = this._inv(); if (!inv) return;
    const cs = [this._pt(x, y), this._pt(x + w, y), this._pt(x, y + h), this._pt(x + w, y + h)];
    const x0 = Math.max(0, Math.floor(Math.min(...cs.map((p) => p[0]))));
    const x1 = Math.min(this.w, Math.ceil(Math.max(...cs.map((p) => p[0]))));
    const y0 = Math.max(0, Math.floor(Math.min(...cs.map((p) => p[1]))));
    const y1 = Math.min(this.h, Math.ceil(Math.max(...cs.map((p) => p[1]))));
    for (let py = y0; py < y1; py++) for (let px = x0; px < x1; px++) {
      const sx = px + 0.5, sy = py + 0.5;
      const lx = inv[0] * sx + inv[2] * sy + inv[4];
      const ly = inv[1] * sx + inv[3] * sy + inv[5];
      if (lx >= x && lx < x + w && ly >= y && ly < y + h) put(px, py);
    }
  }

  fillRect(x, y, w, h) { this._rect(this._fill, x, y, w, h); }
  clearRect(x, y, w, h) {
    const x0 = Math.max(0, Math.round(x + this.tx)), y0 = Math.max(0, Math.round(y + this.ty));
    const x1 = Math.min(this.w, Math.round(x + this.tx + w)), y1 = Math.min(this.h, Math.round(y + this.ty + h));
    for (let py = y0; py < y1; py++) for (let px = x0; px < x1; px++) {
      const i = (py * this.w + px) * 4;
      this.d[i] = this.d[i + 1] = this.d[i + 2] = this.d[i + 3] = 0;
    }
  }

  /* lineWidth-wide band centred on the path, matching canvas semantics --
     strokeRect(px+0.5, py+0.5, w-1, h-1) at lw 1 lands on whole pixels */
  strokeRect(x, y, w, h) {
    const lw = this.lineWidth, hw = lw / 2, s = this._stroke;
    this._rect(s, x - hw, y - hw, w + lw, lw);              // top
    this._rect(s, x - hw, y + h - hw, w + lw, lw);          // bottom
    this._rect(s, x - hw, y + hw, lw, h - lw);              // left
    this._rect(s, x + w - hw, y + hw, lw, h - lw);          // right
  }

  /* ---- paths: enough for the game's triArrow ---- */
  beginPath() { this.path = []; }
  moveTo(x, y) { this.path.push(['m', x, y]); }
  lineTo(x, y) { this.path.push(['l', x, y]); }
  closePath() { this.path.push(['c']); }
  /* City.genPark draws its pond with ellipse(); flattened to a polygon, which
     is what the scanline fill wants anyway. 64 segments is well under a pixel
     of error at any radius this game uses. */
  ellipse(cx, cy, rx, ry, rot = 0, a0 = 0, a1 = Math.PI * 2) {
    const n = 64, co = Math.cos(rot), si = Math.sin(rot);
    for (let i = 0; i <= n; i++) {
      const a = a0 + (a1 - a0) * (i / n);
      const ex = Math.cos(a) * rx, ey = Math.sin(a) * ry;
      this.path.push([i ? 'l' : 'm', cx + ex * co - ey * si, cy + ex * si + ey * co]);
    }
  }
  arc(cx, cy, r, a0 = 0, a1 = Math.PI * 2) { this.ellipse(cx, cy, r, r, 0, a0, a1); }
  rect(x, y, w, h) {
    this.path.push(['m', x, y], ['l', x + w, y], ['l', x + w, y + h], ['l', x, y + h], ['c']);
  }
  clip() {}                                       // no clipping paths are used
  fillText() {} strokeText() {}
  _poly() {
    const pts = [];
    for (const p of this.path) if (p[0] === 'm' || p[0] === 'l') pts.push(this._pt(p[1], p[2]));
    return pts;
  }
  fill() {
    const pts = this._poly(); if (pts.length < 3) return;
    const col = parseColor(this._fill), a = col[3] * this.globalAlpha;
    let miny = Infinity, maxy = -Infinity;
    for (const p of pts) { miny = Math.min(miny, p[1]); maxy = Math.max(maxy, p[1]); }
    for (let py = Math.max(0, Math.floor(miny)); py <= Math.min(this.h - 1, Math.ceil(maxy)); py++) {
      const yc = py + 0.5, xs = [];
      for (let i = 0; i < pts.length; i++) {
        const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length];
        if ((ay <= yc && by > yc) || (by <= yc && ay > yc)) xs.push(ax + (yc - ay) / (by - ay) * (bx - ax));
      }
      xs.sort((p, q) => p - q);
      for (let i = 0; i + 1 < xs.length; i += 2) {
        const x0 = Math.max(0, Math.round(xs[i])), x1 = Math.min(this.w, Math.round(xs[i + 1]));
        for (let px = x0; px < x1; px++) this._blend((py * this.w + px) * 4, col[0], col[1], col[2], a);
      }
    }
  }
  stroke() {
    const pts = this._poly(); if (pts.length < 2) return;
    const col = parseColor(this._stroke), a = col[3] * this.globalAlpha;
    const line = (x0, y0, x1, y1) => {
      const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
      for (let i = 0; i <= n; i++) {
        const px = Math.round(x0 + (x1 - x0) * i / n), py = Math.round(y0 + (y1 - y0) * i / n);
        if (px >= 0 && py >= 0 && px < this.w && py < this.h)
          this._blend((py * this.w + px) * 4, col[0], col[1], col[2], a);
      }
    };
    for (let i = 0; i + 1 < pts.length; i++) line(...pts[i], ...pts[i + 1]);
    if (this.path.some((p) => p[0] === 'c')) line(...pts[pts.length - 1], ...pts[0]);
  }

  /* ---- images: nearest neighbour, always ---- */
  drawImage(img, ...a) {
    let sx = 0, sy = 0, sw = img.width, sh = img.height, dx, dy, dw, dh;
    if (a.length === 2) { [dx, dy] = a; dw = sw; dh = sh; }
    else if (a.length === 4) { [dx, dy, dw, dh] = a; }
    else { [sx, sy, sw, sh, dx, dy, dw, dh] = a; }
    const ga = this.globalAlpha;
    const inv = this._inv(); if (!inv) return;
    /* Walk the transformed destination box and inverse-map each pixel back to
       source space -- which handles the flipped train (scale -1) and the 32
       rotation frames rotFrames() bakes, not just translation. */
    const cs = [this._pt(dx, dy), this._pt(dx + dw, dy),
                this._pt(dx, dy + dh), this._pt(dx + dw, dy + dh)];
    const X0 = Math.max(0, Math.floor(Math.min(...cs.map((p) => p[0]))));
    const X1 = Math.min(this.w, Math.ceil(Math.max(...cs.map((p) => p[0]))));
    const Y0 = Math.max(0, Math.floor(Math.min(...cs.map((p) => p[1]))));
    const Y1 = Math.min(this.h, Math.ceil(Math.max(...cs.map((p) => p[1]))));
    for (let py = Y0; py < Y1; py++) {
      for (let px = X0; px < X1; px++) {
        const fx = px + 0.5, fy = py + 0.5;
        const lx = inv[0] * fx + inv[2] * fy + inv[4];
        const ly = inv[1] * fx + inv[3] * fy + inv[5];
        if (lx < dx || lx >= dx + dw || ly < dy || ly >= dy + dh) continue;
        const ix = Math.floor(sx + (lx - dx) / dw * sw);
        const iy = Math.floor(sy + (ly - dy) / dh * sh);
        if (ix < 0 || iy < 0 || ix >= img.width || iy >= img.height) continue;
        const si = (iy * img.width + ix) * 4;
        const sa = img.data[si + 3] / 255 * ga;
        if (sa > 0) this._blend((py * this.w + px) * 4, img.data[si], img.data[si + 1], img.data[si + 2], sa);
      }
    }
  }
}

/* ---------- canvas ---------------------------------------- */
export class Canvas {
  constructor(w, h) {
    this._w = w; this._h = h;
    this.data = new Uint8ClampedArray(w * h * 4);
    this.style = {};
  }
  /* mkCanvas() does `document.createElement('canvas')` and only THEN assigns
     width/height, so these have to reallocate the way a real canvas does --
     without this every baked sprite is silently 1x1 and draws nothing. */
  get width() { return this._w; }
  set width(v) { this._resize(v, this._h); }
  get height() { return this._h; }
  set height(v) { this._resize(this._w, v); }
  _resize(w, h) {
    if (w === this._w && h === this._h) return;
    this._w = w; this._h = h;
    this.data = new Uint8ClampedArray(w * h * 4);
    if (this._ctx) { this._ctx.d = this.data; this._ctx.w = w; this._ctx.h = h; }
  }
  getContext() { return (this._ctx ||= new Ctx(this)); }
}

/* ---------- nearest-neighbour upscale --------------------- */
export function upscale(src, n) {
  const out = new Canvas(src.width * n, src.height * n);
  for (let y = 0; y < out.height; y++) for (let x = 0; x < out.width; x++) {
    const si = ((y / n | 0) * src.width + (x / n | 0)) * 4, di = (y * out.width + x) * 4;
    out.data[di] = src.data[si]; out.data[di + 1] = src.data[si + 1];
    out.data[di + 2] = src.data[si + 2]; out.data[di + 3] = src.data[si + 3];
  }
  return out;
}

/* ---------- PNG ------------------------------------------- */
const CRC = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 255] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
export function writePNG(canvas, path) {
  const { width: w, height: h, data } = canvas;
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;                       // filter: none
    for (let x = 0; x < w * 4; x++) raw[y * (w * 4 + 1) + 1 + x] = data[y * w * 4 + x];
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  writeFileSync(path, Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]));
  return path;
}
