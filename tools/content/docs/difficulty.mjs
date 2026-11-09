/* difficulty.md, generated from content/difficulty.json.

   The doc is `# difficulty.md` over one `## <roman>. <Name>` node per
   difficulty (DIFF_KEYS order), each with sections A-E, found by NAME, not by
   letter: Shift, Bonus Structure (children Extended Play, Points Bonus),
   Penalties, Navigation, Kitchen Shift. A section's own heading is never
   rewritten; the difficulty headings are renumbered from DIFF_KEYS.

   Every value line the doc had on 2026-11-07, audited, and where it comes from.
   `<tail>` means the rest of the line (and its indented continuation) is a note
   and is kept verbatim: only the leading value is rewritten.

     section          doc line (key : value)                        JSON (per difficulty)
     ---------------  --------------------------------------------  ----------------------------------
     Shift            Starting Timer : 3:00 Minutes<tail>           start            (m:ss Minutes)
     Shift            Starting Tip : 20.00<tail>                    tipStart         (dollars)
     Shift            Depreciation Rate : 1.00 / 3 Seconds<tail>    tipDecay         (1.00 / (100/tipDecay))
     Shift            Tip Floor : 2.00<tail>                        tipFloor
     Extended Play    Every 3 Completed : +1:30 Time Bonus<tail>    extend           (+m:ss)
     Extended Play    Maximum Extensions Per Shift : 5<tail>        maxExt
     Extended Play    Level Target : 15 deliveries / 15 tickets     target
                      served<tail>
     Points Bonus       - Perfect Delivery (bag lands on the        perfectBonus     (+dollars; nested
                        doorstep) : +5.00                                             under "- Delivery Shift")
     Points Bonus       - Clean Ticket (served with no wrong        kitchen.cleanBonus (nested under
                        clicks) : +5.00                                               "- Kitchen Shift")
     Penalties        Speeding Ticket : 5.00<tail>                  fines.ticket
     Penalties        Hitting Pedestrian : 2.00<tail>               fines.ped
     Penalties        Hitting Train : 5.00<tail>                    fines.train
     Penalties        Remake (a splatted bag) : 1.50<tail>          fines.remake     ("Remake" elsewhere)
     Navigation       | Easy | x | x | x | x | x |  (table rows)    nav.*            (columns by header:
                                                                                      panel, map line, map
                                                                                      dot, edge pointer, beacon)
     Kitchen Shift    Starting Tip per Item : 5.00<tail>            kitchen.tipPerItem
     Kitchen Shift    Depreciation Rate : 1.00 / 8 Seconds<tail>    kitchen.decay
     Kitchen Shift    Maximum Items per Ticket : 3<tail>            kitchen.maxItems
     Kitchen Shift    New Ticket Every : 25 Seconds<tail>           kitchen.every
     Kitchen Shift    Ticket Limit : 3 on the rail<tail>, with      kitchen.railMax, and
                      "Up to 3 more customers" in the tail          kitchen.queueMax
     Kitchen Shift    Hint : on, after a 3s stall | new dishes      kitchen.hint, hintNewOnly,
                      only, after a 3s stall | none                hintStall (a description is
                                                                   kept as the note after the
                                                                   state; off, as "none. When
                                                                   on: <it>")
     Wind             Wind Strength : 0.35<tail>                    wind.strength    (0-1, as a number)
     Wind             Gust Every : 12-16 Seconds<tail>              wind.gustEvery   (min-max)
     Wind             Tumbleweeds : 3<tail>                         wind.tumbleweeds

   Same-as items, handled by the engine's same-as rule:
     Medium   Bonus Structure   - Same as Easy                      extend..target, perfectBonus, cleanBonus
     Hard     Points Bonus      - Same as Easy                      perfectBonus, kitchen.cleanBonus
     Hard     Penalties         - Same as Medium : Speeding Ticket  fines.*; the quoted "Label 0.00" values
                                10.00, ...<note>                     follow the JSON while it holds, and the
                                                                     note is kept as prose if it breaks
     While the values still match, the item stays; once they differ it is replaced
     by every field of that section.

   Lines that look like values but are PROSE (no JSON behind them; kept verbatim):
     Combo : x1.00 rising 0.25 ...   (both shifts; the combo is game code)
     Stars : one per perfect ...
     - Delivery Shift / - Kitchen Shift   (labels over the nested bonus lines)
     Full : / Partial : / Minimal : / Beacon only :   (the ladder's names and what
       each shows; the table above carries the values)
     Every third delivery ... earns one ...   (the indented note under Every 3 Completed)

   "Anything not listed here is the same as <the difficulty before>": a value
   with no line in a section is left unlisted while it equals the previous
   difficulty's, and written (appended) once it differs. Easy lists everything.
   Numbers inside notes ("falls to it in 54s", "pays $11.25") are prose and are
   not recomputed. */
