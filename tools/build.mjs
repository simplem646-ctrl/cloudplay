// Bundle src/main.js with esbuild and inline it into a single self-contained HTML file.
//   node tools/build.mjs            -> dist/index.html     (full page, minified)
//   node tools/build.mjs --dev      -> dist/index.html     (no minify, inline sourcemap)
//   node tools/build.mjs --artifact -> dist/artifact.html  (page FRAGMENT for the Artifact tool: no doctype/html/head/body)
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dev = process.argv.includes('--dev');
const artifact = process.argv.includes('--artifact');

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
const src = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const marker = (name) => new RegExp(`<!-- BUILD:${name}:START -->\\n?([\\s\\S]*?)<!-- BUILD:${name}:END -->\\n?`);
for (const m of ['STYLE', 'IMPORTMAP', 'BODY', 'SCRIPT']) if (!marker(m).test(src)) throw new Error(`index.html is missing BUILD:${m} markers`);
const part = (name) => src.match(marker(name))[1];

let out;
if (artifact) {
  // The Artifact tool supplies <html>/<head>/<body>, the viewport meta and the CSP. Order: title first (within 8 KB), style, fonts, markup, one script.
  const style = part('STYLE').trim(); // html/body already get an explicit black background, overflow:hidden; canvas + #ui-root are position:fixed
  out = [
    '<title>Lanternbrook Days</title>',
    style,
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600&family=Nunito:wght@400;600;700&display=swap">',
    part('BODY').trim(),
    `<script>\n${js}\n</script>`,
    '',
  ].join('\n');
} else {
  out = src;
  out = out.replace(marker('IMPORTMAP'), '');
  out = out.replace(marker('SCRIPT'), () => `<script>\n${js}\n</script>\n`);
}

fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
const file = path.join(root, 'dist', artifact ? 'artifact.html' : 'index.html');
fs.writeFileSync(file, out);
const kb = (fs.statSync(file).size / 1024).toFixed(1);
console.log(`built dist/${artifact ? 'artifact.html' : 'index.html'} (${dev ? 'dev' : 'minified'}${artifact ? ', fragment' : ''}): ${kb} KB`);
