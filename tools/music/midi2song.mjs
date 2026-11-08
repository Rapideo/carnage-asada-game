/* Zero dependencies, Node built-ins only, so the repo stays dependency-free.
   --------------------------------------------------------------
   midi2song.mjs -- turn a Standard MIDI File into a chip arrangement the game
   can play through Audio5.musBus (src/22_music.js).

       node tools/music/midi2song.mjs <file.mid> [--preview] [--out f.json]
            [--start BAR] [--bars N] [--lead K] [--bass K] [--harm K,K]
            [--res 4|6|8|12] [--id ID] [--title T] [--artist A] [--year Y]
            [--month M] [--src S]
       (--month is the release month, 1-12, written into the song as `month`
       -- the build refuses a song in content/music/ without one;
       --src the file as songs.json names it, e.g. 70s/Kashmir.mid)
       node tools/music/midi2song.mjs --scan reference/assets/midi
       node tools/music/midi2song.mjs --batch tools/music/songs.json [--preview]

   K is a part key as the report prints it ("t3c0" = track 3, channel 0).

   What it does, in order:
     1. parse    format 0 and 1, running status, sysex, every meta event; a
                 tempo map; note-on velocity 0 as note-off. Junk chunks are
                 skipped, a truncated track is read as far as it goes.
     2. parts    notes grouped by (track, channel). Channel 10 is the kit.
     3. choose   a bass, a lead and up to two harmony parts, by name, GM
                 program, register, polyphony and how many bars they play in.
                 The report says why each one won.
     4. grid     quantise to 4, 6, 8 or 12 steps per beat -- whichever fits
                 the onsets best, so a shuffle lands on triplets, not mush.
     5. mono     each voice is monophonic: of notes that start together the
                 highest (lead, harmony) or lowest (bass) wins, and every
                 onset cuts the note before it -- which is how a chip does it.
     6. window   a 60-120s run of whole bars, scored for a busy lead, drums
                 and bass, phrase alignment, and a seam that loops (the bar
                 after the window should sound like the bar that starts it).
                 A song that is short anyway plays whole.
     7. emit     compact JSON: one string per voice of 3-char tokens, one
                 char per step for the kit. See FORMAT below.

   FORMAT (read by src/22_music.js -- change both or neither)
     voice.n   3-char tokens  P D L
                 P  pitch, L64[midi - 28]  (E1..G6; outside folds by octave)
                    '.' = no note, just advance D steps (for gaps > 63)
                 D  steps since the previous token's start, 0..63
                 L  length in steps, L64 index 1..63 (clamped)
     drums     one L64 char per step, a bit mask:
                 1 kick  2 snare  4 closed hat  8 open hat  16 crash  32 tom
*/
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync } from 'node:fs';
import { join, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const L64 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+/';
const PMIN = 28, PMAX = 91;

/* ============================================================
   1. PARSE
   ============================================================ */
export function parseMidi(buf) {
  let p = 0;
  const u32 = () => { const v = buf.readUInt32BE(p); p += 4; return v; };
  const u16 = () => { const v = buf.readUInt16BE(p); p += 2; return v; };
  if (buf.length < 14 || buf.toString('latin1', 0, 4) !== 'MThd') {
    // RIFF-wrapped MIDI (.rmi): find the MThd inside
    const at = buf.indexOf('MThd');
    if (at < 0) throw new Error('no MThd header');
    buf = buf.subarray(at);
  }
  p = 4;
  const hlen = u32();
  const format = u16(), ntrks = u16(), div = u16();
  p = 8 + hlen;
  let ppq = div, smpte = 0;
  if (div & 0x8000) {               // SMPTE: ticks per second; fake a ppq at 120bpm
    const fps = 256 - (div >> 8), tpf = div & 0xff;
    smpte = fps * tpf; ppq = Math.max(1, Math.round(smpte / 2));
  }
  const tracks = [];
  const warn = [];
  while (p + 8 <= buf.length && tracks.length < Math.max(ntrks, 1) + 64) {
    const id = buf.toString('latin1', p, p + 4); p += 4;
    let len = u32();
    if (p + len > buf.length) { warn.push(`track ${tracks.length} truncated`); len = buf.length - p; }
    if (id !== 'MTrk') { p += len; continue; }
    tracks.push(parseTrack(buf.subarray(p, p + len), tracks.length, warn));
    p += len;
  }
  if (!tracks.length) throw new Error('no MTrk chunks');
  return { format, ntrks, ppq, smpte, tracks, warn };
}

function parseTrack(b, ti, warn) {
  let p = 0, tick = 0, status = 0;
  const ev = [];
  const vlq = () => {
    let v = 0, c;
    do { if (p >= b.length) throw new RangeError('eof'); c = b[p++]; v = (v << 7) | (c & 0x7f); } while (c & 0x80);
    return v;
  };
  try {
    while (p < b.length) {
      tick += vlq();
      let s = b[p];
      if (s & 0x80) { p++; if (s < 0xf0) status = s; }
      else { if (!status) throw new Error('running status with no status'); s = status; }
      if (s === 0xff) {
        const type = b[p++]; const len = vlq();
        const data = b.subarray(p, p + len); p += len;
        ev.push({ tick, meta: type, data });
        if (type === 0x2f) break;
      } else if (s === 0xf0 || s === 0xf7) {
        const len = vlq(); p += len;
      } else {
        const hi = s & 0xf0, ch = s & 0x0f;
        const a = b[p++];
        const two = hi !== 0xc0 && hi !== 0xd0;
        const c = two ? b[p++] : 0;
        ev.push({ tick, hi, ch, a, b: c });
      }
    }
  } catch (e) { warn.push(`track ${ti}: ${e.message} at byte ${p}`); }
  return { ev, end: tick };
}

const txt = (d) => d.toString('latin1').replace(/[^\x20-\x7e]/g, '').trim();

/* tempo map -> tick->seconds; time signature; text */
export function analyse(mid) {
  const tempos = [], sigs = [], texts = [];
  for (const [ti, t] of mid.tracks.entries()) for (const e of t.ev) {
    if (e.meta === 0x51 && e.data.length >= 3) tempos.push({ tick: e.tick, us: (e.data[0] << 16) | (e.data[1] << 8) | e.data[2] });
    else if (e.meta === 0x58 && e.data.length >= 2) sigs.push({ tick: e.tick, num: e.data[0], den: 1 << e.data[1] });
    else if (e.meta >= 1 && e.meta <= 7) texts.push({ ti, type: e.meta, s: txt(e.data) });
  }
  tempos.sort((a, b) => a.tick - b.tick);
  if (!tempos.length || tempos[0].tick > 0) tempos.unshift({ tick: 0, us: 500000 });
  // cumulative seconds at each tempo change
  let acc = 0;
  for (let i = 0; i < tempos.length; i++) {
    if (i) acc += (tempos[i].tick - tempos[i - 1].tick) * tempos[i - 1].us / 1e6 / mid.ppq;
    tempos[i].sec = acc;
  }
  const sec = (tick) => {
    if (mid.smpte) return tick / mid.smpte;
    let lo = 0, hi = tempos.length - 1;
    while (lo < hi) { const m = (lo + hi + 1) >> 1; if (tempos[m].tick <= tick) lo = m; else hi = m - 1; }
    const t = tempos[lo];
    return t.sec + (tick - t.tick) * t.us / 1e6 / mid.ppq;
  };
  sigs.sort((a, b) => a.tick - b.tick);
  return { tempos, sigs, texts, sec };
}

/* notes grouped into parts by (track, channel) */
export function collectParts(mid) {
  const parts = new Map();
  for (const [ti, t] of mid.tracks.entries()) {
    const prog = new Array(16).fill(-1);
    const open = new Map();
    // track name: 0x03, else instrument 0x04, else a short first text event --
    // plenty of sequencers write "Lead Vox" as plain text and nothing else
    let name = '', alt = '';
    const get = (ch) => {
      const k = `t${ti}c${ch}`;
      if (!parts.has(k)) parts.set(k, { key: k, ti, ch, name: '', progs: new Map(), notes: [] });
      return parts.get(k);
    };
    for (const e of t.ev) {
      if (e.meta === 0x03 || e.meta === 0x04) { const s = txt(e.data); if (s && !name) name = s; continue; }
      if (e.meta === 0x01) { const s = txt(e.data); if (s && !alt && s.length <= 32) alt = s; continue; }
      if (e.meta !== undefined) continue;
      if (e.hi === 0xc0) { prog[e.ch] = e.a; continue; }
      const on = e.hi === 0x90 && e.b > 0, off = e.hi === 0x80 || (e.hi === 0x90 && e.b === 0);
      if (!on && !off) continue;
      const k = (e.ch << 7) | e.a;
      if (on) {
        const q = open.get(k) || []; q.push({ tick: e.tick, vel: e.b, prog: prog[e.ch] }); open.set(k, q);
      } else {
        const q = open.get(k); if (!q || !q.length) continue;
        const n = q.shift();
        const pt = get(e.ch);
        pt.notes.push({ tick: n.tick, dur: Math.max(1, e.tick - n.tick), pitch: e.a, vel: n.vel });
        pt.progs.set(n.prog, (pt.progs.get(n.prog) || 0) + 1);
      }
    }
    for (const [k, q] of open) for (const n of q) {      // never released
      const pt = get(k >> 7);
      pt.notes.push({ tick: n.tick, dur: Math.max(1, t.end - n.tick), pitch: k & 127, vel: n.vel });
      pt.progs.set(n.prog, (pt.progs.get(n.prog) || 0) + 1);
    }
    for (const pt of parts.values()) if (pt.ti === ti) pt.name = name || alt;
  }
  for (const pt of parts.values()) {
    pt.notes.sort((a, b) => a.tick - b.tick || b.pitch - a.pitch);
    let best = -1, bn = -1;
    for (const [pg, n] of pt.progs) if (n > bn) { bn = n; best = pg; }
    pt.prog = best;
  }
  return [...parts.values()].filter((p) => p.notes.length);
}

/* ============================================================
   2-3. CHOOSE PARTS
   ============================================================ */
const GM_FAMILY = ['piano', 'chrom', 'organ', 'guitar', 'bass', 'strings', 'ensemble', 'brass',
  'reed', 'pipe', 'synlead', 'synpad', 'synfx', 'ethnic', 'perc', 'sfx'];
const fam = (prog) => (prog < 0 ? 'piano' : GM_FAMILY[prog >> 3]);

function partStats(pt, barTicks, nBars) {
  const n = pt.notes;
  const bars = new Set();
  let sum = 0, poly = 0;
  for (let i = 0; i < n.length; i++) {
    sum += n[i].pitch;
    bars.add(Math.floor(n[i].tick / barTicks));
    // simultaneous onset with a neighbour, or starts while the previous is still held
    const prev = n[i - 1];
    if (prev && (n[i].tick - prev.tick < barTicks / 32 || prev.tick + prev.dur > n[i].tick + barTicks / 16)) poly++;
  }
  return {
    count: n.length, mean: sum / n.length, poly: poly / n.length,
    cover: bars.size / Math.max(1, nBars), bars,
    density: n.length / Math.max(1, bars.size),
  };
}

const VOCAL_RX = /vocal|voice|vox|melod|lead|sing|tune|chant|words|lyric|solo/i;
const BASS_RX = /bass/i;
const DRUM_RX = /drum|perc|kit/i;

/* how far two parts are the same notes: Jaccard over (onset, pitch class) */
function same(a, b, q) {
  const key = (n) => `${Math.round(n.tick / q)}:${n.pitch % 12}`;
  const A = a._keys || (a._keys = new Set(a.notes.map(key)));
  const B = b._keys || (b._keys = new Set(b.notes.map(key)));
  let i = 0; for (const k of A) if (B.has(k)) i++;
  return i / (A.size + B.size - i);
}

function chooseParts(parts, barTicks, nBars, force) {
  const tonal = parts.filter((p) => p.ch !== 9);
  const q16 = barTicks / 16;
  for (const p of parts) p.st = partStats(p, barTicks, nBars);
  const why = {};
  const one = (k) => tonal.find((p) => p.key === k) || (() => { throw new Error(`no part ${k}`); })();
  // "t1c3+t2c2": a tune split across tracks (a duet, verse on one, chorus on
  // another) is merged into one part before the mono reduction
  const pick = (k) => {
    if (!k.includes('+')) return one(k);
    const ps = k.split('+').map(one);
    const m = { key: k, ti: ps[0].ti, ch: ps[0].ch, name: ps.map((p) => p.name).join(' + '), prog: ps[0].prog,
      notes: ps.flatMap((p) => p.notes).sort((a, b) => a.tick - b.tick || b.pitch - a.pitch) };
    m.st = partStats(m, barTicks, nBars);
    parts.push(m);
    return m;
  };

  // bass
  let bass = null;
  if (force.bass) { bass = pick(force.bass); why.bass = 'forced'; }
  else {
    let best = -1e9;
    for (const p of tonal) {
      if (p.st.count < 16 || p.st.mean > 60) continue;
      let s = p.st.cover * 3 - (p.st.mean - 40) / 8 - p.st.poly * 2;
      const r = [];
      if (fam(p.prog) === 'bass') { s += 3; r.push(`GM ${p.prog} bass`); }
      if (BASS_RX.test(p.name)) { s += 3; r.push(`name "${p.name}"`); }
      if (s > best) { best = s; bass = p; why.bass = [...r, `mean ${p.st.mean.toFixed(0)}`, `cover ${(p.st.cover * 100) | 0}%`].join(', '); }
    }
  }

  // lead: the tune is usually the vocal line -- monophonic, mid-high, everywhere
  let lead = null;
  if (force.lead) { lead = pick(force.lead); why.lead = 'forced'; }
  else {
    let best = -1e9;
    // strict pass first; a song with nothing that passes (an instrumental, a
    // rap over a riff) falls back to the best part left rather than to silence
    for (const strict of [true, false]) for (const p of tonal) {
      if (lead && !strict) break;
      if (p === bass || p.st.count < 24) continue;
      if (strict && p.st.mean < 54) continue;                                 // a tune is not in the bass register
      if (strict && bass && same(p, bass, q16) > 0.6) continue;               // a bass doubled an octave up
      const f = fam(p.prog), r = [];
      // coverage and monophony carry the most weight: the tune is the part that
      // plays one note at a time nearly everywhere. A name only tips the
      // balance -- "Page lead" is a guitar fill and "Plant" is the vocal.
      let s = p.st.cover * 4 - p.st.poly * 4;
      if (VOCAL_RX.test(p.name) && !BASS_RX.test(p.name) && !/back|harm|bgv|oohs|aahs|choir/i.test(p.name) && p.st.cover > 0.15) {
        s += /vocal|voice|vox|melod|sing/i.test(p.name) ? 2.5 : 1.2; r.push(`name "${p.name}"`);
      }
      if (/^(reed|pipe|synlead|brass)$/.test(f) || [52, 53, 54, 85].includes(p.prog)) { s += 0.6; r.push(`GM ${p.prog} ${f}`); }
      if (p.st.mean >= 58 && p.st.mean <= 82) s += 1; else s -= 1.5;
      if (p.st.density > 40) s -= 1.5;               // an arpeggio or a strum, not a tune
      if (/^(guitar|piano|organ)$/.test(f) && p.st.poly > 0.3) s -= 1;
      if (s > best) { best = s; lead = p; why.lead = [...r, `poly ${(p.st.poly * 100) | 0}%`, `mean ${p.st.mean.toFixed(0)}`, `cover ${(p.st.cover * 100) | 0}%`].join(', '); }
    }
  }

  // harmony: the busiest accompaniment parts left, by coverage x notes
  let harm = [];
  if (force.harm) { harm = force.harm.map(pick); why.harm = 'forced'; }
  else {
    const rest = tonal.filter((p) => p !== bass && p !== lead && p.st.count >= 24 && p.st.mean > 44);
    rest.sort((a, b) => (b.st.cover * 3 + Math.log(b.st.count)) - (a.st.cover * 3 + Math.log(a.st.count)));
    // sequencers double parts -- two identical guitars, a vocal on three
    // channels. A doubled part is one voice twice as loud, not a harmony.
    for (const p of rest) {
      if (harm.length >= 2) break;
      if ([lead, bass, ...harm].some((q) => q && same(p, q, q16) > 0.6)) continue;
      harm.push(p);
    }
    why.harm = harm.map((p) => `${p.key} GM ${p.prog} ${fam(p.prog)} "${p.name}" cover ${(p.st.cover * 100) | 0}%`).join('; ');
  }
  const drums = parts.filter((p) => p.ch === 9);
  return { bass, lead, harm, drums, why };
}

/* ============================================================
   4. GRID
   ============================================================ */
function gridFit(notes, ppq, res) {
  const step = ppq / res;
  let ok = 0;
  for (const n of notes) {
    const e = Math.abs(n.tick / step - Math.round(n.tick / step));
    if (e < 0.2) ok++;
  }
  return ok / Math.max(1, notes.length);
}

function chooseRes(notes, ppq) {
  const fits = {};
  let best = 4, bs = -1;
  for (const r of [4, 6, 8, 12]) {
    if (ppq % r && ppq / r < 2) continue;
    fits[r] = gridFit(notes, ppq, r);
    const s = fits[r] - (r === 4 ? 0 : r === 6 ? 0.06 : r === 8 ? 0.08 : 0.12);
    if (s > bs) { bs = s; best = r; }
  }
  return { res: best, fits };
}

/* ============================================================
   5. MONO
   ============================================================ */
function foldPitch(m, lo, hi) {
  while (m < lo) m += 12;
  while (m > hi) m -= 12;
  return m;
}

function monoVoice(notes, step, mode, lo, hi) {
  // group by quantised onset
  const by = new Map();
  for (const n of notes) {
    const s = Math.round(n.tick / step);
    const l = Math.max(1, Math.round(n.dur / step));
    if (!by.has(s)) by.set(s, []);
    by.get(s).push({ s, l, pitch: n.pitch });
  }
  const out = [];
  for (const s of [...by.keys()].sort((a, b) => a - b)) {
    const g = by.get(s).sort((a, b) => b.pitch - a.pitch);
    let n;
    if (mode === 'high') n = g[0];
    else if (mode === 'low') n = g[g.length - 1];
    else if (mode === 'second') { if (g.length < 2) continue; n = g[1]; }
    const prev = out[out.length - 1];
    if (prev && prev.s + prev.l > s) prev.l = s - prev.s;     // every onset cuts the note before
    out.push({ s, l: n.l, m: foldPitch(n.pitch, lo, hi) });
  }
  return out.filter((n) => n.l > 0);
}

const DRUM_MAP = (k) => {
  if (k === 35 || k === 36) return 1;                               // kick
  if (k === 37 || k === 38 || k === 39 || k === 40) return 2;      // snare, side stick, clap
  if (k === 42 || k === 44 || k === 51 || k === 53 || k === 59 || k === 54 || k === 69 || k === 70 || k === 82) return 4;  // closed hat, ride, tambourine, shaker
  if (k === 46) return 8;                                           // open hat
  if (k === 49 || k === 52 || k === 55 || k === 57) return 16;     // crash, china, splash
  if (k === 41 || k === 43 || k === 45 || k === 47 || k === 48 || k === 50) return 32;  // toms
  return 0;
};

/* ============================================================
   6. WINDOW
   ============================================================ */
function chooseWindow(ctx, opt) {
  const { barTicks, nBars, sec, voices, drumBars } = ctx;
  const leadBars = voices.lead ? voices.lead.st.bars : new Set();
  const bassBars = voices.bass ? voices.bass.st.bars : new Set();
  const anyBars = new Set();
  for (const p of ctx.all) for (const b of p.st.bars) anyBars.add(b);
  const first = Math.min(...anyBars), last = Math.max(...anyBars);
  const barSec = (a, b) => sec(b * barTicks) - sec(a * barTicks);
  // bass pitch-class signature per bar, for judging the loop seam
  const sig = new Map();
  if (voices.bass) for (const n of voices.bass.notes) {
    const b = Math.floor(n.tick / barTicks);
    if (!sig.has(b)) sig.set(b, new Set());
    sig.get(b).add(n.pitch % 12);
  }
  const seam = (a, b) => {
    const x = sig.get(a), y = sig.get(b);
    if (!x || !y) return drumBars.has(a) === drumBars.has(b) ? 0.3 : 0;
    let i = 0; for (const v of x) if (y.has(v)) i++;
    return i / (x.size + y.size - i);
  };

  if (opt.start !== undefined) {
    const s = opt.start;
    let n = opt.bars;
    if (!n) { n = 1; while (s + n <= last && barSec(s, s + n) < 90) n++; }
    return { s, n, why: 'forced' };
  }
  const whole = barSec(first, last + 1);
  if (whole <= 135) return { s: first, n: last + 1 - first, why: `whole song (${whole.toFixed(0)}s)` };

  let best = null;
  const leadIn = [...leadBars].filter((b) => b >= first).sort((a, b) => a - b)[0] ?? first;
  for (let s = first; s <= last; s++) {
    for (let n = 8; s + n <= last + 1; n++) {
      const d = barSec(s, s + n);
      if (d < 60) continue;
      if (d > 120) break;
      let L = 0, B = 0, D = 0;
      for (let b = s; b < s + n; b++) { L += leadBars.has(b); B += bassBars.has(b); D += drumBars.has(b); }
      let score = 2.2 * L / n + B / n + D / n;
      score += 1.2 * (s + n <= last ? seam(s, s + n) : seam(s, first));
      const ph = (s - leadIn) % 8;
      score += ph === 0 ? 0.35 : (s - leadIn) % 4 === 0 ? 0.15 : 0;
      if (n % 8 === 0) score += 0.25; else if (n % 4 === 0) score += 0.1;
      score -= d < 90 ? (90 - d) / 45 : (d - 90) / 150;       // long enough not to nag
      score -= (s - first) / Math.max(1, last - first) * 0.3;     // earlier is more recognisable
      // tempo stability across the window
      const bpmA = 60 / (barSec(s, s + 1) / (barTicks / ctx.ppq));
      const bpmB = 60 / (barSec(s + n - 1, s + n) / (barTicks / ctx.ppq));
      score -= Math.min(1, Math.abs(bpmA - bpmB) / bpmA * 4);
      if (!best || score > best.score) best = { s, n, score };
    }
  }
  if (!best) return { s: first, n: last + 1 - first, why: 'no 60-120s window; whole song' };
  best.why = `scored ${best.score.toFixed(2)}`;
  return best;
}

/* ============================================================
   7. ENCODE
   ============================================================ */
function encodeVoice(notes) {
  let out = '', prev = 0;
  for (const n of notes) {
    let d = n.s - prev;
    while (d > 63) { out += '.' + L64[63] + '0'; d -= 63; }
    out += L64[n.m - PMIN] + L64[d] + L64[Math.min(63, n.l)];
    prev = n.s;
  }
  return out;
}

export function decodeVoice(str) {
  const out = []; let s = 0;
  for (let i = 0; i + 2 < str.length; i += 3) {
    s += L64.indexOf(str[i + 1]);
    if (str[i] === '.') continue;
    out.push({ s, m: L64.indexOf(str[i]) + PMIN, l: L64.indexOf(str[i + 2]) });
  }
  return out;
}

/* role defaults -- mirrors the voices in src/20_audio.js (square bass, square
   lead, triangle pad) with a 25% pulse on the tune so it sits above the bass */
export const ROLE = {
  bass: { wave: 'square', vol: 0.15, range: [33, 60], mode: 'low' },
  lead: { wave: 'pulse25', vol: 0.11, range: [57, 88], mode: 'high' },
  harm: { wave: 'triangle', vol: 0.11, range: [48, 79], mode: 'high' },
  harm2: { wave: 'pulse12', vol: 0.045, range: [48, 79], mode: 'high' },
};

/* ============================================================
   ARRANGE
   ============================================================ */
export function arrange(file, opt = {}) {
  const mid = parseMidi(readFileSync(file));
  const an = analyse(mid);
  const parts = collectParts(mid);
  let sig = an.sigs[0] || { num: 4, den: 4 };
  // a 1/4 or 2/4 signature on a rock song is a sequencer default, not a metre;
  // bars of a beat would wreck phrase alignment, so count in fours
  if (sig.num * 4 / sig.den < 3 || !Number.isInteger(sig.num * 4 / sig.den * 4)) sig = { num: 4, den: 4 };
  const barTicks = mid.ppq * sig.num * 4 / sig.den;
  const endTick = Math.max(...parts.map((p) => Math.max(...p.notes.map((n) => n.tick + n.dur))));
  const nBars = Math.ceil(endTick / barTicks);
  const ch = chooseParts(parts, barTicks, nBars, opt);
  if (!ch.lead) throw new Error('no lead candidate');

  const tonalNotes = [ch.lead, ch.bass, ...ch.harm].filter(Boolean).flatMap((p) => p.notes);
  const g = opt.res ? { res: opt.res, fits: { [opt.res]: gridFit(tonalNotes, mid.ppq, opt.res) } } : chooseRes(tonalNotes, mid.ppq);
  const res = g.res, step = mid.ppq / res;
  const barSteps = Math.round(barTicks / step);

  const drumBars = new Set();
  for (const p of ch.drums) for (const n of p.notes) drumBars.add(Math.floor(n.tick / barTicks));
  const win = chooseWindow({ barTicks, nBars, sec: an.sec, voices: ch, drumBars, all: parts, ppq: mid.ppq }, opt);
  const s0 = win.s * barSteps, len = win.n * barSteps;
  const t0 = win.s * barTicks, t1 = (win.s + win.n) * barTicks;
  const secs = an.sec(t1) - an.sec(t0);
  const bpm = win.n * barTicks / mid.ppq / secs * 60;

  const clip = (notes) => notes
    .map((n) => ({ ...n, s: n.s - s0 }))
    .filter((n) => n.s >= 0 && n.s < len)
    .map((n) => ({ ...n, l: Math.min(n.l, len - n.s) }));

  const voices = [];
  const add = (role, part, mode, rk = role) => {
    if (!part) return;
    const r = ROLE[rk];
    const notes = clip(monoVoice(part.notes, step, mode || r.mode, r.range[0], r.range[1]));
    if (notes.length < 8) return;
    voices.push({ role, wave: r.wave, vol: r.vol, notes, from: part.key });
  };
  add('bass', ch.bass);
  add('lead', ch.lead);
  if (ch.harm[0]) add('harm', ch.harm[0], 'high');
  if (ch.harm[1]) add('harm', ch.harm[1], 'high', 'harm2');
  else if (ch.harm[0] && ch.harm[0].st.poly > 0.3) add('harm', ch.harm[0], 'second', 'harm2');

  // drums
  const kit = new Array(len).fill(0);
  let drumHits = 0;
  for (const p of ch.drums) for (const n of p.notes) {
    const s = Math.round(n.tick / step) - s0;
    if (s < 0 || s >= len) continue;
    const b = DRUM_MAP(n.pitch);
    if (b) { kit[s] |= b; drumHits++; }
  }
  // a closed hat under an open one on the same step is just the open hat
  for (let i = 0; i < len; i++) if (kit[i] & 8) kit[i] &= ~4;

  const id = opt.id || basename(file, '.mid').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const song = {
    id,
    title: opt.title || basename(file, '.mid'),
    artist: opt.artist || '',
    year: opt.year || 0,
    ...(opt.month ? { month: opt.month } : {}),
    src: opt.src || basename(file),
    bpm: Math.round(bpm * 100) / 100,
    res, bar: barSteps, len,
    voices: voices.map((v) => ({ role: v.role, wave: v.wave, vol: v.vol, n: encodeVoice(v.notes) })),
    drums: ch.drums.length ? kit.map((m) => L64[m]).join('').replace(/0+$/, '') : '',
  };
  const report = {
    file, format: mid.format, ppq: mid.ppq, tracks: mid.tracks.length, warn: mid.warn,
    sig: `${sig.num}/${sig.den}`, tempos: an.tempos.length, nBars,
    parts: parts.map((p) => ({ key: p.key, name: p.name, prog: p.prog, fam: p.ch === 9 ? 'drums' : fam(p.prog), ...p.st, bars: undefined })),
    why: ch.why, fits: g.fits, res, win, secs, bpm,
    voices: voices.map((v) => ({ role: v.role, from: v.from, notes: v.notes.length })),
    drumHits, bytes: Buffer.byteLength(JSON.stringify(song)),
    text: an.texts.slice(0, 12).map((t) => t.s).filter(Boolean),
  };
  return { song, report, voices, kit };
}

/* ============================================================
   PREVIEW -- a WAV through the same voice shapes as 22_music.js
   ============================================================ */
export function renderWav(song, path, { rate = 22050 } = {}) {
  const spb = 60 / song.bpm / song.res;
  const total = song.len * spb + 1.0;
  const N = Math.ceil(total * rate);
  const buf = new Float32Array(N);
  const mf = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const blep = (t, dt) => {
    if (t < dt) { t /= dt; return t + t - t * t - 1; }
    if (t > 1 - dt) { t = (t - 1) / dt; return t * t + t + t + 1; }
    return 0;
  };
  const duty = { square: 0.5, pulse25: 0.25, pulse12: 0.125 };
  for (const v of song.voices) {
    const notes = decodeVoice(v.n);
    const sus = v.role === 'bass' ? 0.6 : v.role === 'lead' ? 0.75 : 0.55;
    for (const n of notes) {
      const t = n.s * spb, dur = n.l * spb * 0.92;
      const f = mf(n.m), dt = f / rate;
      const i0 = Math.floor(t * rate), i1 = Math.min(N, Math.floor((t + dur + 0.03) * rate));
      let ph = 0;
      for (let i = i0; i < i1; i++) {
        const tt = (i - i0) / rate;
        let fv = f;
        if (v.role === 'lead' && dur > 0.45 && tt > 0.22) fv *= 1 + 0.006 * Math.sin(2 * Math.PI * 5.5 * tt) * Math.min(1, (tt - 0.22) / 0.2);
        const d = fv / rate;
        ph += d; if (ph >= 1) ph -= 1;
        let s;
        if (v.wave === 'triangle') s = 4 * Math.abs(ph - 0.5) - 1;
        else {
          const w = duty[v.wave] || 0.5;
          s = (ph < w ? 1 : -1) + blep(ph, d) - blep((ph - w + 1) % 1, d);
          s -= 2 * w - 1;                                  // remove the DC of a narrow pulse
          s /= 1 + Math.abs(2 * w - 1);                    // peak 1, as WebAudio normalises a PeriodicWave
        }
        buf[i] += s * v.vol * envAt(tt, dur, sus);
      }
    }
  }
  // kit
  const kit = song.drums || '';
  let seed = 1;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 4294967296) * 2 - 1;
  for (let k = 0; k < kit.length; k++) {
    const m = L64.indexOf(kit[k]); if (!m) continue;
    const i0 = Math.floor(k * spb * rate);
    for (const [bit, d] of Object.entries(DRUMS)) {
      if (!(m & +bit)) continue;
      const n = Math.min(N - i0, Math.ceil(d.dur * rate));
      let lp = 0, hpPrev = 0, hpOut = 0, ph = 0;
      const a = Math.exp(-2 * Math.PI * (d.lp || 20000) / rate);
      const hpA = d.hp ? Math.exp(-2 * Math.PI * d.hp / rate) : 0;
      for (let j = 0; j < n; j++) {
        const tt = j / rate;
        const env = Math.exp(-tt / (d.dur / 5));
        let x = 0;
        if (d.nz) {
          let w = rnd();
          if (d.hp) { hpOut = hpA * (hpOut + w - hpPrev); hpPrev = w; w = hpOut; }
          lp = (1 - a) * w + a * lp;
          x += (d.lp ? lp : w) * d.nz;
        }
        if (d.f0) {
          const f = d.f1 + (d.f0 - d.f1) * Math.exp(-tt / d.fall);
          ph += f / rate; if (ph >= 1) ph -= 1;
          x += (4 * Math.abs(ph - 0.5) - 1) * d.tone;
        }
        buf[i0 + j] += x * env;
      }
    }
  }
  // musBus 0.30 * master 0.85, then a soft clip like a real mix bus would not need
  let peak = 0, rms = 0;
  for (let i = 0; i < N; i++) { buf[i] *= 0.30 * 0.85; peak = Math.max(peak, Math.abs(buf[i])); rms += buf[i] * buf[i]; }
  rms = Math.sqrt(rms / N);
  const norm = 0.89 / Math.max(peak, 1e-6);       // normalised for listening; peak/rms reported raw
  const out = Buffer.alloc(44 + N * 2);
  out.write('RIFF', 0); out.writeUInt32LE(36 + N * 2, 4); out.write('WAVE', 8);
  out.write('fmt ', 12); out.writeUInt32LE(16, 16); out.writeUInt16LE(1, 20); out.writeUInt16LE(1, 22);
  out.writeUInt32LE(rate, 24); out.writeUInt32LE(rate * 2, 28); out.writeUInt16LE(2, 32); out.writeUInt16LE(16, 34);
  out.write('data', 36); out.writeUInt32LE(N * 2, 40);
  for (let i = 0; i < N; i++) out.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(buf[i] * norm * 32767))), 44 + i * 2);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, out);
  return { peak, rms, secs: total };
}

