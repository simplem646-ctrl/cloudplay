// Bundle src/main.js with esbuild and inline it into dist/index.html (single self-contained file).
// Usage: node tools/build.mjs [--dev]   (--dev: no minify, inline sourcemap)
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dev = process.argv.includes('--dev');

const result = await build({
  entryPoints: [path.join(root, 'src/main.js')],
  bundle: true,
  format: 'iife',
  target: 'es2022',
  minify: !dev,
  sourcemap: dev ? 'inline' : false,
  legalComments: 'none',
  write: false,
  logLevel: 'warning',
});

const js = result.outputFiles[0].text.replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\!--');
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const marker = (name) => new RegExp(`<!-- BUILD:${name}:START -->[\\s\\S]*?<!-- BUILD:${name}:END -->\\n?`);
if (!marker('IMPORTMAP').test(html) || !marker('SCRIPT').test(html)) throw new Error('index.html is missing BUILD markers');
html = html.replace(marker('IMPORTMAP'), '');
html = html.replace(marker('SCRIPT'), () => `<script>\n${js}\n</script>\n`);

fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
const out = path.join(root, 'dist/index.html');
fs.writeFileSync(out, html);
const kb = (fs.statSync(out).size / 1024).toFixed(1);
console.log(`built dist/index.html (${dev ? 'dev' : 'minified'}): ${kb} KB`);