import { parseMd, toMd, setField, findField, sameAs, sameRange, applySame, equal, roman, letter } from './engine.mjs';
import { DIFF_KEYS, NAV_KEYS } from '../validate.mjs';

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const money = (c) => Math.floor(c / 100) + '.' + String(Math.round(c) % 100).padStart(2, '0');
const mss = (s) => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
const num = (x) => String(Number(x.toFixed(2)));      // 2.9999999999999996 -> "3", 2.5 -> "2.5"
const rate = (cps) => '1.00 / ' + num(100 / cps) + ' Seconds';
const MONEY = /^\d+\.\d\d/;

/* a field: get(d) -> its value; keys, the doc's names for it (the last is the
   one a new line uses); text(d) -> the value as written; match, the leading run
   of an existing value that is the value (the rest is its tail). inline: a
   money value a Same-as item may quote as "<last key> 0.00". */
const F = (get, keys, text, match, extra) => ({ get, keys: [].concat(keys), text, match, ...extra });
const fMoney = (get, keys, extra) => F(get, keys, (d) => money(get(d)), MONEY, { inline: true, ...extra });

const START = F((d) => d.start, 'Starting Timer', (d) => mss(d.start) + ' Minutes', /^\d+:\d\d Minutes/i);
const TIP_START = fMoney((d) => d.tipStart, 'Starting Tip');
const TIP_DECAY = F((d) => d.tipDecay, 'Depreciation Rate', (d) => rate(d.tipDecay), /^\d+\.\d\d \/ \d+(?:\.\d+)? Seconds/i);
const TIP_FLOOR = fMoney((d) => d.tipFloor, 'Tip Floor');
const EXTEND = F((d) => d.extend, 'Every 3 Completed', (d) => '+' + mss(d.extend) + ' Time Bonus', /^\+\d+:\d\d Time Bonus/i);
const MAX_EXT = F((d) => d.maxExt, 'Maximum Extensions Per Shift', (d) => String(d.maxExt), /^\d+/);
const TARGET = F((d) => d.target, 'Level Target', (d) => d.target + ' deliveries / ' + d.target + ' tickets served', /^\d+ deliveries \/ \d+ tickets served/);
const PERFECT = F((d) => d.perfectBonus, ['Perfect Delivery (bag lands on the doorstep)', 'Perfect Delivery'], (d) => '+' + money(d.perfectBonus), /^\+\d+\.\d\d/);
const CLEAN = F((d) => d.kitchen.cleanBonus, ['Clean Ticket (served with no wrong clicks)', 'Clean Ticket'], (d) => '+' + money(d.kitchen.cleanBonus), /^\+\d+\.\d\d/);
const FINES = [
  fMoney((d) => d.fines.ticket, 'Speeding Ticket'),
  fMoney((d) => d.fines.ped, 'Hitting Pedestrian'),
  fMoney((d) => d.fines.train, 'Hitting Train'),
  fMoney((d) => d.fines.remake, ['Remake (a splatted bag)', 'Remake']),
];

