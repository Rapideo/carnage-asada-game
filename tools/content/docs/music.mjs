/* music.md, generated from content/music/playlist.json, content/levels.json
   and the songs in content/music/.

   The doc is `# music.md` (the rule paragraphs: prose, kept) over

     ## <roman>. <year>          one per level year, in level order
       ### A. Delivery Shift     one per level of that year, lettered in level
       ### B. Kitchen Shift      order: Delivery for a delivery level, Kitchen
                                 for a kitchen one. Each holds
                                   Level <n>, <Season> <year>.
                                   1. <TITLE> - <ARTIST> (<year>)
                                   2. ...
                                 blank-separated, one numbered line per song in
                                 the level's list, however long it is.
     ## <roman>. Title Screen    its note (prose), then the title's songs, the
                                 same numbered lines.

   From nothing the title section comes first; in a doc that has one it stays
   where it is (today's music.md keeps it after the years), and every other
   `##` section is prose and stays in place, renumbered.

   What a render writes: the headings, the Level line and the song lines.
   Display follows the JSON's form (titles and artists as stored, upper case),
   and a bracketed note the doc wrote after a title is kept after it, the way
   menu.md keeps one after a bin ("BOHEMIAN RHAPSODY (the opera section)"). A
   note follows its song by title within the list; two songs with one title
   (the two halves of Bohemian Rhapsody) take the notes in their order. Any
   other line in a section is prose and stays: a shift node is matched to its
   level by the number on its Level line, so prose moves with the level, and a
   year section whose year changes keeps its prose under the new year.

   read(text, music) reads the lists back as song ids, for the round-trip test. */
import { parseMd, toMd, roman, letter } from './engine.mjs';
import { noteOf, sameName } from './menu.mjs';

const PREAMBLE = 'The songs each level plays, and the title\'s. Each list plays in order and then loops. '
  + 'A level may only play songs from its own year or up to 2 years before it, never after. '
  + 'The game reads `content/music/playlist.json` and the songs in `content/music/`: those are the master copy and this page mirrors them, '
  + 'so edit the lists in Service Mode (Music) or in the JSON.';
const TITLE = 'Title Screen';
const TITLE_NOTE = 'The title songs play from the title screen through the winners and high-score screens and mode select. '
  + 'The title has no year, so the year rule does not apply to it. The auto-play demo plays the songs of the level it picks.';

const SONG = /^(\d+)\. (.+) - (.+) \((\d+)\)$/;
const LEVEL = /^Level (\d+), .*\.$/;
const bare = (h) => h.replace(/^[A-Z0-9]+\. /, '');
const blank = (l) => l === undefined || l.trim() === '';
const cap = (s) => String(s).charAt(0).toUpperCase() + String(s).slice(1);
const node = (heading, depth, lines = ['']) => ({ heading, depth, lines, children: [] });
const shiftName = (lv) => (lv.type === 'kitchen' ? 'Kitchen Shift' : 'Delivery Shift');
const levelLine = (lv) => 'Level ' + lv.n + ', ' + cap(lv.season) + ' ' + lv.year + '.';
const levelOf = (c) => { for (const l of c.lines) { const m = LEVEL.exec(l); if (m) return Number(m[1]); } return null; };
const isList = (c) => levelOf(c) !== null || c.lines.some((l) => SONG.test(l));
const yearOf = (c) => { const m = /^(\d{4})$/.exec(bare(c.heading)); return m ? Number(m[1]) : null; };

/* the playlist file, in either of the shapes the validator accepts */
function listsOf(raw) {
  raw = raw || {};
  return raw.levels && typeof raw.levels === 'object' && !Array.isArray(raw.levels) ? { ...raw.levels, title: raw.title } : raw;
}
function songsOf(files) {
  const o = {};
  for (const [rel, s] of Object.entries(files)) if (/^music\/[^/]+\.json$/.test(rel) && rel !== 'music/playlist.json') o[rel.slice(6, -5)] = s;
  return o;
}

/* The node's Level line (when `lvLine` is given) and song lines become the
   list's, written where the first of them was. Prose between them is kept,
   after them. */
function fillList(n, ids, music, lvLine) {
  const L = n.lines, kept = [], olds = [];
  let p = -1;
  for (let i = 0; i < L.length; i++) {
    const s = SONG.exec(L[i]), lv = lvLine !== null && LEVEL.test(L[i]);
    if (!s && !lv) { kept.push(L[i]); continue; }
    if (p < 0) p = kept.length;
    if (s) olds.push(s[2]);
    if (blank(L[i + 1])) i++;                    // its blank separator goes with it
  }
  if (p < 0) {                                   // none yet: after the node's last line of prose
    let last = -1;
    kept.forEach((l, i) => { if (!blank(l)) last = i; });
    p = last >= 0 ? last + 1 : kept.length;
  }
  const claimed = new Set(), block = [];
  if (lvLine !== null) block.push(lvLine, '');
  (ids || []).forEach((id, i) => {
    const s = music[id] || { title: String(id), artist: '?', year: 0 };
    const k = olds.findIndex((t, x) => !claimed.has(x) && sameName(t, s.title));
    let note = '';
    if (k >= 0) { claimed.add(k); note = noteOf(olds[k], s.title); }
    block.push((i + 1) + '. ' + s.title + note + ' - ' + s.artist + ' (' + s.year + ')', '');
  });
  if (p > 0 && !blank(kept[p - 1])) block.unshift('');
  if (p < kept.length && blank(kept[p])) block.pop();
  kept.splice(p, 0, ...block);
  n.lines = kept;
}

