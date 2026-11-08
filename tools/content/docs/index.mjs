/* The registered docs, and the one step that writes them.

   A doc module is { file: 'levels.md', render(files, prevText) -> string }, where
   `files` is every content JSON by rel path (the shape memSource takes) and
   prevText the doc as it stands (null when there is none). Later docs are added
   to DOCS. The JSON is the master copy and nothing here is ever read back into it.

   The admin server's save calls renderDocsAt before it writes anything, then
   writes the JSON and the rendered docs together. Switching the mirror off is
   passing it a renderer that returns {}. Only docs that exist are rewritten;
   none is ever created. */
import { readFile, readdir, writeFile, rename } from 'node:fs/promises';
import { join } from 'node:path';
import { diffLines } from './engine.mjs';
import levels from './levels.mjs';

export const DOCS_DIR = 'docs/authored content';
export const DOCS = [levels];

/* readDoc(file) -> text | null. A CRLF doc is rendered as LF and handed back CRLF. */
export function renderAll(files, readDoc) {
  const out = {};
  for (const d of DOCS) {
    const prev = readDoc(d.file);
    const crlf = typeof prev === 'string' && prev.includes('\r\n');
    const text = d.render(files, crlf ? prev.replace(/\r\n/g, '\n') : prev);
    out[d.file] = crlf ? text.replace(/\n/g, '\r\n') : text;
  }
  return out;
}

/* [{ file, lines }] for every registered doc on disk: how many lines a render would change */
export function drift(files, readDoc) {
  const out = [];
  for (const d of DOCS) {
    const prev = readDoc(d.file);
    if (typeof prev !== 'string') continue;
    out.push({ file: d.file, lines: diffLines(prev, renderAll(files, (f) => f === d.file ? prev : null)[d.file]) });
  }
  return out;
}

export async function loadContent(root) {
  const files = {};
  const walk = async (dir, rel) => {
    for (const ent of await readdir(dir, { withFileTypes: true })) {
      const r = rel ? rel + '/' + ent.name : ent.name;
      if (ent.isDirectory()) await walk(join(dir, ent.name), r);
      else if (ent.name.endsWith('.json')) files[r] = JSON.parse(await readFile(join(dir, ent.name), 'utf8'));
    }
  };
  await walk(join(root, 'content'), '');
  return files;
}

export async function readDocs(root) {
  const docs = {};
  for (const d of DOCS) {
    try { docs[d.file] = await readFile(join(root, DOCS_DIR, d.file), 'utf8'); } catch { docs[d.file] = null; }
  }
  return docs;
}

/* Renders, writes nothing: { 'docs/authored content/levels.md': text } for every
   registered doc that exists under root and differs from its render. Pure in the
   content, so the save can run it BEFORE writing anything and fail cleanly. */
export async function renderDocsAt(root, files) {
  files = files || await loadContent(root);
  const docs = await readDocs(root);
  const out = renderAll(files, (f) => docs[f]);
  const changed = {};
  for (const [f, text] of Object.entries(out)) {
    if (docs[f] !== null && docs[f] !== text) changed[DOCS_DIR + '/' + f] = text;
  }
  return changed;
}

/* Writes a { root-relative path: text } map, each file through tmp + rename. */
export async function writeTexts(root, texts) {
  for (const [rel, text] of Object.entries(texts)) {
    const p = join(root, rel), tmp = p + '.tmp';
    await writeFile(tmp, text);
    await rename(tmp, p);
  }
  return Object.keys(texts);
}

/* Renders and rewrites every registered doc under root. Returns the paths written. */
export async function writeDocs(root, files) {
  return writeTexts(root, await renderDocsAt(root, files));
}

export async function driftAt(root) {
  const files = await loadContent(root), docs = await readDocs(root);
  return drift(files, (f) => docs[f]);
}
