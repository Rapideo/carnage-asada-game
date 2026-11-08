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

    /* difficulty.md, rendered from today's JSON and from edits to it */
    let DF = null;
    try { DF = (await import('../tools/content/docs/difficulty.mjs')).default; } catch (x) { console.error('  (' + x.message + ')'); }
    ok(DF && DF.file === 'difficulty.md' && IX.DOCS.includes(DF), 'difficulty.md is a registered doc');
    if (DF) {
      const dold = readFileSync(join(DIR, 'difficulty.md'), 'utf8').replace(/\r\n/g, '\n');
      const dfx = (edit) => { const f = structuredClone(files); edit(f['difficulty.json']); return f; };
      /* a node by its headings' names, numbering ignored: at(text, 'Medium', 'Penalties') */
      const at = (text, ...names) => {
        let n = parseMd(text).children.find((c) => c.depth === 1);
        for (const nm of names) n = n && n.children.find((c) => c.heading.replace(/^[A-Z0-9]+\. /, '') === nm);
        return n || { lines: [], children: [] };
      };
      const has = (n, line) => n.lines.includes(line);
      const dout = DF.render(files, dold);
      ok(DF.render(files, dout) === dout, 'rendering difficulty.md is idempotent');
      const a = dold.split('\n'), b = dout.split('\n');
      const changed = a.map((l, i) => [l, b[i]]).filter(([x, y]) => x !== y);
      ok(a.length === b.length && changed.every(([x, y]) => /^\s*- /.test(x) && x.replace(/\s*:\s*/, ' : ') === y),
         'from today\'s JSON every line is byte-identical but for "Key:" spacing on value lines (' + JSON.stringify(changed) + ')');
      ok(has(at(dout, 'Easy', 'Shift'), '- Tip Floor : 2.00. The tip falls to it in 54s and holds there; it never runs out')
         && has(at(dout, 'Easy', 'Shift'), '- Depreciation Rate : 1.00 / 3 Seconds')
         && has(at(dout, 'Medium', 'Shift'), '- Depreciation Rate : 1.00 / 2.5 Seconds (reaches the 2.00 floor at 45s; Easy 54s)'),
         'the shift lines read the JSON: money in dollars, the decay as $1.00 / N seconds');

      /* the brief: a Medium fine */
      const t12 = DF.render(dfx((d) => { d.medium.fines.ticket = 1200; }), dold);
      ok(has(at(t12, 'Medium', 'Penalties'), '- Speeding Ticket : 12.00'), 'medium.fines.ticket = 1200 makes Medium Penalties read "- Speeding Ticket : 12.00"');
      const hc = at(t12, 'Hard', 'Penalties');
      ok(!hc.lines.some((l) => /Same as/.test(l)) && has(hc, '- Speeding Ticket : 10.00') && has(hc, '- Hitting Pedestrian : 4.00')
         && has(hc, '- Hitting Train : 10.00') && has(hc, '- Remake : 1.50')
         && has(hc, 'Held rather than raised on purpose: flat fines against smaller tips already cost more'),
         "Hard's \"Same as Medium\" no longer holds: it becomes fields, and its note is kept (" + JSON.stringify(hc.lines) + ')');
      ok(DF.render(dfx((d) => { d.medium.fines.ticket = 1200; }), t12) === t12, 'and that render is idempotent');
      /* prose: every paragraph line and heading of the old doc is still there, in order */
      const prose = a.filter((l) => l.trim() && !/^\s*- /.test(l) && !/^\s+\S/.test(l) && !/^\|/.test(l));
      let j = 0; const tl = t12.split('\n');
      for (const l of tl) if (j < prose.length && l === prose[j]) j++;
      ok(prose.length > 40 && j === prose.length, 'after that edit every one of the ' + prose.length + ' prose lines and headings survives, in order (' + (prose[j] || '') + ')');
      const both = DF.render(dfx((d) => { d.medium.fines.ticket = 1200; d.hard.fines.ticket = 1200; }), dold);
      const hb = at(both, 'Hard', 'Penalties');
      ok(hb.lines.some((l) => /^- Same as Medium : Speeding Ticket 12\.00, Hitting Pedestrian 4\.00, Hitting Train 10\.00,$/.test(l))
         && has(hb, '  Remake 1.50. Held rather than raised on purpose: flat fines against smaller tips'),
         'while Hard still equals Medium its "Same as Medium" line stays, with the values it quotes following the JSON');

      /* the same-as rule on a section */
      ok(has(at(dout, 'Medium', 'Bonus Structure'), '- Same as Easy'), 'with Medium equal to Easy, "Same as Easy" in Medium Bonus Structure survives');
      const pb = DF.render(dfx((d) => { d.medium.perfectBonus = 600; }), dold), mb = at(pb, 'Medium', 'Bonus Structure');
      ok(!mb.lines.some((l) => /Same as/.test(l)) && has(mb, '- Perfect Delivery : +6.00') && has(mb, '- Every 3 Completed : +1:30 Time Bonus')
         && has(mb, '- Maximum Extensions Per Shift : 5') && has(mb, '- Level Target : 15 deliveries / 15 tickets served') && has(mb, '- Clean Ticket : +5.00'),
         'with them different it is replaced by the section\'s fields (' + JSON.stringify(mb.lines) + ')');
      ok(has(at(pb, 'Hard', 'Bonus Structure', 'Points Bonus'), '- Same as Easy'), 'Hard\'s Points Bonus still names Easy, which it still equals');
      ok(DF.render(dfx((d) => { d.medium.perfectBonus = 600; }), pb) === pb, 'and that render is idempotent');

      /* tails */
      const tailed = dold.replace('- Starting Tip per Item : 5.00\n', '- Starting Tip per Item : 5.00 a ticket, for each item on it\n');
      const tp = DF.render(dfx((d) => { d.easy.kitchen.tipPerItem = 600; d.easy.kitchen.maxItems = 4; d.easy.tipFloor = 300; }), tailed);
      ok(has(at(tp, 'Easy', 'Kitchen Shift'), '- Starting Tip per Item : 6.00 a ticket, for each item on it'), 'the line Starting Tip per Item : 5.00 keeps its tail when the value changes');
      ok(has(at(tp, 'Easy', 'Kitchen Shift'), '- Maximum Items per Ticket : 4. Tickets are weighted toward 1 and 2 items')
         && has(at(tp, 'Easy', 'Shift'), '- Tip Floor : 3.00. The tip falls to it in 54s and holds there; it never runs out'),
         'so do the notes after Maximum Items per Ticket and Tip Floor');

      /* "anything not listed here is the same as" the difficulty before */
      const fl = DF.render(dfx((d) => { d.medium.tipFloor = 300; }), dold);
      ok(has(at(fl, 'Medium', 'Shift'), '- Tip Floor : 3.00') && has(at(fl, 'Hard', 'Shift'), '- Tip Floor : 2.00')
         && !at(fl, 'Supreme', 'Shift').lines.some((l) => /Tip Floor/.test(l)),
         'an unlisted value is written where it stops matching the difficulty before, and only there');

      /* nav table, hint, ticket limit */
      const nv = DF.render(dfx((d) => { d.hard.nav.dot = false; }), dold);
      ok(nv.includes('\n| Hard | | | | | x |\n') && nv.includes('\n| Medium | x | | x | | x |\n'), 'the Navigation table rows follow the JSON');
      const hn = DF.render(dfx((d) => { d.easy.kitchen.hint = false; d.medium.kitchen.hint = true; d.hard.kitchen.hint = false; }), dold);
      ok(has(at(hn, 'Easy', 'Kitchen Shift'), '- Hint : none') && has(at(hn, 'Medium', 'Kitchen Shift'), '- Hint : on')
         && has(at(hn, 'Hard', 'Kitchen Shift'), '- Hint : none'), 'Hint reads on / none from the JSON');
      ok(has(at(dout, 'Easy', 'Kitchen Shift'), "- Hint : after a wrong pick, the right bin's plate blinks amber for 1.6s. The star and"),
         "while the hint is on, Easy's description of it is left as written");
      const lm = DF.render(dfx((d) => { d.easy.kitchen.railMax = 4; d.easy.kitchen.queueMax = 2; }), dold);
      ok(has(at(lm, 'Easy', 'Kitchen Shift'), '- Ticket Limit : 4 on the rail, and it is a soft limit. Up to 2 more customers wait in')
         && has(at(lm, 'Medium', 'Kitchen Shift'), '- Ticket Limit : 3 on the rail. Up to 3 more customers wait in the OVERHEAD'),
         'Ticket Limit carries railMax and queueMax');

      const fresh = DF.render(files, null);
      ok(['## I. Easy', '## II. Medium', '## III. Hard', '## IV. Supreme'].every((s) => fresh.includes('\n' + s + '\n'))
         && fresh.includes('\n| Supreme | | | | | x |') && DF.render(files, fresh) === fresh, 'difficulty.md renders from nothing, idempotently');
      ok(IX.renderAll(files, (f) => f === 'difficulty.md' ? dold : null)['difficulty.md'] === dout, 'renderAll renders difficulty.md');
    }

    /* the same-as rule: a Same-as item with a wrapped note */
    {
      const sw = parseMd('### C. P\n\n- Same as Medium : A 1.00,\n  B 2.00. A note\n  that wraps\n').children[0];
      ok(sameAs(sw) === 'Medium', 'a Same-as item that wraps onto indented lines is still recognised');
      let kept = null;
      applySame(sw, { values: 1, resolve: () => 2, fill: (n) => setField(n, 'A', '3.00'), keep: (t) => { kept = t; return ['A note that wraps']; } });
      ok(kept === '- Same as Medium : A 1.00, B 2.00. A note that wraps' && toMd(sw) === '### C. P\n\n- A : 3.00\n\nA note that wraps\n',
         'replacing it removes the whole item and puts back what keep() returns (' + JSON.stringify(toMd(sw)) + ')');
      ok(typeof E.findField === 'function' && E.findField(parseMd('## X\n\n- A : 1\n\n  - B (x) : 2\n').children[0], 'B (x)', { indent: '  ' }) === 3, 'findField finds a nested field line');
    }

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
  const era = structuredClone(files); era['levels.json'].levels[0].era = 2;
  le = null; try { validateContent(memSource(era)); } catch (x) { le = x; }
  ok(le instanceof ContentError && le.path.join('.') === 'levels.0.era', 'changing era alone is a ContentError on levels.0.era');
  /* the last 1970s level moves forward into the 1980s: year, era, name (and map/menu, which equal era) together */
  const mv = structuredClone(files), LS = mv['levels.json'].levels, k = LS.findIndex((l) => l.era === 2) - 1, l0 = LS[k];
  Object.assign(l0, { year: LS[k + 1].year, era: 2, name: l0.season.toUpperCase() + ' ' + LS[k + 1].year, map: 2, menu: 2 });
  /* the music rule (songs no more than 2 years before the level) follows the level: take the neighbour's list */
  const PL = mv['music/playlist.json'], PLL = PL.levels || PL;
  PLL[String(l0.n)] = PLL[String(LS[k + 1].n)];
  let mb = null; le = null; try { mb = validateContent(memSource(mv)); } catch (x) { le = x; }
  ok(mb && mb.levels[k].year === l0.year && mb.levels[k].era === 2, 'year, era and name changed together validate (' + (le ? le.path.join('.') + ': ' + le.message : 'ok') + ')');
  const { existsSync: ex } = await import('node:fs');
  const ov = readFileSync('admin/overlay.js', 'utf8');
  ok(ex('admin/panels/levels.js') && /import '\.\/panels\/levels\.js'/.test(ov), 'the Levels panel exists and the overlay imports it');
}

