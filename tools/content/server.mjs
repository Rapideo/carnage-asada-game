/* The admin server: serves the game with Service Mode injected into the page
   (in memory, never on disk) and writes content through the shared validator.
   Dev-only; nothing here is bundled into taco-shop.html. */
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { readFile, readdir, stat, writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { validateContent, memSource, ContentError, inGame, APPROVED } from './validate.mjs';
import { formatJSON, formatLike, formatSongs } from './format.mjs';
import { renderDocsAt, writeTexts, driftAt } from './docs/index.mjs';

const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json',
};
const BAKED = ['faces/', 'lattice/', 'board/'];
/* a face's file name and cast key: lower-case, like c70teacher */
const FACE_NAME = /^[a-z][a-z0-9]{1,23}$/, FACE_MAX_BYTES = 32 * 1024 * 1024;
/* the MIDI library, and a ported song's id: its file name in content/music/ */
const MIDI_DIR = 'reference/assets/midi', SONGS = 'tools/music/songs.json';
const SONG_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/, MIDI_FILE = /\.midi?$/i;
const INJECT ='<link rel="stylesheet" href="/admin/overlay.css"><script type="module" src="/admin/overlay.js"></script>';

/* Raw spawn: resolves, never rejects. It takes NO lock. Inside startAdmin, run
   jobs through the instance's withBusy/job so they share the lock with save. */
export function runJob(cmd, { cwd, env } = {}) {
  return new Promise((done) => {
    const p = spawn(cmd[0] === 'node' ? process.execPath : cmd[0], cmd.slice(1), { cwd, env: env ? { ...process.env, ...env } : undefined });
    let stdout = '', stderr = '';
    p.stdout.on('data', (d) => { stdout += d; });
    p.stderr.on('data', (d) => { stderr += d; });
    p.on('error', (e) => done({ code: -1, stdout, stderr: stderr + e.message }));
    p.on('close', (code) => done({ code, stdout, stderr }));
  });
}

async function walkJSON(dir, rel, out) {
  for (const ent of await readdir(dir, { withFileTypes: true })) {
    const r = rel ? rel + '/' + ent.name : ent.name;
    if (ent.isDirectory()) await walkJSON(join(dir, ent.name), r, out);
    else if (ent.name.endsWith('.json')) out.push(r);
  }
}

const readBody = (req) => new Promise((ok, no) => {
  let s = '';
  req.setEncoding('utf8');
  req.on('data', (d) => { s += d; });
  req.on('end', () => ok(s));
  req.on('error', no);
});

/* Later tasks add POST routes through `routes`: { '/admin/api/x': (req, res, api) => ... }
   where api = { withBusy, job, send, readBody, root }. A route that runs a tool script
   does:  const r = await api.job(['node', 'tools/x.mjs'], { cwd: root });
          if (r.busy) return api.send(res, 409, { error: 'busy' });
   The lock is per instance and is the same one save takes. The returned handle
   also exposes withBusy and job. Origin is checked before any route runs. */
/* renderDocs(files) -> { root-relative path: text } renders the docs mirror
   (tools/content/docs) from every content JSON as it will be saved. The save
   runs it BEFORE writing anything, so a render that throws fails the save with
   nothing written; then it writes the JSON and the docs, then builds. Pass
   () => ({}) to switch the mirror off. */
