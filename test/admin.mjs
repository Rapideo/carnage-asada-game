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

    const goodL = structuredClone(parsed); goodL.levels[0].name = 'SUMMER  1972';
    ok(parsed.levels[0].name !== goodL.levels[0].name, 'the edit is a real change');
    r = await post({ files: { 'levels.json': JSON.stringify(goodL) }, stamp: { 'levels.json': api.stamp['levels.json'] } });
    j = await r.json();
    ok(r.status === 200 && j.ok && typeof j.stamp['levels.json'] === 'number', 'valid save is 200');
    ok(readFileSync(lv, 'utf8') !== orig, 'the file on disk changed');
    ok(readFileSync(lv, 'utf8') === formatJSON(goodL), 'the file on disk is formatJSON of the edit');
    ok(j.stamp['levels.json'] !== api.stamp['levels.json'], 'the returned stamp moved');

    r = await post({ files: { 'levels.json': JSON.stringify(goodL) }, stamp: { 'levels.json': api.stamp['levels.json'] } });
    j = await r.json();
    ok(r.status === 409 && j.error === 'changed' && j.files.includes('levels.json'), 'a stale stamp is 409 changed');

    const st = (await (await fetch(srv.url + '/admin/api/content')).json()).stamp;
    const both = await Promise.all([1, 2].map(() => post({ files: { 'levels.json': JSON.stringify(goodL) }, stamp: { 'levels.json': st['levels.json'] } })));
    const codes = both.map((x) => x.status).sort();
    const bodies = await Promise.all(both.map((x) => x.json()));
    ok(codes[0] === 200 && codes[1] === 409 && bodies.some((b) => b.error === 'busy'), 'two simultaneous saves: one 200, one 409 busy');

    const st2 = (await (await fetch(srv.url + '/admin/api/content')).json()).stamp;
    const slow = srv.job(['node', '-e', 'setTimeout(()=>{},800)']);
    await new Promise((x) => setTimeout(x, 150));
    r = await post({ files: { 'levels.json': JSON.stringify(goodL) }, stamp: { 'levels.json': st2['levels.json'] } });
    j = await r.json();
    ok(r.status === 409 && j.error === 'busy', 'a job in flight makes a save 409 busy');
    ok((await srv.job(['node', '-e', '0'])).busy === true, 'a second job is refused while one runs');
    ok((await slow).code === 0, 'the job itself completed');
    ok((await srv.job(['node', '-e', '0'])).code === 0, 'the lock is released afterwards');

    r = await post({ files: {}, stamp: {} }, 'http://evil.example');
    ok(r.status === 403, 'a foreign Origin is refused 403');
    r = await fetch(srv.url + '/admin/api/save', { method: 'POST', body: '{}' });
    ok(r.status === 403, 'a POST with no Origin is refused 403');
    ok((await fetch(srv.url + '/..%2f..%2fetc/passwd')).status === 404, 'the .. guard holds');
  } finally { await srv.close(); rmSync(tmp, { recursive: true, force: true }); }
}

