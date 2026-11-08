/* The one JSON format for hand-authored content files. Service Mode saves
   rewrite whole files, so every file it writes goes through here.

   formatJSON: JSON.stringify with two-space indent, arrays of plain values on
   one line (the same rule build.mjs's `pretty` applies to 05_content.js), and
   a trailing newline. formatSongs: tools/music/songs.json, one song per line.
   No imports. */

export const formatJSON = (v) => JSON.stringify(v, null, 2)
  .replace(/\[\n\s+([^[\]{}]*?)\n\s*\]/g, (m, inner) => '[' + inner.replace(/,\n\s+/g, ', ') + ']') + '\n';

/* Baked tables (content/faces/, lattice/, board/) are written by their own
   tools, not by hand, and come in more than one layout: bake-face.mjs writes
   JSON.stringify(v, null, 2), and the era faces are one line. A save that
   edits one (a face's eyes) keeps the layout the file already has, so the
   diff is the edit and not a reformat of a 4 KB pixel string's neighbours.
   prevText null, or a layout none of these makes: formatJSON. */
export function formatLike(prevText, v) {
  if (typeof prevText === 'string') {
    let p = null;
    try { p = JSON.parse(prevText); } catch { /* not JSON: fall through */ }
    if (p !== null) {
      for (const f of [(x) => JSON.stringify(x), (x) => JSON.stringify(x) + '\n', (x) => JSON.stringify(x, null, 2) + '\n'])
        if (f(p) === prevText) return f(v);
    }
  }
  return formatJSON(v);
}

const songLine =(s) => '{ ' + Object.entries(s).map(([k, x]) => JSON.stringify(k) + ': ' + JSON.stringify(x)).join(', ') + ' }';

export function formatSongs(v) {
  const rows = Object.entries(v).map(([k, x]) => k === 'songs' && Array.isArray(x)
    ? '  "songs": [\n' + x.map((s) => '    ' + songLine(s)).join(',\n') + '\n  ]'
    : '  ' + JSON.stringify(k) + ': ' + JSON.stringify(x));
  return '{\n' + rows.join(',\n') + '\n}\n';
}
