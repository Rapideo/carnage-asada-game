/* attract.md, generated from content/attract.json and content/winners.json.

   The doc is `# attract.md` over `## I. Sequence` (prose, and the loop total)
   and `## II. Screens`, whose children are the four screens in loop order,
   found by NAME and re-lettered A-D from that order:
     title    Title Screen      winners  Winners Screen
     scores   High Scores       demo     Auto-Play

   Every value line the doc had on 2026-11-07, audited, and where it comes from.
   <tail> is the rest of the line, kept verbatim: only the leading value is
   rewritten.

     node            doc line (key : value)                         JSON
     --------------  ---------------------------------------------  -------------------------------
     Sequence        One loop is 1:20.<tail>  (a prose line)        the four seconds summed (m:ss)
     Title Screen    Duration : 0:15 seconds<tail>                  attract title.seconds
     Title Screen    Wordmark : ... CARNAGE ASADA grows in          attract title.wordmarkHold: only
                       from 0:01 over 2 seconds ...                   the "from m:ss" in the item (its
                                                                      wrapped line here) is rewritten
     Winners Screen  Duration : 0:10 seconds<tail>                  attract winners.seconds
     Winners Screen  Message : <lines>                              winners slogan
     Winners Screen  Attribution as drawn : <lines>                 winners attribution
     Winners Screen  Credit : CREDIT: 0                             winners credit
     High Scores     Duration : 0:10 seconds<tail>                  attract scores.seconds
     Auto-Play       Duration : 0:45 seconds<tail>                  attract demo.seconds
     Auto-Play       Levels : RANDOM | 2, 5, 9<tail>                attract demo.levels

   <lines> is a string, or the list's lines joined by " / " (the JSON's form:
   upper case as stored, quotes and all), and reads back the same way. Times
   are m:ss, with a fraction when there is one ("0:07.5"), as the doc already
   writes the IN beat.

   Lines that look like values but are PROSE (no JSON behind them; kept verbatim):
     FBI Director : Kash P.V. Patel           (a note on the attribution)
     Overlay Text : Press ESC to Return ...   (the demo's caption is game code)
     Music : the title songs ...              (music.md and playlist.json own it)
     "`IN` appears at 0:00.5" and "over 2 seconds" in the Wordmark item
                                              (TAG_HOLD and TITLE_GROW, game code)
     the numbered screen list under Sequence, and the notes nested under Levels

   The factory high-score board (scores.json) has no line in this doc and is
   not added: the Attract panel edits it, the doc never listed it.

   read(text) reads the values back out, for the round-trip test. */
import { parseMd, toMd, setField, findField, letter, roman } from './engine.mjs';

const SCREENS = [
  { key: 'title', names: ['Title Screen'] },
  { key: 'winners', names: ['Winners Screen'] },
  { key: 'scores', names: ['High Scores', 'High Scores Screen'] },
  { key: 'demo', names: ['Auto-Play', 'Auto Play'] },
];

const TIME = '\\d+:\\d\\d(?:\\.\\d+)?';
const DURATION = new RegExp('^' + TIME + ' seconds\\b', 'i');
const LOOP = new RegExp('^One loop is ' + TIME);
const FROM = new RegExp('\\bfrom ' + TIME);
const LEVELS = /^(?:RANDOM\b|\d+(?:, *\d+)*)/i;

/* 80 -> "1:20", 7.5 -> "0:07.5" */
export const mss = (s) => {
  const m = Math.floor(s / 60), r = s - m * 60, w = Math.floor(r), f = Number((r - w).toFixed(2));
  return m + ':' + String(w).padStart(2, '0') + (f ? String(f).slice(1) : '');
};
const secsOf = (t) => { const [m, s] = t.split(':'); return Number(m) * 60 + Number(s); };
const linesText = (v) => [].concat(v).join(' / ');
const levelsText = (v) => (v === 'random' ? 'RANDOM' : [].concat(v).join(', '));

const bare = (h) => h.replace(/^[A-Z0-9]+\. /, '');
const named = (n, names) => names.some((x) => x.toLowerCase() === bare(n.heading).toLowerCase());
const cont = (l) => l !== undefined && /^\s+\S/.test(l);

/* [start, end) of a field item: its line and its indented continuation */
function itemRange(node, key) {
  const i = findField(node, key);
  if (i < 0) return null;
  let j = i + 1;
  while (cont(node.lines[j])) j++;
  return [i, j];
}

