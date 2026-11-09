/* dialogue.md, generated from content/dialogue.json.

   This doc is NEW: unlike the others it did not exist before Service Mode, so
   it is born from the JSON and the JSON stays its master copy.

   The doc is `# dialogue.md` (a one-paragraph preamble) over three sections:

     ## I. Shared lines   one `### <Key>` per key of DLG_KEYS, in that order
     ## II. The cast      one `### <NAME>` per cast character, `#### <Moment>` under it
     ## III. Customers    one `### <face>` per face with personal lines, `#### <Moment>`

   Each list is numbered, in JSON form (quoted, as stored, upper case); a shared
   line's era floor is written after it instead of before it:

     3. "TIME IS MONEY, TACO BOY!" (1980s on)      <- stored as "2|TIME IS ..."

   `who` is a single string and reads as a one-item list. Cast and personal lines
   carry no era.

   What a render writes: the headings and the numbered lists. A character, face
   or moment the JSON no longer has is dropped with its lines (values never
   survive in the mirror). What it keeps: the
   preamble (written once, then it is prose), the one-line note under a heading,
   any other prose, and any indented continuation line under a list item, which
   stays with the item at the same position. A section the doc does not have is
   added at the end; one the JSON does not know is left alone. A doc from before
   the three sections (`## I. Who` ...) has its key sections moved under Shared
   lines, notes and all.

   read(text) returns { shared: {key: [line]}, cast: {NAME: {moment: [line]}},
   people: {face: {moment: [line]}} }, for the round-trip test. */
import { parseMd, toMd, roman } from './engine.mjs';
import { DLG_KEYS, DLG_MOMENTS, CAST_MOMENTS } from '../validate.mjs';

const PREAMBLE = 'The lines over the dialogue strip, in both halves of the game: the shared pools, then the cast, then each customer face\'s own lines. '
  + 'In the shared pools a line tagged (1980s on) or (1990s on) is only said from that era, so nobody quotes a film that has not come out yet. '
  + 'The game reads `content/dialogue.json`: that file is the master copy and this page mirrors it, so edit the lines in Service Mode or in the JSON.';

/* one line of context per key, written once under a new heading and kept after */
const KEY_NOTE = {
  who: 'The name on the speech bubble.',
  delivered: 'Delivery Shift: the order arrived in good time.',
  missed: 'Delivery Shift: the bag landed off the porch.',
  late: 'Delivery Shift: it arrived, but the tip had run down.',
  arrive: 'Kitchen Shift: a new ticket goes on the rail.',
  wait: 'Kitchen Shift: a customer\'s patience is under 30%.',
  queue: 'Kitchen Shift: the line is past three customers.',
  walkout: 'Kitchen Shift: a customer\'s patience ran out.',
  served: 'Kitchen Shift: a ticket was served.',
  wrong: 'Kitchen Shift: a wrong pick.',
};

const ERA = { 2: '1980s on', 3: '1990s on' };
const ERA_BACK = { '1980s': '2|', '1990s': '3|' };
const title = (k) => k[0].toUpperCase() + k.slice(1);
const bare = (h) => h.replace(/^[A-Z0-9]+\. /, '');
const ITEM = /^\d+\. /;
const cont = (l) => l !== undefined && /^\s+\S/.test(l);
const node = (heading, depth, lines) => ({ heading, depth, lines, children: [] });

/* "2|TIME" -> `"TIME" (1980s on)` */
export function itemText(s) {
  const m = /^([0-9])\|/.exec(s);
  return JSON.stringify(m ? s.slice(2) : s) + (m && ERA[m[1]] ? ' (' + ERA[m[1]] + ')' : '');
}

/* replace the numbered list in a node's lines with `items`, keeping everything
   else (and each item's indented continuation lines, by position) */
function writeList(lines, items) {
  const entries = [];            // { at, end, tail: continuation lines }
  for (let i = 0; i < lines.length; i++) {
    if (!ITEM.test(lines[i])) continue;
    let j = i + 1;
    while (cont(lines[j])) j++;
    entries.push({ at: i, end: j, tail: lines.slice(i + 1, j) });
    i = j - 1;
  }
  const fresh = items.flatMap((t, k) => [(k + 1) + '. ' + t, ...(entries[k] ? entries[k].tail : [])]);
  if (!entries.length) {
    let last = lines.length;
    while (last > 0 && lines[last - 1].trim() === '') last--;
    return [...lines.slice(0, last), '', ...fresh, ''];
  }
  const first = entries[0].at, end = entries[entries.length - 1].end;
  const inside = new Set();
  entries.forEach((e) => { for (let i = e.at; i < e.end; i++) inside.add(i); });
  const between = lines.slice(first, end).filter((_, k) => !inside.has(first + k));   // prose among the items
  return [...lines.slice(0, first), ...fresh, ...between, ...lines.slice(end)];
}

const ROLE_LABEL = { officer: 'Officer', rival: 'Rival', coworker: 'Coworker' };
const ERA_NAME = { 1: "1970s", 2: "1980s", 3: "1990s" };
const MOMENT_NOTE = {
  chase: 'The cruiser is on the player.', fined: 'The player was fined.', lost: 'The player lost the cruiser.',
  missed: 'A rival sees the bag miss.', perfect: 'A rival sees a perfect toss.',
  hint: 'Kitchen: the next ingredient to pick. {ING} is its plate name.', clockin: 'Kitchen: the shift starts.',
  streak: 'Kitchen: a run of clean tickets.', trouble: 'Kitchen: the line is backing up.',
};

