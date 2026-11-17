/* Zero dependencies, Node built-ins only.
   --------------------------------------------------------------
   pick-best.mjs -- bring a folder of scraped MIDIs into the library, one file
   per song, choosing the version most likely to make a good chip arrangement.

       node tools/music/pick-best.mjs <scrape dir> [--to reference/assets/midi]
            [--from 1970] [--until 1999] [--dry] [--limit N]

   The scrape names files "Artist - Title (Year).mid", with " v2", " v3"... on
   the extra versions of a song. Files without a year, or outside the years,
   are left where they are. Each song's versions are scored and the winner is
   copied to <to>/70s|80s|90s/ under the plain name (no " vN"), so the Convert
   form can read artist, title and year from it. Never overwrites a file.

   THE QUALITY GATE. Each version is run through the converter itself
   (midi2song.mjs arrange()), so the score is "how good a song would Convert
   make from this", not a guess from the file size. A version the converter
   cannot arrange is out. The rest score, out of about 100:
     lead      the tune, weighted most because it is what makes a song
               recognisable: covers the song (x20), plays one note at a time
               (poly x-12), and is a part named vocal/melody (+10)
     bass      a bass voice was found (+10)
     harmony   +4 per harmony voice, up to two
     drums     a kit, by hits per bar in the window (up to +15)
     window    the converter's own 60-120s loop score (up to +20);
               no window found (a short or broken file) -5
     grid      how well the notes sit on the chosen grid (x10)
     parts     +1 per tonal part, up to 8 (a full arrangement, not a sketch)
     warnings  -5 per parse warning (a truncated or junk track), up to -15
   The report (picks-report.json in <to>) lists every song, every version, its
   score and the reason any version failed.
*/
import { readdirSync, copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, basename } from 'node:path';
import { arrange } from './midi2song.mjs';

const NAME_RX = /^(.+?) - (.+) \((\d{4})\)(?: v(\d+))?\.midi?$/i;

export function parseName(file) {
  const m = basename(file).match(NAME_RX);
  if (!m) return null;
  return { artist: m[1].trim(), title: m[2].trim(), year: +m[3], v: m[4] ? +m[4] : 1 };
}

const VOCAL_NAME = /vocal|voice|vox|melod|sing/i;

export function scoreVersion(file) {
  let r;
  try { r = arrange(file).report; } catch (e) { return { ok: false, why: e.message }; }
  const part = (k) => r.parts.find((p) => p.key === k);
  const role = (k) => r.voices.filter((v) => v.role === k);
  const lead = role('lead')[0], lp = lead && part(lead.from);
  const s = {};
  s.lead = lp ? lp.cover * 20 - lp.poly * 12 + (VOCAL_NAME.test(lp.name || '') ? 10 : 0) : -20;
  s.bass = role('bass').length ? 10 : 0;
  s.harm = Math.min(2, role('harm').length) * 4;
  const hpb = r.win && r.win.n ? r.drumHits / r.win.n : 0;
  s.drums = Math.min(1, hpb / 12) * 15;
  s.window = typeof r.win.score === 'number' ? Math.max(0, Math.min(5, r.win.score)) * 4 : -5;
  s.grid = (r.fits[r.res] || 0) * 10;
  s.parts = Math.min(8, r.parts.filter((p) => p.fam !== 'drums').length);
  s.warn = -Math.min(15, (r.warn || []).length * 5);
  for (const k in s) s[k] = Math.round(s[k] * 10) / 10;
  const total = Math.round(Object.values(s).reduce((a, b) => a + b, 0) * 10) / 10;
  return { ok: true, score: total, parts: s, secs: Math.round(r.secs) };
}

export const decadeOf = (y) => `${Math.floor(y / 10) % 10}0s`;

function args(argv) {
  const o = { _: [], to: 'reference/assets/midi', from: 1970, until: 1999 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry') o.dry = true;
    else if (a.startsWith('--')) o[a.slice(2)] = argv[++i];
    else o._.push(a);
  }
  o.from = +o.from; o.until = +o.until; if (o.limit) o.limit = +o.limit;
  return o;
}

function main() {
  const o = args(process.argv.slice(2));
  const src = o._[0];
  if (!src) { console.error('usage: node tools/music/pick-best.mjs <scrape dir> [--to DIR] [--from Y] [--until Y] [--dry] [--limit N]'); process.exit(1); }

  // group the versions of each song (case-insensitive: Windows names collide that way)
  const songs = new Map();
  let skipped = 0;
  for (const f of readdirSync(src, { withFileTypes: true })) {
    if (!f.isFile()) continue;
    const n = parseName(f.name);
    if (!n || n.year < o.from || n.year > o.until) { skipped++; continue; }
    const key = `${n.artist} - ${n.title} (${n.year})`;
    const k = key.toLowerCase();
    if (!songs.has(k)) songs.set(k, { key, ...n, versions: [] });
    songs.get(k).versions.push({ file: f.name, v: n.v });
  }
  let list = [...songs.values()].sort((a, b) => a.key.localeCompare(b.key));
  if (o.limit) list = list.slice(0, o.limit);

  const report = { _note: 'written by tools/music/pick-best.mjs', src, from: o.from, until: o.until, songs: [] };
  let copied = 0, existed = 0, failed = 0, n = 0;
  const t0 = Date.now();
  for (const song of list) {
    for (const v of song.versions) Object.assign(v, scoreVersion(join(src, v.file)));
    const ok = song.versions.filter((v) => v.ok);
    // ties go to the plain-named file, then the lower version number
    ok.sort((a, b) => b.score - a.score || a.v - b.v);
    const best = ok[0];
    const dir = decadeOf(song.year);
    const name = `${song.key}.mid`;
    const entry = { song: song.key, decade: dir, picked: best ? best.file : null, as: best ? `${dir}/${name}` : null, versions: song.versions };
    if (!best) { failed++; entry.as = null; }
    else {
      const dest = join(o.to, dir, name);
      if (existsSync(dest)) { existed++; entry.existed = true; }
      else if (!o.dry) { mkdirSync(join(o.to, dir), { recursive: true }); copyFileSync(join(src, best.file), dest); copied++; }
      else copied++;
    }
    report.songs.push(entry);
    if (++n % 250 === 0) console.log(`  ${n}/${list.length}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  if (!o.dry) writeFileSync(join(o.to, 'picks-report.json'), JSON.stringify(report, null, 1) + '\n');
  const byDec = {};
  for (const s of report.songs) if (s.as && !s.existed) byDec[s.decade] = (byDec[s.decade] || 0) + 1;
  console.log(`\n${list.length} songs (${skipped} files outside ${o.from}-${o.until} or unnamed, left alone)`);
  console.log(`${o.dry ? 'would copy' : 'copied'} ${copied}: ${Object.entries(byDec).map(([d, c]) => `${d} ${c}`).join(', ')}`);
  console.log(`${existed} already there, ${failed} with no version the converter could arrange`);
  console.log(`${((Date.now() - t0) / 1000).toFixed(0)}s`);
}

if (process.argv[1] && basename(process.argv[1]) === 'pick-best.mjs') main();