console.log('\n— difficulty panel —');
{
  /* just enough DOM for fields.js and a panel: elements, text, classes, events */
  const fakeDoc = () => {
    const doc = { activeElement: null };
    class N {
      constructor(tag) { this.tagName = String(tag).toUpperCase(); this.kids = []; this.parentNode = null; this.dataset = {}; this.className = ''; this._t = ''; this.on = {}; this.attrs = {}; this.style = {}; }
      get ownerDocument() { return doc; }
      get firstChild() { return this.kids[0] || null; }
      appendChild(c) { if (c.parentNode) c.parentNode.kids.splice(c.parentNode.kids.indexOf(c), 1); c.parentNode = this; this.kids.push(c); return c; }
      append(...cs) { for (const c of cs) this.appendChild(typeof c === 'string' ? Object.assign(new N('#text'), { _t: c }) : c); }
      insertBefore(c, ref) { this.appendChild(c); this.kids.pop(); const i = this.kids.indexOf(ref); this.kids.splice(i < 0 ? this.kids.length : i, 0, c); return c; }
      get textContent() { return this._t + this.kids.map((k) => k.textContent).join(''); }
      set textContent(s) { for (const k of this.kids) k.parentNode = null; this.kids = []; this._t = String(s); }
      get isConnected() { let n = this; while (n.parentNode) n = n.parentNode; return n === doc.body; }
      get classList() {
        const get = () => new Set(this.className.split(/\s+/).filter(Boolean)), put = (s) => { this.className = [...s].join(' '); };
        return { contains: (c) => get().has(c), add: (c) => { const s = get(); s.add(c); put(s); }, remove: (c) => { const s = get(); s.delete(c); put(s); },
          toggle: (c, on) => { const s = get(); if (on === undefined ? !s.has(c) : on) s.add(c); else s.delete(c); put(s); return s.has(c); } };
      }
      addEventListener(t, f) { (this.on[t] = this.on[t] || []).push(f); }
      fire(t) { for (const f of this.on[t] || []) f({ type: t, target: this, preventDefault() {} }); }
      setAttribute(k, v) { this.attrs[k] = String(v); }
      walk() { return [this, ...this.kids.flatMap((k) => k.walk())]; }
    }
    doc.createElement = (t) => new N(t);
    doc.body = new N('body');
    return doc;
  };

  const { store } = await import('../admin/store.js');
  const FL = await import('../admin/fields.js');
  const { DIFF_KEYS, NAV_KEYS } = await import('../tools/content/validate.mjs');
  const realApply = globalThis.Admin.applyBuilt;
  globalThis.Admin.applyBuilt = () => {};          // the game is not part of this section
  store.files = structuredClone(files); store.dirty.clear(); store.error = null;
  let loaded = true;
  try { await import('../admin/panels/difficulty.js'); } catch (x) { loaded = false; console.error('  (' + x.message + ')'); }
  const tab = FL.tabs.get('difficulty');
  ok(loaded && tab && tab.title === 'Difficulty', 'the Difficulty panel registers its tab');
  const ov = readFileSync('admin/overlay.js', 'utf8');
  ok(/import '\.\/panels\/difficulty\.js'/.test(ov), 'the overlay imports the Difficulty panel');
  if (tab) {
    const doc = fakeDoc(), el = doc.createElement('div');
    doc.body.appendChild(el);
    tab.render(el);
    const nodes = el.walk();
    const ctl = (k, p) => nodes.find((n) => n.dataset.rel === 'difficulty.json' && n.dataset.path === k + '.' + p);
    const heads = nodes.filter((n) => n.tagName === 'TH' && n.dataset.diff).map((n) => n.textContent);
    ok(heads.join() === 'Easy,Medium,Hard,Supreme', 'one column per difficulty, in ladder order (' + heads.join() + ')');
    const ROWS = ['start', 'extend', 'maxExt', 'target', 'tipStart', 'tipFloor', 'tipDecay', 'fines.ticket', 'fines.ped', 'fines.train', 'fines.remake',
      ...NAV_KEYS.map((f) => 'nav.' + f), 'kitchen.tipPerItem', 'kitchen.decay', 'kitchen.maxItems', 'kitchen.every', 'kitchen.railMax',
      'kitchen.queueMax', 'kitchen.hint', 'kitchen.cleanBonus', 'perfectBonus'];
    const want = DIFF_KEYS.flatMap((k) => ROWS.map((r) => k + '.' + r)).sort();
    const got = nodes.filter((n) => n.dataset.rel === 'difficulty.json').map((n) => n.dataset.path).sort();
    ok(JSON.stringify(got) === JSON.stringify(want), 'a control for every row in every column, bound to its JSON path (' + got.length + ' of ' + want.length + ')');
    const MONEY = ['tipStart', 'tipFloor', 'fines.ticket', 'fines.ped', 'fines.train', 'fines.remake', 'kitchen.tipPerItem', 'kitchen.cleanBonus', 'perfectBonus'];
    ok(DIFF_KEYS.every((k) => MONEY.every((p) => ctl(k, p).dataset.kind === 'money')
       && NAV_KEYS.every((f) => ctl(k, 'nav.' + f).dataset.kind === 'bool') && ctl(k, 'kitchen.hint').dataset.kind === 'bool'),
       'money rows are money fields, nav and hint are on/off');
    ok(ctl('easy', 'fines.ticket').value === '5.00' && ctl('supreme', 'fines.ticket').value === '15.00', 'fines show in dollars');
    ok(ctl('easy', 'tipDecay').value === '3' && ctl('medium', 'tipDecay').value === '2.5' && ctl('easy', 'kitchen.decay').value === '8'
       && ctl('medium', 'kitchen.decay').value === '6', 'a decay shows as the N of $1.00 / N s');
    ok(nodes.some((n) => n.textContent === '$1.00 /') , 'the decay rows say $1.00 /');
    const derived = () => DIFF_KEYS.map((k) => (nodes.find((n) => n.dataset.derived === k) || {}).textContent).join();
    ok(derived() === '54s,45s,36s,36s', 'the derived row: seconds for the tip to reach the floor (' + derived() + ')');
    ok(el.textContent.includes('tip reaches the floor'), 'captioned "tip reaches the floor"');

    const type = (c, v) => { c.value = v; c.fire('input'); FL.paint(); };   // the overlay repaints on every store change
    type(ctl('easy', 'tipDecay'), '4');
    ok(store.get('difficulty.json', 'easy.tipDecay') === 25 && derived().startsWith('72s,'), 'editing N stores 100 / N cents per second, and the derived row follows (' + derived() + ')');
    type(ctl('easy', 'tipDecay'), '0');
    ok(store.get('difficulty.json', 'easy.tipDecay') === 25 && /seconds/.test(ctl('easy', 'tipDecay')._msg.textContent), 'N = 0 is refused on the field and nothing is stored');
    type(ctl('easy', 'tipDecay'), '3');
    ok(store.get('difficulty.json', 'easy.tipDecay') === 100 / 3 && ctl('easy', 'tipDecay')._msg.textContent === '' && derived().startsWith('54s,'), 'N = 3 stores 100/3, exactly the shipped value');
    type(ctl('medium', 'kitchen.decay'), '5');
    ok(store.get('difficulty.json', 'medium.kitchen.decay') === 20, 'the kitchen decay edits the same way');
    type(ctl('medium', 'kitchen.decay'), '6');
    type(ctl('easy', 'fines.ticket'), '6.50');
    ok(store.get('difficulty.json', 'easy.fines.ticket') === 650, 'a fine is typed in dollars and stored in cents');
    type(ctl('easy', 'fines.ticket'), '5.00');

    const tick = (c, on) => { c.checked = on; c.fire('change'); FL.paint(); };
    tick(ctl('hard', 'nav.line'), true);
    const bad = ctl('hard', 'nav.line');
    ok(store.error && store.error.path.join('.') === 'hard.nav.line' && bad.classList.contains('adm-bad')
       && /Guidance only ever comes away up the ladder/.test(bad._msg.textContent), 'turning Hard\'s line back on is refused, with the ladder message on that cell');
    ok(nodes.filter((n) => n.classList && n.classList.contains('adm-bad')).length === 1, 'and on no other cell');
    tick(ctl('hard', 'nav.line'), false);
    ok(store.error === null && !bad.classList.contains('adm-bad'), 'turning it off again clears it');
    tick(ctl('easy', 'nav.panel'), false);
    ok(store.error && store.error.path.join('.') === 'medium.nav.panel' && ctl('medium', 'nav.panel').classList.contains('adm-bad'),
       "turning Easy's panel off is refused on Medium's panel, the harder level that still shows it");
    tick(ctl('easy', 'nav.panel'), true);
    tick(ctl('easy', 'nav.line'), false);
    ok(store.error === null, "turning Easy's line off is allowed: every harder level already has it off");
    tick(ctl('easy', 'nav.line'), true);
    ok(JSON.stringify(store.files['difficulty.json']) === JSON.stringify(files['difficulty.json']), 'every edit was put back');
  }
  store.dirty.clear(); store.error = null;
  globalThis.Admin.applyBuilt = realApply;

  /* the refresher: a difficulty edit reaches the running game without restarting it */
  const A = SB.Admin, { G } = SB.__x, K = SB.__k.Kitchen;
  G.startRun(2); G.beginShift();
  for (let i = 0; i < 30; i++) G.update(1 / 60);
  const st = G.state, wx = G.weather;
  const fk = structuredClone(files); fk['difficulty.json'][G.diffKey].kitchen.decay = 7; fk['difficulty.json'][G.diffKey].tipFloor = 150;
  A.applyBuilt(validateContent(memSource(fk)), G);
  ok(G.state === st && st === 'kitchen' && G.weather === wx && G.diff.tipFloor === 150 && K.diff.decay === 7 && G.diff.kitchen === K.diff,
     'a difficulty edit mid-shift reaches G.diff and the kitchen, and neither restarts the shift nor re-rolls the weather');
  A.applyBuilt(validateContent(memSource(files)), G);
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