/* envelope shared with 22_music.js: 4ms attack, a 90ms fall to the sustain
   level, held, then a 30ms release. A note too short for that is a pluck. */
function envAt(t, dur, sus) {
  const A = 0.004, D = 0.09, R = 0.03;
  if (t < A) return t / A;
  if (dur < A + D) {                                   // pluck: straight decay to the end
    if (t < dur) return 1 - (1 - 0.3) * (t - A) / Math.max(1e-4, dur - A);
    return Math.max(0, 0.3 * (1 - (t - dur) / R));
  }
  let lvl = t < A + D ? 1 - (1 - sus) * (t - A) / D : sus;
  if (t >= dur) lvl = Math.max(0, sus * (1 - (t - dur) / R));
  return lvl;
}

/* kit voices -- mirrored in 22_music.js Music._drum */
export const DRUMS = {
  1: { dur: 0.13, f0: 150, f1: 42, fall: 0.025, tone: 0.55, nz: 0.12, lp: 300 },      // kick
  2: { dur: 0.14, f0: 210, f1: 150, fall: 0.03, tone: 0.16, nz: 0.30, lp: 3200, hp: 600 }, // snare
  4: { dur: 0.04, nz: 0.10, hp: 7000 },                                               // closed hat
  8: { dur: 0.18, nz: 0.08, hp: 6000 },                                               // open hat
  16: { dur: 0.75, nz: 0.09, hp: 4000 },                                              // crash
  32: { dur: 0.16, f0: 240, f1: 110, fall: 0.06, tone: 0.35 },                        // tom
};

