/* music.md, generated from content/music/approved.json, content/levels.json
   and the songs in content/music/.

   The doc is `# music.md` (the rule paragraphs: prose, kept) over

     ## <roman>. The '70s (levels 1-6)    one per decade, in level order
       ### A. Delivery Shift              the decade's songs for each shift, in
       ### B. Kitchen Shift               approved.json's order:
                                            1. <TITLE> - <ARTIST> (<year>), from <year | the start>
                                            2. ...
                                          blank-separated. A song on both shifts
                                          is in both.
     ## <roman>. Title Screen             its note (prose), then the title's
                                          songs in order: 1. <TITLE> - <ARTIST> (<year>)

   A decade section is matched by its decade ('70s), so prose under it stays
   when its level range changes; a shift by its name. Any other `##` section
   is prose and stays where it is, renumbered. From nothing, the decades come
   first and then the title.

   What a render writes: the headings and the song lines. Display follows the
   JSON (titles and artists as stored, upper case), and a bracketed note the
   doc wrote after a title is kept after it, the way menu.md keeps one after a
   bin ("BOHEMIAN RHAPSODY (the opera section)"). A note follows its song by
   title within the list; two songs with one title (the two halves of Bohemian
   Rhapsody) take the notes in their order. Any other line is prose and stays. */
import { parseMd, toMd, roman, letter } from './engine.mjs';
import { noteOf, sameName } from './menu.mjs';
import { APPROVED, SHIFTS, songStart, songDecade, eraYears } from '../validate.mjs';

const PREAMBLE = 'Which songs play where. A level plays every song approved for its decade and its shift (Delivery or Kitchen) '
  + 'whose "from" year has arrived, shuffled fresh each time it plays, and loops them. A song never plays before its release year. '
  + 'The game reads `content/music/approved.json` and the songs in `content/music/`: those are the master copy and this page mirrors them, '
  + 'so approve and place songs in Service Mode (Music) or in the JSON.';
const TITLE = 'Title Screen';
const TITLE_NOTE = 'The title songs play in this order from the title screen through the winners and high-score screens and mode select. '
  + 'The title has no year, so the release rule does not apply to it. The auto-play demo plays the songs of the level it picks.';
const SHIFT_NAME = { delivery: 'Delivery Shift', kitchen: 'Kitchen Shift' };

const SONG = /^(\d+)\. (.+) - (.+) \((\d+)\)(?:, from .+)?$/;
const DECADE = /^The '(\d)0s\b/;
const bare = (h) => h.replace(/^[A-Z0-9]+\. /, '');
const blank = (l) => l === undefined || l.trim() === '';
const node = (heading, depth, lines = ['']) => ({ heading, depth, lines, children: [] });
const decadeOf = (c) => { const m = DECADE.exec(bare(c.heading)); return m ? m[1] : null; };

function songsOf(files) {
  const o = {};
  for (const [rel, s] of Object.entries(files)) if (/^music\/[^/]+\.json$/.test(rel) && rel !== APPROVED) o[rel.slice(6, -5)] = s;
  return o;
}

/* The node's song lines become the list's, written where the first of them
   was. Prose between them is kept, after them. `tail(id)` is what follows the
   year: ', from 1975' in a decade, nothing on the title list. */
