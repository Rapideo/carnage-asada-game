/* The admin server: serves the game with Service Mode injected into the page
   (in memory, never on disk) and writes content through the shared validator.
   Dev-only; nothing here is bundled into taco-shop.html. */
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { readFile, readdir, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { validateContent, memSource, ContentError } from './validate.mjs';
import { formatJSON } from './format.mjs';
import { renderDocsAt, writeTexts, driftAt } from './docs/index.mjs';

const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json',
};
const INJECT = '<link rel="stylesheet" href="/admin/overlay.css"><script type="module" src="/admin/overlay.js"></script>';

/* Raw spawn: resolves, never rejects. It takes NO lock. Inside startAdmin, run
   jobs through the instance's withBusy/job so they share the lock with save. */
export function runJob(cmd, { cwd } = {}) {
  return new Promise((done) => {
    const p = spawn(cmd[0] === 'node' ? process.execPath : cmd[0], cmd.slice(1), { cwd });
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

      const texts = {};
      for (const r of rels) texts['content/' + r] = formatJSON(parsed[r]);
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
     -> 200 { rel: 'lattice/<name>.json', json, output } */
  async function recolor(req, res) {
    let b;
    try { b = JSON.parse(await readBody(req)); } catch { return send(res, 400, { error: 'bad request' }); }
    const { src, name } = b || {};
    const nums = ['hue', 'sat', 'val'].map((k) => (b && typeof b[k] === 'number' ? b[k] : NaN));
    /* a bin key is upper-case letters (validate.mjs checkSlot), and the record is named for it */
    if (typeof src !== 'string' || !/^[A-Z0-9]+$/.test(src) || typeof name !== 'string' || !/^[A-Z]+$/.test(name)
        || !nums.every(Number.isFinite) || nums[1] < 0 || nums[2] < 0) return send(res, 400, { error: 'bad request' });
    const dir = join(content, 'lattice'), rel = 'lattice/' + name.toLowerCase() + '.json';
    const list = (await readdir(dir)).filter((f) => f.endsWith('.json')), names = new Set();
    for (const f of list) {
      try { names.add(JSON.parse(await readFile(join(dir, f), 'utf8')).name); } catch { /* the validator reports it */ }
    }
    if (list.includes(name.toLowerCase() + '.json') || names.has(name)) return send(res, 409, { error: 'exists', rel });
    if (!list.includes(src.toLowerCase() + '.json')) return send(res, 400, { error: 'no such well', src });
    const r = await job(['node', 'tools/render/recolor-lattice.mjs', src, name, ...nums.map(String)]);
    if (r.busy) return send(res, 409, { error: 'busy' });
    if (r.code !== 0) return send(res, 500, { error: 'job', output: r.stdout + r.stderr });
    send(res, 200, { rel, json: JSON.parse(await readFile(join(content, rel), 'utf8')), output: r.stdout.trim() });
  }
  const builtin = { '/admin/api/recolor': recolor };

  const server = createServer(async (req, res) => {
    try {
      const path = decodeURIComponent(req.url.split('?')[0]);
      if (req.method === 'POST') {
        const p = server.address().port;
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