/* ============================================================
   CLI
   ============================================================ */
function printReport(r, song, verbose = true) {
  const pct = (x) => `${Math.round(x * 100)}%`;
  console.log(`\n== ${r.file}`);
  console.log(`   format ${r.format}, ${r.tracks} tracks, ppq ${r.ppq}, ${r.sig}, ${r.tempos} tempo event(s), ${r.nBars} bars${r.warn.length ? '  WARN ' + r.warn.join('; ') : ''}`);
  if (verbose) for (const p of r.parts)
    console.log(`   ${p.key.padEnd(7)} ${String(p.prog).padStart(3)} ${p.fam.padEnd(8)} n=${String(p.count).padStart(5)} mean=${p.mean.toFixed(0).padStart(2)} poly=${pct(p.poly).padStart(4)} cover=${pct(p.cover).padStart(4)}  "${p.name}"`);
  console.log(`   bass: ${r.why.bass || '-'}`);
  console.log(`   lead: ${r.why.lead || '-'}`);
  console.log(`   harm: ${r.why.harm || '-'}`);
  console.log(`   grid: res ${r.res}  fits ${Object.entries(r.fits).map(([k, v]) => `${k}:${pct(v)}`).join(' ')}`);
  console.log(`   window: bars ${r.win.s}-${r.win.s + r.win.n - 1} (${r.win.n} bars, ${r.secs.toFixed(1)}s) ${r.win.why}; bpm ${r.bpm.toFixed(1)}`);
  console.log(`   voices: ${r.voices.map((v) => `${v.role}<${v.from}>=${v.notes}`).join('  ')}  drums=${r.drumHits}`);
  console.log(`   bytes: ${r.bytes}`);
}

