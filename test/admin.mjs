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
/* attract.demo.levels: "random", or a non-empty list of distinct level numbers 1..20 */
const demoLevels = (v) => { const f = structuredClone(files); f['attract.json'].demo.levels = v; let x = null; try { validateContent(memSource(f)); } catch (y) { x = y; } return x; };
e = demoLevels([0]);
ok(e instanceof ContentError && e.file === 'content/attract.json' && e.path.join('.') === 'demo.levels', 'demo.levels [0] is refused on demo.levels' + (e ? ' (' + e.message + ')' : ''));
ok(['RANDOM', [], [2, 2], [21], [1.5], '3', null].every((v) => { const x = demoLevels(v); return x instanceof ContentError && x.path.join('.') === 'demo.levels'; }),
   'and so are "RANDOM", [], a repeat, 21, 1.5, "3" and null');
ok(demoLevels('random') === null && demoLevels([1, 20]) === null && demoLevels([7]) === null, '"random", [1, 20] and [7] are accepted');
ok(Array.isArray(validateContent(memSource((() => { const f = structuredClone(files); f['attract.json'].demo.levels = [3, 1]; return f; })())).attract.demo.levels),
   'a list reaches the built ATTRACT');

/* casts.json: the explicit cast per era (spec §5.7). Today's is what the old
   prefix rule (c7 / c8 / c9) picked, in FACES order. */
{
  const prefix = (p) => Object.keys(files).filter((k) => k.startsWith('faces/' + p)).sort().map((k) => k.slice(6, -5));
  const want = { 1: prefix('c7'), 2: prefix('c8'), 3: prefix('c9') };
  ok(disk.casts && JSON.stringify(disk.casts) === JSON.stringify(want) && want[1].length === 6 && want[2].length === 5 && want[3].length === 5,
     'casts.json builds to the prefix result: 6, 5 and 5 faces (' + JSON.stringify(disk.casts) + ')');
  const castErr = (edit) => { const f = structuredClone(files); edit(f['casts.json'], f); let x = null; try { validateContent(memSource(f)); } catch (y) { x = y; } return x; };
  e = castErr((c) => { c['1'][2] = 'nobody'; });
  ok(e instanceof ContentError && e.file === 'content/casts.json' && e.path.length === 2 && e.path[0] === '1' && e.path[1] === 2 && /nobody/.test(e.message),
     'a cast naming a missing face is refused with path [\'1\', i] (' + (e && e.path.join() + ': ' + e.message) + ')');
  e = castErr((c) => { c['2'] = []; });
  ok(e instanceof ContentError && e.file === 'content/casts.json' && e.path.join() === '2', 'an empty era is refused on that era');
  e = castErr((c) => { delete c['3']; });
  ok(e instanceof ContentError && e.path.join() === '3', 'an era the levels use with no cast is refused (' + (e && e.message) + ')');
  e = castErr((c) => { c['9'] = ['c70teacher']; });
  ok(e instanceof ContentError && e.path.join() === '9', 'an era no level uses is refused');
  e = castErr((c) => { c['1'].push(c['1'][0]); });
  ok(e instanceof ContentError && e.path.join() === '1,' + (want[1].length), 'a face twice in one era is refused on the repeat');
  ok(castErr((c) => { c['1'].push('smokerbust'); c['3'].unshift('c70teacher'); }) === null, 'any face may be cast, in any era');
  e = castErr((c, f) => { delete f['casts.json']; });
  ok(e instanceof ContentError && e.file === 'content/casts.json', 'a missing casts.json is a ContentError naming it');

  /* hand-set eyes: the note never ships, and an eye has to sit on the bitmap */
  const fh = structuredClone(files);
  Object.assign(fh['faces/c70teacher.json'], { eyes: [[20, 28, 6, 4]], _eyesByHand: true });
  const bh = validateContent(memSource(fh)).faces.c70teacher;
  ok(bh && !('_eyesByHand' in bh) && JSON.stringify(bh.eyes) === '[[20,28,6,4]]', '_eyesByHand is a note: stripped from the build, the eyes kept');
  const eyeErr = (eyes) => { const f = structuredClone(files); f['faces/c70teacher.json'].eyes = eyes; let x = null; try { validateContent(memSource(f)); } catch (y) { x = y; } return x; };
  e = eyeErr([[58, 28, 6, 4]]);
  ok(e instanceof ContentError && e.file === 'content/faces/c70teacher.json' && e.path.join() === 'eyes,0', 'an eye off the edge of the bitmap is refused on [eyes, i]');
  ok([[[1, 2, 3]], [[1, 2, 3, 1]], [[-1, 2, 3, 4]], [[1.5, 2, 3, 4]], 'x'].every((v) => { const x = eyeErr(v); return x instanceof ContentError && x.path[0] === 'eyes'; }),
     'and so is a short rect, one row tall, negative, fractional, or not a list');
  ok(eyeErr([]) === null && eyeErr([[1, 1, 3, 2], [10, 1, 3, 2]]) === null, 'no eyes, or two in bounds, are accepted');
  const fs2 = structuredClone(files); fs2['faces/c70teacher.json'].skin = '#123456';
  e = null; try { validateContent(memSource(fs2)); } catch (x) { e = x; }
  ok(e instanceof ContentError && e.file === 'content/faces/c70teacher.json' && e.path.join() === 'skin', 'a lid colour (skin) that is not in the face\'s palette is refused');
}

/* a song's release month: required (Task 14), an integer 1-12 */
{
  const monthErr = (m) => { const f = structuredClone(files); if (m === undefined) delete f['music/kashmir.json'].month; else f['music/kashmir.json'].month = m; let x = null; try { validateContent(memSource(f)); } catch (y) { x = y; } return x; };
  ok([0, 13, 2.5, '3', null].every((m) => { const x = monthErr(m); return x instanceof ContentError && x.file === 'content/music/kashmir.json' && x.path.join() === 'month'; }),
     'a song month of 0, 13, 2.5, "3" or null is refused on [month] (' + (monthErr(13) && monthErr(13).message) + ')');
  ok(monthErr(1) === null && monthErr(12) === null, 'months 1 and 12 are accepted');
  e = monthErr(undefined);
  ok(e instanceof ContentError && e.file === 'content/music/kashmir.json' && e.path.join() === 'month' && /month/.test(e.message),
     'a song with no month is refused on [month] (' + (e && e.message) + ')');
  ok(Object.values(disk.music).every((s) => Number.isInteger(s.month) && s.month >= 1 && s.month <= 12) && Object.keys(disk.music).length === 42,
     'every one of the 42 shipped songs has a release month');
  const sj = JSON.parse(readFileSync('tools/music/songs.json', 'utf8')).songs;
  ok(sj.length === 42 && sj.every((s) => disk.music[s.id] && s.month === disk.music[s.id].month && typeof s._month === 'string' && s._month.length > 10),
     'songs.json carries the same month for every song, and a _month note naming its source');
}

/* the season rule (spec §9, owner 2026-11-07: a late song WARNS, never refuses) */
{
  const { levelMonth, songEligible, MUSIC_LOOKBACK: LB } = await import('../tools/content/validate.mjs');
  const LV = disk.levels;
  ok(typeof levelMonth === 'function' && [[0, 7], [1, 12], [2, 1], [3, 7], [8, 1], [14, 1], [19, 12]].every(([i, m]) => levelMonth(LV, i) === m),
     'levelMonth: L1 7, L2 12, L3 1, L4 7, L9 1, L15 1, L20 12 (' + (typeof levelMonth === 'function' ? [0, 1, 2, 3, 8, 14, 19].map((i) => levelMonth(LV, i)).join() : 'none') + ')');
  ok(typeof levelMonth === 'function' && LV.every((l, i) => (l.season === 'summer' ? levelMonth(LV, i) === 7 : [1, 12].includes(levelMonth(LV, i)))),
     'every summer is July, every winter January or December');
  const se = (s, i) => (typeof songEligible === 'function' ? songEligible(s, LV, i) : { ok: null });
  let r = se({ year: 1975, month: 10 }, 2);
  ok(r.ok === true && typeof r.warn === 'string' && /oct/i.test(r.warn) && /jan/i.test(r.warn), 'an October 1975 song on Level 3 (January 1975) is allowed, with a warning naming both months (' + r.warn + ')');
  r = se({ year: 1975, month: 10 }, 3);
  ok(r.ok === true && typeof r.warn === 'string' && /oct/i.test(r.warn) && /jul/i.test(r.warn), 'and on Level 4 (July 1975) too (' + r.warn + ')');
  r = se({ year: 1984, month: 5 }, 8);
  ok(r.ok === true && typeof r.warn === 'string' && /may/i.test(r.warn) && /jan/i.test(r.warn), 'a May 1984 song on Level 9 (January 1984) warns (' + r.warn + ')');
  r = se({ year: 1975, month: 1 }, 2);
  ok(r.ok === true && !r.warn, 'a January song on a January level is fine, no warning');
  r = se({ year: 1975, month: 7 }, 3);
  ok(r.ok === true && !r.warn, 'a July song on a July level is fine');
  r = se({ year: 1974, month: 12 }, 2);
  ok(r.ok === true && !r.warn, 'an earlier year is never warned about, whatever its month');
  r = se({ year: 1976, month: 1 }, 2);
  ok(r.ok === false && /too new/.test(r.why || ''), 'a song from after the level\'s year is still refused, too new (' + r.why + ')');
  r = se({ year: 1975 - LB - 1, month: 12 }, 2);
  ok(r.ok === false && /too old/.test(r.why || ''), 'and one more than ' + LB + ' years before it, too old (' + r.why + ')');
  /* the build still refuses only the year window: Bohemian Rhapsody stays on Level 3 */
  ok(disk.playlist['3'].join() === 'bohemian-opera,bohemian-rock' && disk.playlist['16'].includes('cannonball'), 'the shipped playlists keep Bohemian Rhapsody on Level 3 and Cannonball on Level 16');
  const late = structuredClone(files); late['music/kashmir.json'].month = 12;
  e = null; try { validateContent(memSource(late)); } catch (x) { e = x; }
  ok(e === null, 'a same-year song released after its level\'s month does not fail the content (Kashmir in December on Level 4)');
  const early = structuredClone(files); early['music/playlist.json']['1'] = ['kashmir'];
  e = null; try { validateContent(memSource(early)); } catch (x) { e = x; }
  ok(e instanceof ContentError && e.path.join() === '1,0', 'a year violation still does');
}

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
{
  const { formatLike } = await import('../tools/content/format.mjs');
  const v = { a: [1, 2], b: 'x' };
  ok(typeof formatLike === 'function' && formatLike(JSON.stringify({ a: [0] }), v) === JSON.stringify(v)
     && formatLike(JSON.stringify({ a: [0] }, null, 2) + '\n', v) === JSON.stringify(v, null, 2) + '\n'
     && formatLike(formatJSON({ a: [0, 1] }), v) === formatJSON(v) && formatLike(null, v) === formatJSON(v),
     'formatLike keeps a baked file\'s layout: one line, bake-face\'s, or formatJSON');
  const ft = readFileSync('content/faces/c70teacher.json', 'utf8'), sb = readFileSync('content/faces/smokerbust.json', 'utf8');
  ok(formatLike(ft, JSON.parse(ft)) === ft && formatLike(sb, JSON.parse(sb)) === sb, 'an era face and smokerbust, rewritten unchanged, are byte-identical');
}
ok(formatJSON({ a: [1, 2], b: [{ c: 1 }], d: [], e: 'é' })
   === '{\n  "a": [1, 2],\n  "b": [\n    {\n      "c": 1\n    }\n  ],\n  "d": [],\n  "e": "é"\n}\n',
   'formatJSON follows the pretty rule');

