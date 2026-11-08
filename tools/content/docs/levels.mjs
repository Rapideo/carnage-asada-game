/* levels.md, generated from content/levels.json.

   The preamble (everything before `## I. Level 1`) is prose and is kept as it
   stands. Each level is one `## <roman(n)>. Level <n>` node with seven fields:

     Sequence    n
     Game Type   Delivery | Kitchen
     Name        the JSON `name`, as stored (the level card's title)
     Era         1970s | 1980s | 1990s
     Music       <year> - <Delivery|Kitchen>  (the music.md section it plays)
     Difficulty  the difficulty.json key, capitalised
     Season      Summer | Winter

   Anything else written inside a level node is prose and stays. */
import { parseMd, toMd, setField, syncList, roman } from './engine.mjs';

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const ERA = { 1: '1970s', 2: '1980s', 3: '1990s' };

function fill(node, lv) {
  const type = lv.type === 'kitchen' ? 'Kitchen' : 'Delivery';
  setField(node, 'Sequence', String(lv.n), { match: /^\d+\b/ });
  setField(node, 'Game Type', type, { match: /^(Delivery|Kitchen)\b/i });
  setField(node, 'Name', lv.name, { match: /^.*/ });
  setField(node, 'Era', ERA[lv.era] || String(lv.era), { match: /^\d{4}s\b/ });
  setField(node, 'Music', lv.year + ' - ' + type, { match: /^\d{4} - (Delivery|Kitchen)\b/i });
  setField(node, 'Difficulty', cap(lv.difficulty), { match: /^[A-Za-z]+\b/ });
  setField(node, 'Season', cap(lv.season), { match: /^(Summer|Winter)\b/i });
}

export default {
  file: 'levels.md',
  render(files, prevText) {
    const root = parseMd(prevText || '# levels.md\n\n');
    let doc = root.children.find((n) => n.depth === 1);
    if (!doc) { doc = { heading: 'levels.md', depth: 1, lines: ['', ''], children: [] }; root.children.unshift(doc); }
    syncList(doc, files['levels.json'].levels, { heading: (lv) => roman(lv.n) + '. Level ' + lv.n, fill });
    return toMd(root);
  },
};
