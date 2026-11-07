/* Tests for Service Mode (the admin overlay) and the shared content validator.
   Zero dependencies, same ok(cond, msg) style and exit code as headless.mjs. */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

let fails = 0;
const ok = (cond, msg) => { if (!cond) { console.error('  FAIL  ' + msg); fails++; } else console.log('  ok    ' + msg); };

console.log('\n— validator —');
const { validateContent, memSource, ContentError } = await import('../tools/content/validate.mjs');
const { fsSource } = await import('../tools/content/fs-source.mjs');

/* walk content/, rel path -> parsed JSON (the same shape memSource takes) */
function loadAllContentJSON(root) {
  const files = {};
  const walk = (dir, rel) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name), r = rel ? rel + '/' + name : name;
      if (statSync(p).isDirectory()) walk(p, r);
      else if (name.endsWith('.json')) files[r] = JSON.parse(readFileSync(p, 'utf8'));
    }
  };
  walk(root, '');
  return files;
}

const disk = validateContent(fsSource('content'));
ok(disk.levels.length === 20, 'validates the shipped content from disk');

const files = loadAllContentJSON('content');
ok(JSON.stringify(validateContent(memSource(files))) === JSON.stringify(disk), 'memory and disk agree');

const bad = structuredClone(files); bad['difficulty.json'].easy.fines.ticket = -1;
let e = null; try { validateContent(memSource(bad)); } catch (x) { e = x; }
ok(e instanceof ContentError && e.file === 'content/difficulty.json'
   && e.path.join('.') === 'easy.fines.ticket', 'error carries file + path');
ok(/must be integer cents/.test(e.message), 'message text unchanged');

const bad2 = structuredClone(files); bad2['winners.json'].slogan = 'WINNERS DON’T';
e = null; try { validateContent(memSource(bad2)); } catch (x) { e = x; }
ok(e && e.file === 'content/winners.json' && e.path[0] === 'slogan' && /’/.test(e.message), 'curly quote named, on its field');

const bad3 = structuredClone(files); delete bad3['levels.json'];
e = null; try { validateContent(memSource(bad3)); } catch (x) { e = x; }
ok(e instanceof ContentError && e.file === 'content/levels.json', 'a missing file is a ContentError naming it');

const bad4 = structuredClone(files); bad4['difficulty.json'].easy.kitchen.hint = 'yes';
e = null; try { validateContent(memSource(bad4)); } catch (x) { e = x; }
ok(e instanceof ContentError && e.file === 'content/difficulty.json'
   && e.path.join('.') === 'easy.kitchen.hint', 'kitchen.hint must be true or false');
const bad5 = structuredClone(files); bad5['difficulty.json'].medium.perfectBonus = 5.5;
e = null; try { validateContent(memSource(bad5)); } catch (x) { e = x; }
ok(e && e.path.join('.') === 'medium.perfectBonus', 'perfectBonus is integer cents');
const bad6 = structuredClone(files); bad6['difficulty.json'].hard.kitchen.railMax = 0;
e = null; try { validateContent(memSource(bad6)); } catch (x) { e = x; }
ok(e && e.path.join('.') === 'hard.kitchen.railMax', 'railMax is at least 1');

const before = JSON.stringify(files);
validateContent(memSource(files));
ok(JSON.stringify(files) === before, 'validating does not mutate the source');

console.log('\n— format —');
const { formatJSON, formatSongs } = await import('../tools/content/format.mjs');
const { deepStrictEqual } = await import('node:assert');
const FORMATTED = ['winners', 'scores', 'attract', 'levels', 'difficulty', 'menus', 'dialogue', 'release']
  .map((n) => 'content/' + n + '.json').concat(['content/music/playlist.json']);
const roundTrips = (a, b) => { try { deepStrictEqual(a, b); return true; } catch { return false; } };
for (const f of FORMATTED) {
  const x = JSON.parse(readFileSync(f, 'utf8')), t = formatJSON(x);
  ok(roundTrips(JSON.parse(t), x), f + ' round-trips');
  ok(formatJSON(JSON.parse(t)) === t, f + ' format is idempotent');
  ok(readFileSync(f, 'utf8') === t, f + ' on disk is in the writer format');
}
{
  const f = 'tools/music/songs.json', x = JSON.parse(readFileSync(f, 'utf8')), t = formatSongs(x);
  ok(roundTrips(JSON.parse(t), x), f + ' round-trips');
  ok(formatSongs(JSON.parse(t)) === t, f + ' format is idempotent');
  ok(readFileSync(f, 'utf8') === t, f + ' on disk is in the writer format');
  ok(t.split('\n').filter((l) => l.includes('"id"')).length === x.songs.length, 'one song per line');
}
ok(formatJSON({ a: [1, 2], b: [{ c: 1 }], d: [], e: 'é' })
   === '{\n  "a": [1, 2],\n  "b": [\n    {\n      "c": 1\n    }\n  ],\n  "d": [],\n  "e": "é"\n}\n',
   'formatJSON follows the pretty rule');

