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

const before = JSON.stringify(files);
validateContent(memSource(files));
ok(JSON.stringify(files) === before, 'validating does not mutate the source');

console.log(`\n${fails === 0 ? 'PASS' : 'FAIL (' + fails + ')'}`);
process.exit(fails ? 1 : 0);
