/* Zero dependencies, Node built-ins only.
   --------------------------------------------------------------
   check-music.mjs -- runs src/22_music.js in a node:vm sandbox against a
   stub AudioContext and the real content/music/*.json, and checks that
   play / playList / stop run without throwing and actually schedule notes.

       node tools/music/check-music.mjs
*/
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
import { validateContent } from '../content/validate.mjs';
import { fsSource } from '../content/fs-source.mjs';

let fails = 0;
const ok = (c, m) => { console.log(`${c ? 'PASS' : 'FAIL'}  ${m}`); if (!c) fails++; };

const dir = join('content', 'music');
const MUSIC = {};
for (const f of readdirSync(dir)) if (f.endsWith('.json') && f !== 'approved.json') MUSIC[f.slice(0, -5)] = JSON.parse(readFileSync(join(dir, f), 'utf8'));
/* each level's list as the build computes it from approved.json */
const PLAYLIST = validateContent(fsSource('content')).playlist;

/* stub WebAudio: every node records what it was asked to do */
const counts = { osc: 0, noise: 0, starts: [], early: 0 };
const param = () => ({ value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime(v) { if (!(v > 0)) throw new Error('exp ramp to ' + v); }, setTargetAtTime() {}, cancelScheduledValues() {} });
const node = (extra = {}) => ({ connect() {}, disconnect() {}, gain: param(), frequency: param(), Q: param(), ...extra });
const ctx = {
  currentTime: 0, sampleRate: 22050,
  createGain: () => node(),
  createOscillator: () => node({ type: 'sine', setPeriodicWave() {}, start(t) { counts.osc++; counts.starts.push(t); if (t < ctx.currentTime - 1e-9) counts.early++; }, stop() {} }),
  createBiquadFilter: () => node({ type: 'lowpass' }),
  createBuffer: (c, n) => ({ getChannelData: () => new Float32Array(n) }),
  createBufferSource: () => node({ start() { counts.noise++; }, stop() {} }),
  createPeriodicWave: () => ({}),
};
const timers = [];
const sandbox = {
  console, Math, Float32Array, MUSIC, PLAYLIST,
  setInterval: (fn) => { timers.push(fn); return timers.length; },
  clearInterval: (id) => { timers[id - 1] = null; },
  setTimeout: () => 0,
};
sandbox.Audio5 = { ctx, ready: true, muted: false, musicOn: true, musBus: node() };
vm.createContext(sandbox);
vm.runInContext(readFileSync(join('src', '22_music.js'), 'utf8') + '\nglobalThis.Music = Music;', sandbox);
const M = sandbox.Music;
const run = (secs) => { for (let t = 0; t < secs; t += 0.025) { ctx.currentTime += 0.025; for (const f of timers) if (f) f(); } };

ok(!M.owns, 'does not own the bus before anything plays');
ok(M.playKey('title') === true, 'playKey("title") starts');
ok(M.owns && M.playing(), 'owns the bus once playing');
run(5);
ok(counts.osc > 20 && counts.noise > 5, `schedules notes and drums (${counts.osc} oscillators, ${counts.noise} noise hits in 5s)`);
ok(counts.early === 0, 'never schedules a note in the past');

const before = M.step, id = M.now().id;
M.playList(PLAYLIST.title);
ok(M.now().id === id && M.step === before, 'playList with the same list twice does not restart');

// every song plays to the end and the list advances
for (const [k, list] of Object.entries(PLAYLIST)) {
  M.playList(list);
  const first = M.now().id, s = MUSIC[first];
  run(s.len * 60 / s.bpm / s.res + 2);
  ok(M.playing() && M.now().id === (list[1] || list[0]), `"${k}": ${first} played through and advanced to ${M.now().id}`);
}

// hidden tab: a 3s stall must skip forward, not burst
M.play('take-on-me'); run(1);
const n0 = counts.osc; ctx.currentTime += 3; for (const f of timers) if (f) f();
ok(counts.osc - n0 < 30, `a 3s stall schedules ${counts.osc - n0} notes, not a burst`);

// music off: position keeps moving, no nodes are made
sandbox.Audio5.musicOn = false; const n1 = counts.osc, s1 = M.step; run(2);
ok(counts.osc === n1 && M.step !== s1, 'with music off the song advances silently');
sandbox.Audio5.musicOn = true;

M.stop();
const n2 = counts.osc; run(2);
ok(!M.playing() && counts.osc === n2 && M.owns, 'stop() silences and keeps the legacy loop quiet');
M.release();
ok(!M.owns, 'release() hands the bus back');
ok(M.play('no-such-song') === false && !M.playing(), 'an unknown id is refused, not thrown');

// missing content: the module must still load and do nothing
const bare = { setInterval, clearInterval, setTimeout, Math, Float32Array, Audio5: sandbox.Audio5 };
vm.createContext(bare);
vm.runInContext(readFileSync(join('src', '22_music.js'), 'utf8') + '\nglobalThis.Music = Music;', bare);
ok(bare.Music.playKey('title') === false && !bare.Music.owns, 'with no MUSIC/PLAYLIST it boots and declines');

console.log(fails ? `\n${fails} FAILED` : '\nall music checks pass');
process.exit(fails ? 1 : 0);
