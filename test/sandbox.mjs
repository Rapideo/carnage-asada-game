/* The game in a vm: the real src/*.js modules, concatenated the way build.mjs
   does, run against a stub 2d context so every code path executes without a
   browser. Shared by headless.mjs and admin.mjs. Importing it boots the
   modules (90_main's boot IIFE is deferred, see `deferred`). */
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
    set(t, k, v) {
      /* An undefined colour is silently accepted by a real canvas — it keeps
         the previous value — so a palette entry deleted out from under a
         drawing call produces no error and no visible test failure, just
         quietly wrong pixels in the browser. That happened while the sea
         border became prairie: PAL.sea went away and the park pond, the
         minimap and surfaceAt were all still using it, and the suite stayed
         green. Refuse it here instead. */
      if ((k === 'fillStyle' || k === 'strokeStyle') && (v === undefined || v === null))
        throw new Error(`ctx.${k} set to ${v} — a palette entry is missing`);
      t[k] = v; return true;
    },
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
vm.runInContext(code + '\n;globalThis.__x = { G, City, Nav, Art, Input, Fx, Demo, solve, textW, money, MAXTHROW,' +
  ' VW, VH, WW, WH, Player, Cop, Train, Crossing, carBlocked, ATTRACT, TURN_NAMES, Scores, SCORE_MAX, INI_LEN, INI_ALPHA, ENTRY_TIMEOUT, TS, GW, HSTREETS, VSTREETS, S_ROAD, S_WALK, S_GRASS, S_EDGE, SURF_MUL, classify, SEG0, PITCH, GH, BORDER, WEATHER_GRIP, CAR_COLORS };',
  sandbox, { filename: 'bundle.js' });
vm.runInContext(';globalThis.__c = { Cast, RIVAL_ODDS, TROUBLE_QUEUE_ODDS };', sandbox);
vm.runInContext(';globalThis.__k = { Kitchen, DIFFICULTY, LEVELS, DIALOGUE, MENUS, BOARD, RELEASE, CASTS, Audio5, Pad, Dialog, PAL, FACES, DLG_BOX };', sandbox);

/* run more script in the game's context, e.g. admin/apply.js */
export const runScript = (src, filename) => vm.runInContext(src, sandbox, { filename });
export const opCount = () => ops;
export { sandbox, deferred, makeCtx, makeCanvas };