/* Ticket Limit is two values on one line: railMax leads it, queueMax is the
   "Up to N more customers" its note already states. */
const LIMIT = F((d) => [d.kitchen.railMax, d.kitchen.queueMax], 'Ticket Limit', null, null, {
  write(node, d, at) {
    const { railMax: r, queueMax: q } = d.kitchen;
    if (!at) return setField(node, 'Ticket Limit', r + ' on the rail. Up to ' + q + ' more customers wait in the OVERHEAD');
    setField(node, at.key, r + ' on the rail', { match: /^\d+ on the rail/, indent: at.indent });
    const i = findField(node, at.key, { indent: at.indent });
    for (let j = i; j === i || /^\s+\S/.test(node.lines[j] || ''); j++)
      node.lines[j] = node.lines[j].replace(/\bUp to \d+ more customer/i, 'Up to ' + q + ' more customer');
  },
});

/* Hint: "none" while off; while on, the mode and the stall that triggers it,
   "on, after a 3s stall" or "new dishes only, after a 3s stall" (hint,
   hintNewOnly, hintStall). A description of what it does (Easy's) is kept as
   the note after the state: `- Hint : on, after a 3s stall. <description>`.
   Turning it off keeps the description as a note: `- Hint : none. When on:
   <description>`, so its wrapped continuation lines still belong to the item
   (a bare "none" would leave them orphaned under it, saying the hint is on).
   Turning it back on moves it behind the state again. */
const NONE = /^(?:none|off|no)\b/i;
const PARKED = /^(?:none|off|no)\. When on: (.*)$/i;
const ON_HEAD = /^(?:on|new dishes only)(?:, after a \d+(?:\.\d+)?s stall)?/i;
const hintState = (d) => (d.kitchen.hint ? (d.kitchen.hintNewOnly ? 'new dishes only' : 'on') + ', after a ' + num(d.kitchen.hintStall) + 's stall' : 'none');
const HINT = F((d) => [d.kitchen.hint, d.kitchen.hintNewOnly, d.kitchen.hintStall], 'Hint', null, null, {
  write(node, d, at) {
    const state = hintState(d);
    if (!at) return setField(node, 'Hint', state);
    const o = { indent: at.indent };
    const v = /:\s*(.*)$/.exec(node.lines[findField(node, at.key, o)])[1], parked = PARKED.exec(v), head = ON_HEAD.exec(v);
    if (d.kitchen.hint) {
      if (parked) setField(node, at.key, state + '. ' + parked[1], { ...o, match: /^.*/ });
      else if (head) setField(node, at.key, state, { ...o, match: ON_HEAD });
      else if (NONE.test(v)) setField(node, at.key, state, { ...o, match: NONE });
      else setField(node, at.key, state + '. ' + v, { ...o, match: /^.*/ });
    } else if (NONE.test(v)) setField(node, at.key, 'none', { ...o, match: NONE });
    else if (head) {
      const note = v.slice(head[0].length).replace(/^\. /, '');
      setField(node, at.key, note ? 'none. When on: ' + note : 'none', { ...o, match: /^.*/ });
    } else setField(node, at.key, 'none. When on: ' + v, { ...o, match: /^.*/ });
  },
});

const KITCHEN = [
  fMoney((d) => d.kitchen.tipPerItem, 'Starting Tip per Item'),
  F((d) => d.kitchen.decay, 'Depreciation Rate', (d) => rate(d.kitchen.decay), /^\d+\.\d\d \/ \d+(?:\.\d+)? Seconds/i),
  F((d) => d.kitchen.maxItems, 'Maximum Items per Ticket', (d) => String(d.kitchen.maxItems), /^\d+/),
  F((d) => d.kitchen.every, 'New Ticket Every', (d) => num(d.kitchen.every) + ' Seconds', /^\d+(?:\.\d+)? Seconds/i),
  LIMIT,
  HINT,
];

