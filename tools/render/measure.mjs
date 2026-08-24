/* TEST ARTEFACT -- NOT A DECISION

   measure.mjs <a.png> [b.png] [--region x,y,w,h]

   Compares a frame against the shipped Delivery Shift so "does it look like
   the same game" stops being a matter of taste. Defaults to comparing
   kitchen-lattice.png against drive.png.

   The two numbers that actually diverged when this was first run:
     warm pixels   driving 19.0%   kitchen 64.7%   (3.4x too warm)
     near-black    driving 28.6%   kitchen 41.9%   (too many ink keylines)
   Value and saturation were already close and are not the problem. */
import { inflateSync } from 'node:zlib';
import { readFileSync } from 'node:fs';
import { dirname as _d, join as _j } from 'node:path';
import { fileURLToPath as _f } from 'node:url';
const OUT = (n) => _j(_d(_f(import.meta.url)), n);   // write beside this file

function load(f) {
  const b = readFileSync(f);
  let i = 8, w = 0, h = 0; const idat = [];
  while (i < b.length) {
    const len = b.readUInt32BE(i), t = b.toString('latin1', i + 4, i + 8);
    if (t === 'IHDR') { w = b.readUInt32BE(i + 8); h = b.readUInt32BE(i + 12); }
    if (t === 'IDAT') idat.push(b.subarray(i + 8, i + 8 + len));
    i += 12 + len;
  }
  return { raw: inflateSync(Buffer.concat(idat)), w, h, st: w * 4 };
}

function stats(f, reg) {
  const { raw, w, h, st } = load(f);
  const [rx, ry, rw, rh] = reg || [0, 0, w, h];
  let v = 0, sat = 0, warm = 0, ink = 0, flat = 0, n = 0;
  const hist = new Array(8).fill(0);
  for (let y = ry; y < ry + rh; y++) {
    for (let X = rx; X < rx + rw; X++) {
      const o = y * (st + 1) + 1 + X * 4;
      const r = raw[o], g = raw[o + 1], b = raw[o + 2];
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      v += mx; sat += mx ? (mx - mn) / mx : 0;
      if (r > b + 8) warm++;
      if (mx < 70) ink++;
      if (mx - mn < 14) flat++;
      hist[Math.min(7, mx >> 5)]++;
      n++;
    }
  }
  return {
    val: v / n, sat: sat / n * 100, warm: warm / n * 100,
    ink: ink / n * 100, neutral: flat / n * 100,
    hist: hist.map((c) => c / n * 100), mid: (hist[2] + hist[3] + hist[4]) / n * 100,
  };
}

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const rArg = process.argv.find((a) => a.startsWith('--region='));
const reg = rArg ? rArg.split('=')[1].split(',').map(Number) : null;
const A = args[1] || OUT('reference-frame.png');                 // reference
const B = args[0] || _j(_d(_f(import.meta.url)), '..', '..', 'reference', 'kitchen', 'kitchen.png');       // subject

const a = stats(A, reg), b = stats(B, reg);
const TARGET = { warm: 19.0, ink: 28.6, mid: 70.8 };

const line = (k, label, fmt = (x) => x.toFixed(1)) => {
  const d = b[k] - a[k];
  const flag = Math.abs(d) > (k === 'warm' || k === 'ink' ? 6 : 10) ? '   <-- OFF' : '';
  console.log('  ' + label.padEnd(26) + fmt(a[k]).padStart(8) + fmt(b[k]).padStart(10) +
              ((d > 0 ? '+' : '') + d.toFixed(1)).padStart(9) + flag);
};

console.log('\n  ' + 'metric'.padEnd(26) + 'REF'.padStart(8) + 'SUBJ'.padStart(10) + 'delta'.padStart(9));
console.log('  ' + '-'.repeat(53));
line('val', 'mean value (0-255)');
line('sat', 'mean saturation %');
line('warm', 'warm pixels %  (r > b+8)');
line('ink', 'near-black %  (keylines)');
line('neutral', 'neutral / grey %');
line('mid', 'mid-range mass %');
console.log('\n  value histogram, dark -> light');
console.log('    ref   ' + a.hist.map((x) => x.toFixed(1).padStart(5)).join(''));
console.log('    subj  ' + b.hist.map((x) => x.toFixed(1).padStart(5)).join(''));
console.log('\n  targets: warm <= ' + TARGET.warm + '%   near-black <= ' + TARGET.ink +
            '%   mid-range >= ' + TARGET.mid.toFixed(0) + '%');
const pass = b.warm <= TARGET.warm + 6 && b.ink <= TARGET.ink + 6;
console.log('  ' + (pass ? 'WITHIN TOLERANCE' : 'NOT YET NORMALISED') + '\n');