function parseArgs(argv) {
  const o = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      if (['preview', 'quiet'].includes(k)) o[k] = true;
      else o[k] = argv[++i];
    } else o._.push(a);
  }
  return o;
}

function optsFrom(o) {
  const n = (v) => (v === undefined ? undefined : +v);
  const month = n(o.month);
  if (month !== undefined && !(Number.isInteger(month) && month >= 1 && month <= 12))
    throw new Error(`--month ${o.month}: a release month is an integer 1-12 (1 = January)`);
  return {
    id: o.id, title: o.title, artist: o.artist, year: n(o.year), month, src: o.src,
    start: n(o.start), bars: n(o.bars), res: n(o.res),
    lead: o.lead, bass: o.bass, harm: o.harm ? (Array.isArray(o.harm) ? o.harm : String(o.harm).split(',')) : undefined,
  };
}

function walk(dir) {
  const out = [];
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (/\.(mid|midi|kar|rmi)$/i.test(f)) out.push(p);
  }
  return out;
}

const HERE = dirname(fileURLToPath(import.meta.url));

function main() {
  const o = parseArgs(process.argv.slice(2));
  if (o.scan) {
    const files = walk(o.scan);
    let ok = 0; const bad = [];
    for (const f of files) {
      try {
        const { report: r } = arrange(f);
        ok++;
        if (!o.quiet) printReport(r, null, false);
      } catch (e) { bad.push(`${f}: ${e.message}`); }
    }
    console.log(`\nscan: ${ok}/${files.length} parsed and arranged cleanly`);
    for (const b of bad) console.log('  FAIL ' + b);
    return;
  }
  if (o.batch) {
    const list = JSON.parse(readFileSync(o.batch, 'utf8'));
    const root = list._root || 'reference/assets/midi';
    let total = 0;
    for (const s of list.songs) {
      const file = join(root, s.file);
      const { song, report } = arrange(file, optsFrom({ ...s, src: s.file }));
      const outp = join('content', 'music', `${song.id}.json`);
      writeFileSync(outp, JSON.stringify(song) + '\n');
      total += report.bytes;
      printReport(report, song, !o.quiet);
      if (o.preview) {
        const w = renderWav(song, join(HERE, 'preview', `${song.id}.wav`));
        console.log(`   preview: ${song.id}.wav  ${w.secs.toFixed(1)}s  peak ${w.peak.toFixed(3)} rms ${w.rms.toFixed(3)}`);
      }
    }
    console.log(`\nbatch: ${list.songs.length} songs, ${total} bytes`);
    return;
  }
  const file = o._[0];
  if (!file) { console.error('usage: node tools/music/midi2song.mjs <file.mid> [--preview] | --scan DIR | --batch songs.json'); process.exit(1); }
  const { song, report } = arrange(file, optsFrom(o));
  printReport(report, song);
  if (o.out) writeFileSync(o.out, JSON.stringify(song) + '\n');
  if (o.preview) {
    const w = renderWav(song, join(HERE, 'preview', `${song.id}.wav`));
    console.log(`   preview: tools/music/preview/${song.id}.wav  ${w.secs.toFixed(1)}s  peak ${w.peak.toFixed(3)} rms ${w.rms.toFixed(3)}`);
  }
}

if (process.argv[1] && basename(process.argv[1]) === 'midi2song.mjs') main();