console.log('\n— server —');
{
  const { mkdtempSync, cpSync, writeFileSync, rmSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const tmp = mkdtempSync(join(tmpdir(), 'admin-'));
  /* a few MIDIs, not the library: one ported, one that ports, one that fails (99Problems has no notes to arrange), one at the root */
  const MIDIS = ['70s/Kashmir.mid', '80s/HazyShadeOfWinter.mid', '90s/99Problems.mid', 'OnTheOutside.mid'];
  for (const f of ['build.mjs', 'shell.html', 'src', 'content', 'tools/content', 'tools/render/recolor-lattice.mjs', 'tools/music/midi2song.mjs', 'tools/music/songs.json',
    ...MIDIS.map((m) => 'reference/assets/midi/' + m)]) cpSync(f, join(tmp, f), { recursive: true });
  (await import('node:child_process')).execFileSync('node', ['build.mjs'], { cwd: tmp, stdio: 'pipe' });
  const { startAdmin } = await import('../tools/content/server.mjs');
  const srv = await startAdmin({ root: tmp, port: 0 });
  const recolor = (body, origin) => fetch(srv.url + '/admin/api/recolor', {
    method: 'POST', headers: { 'content-type': 'application/json', origin: origin || srv.url },
    body: JSON.stringify(body) });
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

    /* recolouring a well: generated assets are written when generated, and no endpoint overwrites a file */
    {
      const { existsSync } = await import('node:fs');
      const chili = join(tmp, 'content/lattice/chili.json'), chiliText = readFileSync(chili, 'utf8');
      r = await recolor({ src: 'BEANS', name: 'CHILI', hue: -20, sat: 1.1, val: 0.8 });
      j = await r.json();
      ok(r.status === 409 && j.error === 'exists' && readFileSync(chili, 'utf8') === chiliText, 'recolour into an existing name is 409 exists, and the file is untouched');
      r = await recolor({ src: 'BEANS', name: 'TESTWELL', hue: -20, sat: 1.1, val: 0.8 });
      j = await r.json();
      const made = join(tmp, 'content/lattice/testwell.json');
      ok(r.status === 200 && j.rel === 'lattice/testwell.json' && j.json && j.json.name === 'TESTWELL' && existsSync(made)
         && JSON.stringify(JSON.parse(readFileSync(made, 'utf8'))) === JSON.stringify(j.json),
         'a new name is 200 { rel, json } and writes content/lattice/<name>.json in the temp root (' + r.status + ' ' + JSON.stringify(j).slice(0, 120) + ')');
      ok(!existsSync('content/lattice/testwell.json'), 'and nothing in the real repo');
      const beans = JSON.parse(readFileSync(join(tmp, 'content/lattice/beans.json'), 'utf8'));
      ok(j.json && j.json.w === beans.w && j.json.pix === beans.pix && j.json.pal.length === beans.pal.length && j.json.pal.join() !== beans.pal.join(),
         'the result is the source well with its food colours moved');
      r = await recolor({ src: 'BEANS', name: 'TESTWELL', hue: 10, sat: 1, val: 1 });
      ok(r.status === 409 && (await r.json()).error === 'exists', 'a second recolour under the same name is refused, not overwritten');
      const bad = [{ src: 'BEANS', name: '../x', hue: 0, sat: 1, val: 1 }, { src: 'BEANS', name: 'lower', hue: 0, sat: 1, val: 1 },
        { src: 'NOPE', name: 'NEWONE', hue: 0, sat: 1, val: 1 }, { src: 'BEANS', name: 'NEWONE', hue: 'x', sat: 1, val: 1 }];
      const codes = [];
      for (const b of bad) codes.push((await recolor(b)).status);
      ok(codes.every((c) => c === 400) && !existsSync(join(tmp, 'content/lattice/newone.json')), 'a bad name, a missing source or a non-number is 400 (' + codes.join() + ')');
      const held = srv.job(['node', '-e', 'setTimeout(()=>{},600)']);
      await new Promise((x) => setTimeout(x, 100));
      r = await recolor({ src: 'BEANS', name: 'BUSYWELL', hue: 0, sat: 1, val: 1 });
      ok(r.status === 409 && (await r.json()).error === 'busy' && !existsSync(join(tmp, 'content/lattice/busywell.json')), 'a recolour while a job runs is 409 busy');
      await held;
      /* two at once for the same new name: the check and the write share one lock */
      const race = await Promise.all([30, 90].map((hue) => recolor({ src: 'BEANS', name: 'RACEWELL', hue, sat: 1, val: 1 })));
      const rb = await Promise.all(race.map((x) => x.json())), rs = race.map((x) => x.status);
      const won = rb[rs.indexOf(200)], lostR = rb[rs.findIndex((s) => s !== 200)];
      const raceFile = join(tmp, 'content/lattice/racewell.json');
      ok(rs.filter((s) => s === 200).length === 1 && rs.filter((s) => s === 409).length === 1 && ['busy', 'exists'].includes(lostR && lostR.error)
         && existsSync(raceFile) && JSON.stringify(JSON.parse(readFileSync(raceFile, 'utf8'))) === JSON.stringify(won.json),
         'two concurrent same-name recolours: one 200, one 409 (' + rs.join() + ' ' + (lostR && lostR.error) + '), and the file is the winner\'s');
      /* the tool itself never overwrites */
      const raceText = readFileSync(raceFile, 'utf8');
      let toolCode = 0;
      try { (await import('node:child_process')).execFileSync(process.execPath, ['tools/render/recolor-lattice.mjs', 'BEANS', 'RACEWELL', '180', '1', '1'], { cwd: tmp, stdio: 'pipe' }); }
      catch (x) { toolCode = x.status; }
      ok(toolCode === 2 && readFileSync(raceFile, 'utf8') === raceText, 'recolor-lattice.mjs run by hand onto an existing name exits 2 and leaves the file alone (' + toolCode + ')');
      ok((await recolor({ src: 'BEANS', name: 'X', hue: 0, sat: 1, val: 1 }, 'http://evil.example')).status === 403, 'recolour checks the Origin too');
    }

    /* the MIDI library and porting: a port writes one song and its songs.json
       entry, in the temp root, and never over an existing id */
    {
      const { existsSync } = await import('node:fs');
      const port = (body, origin) => fetch(srv.url + '/admin/api/port', {
        method: 'POST', headers: { 'content-type': 'application/json', origin: origin || srv.url }, body: JSON.stringify(body) });
      const lib = async () => { const x = await fetch(srv.url + '/admin/api/midis'); return x.status === 200 ? x.json() : null; };
      const l0 = await lib();
      ok(Array.isArray(l0) && l0.map((m) => m.file).join() === [...MIDIS].sort().join() && l0.every((m) => Array.isArray(m.ids)),
         'GET midis lists every .mid under reference/assets/midi, sorted, each with its song ids (' + JSON.stringify(l0) + ')');
      const km = l0 && l0.find((m) => m.file === '70s/Kashmir.mid'), hz = l0 && l0.find((m) => m.file === '80s/HazyShadeOfWinter.mid');
      ok(km && km.ids.join() === 'kashmir' && hz && hz.ids.length === 0, 'a ported MIDI names its song; an unported one names none');
      const SJ = join(tmp, 'tools/music/songs.json'), sjText = readFileSync(SJ, 'utf8');
      const kj = join(tmp, 'content/music/kashmir.json'), kText = readFileSync(kj, 'utf8');
      const hazy = { file: '80s/HazyShadeOfWinter.mid', id: 'hazy-shade-of-winter', title: 'A HAZY SHADE OF WINTER', artist: 'THE BANGLES', year: 1987, month: 11 };
      r = await port({ ...hazy, id: 'kashmir' }); j = await r.json();
      ok(r.status === 409 && j.error === 'exists' && readFileSync(kj, 'utf8') === kText && readFileSync(SJ, 'utf8') === sjText,
         'porting into an existing id is 409 exists, and the song and songs.json are untouched (' + r.status + ')');
      const bad = [{ ...hazy, id: '../x' }, { ...hazy, id: 'Upper' }, { ...hazy, id: 'playlist' }, { ...hazy, file: '../../content/levels.json' },
        { ...hazy, file: '70s/../../../content/x.mid' }, { ...hazy, file: 'C:/x.mid' }, { ...hazy, file: '70s\\Kashmir.mid' }, { ...hazy, file: '70s/Missing.mid' },
        { ...hazy, title: '' }, { ...hazy, artist: 7 }, { ...hazy, year: 1987.5 }, { ...hazy, month: 13 }, { ...hazy, month: 0 }, { ...hazy, month: undefined }];
      const codes = [];
      for (const b of bad) codes.push((await port(b)).status);
      ok(codes.every((c) => c === 400) && !existsSync(join(tmp, 'content/music/hazy-shade-of-winter.json')) && readFileSync(SJ, 'utf8') === sjText,
         'a bad id, a file outside the library or missing, an empty title, a bad year, a bad or missing month is 400, and nothing is written (' + codes.join() + ')');
      r = await port(hazy); j = await r.json();
      const made = join(tmp, 'content/music/hazy-shade-of-winter.json');
      ok(r.status === 200 && j.rel === 'music/hazy-shade-of-winter.json' && j.json && j.json.id === hazy.id && j.json.title === hazy.title && j.json.artist === hazy.artist
         && j.json.year === 1987 && j.json.month === 11 && j.json.src === hazy.file && j.json.len > 0 && existsSync(made)
         && JSON.stringify(JSON.parse(readFileSync(made, 'utf8'))) === JSON.stringify(j.json),
         'porting an unported MIDI is 200 { rel, json } and writes content/music/<id>.json, month and all (' + r.status + ' ' + JSON.stringify(j).slice(0, 160) + ')');
      const sj = JSON.parse(readFileSync(SJ, 'utf8')), last = sj.songs[sj.songs.length - 1];
      ok(sj.songs.length === JSON.parse(sjText).songs.length + 1 && JSON.stringify(last) === JSON.stringify({ id: hazy.id, file: hazy.file, title: hazy.title, artist: hazy.artist, year: 1987, month: 11 })
         && readFileSync(SJ, 'utf8') === formatSongs(sj), 'songs.json gains the entry, written one song per line (' + JSON.stringify(last) + ')');
      let vb = null; try { vb = validateContent(fsSource(join(tmp, 'content'))); } catch (x) { vb = x; }
      ok(vb && vb.music && vb.music[hazy.id] && vb.music[hazy.id].month === 11, 'the temp content validates with the ported song in it' + (vb instanceof Error ? ': ' + vb.message : ''));
      ok(!existsSync('content/music/hazy-shade-of-winter.json') && !readFileSync('tools/music/songs.json', 'utf8').includes('hazy-shade'), 'and nothing in the real repo');
      const madeText = existsSync(made) ? readFileSync(made, 'utf8') : null, sj2 = readFileSync(SJ, 'utf8');
      r = await port({ ...hazy, title: 'AGAIN' });
      ok(r.status === 409 && (await r.json()).error === 'exists' && madeText !== null && readFileSync(made, 'utf8') === madeText && readFileSync(SJ, 'utf8') === sj2, 'a second port under the same id is refused, not overwritten');
      const l1 = await lib();
      ok(l1 && (l1.find((m) => m.file === hazy.file) || { ids: [] }).ids.join() === hazy.id, 'and the library now names the song');
      r = await port({ file: '90s/99Problems.mid', id: 'ninety-nine-problems', title: '99 PROBLEMS', artist: 'JAY-Z', year: 2003, month: 4 }); j = await r.json();
      ok(r.status === 422 && typeof j.log === 'string' && j.log.length > 0 && !existsSync(join(tmp, 'content/music/ninety-nine-problems.json')) && readFileSync(SJ, 'utf8') === sj2,
         'a MIDI the arranger cannot use is 422 { log }, and leaves nothing behind (' + r.status + ')');
      r = await port({ file: 'OnTheOutside.mid', id: 'on-the-outside', title: 'ON THE OUTSIDE’', artist: 'X', year: 1990, month: 1 }); j = await r.json();
      ok(r.status === 422 && /’/.test(j.log || '') && !existsSync(join(tmp, 'content/music/on-the-outside.json')) && readFileSync(SJ, 'utf8') === sj2,
         'a title the font cannot draw is 422 naming the character, and leaves nothing behind (' + r.status + ' ' + String(j.log).slice(0, 80) + ')');
      ok((await port(hazy, 'http://evil.example')).status === 403, 'the port route checks the Origin too');
    }

    /* a face edit (eyes) is written in the layout the face file already has */
    {
      const tf = join(tmp, 'content/faces/c70teacher.json'), tt = readFileSync(tf, 'utf8');
      const st3 = (await (await fetch(srv.url + '/admin/api/content')).json()).stamp;
      const ed = { ...JSON.parse(tt), eyes: [[20, 28, 6, 4]], _eyesByHand: true };
      r = await post({ files: { 'faces/c70teacher.json': JSON.stringify(ed) }, stamp: { 'faces/c70teacher.json': st3['faces/c70teacher.json'] } });
      ok(r.status === 200 && readFileSync(tf, 'utf8') === JSON.stringify(ed), 'a saved face keeps its one-line layout: the edit and nothing else (' + r.status + ')');
    }

    r = await post({ files: {}, stamp: {} }, 'http://evil.example');
    ok(r.status === 403, 'a foreign Origin is refused 403');
    r = await fetch(srv.url + '/admin/api/save', { method: 'POST', body: '{}' });
    ok(r.status === 403, 'a POST with no Origin is refused 403');
    ok((await fetch(srv.url + '/..%2f..%2fetc/passwd')).status === 404, 'the .. guard holds');
  } finally { await srv.close(); rmSync(tmp, { recursive: true, force: true }); }
}

