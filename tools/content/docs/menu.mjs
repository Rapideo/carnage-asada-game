/* menu.md, generated from content/menus.json.

   The doc is `# menu.md` (an introduction, kept) over one `## <roman>. Era <n>`
   node per era, then any other sections (`## IV. Notes for every era`), which
   are prose and are never touched beyond their roman number. Each era node has
   three sections, in this order, whatever else it carries:

     ### A. Bins            `#### <slot>. <bin name>`, `[EMPTY]` for none. Era 1
                            lists all twelve slots; a later era lists only the
                            slots the era before left empty (the rest are the
                            earlier era's, in the same places: a bin never moves).
     ### A.1 Base Stations  Era 1: `#### Left. <names>` and `#### Right. <names>`,
                            the note after the names ("(stacked, top to
                            bottom)") kept. A later era's "Same as Era 1." is
                            left alone: the build refuses stations that change.
     ### B. Items           `#### <i>. <item name>` over the value lines
                              - Short : <short>
                              - Ticket : <ticket>       (only where the doc lists
                                                         tickets: Eras 2 and 3)
                              - Ingredient 0 : <base name>
                              - Ingredient k : <bin name>
                              - Price : <dollars>
                            An item node follows its dish BY NAME, so a note on
                            it ("- Dropped : Monterey Jack (no bin)") moves with
                            it when the menu is reordered and goes with it when it
                            is removed. A renamed dish keeps the node in its
                            position.

   Display follows the JSON's form: names as stored (upper case), and an
   ingredient is the name of its bin or base in that era. A bracketed note the
   doc wrote after a name is kept verbatim after it (controller ruling: these
   carry owner rulings, ONIONS are green onions), so "Cheese (shredded)" reads
   "CHEESE (shredded)" and keeps its note through a rename. Every other line in a node is prose and stays where it is: the
   introductions, the "Bins 1-9 are Era 1's" notes, the Short sizing note under
   Era 1's Items, the Dropped notes, and the whole of the Notes section. */
import { parseMd, toMd, roman } from './engine.mjs';

const money = (c) => Math.floor(c / 100) + '.' + String(c % 100).padStart(2, '0');
/* "IV. Notes" -> "Notes", "A.1 Base Stations" -> "Base Stations"; "Era 1" stays */
const bare = (h) => h.replace(/^[A-Z0-9]+(?:\.\d+ |\. )/, '');
const blank = (l) => l === undefined || l.trim() === '';
const num = (h) => { const m = /^(\d+)\. /.exec(h); return m ? Number(m[1]) : null; };
const node = (heading, depth) => ({ heading, depth, lines: [''], children: [] });

/* A bracketed note after a name ("Onions (green onions)", "Chili Con Queso
   (CCQ)") is an owner's note on the value, and is kept verbatim after the
   JSON's form of the name: "ONIONS (green onions)". When the doc's text starts
   with the name (case aside) the note is what follows it; otherwise (the JSON
   renamed it) the note is the text from its first " (" on, so it stays on the
   renamed line. A name the doc never had gets no note. */
const NOTE = /^ \(.*\)$/;
export function noteOf(old, name) {
  if (!old) return '';
  const n = String(name), rest = old.slice(n.length);
  if (old.toUpperCase().startsWith(n.toUpperCase())) return NOTE.test(rest) ? rest : '';
  const i = old.indexOf(' (');
  return i >= 0 && NOTE.test(old.slice(i)) ? old.slice(i) : '';
}
/* the doc's text names `name`, with or without a note after it (music.mjs uses both) */
export const sameName = (text, name) => {
  const t = String(text).toUpperCase(), n = String(name).toUpperCase();
  return t === n || (t.startsWith(n) && NOTE.test(String(text).slice(n.length)));
};

const SECTIONS = [['Bins', 'A. Bins'], ['Base Stations', 'A.1 Base Stations'], ['Items', 'B. Items']];
const OWNED = /^- (Short|Ticket|Ingredient \d+|Price)\s*:\s*(.*)$/;

/* The item's value lines, in canonical order, written where the first of them
   was; any prose that sat between two of them is kept, after them. Price keeps
   whatever followed its value on the line. */
function fillItem(n, it, label, withTicket) {
  const L = n.lines;
  let p = -1, priceTail = '';
  const kept = [], olds = [];
  for (let i = 0; i < L.length; i++) {
    const m = OWNED.exec(L[i]);
    if (!m) { kept.push(L[i]); continue; }
    if (p < 0) p = kept.length;
    if (m[1] === 'Price') { const v = /^\d+\.\d\d/.exec(m[2]); priceTail = v ? m[2].slice(v[0].length) : ''; }
    if (m[1].startsWith('Ingredient ')) olds[Number(m[1].slice(11))] = m[2];
    if (blank(L[i + 1])) i++;                    // its blank separator goes with it
  }
  if (p < 0) {                                   // none yet: after the node's last line of prose
    let last = -1;
    kept.forEach((l, i) => { if (!blank(l)) last = i; });
    p = last >= 0 ? last + 1 : kept.length;
  }
  const vals = [['Short', it.short]];
  if (withTicket) vals.push(['Ticket', it.ticket]);
  /* an ingredient's note follows the ingredient it was written on, by name:
     the same step if it still names it, else any step that did */
  it.recipe.forEach((k, j) => {
    const name = label(k), was = olds[j] !== undefined && sameName(olds[j], name) ? olds[j] : olds.find((v) => v !== undefined && sameName(v, name));
    vals.push(['Ingredient ' + j, name + (was ? noteOf(was, name) : '')]);
  });
  vals.push(['Price', money(it.price) + priceTail]);
  const block = [];
  for (const [k, v] of vals) block.push('- ' + k + ' : ' + v, '');
  if (p > 0 && !blank(kept[p - 1])) block.unshift('');
  if (p < kept.length && blank(kept[p])) block.pop();
  kept.splice(p, 0, ...block);
  n.lines = kept;
}