const find = (parent, heading) => parent.children.find((c) => c.heading === heading);
function ensure(parent, heading, depth, note) {
  let n = find(parent, heading);
  if (!n) { n = node(heading, depth, ['', note || '', '']); parent.children.push(n); }
  return n;
}
/* the section node, matched by its bare heading so "## II. The cast" and a
   renumbered "## 2. The cast" are the same section */
function section(doc, name, n, note) {
  let s = doc.children.find((c) => c.depth === 2 && bare(c.heading) === name);
  if (!s) { s = node('', 2, ['', note, '']); doc.children.push(s); }
  s.heading = roman(n) + '. ' + name;
  return s;
}
/* a node of moments: #### <Moment> with a numbered list each, in `order` */
function momentNodes(parent, order, lines) {
  const kept = order.filter((m) => lines[m]);
  const nodes = kept.map((m) => {
    const n = ensure(parent, title(m), 4, MOMENT_NOTE[m] || '');
    n.lines = writeList(n.lines, lines[m].map(itemText));
    return n;
  });
  /* a moment the JSON no longer has leaves the mirror; other nodes (not moments) are left alone */
  const known = new Set(order);
  parent.children = [...nodes, ...parent.children.filter((c) => !nodes.includes(c) && !known.has(c.heading.toLowerCase()))];
}
const items = (n) => n.lines.filter((l) => ITEM.test(l)).map((l) => {
  const m = /^\d+\. ("(?:[^"\\]|\\.)*")(?: \((1980s|1990s) on\))?$/.exec(l);
  return m ? (m[2] ? ERA_BACK[m[2]] : '') + JSON.parse(m[1]) : undefined;
});
const momentsOf = (n) => { const o = {}; for (const c of n.children) o[c.heading.toLowerCase()] = items(c); return o; };

export default {
  file: 'dialogue.md',
  render(files, prevText) {
    const dlg = files['dialogue.json'];
    const root = parseMd(prevText || '');
    if (!prevText) root.lines = [];
    let doc = root.children.find((n) => n.depth === 1);
    if (!doc) { doc = node('dialogue.md', 1, ['', PREAMBLE, '']); root.children.unshift(doc); }

    /* I. Shared lines. A doc from before the three sections has the keys at
       depth 2 straight under the title: adopt them, notes and all. */
    const shared = section(doc, 'Shared lines', 1, 'The pools every customer draws from. A line tagged (1980s on) or (1990s on) is only said from that era.');
    const old = doc.children.filter((c) => c.depth === 2 && c !== shared && DLG_KEYS.includes(bare(c.heading).toLowerCase()));
    for (const o of old) { o.depth = 3; o.children.forEach((c) => { c.depth = 4; }); }
    shared.children = [...shared.children, ...old];
    doc.children = doc.children.filter((c) => !old.includes(c));
    const found = DLG_KEYS.map((k) => {
      let n = shared.children.find((c) => bare(c.heading).toLowerCase() === k);
      if (!n) n = node('', 3, ['', KEY_NOTE[k] || '', '']);
      n.heading = title(k);
      n.lines = writeList(n.lines, [].concat(dlg[k]).map(itemText));
      return n;
    });
    shared.children = [...found, ...shared.children.filter((c) => !found.includes(c))];

    /* II. The cast */
    const cast = section(doc, 'The cast', 2, 'The officers, rivals and coworkers who speak at their own moments. Their lines carry no era.');
    const chars = Object.entries(dlg.cast || {}).map(([key, ch]) => {
      const n = ensure(cast, ch.name, 3, ROLE_LABEL[ch.role] + ', ' + ERA_NAME[ch.era] + ' (key ' + key + ', face ' + ch.face + ').');
      momentNodes(n, CAST_MOMENTS[ch.role], ch.lines);
      return n;
    });
    cast.children = chars;                 // a character the JSON no longer names takes its lines with it

    /* III. Customers */
    const cust = section(doc, 'Customers', 3, 'A customer face\'s own lines. Said about 3 times in 4 when the face has one for the moment; otherwise the shared pool.');
    const faces = Object.entries(dlg.people || {}).map(([face, lines]) => {
      const n = ensure(cust, face, 3, '');
      momentNodes(n, DLG_MOMENTS, lines);
      return n;
    });
    cust.children = faces;

    const secs = [shared, cast, cust];
    doc.children = [...secs, ...doc.children.filter((c) => !secs.includes(c))];
    return toMd(root);
  },

  /* { shared: {key: [line]}, cast: {NAME: {moment: [line]}}, people: {face: {moment: [line]}} }
     with the shared era floors put back as "2|" / "3|" */
  read(text) {
    const root = parseMd(text.replace(/\r\n/g, '\n'));
    const doc = root.children.find((n) => n.depth === 1);
    const sec = (name) => doc.children.find((c) => c.depth === 2 && bare(c.heading) === name);
    const out = { shared: {}, cast: {}, people: {} };
    const sh = sec('Shared lines');
    for (const k of DLG_KEYS) {
      const n = sh && sh.children.find((c) => bare(c.heading).toLowerCase() === k);
      out.shared[k] = n ? items(n) : undefined;
    }
    for (const c of (sec('The cast') || { children: [] }).children) out.cast[c.heading] = momentsOf(c);
    for (const c of (sec('Customers') || { children: [] }).children) out.people[c.heading] = momentsOf(c);
    return out;
  },
};