console.log('\n— faces —');
{
  let BF = null;
  try { BF = await import('../tools/render/bake-face.mjs'); } catch (x) { console.error('  (' + x.message + ')'); }
  ok(BF && typeof BF.keptEyes === 'function', 'bake-face.mjs exports keptEyes, and importing it runs no bake');
  if (BF && typeof BF.keptEyes === 'function') {
    const k1 = BF.keptEyes({ eyes: [[1, 2, 3, 4]], _eyesByHand: true }, [[9, 9, 9, 9]]);
    ok(JSON.stringify(k1.eyes) === '[[1,2,3,4]]' && k1.byHand === true, 'keptEyes keeps eyes set by hand');
    const k2 = BF.keptEyes({ eyes: [] }, [[9, 9, 9, 9]]), k3 = BF.keptEyes(null, [[9, 9, 9, 9]]);
    ok(JSON.stringify(k2.eyes) === '[[9,9,9,9]]' && k2.byHand === false && JSON.stringify(k3.eyes) === '[[9,9,9,9]]' && k3.byHand === false,
       'and takes the detector\'s when they were not, or there is no file yet');
    const k4 = BF.keptEyes({ eyes: [], _eyesByHand: true }, [[9, 9, 9, 9]]);
    ok(JSON.stringify(k4.eyes) === '[]' && k4.byHand === true, 'eyes cleared by hand stay cleared');
  }
  ok(BF && typeof BF.keptSkin === 'function'
     && BF.keptSkin({ skin: '#222222' }, true, ['#111111', '#222222'], '#111111') === '#222222'
     && BF.keptSkin({ skin: '#222222' }, false, ['#111111', '#222222'], '#111111') === '#111111'
     && BF.keptSkin({ skin: '#333333' }, true, ['#111111', '#222222'], '#111111') === '#111111'
     && BF.keptSkin(null, false, ['#111111'], '#111111') === '#111111',
     'keptSkin keeps a hand-set lid colour while the palette has it, else the detector\'s');

  /* the bake itself, and POST /admin/api/face, in a temp root: no face the
     tests make ever lands in the real content/faces/ */
  const { mkdtempSync, cpSync, rmSync, existsSync, writeFileSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { execFileSync } = await import('node:child_process');
  const tmp = mkdtempSync(join(tmpdir(), 'admin-faces-'));
  for (const f of ['build.mjs', 'shell.html', 'src', 'content', 'tools/content', 'tools/render', 'reference/kitchen/facedata.mjs', 'reference/kitchen/portrait.mjs'])
    cpSync(f, join(tmp, f), { recursive: true });
  const SRC_PNG = join(tmp, 'smoker.png');
  cpSync('reference/assets/images/Smoker.png', SRC_PNG);
  const realFaces = readdirSync('content/faces').join();
  const bake = (name) => execFileSync(process.execPath, ['tools/render/bake-face.mjs', name, SRC_PNG, '268', '100', '862', '1071'],
    { cwd: tmp, stdio: 'pipe', env: { ...process.env, MAXW: '60', MAXH: '74' } }).toString();
  const { startAdmin } = await import('../tools/content/server.mjs');
  let srv = null;
  try {
    const fj = join(tmp, 'content/faces/bakeprobe.json');
    bake('bakeprobe');
    const first = JSON.parse(readFileSync(fj, 'utf8'));
    ok(first.w === 60 && first.h === 74 && Array.isArray(first.eyes) && !('_eyesByHand' in first), 'a first bake writes the detector\'s eyes, with no note');
    const lid = first.pal.find((c) => c !== first.skin && c !== first.ink);
    writeFileSync(fj, JSON.stringify({ ...first, eyes: [[3, 4, 5, 6]], skin: lid, _eyesByHand: true }));
    const log = bake('bakeprobe');
    const again = JSON.parse(readFileSync(fj, 'utf8'));
    ok(JSON.stringify(again.eyes) === '[[3,4,5,6]]' && again._eyesByHand === true && again.pix === first.pix,
       'a re-bake keeps eyes set by hand, and the note (' + JSON.stringify(again.eyes) + ')');
    ok(again.skin === lid && lid !== first.skin, 'and the lid colour set with them (' + again.skin + ')');
    ok(/by hand/.test(log), 'and says so in its log');
    const mjs = readFileSync(join(tmp, 'reference/kitchen/faces/bakeprobe.mjs'), 'utf8');
    ok(mjs.includes('eyes: [[3,4,5,6]]'), 'the reference copy carries the same eyes');
    ok(readdirSync('content/faces').join() === realFaces, 'nothing was baked into the real content/faces/');

    /* the route */
    srv = await startAdmin({ root: tmp, port: 0 });
    const png = readFileSync(SRC_PNG).toString('base64');
    const face = (body, origin) => fetch(srv.url + '/admin/api/face', {
      method: 'POST', headers: { 'content-type': 'application/json', origin: origin || srv.url }, body: JSON.stringify(body) });
    const teacher = readFileSync(join(tmp, 'content/faces/c70teacher.json'), 'utf8');
    let r = await face({ name: 'c70teacher', png, crop: [268, 100, 862, 1071] }), j = await r.json();
    ok(r.status === 409 && j.error === 'exists' && readFileSync(join(tmp, 'content/faces/c70teacher.json'), 'utf8') === teacher,
       'baking over an existing face is 409 exists, and the file is untouched');
    const bad = [{ name: '../x', png }, { name: 'Upper', png }, { name: 'ok1', png: 42 }, { name: 'ok2', png, crop: [1, 2, 3] }, { name: 'ok3', png, crop: [0, 0, 0, 10] }];
    const codes = [];
    for (const b of bad) codes.push((await face(b)).status);
    ok(codes.every((c) => c === 400), 'a bad name, a png that is not a string, or a bad crop is 400 (' + codes.join() + ')');
    r = await face({ name: 'testface', png, crop: [268, 100, 862, 1071] }); j = await r.json();
    const made = join(tmp, 'content/faces/testface.json'), refImg = join(tmp, 'reference/assets/images/faces/testface.png');
    ok(r.status === 200 && j.rel === 'faces/testface.json' && j.json && j.json.name === 'TESTFACE' && existsSync(made)
       && JSON.stringify(JSON.parse(readFileSync(made, 'utf8'))) === JSON.stringify(j.json) && typeof j.log === 'string' && /round trip/.test(j.log),
       'a new face is 200 { rel, json, log } and writes content/faces/<name>.json in the temp root (' + r.status + ' ' + JSON.stringify(j).slice(0, 160) + ')');
    ok(j.json && j.json.w <= 60 && j.json.h <= 74, 'baked to the bust budget, 60x74 (' + (j.json && j.json.w + 'x' + j.json.h) + ')');
    ok(existsSync(refImg) && readFileSync(refImg).equals(readFileSync(SRC_PNG)), 'the reference image is kept under reference/assets/images/faces/');
    ok(!existsSync('content/faces/testface.json') && !existsSync('reference/assets/images/faces/testface.png'), 'and nothing in the real repo');
    r = await face({ name: 'testface', png, crop: [268, 100, 862, 1071] });
    ok(r.status === 409 && (await r.json()).error === 'exists', 'a second bake under the same name is refused, not overwritten');
    r = await face({ name: 'probeface', png }); j = await r.json();
    ok(r.status === 200 && j.json && j.json.w <= 60 && j.json.h <= 74 && /fit-portrait/.test(j.log),'with no crop, fit-portrait finds the bust and the bake uses it (' + r.status + ')');
    r = await face({ name: 'junkface', png: Buffer.from('not a png at all').toString('base64') }); j = await r.json();
    ok(r.status === 422 && typeof j.log === 'string' && j.log.length > 0, 'a pipeline that fails is 422 { log } (' + r.status + ')');
    ok(!existsSync(join(tmp, 'content/faces/junkface.json')) && !existsSync(join(tmp, 'reference/assets/images/faces/junkface.png')),
       'and leaves nothing behind, so the name can be tried again');
    ok((await face({ name: 'evilface', png }, 'http://evil.example')).status === 403, 'the face route checks the Origin too');
    let built = null; try { built = validateContent(fsSource(join(tmp, 'content'))); } catch (x) { built = x; }
    ok(built && built.faces && built.faces.testface, 'the temp content still validates with the new faces in it');
  } finally { if (srv) await srv.close(); rmSync(tmp, { recursive: true, force: true }); }
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

  /* a bin is emptied mid-shift (and the dishes that use it go with it) */
  A.applyBuilt(validateContent(memSource(files2())), G);
  G.startRun(2); G.beginShift(); frames(240);
  const binEra = G.level.era, bi = SB.__k.MENUS[binEra].bins.findIndex((b) => b && b.key === 'PEPPERS');
  ok(G.state === 'kitchen' && K.tickets.length > 0 && bi >= 0 && K.bins[bi] && K.bins[bi].key === 'PEPPERS', 'a kitchen shift is running with a PEPPERS bin');
  const fb = files2(), mb = fb['menus.json'][binEra];
  mb.bins[bi] = null; mb.items = mb.items.filter((it) => !it.recipe.includes('PEPPERS'));
  const wellsBefore = K.wells;
  threw = null;
  try { A.applyBuilt(validateContent(memSource(fb)), G);
    ok(G.state === 'card' && K.tickets.length === 0, 'removing a bin mid-shift restarts the kitchen screen (' + G.state + ')');
    ok(K.wells !== wellsBefore && K.wells.PEPPERS, 'the menus refresher rebuilt the wells');
    G.beginShift(); frames(240); } catch (x) { threw = x; }
  ok(!threw, 'removing a bin mid-shift, then a new shift for 240 frames: no throw' + (threw ? ' — ' + threw.stack : ''));
  ok(K.bins[bi] === null && ![...K.tickets, ...K.queue].some((t) => t.items.some((it) => it.def.recipe.includes('PEPPERS'))),
     'the kitchen has no PEPPERS bin and no ticket wants it');

  /* an edit to another era's menu re-points the kitchen without restarting it */
  const fo = files2(); fo['menus.json'][binEra].bins[bi] = null; fo['menus.json'][binEra].items = mb.items;
  const other3 = String(binEra === 3 ? 2 : 3);
  fo['menus.json'][other3].items[0].price += 1;
  const stO = G.state, tkO = K.tickets.length;
  A.applyBuilt(validateContent(memSource(fo)), G);
  ok(G.state === stO && stO === 'kitchen' && K.tickets.length === tkO && K.menu === SB.__k.MENUS[binEra],
     "a price edit in another era leaves the shift running, and the kitchen's menu points at the new content");

  /* a new well (a recolour) reaches the kitchen's decoded wells */
  const fl = files2(); fl['lattice/testwell.json'] = { ...structuredClone(files['lattice/beans.json']), name: 'TESTWELL' };
  A.applyBuilt(validateContent(memSource(fl)), G);
  ok(K.wells.TESTWELL, 'a new lattice record is decoded into Kitchen.wells');
  A.applyBuilt(validateContent(memSource(files2())), G);

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

  /* Review Focus 5, with the music really playing: a stub AudioContext makes
     Audio5 ready, so Music schedules notes and walks its queue. A 3-song list
     plays into its third song, then shrinks to one under it. */
  {
    const AU = runScript('Audio5'), MU = runScript('Music');
    const H = { get(t, k) { if (k in t) return t[k]; if (k === 'value') return 0; if (typeof k === 'symbol' || k === 'then') return undefined; return (t[k] = mk()); }, apply() { return mk(); } };
    const mk = () => new Proxy(function () {}, H);
    const actx = new Proxy({ currentTime: 0, sampleRate: 22050, state: 'running', destination: mk(), resume() {},
      createBuffer: (c, n) => ({ getChannelData: () => new Float32Array(n) }), createPeriodicWave: () => ({}) },
    { get: (t, k) => (k in t ? t[k] : () => mk()) });
    const saved = { ctx: AU.ctx, ready: AU.ready, master: AU.master, sfxBus: AU.sfxBus, musBus: AU.musBus };
    Object.assign(AU, { ctx: actx, ready: true, master: mk(), sfxBus: mk(), musBus: mk() });
    const tick = (secs) => { actx.currentTime += secs; MU._tick(); };
    threw = null;
    try {
      const f3 = files2(); f3['music/playlist.json']['1'] = ['immigrant-song', 'black-dog', 'walk-on-the-wild-side'];
      A.applyBuilt(validateContent(memSource(f3)), G);
      G.startRun(1); G.beginShift(); frames(10);
      ok(G.state === 'play' && MU.playing() && MU.queue.join() === 'immigrant-song,black-dog,walk-on-the-wild-side', 'level 1 plays its 3-song list (' + MU.queue.join() + ')');
      let guard = 0;
      while (MU.idx !== 2 && guard++ < 50) tick(20);
      ok(MU.idx === 2 && MU.now().id === 'walk-on-the-wild-side', 'and walks it into the third song (' + MU.idx + ')');
      const f1 = files2(); f1['music/playlist.json']['1'] = ['black-dog'];
      A.applyBuilt(validateContent(memSource(f1)), G);
      for (let i = 0; i < 40; i++) { tick(0.5); frames(1); }
      ok(MU.playing() && MU.queue.join() === 'black-dog' && MU.idx === 0 && MU.now().id === 'black-dog', 'shrinking the playing list to one song: the refresher puts the new list on (' + MU.queue.join() + ' ' + MU.idx + ')');

      /* Listen: the game's own player, the level's music released, then restored */
      const L = A.music;
      ok(L && typeof L.listen === 'function' && typeof L.stop === 'function', 'apply.js puts Admin.music.listen and stop on Admin');
      const orig = G.playMusic;
      /* a play that fails takes nothing over: no stub, not "listening", the level's music still on */
      const q0 = MU.queue.join(), realPlay = MU.play;
      const r0 = L.listen('no-such-song', G);
      MU.play = () => false;
      const r1 = L.listen('kashmir', G);
      MU.play = realPlay;
      ok(r0 === false && r1 === false && L.listening === null && G.playMusic === orig && MU.queue.join() === q0,
         'a listen whose play fails (unknown song, or Music.play false) leaves G.playMusic, listening and the music as they were');
      L.stop(G);
      ok(G.playMusic === orig && MU.queue.join() === q0, 'and Stop with nothing listened to changes nothing');
      L.listen('kashmir', G); tick(0.5);
      ok(MU.queue.join() === 'kashmir' && MU.now().id === 'kashmir' && L.listening === 'kashmir', 'Listen plays one song through Music (' + MU.queue.join() + ')');
      const f2b = files2(); f2b['music/playlist.json']['1'] = ['immigrant-song', 'black-dog'];
      A.applyBuilt(validateContent(memSource(f2b)), G); tick(0.5);
      G.playMusic('title'); tick(0.5);
      ok(MU.queue.join() === 'kashmir' && G.musicKey === 'title', 'while listening, a playlist edit or the game changing its music does not cut in, but the key is kept (' + MU.queue.join() + ' ' + G.musicKey + ')');
      G.playMusic(1);
      L.stop(G); tick(0.5);
      ok(L.listening === null && G.playMusic === orig && MU.queue.join() === 'immigrant-song,black-dog', 'Stop restores the level\'s music, its newest list, through G.playMusic (' + MU.queue.join() + ')');
      for (let i = 0; i < 20; i++) { tick(0.5); frames(1); }
    } catch (x) { threw = x; }
    ok(!threw, 'a playing list shrunk, a listen and a stop, with frames between: no throw' + (threw ? ' — ' + threw.stack : ''));
    MU.stop(); MU.owns = false;
    Object.assign(AU, saved);
    A.applyBuilt(validateContent(memSource(files2())), G);
  }

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

  /* casts: replaced in place, and castFor reads them live */
  let C0 = null;
  try { C0 = runScript('CASTS'); } catch (x) { C0 = null; }
  ok(C0 && C0['1'], 'the game has CASTS');
  if (C0) {
    const f4 = files2(); f4['casts.json']['1'] = ['c70teacher', 'smokerbust'];
    A.applyBuilt(validateContent(memSource(f4)), G);
    ok(runScript('CASTS') === C0 && SB.__k.Kitchen.castFor(1).join() === 'c70teacher,smokerbust', 'a cast edit reaches Kitchen.castFor, CASTS kept in place');
    A.applyBuilt(diskBuilt, G);
  }
  /* faces: a face that is talking and then removed falls back to DLG_FACE */
  const DL = runScript('Dialog'), DF = runScript('DLG_FACE');
  const noTeacher = { ...diskBuilt.faces }; delete noTeacher.c70teacher;
  DL.say('X', 'HI', { face: 'c70teacher' });
  A.applyBuilt({ ...diskBuilt, faces: noTeacher }, G);
  ok(DL.face === DF && !runScript('FACES').c70teacher, 'the talking face removed, the strip falls back to ' + DF + ' (' + DL.face + ')');
  A.applyBuilt(diskBuilt, G);
  DL.drop();
  ok(runScript('FACES').c70teacher && runScript('Faces').img.c70teacher, 'and put back, it is decoded again');
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
  const DIR = 'docs/authored content', NAMES = ['attract', 'dialogue', 'difficulty', 'faces', 'levels', 'menu', 'music'];
  ok(NAMES.every((n) => existsSync(join(DIR, n + '.md')) && !existsSync(join(DIR, n + '.md.md'))),
     'the seven docs are named *.md, not *.md.md');
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
      /* prose: every paragraph line, heading AND indented continuation line (the
         wrapped part of a note) of the source, in order. A Same-as item is left
         out: it is replaced as a whole, and its own assertions cover the note. */
      const proseOf = (src) => {
        const L = src.split('\n'), out = [];
        for (let i = 0; i < L.length; i++) {
          if (/^(?:- )?Same as /.test(L[i])) { while (/^\s+\S/.test(L[i + 1] || '')) i++; continue; }
          if (L[i].trim() && !/^- /.test(L[i]) && !/^\s+- /.test(L[i]) && !/^\|/.test(L[i])) out.push(L[i]);
        }
        return out;
      };
      const lost = (src, outText) => {
        const p = proseOf(src); let j = 0;
        for (const l of outText.split('\n')) if (j < p.length && l === p[j]) j++;
        return j === p.length ? null : p[j];
      };
      /* a continuation line hanging under a value the module wrote bare ("none",
         "3.00", "1.00 / 3 Seconds") belongs to no value: an orphan */
      const BARE = /^\s*- [^:]+ : (?:none|on|\+?\d+(?:\.\d\d|:\d\d)?(?: Minutes| Seconds| Time Bonus)?|\d+\.\d\d \/ [\d.]+ Seconds)$/;
      const orphans = (t) => t.split('\n').filter((l, i, L) => BARE.test(l) && /^\s+\S/.test(L[i + 1] || ''));
      const proseN = proseOf(dold).length, contN = proseOf(dold).filter((l) => /^\s/.test(l)).length;
      ok(proseN > 50 && contN >= 10 && lost(dold, t12) === null,
         'after that edit every one of the ' + proseN + ' prose lines, headings and wrapped note lines (' + contN + ') survives, in order (' + lost(dold, t12) + ')');
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
      const hintOff = (d) => { d.easy.kitchen.hint = false; d.medium.kitchen.hint = true; d.hard.kitchen.hint = false; };
      const hn = DF.render(dfx(hintOff), dold);
      ok(has(at(hn, 'Medium', 'Kitchen Shift'), '- Hint : on') && has(at(hn, 'Hard', 'Kitchen Shift'), '- Hint : none'), 'Hint reads on / none from the JSON');
      ok(has(at(dout, 'Easy', 'Kitchen Shift'), "- Hint : after a wrong pick, the right bin's plate blinks amber for 1.6s. The star and"),
         "while the hint is on, Easy's description of it is left as written");
      /* Easy's description wraps: turning it off must not leave its second line hanging under a bare "none" */
      const ek = at(hn, 'Easy', 'Kitchen Shift').lines, hi = ek.findIndex((l) => /^- Hint :/.test(l));
      ok(hi >= 0 && ek[hi] === "- Hint : none. When on: after a wrong pick, the right bin's plate blinks amber for 1.6s. The star and"
         && ek[hi + 1] === '  the clean bonus are lost all the same. Easy only' && !/^\s+\S/.test(ek[hi + 2] || ''),
         "turning Easy's hint off reads none, and keeps its wrapped description as the item's note (" + JSON.stringify(ek.slice(hi, hi + 3)) + ')');
      ok(DF.render(dfx(hintOff), hn) === hn, 'the hint-off render is idempotent');
      /* round trips toggle only the one hint: a value that differs from the level
         before gets a line of its own, and a line, once written, stays */
      const eOff = DF.render(dfx((d) => { d.easy.kitchen.hint = false; }), dold), hon = DF.render(files, eOff);
      ok(eOff.includes('\n- Hint : none. When on: after a wrong pick') && hon === dout && DF.render(files, hon) === hon,
         "Easy's hint off -> on gives back the doc exactly as it was");
      const mOn = DF.render(dfx((d) => { d.medium.kitchen.hint = d.hard.kitchen.hint = d.supreme.kitchen.hint = true; }), dold);
      ok(has(at(mOn, 'Medium', 'Kitchen Shift'), '- Hint : on') && DF.render(files, mOn) === dout, "and Medium's bare none -> on -> none round-trips too");

      /* the blind spot: no render leaves a wrapped line under a bare value, and none loses a note line */
      const variants = { today: [dold, dout], ticket: [dold, t12], bonus: [dold, pb], tails: [tailed, tp], floor: [dold, fl],
        nav: [dold, nv], hintOff: [dold, hn], easyHintOff: [dold, eOff], hintOn: [eOff, hon], medHintOn: [dold, mOn], limit: [dold, null] };
      variants.limit[1] = DF.render(dfx((d) => { d.easy.kitchen.railMax = 4; d.easy.kitchen.queueMax = 2; }), dold);
      const bad = Object.entries(variants).flatMap(([n, [src, o]]) => [...orphans(o).map((l) => n + ': orphan under ' + l),
        ...(lost(src, o) !== null ? [n + ': lost ' + lost(src, o)] : [])]);
      ok(orphans(dold).length === 0 && bad.length === 0, 'in every render no wrapped line is orphaned under a bare value and no note line is lost (' + JSON.stringify(bad) + ')');
      const lm = DF.render(dfx((d) => { d.easy.kitchen.railMax = 4; d.easy.kitchen.queueMax = 2; }), dold);
      ok(has(at(lm, 'Easy', 'Kitchen Shift'), '- Ticket Limit : 4 on the rail, and it is a soft limit. Up to 2 more customers wait in')
         && has(at(lm, 'Medium', 'Kitchen Shift'), '- Ticket Limit : 3 on the rail. Up to 3 more customers wait in the OVERHEAD'),
         'Ticket Limit carries railMax and queueMax');

      const fresh = DF.render(files, null);
      ok(['## I. Easy', '## II. Medium', '## III. Hard', '## IV. Supreme'].every((s) => fresh.includes('\n' + s + '\n'))
         && fresh.includes('\n| Supreme | | | | | x |') && DF.render(files, fresh) === fresh, 'difficulty.md renders from nothing, idempotently');
      ok(IX.renderAll(files, (f) => f === 'difficulty.md' ? dold : null)['difficulty.md'] === dout, 'renderAll renders difficulty.md');
    }

    /* attract.md, rendered from today's JSON and from edits to it */
    let AT = null;
    try { AT = (await import('../tools/content/docs/attract.mjs')).default; } catch (x) { console.error('  (' + x.message + ')'); }
    ok(AT && AT.file === 'attract.md' && IX.DOCS.includes(AT), 'attract.md is a registered doc');
    if (AT) {
      const aold = readFileSync(join(DIR, 'attract.md'), 'utf8').replace(/\r\n/g, '\n');
      const afx = (edit) => { const f = structuredClone(files); edit(f); return f; };
      const at = (text, ...names) => {
        let n = parseMd(text).children.find((c) => c.depth === 1);
        for (const nm of names) n = n && n.children.find((c) => c.heading.replace(/^[A-Z0-9]+\. /, '') === nm);
        return n || { lines: [], children: [] };
      };
      const has = (n, line) => n.lines.includes(line);
      const aout = AT.render(files, aold);
      ok(AT.render(files, aout) === aout, 'rendering attract.md is idempotent');
      const a = aold.split('\n'), b = aout.split('\n');
      const changed = a.map((l, i) => [l, b[i]]).filter(([x, y]) => x !== y);
      ok(a.length === b.length && changed.every(([x]) => x.startsWith('- Message : ')) && b.includes('- Message : "WINNERS DON\'T USE DRUGS. / THEY DRINK."'),
         'from today\'s JSON no line changes but Message, which shows the JSON\'s lines as drawn (' + JSON.stringify(changed) + ')');
      const W = at(aout, 'Screens', 'Winners Screen'), D = at(aout, 'Screens', 'Auto-Play');
      ok(has(W, '- FBI Director : Kash P.V. Patel') && has(D, '- Overlay Text : Press ESC to Return to Menu'),
         'the "FBI Director" and "Overlay Text" notes survive as prose, verbatim, where they were');
      ok(has(W, '- Attribution as drawn : KASH P.V. PATEL, DIRECTOR, FBI') && has(W, '- Credit : CREDIT: 0') && has(D, '- Levels : RANDOM'),
         'attribution, credit and the demo levels read the JSON');

      /* the brief: a changed winners.seconds */
      const w12 = AT.render(afx((f) => { f['attract.json'].winners.seconds = 12; }), aold);
      ok(has(at(w12, 'Screens', 'Winners Screen'), '- Duration : 0:12 seconds') && has(at(w12, 'Screens', 'Title Screen'), '- Duration : 0:15 seconds'),
         'winners.seconds = 12 shows as "- Duration : 0:12 seconds" on the Winners screen, and only there');
      ok(at(w12, 'Sequence').lines.some((l) => l.startsWith('One loop is 1:22. Any key or click')), 'and the loop line follows the cycle total, its sentence intact');
      ok(AT.render(afx((f) => { f['attract.json'].winners.seconds = 12; }), w12) === w12, 'and that render is idempotent');
      const t90 = AT.render(afx((f) => { f['attract.json'].title.seconds = 90; }), aold);
      ok(has(at(t90, 'Screens', 'Title Screen'), '- Duration : 1:30 seconds') && at(t90, 'Sequence').lines.some((l) => l.startsWith('One loop is 2:35.')),
         'a 90s title reads 1:30, and the loop 2:35');
      const half = AT.render(afx((f) => { f['attract.json'].scores.seconds = 7.5; }), aold);
      ok(has(at(half, 'Screens', 'High Scores'), '- Duration : 0:07.5 seconds'), 'a fractional duration reads 0:07.5, as the doc writes the IN beat');

      /* the wordmark hold is the "from 0:01" inside the Wordmark note */
      const h3 = AT.render(afx((f) => { f['attract.json'].title.wordmarkHold = 3; }), aold);
      ok(at(h3, 'Screens', 'Title Screen').lines.includes('  from 0:03 over 2 seconds, landing with a rumble. The prompt blinks once it has landed')
         && has(at(h3, 'Screens', 'Title Screen'), '- Wordmark : the badge stands alone, `IN` appears at 0:00.5, and CARNAGE ASADA grows in'),
         'wordmarkHold = 3 reads "from 0:03", and the IN beat (game code) is left alone');

      /* the demo's level set */
      const l25 = AT.render(afx((f) => { f['attract.json'].demo.levels = [2, 5]; }), aold), D25 = at(l25, 'Screens', 'Auto-Play');
      ok(has(D25, '- Levels : 2, 5') && has(D25, '  - The demo never scores and never reaches the high-score board'),
         'demo.levels [2, 5] reads "- Levels : 2, 5", and the notes under it stay');

      /* multi-line copy */
      const ml = AT.render(afx((f) => { f['winners.json'].slogan = 'Just say no'; f['winners.json'].attribution = ['A PERSON', 'A TITLE']; f['winners.json'].credit = 'CREDIT: 9'; }), aold);
      const Wm = at(ml, 'Screens', 'Winners Screen');
      ok(has(Wm, '- Message : Just say no') && has(Wm, '- Attribution as drawn : A PERSON / A TITLE') && has(Wm, '- Credit : CREDIT: 9'),
         'a one-line slogan reads as itself, a two-line attribution as "A / B", the credit as written');

      /* values round-trip: read() of a render gives back what was rendered */
      if (typeof AT.read === 'function') {
        const vals = (f) => ({ attract: f['attract.json'], winners: f['winners.json'] });
        const strip = (o) => JSON.parse(JSON.stringify(o, (k, v) => (k.startsWith('_') ? undefined : v)));
        const want = (f) => { const v = strip(vals(f)); return { title: v.attract.title, winners: v.attract.winners, scores: v.attract.scores, demo: v.attract.demo,
          slogan: [].concat(v.winners.slogan), attribution: [].concat(v.winners.attribution), credit: v.winners.credit }; };
        const cases = { today: files, w12: afx((f) => { f['attract.json'].winners.seconds = 12; }), h3: afx((f) => { f['attract.json'].title.wordmarkHold = 3; }),
          l25: afx((f) => { f['attract.json'].demo.levels = [2, 5]; }), half: afx((f) => { f['attract.json'].scores.seconds = 7.5; f['attract.json'].title.wordmarkHold = 1.5; }),
          ml: afx((f) => { f['winners.json'].slogan = 'JUST SAY NO'; f['winners.json'].attribution = ['A PERSON', 'A TITLE']; }) };
        const bad = Object.entries(cases).filter(([, f]) => JSON.stringify(AT.read(AT.render(f, aold))) !== JSON.stringify(want(f))).map(([n, f]) => n + ': ' + JSON.stringify(AT.read(AT.render(f, aold))));
        ok(bad.length === 0, 'attract.md round-trips: reading a render back gives the JSON\'s values (' + JSON.stringify(bad) + ')');
      } else ok(false, 'attract.mjs exports read(text), to read the values back');

      /* prose: every paragraph, heading and wrapped note line survives, and no wrapped line is orphaned */
      /* the loop line is prose whose leading total follows the JSON: compared without it */
      const total = (l) => l.replace(/^One loop is \d+:\d\d(?:\.\d+)?/, 'One loop is #');
      const proseOf = (src) => src.split('\n').filter((l) => l.trim() && !/^- /.test(l) && !/^\s+- /.test(l)).map(total);
      const lost = (src, o) => { const p = proseOf(src); let j = 0; for (const l of o.split('\n').map(total)) if (j < p.length && l === p[j]) j++; return j === p.length ? null : p[j]; };
      const BARE = /^\s*- (?:Duration|Levels|Message|Attribution as drawn|Credit) : /;
      const orphans = (t) => t.split('\n').filter((l, i, L) => BARE.test(l) && /^\s+\S/.test(L[i + 1] || ''));
      const NOTES = ['- FBI Director : Kash P.V. Patel', '- Overlay Text : Press ESC to Return to Menu', '- Music : the title songs (see music.md). They keep playing through the Winners and High',
        '  - Any of the 20 levels, with that level\'s era, season, map, menu and music'];
      const variants = { today: aout, w12, t90, half, l25, ml };
      const pn = proseOf(aold).length, cn = proseOf(aold).filter((l) => /^\s/.test(l)).length;
      const abad = Object.entries(variants).flatMap(([n, o]) => [...orphans(o).map((l) => n + ': orphan under ' + l),
        ...(lost(aold, o) !== null ? [n + ': lost ' + lost(aold, o)] : []), ...NOTES.filter((l) => !o.split('\n').includes(l)).map((l) => n + ': lost note ' + l)]);
      ok(pn > 15 && cn >= 4 && abad.length === 0,
         'in every render all ' + pn + ' prose lines (' + cn + ' of them wrapped) and every note line survive, none orphaned (' + JSON.stringify(abad) + ')');

      const afresh = AT.render(files, null);
      ok(['## I. Sequence', '## II. Screens', '### A. Title Screen', '### B. Winners Screen', '### C. High Scores', '### D. Auto-Play'].every((s) => afresh.includes('\n' + s + '\n'))
         && afresh.includes('- Duration : 0:45 seconds') && afresh.includes('One loop is 1:20.') && AT.render(files, afresh) === afresh,
         'attract.md renders from nothing, idempotently');
      ok(IX.renderAll(files, (f) => f === 'attract.md' ? aold : null)['attract.md'] === aout, 'renderAll renders attract.md');
    }

    /* dialogue.md, rendered from today's JSON and from edits to it */
    let DG = null;
    try { DG = (await import('../tools/content/docs/dialogue.mjs')).default; } catch (x) { console.error('  (' + x.message + ')'); }
    ok(DG && DG.file === 'dialogue.md' && IX.DOCS.includes(DG), 'dialogue.md is a registered doc');
    if (DG) {
      const { DLG_KEYS } = await import('../tools/content/validate.mjs');
      const gx = (edit) => { const f = structuredClone(files); edit(f['dialogue.json'], f); return f; };
      const dold = existsSync(join(DIR, 'dialogue.md')) ? readFileSync(join(DIR, 'dialogue.md'), 'utf8').replace(/\r\n/g, '\n') : null;
      const fresh = DG.render(files, null);
      ok(DLG_KEYS.every((k, i) => fresh.includes('\n## ' + roman(i + 1) + '. ' + k[0].toUpperCase() + k.slice(1) + '\n')),
         'dialogue.md renders one "## <roman>. <Key>" section per key of DLG_KEYS, in order');
      ok(fresh.includes('1. "ABOUT TIME. SMELLS ALRIGHT THOUGH."') && fresh.includes('1. "CUSTOMER"'), 'lines are a numbered list in JSON form');
      ok(fresh.includes('9. "TIME IS MONEY, TACO BOY!" (1980s on)') && !fresh.includes('2|'), 'a 2| line shows as (1980s on), the prefix gone');
      ok(fresh.includes('"MY PAGER\'S GOING OFF. HURRY!" (1990s on)'), 'a 3| line shows as (1990s on)');
      ok(DG.render(files, fresh) === fresh, 'rendering dialogue.md is idempotent');
      ok(dold !== null && DG.render(files, dold) === dold, 'the committed dialogue.md is what today\'s JSON renders to');
      ok(IX.renderAll(files, (f) => f === 'dialogue.md' ? fresh : null)['dialogue.md'] === fresh, 'renderAll renders dialogue.md');

      /* prose: the preamble, a note under a section and a wrapped item line all survive */
      const NOTE = '   (owner: keep this one)';
      const notes = fresh.replace('\n## I. Who\n', '\n## I. Who\n\nMY OWN NOTE ABOUT WHO.\n')
        .replace('1. "ABOUT TIME. SMELLS ALRIGHT THOUGH."', '1. "ABOUT TIME. SMELLS ALRIGHT THOUGH."\n' + NOTE);
      ok(notes !== fresh && DG.render(files, notes) === notes, 'prose under a heading and an item\'s wrapped note survive an unchanged render');
      const grown = DG.render(gx((d) => { d.delivered.push('ONE MORE LINE.'); }), notes);
      const gl = grown.split('\n'), ni = gl.indexOf('1. "ABOUT TIME. SMELLS ALRIGHT THOUGH."');
      ok(grown.includes('MY OWN NOTE ABOUT WHO.') && gl[ni + 1] === NOTE, 'a note survives, still under its item, when the list is edited');
      ok(grown.includes('9. "ONE MORE LINE."'), 'an added line is numbered in');
      const shrunk = DG.render(gx((d) => { d.delivered.length = 3; }), notes);
      ok(shrunk.split('\n').indexOf(NOTE) === shrunk.split('\n').indexOf('1. "ABOUT TIME. SMELLS ALRIGHT THOUGH."') + 1 && !shrunk.includes('4. "STILL WARM'),
         'a note on a line that is still there stays, and the dropped lines go');
      const pre = fresh.split('\n## I. Who')[0];
      ok(pre.length > 80 && /^# dialogue\.md\n\n\S/.test(pre), 'the preamble is a paragraph under the title');
      const custom = DG.render(files, fresh.replace(pre, '# dialogue.md\n\nMY PREAMBLE.\n'));
      ok(custom.startsWith('# dialogue.md\n\nMY PREAMBLE.\n') && !custom.includes(pre.split('\n')[2]), 'a rewritten preamble is kept, not regenerated');

      /* values round-trip */
      if (typeof DG.read === 'function') {
        const want = (f) => { const d = f['dialogue.json'], o = {}; for (const k of DLG_KEYS) o[k] = [].concat(d[k]); return o; };
        const cases = { today: files, grown: gx((d) => { d.wait.push('3|HELLO FROM 1990.'); d.queue.shift(); }), who: gx((d) => { d.who = 'PATRON'; }) };
        const bad = Object.entries(cases).filter(([, f]) => JSON.stringify(DG.read(DG.render(f, dold))) !== JSON.stringify(want(f))).map(([n]) => n);
        ok(bad.length === 0, 'dialogue.md round-trips: reading a render back gives the JSON\'s lines (' + bad + ')');
      } else ok(false, 'dialogue.mjs exports read(text)');

      /* the width check is the validator's: an over-wide line is a ContentError at [key, index] */
      let wide = null;
      try { validateContent(memSource(gx((d) => { d.delivered[2] = 'THIS LINE IS FAR TOO WIDE FOR THE SPEECH BUBBLE BESIDE THE PORTRAIT'; }))); } catch (x) { wide = x; }
      ok(wide instanceof ContentError && wide.file === 'content/dialogue.json' && wide.path.join() === 'delivered,2' && /Trim \d+ character/.test(wide.message),
         'an over-wide line is a ContentError with path [key, index] (' + (wide && wide.path.join()) + ')');
    }

    /* faces.md: per era, the cast; each face's name, size and whether its eyes are set */
    let FC = null;
    try { FC = (await import('../tools/content/docs/faces.mjs')).default; } catch (x) { console.error('  (' + x.message + ')'); }
    ok(FC && FC.file === 'faces.md' && IX.DOCS.includes(FC), 'faces.md is a registered doc');
    if (FC) {
      const fx = (edit) => { const f = structuredClone(files); edit(f['casts.json'], f); return f; };
      const fold = existsSync(join(DIR, 'faces.md')) ? readFileSync(join(DIR, 'faces.md'), 'utf8').replace(/\r\n/g, '\n') : null;
      const fresh = FC.render(files, null);
      const casts = files['casts.json'], eraKeys = Object.keys(casts).filter((k) => /^\d+$/.test(k)).sort((a, b) => a - b);
      ok(eraKeys.every((k, i) => fresh.includes('\n## ' + roman(i + 1) + '. Era ' + k + '\n')) && fresh.includes('\n## ' + roman(eraKeys.length + 1) + '. Not in a cast\n'),
         'faces.md has one "## <roman>. Era <n>" section per era of casts.json, then "Not in a cast"');
      const sec = (t, head) => t.split('\n## ').find((s) => s.startsWith(head)) || '';
      const era1 = sec(fresh, 'I. Era 1');
      ok(casts['1'].every((n, i) => era1.includes('\n### ' + letter(i) + '. ' + n + '\n')), 'the era\'s cast, in order, one "### <letter>. <name>" each');
      ok(/### A\. c70bellbottom\n\n- Size : 60x74\n\n- Eyes : [a-z]/.test(fresh), 'each face has its size and its eyes');
      ok(sec(fresh, roman(eraKeys.length + 1) + '. Not in a cast').includes('. smokerbust\n'), 'a face in no cast is listed under Not in a cast');
      const eyesOf = (t, n) => { const m = new RegExp('\\. ' + n + '\\n\\n- Size : \\d+x\\d+\\n\\n- Eyes : (.*)\\n').exec(t); return m && m[1]; };
      ok(eyesOf(fresh, 'smokerbust') === 'detected (2)', 'detected eyes read "detected (2)" (' + eyesOf(fresh, 'smokerbust') + ')');
      const ev = (eyes, byHand) => eyesOf(FC.render(fx((c, f) => { f['faces/c70trucker.json'].eyes = eyes; if (byHand) f['faces/c70trucker.json']._eyesByHand = true; else delete f['faces/c70trucker.json']._eyesByHand; }), fresh), 'c70trucker');
      ok(ev([[1, 1, 3, 2]], true) === 'set by hand (1)' && ev([], false) === 'not set' && ev([], true) === 'none, set by hand',
         'and "set by hand (n)", "not set" or "none, set by hand" (' + [ev([[1, 1, 3, 2]], true), ev([], false), ev([], true)].join(' / ') + ')');
      ok(FC.render(files, fresh) === fresh, 'rendering faces.md is idempotent');
      ok(fold !== null && FC.render(files, fold) === fold, 'the committed faces.md is what today\'s JSON renders to');
      ok(IX.renderAll(files, (f) => f === 'faces.md' ? fresh : null)['faces.md'] === fresh, 'renderAll renders faces.md');

      /* prose: the preamble, an era's note and a note under a face survive, and the face's note follows the face */
      const NOTE = 'MY NOTE ABOUT THE TEACHER.';
      const notes = fresh.replace(/(### [A-Z]\. c70teacher\n)/, '$1\n' + NOTE + '\n');
      ok(notes !== fresh && FC.render(files, notes) === notes, 'a note under a face survives an unchanged render');
      const moved = FC.render(fx((c) => { c['1'] = c['1'].filter((n) => n !== 'c70bellbottom'); c['1'].push('smokerbust'); }), notes);
      const ml = moved.split('\n'), ti = ml.findIndex((l) => /^### [A-Z]\. c70teacher$/.test(l));
      ok(ti > 0 && ml[ti + 2] === NOTE && ml[ti + 4] === '- Size : 60x74', 'when the cast changes, the note stays with its face (' + ml.slice(ti, ti + 5).join(' | ') + ')');
      ok(sec(moved, 'I. Era 1').includes('. smokerbust\n') && !sec(moved, 'I. Era 1').includes('c70bellbottom') && sec(moved, 'IV. Not in a cast').includes('c70bellbottom'),
         'a face cast into an era appears there, and one dropped from every era moves to Not in a cast');
      const pre = fresh.split('\n## I.')[0];
      ok(pre.length > 80 && /^# faces\.md\n\n\S/.test(pre), 'the preamble is a paragraph under the title');
      const custom = FC.render(files, fresh.replace(pre, '# faces.md\n\nMY PREAMBLE.\n'));
      ok(custom.startsWith('# faces.md\n\nMY PREAMBLE.\n'), 'a rewritten preamble is kept');
      if (typeof FC.read === 'function') {
        const want = (f) => { const c = f['casts.json'], o = {}; for (const k of Object.keys(c).filter((k) => /^\d+$/.test(k))) o[k] = c[k]; return o; };
        const cases = { today: files, moved: fx((c) => { c['2'].reverse(); c['3'].push('c70teacher'); }) };
        const badRT = Object.entries(cases).filter(([, f]) => JSON.stringify(FC.read(FC.render(f, fold)).casts) !== JSON.stringify(want(f))).map(([n]) => n);
        const sizes = FC.read(fresh).faces;
        ok(badRT.length === 0 && sizes.c90soap && sizes.c90soap.size === '60x74', 'faces.md round-trips: reading a render back gives the casts and sizes (' + badRT + ')');
      } else ok(false, 'faces.mjs exports read(text)');
    }

    /* menu.md, rendered from today's JSON and from edits to it */
    let MN = null;
    try { MN = (await import('../tools/content/docs/menu.mjs')).default; } catch (x) { console.error('  (' + x.message + ')'); }
    ok(MN && MN.file === 'menu.md' && IX.DOCS.includes(MN), 'menu.md is a registered doc');
    if (MN) {
      const mold = readFileSync(join(DIR, 'menu.md'), 'utf8').replace(/\r\n/g, '\n');
      const mfx = (edit) => { const f = structuredClone(files); edit(f['menus.json'], f); return f; };
      const bare = (hd) => hd.replace(/^[A-Z0-9]+(?:\.\d+)?\.? /, '');
      const at = (text, ...names) => {
        let n = parseMd(text).children.find((c) => c.depth === 1);
        for (const nm of names) n = n && n.children.find((c) => bare(c.heading) === nm);
        return n || { lines: [], children: [] };
      };
      const fields = (n) => n.lines.filter((l) => /^- /.test(l));
      const mout = MN.render(files, mold);
      ok(MN.render(files, mout) === mout, 'rendering menu.md is idempotent');
      const a = mold.split('\n'), b = mout.split('\n');
      const changed = a.map((l, i) => [l, b[i]]).filter(([x, y]) => x !== y);
      ok(a.length === b.length && changed.length > 0 && changed.every(([x, y]) => (/^#{2,4} /.test(x) && /^#{2,4} /.test(y)) || (/^- (Short|Ticket|Ingredient \d|Price)\s*:/.test(x) && /^- (Short|Ticket|Ingredient \d|Price) : /.test(y))),
         'from today\'s JSON only headings and value lines change, line for line (' + JSON.stringify(changed.filter(([x, y]) => !(/^#/.test(x) || /^- (Short|Ticket|Ingredient|Price)/.test(x))).slice(0, 4)) + ')');
      const eras = parseMd(mout).children[0].children.filter((c) => /^Era \d$/.test(bare(c.heading)));
      ok(eras.length === 3 && eras.every((e) => e.children.map((c) => c.heading).join('|') === 'A. Bins|A.1 Base Stations|B. Items'),
         'every era keeps A. Bins, A.1 Base Stations and B. Items, in that order');
      const e1 = at(mout, 'Era 1');
      ok(at(mout, 'Era 1', 'Bins').children.map((c) => c.heading).join('|') === '1. GROUND BEEF|2. REFRIED BEANS|3. LETTUCE|4. TOMATOES|5. ONIONS (green onions)|6. CHILI CON QUESO (CCQ)|7. JALAPENOS|8. SOUR CREAM|9. CHEESE (shredded)|10. [EMPTY]|11. [EMPTY]|12. [EMPTY]',
         'Era 1 lists all twelve bins by their JSON names, with the bracketed notes from the doc, [EMPTY] for none (' + at(mout, 'Era 1', 'Bins').children.map((c) => c.heading).join('|') + ')');
      /* the ruling: a bracketed qualifier is a note, kept verbatim, and none is lost */
      const brackets = (s) => s.split('\n').filter((l) => /^(#{2,4} |- (Short|Ticket|Ingredient \d+|Price)\s*:).* \(/.test(l)).map((l) => l.slice(l.indexOf(' (')));
      ok(JSON.stringify(brackets(mout)) === JSON.stringify(brackets(mold)) && brackets(mold).length === 7,
         'every bracketed note on a heading or value line survives regeneration (' + JSON.stringify(brackets(mout)) + ')');
      ok(at(mout, 'Era 2', 'Bins').children.map((c) => c.heading).join('|') === '10. TACO SHOP SAUCE (Sauce)|11. HOUSE CHILI (Chili)|12. [EMPTY]'
         && at(mout, 'Era 3', 'Bins').children.map((c) => c.heading).join('|') === '12. GRILLED CHICKEN (Chicken)',
         'a later era lists only the slots the era before left empty');
      ok(at(mout, 'Era 1', 'Base Stations').children.map((c) => c.heading).join('|') === 'Left. SMALL TORTILLA, TACO SHELL, LARGE TORTILLA (stacked, top to bottom)|Right. CHIPS',
         'the base stations follow the JSON, the "(stacked, top to bottom)" note kept');
      const ht = at(mout, 'Era 1', 'Items').children[0];
      ok(ht.heading === '1. HARD TACO' && fields(ht).join('|') === '- Short : HD TACO|- Ingredient 0 : TACO SHELL|- Ingredient 1 : GROUND BEEF|- Ingredient 2 : LETTUCE|- Ingredient 3 : CHEESE|- Price : 0.29',
         'an item reads Short, the ingredients by their bin names, and the price in dollars (' + JSON.stringify(fields(ht)) + ')');
      const sizing = ['**Short** is the name the kitchen\'s NOW BUILDING readout shows. The full name is too wide',
        'the step count: `12 x chars + 9 x steps <= 127`, which allows 8 characters at 3 steps,'];
      const notesIV = mold.slice(mold.indexOf('## IV. Notes for every era'));
      const proseOf = (src) => src.split('\n').filter((l) => l.trim() && !/^#/.test(l) && !/^- (Short|Ticket|Ingredient \d|Price)\s*:/.test(l));
      const lost = (src, o) => { const p = proseOf(src); let j = 0; for (const l of o.split('\n')) if (j < p.length && l === p[j]) j++; return j === p.length ? null : p[j]; };

      /* the brief: an item added to Era 1 */
      const add = mfx((m) => m['1'].items.push({ name: 'TEST TACO', ticket: 'TEST TACO', short: 'TST', price: 135, recipe: ['SHELL', 'BEEF', 'CHEESE'] }));
      const ma = MN.render(add, mold), n10 = at(ma, 'Era 1', 'Items').children[9];
      ok(n10 && n10.heading === '10. TEST TACO' && n10.depth === 4
         && fields(n10).join('|') === '- Short : TST|- Ingredient 0 : TACO SHELL|- Ingredient 1 : GROUND BEEF|- Ingredient 2 : CHEESE|- Price : 1.35',
         'adding an item to Era 1 adds "#### 10. TEST TACO" with its fields (' + JSON.stringify(n10 && [n10.heading, fields(n10)]) + ')');
      ok(ma.includes('\n#### 10. TEST TACO\n\n- Short : TST\n\n') && ma.includes('- Price : 1.35\n\n## II. Era 2'), 'blank-separated, and just before Era 2');
      ok(sizing.every((l) => ma.split('\n').includes(l)) && lost(mold, ma) === null && ma.endsWith(notesIV),
         'the sizing note survives, as does every prose line, and the Notes section is byte-identical (' + lost(mold, ma) + ')');
      ok(MN.render(add, ma) === ma, 'and that render is idempotent');

      /* an item removed: nodes follow their item by name, so a note stays with its dish */
      const rm = mfx((m) => m['2'].items.shift()), mr = MN.render(rm, mold), it2 = at(mr, 'Era 2', 'Items').children;
      const bn = it2.find((c) => bare(c.heading) === 'BEEF NACHO SUPREME');
      ok(it2.length === 12 && it2[0].heading === '1. SOFT TACO' && bn && bn.heading === '12. BEEF NACHO SUPREME'
         && bn.lines.some((l) => l.startsWith('- Dropped : Monterey Jack and olives (no bin)')) && !it2.slice(0, 11).some((c) => c.lines.some((l) => /Dropped/.test(l))),
         'removing Era 2\'s first item renumbers the rest, and the Dropped note stays on Beef Nacho Supreme');
      const sw = mfx((m) => { const x = m['3'].items; [x[9], x[10]] = [x[10], x[9]]; }), ms = at(MN.render(sw, mold), 'Era 3', 'Items').children;
      ok(ms[9].heading === '10. CHICKEN ENCHILADA SUPREME' && ms[10].heading === '11. CHICKEN ENCHILADA'
         && ms[9].lines.includes('- Dropped : Monterey Jack (no bin)') && ms[10].lines.includes('- Dropped : Monterey Jack (no bin)'),
         'reordering items moves their nodes, notes and all');

      /* recipes that shrink and grow, prices and shorts */
      const rc = mfx((m) => { m['1'].items[1].recipe = ['SHELL', 'BEEF', 'CHEESE']; m['1'].items[0].recipe.push('ONION', 'TOMATO'); m['1'].items[0].price = 35; m['1'].items[0].short = 'HTACO'; });
      const mrc = MN.render(rc, mold), r0 = at(mrc, 'Era 1', 'Items').children[0], r1 = at(mrc, 'Era 1', 'Items').children[1];
      ok(fields(r1).join('|') === '- Short : HTSUP|- Ingredient 0 : TACO SHELL|- Ingredient 1 : GROUND BEEF|- Ingredient 2 : CHEESE|- Price : 0.39'
         && fields(r0).join('|') === '- Short : HTACO|- Ingredient 0 : TACO SHELL|- Ingredient 1 : GROUND BEEF|- Ingredient 2 : LETTUCE|- Ingredient 3 : CHEESE|- Ingredient 4 : ONIONS|- Ingredient 5 : TOMATOES|- Price : 0.35',
         'a shorter recipe drops its spare Ingredient lines; a longer one adds them before the price (' + JSON.stringify([fields(r0), fields(r1)]) + ')');
      ok(!/\n\n\n/.test(mrc) && lost(mold, mrc) === null && MN.render(rc, mrc) === mrc, 'with no doubled blank lines, no prose lost, idempotently');
      const e2t = mfx((m) => { m['2'].items[5].ticket = 'MEAT ENCHI'; }), te = at(MN.render(e2t, mold), 'Era 2', 'Items').children[5];
      ok(te.lines.includes('- Ticket : MEAT ENCHI') && te.lines.indexOf('- Ticket : MEAT ENCHI') === te.lines.indexOf('- Short : MT ENCH') + 2,
         'Era 2\'s Ticket line follows the JSON, in place');
      ok(!fields(e1.children[2].children[0]).some((l) => /Ticket/.test(l)), 'Era 1 items, which never listed a Ticket, are not given one');

      /* bins */
      const bins = mfx((m) => { m['1'].bins[0].name = 'MINCED BEEF'; m['2'].bins[11] = { key: 'OLIVES', name: 'OLIVES', plate: 'OLIVES' }; });
      const mbn = MN.render(bins, mold);
      ok(at(mbn, 'Era 1', 'Bins').children[0].heading === '1. MINCED BEEF' && at(mbn, 'Era 1', 'Items').children[0].lines.includes('- Ingredient 1 : MINCED BEEF')
         && at(mbn, 'Era 2', 'Bins').children.map((c) => c.heading).join('|') === '10. TACO SHOP SAUCE (Sauce)|11. HOUSE CHILI (Chili)|12. OLIVES',
         'a renamed bin renames its heading and the ingredient lines that use it; a filled slot shows its name');
      ok(lost(mold, mbn) === null, 'and no prose is lost (' + lost(mold, mbn) + ')');
      const ren = MN.render(mfx((m) => { m['1'].bins[4].name = 'SCALLIONS'; m['2'].bins[9].name = 'HOT SAUCE'; }), mold);
      ok(at(ren, 'Era 1', 'Bins').children[4].heading === '5. SCALLIONS (green onions)' && at(ren, 'Era 2', 'Bins').children[0].heading === '10. HOT SAUCE (Sauce)',
         'a JSON rename keeps the bracketed note on the renamed line (' + at(ren, 'Era 1', 'Bins').children[4].heading + ')');
      ok(MN.render(mfx((m) => { m['1'].bins[4].name = 'SCALLIONS'; m['2'].bins[9].name = 'HOT SAUCE'; }), ren) === ren, 'and that render is idempotent');
      /* a note on an ingredient line, and on an item heading, follows that ingredient and that dish */
      const noted = mold.replace('- Ingredient 2 : Jalapenos\n', '- Ingredient 2 : Jalapenos (pickled)\n').replace('#### 9. Nachos\n', '#### 9. Nachos (the 1970s plate)\n');
      ok(noted !== mold && noted.split('(pickled)').length === 2 && noted.includes('Nachos (the 1970s plate)'), 'the noted doc has both notes, once');
      const nn = (o) => at(o, 'Era 1', 'Items').children;
      const n1 = MN.render(files, noted), n9 = nn(n1)[8];
      ok(n9.heading === '9. NACHOS (the 1970s plate)' && n9.lines.includes('- Ingredient 2 : JALAPENOS (pickled)'), 'notes on an item heading and an ingredient line survive (' + n9.heading + ')');
      const swp = MN.render(mfx((m) => { const r = m['1'].items[8].recipe; [r[1], r[2]] = [r[2], r[1]]; m['1'].items.unshift(m['1'].items.pop()); }), noted), s0 = nn(swp)[0];
      ok(s0.heading === '1. NACHOS (the 1970s plate)' && s0.lines.includes('- Ingredient 1 : JALAPENOS (pickled)') && s0.lines.includes('- Ingredient 2 : CHILI CON QUESO'),
         'and move with the dish and the ingredient when the menu and the recipe are reordered (' + JSON.stringify(fields(s0)) + ')');

      const mfresh = MN.render(files, null);
      ok(['## I. Era 1', '### A. Bins', '### A.1 Base Stations', '### B. Items', '#### 15. QUESO MELT', '## III. Era 3'].every((s) => mfresh.includes('\n' + s + '\n'))
         && MN.render(files, mfresh) === mfresh, 'menu.md renders from nothing, idempotently');
      ok(IX.renderAll(files, (f) => f === 'menu.md' ? mold : null)['menu.md'] === mout, 'renderAll renders menu.md');
    }

    /* music.md: per year, the Delivery and Kitchen Shift lists; the title list; the rules as prose */
    let MU = null;
    try { MU = (await import('../tools/content/docs/music.mjs')).default; } catch (x) { console.error('  (' + x.message + ')'); }
    ok(MU && MU.file === 'music.md' && IX.DOCS.includes(MU), 'music.md is a registered doc');
    if (MU) {
      const uold = readFileSync(join(DIR, 'music.md'), 'utf8').replace(/\r\n/g, '\n');
      const PLR = 'music/playlist.json';
      const ufx = (edit) => { const f = structuredClone(files); edit(f[PLR], f); return f; };
      const songsOf = (f) => Object.fromEntries(Object.entries(f).filter(([r]) => /^music\/[^/]+\.json$/.test(r) && r !== PLR).map(([r, s]) => [r.slice(6, -5), s]));
      const lists = (f) => Object.fromEntries(Object.entries(f[PLR]).filter(([k]) => !k.startsWith('_')));
      const bareH = (hd) => hd.replace(/^[A-Z0-9]+\. /, '');
      const at = (text, ...names) => {
        let n = parseMd(text).children.find((c) => c.depth === 1);
        for (const nm of names) n = n && n.children.find((c) => bareH(c.heading) === nm);
        return n || { lines: [], children: [] };
      };
      const SONG = /^\d+\. .+ - .+ \(\d+\)$/, LVL = /^Level \d+, (Summer|Winter) \d{4}\.$/;
      const songs = (n) => n.lines.filter((l) => SONG.test(l));
      const proseOf = (src) => src.split('\n').filter((l) => l.trim() && !/^#/.test(l) && !SONG.test(l) && !LVL.test(l));
      const lost = (src, o) => { const p = proseOf(src); let j = 0; for (const l of o.split('\n')) if (j < p.length && l === p[j]) j++; return j === p.length ? null : p[j]; };

      const uout = MU.render(files, uold);
      ok(MU.render(files, uout) === uout, 'rendering music.md is idempotent');
      const a = uold.split('\n'), b = uout.split('\n');
      const changed = a.map((l, i) => [l, b[i]]).filter(([x, y]) => x !== y);
      const headChanges = changed.filter(([x]) => !SONG.test(x));
      ok(a.length === b.length && changed.length > 0 && changed.every(([x, y]) => (/^### [A-Z]\. Driving Shift$/.test(x) && y === x.replace('Driving Shift', 'Delivery Shift'))
         || (SONG.test(x) && SONG.test(y) && x.toUpperCase() === y.toUpperCase())),
         'from today\'s JSON only song lines (in case) and the "Driving Shift" headings (to "Delivery Shift") change, line for line (' + JSON.stringify(headChanges) + ')');
      const drivingHeads = (t) => t.split('\n').filter((l) => /^#+ .*Driving Shift/.test(l)).length;
      ok(headChanges.length === drivingHeads(uold) && drivingHeads(uold) > 0 && drivingHeads(uout) === 0
         && uout.split('\n').filter((l) => /^### [A-Z]\. Delivery Shift$/.test(l)).length === 10 && uout.includes('\nDriving Shift songs are intended to be more upbeat'),
         'every "Driving Shift" heading becomes "Delivery Shift", the "Delivery Shift" ones are left alone, and the preamble\'s own "Driving Shift songs" is prose, kept (' + headChanges.length + ' changed)');
      /* the heading names the level's game type, exactly: Delivery Shift or Kitchen Shift */
      const shiftHeads = parseMd(uout).children[0].children.flatMap((y) => y.children).map((c) => {
        const n = Number((c.lines.map((l) => /^Level (\d+), /.exec(l)).find(Boolean) || [])[1]);
        const lv = files['levels.json'].levels.find((l) => l.n === n);
        return [c.heading.replace(/^[A-Z]\. /, ''), lv ? (lv.type === 'kitchen' ? 'Kitchen Shift' : 'Delivery Shift') : null];
      });
      ok(shiftHeads.length === 20 && shiftHeads.every(([got, want]) => got === want),
         'a delivery level\'s heading is exactly "Delivery Shift" and a kitchen level\'s exactly "Kitchen Shift" (' + JSON.stringify(shiftHeads.filter(([g, w]) => g !== w)) + ')');
      const pn = proseOf(uold).length;
      ok(pn >= 4 && lost(uold, uout) === null && uout.startsWith(uold.slice(0, uold.indexOf('## I. 1972'))), 'all ' + pn + ' prose lines survive in order, the preamble byte for byte (' + lost(uold, uout) + ')');
      const top = parseMd(uout).children[0].children.map((c) => c.heading);
      const years = [...new Set(files['levels.json'].levels.map((l) => l.year))];
      ok(top.join('|') === [...years.map((y, i) => roman(i + 1) + '. ' + y), roman(years.length + 1) + '. Title Screen'].join('|'),
         'one "## <roman>. <year>" per year, then the title section where the doc keeps it (' + top.join('|') + ')');
      ok(parseMd(uout).children[0].children.slice(0, years.length).every((y) => y.children.map((c) => c.heading).join('|') === 'A. Delivery Shift|B. Kitchen Shift'),
         'every year has A. Delivery Shift and B. Kitchen Shift');
      const d1 = at(uout, '1972', 'Delivery Shift');
      ok(d1.lines.includes('Level 1, Summer 1972.') && songs(d1).join('|') === '1. IMMIGRANT SONG - LED ZEPPELIN (1970)|2. BLACK DOG - LED ZEPPELIN (1971)',
         'a shift lists its Level line and its songs as TITLE - ARTIST (year), in the JSON\'s form (' + JSON.stringify(songs(d1)) + ')');
      ok(songs(at(uout, '1975', 'Delivery Shift')).join('|') === '1. BOHEMIAN RHAPSODY (the opera section) - QUEEN (1975)|2. BOHEMIAN RHAPSODY (the hard-rock section) - QUEEN (1975)',
         'a bracketed note after a title is kept');
      const tt = at(uout, 'Title Screen');
      ok(songs(tt).join('|') === "1. ONE STEP BEYOND - MADNESS (1979)|2. REELIN' IN THE YEARS - STEELY DAN (1972)" && tt.lines.some((l) => /^The title songs play/.test(l)),
         'the title section lists its songs after its note');

      /* the brief: a level with 3 songs renders 3 numbered lines */
      const three = ufx((p) => { p['1'] = ['immigrant-song', 'black-dog', 'walk-on-the-wild-side']; });
      const u3 = MU.render(three, uold), t3 = at(u3, '1972', 'Delivery Shift');
      ok(songs(t3).join('|') === '1. IMMIGRANT SONG - LED ZEPPELIN (1970)|2. BLACK DOG - LED ZEPPELIN (1971)|3. WALK ON THE WILD SIDE - LOU REED (1972)'
         && u3.includes('\n2. BLACK DOG - LED ZEPPELIN (1971)\n\n3. WALK ON THE WILD SIDE - LOU REED (1972)\n\n### B. Kitchen Shift\n'),
         'a level with 3 songs renders 3 numbered lines, blank-separated (' + JSON.stringify(songs(t3)) + ')');
      ok(lost(uold, u3) === null && !/\n\n\n/.test(u3) && MU.render(three, u3) === u3, 'with no prose lost and no doubled blank line, idempotently');
      const one = ufx((p) => { p['1'] = ['black-dog']; p.title = ['reelin-in-the-years']; });
      const u1 = MU.render(one, u3);
      ok(songs(at(u1, '1972', 'Delivery Shift')).join('|') === '1. BLACK DOG - LED ZEPPELIN (1971)' && songs(at(u1, 'Title Screen')).join('|') === "1. REELIN' IN THE YEARS - STEELY DAN (1972)"
         && lost(uold, u1) === null && !/\n\n\n/.test(u1) && MU.render(one, u1) === u1, 'shrunk to one song each, the lists follow, the prose stays');
      /* a year that changes keeps the prose under it */
      const noted = uold.replace('## I. 1972\n\n### A.', '## I. 1972\n\nThe first year.\n\n### A.');
      const yr = ufx((p, f) => { f['levels.json'].levels[0].year = 1973; f['levels.json'].levels[1].year = 1973; });
      const uy = MU.render(yr, noted);
      ok(at(uy, '1973').lines.includes('The first year.') && at(uy, '1973', 'Delivery Shift').lines.includes('Level 1, Summer 1973.') && !uy.includes('## I. 1972'),
         'a level year that changes renames its section and keeps its prose');
      /* a note under a song list stays with it */
      const n2 = uold.replace('2. Black Dog - Led Zeppelin (1971)\n', '2. Black Dog - Led Zeppelin (1971)\n\nBoth from the band\'s first run.\n');
      const un = MU.render(three, n2);
      ok(lost(n2, un) === null && at(un, '1972', 'Delivery Shift').lines.includes('Both from the band\'s first run.'), 'prose between songs is kept in its section');

      /* round trip: reading a render back gives the playlists */
      const rt = (f, prev) => { const t = MU.render(f, prev); return typeof MU.read === 'function' && JSON.stringify(MU.read(t, songsOf(f))) === JSON.stringify(lists(f)); };
      const fresh = MU.render(files, null);
      ok(rt(files, uold) && rt(three, uold) && rt(one, u3) && rt(files, null), 'music.md round-trips: reading a render back gives every list, in order');
      ok(parseMd(fresh).children[0].children[0].heading === 'I. Title Screen' && parseMd(fresh).children[0].children[1].heading === 'II. 1972'
         && MU.render(files, fresh) === fresh, 'from nothing the title section comes first, then the years, idempotently');
      ok(IX.renderAll(files, (f) => f === 'music.md' ? uold : null)['music.md'] === uout, 'renderAll renders music.md');
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

console.log('\n— difficulty panel —');
{
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
    store.files['difficulty.json'].medium.tipDecay = 30; ctl('medium', 'tipDecay')._show();
    const m30 = ctl('medium', 'tipDecay').value;
    type(ctl('medium', 'tipDecay'), m30);
    ok(m30 === '3.33' && store.get('difficulty.json', 'medium.tipDecay') === 30, 'a rate shown rounded (30 c/s as 3.33) is kept, not re-stored as 30.03, when its shown text is entered');
    store.files['difficulty.json'].medium.tipDecay = 40; ctl('medium', 'tipDecay')._show();
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

console.log('\n— attract panel —');
{
  const { store } = await import('../admin/store.js');
  const FL = await import('../admin/fields.js');
  const realApply = globalThis.Admin.applyBuilt;
  globalThis.Admin.applyBuilt = () => {};
  store.files = structuredClone(files); store.dirty.clear(); store.error = null;
  let loaded = true;
  try { await import('../admin/panels/attract.js'); } catch (x) { loaded = false; console.error('  (' + x.message + ')'); }
  const tab = FL.tabs.get('attract');
  ok(loaded && tab && tab.title === 'Attract', 'the Attract panel registers its tab');
  ok(/import '\.\/panels\/attract\.js'/.test(readFileSync('admin/overlay.js', 'utf8')), 'the overlay imports the Attract panel');
  if (tab) {
    const calls = [];
    globalThis.G = { toTitle: () => calls.push('title'), toWinners: () => calls.push('winners'), toScores: (f) => calls.push('scores:' + !!f), toDemo: (n) => calls.push('demo:' + (n || '')) };
    try {
      const doc = fakeDoc(), el = doc.createElement('div');
      doc.body.appendChild(el);
      tab.render(el);
      const nodes = () => el.walk();
      const ctl = (rel, p) => nodes().find((n) => n.dataset.rel === rel && n.dataset.path === p);
      const screens = nodes().filter((n) => n.dataset.screen).map((n) => n.dataset.screen);
      ok(screens.join() === 'title,winners,scores,demo', 'the four screens, in loop order (' + screens.join() + ')');
      ok(['title', 'winners', 'scores', 'demo'].every((s) => ctl('attract.json', s + '.seconds') && ctl('attract.json', s + '.seconds').dataset.kind === 'seconds')
         && ctl('attract.json', 'title.wordmarkHold').dataset.kind === 'seconds', 'each screen has its seconds, and the title its wordmark hold');
      const total = () => (nodes().find((n) => n.dataset.cycle) || {}).textContent || '';
      ok(/1:20/.test(total()), 'the cycle total reads 1:20 (' + total() + ')');
      const type = (c, v) => { c.value = v; c.fire('input'); FL.paint(); };
      type(ctl('attract.json', 'winners.seconds'), '12');
      ok(store.get('attract.json', 'winners.seconds') === 12 && /1:22/.test(total()), 'an edit stores seconds and the total follows live (' + total() + ')');
      type(ctl('attract.json', 'winners.seconds'), '2');
      ok(store.error && store.error.path.join('.') === 'winners.seconds' && ctl('attract.json', 'winners.seconds').classList.contains('adm-bad'), '2s is refused on its field');
      type(ctl('attract.json', 'winners.seconds'), '10');
      type(ctl('attract.json', 'title.wordmarkHold'), '14');
      ok(store.error && store.error.path.join('.') === 'title.wordmarkHold', 'a hold past seconds - 2 is refused on the hold');
      type(ctl('attract.json', 'title.wordmarkHold'), '1');
      ok(store.error === null, 'and putting it back clears it');

      const slog = ctl('winners.json', 'slogan'), attr = ctl('winners.json', 'attribution'), cred = ctl('winners.json', 'credit');
      ok(slog && slog.tagName === 'TEXTAREA' && attr && attr.tagName === 'TEXTAREA' && cred && cred.tagName === 'INPUT', 'slogan and attribution are textareas, credit a line');
      ok(slog.value === '"WINNERS DON\'T USE DRUGS.\nTHEY DRINK."', 'the slogan shows one line per row (' + JSON.stringify(slog.value) + ')');
      type(slog, 'winners don\'t\nuse drugs');
      ok(JSON.stringify(store.get('winners.json', 'slogan')) === '["winners don\'t","use drugs"]' && store.error === null, 'two rows store two lines; lowercase is accepted');
      type(slog, 'WINNERS DON’T');
      ok(store.error && store.error.path.join('.') === 'slogan' && /’/.test(slog._msg.textContent) && slog.classList.contains('adm-bad'),
         'a curly apostrophe is refused on the slogan, naming ’ (' + slog._msg.textContent + ')');
      type(slog, '"WINNERS DON\'T USE DRUGS.\nTHEY DRINK."\n');
      ok(JSON.stringify(store.get('winners.json', 'slogan')) === JSON.stringify(files['winners.json'].slogan) && store.error === null, 'a trailing empty row is not a line');
      type(attr, 'ONE LINE');
      ok(JSON.stringify(store.get('winners.json', 'attribution')) === '["ONE LINE"]', 'an attribution stored as a list stays a list');
      type(attr, files['winners.json'].attribution.join('\n'));

      const rows = nodes().filter((n) => n.dataset.rel === 'scores.json');
      ok(rows.length === 20 && Array.from({ length: 10 }, (_, i) => ctl('scores.json', 'board.' + i + '.ini') && ctl('scores.json', 'board.' + i + '.cents').dataset.kind === 'money').every(Boolean),
         'the factory board: 10 rows of initials and money');
      ok(ctl('scores.json', 'board.0.cents').value === '4800.00' && ctl('scores.json', 'board.0.ini').value === 'MJS', 'the board shows dollars');
      type(ctl('scores.json', 'board.1.cents'), '5000');
      ok(store.error && store.error.path.join('.') === 'board.1.cents', 'an unsorted board is refused on the row that breaks it');
      type(ctl('scores.json', 'board.1.cents'), '3950');

      const rnd = nodes().find((n) => n.dataset.demo === 'random');
      const lv = (k) => nodes().find((n) => n.dataset.demo === String(k));
      const tick = (c, on) => { c.checked = on; c.fire('change'); FL.paint(); };
      ok(rnd && rnd.checked && lv(1) && lv(20) && !lv(21), 'demo: Random is ticked, with a box per level 1..20');
      tick(rnd, false);
      ok(JSON.stringify(store.get('attract.json', 'demo.levels')) === JSON.stringify(Array.from({ length: 20 }, (_, i) => i + 1)), 'unticking Random starts from every level');
      tick(lv(1), false); tick(lv(7), false);
      ok(!store.get('attract.json', 'demo.levels').includes(1) && store.get('attract.json', 'demo.levels').length === 18, 'unticking levels removes them');
      for (let k = 1; k <= 20; k++) if (lv(k).checked) tick(lv(k), false);
      const grp = nodes().find((n) => n.dataset.rel === 'attract.json' && n.dataset.path === 'demo.levels');
      ok(store.error && store.error.path.join('.') === 'demo.levels' && grp && grp.classList.contains('adm-bad'), 'no level at all is refused, on the level set');
      tick(lv(4), true);
      ok(JSON.stringify(store.get('attract.json', 'demo.levels')) === '[4]' && store.error === null, 'one level is a set of one');
      tick(rnd, true);
      ok(store.get('attract.json', 'demo.levels') === 'random', 'ticking Random stores "random"');

      const show = nodes().filter((n) => n.dataset.show);
      show.forEach((b) => b.fire('click'));
      ok(calls.join() === 'title,winners,scores:false,demo:', '"Show it" puts the game on each screen (' + calls.join() + ')');
      ok(JSON.stringify(store.files['attract.json']) === JSON.stringify(files['attract.json']) && JSON.stringify(store.files['winners.json']) === JSON.stringify(files['winners.json'])
         && JSON.stringify(store.files['scores.json']) === JSON.stringify(files['scores.json']), 'every edit was put back');
    } finally { delete globalThis.G; }
  }
  store.dirty.clear(); store.error = null;
  globalThis.Admin.applyBuilt = realApply;

  /* the refreshers, in the game: attract restarts an attract screen; scores reloads the board */
  const A = SB.Admin, { G, Scores } = SB.__x;
  const fx = (edit) => { const f = structuredClone(files); edit(f); return validateContent(memSource(f)); };
  G.toWinners(); G.attractT = 3;
  A.applyBuilt(fx((f) => { f['attract.json'].winners.seconds = 12; }), G);
  ok(G.state === 'winners' && G.attractT === 12, 'an attract edit on the winners card restarts it with the new duration (' + G.attractT + ')');
  G.toScores(true); G.scoreIdx = 2;
  A.applyBuilt(fx((f) => { f['attract.json'].winners.seconds = 11; }), G);
  ok(G.state === 'scores' && G.scoresFromShift && G.scoreIdx === 2, 'the post-run board is not an attract screen, and is left alone');
  A.applyBuilt(fx((f) => { f['scores.json'].board[0].ini = 'ZZZ'; }), G);
  ok(Scores.board[0].ini === 'ZZZ', 'a factory board edit reloads Scores');
  G.startRun(1); G.beginShift();
  for (let i = 0; i < 10; i++) G.update(1 / 60);
  A.applyBuilt(fx((f) => { f['attract.json'].title.seconds = 20; }), G);
  ok(G.state === 'play', 'an attract edit during a shift leaves the shift alone');
  A.applyBuilt(validateContent(memSource(files)), G);
  ok(Scores.board[0].ini === files['scores.json'].board[0].ini, 'put back');
  G.toTitle();
}

console.log('\n— dialogue panel —');
{
  const { store } = await import('../admin/store.js');
  const FL = await import('../admin/fields.js');
  const { DLG_KEYS } = await import('../tools/content/validate.mjs');
  const realApply = globalThis.Admin.applyBuilt;
  globalThis.Admin.applyBuilt = () => {};
  store.files = structuredClone(files); store.dirty.clear(); store.error = null;
  let loaded = true;
  try { await import('../admin/panels/dialogue.js'); } catch (x) { loaded = false; console.error('  (' + x.message + ')'); }
  const tab = FL.tabs.get('dialogue');
  ok(loaded && tab && tab.title === 'Dialogue', 'the Dialogue panel registers its tab');
  ok(/import '\.\/panels\/dialogue\.js'/.test(readFileSync('admin/overlay.js', 'utf8')), 'the overlay imports the Dialogue panel');
  if (tab) {
    try {
      const doc = fakeDoc(), el = doc.createElement('div');
      doc.body.appendChild(el);
      tab.render(el);
      const nodes = () => el.walk();
      const ctl = (p) => nodes().find((n) => n.dataset.rel === 'dialogue.json' && n.dataset.path === p);
      const act = (a, key, i) => nodes().find((n) => n.dataset.act === a && n.dataset.key === key && (i === undefined || n.dataset.i === String(i)));
      const type = (c, v) => { c.value = v; c.fire('input'); FL.paint(); };
      const D = () => store.files['dialogue.json'];
      const secs = nodes().filter((n) => n.dataset.section !== undefined).map((n) => n.dataset.section);
      ok(secs.join() === DLG_KEYS.join(), 'one section per key of DLG_KEYS, in order (' + secs.join() + ')');
      ok(ctl('who') && ctl('who').dataset.kind === 'text' && !ctl('who.0'), 'who is a single text field');
      ok(DLG_KEYS.filter((k) => k !== 'who').every((k) => D()[k].every((_, i) => ctl(k + '.' + i))), 'every other line has its own field, bound at [key, index]');

      /* era dropdown: All eras / 1980s on / 1990s on, stored as no prefix, 2| or 3| */
      const era = (k, i) => nodes().find((n) => n.tagName === 'SELECT' && n.dataset.era === k + '.' + i);
      const labels = era('late', 8).kids.map((o) => o.textContent).join();
      ok(labels === 'All eras,1980s on,1990s on', 'the era dropdown offers All eras / 1980s on / 1990s on (' + labels + ')');
      ok(era('late', 8).value === '1' && era('arrive', 10).value === '2' && era('late', 0).value === '0', 'it shows each line\'s floor');
      ok(ctl('late.8').value === 'TIME IS MONEY, TACO BOY!', 'the text field shows the line without its prefix');
      era('late', 0).value = '1'; era('late', 0).fire('change');
      ok(D().late[0] === '2|IN MY DAY A TACO TOOK 30 SECONDS!', 'choosing 1980s on stores "2|" before the line');
      era('late', 0).value = '0'; era('late', 0).fire('change');
      ok(D().late[0] === 'IN MY DAY A TACO TOOK 30 SECONDS!', 'All eras removes it');
      type(ctl('late.8'), 'TIME IS PRECIOUS, TACO BOY!');
      ok(D().late[8] === '2|TIME IS PRECIOUS, TACO BOY!', 'editing the text keeps the era floor');
      type(ctl('late.8'), 'TIME IS MONEY, TACO BOY!');

      /* lowercase is accepted and stored as drawn; a curly quote is still named */
      type(ctl('late.8'), 'time is money, taco boy!');
      ok(D().late[8] === '2|TIME IS MONEY, TACO BOY!' && store.error === null, 'typed lowercase is stored upper case with the era prefix kept');
      type(ctl('who'), 'patron');
      ok(D().who === 'PATRON' && store.error === null, 'who is upper-cased too');
      type(ctl('who'), 'CUSTOMER');
      type(ctl('late.8'), 'TIME IS MONEY, TACO BOY’S!');
      ok(store.error && store.error.path.join() === 'late,8' && /’/.test(store.error.message) && ctl('late.8').classList.contains('adm-bad'), 'a curly quote is still flagged by name on its field (' + (store.error && store.error.message.slice(0, 80)) + ')');
      type(ctl('late.8'), 'TIME IS MONEY, TACO BOY!');
      /* the width check is the validator's */
      type(ctl('missed.1'), 'THIS LINE IS FAR TOO WIDE FOR THE SPEECH BUBBLE BESIDE THE PORTRAIT');
      ok(store.error && store.error.path.join() === 'missed,1' && ctl('missed.1').classList.contains('adm-bad') && /Trim \d+ character/.test(ctl('missed.1')._msg.textContent),
         'an over-wide line is flagged on its field with the validator\'s message and how much to trim');
      const ctr = nodes().find((n) => n.dataset.count === 'missed.1');
      ok(ctr && /^\d+\/34$/.test(ctr.textContent), 'the field carries a live character count against the cap (' + (ctr && ctr.textContent) + ')');
      type(ctl('missed.1'), 'IN THE BUSHES. VERY CLASSY.');
      ok(store.error === null && !ctl('missed.1').classList.contains('adm-bad'), 'shortened, the flag clears');

      /* add and remove */
      const n0 = D().queue.length;
      act('add', 'queue').fire('click');
      ok(D().queue.length === n0 + 1 && D().queue[n0] === '' && ctl('queue.' + n0), 'Add line appends an empty line and its field');
      ok(store.error && store.error.path.join() === 'queue,' + n0, 'an empty line is the validator\'s to refuse, on that field');
      type(ctl('queue.' + n0), 'STACKED UP LIKE HAY BALES!');
      ok(store.error === null && D().queue[n0] === 'STACKED UP LIKE HAY BALES!', 'typed into, it validates');
      act('remove', 'queue', n0).fire('click');
      ok(D().queue.length === n0 && !ctl('queue.' + n0), 'Remove drops the line');
      ok(JSON.stringify(D().queue) === JSON.stringify(files['dialogue.json'].queue), 'the pool is back as it was');

      /* Say it: pins a line, goes through G.react, and puts everything back */
      const said = [], pool = { late: ['KEEP'] };
      globalThis.G = { state: 'title', era: 1, react(kind) { said.push([kind, this.state, this.era, JSON.stringify(globalThis.DIALOGUE[kind])]); } };
      globalThis.DIALOGUE = pool;
      act('say', 'late', 8).fire('click');
      ok(said.length === 1 && said[0][0] === 'late' && said[0][1] === 'play' && said[0][2] === 2 && said[0][3] === '["2|TIME IS MONEY, TACO BOY!"]',
         'Say it on a 1980s line runs G.react with that line pinned, in play, in era 2 (' + JSON.stringify(said[0]) + ')');
      ok(G.state === 'title' && G.era === 1 && pool.late.join() === 'KEEP', 'and the state, era and pool are restored afterwards');
      globalThis.G.react = () => { throw new Error('boom'); };
      try { act('say', 'late', 8).fire('click'); } catch (e) { /* the panel may let it out */ }
      ok(G.state === 'title' && G.era === 1 && pool.late.join() === 'KEEP', 'even if react throws, nothing is left changed');
      delete globalThis.G; delete globalThis.DIALOGUE;
      let threw = null;
      try { act('say', 'late', 0).fire('click'); } catch (x) { threw = x; }
      ok(!threw && !act('say', 'who'), 'with no game, Say it is harmless; who has no Say it');
    } finally { delete globalThis.G; delete globalThis.DIALOGUE; }
  }
  store.files = structuredClone(files); store.dirty.clear(); store.error = null;
  globalThis.Admin.applyBuilt = realApply;
}

console.log('\n— faces panel —');
{
  const { store } = await import('../admin/store.js');
  const FL = await import('../admin/fields.js');
  const realApply = globalThis.Admin.applyBuilt, realFetch = globalThis.fetch;
  const applied = [];
  globalThis.Admin.applyBuilt = (b) => { applied.push(b); return []; };
  store.files = structuredClone(files); store.dirty.clear(); store.error = null;
  let loaded = true;
  try { await import('../admin/panels/faces.js'); } catch (x) { loaded = false; console.error('  (' + x.message + ')'); }
  const tab = FL.tabs.get('faces');
  ok(loaded && tab && tab.title === 'Faces', 'the Faces panel registers its tab');
  ok(/import '\.\/panels\/faces\.js'/.test(readFileSync('admin/overlay.js', 'utf8')), 'the overlay imports the Faces panel');
  if (tab) {
    const tick = (ms = 0) => new Promise((x) => setTimeout(x, ms));
    try {
      const doc = fakeDoc(), el = doc.createElement('div');
      doc.body.appendChild(el);
      tab.render(el);
      const nodes = () => el.walk(), find = (f) => nodes().find(f);
      const act = (a, extra = {}) => find((n) => n.dataset.act === a && Object.entries(extra).every(([k, v]) => n.dataset[k] === v));
      const C = () => store.files['casts.json'];
      const eras = Object.keys(C()).filter((k) => /^\d+$/.test(k));

      /* cast per era */
      ok(eras.length === 3 && eras.every((k) => C()[k].every((n) => find((x) => x.dataset.cast === k && x.dataset.face === n))), 'each era lists its cast');
      act('uncast', { era: '1', face: 'c70trucker' }).fire('click');
      ok(!C()['1'].includes('c70trucker') && store.dirty.has('casts.json') && !find((x) => x.dataset.cast === '1' && x.dataset.face === 'c70trucker'),
         'Remove drops a face from that era\'s cast');
      const add = find((x) => x.dataset.add === '1');
      const offered = add ? add.kids.map((o) => o.value) : [];
      ok(offered.includes('c70trucker') && offered.includes('smokerbust') && offered.includes('c90soap') && !offered.includes('c70teacher'),
         '"add from all faces" offers every face not already in the era (' + offered.join() + ')');
      add.value = 'c70trucker'; act('cast', { era: '1' }).fire('click');
      ok(C()['1'][C()['1'].length - 1] === 'c70trucker' && store.error === null && find((x) => x.dataset.cast === '1' && x.dataset.face === 'c70trucker'),
         'Add puts it at the end of the era\'s cast');

      /* eyes: drag a rectangle per eye on the 4x face */
      const pick = find((x) => x.dataset.pick === 'eyes');
      ok(pick && pick.kids.length === Object.keys(files).filter((k) => k.startsWith('faces/')).length, 'the eye editor offers every face');
      /* from no eyes, whatever the face on disk has */
      store.files['faces/c70teacher.json'].eyes = []; delete store.files['faces/c70teacher.json']._eyesByHand;
      pick.value = 'c70teacher'; pick.fire('change');
      const cv = () => find((x) => x.dataset.eyes === 'c70teacher');
      ok(cv(), 'choosing a face draws it for the eyes');
      const drag = (x0, y0, x1, y1) => {
        const c = cv(), ev = (x, y) => ({ offsetX: x * 4 + 1, offsetY: y * 4 + 1, button: 0, pointerId: 1, target: c, preventDefault() {} });
        c.on.pointerdown[0](ev(x0, y0)); c.on.pointermove[0](ev(x1, y1)); c.on.pointerup[0](ev(x1, y1));
      };
      const T = () => store.files['faces/c70teacher.json'];
      drag(20, 28, 26, 32);
      ok(JSON.stringify(T().eyes) === '[[20,28,6,4]]' && T()._eyesByHand === true && store.dirty.has('faces/c70teacher.json') && store.error === null,
         'a drag sets an eye in face pixels and marks it set by hand (' + JSON.stringify(T().eyes) + ')');
      drag(36, 32, 30, 28);
      ok(JSON.stringify(T().eyes) === '[[20,28,6,4],[30,28,6,4]]', 'a second, dragged backwards, is normalised; eyes are kept left to right (' + JSON.stringify(T().eyes) + ')');
      drag(31, 29, 35, 32);
      ok(JSON.stringify(T().eyes) === '[[20,28,6,4],[31,29,4,3]]', 'a third replaces the nearer of the two (' + JSON.stringify(T().eyes) + ')');
      drag(5, 5, 5, 5);
      ok(T().eyes.length === 2, 'a click with no drag sets nothing');
      ok(/20,28,6,4/.test((find((x) => x.dataset.eyelist !== undefined) || {}).textContent || ''), 'the rects are listed under the face');
      act('clear-eyes').fire('click');
      ok(JSON.stringify(T().eyes) === '[]' && T()._eyesByHand === true, 'Clear empties them, still set by hand');
      ok(act('blink') && act('say-face'), 'the face can be previewed mid-blink and shown in the strip');
      const lidCol = T().pal.find((c) => c !== T().skin);
      act('lid', { col: lidCol }).fire('click');
      ok(T().skin === lidCol && T()._eyesByHand === true && store.error === null && act('lid', { col: lidCol }).className.includes('on'),
         'a lid colour swatch sets skin from the face\'s own palette, by hand');

      /* new face: drop an image, optionally crop, Bake */
      let sent = null, reply = { status: 200, json: { rel: 'faces/newguy.json', json: { ...files['faces/smokerbust.json'], name: 'NEWGUY' }, log: 'faces/newguy.mjs  60x74\n  round trip: identical' } };
      globalThis.fetch = async (url, o) => { sent = { url, body: JSON.parse(o.body) }; return { status: reply.status, json: async () => reply.json }; };
      const said = [];
      globalThis.Admin.test = { say: (t, f) => said.push(f) };
      const nf = (k) => find((x) => x.dataset.new === k);
      nf('name').value = 'newguy'; nf('name').fire('input');
      nf('file').files = [{ name: 'n.png', arrayBuffer: async () => new Uint8Array([137, 80, 78, 71]).buffer }];
      nf('file').fire('change'); await tick(10);
      nf('crop').value = '1 2 30 40'; nf('crop').fire('input');
      act('bake').fire('click'); await tick(20);
      ok(sent && sent.url.endsWith('/admin/api/face') && sent.body.name === 'newguy' && sent.body.png === 'iVBORw==' && JSON.stringify(sent.body.crop) === '[1,2,30,40]',
         'Bake posts the name, the image as base64 and the crop (' + JSON.stringify(sent && { ...sent.body, png: sent.body.png.slice(0, 12) }) + ')');
      ok(store.files['faces/newguy.json'] && store.files['faces/newguy.json'].name === 'NEWGUY' && !store.dirty.has('faces/newguy.json'),
         'the baked face is in the working copy, not dirty (it is on disk)');
      ok(said.join() === 'newguy', 'and is shown in the dialogue strip through Admin.test.say (' + said.join() + ')');
      ok(/round trip/.test(nf('msg').textContent), 'the bake log reaches the panel');
      ok(find((x) => x.dataset.add === '2').kids.some((o) => o.value === 'newguy'), 'the new face can be cast');
      sent = null; nf('crop').value = ''; nf('crop').fire('input');
      reply = { status: 409, json: { error: 'exists', rel: 'faces/newguy.json' } };
      act('bake').fire('click'); await tick(20);
      ok(sent && !('crop' in sent.body) && /already/.test(nf('msg').textContent), 'no crop sends none; an existing name is reported (' + nf('msg').textContent + ')');
      reply = { status: 422, json: { log: 'bake-face: it went wrong here' } };
      act('bake').fire('click'); await tick(20);
      ok(/it went wrong here/.test(nf('msg').textContent), 'a failed pipeline shows its log');
      sent = null; nf('name').value = 'Bad Name'; nf('name').fire('input');
      act('bake').fire('click'); await tick(20);
      ok(sent === null && /lower-case/.test(nf('msg').textContent), 'a bad name is refused before anything is sent');
      nf('name').value = 'okname'; nf('name').fire('input'); nf('crop').value = '1 2 3'; nf('crop').fire('input');
      act('bake').fire('click'); await tick(20);
      ok(sent === null && /x y w h/.test(nf('msg').textContent), 'and so is a crop that is not four numbers');
    } finally { globalThis.fetch = realFetch; delete globalThis.Admin.test; }
  }
  store.files = structuredClone(files); store.dirty.clear(); store.error = null;
  globalThis.Admin.applyBuilt = realApply;
}

console.log('\n— music panel —');
{
  const { store } = await import('../admin/store.js');
  const FL = await import('../admin/fields.js');
  const realApply = globalThis.Admin.applyBuilt, realFetch = globalThis.fetch, realMusic = globalThis.Admin.music;
  const applied = [];
  globalThis.Admin.applyBuilt = (b, g, o) => { applied.push(o || {}); return []; };
  store.files = structuredClone(files); store.dirty.clear(); store.error = null;
  let loaded = true;
  try { await import('../admin/panels/music.js'); } catch (x) { loaded = false; console.error('  (' + x.message + ')'); }
  const tab = FL.tabs.get('music');
  ok(loaded && tab && tab.title === 'Music', 'the Music panel registers its tab');
  ok(/import '\.\/panels\/music\.js'/.test(readFileSync('admin/overlay.js', 'utf8')), 'the overlay imports the Music panel');
  if (tab) {
    const tick = (ms = 5) => new Promise((x) => setTimeout(x, ms));
    const calls = [];
    globalThis.Admin.music = { listening: null, listen(id) { calls.push('listen:' + id); this.listening = id; return true; }, stop() { calls.push('stop'); this.listening = null; } };
    const LIB = [{ file: '70s/BohemianRhapsody.mid', ids: ['bohemian-opera', 'bohemian-rock'] }, { file: '70s/Kashmir.mid', ids: ['kashmir'] }, { file: '80s/HazyShadeOfWinter.mid', ids: [] }];
    let sent = [], reply = null;
    globalThis.fetch = async (url, o) => {
      if (/\/admin\/api\/midis$/.test(url)) return { status: 200, ok: true, json: async () => structuredClone(LIB) };
      sent.push({ url, body: JSON.parse(o.body) });
      return { status: reply.status, ok: reply.status === 200, json: async () => reply.json };
    };
    try {
      const doc = fakeDoc(), el = doc.createElement('div');
      doc.body.appendChild(el);
      tab.render(el); await tick();
      const nodes = () => el.walk(), find = (f) => nodes().find(f);
      const act = (a, extra = {}) => find((n) => n.dataset.act === a && Object.entries(extra).every(([k, v]) => n.dataset[k] === String(v)));
      const PL = () => store.files['music/playlist.json'];

      /* library */
      const rows = nodes().filter((n) => n.dataset.midi !== undefined && n.classList.contains('adm-midi'));
      ok(rows.map((n) => n.dataset.midi).join() === LIB.map((m) => m.file).join(), 'the library lists every MIDI the server has (' + rows.map((n) => n.dataset.midi).join() + ')');
      const row = (f) => rows.find((n) => n.dataset.midi === f);
      ok(row('70s/Kashmir.mid').textContent.includes('KASHMIR - LED ZEPPELIN (1975)') && row('70s/BohemianRhapsody.mid').textContent.split('BOHEMIAN RHAPSODY - QUEEN (1975)').length === 3,
         'a ported MIDI shows each of its songs: title, artist and year');
      ok(row('80s/HazyShadeOfWinter.mid').textContent.includes('80s/HazyShadeOfWinter.mid') && act('port-open', { midi: '80s/HazyShadeOfWinter.mid' }) && !act('port-open', { midi: '70s/Kashmir.mid' }),
         'an unported one shows its filename and a Port button');

      /* listen */
      act('listen', { id: 'kashmir' }).fire('click');
      ok(calls.join() === 'listen:kashmir' && act('stop') && el.textContent.includes('KASHMIR'), 'Listen plays the song through Admin.music.listen, and Stop is offered');
      act('stop').fire('click');
      ok(calls.join() === 'listen:kashmir,stop' && !act('stop'), 'Stop stops it');

      /* port */
      act('port-open', { midi: '80s/HazyShadeOfWinter.mid' }).fire('click');
      const pf = (k) => find((n) => n.dataset.port === k);
      ok(['title', 'artist', 'year', 'month', 'id'].every((k) => pf(k)) && act('port'), 'Port opens a form: title, artist, year, month and id');
      const fill = (o) => { for (const [k, v] of Object.entries(o)) { pf(k).value = v; pf(k).fire('input'); } };
      fill({ title: 'a hazy shade of winter', artist: 'the bangles', year: '19x7', month: '11', id: '' });
      act('port').fire('click'); await tick();
      ok(sent.length === 0 && /year/.test(pf('msg').textContent), 'a year that is not one is refused before anything is sent (' + pf('msg').textContent + ')');
      fill({ year: '1987', month: '13' });
      act('port').fire('click'); await tick();
      ok(sent.length === 0 && /month/.test(pf('msg').textContent), 'and so is a month past 12');
      fill({ month: '11' });
      const song = { ...structuredClone(files['music/kashmir.json']), id: 'a-hazy-shade-of-winter', title: 'A HAZY SHADE OF WINTER', artist: 'THE BANGLES', year: 1987, month: 11 };
      reply = { status: 200, json: { rel: 'music/a-hazy-shade-of-winter.json', json: song, output: 'arranged' } };
      applied.length = 0;
      act('port').fire('click'); await tick();
      ok(sent.length === 1 && /\/admin\/api\/port$/.test(sent[0].url)
         && JSON.stringify(sent[0].body) === JSON.stringify({ file: '80s/HazyShadeOfWinter.mid', id: 'a-hazy-shade-of-winter', title: 'A HAZY SHADE OF WINTER', artist: 'THE BANGLES', year: 1987, month: 11 }),
         'Port posts { file, id, title, artist, year, month }, upper-cased as the game draws it, the id from the title (' + JSON.stringify(sent[0] && sent[0].body) + ')');
      ok(store.files['music/a-hazy-shade-of-winter.json'] === song && !store.dirty.has('music/a-hazy-shade-of-winter.json') && !store.bigUntouched().includes('music'),
         'the ported song joins the working copy, not dirty, and the music table is applied from then on (' + store.bigUntouched().join() + ')');
      ok(applied.length >= 1 && !(applied[applied.length - 1].skip || []).includes('music'), 'and it is applied to the game at once, music and all');
      ok(act('listen', { id: 'a-hazy-shade-of-winter' }) && !act('port-open', { midi: '80s/HazyShadeOfWinter.mid' }), 'the library row now offers Listen');
      reply = { status: 409, json: { error: 'exists', rel: 'music/kashmir.json' } };
      LIB.push({ file: '90s/Lump.mid', ids: [] });
      act('refresh-lib').fire('click'); await tick();
      act('port-open', { midi: '90s/Lump.mid' }).fire('click');
      const nSent = sent.length;
      fill({ title: 'kashmir', artist: 'x', year: '1995', month: '' });
      act('port').fire('click'); await tick();
      ok(sent.length === nSent && /month/.test(pf('msg').textContent), 'an empty month is refused before anything is sent: every song needs one (' + pf('msg').textContent + ')');
      fill({ month: '7' });
      act('port').fire('click'); await tick();
      ok(sent.length === nSent + 1 && sent[sent.length - 1].body.month === 7 && /already/.test(pf('msg').textContent), 'an id that exists is reported (' + pf('msg').textContent + ')');
      reply = { status: 422, json: { error: 'job', log: 'midi2song: no lead candidate' } };
      fill({ id: 'lump2' });
      act('port').fire('click'); await tick();
      ok(/no lead candidate/.test(pf('msg').textContent), 'a failed port shows its log');

      /* playlists: the title, then 1..20 */
      const secs = nodes().filter((n) => n.dataset.list !== undefined && n.classList.contains('adm-playlist')).map((n) => n.dataset.list);
      ok(secs.join() === ['title', ...Array.from({ length: 20 }, (x, i) => String(i + 1))].join(), 'a list for the title, then one per level 1-20 (' + secs.join() + ')');
      const items = (k) => nodes().filter((n) => n.classList.contains('adm-song') && n.dataset.list === k).map((n) => n.dataset.id);
      ok(items('1').join() === PL()['1'].join() && items('title').join() === PL().title.join(), 'each list shows its songs, in order');
      const pick = (k) => find((n) => n.dataset.pick === k);
      const opt = (k, id) => pick(k).kids.find((o) => o.value === id);
      ok(opt('1', 'kashmir') && opt('1', 'kashmir').disabled && /too new/.test(opt('1', 'kashmir').textContent), 'a song too new for the level is greyed, and says so (' + (opt('1', 'kashmir') || {}).textContent + ')');
      ok(opt('5', 'immigrant-song') && opt('5', 'immigrant-song').disabled && /too old/.test(opt('5', 'immigrant-song').textContent), 'one more than 2 years before it is greyed, too old (' + (opt('5', 'immigrant-song') || {}).textContent + ')');
      const late = opt('4', 'bohemian-opera');
      ok(late && !late.disabled && /released Oct 1975, after this level's July/.test(late.textContent),
         'a same-year song released after the level\'s month can be picked, with a warning naming both months (' + (late || {}).textContent + ')');
      const warnNote = (k) => nodes().filter((n) => n.classList.contains('adm-warn') && n.dataset.list === k).map((n) => n.textContent);
      ok(warnNote('3').length === 2 && warnNote('3').every((t) => /released Oct 1975, after this level's January/.test(t)) && warnNote('1').length === 0,
         'a late song in a list shows a warning note on its row; a list with none shows none (' + warnNote('3').join(' | ') + ')');
      ok(warnNote('16').length === 1 && /Aug 1993, after this level's July/.test(warnNote('16')[0]), 'Cannonball on Level 16 is flagged (' + warnNote('16').join() + ')');
      ok(opt('1', 'immigrant-song').disabled && /in this list/.test(opt('1', 'immigrant-song').textContent) && !opt('1', 'walk-on-the-wild-side').disabled, 'a song already in the list is greyed; an eligible one is not');
      ok(!opt('title', 'kashmir').disabled && opt('title', 'a-hazy-shade-of-winter') && !opt('title', 'a-hazy-shade-of-winter').disabled, 'the title takes any song, the newly ported one too');
      pick('1').value = 'walk-on-the-wild-side'; act('song-add', { list: '1' }).fire('click');
      ok(PL()['1'].join() === 'immigrant-song,black-dog,walk-on-the-wild-side' && store.dirty.has('music/playlist.json') && store.error === null && items('1').length === 3,
         'Add puts a third song on the level, and it validates');
      pick('1').value = 'kashmir'; act('song-add', { list: '1' }).fire('click');
      ok(PL()['1'].length === 3, 'a greyed song is not added');
      act('song-up', { list: '1', j: 2 }).fire('click');
      ok(PL()['1'].join() === 'immigrant-song,walk-on-the-wild-side,black-dog', 'up moves a song');
      act('song-down', { list: '1', j: 0 }).fire('click');
      ok(PL()['1'].join() === 'walk-on-the-wild-side,immigrant-song,black-dog', 'down moves a song');
      const srow = (k, j) => find((n) => n.classList.contains('adm-song') && n.dataset.list === k && n.dataset.j === String(j));
      ok(srow('1', 0).draggable === true, 'a song row can be dragged');
      srow('1', 2).fire('dragstart'); srow('1', 0).fire('dragover'); srow('1', 0).fire('drop');
      ok(PL()['1'].join() === 'black-dog,walk-on-the-wild-side,immigrant-song', 'dragging a row onto another moves it there (' + PL()['1'].join() + ')');
      act('song-remove', { list: '1', j: 1 }).fire('click');
      ok(PL()['1'].join() === 'black-dog,immigrant-song' && store.error === null, 'Remove takes a song out');
      act('song-remove', { list: '1', j: 1 }).fire('click');
      ok(PL()['1'].join() === 'black-dog' && act('song-remove', { list: '1', j: 0 }).disabled, 'the last song cannot be removed: a list needs one');
      act('listen', { id: 'black-dog', list: '1' }).fire('click');
      ok(calls[calls.length - 1] === 'listen:black-dog', 'a song in a list can be listened to');
      store.set('music/playlist.json', '1', ['immigrant-song', 'black-dog']);
      ok(JSON.stringify(PL()) === JSON.stringify(files['music/playlist.json']), 'every playlist edit was put back');

      /* leaving the tab, or closing the overlay, ends a listen */
      const { leaveTab } = await import('../admin/overlay.js');
      act('listen', { id: 'kashmir' }).fire('click');
      ok(globalThis.Admin.music.listening === 'kashmir' && typeof tab.leave === 'function', 'the Music tab has a leave hook');
      calls.length = 0;
      leaveTab(FL.tabs, 'music');
      ok(calls.join() === 'stop' && globalThis.Admin.music.listening === null, 'leaving the Music tab stops the song (' + calls.join() + ')');
      leaveTab(FL.tabs, 'music');
      ok(calls.join() === 'stop', 'and leaving it with nothing playing stops nothing');
      const thrower = new Map([['x', { leave: () => { throw new Error('boom'); } }]]), realErr = console.error;
      let t2 = null; console.error = () => {};
      try { leaveTab(thrower, 'x'); leaveTab(thrower, 'nope'); } catch (x) { t2 = x; } finally { console.error = realErr; }
      ok(!t2, 'a leave hook that throws, or a tab with none, does not stop the overlay');
      const ovs = readFileSync('admin/overlay.js', 'utf8');
      ok(/if \(id !== current\) leave\(current\)/.test(ovs) && /if \(isOpen && !on\) leave\(current\)/.test(ovs),
         'the overlay runs the leave hook on a tab switch and on close');
    } finally { globalThis.fetch = realFetch; globalThis.Admin.music = realMusic; }
  }
  store.files = structuredClone(files); store.dirty.clear(); store.error = null;
  if (store.added) store.added.clear();
  globalThis.Admin.applyBuilt = realApply;
}

console.log('\n— menu panel —');
{
  const { store } = await import('../admin/store.js');
  const FL = await import('../admin/fields.js');
  const { NOW_PX, nowCost, BIN_COUNT } = await import('../tools/content/validate.mjs');
  const realApply = globalThis.Admin.applyBuilt;
  globalThis.Admin.applyBuilt = () => {};
  store.files = structuredClone(files); store.dirty.clear(); store.error = null;
  let loaded = true;
  try { await import('../admin/panels/menu.js'); } catch (x) { loaded = false; console.error('  (' + x.message + ')'); }
  const tab = FL.tabs.get('menu');
  ok(loaded && tab && tab.title === 'Menu', 'the Menu panel registers its tab');
  ok(/import '\.\/panels\/menu\.js'/.test(readFileSync('admin/overlay.js', 'utf8')), 'the overlay imports the Menu panel');
  if (tab) {
    const realFetch = globalThis.fetch;
    globalThis.LATTICE = diskBuilt.lattice;
    globalThis.Faces = { decode: (f) => ({ width: f.w, height: f.h, rec: f }) };
    try {
      const doc = fakeDoc(), ce = doc.createElement;
      doc.createElement = (t) => {
        const n = ce(t);
        if (t === 'canvas') { n.draws = []; n.getContext = () => ({ drawImage: (...a) => n.draws.push(a), clearRect() {}, imageSmoothingEnabled: true }); }
        return n;
      };
      const el = doc.createElement('div');
      doc.body.appendChild(el);
      tab.render(el);
      const nodes = () => el.walk();
      const find = (k, v) => nodes().find((n) => n.dataset[k] === String(v));
      const all = (k) => nodes().filter((n) => n.dataset[k] !== undefined);
      const ctl = (p) => nodes().find((n) => n.dataset.rel === 'menus.json' && n.dataset.path === p);
      const type = (c, v) => { c.value = v; c.fire('input'); FL.paint(); };
      const pick = (c, label) => { const i = c.kids.findIndex((o) => o.textContent === label); c.value = String(i); c.fire('change'); FL.paint(); };
      const act = (a, item, j) => nodes().find((n) => n.dataset.act === a && (item === undefined || n.dataset.item === String(item)) && (j === undefined || n.dataset.j === String(j)));
      const tick = () => new Promise((x) => setTimeout(x, 5));
      const M = () => store.files['menus.json'];

      ok(all('era').map((n) => n.dataset.era).join() === '1,2,3', 'one tab per era (' + all('era').map((n) => n.dataset.era).join() + ')');
      const states = () => all('bin').map((n) => n.dataset.state).join();
      ok(all('bin').length === BIN_COUNT && states() === 'own,own,own,own,own,own,own,own,own,empty,empty,empty'
         && find('base', 'left') && find('base', 'right'), 'Era 1: twelve bins, nine filled and three empty, with a base station either side (' + states() + ')');
      const beef = nodes().find((n) => n.tagName === 'CANVAS' && n.dataset.well === 'BEEF');
      ok(beef && beef.width === 2 * diskBuilt.lattice.BEEF.w && beef.height === 2 * diskBuilt.lattice.BEEF.h && beef.draws.length === 1
         && beef.draws[0][0].rec === diskBuilt.lattice.BEEF && beef.draws[0][3] === 2 * diskBuilt.lattice.BEEF.w,
         "each bin shows its well, decoded with Faces.decode(LATTICE[key]) and drawn at 2x");
      ok(nodes().some((n) => n.tagName === 'CANVAS' && n.dataset.well === 'TORTILLA') && nodes().some((n) => n.tagName === 'CANVAS' && n.dataset.well === 'CHIPS'),
         'the base stations show the rack and the chips');

      /* era 2: earlier bins are locked, this era's own are editable */
      find('era', 2).fire('click');
      ok(states() === 'locked,locked,locked,locked,locked,locked,locked,locked,locked,own,own,empty', 'Era 2: bins 1-9 locked, 10-11 its own, 12 empty (' + states() + ')');
      find('bin', 0).fire('click');
      ok(!ctl('2.bins.0.name') && !ctl('2.bins.0.plate') && el.textContent.includes('Filled in Era 1'), 'a locked bin has no controls and says which era filled it');
      find('bin', 9).fire('click');
      ok(ctl('2.bins.9.name') && ctl('2.bins.9.plate') && ctl('2.bins.9.name').value === 'TACO SHOP SAUCE', "the era's own bin has its name and plate");
      type(ctl('2.bins.9.plate'), 'SAUCY');
      ok(M()['2'].bins[9].plate === 'SAUCY' && M()['3'].bins[9].plate === 'SAUCY' && store.error === null, 'a plate edit carries to the later eras that hold the same bin');
      type(ctl('2.bins.9.plate'), 'SAUCE PLATE');
      ok(store.error && store.error.path.join('.') === '2.bins.9.plate' && ctl('2.bins.9.plate').classList.contains('adm-bad'), 'an 11-character plate is refused on the field');
      type(ctl('2.bins.9.plate'), 'SAUCE');

      /* items */
      find('era', 1).fire('click');
      const dishes = () => nodes().filter((n) => n.classList.contains('adm-menuitem'));
      ok(dishes().length === 9 && dishes().every((n, i) => n.dataset.item === String(i)) && ctl('1.items.0.price').dataset.kind === 'money' && ctl('1.items.0.price').value === '0.29', 'Era 1: nine items, price in dollars');
      ok(['name', 'ticket', 'short'].every((f) => ctl('1.items.0.' + f) && ctl('1.items.0.' + f).dataset.kind === 'text'), 'each item has name, ticket and short');
      const base = ctl('1.items.0.recipe.0'), ing1 = ctl('1.items.0.recipe.1');
      ok(base && base.tagName === 'SELECT' && base.kids.map((o) => o.textContent).join() === 'SMALL TORTILLA,TACO SHELL,LARGE TORTILLA,CHIPS',
         'the base is a select of the base stations (' + (base && base.kids.map((o) => o.textContent).join()) + ')');
      ok(ing1 && ing1.kids.map((o) => o.textContent).join() === M()['1'].bins.filter(Boolean).map((b) => b.name).join() && ctl('1.items.0.recipe.3') && !ctl('1.items.0.recipe.4'),
         "each ingredient is a select of this era's filled bins");
      const budget = (i) => (find('budget', i) || {}).textContent || '';
      const it0 = M()['1'].items[0], left0 = NOW_PX - nowCost(it0.short, it0.recipe.length);
      ok(budget(0).includes(left0 + 'px left') && budget(0).includes('0 characters left'), 'the short shows px and characters left (' + budget(0) + ')');
      type(ctl('1.items.0.short'), 'HD TACOS');
      ok(store.error && store.error.path.join('.') === '1.items.0.short' && /Trim 1/.test(ctl('1.items.0.short')._msg.textContent) && budget(0) === 'over by 5px: trim 1 character',
         'a short past the budget is refused on the field with characters to trim (' + budget(0) + ')');
      type(ctl('1.items.0.short'), 'HD TACO');
      type(ctl('1.items.0.price'), '0.35');
      ok(M()['1'].items[0].price === 35, 'a price is typed in dollars and stored in cents');
      type(ctl('1.items.0.price'), '0.29');
      type(ctl('1.items.0.name'), 'HARD TACO X');
      ok(nodes().some((n) => n.tagName === 'SPAN' && n.textContent === '1. HARD TACO X'), "an item's heading follows its name as you type");
      type(ctl('1.items.0.name'), 'HARD TACO');

      pick(ing1, 'REFRIED BEANS');
      const grp = () => nodes().find((n) => n.dataset.rel === 'menus.json' && n.dataset.path === '1.items.0.recipe');
      ok(M()['1'].items[0].recipe[1] === 'BEANS' && store.error && store.error.path.join('.') === '1.items.0.recipe' && grp() && grp().classList.contains('adm-bad')
         && /board/.test(grp()._msg.textContent), 'a recipe with no board art is refused, on the recipe (' + (store.error && store.error.message.split('\n')[0]) + ')');
      pick(ctl('1.items.0.recipe.1'), 'GROUND BEEF');
      ok(store.error === null && !grp().classList.contains('adm-bad'), 'putting the beef back clears it');
      act('del-ing', 0, 3).fire('click');
      ok(M()['1'].items[0].recipe.join() === 'SHELL,BEEF,LETTUCE' && !ctl('1.items.0.recipe.3'), 'an ingredient can be removed');
      act('add-ing', 0).fire('click');
      ok(M()['1'].items[0].recipe.length === 4 && ctl('1.items.0.recipe.3'), 'and one added');
      pick(ctl('1.items.0.recipe.3'), 'CHEESE');
      ok(M()['1'].items[0].recipe.join() === 'SHELL,BEEF,LETTUCE,CHEESE' && store.error === null, 'back as it was');
      const full = M()['1'].items[1];
      ok(full.recipe.length === 7 && !act('add-ing', 1), 'an item with six ingredients offers no more');

      act('add-item').fire('click');
      const nw = M()['1'].items[9];
      ok(M()['1'].items.length === 10 && dishes().length === 10 && nw && store.error === null,
         'Add item adds one that validates as it stands (' + (store.error && store.error.message) + ')');
      act('up', 9).fire('click');
      ok(M()['1'].items[8] === nw && M()['1'].items[9].name === 'NACHOS', 'up moves it');
      act('down', 8).fire('click');
      ok(M()['1'].items[9] === nw, 'down moves it back');
      act('remove', 9).fire('click');
      ok(M()['1'].items.length === 9 && store.error === null, 'remove takes it out');
      ok(JSON.stringify(M()) === JSON.stringify(files['menus.json']), 'every edit was put back');

      /* a new ingredient in an empty bin: era 3 gives up its slot 12 for the test */
      const m3 = M()['3'];
      m3.bins[11] = null; m3.items = m3.items.filter((it) => !it.recipe.includes('CHICKEN'));
      store.validate(); store.dirty.clear();
      ok(store.error === null, 'with Era 3 slot 12 empty the content validates');
      find('era', 2).fire('click');
      find('bin', 11).fire('click');
      const ni = (k) => find('ni', k);
      ok(['key', 'name', 'plate', 'src', 'hue', 'sat', 'val'].every((k) => ni(k)) && act('preview') && act('fill') && act('fill').disabled,
         'an empty bin offers a new ingredient: key, name, plate, a source well and hue/sat/val; Put in bin waits for a preview');
      ok(ni('src').kids.some((o) => o.textContent === 'BEANS'), 'the source select lists the wells');
      ok(el.textContent.includes('Each Preview writes a new well file') && el.textContent.includes('by hand'), 'the form says each Preview writes a file, and leftovers are deleted by hand');
      const sent = [];
      const beansRec = { ...structuredClone(files['lattice/beans.json']), name: 'TESTWELL' };
      globalThis.fetch = async (url, o) => {
        sent.push({ url, body: JSON.parse(o.body), method: o.method });
        const exists = JSON.parse(o.body).name === 'CHILI';
        return { status: exists ? 409 : 200, ok: !exists, json: async () => (exists ? { error: 'exists' } : { rel: 'lattice/testwell.json', json: beansRec }) };
      };
      const chiliRec = store.files['lattice/chili.json'];
      ni('key').value = 'CHILI'; ni('src').value = String(ni('src').kids.findIndex((o) => o.textContent === 'BEANS'));
      act('preview').fire('click'); await tick();
      ok(/exists/.test(ni('msg').textContent) && act('fill').disabled && store.files['lattice/chili.json'] === chiliRec,
         'a name already taken is refused by the server, and said so (' + ni('msg').textContent + ')');
      ni('key').value = 'TESTWELL'; ni('name').value = 'TEST WELL'; ni('plate').value = 'TEST';
      ni('hue').value = '-20'; ni('sat').value = '1.1'; ni('val').value = '0.8';
      act('preview').fire('click'); await tick();
      const last = sent[sent.length - 1];
      ok(last && /\/admin\/api\/recolor$/.test(last.url) && last.method === 'POST'
         && JSON.stringify(last.body) === JSON.stringify({ src: 'BEANS', name: 'TESTWELL', hue: -20, sat: 1.1, val: 0.8 }),
         'Preview posts { src, name, hue, sat, val } to the recolour endpoint (' + JSON.stringify(last && last.body) + ')');
      ok(store.files['lattice/testwell.json'] === beansRec && !store.dirty.has('lattice/testwell.json') && !store.dirty.has('menus.json'),
         'the new well joins the working copy (it is already on disk), and nothing is dirty yet');
      ok(nodes().some((n) => n.tagName === 'CANVAS' && n.dataset.well === 'TESTWELL' && n.draws.length && n.draws[0][0].rec === beansRec) && !act('fill').disabled,
         'the preview shows the new well, and Put in bin is ready');
      act('fill').fire('click');
      ok(JSON.stringify(M()['2'].bins[11]) === '{"key":"TESTWELL","name":"TEST WELL","plate":"TEST"}' && JSON.stringify(M()['3'].bins[11]) === JSON.stringify(M()['2'].bins[11])
         && store.error === null && store.dirty.has('menus.json'), 'Put in bin fills the slot here and in the later eras, and validates (' + (store.error && store.error.message) + ')');
      ok(states().endsWith('own') && find('bin', 11).dataset.state === 'own', 'the slot is now this era\'s own bin');
      act('empty-bin').fire('click');
      ok(M()['2'].bins[11] === null && M()['3'].bins[11] && store.error === null, 'Empty this bin empties it in this era only');

      delete globalThis.Faces;
      let threw = null;
      try { find('era', 1).fire('click'); find('era', 3).fire('click'); } catch (x) { threw = x; }
      ok(!threw, 'with no Faces (no game) the panel still draws' + (threw ? ': ' + threw.message : ''));
    } finally { globalThis.fetch = realFetch; delete globalThis.LATTICE; delete globalThis.Faces; }
  }
  store.files = structuredClone(files); store.dirty.clear(); store.error = null;
  globalThis.Admin.applyBuilt = realApply;
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
