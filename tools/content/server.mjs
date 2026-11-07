/* The admin server: serves the game with Service Mode injected into the page
   (in memory, never on disk) and writes content through the shared validator.
   Dev-only; nothing here is bundled into taco-shop.html. */
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { readFile, readdir, stat, writeFile, rename } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { validateContent, memSource, ContentError } from './validate.mjs';
import { formatJSON } from './format.mjs';

const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json',
};
const INJECT = '<link rel="stylesheet" href="/admin/overlay.css"><script type="module" src="/admin/overlay.js"></script>';

let busy = false;
/* Run a command with cwd; shares the busy lock with save. Resolves, never rejects. */
export function runJob(cmd, { cwd } = {}) {
  return new Promise((done) => {
    const p = spawn(cmd[0], cmd.slice(1), { cwd });
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

export async function startAdmin({ root, host = '127.0.0.1', port = 8124, afterWrite = async () => {} }) {
  const content = join(root, 'content');
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
    if (busy) return send(res, 409, { error: 'busy' });
    busy = true;
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

      for (const r of rels) {
        const f = join(content, r), tmp = f + '.tmp';
        await writeFile(tmp, formatJSON(parsed[r]));
        await rename(tmp, f);
      }
      await afterWrite(rels);
      const b = await runJob(['node', 'build.mjs'], { cwd: root });
      if (b.code !== 0) return send(res, 500, { error: 'build', output: b.stdout + b.stderr });
      send(res, 200, { ok: true, build: b.stdout, stamp: await stamps(rels) });
    } catch (e) {
      send(res, 500, { error: 'server', message: String(e && e.message || e) });
    } finally { busy = false; }
  }

  const server = createServer(async (req, res) => {
    try {
      const path = decodeURIComponent(req.url.split('?')[0]);
      if (req.method === 'POST') {
        const p = server.address().port;
        const o = req.headers.origin;
        if (o !== `http://127.0.0.1:${p}` && o !== `http://localhost:${p}`) return send(res, 403, { error: 'origin' });
        if (path === '/admin/api/save') return await save(req, res);
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
  return { url, close: () => new Promise((ok) => { server.close(ok); server.closeAllConnections?.(); }) };
}