function fillList(n, ids, music, tail) {
  const L = n.lines, kept = [], olds = [];
  let p = -1;
  for (let i = 0; i < L.length; i++) {
    const s = SONG.exec(L[i]);
    if (!s) { kept.push(L[i]); continue; }
    if (p < 0) p = kept.length;
    olds.push(s[2]);
    if (blank(L[i + 1])) i++;                    // its blank separator goes with it
  }
  if (p < 0) {                                   // none yet: after the node's last line of prose
    let last = -1;
    kept.forEach((l, i) => { if (!blank(l)) last = i; });
    p = last >= 0 ? last + 1 : kept.length;
  }
  const claimed = new Set(), block = [];
  (ids || []).forEach((id, i) => {
    const s = music[id] || { title: String(id), artist: '?', year: 0 };
    const k = olds.findIndex((t, x) => !claimed.has(x) && sameName(t, s.title));
    let note = '';
    if (k >= 0) { claimed.add(k); note = noteOf(olds[k], s.title); }
    block.push((i + 1) + '. ' + s.title + note + ' - ' + s.artist + ' (' + s.year + ')' + tail(id), '');
  });
  if (p > 0 && !blank(kept[p - 1])) block.unshift('');
  if (p < kept.length && blank(kept[p])) block.pop();
  kept.splice(p, 0, ...block);
  n.lines = kept;
}

export default {
  file: 'music.md',
  render(files, prevText) {
    const levels = ((files['levels.json'] || {}).levels || []).slice().sort((a, b) => a.n - b.n);
    const ap = files[APPROVED] || {}, music = songsOf(files);
    const eras = [...new Set(levels.map((l) => String(l.era)))];

    const root = parseMd(prevText || '');
    if (!prevText) root.lines = [];
    let doc = root.children.find((n) => n.depth === 1);
    if (!doc) { doc = node('music.md', 1, ['', PREAMBLE, '']); root.children.unshift(doc); }

    /* decade sections: by decade, then (a decade that changed) by position */
    const tens = (e) => String(levels.find((l) => String(l.era) === e).year).charAt(2);
    const oldDec = doc.children.filter((c) => decadeOf(c) !== null), claimed = new Set();
    const at = eras.map((e) => { const c = oldDec.find((x) => !claimed.has(x) && decadeOf(x) === tens(e)); if (c) claimed.add(c); return c || null; });
    const free = oldDec.filter((c) => !claimed.has(c));
    eras.forEach((e, i) => { if (!at[i] && free.length) { at[i] = free.shift(); claimed.add(at[i]); } });
    const from = (id) => { const y = songStart(ap, levels, id); return ', from ' + (y === eraYears(levels, songDecade(ap, id))[0] ? 'the start' : y); };
    const decNodes = eras.map((e, i) => {
      const n = at[i] || node('', doc.depth + 1);
      const ns = levels.filter((l) => String(l.era) === e).map((l) => l.n);
      n.heading = "The '" + tens(e) + '0s (levels ' + Math.min(...ns) + '-' + Math.max(...ns) + ')';
      const old = n.children, used = new Set();
      const shifts = SHIFTS.map((s) => {
        const c = old.find((x) => !used.has(x) && bare(x.heading) === SHIFT_NAME[s]) || node(SHIFT_NAME[s], n.depth + 1);
        used.add(c);
        c.heading = SHIFT_NAME[s];
        fillList(c, ((ap[e] || {})[s]) || [], music, from);
        return c;
      });
      const rest = old.filter((c) => !used.has(c));
      n.children = [...shifts, ...rest];
      n.children.forEach((c, j) => { c.heading = letter(j) + '. ' + bare(c.heading); });
      return n;
    });

    let title = doc.children.find((c) => bare(c.heading) === TITLE);
    if (!title) title = node(TITLE, doc.depth + 1, ['', TITLE_NOTE, '']);
    title.heading = TITLE;
    fillList(title, ap.title, music, () => '');

    /* the decades go where the doc's first one was (first of all, from
       nothing); the title and every other section stay in place, and a new
       title goes last */
    const out = [];
    let placed = false;
    for (const c of doc.children) {
      if (decadeOf(c) === null) { out.push(c); continue; }
      if (!placed) { out.push(...decNodes); placed = true; }
    }
    if (!placed) out.unshift(...decNodes);
    if (!out.includes(title)) out.push(title);
    doc.children = out;
    doc.children.forEach((c, i) => { c.heading = roman(i + 1) + '. ' + bare(c.heading); });
    return toMd(root);
  },
};
