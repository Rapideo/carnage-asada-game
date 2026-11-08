/* faces.md, generated from content/casts.json and content/faces/*.json.

   NEW with Service Mode, like dialogue.md: born from the JSON, which stays its
   master copy.

   The doc is `# faces.md` (a one-paragraph preamble) over one section per era
   of casts.json, `## <roman>. Era <n>`, then `## <roman>. Not in a cast` for
   every baked face no era names (smokerbust, the dialogue default, today).
   Under each, one `### <letter>. <name>` per face, in cast order, with

     - Size : 60x74
     - Eyes : set by hand (2) | detected (2) | none, set by hand | not set

   What a render writes: the headings and those two fields. What it keeps: the
   preamble (written once, then it is prose), the note under each era, and any
   prose under a face, which is matched to the face by NAME, not by position,
   so it follows the face when the cast is reordered or a face moves era.

   read(text) reads the casts and fields back out, for the round-trip test. */
import { parseMd, toMd, setField, roman, letter } from './engine.mjs';

const PREAMBLE = 'The customers\' faces: who can walk in, in each era, and the state of each baked face. '
  + 'A customer is drawn from their era\'s cast, and the same face speaks for the life of their ticket. '
  + 'The game reads `content/casts.json` and `content/faces/`: those are the master copy and this page mirrors them, '
  + 'so edit the casts and set the eyes in Service Mode (Faces) or in the JSON. A face blinks only once its eyes are set.';
const ERA_NOTE = { 1: 'The 1970s.', 2: 'The 1980s.', 3: 'The 1990s.' };
const UNCAST = 'Not in a cast';
const UNCAST_NOTE = 'Baked, and shipped with the game (everything in `content/faces/` is), but no era casts them. '
  + '`smokerbust` is the dialogue default: the strip falls back to it when a face is missing.';

const bare = (h) => h.replace(/^[A-Z0-9]+\. /, '');
const node = (heading, depth, lines) => ({ heading, depth, lines, children: [] });

export function eyesText(f) {
  const n = Array.isArray(f && f.eyes) ? f.eyes.length : 0;
  if (f && f._eyesByHand) return n ? 'set by hand (' + n + ')' : 'none, set by hand';
  return n ? 'detected (' + n + ')' : 'not set';
}

/* the section's children become one node per name, reusing a child of the
   same name (its prose and all) wherever it was */
function syncFaces(sec, names, faces, pool, used, from) {
  sec.children = names.map((n, i) => {
    let c = sec.children.find((x) => bare(x.heading) === n && !used.has(x)) || (pool.has(n) && !used.has(pool.get(n)) ? pool.get(n) : null);
    if (!c) c = node('', 3, ['']);
    used.add(c);
    c.heading = letter(i) + '. ' + n;
    const f = faces[n];
    setField(c, 'Size', f ? f.w + 'x' + f.h : 'missing', { match: /^(\d+x\d+|missing)\b/ });
    setField(c, 'Eyes', eyesText(f), { match: /^(set by hand \(\d+\)|detected \(\d+\)|none, set by hand|not set)/ });
    if (from) setField(c, 'From', from[n] ? String(from[n]) : 'the start of the era', { match: /^(\d{4}|the start of the era)\b/ });
    return c;
  });
}

export default {
  file: 'faces.md',
  render(files, prevText) {
    const casts = files['casts.json'] || {};
    const faces = {};
    for (const [rel, f] of Object.entries(files)) if (/^faces\/[^/]+\.json$/.test(rel)) faces[rel.slice(6, -5)] = f;
    const eras = Object.keys(casts).filter((k) => /^\d+$/.test(k)).sort((a, b) => a - b);
    const cast = new Set(eras.flatMap((k) => casts[k]));
    const uncast = Object.keys(faces).sort().filter((n) => !cast.has(n));

    const root = parseMd(prevText || '');
    if (!prevText) root.lines = [];
    let doc = root.children.find((n) => n.depth === 1);
    if (!doc) { doc = node('faces.md', 1, ['', PREAMBLE, '']); root.children.unshift(doc); }

    /* every face node anywhere, by name, so a face that changes era keeps its prose */
    const pool = new Map();
    for (const s of doc.children) for (const c of s.children) if (!pool.has(bare(c.heading))) pool.set(bare(c.heading), c);

    const used = new Set();
    const from = casts.from && typeof casts.from === 'object' ? casts.from : {};
    const want = [...eras.map((k) => ['Era ' + k, casts[k], ERA_NOTE[k] || '', from]), [UNCAST, uncast, UNCAST_NOTE, null]];
    const found = want.map(([title, names, note, fr], i) => {
      let s = doc.children.find((c) => bare(c.heading) === title);
      if (!s) s = node('', 2, ['', note, '']);
      s.heading = roman(i + 1) + '. ' + title;
      syncFaces(s, names, faces, pool, used, fr);
      return s;
    });
    doc.children = [...found, ...doc.children.filter((c) => !found.includes(c))];
    return toMd(root);
  },

  /* { casts: { '1': [name, ...] }, faces: { name: { size, eyes } } } */
  read(text) {
    const root = parseMd(text.replace(/\r\n/g, '\n'));
    const doc = root.children.find((n) => n.depth === 1);
    const casts = {}, faces = {};
    const field = (c, k) => { const l = c.lines.find((x) => x.startsWith('- ' + k + ' : ')); return l ? l.slice(k.length + 5) : undefined; };
    for (const s of doc.children) {
      const m = /^Era (\d+)$/.exec(bare(s.heading));
      const names = s.children.map((c) => bare(c.heading));
      if (m) casts[m[1]] = names;
      for (const c of s.children) faces[bare(c.heading)] = { size: field(c, 'Size'), eyes: field(c, 'Eyes') };
    }
    return { casts, faces };
  },
};