console.log('\n— server —');
{
  const { mkdtempSync, cpSync, writeFileSync, rmSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const tmp = mkdtempSync(join(tmpdir(), 'admin-'));
  for (const f of ['build.mjs', 'shell.html', 'src', 'content', 'tools/content']) cpSync(f, join(tmp, f), { recursive: true });
  (await import('node:child_process')).execFileSync('node', ['build.mjs'], { cwd: tmp, stdio: 'pipe' });
  const { startAdmin } = await import('../tools/content/server.mjs');
  const srv = await startAdmin({ root: tmp, port: 0 });
  const post = (body, origin) => fetch(srv.url + '/admin/api/save', {
    method: 'POST', headers: { 'content-type': 'application/json', origin: origin || srv.url },
    body: JSON.stringify(body) });
  const lv = join(tmp, 'content/levels.json');
  try {
    ok(new URL(srv.url).hostname === '127.0.0.1', 'the server listens on 127.0.0.1');
    const page = await (await fetch(srv.url + '/')).text();
    ok(page.includes('/admin/overlay.js') && page.includes('/admin/overlay.css'), 'GET / carries the overlay');
    ok(!readFileSync(join(tmp, 'index.html'), 'utf8').includes('/admin/overlay.js'), 'index.html on disk is untouched');
    ok((await fetch(srv.url + '/tools/content/server.mjs')).headers.get('content-type').startsWith('text/javascript'), '.mjs is text/javascript');

    const api = await (await fetch(srv.url + '/admin/api/content')).json();
    ok(api.files['levels.json'] && api.files['music/playlist.json'] && Object.keys(api.files).some((k) => k.startsWith('board/'))
       && typeof api.stamp['levels.json'] === 'number', 'GET content lists nested files with stamps');

    const orig = readFileSync(lv, 'utf8'), parsed = JSON.parse(orig);
    const badL = structuredClone(parsed); badL.levels[0].season = 'spring';
    let r = await post({ files: { 'levels.json': JSON.stringify(badL) }, stamp: { 'levels.json': api.stamp['levels.json'] } });
    let j = await r.json();
    ok(r.status === 422 && j.error === 'invalid' && j.file === 'content/levels.json' && j.path.join('.') === 'levels.0.season', 'invalid save is 422 naming the path');
    ok(readFileSync(lv, 'utf8') === orig, 'a rejected save writes nothing');

    const goodL = structuredClone(parsed); goodL.levels[0].name = goodL.levels[0].name + ' ';
    goodL.levels[0].name = goodL.levels[0].name.trim();
    r = await post({ files: { 'levels.json': JSON.stringify(goodL) }, stamp: { 'levels.json': api.stamp['levels.json'] } });
    j = await r.json();
    ok(r.status === 200 && j.ok && typeof j.stamp['levels.json'] === 'number', 'valid save is 200');
    ok(readFileSync(lv, 'utf8') === formatJSON(goodL), 'the file on disk is formatJSON of the edit');

    r = await post({ files: { 'levels.json': JSON.stringify(goodL) }, stamp: { 'levels.json': api.stamp['levels.json'] } });
    j = await r.json();
    ok(r.status === 409 && j.error === 'changed' && j.files.includes('levels.json'), 'a stale stamp is 409 changed');

    const st = (await (await fetch(srv.url + '/admin/api/content')).json()).stamp;
    const both = await Promise.all([1, 2].map(() => post({ files: { 'levels.json': JSON.stringify(goodL) }, stamp: { 'levels.json': st['levels.json'] } })));
    const codes = both.map((x) => x.status).sort();
    const bodies = await Promise.all(both.map((x) => x.json()));
    ok(codes[0] === 200 && codes[1] === 409 && bodies.some((b) => b.error === 'busy'), 'two simultaneous saves: one 200, one 409 busy');

    r = await post({ files: {}, stamp: {} }, 'http://evil.example');
    ok(r.status === 403, 'a foreign Origin is refused 403');
    r = await fetch(srv.url + '/admin/api/save', { method: 'POST', body: '{}' });
    ok(r.status === 403, 'a POST with no Origin is refused 403');
    ok((await fetch(srv.url + '/..%2f..%2fetc/passwd')).status === 404, 'the .. guard holds');
  } finally { await srv.close(); rmSync(tmp, { recursive: true, force: true }); }
}

console.log('\n— artifact —');
{
  const { execFileSync } = await import('node:child_process');
  execFileSync('node', ['build.mjs'], { stdio: 'pipe' });
  const shipped = readFileSync('taco-shop.html', 'utf8');
  for (const s of ['Admin', '/admin/', 'admin.mjs']) ok(!shipped.includes(s), 'taco-shop.html contains no "' + s + '"');
}

console.log(`\n${fails === 0 ? 'PASS' : 'FAIL (' + fails + ')'}`);
process.exit(fails ? 1 : 0);