/* a year section's children: one shift node per level of that year, matched
   by level number, else by position among the old list nodes; prose-only
   subsections stay after them */
function syncShifts(yn, lvls, pl, music) {
  const old = yn.children, claimed = new Set();
  const at = lvls.map((lv) => { const c = old.find((x) => !claimed.has(x) && levelOf(x) === lv.n); if (c) claimed.add(c); return c || null; });
  const free = old.filter((c) => !claimed.has(c) && isList(c));
  lvls.forEach((lv, i) => { if (!at[i] && free.length) { at[i] = free.shift(); claimed.add(at[i]); } });
  const rest = old.filter((c) => !claimed.has(c) && !isList(c));
  const shifts = lvls.map((lv, i) => {
    const n = at[i] || node('', yn.depth + 1);
    n.heading = shiftName(lv);
    fillList(n, pl[String(lv.n)], music, levelLine(lv));
    return n;
  });
  yn.children = [...shifts, ...rest];
  yn.children.forEach((c, i) => { c.heading = letter(i) + '. ' + (shifts.includes(c) ? c.heading : bare(c.heading)); });
}

export default {
  file: 'music.md',
  render(files, prevText) {
    const levels = ((files['levels.json'] || {}).levels || []).slice().sort((a, b) => a.n - b.n);
    const pl = listsOf(files['music/playlist.json']), music = songsOf(files);
    const years = [...new Set(levels.map((l) => l.year))];

    const root = parseMd(prevText || '');
    if (!prevText) root.lines = [];
    let doc = root.children.find((n) => n.depth === 1);
    if (!doc) { doc = node('music.md', 1, ['', PREAMBLE, '']); root.children.unshift(doc); }

    /* year sections: by year, then (a year that changed) by position */
    const oldYears = doc.children.filter((c) => yearOf(c) !== null), claimed = new Set();
    const at = years.map((y) => { const c = oldYears.find((x) => !claimed.has(x) && yearOf(x) === y); if (c) claimed.add(c); return c || null; });
    const free = oldYears.filter((c) => !claimed.has(c));
    years.forEach((y, i) => { if (!at[i] && free.length) { at[i] = free.shift(); claimed.add(at[i]); } });
    const yearNodes = years.map((y, i) => {
      const n = at[i] || node('', doc.depth + 1);
      n.heading = String(y);
      syncShifts(n, levels.filter((l) => l.year === y), pl, music);
      return n;
    });

    let title = doc.children.find((c) => bare(c.heading) === TITLE);
    const hadTitle = !!title;
    if (!title) title = node(TITLE, doc.depth + 1, ['', TITLE_NOTE, '']);
    title.heading = TITLE;
    fillList(title, pl.title, music, null);

    /* the years go where the doc has them; everything else stays in place */
    const firstAt = doc.children.findIndex((c) => yearOf(c) !== null);
    const others = (cs) => cs.filter((c) => yearOf(c) === null);
    let before, after;
    if (firstAt < 0) { before = []; after = others(doc.children); }
    else { before = others(doc.children.slice(0, firstAt)); after = others(doc.children.slice(firstAt)); }
    if (!hadTitle) before.unshift(title);
    doc.children = [...before, ...yearNodes, ...after];
    if (firstAt < 0 && hadTitle) doc.children = [title, ...yearNodes, ...after.filter((c) => c !== title)];
    doc.children.forEach((c, i) => { c.heading = roman(i + 1) + '. ' + bare(c.heading); });
    return toMd(root);
  },

  /* { '1': [id, ...], ..., title: [id, ...] }: each list's song lines,
     resolved to ids by title (note aside), artist and year */
  read(text, music = {}) {
    const root = parseMd(text.replace(/\r\n/g, '\n'));
    const doc = root.children.find((n) => n.depth === 1);
    const ids = (n) => {
      const used = new Set();
      return n.lines.map((l) => SONG.exec(l)).filter(Boolean).map((m) => {
        const hits = Object.keys(music).filter((k) => {
          const s = music[k];
          return s && sameName(m[2], s.title) && String(s.artist).toUpperCase() === m[3].toUpperCase() && String(s.year) === m[4];
        });
        const id = hits.find((k) => !used.has(k)) || hits[0] || null;
        used.add(id);
        return id;
      });
    };
    const out = {};
    let title = [];
    for (const s of doc ? doc.children : []) {
      if (bare(s.heading) === TITLE) title = ids(s);
      else if (yearOf(s) !== null) for (const c of s.children) { const n = levelOf(c); if (n !== null) out[String(n)] = ids(c); }
    }
    out.title = title;
    return out;
  },
};