/* windy Delivery levels only (0.9.3, 55_wind.js); a section of its own, after the Kitchen Shift */
const WIND = [
  F((d) => d.wind.strength, 'Wind Strength', (d) => num(d.wind.strength), /^\d+(?:\.\d+)?/),
  F((d) => d.wind.gustEvery, 'Gust Every', (d) => num(d.wind.gustEvery[0]) + '-' + num(d.wind.gustEvery[1]) + ' Seconds', /^\d+(?:\.\d+)?-\d+(?:\.\d+)? Seconds/i),
  F((d) => d.wind.tumbleweeds, 'Tumbleweeds', (d) => String(d.wind.tumbleweeds), /^\d+/),
];

const SECTIONS = [
  { name: 'Shift', fields: [START, TIP_START, TIP_DECAY, TIP_FLOOR] },
  { name: 'Bonus Structure', subs: [{ name: 'Extended Play', fields: [EXTEND, MAX_EXT, TARGET] }, { name: 'Points Bonus', fields: [PERFECT, CLEAN] }] },
  { name: 'Penalties', fields: FINES },
  { name: 'Navigation', fields: [] },
  { name: 'Kitchen Shift', fields: KITCHEN },
  { name: 'Wind', fields: WIND },
];
const allFields = (s) => s.fields || s.subs.flatMap((x) => x.fields);

/* the line a field already has in this node: { key, indent } or null */
function locate(node, f) {
  for (const indent of ['', '  ']) for (const key of f.keys)
    if (findField(node, key, { indent }) >= 0) return { key, indent };
  return null;
}

/* Write the node's fields for difficulty i. all: write every one (a Same-as
   item was just replaced); otherwise a field with no line is written only where
   it differs from the difficulty before. */
function fill(node, fields, D, i, all) {
  const d = D[DIFF_KEYS[i]], prev = i > 0 ? D[DIFF_KEYS[i - 1]] : null;
  for (const f of fields) {
    const at = locate(node, f);
    if (!at && !all && prev && equal(f.get(d), f.get(prev))) continue;
    if (f.write) f.write(node, d, at);
    else setField(node, at ? at.key : f.keys[f.keys.length - 1], f.text(d), { match: f.match, indent: at ? at.indent : '' });
  }
}

/* What a Same-as item said besides "Same as X": the quoted "Label 0.00" values
   are dropped (the fields replace them), whatever follows them is the note. */
function noteOf(text) {
  const rest = text.replace(/^(?:- )?Same as \w+\s*:?\s*/, '').replace(/^(?:[A-Z][A-Za-z ]*? \d+\.\d\d[,.]?\s*)+/, '').trim();
  return rest ? [rest] : [];
}

/* a node standing for `fields`: the same-as rule if it is a Same-as node */
function renderNode(node, fields, D, i) {
  const d = D[DIFF_KEYS[i]];
  if (sameAs(node) === null) return fill(node, fields, D, i, false);
  const vals = (x) => fields.map((f) => f.get(x));
  const held = !applySame(node, {
    values: vals(d),
    resolve: (name) => (D[name.toLowerCase()] ? vals(D[name.toLowerCase()]) : undefined),
    fill: (n) => fill(n, fields, D, i, true),
    keep: noteOf,
  });
  if (!held) return;
  /* still holds: the values it quotes are this difficulty's (and so the named one's) */
  const [a, b] = sameRange(node);
  for (const f of fields) {
    if (!f.inline) continue;
    const label = f.keys[f.keys.length - 1], re = new RegExp('\\b' + esc(label) + ' \\d+\\.\\d\\d');
    for (let j = a; j < b; j++) node.lines[j] = node.lines[j].replace(re, label + ' ' + money(f.get(d)));
  }
}

