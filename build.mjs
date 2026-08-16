/* inline every src module into a single self-contained page */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const SRC = 'src';
const files = readdirSync(SRC).filter((f) => f.endsWith('.js')).sort();
const code = files.map((f) => `\n/* ===== ${f} ===== */\n` + readFileSync(join(SRC, f), 'utf8')).join('\n');

const shell = readFileSync('shell.html', 'utf8');
if (!shell.includes('/*__GAME__*/')) throw new Error('shell.html is missing the /*__GAME__*/ marker');

const out = shell.replace('/*__GAME__*/', () => code);
writeFileSync('taco-shop.html', out);

// dev page: same shell, but load the modules from disk so edits are instant
const dev = shell.replace(
  /<script>[\s\S]*?<\/script>/,
  files.map((f) => `<script src="${SRC}/${f}"></script>`).join('\n')
);
writeFileSync('index.html', '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n' +
  dev.slice(0, dev.indexOf('</style>') + 8) + '\n</head>\n<body>\n' +
  dev.slice(dev.indexOf('</style>') + 8) + '\n</body>\n</html>\n');

console.log(`built taco-shop.html  (${(out.length / 1024).toFixed(1)} kB, ${files.length} modules)`);
