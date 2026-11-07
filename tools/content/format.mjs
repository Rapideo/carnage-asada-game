/* The one JSON format for hand-authored content files. Service Mode saves
   rewrite whole files, so every file it writes goes through here.

   formatJSON: JSON.stringify with two-space indent, arrays of plain values on
   one line (the same rule build.mjs's `pretty` applies to 05_content.js), and
   a trailing newline. formatSongs: tools/music/songs.json, one song per line.
   No imports. */

export const formatJSON = (v) => JSON.stringify(v, null, 2)
  .replace(/\[\n\s+([^[\]{}]*?)\n\s*\]/g, (m, inner) => '[' + inner.replace(/,\n\s+/g, ', ') + ']') + '\n';

const songLine = (s) => '{ ' + Object.entries(s).map(([k, x]) => JSON.stringify(k) + ': ' + JSON.stringify(x)).join(', ') + ' }';

export function formatSongs(v) {
  const rows = Object.entries(v).map(([k, x]) => k === 'songs' && Array.isArray(x)
    ? '  "songs": [\n' + x.map((s) => '    ' + songLine(s)).join(',\n') + '\n  ]'
    : '  ' + JSON.stringify(k) + ': ' + JSON.stringify(x));
  return '{\n' + rows.join(',\n') + '\n}\n';
}
