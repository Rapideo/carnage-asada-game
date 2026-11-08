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

console.log('\n— docs —');
{
  const { existsSync, mkdtempSync, cpSync, rmSync, writeFileSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const DIR = 'docs/authored content', NAMES = ['attract', 'difficulty', 'levels', 'menu', 'music'];
  ok(NAMES.every((n) => existsSync(join(DIR, n + '.md')) && !existsSync(join(DIR, n + '.md.md'))),
     'the five docs are named *.md, not *.md.md');
  let E = null, LV = null, IX = null;
  try {
    E = await import('../tools/content/docs/engine.mjs');
    LV = (await import('../tools/content/docs/levels.mjs')).default;
    IX = await import('../tools/content/docs/index.mjs');
  } catch (x) { console.error('  (' + x.message + ')'); }
  ok(E && LV && IX, 'the docs engine, levels.md and the index load');
  if (E && LV && IX) {
    const { parseMd, toMd, setField, syncList, roman, letter, sameAs, applySame, diffLines } = E;
    /* LF, as renderAll feeds the engine: on a CRLF checkout no line would match
       a heading, everything would land in root.lines, and the identity would
       hold vacuously. So the headings found are counted as well. */
    const nodes = (n) => n.children.reduce((s, c) => s + 1 + nodes(c), 0);
    for (const n of NAMES) {
      const p = join(DIR, n + '.md'), t = existsSync(p) ? readFileSync(p, 'utf8').replace(/\r\n/g, '\n') : null;
      const tree = t !== null && parseMd(t), heads = t !== null ? t.split('\n').filter((l) => /^#{1,6} /.test(l)).length : 0;
      ok(t !== null && heads > 5 && nodes(tree) === heads && toMd(tree) === t,
         n + '.md round-trips through parseMd/toMd, with all ' + heads + ' headings parsed as nodes');
    }
    {
      const lt = readFileSync(join(DIR, 'levels.md'), 'utf8').replace(/\r\n/g, '\n'), lr = parseMd(lt);
      ok(lr.children.length === 1 && lr.children[0].heading === 'levels.md' && lr.children[0].children.length === 20
         && lr.children[0].children.every((c, i) => c.depth === 2 && c.heading === roman(i + 1) + '. Level ' + (i + 1)),
         'levels.md parses to its title over 20 level nodes');
    }
    const t0 = parseMd('# t\n\npre\n\n## A\n\nx\n\n### B\n\ny\n## C\nz\n');
    ok(t0.heading === null && t0.children.length === 1 && t0.children[0].heading === 't'
       && t0.children[0].children.map((c) => c.heading).join() === 'A,C'
       && t0.children[0].children[0].children[0].heading === 'B' && t0.children[0].children[0].children[0].depth === 3,
       'parseMd nests headings by depth');

    ok(roman(1) === 'I' && roman(4) === 'IV' && roman(9) === 'IX' && roman(18) === 'XVIII' && roman(19) === 'XIX'
       && roman(20) === 'XX' && roman(14) === 'XIV', 'roman numbers');
    ok(letter(0) === 'A' && letter(4) === 'E', 'letter(i) is 0-based');

    /* setField: a note after the value survives, Key: v is normalised, a missing key is appended */
    const nd = parseMd('## X\n\n- Tip Floor : 2.00. The tip falls to it in 54s\n\n- Ingredient 2: Lettuce\n\nSome prose.\n').children[0];
    setField(nd, 'Tip Floor', '3.00', { match: /^\d+\.\d\d/ });
    setField(nd, 'Ingredient 2', 'Cheese', { match: /^.*/ });
    setField(nd, 'Price', '0.29', { match: /^.*/ });
    ok(toMd(nd) === '## X\n\n- Tip Floor : 3.00. The tip falls to it in 54s\n\n- Ingredient 2 : Cheese\n\n- Price : 0.29\n\nSome prose.\n',
       'setField keeps the tail, normalises "Key:", appends a missing key after the last field (' + JSON.stringify(toMd(nd)) + ')');
    const nf = { heading: 'N', depth: 2, lines: [''], children: [] };
    setField(nf, 'A', '1'); setField(nf, 'B', '2');
    ok(toMd(nf) === '## N\n\n- A : 1\n\n- B : 2\n', 'setField builds an empty node in the docs\' blank-separated style');

    /* syncList: reuse by position, keep prose, create and drop */
    const par = parseMd('# d\n\n## I. One\n\nprose one\n\n- V : 1\n\n## II. Two\n\n- V : 2\n\n## III. Three\n\n- V : 3\n').children[0];
    syncList(par, [10, 20], { heading: (x, i) => roman(i + 1) + '. Item ' + x, fill: (n, x) => setField(n, 'V', String(x), { match: /^\d+/ }) });
    ok(toMd(par) === '# d\n\n## I. Item 10\n\nprose one\n\n- V : 10\n\n## II. Item 20\n\n- V : 20\n', 'syncList reuses, keeps prose and drops extras');
    syncList(par, [10, 20, 30], { heading: (x, i) => roman(i + 1) + '. Item ' + x, fill: (n, x) => setField(n, 'V', String(x)) });
    ok(toMd(par).endsWith('- V : 20\n\n## III. Item 30\n\n- V : 30\n'), 'syncList creates a new node at the end');

    /* the same-as rule */
    const sa = parseMd('### B. Bonus\n\n- Same as Easy\n').children[0];
    ok(sameAs(sa) === 'Easy', 'sameAs reads the referenced name');
    const fillB = (n) => setField(n, 'Bonus', '5.00');
    ok(applySame(sa, { values: { b: 5 }, resolve: () => ({ b: 5 }), fill: fillB }) === false && toMd(sa) === '### B. Bonus\n\n- Same as Easy\n',
       'a Same-as node is left alone while its values match');
    ok(applySame(sa, { values: { b: 6 }, resolve: () => ({ b: 5 }), fill: fillB }) === true && toMd(sa) === '### B. Bonus\n\n- Bonus : 5.00\n',
       'a Same-as node whose values differ is replaced by its fields (' + JSON.stringify(toMd(sa)) + ')');

    ok(diffLines('a\nb\nc', 'a\nb\nc') === 0 && diffLines('a\nb\nc', 'a\nX\nc') === 1 && diffLines('a\nb\nc', 'a\nb\nN\nc') === 1,
       'diffLines counts changed lines');

    /* levels.md, rendered from today's JSON */
    const lp = join(DIR, 'levels.md'), old = existsSync(lp) ? readFileSync(lp, 'utf8') : '';
    const typos = old.replace('## XVIII. Level 18', '## IIXX. Level 18').replace('## XIX. Level 19', '## IXX. Level 19').replace('## XX. Level 20', '## XX. Leve 20');
    for (const [label, prev] of [['the doc', old], ['the doc with its old typos', typos]]) {
      const out = LV.render(files, prev);
      ok(out.includes('## XVIII. Level 18') && out.includes('## XIX. Level 19') && out.includes('## XX. Level 20')
         && !out.includes('IIXX') && !out.includes('IXX.') && !out.includes('Leve 20'), 'levels.md headings are numbered from the JSON (' + label + ')');
    }
    const out = LV.render(files, old);
    const pre = old.slice(0, old.indexOf('## I. Level 1'));
    ok(pre.length > 100 && out.startsWith(pre), 'every line of the levels.md preamble survives');
    ok(LV.render(files, out) === out, 'rendering levels.md is idempotent');
    ok(out.includes('- Name : SUMMER 1972\n') && !out.includes('Level 1 - Summer 1972'), 'Name shows the JSON\'s form');
    ok(out.includes('## V. Level 5\n\n- Sequence : 5\n\n- Game Type : Delivery\n\n- Name : SUMMER 1978\n\n- Era : 1970s\n\n- Music : 1978 - Delivery\n\n- Difficulty : Easy\n\n- Season : Summer\n\n## VI.'),
       'a level node carries all seven fields, in order');
    const w5 = structuredClone(files); w5['levels.json'].levels[4].season = 'winter';
    const l5 = parseMd(LV.render(w5, old)).children[0].children.find((n) => n.heading === 'V. Level 5');
    ok(l5 && l5.lines.includes('- Season : Winter'), "level 5's season set to winter shows in its node");
    const fresh = LV.render(files, null);
    ok(fresh.includes('## XX. Level 20') && LV.render(files, fresh) === fresh, 'levels.md renders from nothing, idempotently');
    ok(IX.DOCS.some((d) => d.file === 'levels.md'), 'levels.md is a registered doc');
    const all = IX.renderAll(files, (f) => f === 'levels.md' ? old : null);
    ok(all['levels.md'] === out, 'renderAll renders every registered doc');
    ok(IX.renderAll(files, (f) => f === 'levels.md' ? old.replace(/\n/g, '\r\n') : null)['levels.md'] === out.replace(/\n/g, '\r\n'),
       'renderAll: a CRLF doc renders the same and keeps its line endings');

    /* the save path rewrites the doc; the drift route counts what differs */
    const tmp = mkdtempSync(join(tmpdir(), 'admin-docs-'));
    for (const f of ['build.mjs', 'shell.html', 'src', 'content', 'tools/content', DIR]) cpSync(f, join(tmp, f), { recursive: true });
    (await import('node:child_process')).execFileSync('node', ['build.mjs'], { cwd: tmp, stdio: 'pipe' });
    const { startAdmin } = await import('../tools/content/server.mjs');
    const srv = await startAdmin({ root: tmp, port: 0 });
    const tl = join(tmp, DIR, 'levels.md');
    try {
      const d0 = await (await fetch(srv.url + '/admin/api/drift')).json();
      const dl = Array.isArray(d0) && d0.find((x) => x.file === 'levels.md');
      ok(dl && typeof dl.lines === 'number', 'GET drift reports levels.md with a line count (' + JSON.stringify(d0) + ')');
      const api = await (await fetch(srv.url + '/admin/api/content')).json();
      const ed = JSON.parse(api.files['levels.json']); ed.levels[0].name = 'SUMMER 1972!';
      const r = await fetch(srv.url + '/admin/api/save', { method: 'POST', headers: { 'content-type': 'application/json', origin: srv.url },
        body: JSON.stringify({ files: { 'levels.json': JSON.stringify(ed) }, stamp: { 'levels.json': api.stamp['levels.json'] } }) });
      ok(r.status === 200, 'a valid save in a temp root succeeds');
      const doc = readFileSync(tl, 'utf8');
      ok(doc.includes('- Name : SUMMER 1972!\n') && doc.startsWith(pre), 'the save rewrote docs/authored content/levels.md, preamble intact');
      const d1 = await (await fetch(srv.url + '/admin/api/drift')).json();
      ok(d1.find((x) => x.file === 'levels.md').lines === 0, 'after a save, levels.md has no drift');
      writeFileSync(tl, doc.replace('- Season : Winter\n\n## III.', '- Season : Summer\n\n## III.'));
      const d2 = await (await fetch(srv.url + '/admin/api/drift')).json();
      ok(d2.find((x) => x.file === 'levels.md').lines === 1, 'a one-value edit to the doc is one line of drift');

      /* a renderer that throws: the save fails and nothing is written, JSON or doc */
      const snap = () => {
        const o = {};
        for (const [r, x] of Object.entries(loadAllContentJSON(join(tmp, 'content')))) o[r] = readFileSync(join(tmp, 'content', r), 'utf8');
        for (const n of NAMES) o[n] = readFileSync(join(tmp, DIR, n + '.md'), 'utf8');
        o.html = readFileSync(join(tmp, 'taco-shop.html'), 'utf8');
        return JSON.stringify(o);
      };
      const bad = await startAdmin({ root: tmp, port: 0, renderDocs: () => { throw new Error('render boom'); } });
      try {
        const a2 = await (await fetch(bad.url + '/admin/api/content')).json();
        const e2 = JSON.parse(a2.files['levels.json']); e2.levels[0].name = 'SUMMER 1972?';
        const s0 = snap();
        const r2 = await fetch(bad.url + '/admin/api/save', { method: 'POST', headers: { 'content-type': 'application/json', origin: bad.url },
          body: JSON.stringify({ files: { 'levels.json': JSON.stringify(e2) }, stamp: { 'levels.json': a2.stamp['levels.json'] } }) });
        const j2 = await r2.json();
        ok(r2.status === 500 && j2.error === 'docs' && /render boom/.test(j2.message), 'a docs render that throws fails the save, naming the error');
        ok(snap() === s0, 'and content/, the docs and the build are byte-unchanged');
      } finally { await bad.close(); }
      const off = await startAdmin({ root: tmp, port: 0, renderDocs: () => ({}) });
      try {
        const a3 = await (await fetch(off.url + '/admin/api/content')).json();
        const e3 = JSON.parse(a3.files['levels.json']); e3.levels[0].name = 'SUMMER 1972?';
        const before3 = readFileSync(tl, 'utf8');
        const r3 = await fetch(off.url + '/admin/api/save', { method: 'POST', headers: { 'content-type': 'application/json', origin: off.url },
          body: JSON.stringify({ files: { 'levels.json': JSON.stringify(e3) }, stamp: { 'levels.json': a3.stamp['levels.json'] } }) });
        ok(r3.status === 200 && readFileSync(tl, 'utf8') === before3 && readFileSync(join(tmp, 'content/levels.json'), 'utf8').includes('SUMMER 1972?'),
           'with the mirror switched off, a save writes the JSON and leaves the doc alone');
      } finally { await off.close(); }
    } finally { await srv.close(); rmSync(tmp, { recursive: true, force: true }); }
  }
}

{
  /* Levels panel: the field a season/name mismatch is reported on is the name */
  const lv = structuredClone(files);
  lv['levels.json'].levels[0].season = 'winter';           // name still says SUMMER 1972
  let le = null; try { validateContent(memSource(lv)); } catch (x) { le = x; }
  ok(le instanceof ContentError && le.file === 'content/levels.json' && le.path.join('.') === 'levels.0.name',
     'a SUMMER name on a winter level is reported on levels.0.name, the field the Levels panel highlights');
  const { existsSync: ex } = await import('node:fs');
  const ov = readFileSync('admin/overlay.js', 'utf8');
  ok(ex('admin/panels/levels.js') && /import '\.\/panels\/levels\.js'/.test(ov), 'the Levels panel exists and the overlay imports it');
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
