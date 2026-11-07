/* One-shot: rewrite the hand-authored content files in the writer's format.
   Run from the repo root: node tools/content/normalize.mjs */
import { readFileSync, writeFileSync } from 'node:fs';
import { formatJSON, formatSongs } from './format.mjs';

const plain = ['winners', 'scores', 'attract', 'levels', 'difficulty', 'menus', 'dialogue', 'release']
  .map((n) => 'content/' + n + '.json').concat(['content/music/playlist.json']);

const rewrite = (f, fmt) => {
  const next = fmt(JSON.parse(readFileSync(f, 'utf8')));
  if (next !== readFileSync(f, 'utf8')) { writeFileSync(f, next); console.log('rewrote ' + f); }
};
for (const f of plain) rewrite(f, formatJSON);
rewrite('tools/music/songs.json', formatSongs);
