/* The docs mirror engine. The JSON in content/ is the master copy; the docs in
   docs/authored content/ are regenerated from it on every save, and every line
   of prose the owner wrote has to survive that.

   The model is the docs' own structure: numbered headings over `- Key : value`
   lists. parseMd turns a doc into a tree of heading nodes,

     Node = { heading: string|null, depth, lines: string[], children: Node[] }

   where `heading` is the text after the #s (null for the root), `depth` the
   number of #s (0 for the root), `lines` every line between this heading and
   the next one, and `children` the deeper headings under it. Every line of the
   text lands in exactly one node, in order, so toMd(parseMd(t)) === t.

   A doc module rewrites only what it owns: headings (syncList) and field lines
   (setField). Everything else in `lines` is prose and is never touched, and a
   reused node keeps its children. Line endings are LF here; renderAll in
   index.mjs converts a CRLF doc on the way in and out.

   No imports. */

const HEAD = /^(#{1,6}) (.*)$/;

export function parseMd(text) {
  const root = { heading: null, depth: 0, lines: [], children: [] };
  const stack = [root];
  for (const line of text.split('\n')) {
    const m = HEAD.exec(line);
    if (!m) { stack[stack.length - 1].lines.push(line); continue; }
    const node = { heading: m[2], depth: m[1].length, lines: [], children: [] };
    while (stack[stack.length - 1].depth >= node.depth) stack.pop();
    stack[stack.length - 1].children.push(node);
    stack.push(node);
  }
  return root;
}

export function toMd(node) {
  const out = [];
  const walk = (n) => {
    if (n.heading !== null) out.push('#'.repeat(n.depth) + ' ' + n.heading);
    out.push(...n.lines);
    n.children.forEach(walk);
  };
  walk(node);
  return out.join('\n');
}

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const blank = (l) => l === undefined || l.trim() === '';

/* The node's line `- <key> : <old><tail>` becomes `- <key> : <valueText><tail>`.
   <old> is the leading run of the value that `match` accepts, and <tail> is the
   rest, which is how a note after a value survives ("2.00. The tip falls to it
   in 54s"). When `match` accepts nothing, the old value is not recognisable as
   one and the whole of it is replaced. `Key: v` and `Key  : v` are normalised to
   `Key : v`. `indent` picks a nested list (`'  '` for `  - Key : v`).

   A missing key is appended after the node's last field line (and that line's
   indented continuation), or after its last line of prose if it has no fields,
   blank-separated the way the docs are. Only the node's own lines are searched,
   never its children's. */
export function setField(node, key, valueText, { match = /^.*/, indent = '' } = {}) {
  const re = new RegExp('^' + esc(indent) + '- ' + esc(key) + '\\s*: *(.*)$');
  const lines = node.lines;
  for (let i = 0; i < lines.length; i++) {
    const m = re.exec(lines[i]);
    if (!m) continue;
    const v = m[1], hit = match.exec(v);
    const tail = hit && hit.index === 0 && hit[0].length ? v.slice(hit[0].length) : '';
    lines[i] = indent + '- ' + key + ' : ' + valueText + tail;
    return;
  }
  const field = new RegExp('^' + esc(indent) + '- [^:]*:');
  let p = -1;
  for (let i = 0; i < lines.length; i++) if (field.test(lines[i])) p = i;
  if (p >= 0) {
    p++;
    while (p < lines.length && /^\s+\S/.test(lines[p])) p++;
  } else {
    let last = -1;
    for (let i = 0; i < lines.length; i++) if (!blank(lines[i])) last = i;
    p = last >= 0 ? last + 1 : (lines.length && blank(lines[0]) ? 1 : 0);
  }
  const ins = [indent + '- ' + key + ' : ' + valueText];
  if (p === 0 || !blank(lines[p - 1])) ins.unshift('');
  if (p >= lines.length || !blank(lines[p])) ins.push('');
  lines.splice(p, 0, ...ins);
}

/* parent.children becomes one node per item, in order. Existing children are
   reused by position, so their prose and their own children stay where they
   are; new ones are created at depth parent.depth + 1; extras are dropped.
   heading(item, i) names each node and fill(node, item, i) writes its fields. */
export function syncList(parent, items, { heading, fill }) {
  parent.children = items.map((item, i) => {
    const node = parent.children[i] || { heading: '', depth: parent.depth + 1, lines: [''], children: [] };
    node.heading = heading(item, i);
    fill(node, item, i);
    return node;
  });
}

/* The docs' numbering, without the dot.
   NOTE THE INDEXING DIFFERS, on purpose:
     roman(n)  takes the 1-BASED number:  roman(1) 'I', roman(18) 'XVIII'
               (a level's n, an era number);
     letter(i) takes the 0-BASED index:   letter(0) 'A', letter(4) 'E'
               (syncList's i, straight from heading(item, i)).
   So in a syncList heading: roman(i + 1) but letter(i). Arabic needs no helper. */
export function roman(n) {
  const R = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'],
    [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  let s = '';
  for (const [v, r] of R) while (n >= v) { s += r; n -= v; }
  return s;
}
export const letter = (i) => String.fromCharCode(65 + i);

/* The same-as rule. A node whose only non-blank line is `Same as Easy` (with or
   without a leading `- `) stands for another difficulty's or section's values. */
const SAME = /^(?:- )?Same as (\w+)/;
export function sameAs(node) {
  if (node.children.length) return null;
  const body = node.lines.filter((l) => !blank(l));
  const m = body.length === 1 && SAME.exec(body[0]);
  return m ? m[1] : null;
}

/* values: what the node's fields would say; resolve(name): the values of the
   section it names. While they are equal the node is left alone (false);
   otherwise the Same-as line is removed and fill(node) writes the fields (true).
   A node with no Same-as line is simply filled. */
export function applySame(node, { values, resolve, fill }) {
  const name = sameAs(node);
  if (name !== null && equal(values, resolve(name))) return false;
  if (name !== null) node.lines = node.lines.filter((l) => blank(l) || !SAME.test(l));
  fill(node);
  return true;
}

export function equal(a, b) {
  if (a === b) return true;
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object' || Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a), kb = Object.keys(b);
  return ka.length === kb.length && ka.every((k) => Object.hasOwn(b, k) && equal(a[k], b[k]));
}

/* Lines that differ between two texts: max(len) - longest common subsequence,
   so a changed line counts once and so does an inserted or deleted one. */
export function diffLines(a, b) {
  const x = a.split('\n'), y = b.split('\n');
  let prev = new Array(y.length + 1).fill(0);
  for (let i = 1; i <= x.length; i++) {
    const cur = new Array(y.length + 1).fill(0);
    for (let j = 1; j <= y.length; j++) cur[j] = x[i - 1] === y[j - 1] ? prev[j - 1] + 1 : Math.max(prev[j], cur[j - 1]);
    prev = cur;
  }
  return Math.max(x.length, y.length) - prev[y.length];
}