export async function startAdmin({ root, host = '127.0.0.1', port = 8124, renderDocs = (files) => renderDocsAt(root, files), routes = {} }) {
  const content = join(root, 'content');
  let busy = false;
  /* fn runs holding the lock; if it is taken, { busy: true } and fn never runs */
  const withBusy = async (fn) => {
    if (busy) return { busy: true };
    busy = true;
    try { return { busy: false, value: await fn() }; } finally { busy = false; }
  };
  /* a job under the lock: { busy: true } or { busy: false, code, stdout, stderr } */
  const job = async (cmd, o = {}) => {
    const r = await withBusy(() => runJob(cmd, { cwd: root, ...o }));
    return r.busy ? r : { busy: false, ...r.value };
  };
  const send = (res, code, obj) => {
    res.writeHead(code, { 'content-type': 'application/json', 'cache-control': 'no-store' });
    res.end(JSON.stringify(obj));
  };
  const stamps = async (rels) => {
    const o = {};
    for (const r of rels) o[r] = (await stat(join(content, r))).mtimeMs;
    return o;
  };
  const safeRel = (r) => typeof r === 'string' && r.endsWith('.json') && !r.startsWith('/')
    && !r.split('/').some((s) => s === '..' || s === '' || s.includes('\\'));

  async function save(req, res) {
    let body;
    try { body = JSON.parse(await readBody(req)); } catch { return send(res, 400, { error: 'bad request' }); }
    const posted = body && body.files, stamp = (body && body.stamp) || {};
    if (!posted || typeof posted !== 'object' || !Object.keys(posted).every(safeRel)) return send(res, 400, { error: 'bad request' });
    const held = await withBusy(() => saveLocked(res, posted, stamp));
    if (held.busy) send(res, 409, { error: 'busy' });
  }

  async function saveLocked(res, posted, stamp) {
    try {
      const rels = Object.keys(posted);
      const changed = [];
      for (const r of rels) {
        let m = null;
        try { m = (await stat(join(content, r))).mtimeMs; } catch { /* new file */ }
        if (r in stamp ? m !== stamp[r] : m !== null) changed.push(r);
      }
      if (changed.length) return send(res, 409, { error: 'changed', files: changed });

      const all = [];
      await walkJSON(content, '', all);
      const cand = {};
      for (const r of all) cand[r] = JSON.parse(await readFile(join(content, r), 'utf8'));
      const parsed = {};
      for (const r of rels) {
        try { parsed[r] = JSON.parse(posted[r]); }
        catch (e) { return send(res, 422, { error: 'invalid', file: 'content/' + r, path: [], message: `content/${r}: ${e.message}` }); }
        cand[r] = parsed[r];
      }
      try { validateContent(memSource(cand)); }
      catch (e) {
        if (!(e instanceof ContentError)) throw e;
        return send(res, 422, { error: 'invalid', file: e.file, path: e.path, message: e.message });
      }

      let docs;
      try { docs = await renderDocs(cand); }
      catch (e) { return send(res, 500, { error: 'docs', message: 'docs mirror: ' + String(e && e.message || e) }); }

      /* a baked table keeps the layout its tool wrote (format.mjs formatLike) */
      const texts = {};
      for (const r of rels) {
        let prev = null;
        if (BAKED.some((d) => r.startsWith(d))) { try { prev = await readFile(join(content, r), 'utf8'); } catch { /* new file */ } }
        texts['content/' + r] = prev === null ? formatJSON(parsed[r]) : formatLike(prev, parsed[r]);
      }
      await writeTexts(root, { ...texts, ...docs });
      const b = await runJob(['node', 'build.mjs'], { cwd: root });
      if (b.code !== 0) return send(res, 500, { error: 'build', output: b.stdout + b.stderr, stamp: await stamps(rels) });
      send(res, 200, { ok: true, build: b.stdout, stamp: await stamps(rels) });
    } catch (e) {
      send(res, 500, { error: 'server', message: String(e && e.message || e) });
    }
  }

  /* POST /admin/api/recolor { src, name, hue, sat, val }: derive a new well
     with tools/render/recolor-lattice.mjs, which writes
     content/lattice/<name>.json. Generated assets are written when generated:
     the file is inert until a saved menu names it, and nothing overwrites one,
     so a name that is already a file or a record is 409 exists.
     -> 200 { rel: 'lattice/<name>.json', json, output, stamp: { [rel]: mtimeMs } }
     (the stamp lets the store save an edit to the file it has just adopted) */
  async function recolor(req, res) {
    let b;
    try { b = JSON.parse(await readBody(req)); } catch { return send(res, 400, { error: 'bad request' }); }
    const { src, name } = b || {};
    const nums = ['hue', 'sat', 'val'].map((k) => (b && typeof b[k] === 'number' ? b[k] : NaN));
    /* a bin key is upper-case letters (validate.mjs checkSlot), and the record is named for it */
    if (typeof src !== 'string' || !/^[A-Z0-9]+$/.test(src) || typeof name !== 'string' || !/^[A-Z]+$/.test(name)
        || !nums.every(Number.isFinite) || nums[1] < 0 || nums[2] < 0) return send(res, 400, { error: 'bad request' });
    const dir = join(content, 'lattice'), rel = 'lattice/' + name.toLowerCase() + '.json';
    /* The existence check and the spawn hold ONE lock, so two requests for a
       new name cannot both pass the check: the second is busy, or (once the
       first is done) finds the file. runJob, not job: job would take the lock
       a second time and report busy against itself. The tool also opens its
       output exclusively ('wx'), so even outside this server nothing is
       overwritten. */
    const held = await withBusy(async () => {
      const list = (await readdir(dir)).filter((f) => f.endsWith('.json')), names = new Set();
      for (const f of list) {
        try { names.add(JSON.parse(await readFile(join(dir, f), 'utf8')).name); } catch { /* the validator reports it */ }
      }
      if (list.includes(name.toLowerCase() + '.json') || names.has(name)) return [409, { error: 'exists', rel }];
      if (!list.includes(src.toLowerCase() + '.json')) return [400, { error: 'no such well', src }];
      const r = await runJob(['node', 'tools/render/recolor-lattice.mjs', src, name, ...nums.map(String)], { cwd: root });
      if (r.code !== 0) return [/EEXIST/.test(r.stderr) ? 409 : 500, /EEXIST/.test(r.stderr) ? { error: 'exists', rel } : { error: 'job', output: r.stdout + r.stderr }];
      return [200, { rel, json: JSON.parse(await readFile(join(content, rel), 'utf8')), output: r.stdout.trim(), stamp: await stamps([rel]) }];
    });
    if (held.busy) return send(res, 409, { error: 'busy' });
    send(res, held.value[0], held.value[1]);
  }
  /* POST /admin/api/face { name, png: base64, crop?: [x, y, w, h] }: a new
     face, made by the steps docs/art_pipeline.md (Part 1) gives. The image is
     kept as reference art, reference/assets/images/faces/<name>.png. With no
     crop, `PROBE=1 fit-portrait.mjs` finds the bust; then bake-face.mjs bakes
     it to the bust budget (MAXW=60 MAXH=74), writing content/faces/<name>.json
     and reference/kitchen/faces/<name>.mjs. Like a recolour, the face is
     written when made: it ships with the next build (everything in
     content/faces/ does) but no customer wears it until a cast names it.
     Nothing is overwritten: a name that is already a face file, a record, a
     reference copy or a kept image is 409 exists. When a step fails, what this
     request wrote is removed (the name can be tried again) and the steps' output
     comes back as 422 { log }.
     -> 200 { rel: 'faces/<name>.json', json, log, stamp: { [rel]: mtimeMs } } */
  async function newFace(req, res) {
    let b;
    try { b = JSON.parse(await readBody(req)); } catch { return send(res, 400, { error: 'bad request' }); }
    const { name, png, crop } = b || {};
    const cropOk = crop == null || (Array.isArray(crop) && crop.length === 4 && crop.every((n) => Number.isInteger(n) && n >= 0) && crop[2] > 0 && crop[3] > 0);
    if (typeof name !== 'string' || !FACE_NAME.test(name) || typeof png !== 'string' || !png || !cropOk) return send(res, 400, { error: 'bad request' });
    const buf = Buffer.from(png, 'base64');
    if (!buf.length || buf.length > FACE_MAX_BYTES) return send(res, 400, { error: 'bad request' });
    const rel = 'faces/' + name + '.json';
    const R = { json: 'content/' + rel, mjs: 'reference/kitchen/faces/' + name + '.mjs', img: 'reference/assets/images/faces/' + name + '.png' };
    const abs = (r) => join(root, ...r.split('/'));
    const exists = async (r) => { try { await stat(abs(r)); return true; } catch { return false; } };
    /* the check and the jobs hold ONE lock, as the recolour does: runJob, not job */
    const held = await withBusy(async () => {
      const names = new Set();
      for (const f of (await readdir(join(content, 'faces')).catch(() => [])).filter((f) => f.endsWith('.json'))) {
        try { names.add(JSON.parse(await readFile(join(content, 'faces', f), 'utf8')).name); } catch { /* the validator reports it */ }
      }
      for (const r of Object.values(R)) if (await exists(r)) return [409, { error: 'exists', rel, file: r }];
      if (names.has(name.toUpperCase())) return [409, { error: 'exists', rel }];

      const made = [], log = [];
      const failed = async (why) => {
        for (const r of made) await rm(abs(r), { force: true });
        return [422, { log: log.concat(why ? [why] : []).join('\n') }];
      };
      await mkdir(join(root, 'reference', 'assets', 'images', 'faces'), { recursive: true });
      await writeFile(abs(R.img), buf, { flag: 'wx' });
      made.push(R.img);
      let box = crop;
      if (!box) {
        const p = await runJob(['node', 'tools/render/fit-portrait.mjs', abs(R.img)], { cwd: root, env: { PROBE: '1' } });
        log.push('$ PROBE=1 node tools/render/fit-portrait.mjs ' + R.img, (p.stdout + p.stderr).trim());
        const m = /full bust\s+(\d+) (\d+) (\d+) (\d+)/.exec(p.stdout);
        if (p.code !== 0 || !m) return failed('fit-portrait found no bust to crop');
        box = m.slice(1).map(Number);
        log.push('crop from fit-portrait: ' + box.join(' '));
      }
      made.push(R.json, R.mjs);                  // the bake writes these; a failure takes them away
      const bk = await runJob(['node', 'tools/render/bake-face.mjs', name, abs(R.img), ...box.map(String)], { cwd: root, env: { MAXW: '60', MAXH: '74' } });
      log.push('$ MAXW=60 MAXH=74 node tools/render/bake-face.mjs ' + name + ' ' + R.img + ' ' + box.join(' '), (bk.stdout + bk.stderr).trim());
      if (bk.code !== 0) return failed('the bake failed');
      let json;
      try { json = JSON.parse(await readFile(abs(R.json), 'utf8')); } catch (e) { return failed('the bake wrote no readable ' + R.json + ': ' + e.message); }
      /* the content as a whole has to take it: the bubble width, for one, is
         computed from the widest face */
      const all = [], cand = {};
      await walkJSON(content, '', all);
      for (const r of all) cand[r] = JSON.parse(await readFile(join(content, r), 'utf8'));
      try { validateContent(memSource(cand)); }
      catch (e) { if (!(e instanceof ContentError)) throw e; return failed('the content does not validate with this face in it: ' + e.message); }
      return [200, { rel, json, log: log.join('\n'), stamp: await stamps([rel]) }];
    });
    if (held.busy) return send(res, 409, { error: 'busy' });
    send(res, held.value[0], held.value[1]);
  }
  /* tools/music/songs.json as { text, json }. No file is an empty list; a file
     that does not parse is an error, never an empty list a port would then
     write over it. */
  async function readSongs() {
    let text;
    try { text = await readFile(join(root, ...SONGS.split('/')), 'utf8'); } catch (e) { if (e.code === 'ENOENT') return { text: null, json: { _root: MIDI_DIR, songs: [] } }; throw e; }
    const json = JSON.parse(text);
    if (!json || !Array.isArray(json.songs)) throw new Error(SONGS + ' has no "songs" list');
    return { text, json };
  }

  /* GET /admin/api/midis -> [{ file: '70s/X.mid', ids: [...] }]: every .mid
     and .midi under reference/assets/midi/, sorted, with the ids of the songs
     songs.json arranges from it (none: not ported yet). */
  async function midis() {
    const out = [];
    const walk = async (dir, rel) => {
      let ents;
      try { ents = await readdir(dir, { withFileTypes: true }); } catch { return; }
      for (const e of ents) {
        const r = rel ? rel + '/' + e.name : e.name;
        if (e.isDirectory()) await walk(join(dir, e.name), r);
        else if (MIDI_FILE.test(e.name)) out.push(r);
      }
    };
    await walk(join(root, ...MIDI_DIR.split('/')), '');
    out.sort();
    const { json } = await readSongs();
    return out.map((file) => ({ file, ids: json.songs.filter((s) => s && s.file === file).map((s) => s.id) }));
  }

  /* POST /admin/api/port { file, id, title, artist, year, month }: arrange a
     MIDI from the library with tools/music/midi2song.mjs, write the song to
     content/music/<id>.json and its entry to tools/music/songs.json. Like a
     recolour, the song is written when made: it ships with the next build
     (everything in content/music/ does) but no level plays it until it is
     approved (content/music/approved.json). `file` is relative to reference/assets/midi/ and must
     stay inside it. Nothing is overwritten: an id that is already a song file
     or a songs.json entry is 409 exists. The arranger writes to a temp file;
     the song is checked with the rest of the content before anything in the
     repo is written, so a port that fails (422 { log }) leaves nothing behind.
     -> 200 { rel: 'music/<id>.json', json, output, stamp: { [rel]: mtimeMs } } */
  async function portSong(req, res) {
    let b;
    try { b = JSON.parse(await readBody(req)); } catch { return send(res, 400, { error: 'bad request' }); }
    const { file, id, title, artist, year, month } = b || {};
    const str = (s) => typeof s === 'string' && s.trim() !== '' && s.length <= 80;
    const fileOk = typeof file === 'string' && MIDI_FILE.test(file) && !file.includes('\\') && !file.startsWith('/') && !/^[a-z]:/i.test(file)
      && file.split('/').every((s) => s !== '' && s !== '.' && s !== '..');
    if (!fileOk || typeof id !== 'string' || !SONG_ID.test(id) || id.length > 48 || id === 'playlist' || id === 'approved' || !str(title) || !str(artist)
        || !Number.isInteger(year) || year < 1900 || year > 2100 || !(Number.isInteger(month) && month >= 1 && month <= 12))
      return send(res, 400, { error: 'bad request' });
    const lib = resolve(root, ...MIDI_DIR.split('/')), src = resolve(lib, ...file.split('/'));
    if (!src.startsWith(lib + sep)) return send(res, 400, { error: 'bad request' });
    try { if (!(await stat(src)).isFile()) throw new Error('not a file'); } catch { return send(res, 400, { error: 'no such midi', file }); }

    const rel = 'music/' + id + '.json', dest = join(content, 'music', id + '.json');
    /* the check, the job and the writes hold ONE lock, as the recolour does: runJob, not job */
    let held;
    try { held = await withBusy(() => portLocked(rel, dest, { file, src, id, title, artist, year, month })); }
    catch (e) { return send(res, 500, { error: 'server', message: String(e && e.message || e) }); }
    if (held.busy) return send(res, 409, { error: 'busy' });
    send(res, held.value[0], held.value[1]);
  }
  async function portLocked(rel, dest, { file, src, id, title, artist, year, month }) {
    const songs = await readSongs();
    let there = true;
    try { await stat(dest); } catch { there = false; }
    if (there || songs.json.songs.some((s) => s && s.id === id)) return [409, { error: 'exists', rel }];
    const tmp = await mkdtemp(join(tmpdir(), 'port-'));
    try {
      const out = join(tmp, id + '.json');
      const opts = ['--id', id, '--title', title, '--artist', artist, '--year', String(year), '--month', String(month), '--src', file];
      const r = await runJob(['node', 'tools/music/midi2song.mjs', src, ...opts, '--out', out], { cwd: root });
      const log = ['$ node tools/music/midi2song.mjs ' + MIDI_DIR + '/' + file + ' ' + opts.map((a) => (/\s/.test(a) ? JSON.stringify(a) : a)).join(' '), (r.stdout + r.stderr).trim()];
      const failed = (why) => [422, { error: 'job', log: log.concat(why ? [why] : []).join('\n') }];
      if (r.code !== 0) return failed();
      let text, json;
      try { text = await readFile(out, 'utf8'); json = JSON.parse(text); } catch (e) { return failed('the arranger wrote no readable song: ' + e.message); }
      /* the content as a whole has to take it (the title through the font, for one) */
      const all = [], cand = {};
      await walkJSON(content, '', all);
      for (const x of all) cand[x] = JSON.parse(await readFile(join(content, x), 'utf8'));
      cand[rel] = json;
      try { validateContent(memSource(cand)); }
      catch (e) { if (!(e instanceof ContentError)) throw e; return [422, { error: 'invalid', log: log.concat(['the content does not validate with this song in it: ' + e.message]).join('\n') }]; }
      try { await writeFile(dest, text, { flag: 'wx' }); }
      catch (e) { if (e.code === 'EEXIST') return [409, { error: 'exists', rel }]; throw e; }
      const entry = { id, file, title, artist, year, month };
      try { await writeTexts(root, { [SONGS]: formatSongs({ ...songs.json, songs: [...songs.json.songs, entry] }) }); }
      catch (e) { await rm(dest, { force: true }); throw e; }   // a song with no entry is half a port
      return [200, { rel, json, output: r.stdout.trim(), stamp: await stamps([rel]) }];
    } finally { await rm(tmp, { recursive: true, force: true }); }
  }
  /* POST /admin/api/unport { id }: Delete in the Music panel. A converted song
     that no level and not the title plays is removed: content/music/<id>.json,
     its tools/music/songs.json entry and its preview tools/music/preview/<id>.wav,
     so its MIDI is "not converted" again. What is in the game is read from
     content/music/approved.json ON DISK, so a song taken out in the panel but
     not yet saved is still refused (409 in game). Never touches another file.
     -> 200 { rel } | 400 | 404 no such song | 409 in game | 409 busy */
  async function unportSong(req, res) {
    let b;
    try { b = JSON.parse(await readBody(req)); } catch { return send(res, 400, { error: 'bad request' }); }
    const id = b && b.id;
    if (typeof id !== 'string' || !SONG_ID.test(id) || id.length > 48 || id === 'playlist' || id === 'approved') return send(res, 400, { error: 'bad request' });
    let held;
    try { held = await withBusy(() => unportLocked(id)); }
    catch (e) { return send(res, 500, { error: 'server', message: String(e && e.message || e) }); }
    if (held.busy) return send(res, 409, { error: 'busy' });
    send(res, held.value[0], held.value[1]);
  }
  async function unportLocked(id) {
    const rel = 'music/' + id + '.json', dest = join(content, 'music', id + '.json');
    try { await stat(dest); } catch { return [404, { error: 'no such song', rel }]; }
    let approved = null;
    try { approved = JSON.parse(await readFile(join(content, ...APPROVED.split('/')), 'utf8')); } catch (e) { if (e.code !== 'ENOENT') throw e; }
    if (inGame(approved, id)) return [409, { error: 'in game', rel }];
    const songs = await readSongs();
    if (songs.json.songs.some((s) => s && s.id === id))
      await writeTexts(root, { [SONGS]: formatSongs({ ...songs.json, songs: songs.json.songs.filter((s) => !(s && s.id === id)) }) });
    await rm(dest, { force: true });
    await rm(join(root, 'tools', 'music', 'preview', id + '.wav'), { force: true });
    return [200, { rel }];
  }
  const builtin = { '/admin/api/recolor': recolor, '/admin/api/face': newFace, '/admin/api/port': portSong, '/admin/api/unport': unportSong };

  const server = createServer(async (req, res) => {
    try {
      const path = decodeURIComponent(req.url.split('?')[0]);
      const p = server.address().port;
      /* DNS rebinding: a foreign name resolved to 127.0.0.1 is same-origin
         with itself, so its GETs carry no Origin to refuse. Its Host header
         still names it: every route answers only to our own name and port. */
      const hh = req.headers.host;
      if (hh !== `127.0.0.1:${p}` && hh !== `localhost:${p}`) return send(res, 403, { error: 'host' });
      if (req.method === 'POST') {
        const o = req.headers.origin;
        if (o !== `http://127.0.0.1:${p}` && o !== `http://localhost:${p}`) return send(res, 403, { error: 'origin' });
        if (path === '/admin/api/save') return await save(req, res);
        if (builtin[path]) return await builtin[path](req, res);
        if (routes[path]) return await routes[path](req, res, { withBusy, job, send, readBody, root });
        return send(res, 404, { error: 'not found' });
      }
      if (req.method !== 'GET') { res.writeHead(405); return res.end(); }

      if (path === '/admin/api/content') {
        const rels = [];
        await walkJSON(content, '', rels);
        rels.sort();
        const files = {};
        for (const r of rels) files[r] = await readFile(join(content, r), 'utf8');
        return send(res, 200, { files, stamp: await stamps(rels) });
      }
      if (path === '/admin/api/drift') return send(res, 200, await driftAt(root));
      if (path === '/admin/api/midis') {
        try { return send(res, 200, await midis()); } catch (e) { return send(res, 500, { error: 'server', message: String(e && e.message || e) }); }
      }
      if (path === '/' || path === '/index.html') {
        const html = (await readFile(join(root, 'index.html'), 'utf8')).replace('</body>', INJECT + '</body>');
        res.writeHead(200, { 'content-type': 'text/html', 'cache-control': 'no-store' });
        return res.end(html);
      }
      const file = join(root, normalize(path).replace(/^(\.\.[/\\])+/, ''));
      if (resolve(file) !== resolve(root) && !resolve(file).startsWith(resolve(root) + sep)) throw new Error('outside root');
      const buf = await readFile(file);
      res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
      res.end(buf);
    } catch {
      if (!res.headersSent) { res.writeHead(404); res.end('not found'); }
    }
  });

  await new Promise((ok, no) => { server.once('error', no); server.listen(port, host, ok); });
  const url = `http://${host}:${server.address().port}`;
  return { url, withBusy, job, close: () => new Promise((ok) => { server.close(ok); server.closeAllConnections?.(); }) };
}