console.log('\n— apply —');
const { sandbox: SB, runScript } = await import('./sandbox.mjs');
const diskBuilt = validateContent(fsSource('content'));
{
  runScript(readFileSync('admin/apply.js', 'utf8'), 'admin/apply.js');
  const A = SB.Admin;
  ok(A && typeof A.applyBuilt === 'function' && typeof A.onApply === 'function' && typeof A.restartScreen === 'function',
     'apply.js puts applyBuilt, onApply and restartScreen on Admin');
  const { G, Input } = SB.__x;
  G.boot(20260816);
  G.demoPin = 1; G.weatherPin = 'season';
  const frames = (n) => { for (let i = 0; i < n; i++) { G.update(1 / 60); Input.endFrame(); } };
  const files2 = () => structuredClone(files);

  /* a kitchen shift with a live ticket, then the item that ticket is for is deleted */
  G.startRun(2); G.beginShift();
  const K = SB.__k.Kitchen;
  frames(240);
  ok(G.state === 'kitchen' && K.tickets.length > 0, 'a kitchen shift is running with a live ticket');
  const era = G.level.era, before = SB.__k.MENUS[era].items.length;
  const f1 = files2(); const removed = f1['menus.json'][era].items.shift();
  const built1 = validateContent(memSource(f1));
  let threw = null;
  try { A.applyBuilt(built1, G);
    ok(G.state === 'card' && K.tickets.length === 0 && K.queue.length === 0, 'the kitchen screen restarted: back at the level card with no live tickets (' + G.state + ')');
    ok(![...K.tickets, ...K.queue].some((t) => t.items.some((it) => it.def.name === removed.name)), 'no ticket still wants the removed item');
    frames(120); } catch (x) { threw = x; }
  ok(!threw, 'deleting a menu item mid-shift, then 120 frames: no throw' + (threw ? ' — ' + threw.stack : ''));
  ok(SB.__k.MENUS[era].items.length === before - 1 && K.menu.items.length === before - 1,
     "the live menu, and the kitchen's own copy, lost the item");

  /* a delivery shift, the playlist for its level changes */
  G.startRun(1); G.beginShift(); frames(30);
  ok(G.state === 'play', 'a delivery shift is running');
  const other = Object.keys(diskBuilt.music).find((id) => diskBuilt.music[id].year >= 1970 && diskBuilt.music[id].year <= 1972 && !diskBuilt.playlist['1'].includes(id));
  ok(!!other, 'there is a 1970-72 song to swap in');
  const f2 = files2(); f2['music/playlist.json']['1'] = [other];
  threw = null;
  try { A.applyBuilt(validateContent(memSource(f2)), G); frames(60); } catch (x) { threw = x; }
  ok(!threw, "swapping level 1's playlist during play, then 60 frames: no throw" + (threw ? ' — ' + threw.stack : ''));
  ok(runScript('PLAYLIST["1"].join()') === other, 'PLAYLIST["1"] is the new song');

  /* identity is kept, so every module's captured reference stays good */
  const L0 = runScript('LEVELS'), D0 = runScript('DIFFICULTY');
  const f3 = files2(); f3['levels.json'].levels[0].name = '1972 SUMMER'; f3['difficulty.json'].easy.fines.ticket = 123;
  const built3 = validateContent(memSource(f3));
  A.applyBuilt(built3, G);
  ok(runScript('LEVELS') === L0 && runScript('DIFFICULTY') === D0, 'LEVELS and DIFFICULTY are the same objects after applyBuilt');
  ok(L0[0].name === '1972 SUMMER' && Array.isArray(L0) && L0.length === 20, 'the array was filled in place');
  ok(D0.easy.fines.ticket === 123 && G.diff === D0[G.diffKey], "the game's difficulty pointer follows the new object");
  ok(G.level === L0[G.levelN - 1], 'G.level follows the new level object');

  /* refreshers run for exactly the kinds that changed */
  const seen = [];
  A.onApply('dialogue', () => seen.push('dialogue')); A.onApply('menus', () => seen.push('menus'));
  A.applyBuilt(built3, G);
  ok(seen.length === 0, 'applying identical content runs no refresher');
  A.applyBuilt({ ...built3, dialogue: { ...built3.dialogue, __probe: 1 } }, G);
  ok(seen.join() === 'dialogue', 'only the refresher for the changed kind ran (' + seen.join() + ')');
}

console.log('\n— overlay keys —');
{
  const { makeKeyGate } = await import('../admin/overlay.js');
  const inside = { id: 'field' }, outside = { id: 'canvas' };
  let active = inside, toggled = 0;
  const gate = makeKeyGate({ contains: (n) => n === inside }, () => active, () => { toggled++; });
  const ev = (code, type = 'keydown') => ({ code, type, pd: 0, sip: 0,
    preventDefault() { this.pd++; }, stopImmediatePropagation() { this.sip++; } });
  let e = ev('F2');
  gate(e);
  ok(toggled === 1 && e.pd === 1 && e.sip === 1, 'F2 toggles, is preventDefaulted and is hidden from the game');
  e = ev('F2', 'keyup'); gate(e);
  ok(toggled === 1 && e.sip === 1, 'F2 keyup does not toggle again but is hidden from the game');
  e = ev('F2'); e.repeat = true; gate(e);
  ok(toggled === 1 && e.sip === 1, 'a held F2 does not flicker the overlay');
  e = ev('ArrowLeft'); gate(e);
  ok(e.sip === 1 && e.pd === 0, 'an arrow key with focus in the overlay never reaches the game, and still types');
  e = ev('Space', 'keyup'); gate(e);
  ok(e.sip === 1, 'keyup is isolated too');
  active = outside; e = ev('ArrowLeft'); gate(e);
  ok(e.sip === 0 && e.pd === 0, 'with focus on the game, keys pass through untouched');
  e = ev('F2'); gate(e);
  ok(toggled === 2, 'F2 toggles from the game as well');
}

