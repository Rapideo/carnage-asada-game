/* dialogue.md, generated from content/dialogue.json.

   This doc is NEW: unlike the others it did not exist before Service Mode, so
   it is born from the JSON and the JSON stays its master copy.

   The doc is `# dialogue.md` (a one-paragraph preamble) over one section per
   key of DLG_KEYS, in that order, headed `## <roman>. <Key>`. Each section is
   a numbered list of the key's lines in JSON form (quoted, as stored, upper
   case), with the era floor written after the line instead of before it:

     3. "TIME IS MONEY, TACO BOY!" (1980s on)      <- stored as "2|TIME IS ..."
     11. "MY PAGER'S GOING OFF. HURRY!" (1990s on) <- stored as "3|MY PAGER'S ..."

   `who` is a single string and reads as a one-item list.

   What a render writes: the headings and the numbered list. What it keeps: the
   preamble (written once, then it is prose), the one-line note under each
   heading, any other prose, and any indented continuation line under a list
   item, which stays with the item at the same position. A section the doc does
   not have is added at the end; one the JSON does not know is left alone.

   read(text) reads the lines back out, for the round-trip test. */
import { parseMd, toMd, roman } from './engine.mjs';
import { DLG_KEYS } from '../validate.mjs';

const PREAMBLE = 'The customer\'s lines over the dialogue strip, in both halves of the game. One section per key; '
  + 'a line tagged (1980s on) or (1990s on) is only said from that era, so nobody quotes a film that has not come out yet. '
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

export default {
  file: 'dialogue.md',
  render(files, prevText) {
    const dlg = files['dialogue.json'];
    const root = parseMd(prevText || '');
    if (!prevText) root.lines = [];
    let doc = root.children.find((n) => n.depth === 1);
    if (!doc) { doc = node('dialogue.md', 1, ['', PREAMBLE, '']); root.children.unshift(doc); }
    const found = DLG_KEYS.map((k, i) => {
      let n = doc.children.find((c) => bare(c.heading).toLowerCase() === k);
      if (!n) n = node('', 2, ['', KEY_NOTE[k] || '', '']);
      n.heading = roman(i + 1) + '. ' + title(k);
      n.lines = writeList(n.lines, [].concat(dlg[k]).map(itemText));
      return n;
    });
    doc.children = [...found, ...doc.children.filter((c) => !found.includes(c))];
    return toMd(root);
  },

  /* { key: [line, ...] } with the era floors put back as "2|" / "3|" */
  read(text) {
    const root = parseMd(text.replace(/\r\n/g, '\n'));
    const doc = root.children.find((n) => n.depth === 1);
    const out = {};
    for (const k of DLG_KEYS) {
      const n = doc.children.find((c) => bare(c.heading).toLowerCase() === k);
      out[k] = n ? n.lines.filter((l) => ITEM.test(l)).map((l) => {
        const m = /^\d+\. ("(?:[^"\\]|\\.)*")(?: \((1980s|1990s) on\))?$/.exec(l);
        return m ? (m[2] ? ERA_BACK[m[2]] : '') + JSON.parse(m[1]) : undefined;
      }) : undefined;
    }
    return out;
  },
};
