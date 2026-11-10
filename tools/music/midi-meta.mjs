/* What a MIDI file says about itself: { title, artist, year } for Service Mode's
   Convert form (owner, 2026-11-09: "read the metadata from that MIDI document and
   automatically fill those fields out"). No imports, pure: the server reads the
   file and hands the bytes here.

   Where it looks, best first:
     1. labelled text, in any text, copyright, track-name, marker or cue event:
        "Title: X" / "Song = X", "Artist: X" / "Band: X" / "By: X",
        "Year: 1985" / "Released: March 1986" / "Date: 1986-03"
     2. the first track's name as "Artist - Title" (or "Title (1985)")
     3. a quoted "Title" in a text or marker event, and a "made famous by X",
        "originally by X" or "performed by X" line for the artist
     4. the file name, split into words, for the title alone
   A copyright year is the sequencer's, never the song's, so a year is taken only
   when it is labelled or in brackets after a title. Everything comes back in
   capitals and in characters the game's 5x7 font can draw; a field nothing names
   is '' (or null for the year). It never throws: a file that is not a MIDI
   still gets its file name. */

const TEXT_TYPES = new Set([1, 2, 3, 6, 7]);     // text, copyright, track name, marker, cue
const GENERIC = /^(midi|untitled|track ?\d*|seq(uence)?(-\d+)?|piano|drums?|bass|guitar|lead|melody|strings?|organ|synth|vocals?|percussion|clean gtr|.*\b(gtr|bass|drums|kit)\b.*)$/i;

/* the text events, in file order: [{ type, track, text }] */
export function midiTexts(buf) {
  const out = [];
  const b = buf;
  if (!b || b.length < 14 || String.fromCharCode(b[0], b[1], b[2], b[3]) !== 'MThd') return out;
  let p = 8 + ((b[4] << 24) | (b[5] << 16) | (b[6] << 8) | b[7]);
  for (let track = 0; p + 8 <= b.length && track < 64; track++) {
    if (String.fromCharCode(b[p], b[p + 1], b[p + 2], b[p + 3]) !== 'MTrk') break;
    const len = ((b[p + 4] << 24) | (b[p + 5] << 16) | (b[p + 6] << 8) | b[p + 7]) >>> 0, end = Math.min(b.length, p + 8 + len);
    p += 8;
    let rs = 0;
    const vlq = () => { let v = 0, c, n = 0; do { c = b[p++]; v = (v << 7) | (c & 127); } while ((c & 128) && ++n < 4 && p < end); return v; };
    while (p < end) {
      vlq();                                         // delta time
      const s = b[p];
      if (s === 0xff) {
        const ty = b[p + 1]; p += 2;
        const l = vlq();
        if (TEXT_TYPES.has(ty)) out.push({ type: ty, track, text: decode(b.subarray(p, Math.min(end, p + l))) });
        p += l;
      } else if (s === 0xf0 || s === 0xf7) { p++; p += vlq(); }
      else {
        if (s & 0x80) { rs = s; p++; }
        if (!rs) break;                              // running status with nothing to run: give up on this track
        const hi = rs & 0xf0;
        p += hi === 0xc0 || hi === 0xd0 ? 1 : 2;
      }
    }
    p = end;
  }
  return out;
}

/* UTF-8 when it decodes cleanly, else Latin-1 (old sequencers) */
function decode(bytes) {
  try { return new TextDecoder('utf-8', { fatal: true }).decode(bytes); } catch { return new TextDecoder('latin1').decode(bytes); }
}