console.log('\n— store —');
{
  const { mkdtempSync, cpSync, rmSync, writeFileSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const tmp = mkdtempSync(join(tmpdir(), 'admin-store-'));
  for (const f of ['build.mjs', 'shell.html', 'src', 'content', 'tools/content']) cpSync(f, join(tmp, f), { recursive: true });
  (await import('node:child_process')).execFileSync('node', ['build.mjs'], { cwd: tmp, stdio: 'pipe' });
  const { startAdmin } = await import('../tools/content/server.mjs');
  const srv = await startAdmin({ root: tmp, port: 0 });
  try {
    const applied = [];
    globalThis.Admin = globalThis.Admin || {};
    globalThis.Admin.applyBuilt = (b) => applied.push(b);
    const { store } = await import('../admin/store.js');
    store.base = srv.url; store.headers = { origin: srv.url };
    await store.load();
    ok(store.get('levels.json', 'levels.0.name') === 'SUMMER 1972', 'get reads a dotted path');
    ok(store.get('levels.json', ['levels', 0, 'type']) === 'delivery', 'get reads an array path');
    ok(store.dirty.size === 0 && applied.length === 0, 'nothing is dirty or applied after load');

    const r1 = store.set('levels.json', 'levels.0.name', 'SUMMER 1972!');
    ok(r1 && r1.built && store.dirty.has('levels.json') && applied.length === 1 && store.error === null,
       'a valid set marks the file dirty, validates and applies');
    store.set('levels.json', 'levels.0.season', 'spring');
    ok(store.error && store.error.file === 'content/levels.json' && store.error.path.join('.') === 'levels.0.season'
       && applied.length === 1, 'an invalid set records the ContentError and applies nothing');
    store.set('levels.json', 'levels.0.season', 'summer');
    ok(store.error === null && applied.length === 2, 'fixing it clears the error and applies again');

    store.set('levels.json', 'levels.0.season', 'spring');
    const bad = await store.save();
    ok(!bad.ok && bad.reason === 'invalid' && store.dirty.size === 1, 'save refuses while the content is invalid, and stays dirty');
    store.set('levels.json', 'levels.0.season', 'summer');
    const good = await store.save();
    ok(good.ok && store.dirty.size === 0, 'a valid save succeeds and clears dirty');
    ok(readFileSync(join(tmp, 'content/levels.json'), 'utf8').includes('SUMMER 1972!'), 'the file on disk has the edit');
    store.set('levels.json', 'levels.0.name', 'SUMMER 1972');
    const again = await store.save();
    ok(again.ok, 'a second save uses the stamp the first returned');
    // somebody else edits the file behind our back
    /* the seam the stub bypasses: the REAL applyBuilt, from a store that cannot see G */
    globalThis.Admin.applyBuilt = SB.Admin.applyBuilt;
    ok(typeof G === 'undefined' && runScript('typeof globalThis.G') === 'undefined', 'G is not reachable as a global property, as in the browser');
    runScript('G.setLevel(1)');
    store.set('difficulty.json', 'easy.fines.ticket', 321);
    ok(store.applyError === null, 'the real applyBuilt ran from store.set without error' + (store.applyError ? ': ' + store.applyError.stack : ''));
    ok(runScript('G.diff.fines.ticket') === 321 && runScript('DIFFICULTY.easy.fines.ticket') === 321, 'a difficulty edit through store.set reaches G.diff');
    store.set('levels.json', 'levels.0.name', 'SUMMER 1972 Y');
    ok(runScript('G.level.name') === 'SUMMER 1972 Y', 'a level edit through store.set reaches G.level');
    const lv = join(tmp, 'content/levels.json');
    writeFileSync(lv, readFileSync(lv, 'utf8') + ' ');
    store.set('levels.json', 'levels.0.name', 'SUMMER 1972 X');
    const stale = await store.save();
    ok(!stale.ok && stale.reason === 'changed', 'a file changed on disk is reported, not overwritten');
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