const bare = (h) => h.replace(/^[A-Z0-9]+\. /, '');
const changes = (fields, D, i) => i === 0 || fields.some((f) => !equal(f.get(D[DIFF_KEYS[i]]), f.get(D[DIFF_KEYS[i - 1]])));
const newNode = (parent, heading) => {
  const n = { heading, depth: parent.depth + 1, lines: [''], children: [] };
  parent.children.push(n);
  return n;
};

/* The Navigation table: rows `| Easy | x | | ... |` under a header naming the
   columns. Rows are rewritten wherever the table is; with no table anywhere,
   one is put in Easy's Navigation section. */
const COLS = { panel: 'panel', 'map line': 'line', 'map dot': 'dot', 'edge pointer': 'edge', beacon: 'beacon' };
const cells = (l) => l.split('|').slice(1, -1).map((c) => c.trim());
function navTable(root, D, easyNav) {
  let found = false;
  const walk = (n) => {
    for (let i = 0; i < n.lines.length; i++) {
      const head = /^\|.*\bpanel\b.*\|\s*$/.test(n.lines[i]) ? cells(n.lines[i]) : null;
      if (!head) continue;
      found = true;
      const cols = head.slice(1).map((c) => COLS[c.toLowerCase()]);
      for (let j = i + 1; j < n.lines.length && /^\|/.test(n.lines[j]); j++) {
        const k = (cells(n.lines[j])[0] || '').toLowerCase();
        if (!DIFF_KEYS.includes(k) || cols.some((c) => !c)) continue;
        n.lines[j] = '| ' + cap(k) + ' |' + cols.map((c) => (D[k].nav[c] ? ' x |' : ' |')).join('');
      }
    }
    n.children.forEach(walk);
  };
  walk(root);
  if (found || !easyNav) return;
  const names = { panel: 'panel', line: 'map line', dot: 'map dot', edge: 'edge pointer', beacon: 'beacon' };
  const rows = ['| | ' + NAV_KEYS.map((f) => names[f]).join(' | ') + ' |', '|---|' + NAV_KEYS.map(() => '---|').join(''),
    ...DIFF_KEYS.map((k) => '| ' + cap(k) + ' |' + NAV_KEYS.map((f) => (D[k].nav[f] ? ' x |' : ' |')).join(''))];
  easyNav.lines.push(...rows, '');
}

export default {
  file: 'difficulty.md',
  render(files, prevText) {
    const D = files['difficulty.json'];
    const root = parseMd(prevText || '# difficulty.md\n\n');
    let doc = root.children.find((n) => n.depth === 1);
    if (!doc) { doc = { heading: 'difficulty.md', depth: 1, lines: ['', ''], children: [] }; root.children.unshift(doc); }
    let easyNav = null;
    DIFF_KEYS.forEach((k, i) => {
      let dn = doc.children.find((n) => bare(n.heading).toLowerCase() === k);
      if (!dn) dn = newNode(doc, '');
      dn.heading = roman(i + 1) + '. ' + cap(k);
      for (const sec of SECTIONS) {
        let sn = dn.children.find((n) => bare(n.heading) === sec.name);
        if (!sn) {
          if (!changes(allFields(sec), D, i)) continue;
          sn = newNode(dn, letter(dn.children.length) + '. ' + sec.name);
        }
        if (sec.name === 'Navigation' && i === 0) easyNav = sn;
        if (!sec.subs || sameAs(sn) !== null) { renderNode(sn, allFields(sec), D, i); continue; }
        for (const sub of sec.subs) {
          let target = sn.children.find((n) => bare(n.heading) === sub.name);
          if (!target && sn.children.length) {
            if (!changes(sub.fields, D, i)) continue;
            target = newNode(sn, (sn.children.length + 1) + '. ' + sub.name);
          }
          renderNode(target || sn, sub.fields, D, i);
        }
      }
    });
    navTable(root, D, easyNav);
    return toMd(root);
  },
};