function syncItems(sec, items, label) {
  const old = sec.children.filter((c) => num(c.heading) !== null), rest = sec.children.filter((c) => num(c.heading) === null);
  const claimed = new Set(), at = new Array(items.length).fill(null);
  items.forEach((it, i) => {
    const hit = old.find((c) => !claimed.has(c) && sameName(bare(c.heading), it.name));
    if (hit) { claimed.add(hit); at[i] = hit; }
  });
  items.forEach((it, i) => { if (!at[i] && old[i] && !claimed.has(old[i])) { claimed.add(old[i]); at[i] = old[i]; } });
  const tickets = old.some((c) => c.lines.some((l) => /^- Ticket\s*:/.test(l))) || !old.length;
  sec.children = [...items.map((it, i) => {
    const fresh = !at[i], n = at[i] || node('', sec.depth + 1);
    n.heading = (i + 1) + '. ' + it.name + (fresh ? '' : noteOf(bare(n.heading), it.name));
    fillItem(n, it, label, n.lines.some((l) => /^- Ticket\s*:/.test(l)) || (fresh && tickets));
    return n;
  }), ...rest];
}

function syncBins(sec, m, prev) {
  const slots = m.bins.map((b, i) => i).filter((i) => !prev || prev.bins[i] == null);
  const old = sec.children.filter((c) => num(c.heading) !== null), rest = sec.children.filter((c) => num(c.heading) === null);
  sec.children = [...slots.map((i) => {
    const was = old.find((c) => num(c.heading) === i + 1), n = was || node('', sec.depth + 1), b = m.bins[i];
    n.heading = (i + 1) + '. ' + (b ? b.name + (was ? noteOf(bare(was.heading), b.name) : '') : '[EMPTY]');
    return n;
  }), ...rest];
}

function syncBases(sec, m, first) {
  const side = (s) => sec.children.find((c) => c.heading.startsWith(s + '.'));
  if (!first && !side('Left') && !side('Right')) {
    if (sec.lines.every(blank)) sec.lines = ['', 'Same as Era 1.', ''];
    return;
  }
  for (const [s, list, note] of [['Left', m.bases.left, ' (stacked, top to bottom)'], ['Right', m.bases.right, '']]) {
    let n = side(s), tail = note;
    if (n) { const o = n.heading.indexOf(' ('); tail = o >= 0 ? n.heading.slice(o) : ''; }
    else { n = node('', sec.depth + 1); sec.children.push(n); }
    n.heading = s + '. ' + list.map((b) => b.name).join(', ') + tail;
  }
}

function fillEra(en, m, prev, first) {
  const found = SECTIONS.map(([name, head]) => {
    const n = en.children.find((c) => bare(c.heading) === name) || node('', en.depth + 1);
    n.heading = head;
    return n;
  });
  en.children = [...found, ...en.children.filter((c) => !found.includes(c))];
  const names = {};
  for (const b of [...m.bins, ...m.bases.left, ...m.bases.right]) if (b) names[b.key] = b.name;
  syncBins(found[0], m, prev);
  syncBases(found[1], m, first);
  syncItems(found[2], m.items, (k) => names[k] || k);
}

export default {
  file: 'menu.md',
  render(files, prevText) {
    const menus = files['menus.json'];
    const eras = Object.keys(menus).filter((k) => /^\d+$/.test(k)).sort((a, b) => a - b);
    const root = parseMd(prevText || '# menu.md\n\n');
    let doc = root.children.find((n) => n.depth === 1);
    if (!doc) { doc = { heading: 'menu.md', depth: 1, lines: ['', ''], children: [] }; root.children.unshift(doc); }

    const eraOf = (c) => { const x = /^Era (\d+)$/.exec(bare(c.heading)); return x ? x[1] : null; };
    const firstAt = doc.children.findIndex((c) => eraOf(c) !== null);
    const cut = firstAt < 0 ? 0 : firstAt;
    const before = doc.children.slice(0, cut).filter((c) => eraOf(c) === null);
    const after = doc.children.slice(cut).filter((c) => eraOf(c) === null);
    const nodes = eras.map((e, i) => {
      const n = doc.children.find((c) => eraOf(c) === e) || node('', doc.depth + 1);
      n.heading = 'Era ' + e;
      fillEra(n, menus[e], i ? menus[eras[i - 1]] : null, i === 0);
      return n;
    });
    doc.children = [...before, ...nodes, ...after];
    doc.children.forEach((c, i) => { c.heading = roman(i + 1) + '. ' + bare(c.heading); });
    return toMd(root);
  },
};