function writeHold(node, hold) {
  const r = itemRange(node, 'Wordmark');
  if (!r) return setField(node, 'Wordmark', 'CARNAGE ASADA grows in from ' + mss(hold));
  for (let j = r[0]; j < r[1]; j++) {
    if (!FROM.test(node.lines[j])) continue;
    node.lines[j] = node.lines[j].replace(FROM, 'from ' + mss(hold));
    return;
  }
}

function fill(node, key, att, win) {
  setField(node, 'Duration', mss(att[key].seconds) + ' seconds', { match: DURATION });
  if (key === 'title') writeHold(node, att.title.wordmarkHold);
  if (key === 'winners') {
    setField(node, 'Message', linesText(win.slogan), { match: /^.*/ });
    setField(node, 'Attribution as drawn', linesText(win.attribution), { match: /^.*/ });
    setField(node, 'Credit', String(win.credit), { match: /^.*/ });
  }
  if (key === 'demo') setField(node, 'Levels', levelsText(att.demo.levels), { match: LEVELS });
}

const SKELETON = '# attract.md\n\n## I. Sequence\n\nOne loop is 0:00.\n\n## II. Screens\n';

function section(doc, name, at) {
  let n = doc.children.find((c) => bare(c.heading) === name);
  if (!n) { n = { heading: roman(at + 1) + '. ' + name, depth: doc.depth + 1, lines: [''], children: [] }; doc.children.splice(at, 0, n); }
  return n;
}

export default {
  file: 'attract.md',
  render(files, prevText) {
    const att = files['attract.json'], win = files['winners.json'];
    const root = parseMd(prevText || SKELETON);
    let doc = root.children.find((n) => n.depth === 1);
    if (!doc) { doc = { heading: 'attract.md', depth: 1, lines: ['', ''], children: [] }; root.children.unshift(doc); }

    const total = SCREENS.reduce((s, { key }) => s + att[key].seconds, 0);
    const seq = doc.children.find((c) => bare(c.heading) === 'Sequence');
    if (seq) seq.lines = seq.lines.map((l) => l.replace(LOOP, 'One loop is ' + mss(total)));

    const scr = section(doc, 'Screens', doc.children.length);
    const found = SCREENS.map(({ key, names }) => {
      let n = scr.children.find((c) => named(c, names));
      if (!n) n = { heading: names[0], depth: scr.depth + 1, lines: [''], children: [] };
      fill(n, key, att, win);
      return n;
    });
    found.forEach((n, i) => { n.heading = letter(i) + '. ' + bare(n.heading); });
    scr.children = [...found, ...scr.children.filter((c) => !found.includes(c))];
    return toMd(root);
  },

  /* the values a render wrote, read back: the shape of attract.json's screens
     plus winners.json's three fields (lines always as a list) */
  read(text) {
    const root = parseMd(text.replace(/\r\n/g, '\n'));
    const doc = root.children.find((n) => n.depth === 1);
    const scr = doc.children.find((c) => bare(c.heading) === 'Screens');
    const node = (names) => scr.children.find((c) => named(c, names));
    const val = (n, key) => { const i = findField(n, key); return i < 0 ? undefined : n.lines[i].slice(n.lines[i].indexOf(':') + 1).replace(/^ */, ''); };
    const dur = (n) => { const v = val(n, 'Duration'); return v === undefined ? undefined : secsOf(new RegExp('^' + TIME).exec(v)[0]); };
    const out = {}, copy = {};
    for (const { key, names } of SCREENS) {
      const n = node(names);
      out[key] = { seconds: dur(n) };
      if (key === 'title') {
        const r = itemRange(n, 'Wordmark'), m = r && n.lines.slice(r[0], r[1]).join(' ').match(FROM);
        out.title.wordmarkHold = m ? secsOf(m[0].slice(5)) : undefined;
      }
      if (key === 'demo') {
        const v = LEVELS.exec(val(n, 'Levels') || '');
        out.demo.levels = !v ? undefined : /^random/i.test(v[0]) ? 'random' : v[0].split(',').map((s) => Number(s.trim()));
      }
      if (key === 'winners') {
        copy.slogan = (val(n, 'Message') || '').split(' / ');
        copy.attribution = (val(n, 'Attribution as drawn') || '').split(' / ');
        copy.credit = val(n, 'Credit');
      }
    }
    return { ...out, ...copy };
  },
};
