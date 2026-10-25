/* Part of the headless render harness -- see tools/render/README.md.
   Zero dependencies, Node built-ins only.
   --------------------------------------------------------------
   sweep.mjs -- can every level be won?

       node tools/render/sweep.mjs [runs-per-level] [first] [last]

   Plays each level start to finish with the autoplayers at the controls --
   Demo at the wheel, the kitchen's cook on the line -- under the real clock,
   the real extensions and the real target, and reports whether it cleared and
   how long it took. The autoplayers are not good players: the driver is
   cautious and the cook slips one pick in twelve on purpose. A level they
   clear is a level a person can; a level they cannot clear is a question
   for the tuning, not proof it is impossible.

   JOURNAL: "assert winnability, not just absence of crashes".
*/
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { Canvas } from './px.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = join(HERE, '..', '..', 'src');
const files = readdirSync(SRC).filter((f) => f.endsWith('.js')).sort().filter((f) => f !== '90_main.js');
const code = files.map((f) => `\n//# ${f}\n` + readFileSync(join(SRC, f), 'utf8')).join('\n');
const noop = () => {};
const sandbox = {
  document: { createElement: (t) => (t === 'canvas' ? new Canvas(1, 1) : { style: {} }), getElementById: () => new Canvas(1, 1) },
  window: { addEventListener: noop }, addEventListener: noop, removeEventListener: noop,
  performance: { now: () => 0 }, requestAnimationFrame: noop, setTimeout: () => 0, clearTimeout: noop,
  setInterval: () => 0, clearInterval: noop, console, Math, Date, JSON, Object, Array, String, Number,
  Boolean, isNaN, parseInt, parseFloat, Float32Array, Int32Array, Int16Array, Int8Array, Uint8Array,
  Uint16Array, Uint8ClampedArray, location: { search: '' }, URLSearchParams,
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(code + '\n;globalThis.__x = { G, Kitchen, Input, Demo };', sandbox, { filename: 'bundle.js' });
const { G, Kitchen, Input, Demo } = sandbox.__x;

const RUNS = Number(process.argv[2] || 2), FIRST = Number(process.argv[3] || 1), LAST = Number(process.argv[4] || 20);
G.boot(1972);
const DT = 1 / 60, CAP = 20 * 60 * 60;   // 20 minutes of game time, hard stop

for (let n = FIRST; n <= LAST; n++) {
  const res = [];
  for (let r = 0; r < RUNS; r++) {
    G.toCard(n); G.beginShift();
    const kitchen = G.stage === 'kitchen';
    if (kitchen) Kitchen.demo = true;
    else { Demo.reset(G.player); G.attractT = 1e9; }
    let f = 0, delivered = 0;
    for (; f < CAP; f++) {
      if (!kitchen) G.state = 'demo';                // Demo drives only in the demo state...
      G.update(DT); Input.endFrame();
      if (!kitchen && G.state === 'demo') {
        G.state = 'play';                            // ...but the level's rules run in play
        while (G.stats.delivered > delivered) { delivered++; G.onComplete(); }
      }
      if (G.state !== 'play' && G.state !== 'kitchen') break;
      if (!kitchen && G.state === 'play' && G.shift <= 0) { G.timeUp(); break; }
    }
    Kitchen.demo = false;
    res.push({ ok: G.state === 'clear', t: f / 60, done: G.done, ext: G.extUsed, money: G.levelEarned, stars: G.levelStars,
      walk: kitchen ? Kitchen.stats.walkouts : G.stats.splat });
  }
  const L = G.level, wins = res.filter((x) => x.ok).length;
  const avg = (k) => (res.reduce((a, x) => a + x[k], 0) / res.length);
  console.log(`L${String(n).padStart(2)} ${L.type.padEnd(8)} ${L.difficulty.padEnd(7)} ${(L.name || '').padEnd(12)} ` +
    `clear ${wins}/${RUNS}  avg ${avg('t').toFixed(0)}s  done ${avg('done').toFixed(1)}/${G.diff.target}  ext ${avg('ext').toFixed(1)}  ` +
    `$${(avg('money') / 100).toFixed(2)}  stars ${avg('stars').toFixed(1)}  ${L.type === 'kitchen' ? 'walkouts' : 'splats'} ${avg('walk').toFixed(1)}`);
}