/* as the game draws it: capitals, straight quotes, no accents, only the font's characters */
export function gameText(s) {
  return String(s || '')
    .replace(/[‘’‚′`]/g, "'").replace(/[“”„″]/g, '"').replace(/[–—]/g, '-')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9 .,:;!?$+\-/\\%#()[\]*=<>'"_&@^~]/g, '')
    .replace(/\s+/g, ' ').trim().slice(0, 80);
}

const YEAR = /\b(19[0-9]{2}|20[0-9]{2})\b/;
const label = (re) => (t) => { const m = re.exec(t); return m ? m[1].trim() : null; };
const TITLE_L = label(/^\s*(?:title|song|song title|name)\s*[:=]\s*(.+)$/i);
const ARTIST_L = label(/^\s*(?:artist|band|performer|performed by|by|group)\s*[:=]\s*(.+)$/i);
const YEAR_L = (t) => { const m = /^\s*(?:year|date|released?|release date)\s*[:=]\s*(.*)$/i.exec(t); const y = m && YEAR.exec(m[1]); return y ? +y[1] : null; };
const ARTIST_BY = label(/\b(?:made famous by|originally (?:by|performed by)|performed by|as recorded by|recorded by)\s+(.+?)\s*$/i);

/* "Black Dog (1971)" -> ["Black Dog", 1971] */
function splitYear(t) {
  const m = /^(.*?)\s*[([]\s*(19[0-9]{2}|20[0-9]{2})\s*[)\]]\s*$/.exec(t);
  return m ? [m[1], +m[2]] : [t, null];
}

/* "80s/HazyShadeOfWinter.mid" -> "HAZY SHADE OF WINTER" */
export function titleFromFile(file) {
  const base = String(file || '').split(/[\\/]/).pop().replace(/\.midi?$/i, '');
  return gameText(base.replace(/[_]+/g, ' ').replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2').replace(/([a-zA-Z])(\d)/g, '$1 $2'));
}

/* letters and digits only, for comparing a candidate with the file's name */
const flat = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
/* a sequencer's credit, a demo label, an address: never an artist */
const CREDIT = /(\bsequenc|\bseq\.|\bmidi\b|\bby\s*:|@|www\.|\.(com|net|org)\b|winjammer|\bdemo\b|written|words and music|produced|copyright|\(c\))/i;
/* an artist side: drop a credit, and read a "/1989" or ", 1989" stuck on the end */
function artistSide(s) {
  const m = /^(.*?)\s*[/,]\s*(19[0-9]{2}|20[0-9]{2})\s*$/.exec(s.trim());
  const name = m ? m[1] : s.trim();
  return { artist: !CREDIT.test(name) && /[a-z]/i.test(name) ? name : null, year: m ? +m[2] : null };
}

const tidy = (s) => String(s || '').split(';')[0].replace(/_/g, ' ').replace(/\s+by\s*$/i, '').replace(/["\u201c\u201d]/g, '').replace(/\s+-\s+seq\..*$/i, '').replace(/\s+midi$/i, '').replace(/[\s.<>~*_#-]+$/, '').trim();

export function readMidiMeta(buf, file) {
  let texts = [];
  try { texts = midiTexts(buf); } catch { texts = []; }
  let title = null, artist = null, year = null;
  /* 1. labelled text wins */
  for (const { text } of texts) {
    title = title || TITLE_L(text);
    artist = artist || ARTIST_L(text);
    if (year === null) year = YEAR_L(text);
  }
  /* 2. unlabelled text, used only where it agrees with the file's name: an untagged
     library names tracks after instruments, sequencers and demo discs */
  const fileTitle = titleFromFile(file), fn = flat(fileTitle);
  /* agrees: one contains the other, and covers most of it ("RAN" is not "I RAN SO FAR AWAY") */
  const fits = (s, k = 0.6) => { const n = flat(s); return n.length >= 3 && fn.length >= 3 && (fn.includes(n) || n.includes(fn)) && Math.min(n.length, fn.length) / Math.max(n.length, fn.length) >= k; };
  const cands = [...texts.filter((x) => x.type === 3), ...texts.filter((x) => x.type !== 3)];
  for (const { text } of cands) {
    if (title && artist) break;
    const raw = tidy(text);
    if (!raw || GENERIC.test(raw) || /^\s*(sequenc|seq\.|midi by|transcribed|arranged)/i.test(raw)) continue;
    const [body, y] = splitYear(raw);
    const dash = body.split(/\s+[-–—]+\s+|\s*--+\s*/).filter((x) => x.trim());
    const by = body.split(/\s+by\s+/i);
    let got = null;
    /* split into artist and title, the title may be a smaller share of a file name that holds both */
    if (dash.length === 2 && fits(dash[1], 0.4)) got = [dash[1], dash[0]];
    else if (dash.length === 2 && fits(dash[0], 0.4)) got = [dash[0], dash[1]];
    else if (by.length === 2 && fits(by[0], 0.4) && !CREDIT.test(by[0])) got = [by[0], by[1]];
    else if (fits(body) && !CREDIT.test(body)) got = [body, null];
    if (!got) continue;
    if (!title) title = got[0];
    if (got[1] && !artist) { const s = artistSide(got[1]); artist = s.artist; if (year === null && s.year) year = s.year; }
    if (year === null && y) year = y;
  }
  /* 3. a "made famous by" line for the artist */
  for (const { text } of texts) if (!artist && !/\b(sequenc|seq\.|midi|transcrib|arrang|programm)/i.test(text)) { const b = ARTIST_BY(text); if (b && !CREDIT.test(b)) { const s = artistSide(b); artist = s.artist; if (year === null && s.year) year = s.year; } }
  if (title) { const [tt, y] = splitYear(title); title = tt; if (year === null && y) year = y; }
  /* a year stuck on the artist, however it was found: "Tom Petty/1989" */
  if (artist) { const m = /^(.*?)\s*[/,]\s*(19[0-9]{2}|20[0-9]{2})\s*$/.exec(artist.trim()); if (m) { artist = m[1]; if (year === null) year = +m[2]; } }
  return { title: gameText(tidy(title)) || fileTitle, artist: gameText(tidy(artist)), year };
}

/* only what the file says in labelled text ("Title: X", "Artist: Y", "Year: 1985"):
   the owner's own tags, which nothing overrides */
export function readMidiLabels(buf) {
  let texts = [];
  try { texts = midiTexts(buf); } catch { texts = []; }
  let title = null, artist = null, year = null;
  for (const { text } of texts) {
    title = title || TITLE_L(text);
    artist = artist || ARTIST_L(text);
    if (year === null) year = YEAR_L(text);
  }
  return { title: title ? gameText(tidy(title)) : '', artist: artist ? gameText(tidy(artist)) : '', year };
}

/* What the Convert form starts from, field by field: the file's labelled tags,
   then the catalog (tools/music/midi-catalog.json: Claude's title, artist and
   year for each library MIDI), then what the file's other text and name suggest.
   `guess` is true when a catalog guess is shown and the tags did not settle it. */
export function bestMeta(buf, file, catalog) {
  const L = readMidiLabels(buf), c = (catalog && catalog[file]) || null, r = readMidiMeta(buf, file);
  const title = L.title || (c && c.title) || r.title;
  const artist = L.artist || (c && c.artist) || r.artist;
  const year = L.year !== null ? L.year : c && Number.isInteger(c.year) ? c.year : r.year;
  return { title, artist, year, guess: !!(c && c.guess && !(L.title && L.artist && L.year !== null)) };
}
