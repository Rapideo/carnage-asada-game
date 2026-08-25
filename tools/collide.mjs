/* Zero dependencies, Node built-ins only, so the repo stays dependency-free.
   --------------------------------------------------------------
   collide.mjs -- what would break if this module were bundled into src/.

       node tools/collide.mjs reference/kitchen/kitchen.mjs

   `build.mjs` concatenates src/*.js into ONE <script>, so every top-level
   const, let and function lands in a single shared scope. A name declared
   twice is a fatal redeclaration that appears only in the bundle -- never on
   the dev page, never in a reference module that is still an ES module with a
   scope of its own. CLAUDE.md records this as a failure mode you cannot see
   coming; this is how you see it coming.

   It reports three things, in descending order of how much they matter:

     COLLISIONS   the same name declared in src/ already. Fatal.
     NEAR         differs only by case. Legal, and a trap for a reader.
     FOOTPRINT    how many names the module would add at once, against what
                  the modules already in src/ each contribute.

   The last one is not pedantry. The house pattern is one exported object plus
   a handful of helpers -- Hud + MM + navArrow + triArrow is a whole module.
   Anything far outside that is not a naming problem, it is a sign the module
   wants to be an object rather than a pile of globals.

   Line-start matching, which suits this codebase because it is consistently
   formatted and never indents a top-level declaration. Destructuring imports
   are deliberately NOT counted: those are references to things src/ already
   owns, not new declarations.
*/
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const target = process.argv[2];
if (!target) { console.error('usage: node tools/collide.mjs <module.mjs>'); process.exit(1); }

function topLevel(src) {
  const out = new Set();
  for (const line of src.split(/\r?\n/)) {
    let m;
    if ((m = /^(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)/.exec(line))) out.add(m[1]);
    else if ((m = /^(?:export\s+)?function\s+([A-Za-z_$][\w$]*)/.exec(line))) out.add(m[1]);
  }
  return out;
}

const files = readdirSync('src').filter((f) => f.endsWith('.js'));
const where = {}, srcNames = new Set(), counts = [];
for (const f of files) {
  const names = topLevel(readFileSync(join('src', f), 'utf8'));
  counts.push([f, names.size]);
  for (const n of names) { srcNames.add(n); (where[n] ||= []).push(f); }
}

const mine = [...topLevel(readFileSync(target, 'utf8'))].sort();
const hard = mine.filter((n) => srcNames.has(n));

const byLower = new Map();
for (const n of srcNames) {
  const k = n.toLowerCase();
  if (!byLower.has(k)) byLower.set(k, []);
  byLower.get(k).push(n);
}
const near = mine.filter((n) => byLower.has(n.toLowerCase()) && !byLower.get(n.toLowerCase()).includes(n));

console.log(`${target}\n  ${mine.length} top-level names, against ${srcNames.size} already in src/\n`);

console.log(`COLLISIONS  ${hard.length}${hard.length ? '   <-- FATAL, and only visible in the bundle' : '   none'}`);
for (const n of hard) console.log(`  ${n.padEnd(14)} already declared in ${where[n].join(', ')}`);

console.log(`\nNEAR        ${near.length}${near.length ? '   legal, but a reader trap' : '   none'}`);
for (const n of near) {
  const others = byLower.get(n.toLowerCase());
  console.log(`  ${n.padEnd(14)} vs ${others.join('/')} in ${others.flatMap((o) => where[o]).join(', ')}`);
}

const mean = Math.round(counts.reduce((a, [, c]) => a + c, 0) / counts.length);
console.log(`\nFOOTPRINT   ${mine.length} names added at once; src/ modules average ${mean}`);
const big = counts.filter(([, c]) => c > mean).sort((a, b) => b[1] - a[1]);
console.log(`  largest today: ${big.slice(0, 3).map(([f, c]) => `${f} (${c})`).join(', ')}`);
if (mine.length > mean * 2)
  console.log(`  -> ${Math.round(mine.length / mean)}x the average. Consider one exported object,\n     the way Hud, City, Nav, Art, Scores and Dialog each are.`);

const generic = mine.filter((n) => n.length <= 6 && n === n.toLowerCase());
if (generic.length) {
  console.log(`\nGENERIC     ${generic.length} short lowercase names another module would plausibly want:`);
  console.log(`  ${generic.join(' ')}`);
}
