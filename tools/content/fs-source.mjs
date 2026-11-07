/* The content source for Node: reads content/ from disk. The only part of the
   validator that touches node:fs; validate.mjs itself imports nothing. */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { ContentError } from './validate.mjs';

export function fsSource(dir = 'content') {
  return {
    readJSON(rel) {
      const file = join(dir, rel).replace(/\\/g, '/');
      try { return JSON.parse(readFileSync(join(dir, rel), 'utf8')); }
      catch (e) { throw new ContentError(file, [], `${file}: ${e.message}`); }
    },
    list(relDir) {
      try { return readdirSync(join(dir, relDir)).filter((f) => f.endsWith('.json')).sort(); }
      catch { return null; }
    },
  };
}
