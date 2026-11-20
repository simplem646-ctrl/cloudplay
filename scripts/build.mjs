#!/usr/bin/env node
// Bundles an entry point with esbuild and inlines it into ONE self-contained HTML file.
//   node scripts/build.mjs                         -> dist/index.html (src/main.js, minified)
//   node scripts/build.mjs --dev                   -> unminified, inline sourcemap
//   node scripts/build.mjs --entry src/dev/x.js --out dist/dev/x.html
//   node scripts/build.mjs --all-dev               -> every src/dev/*.js -> dist/dev/<name>.html
//   node scripts/build.mjs --artifact              -> also writes dist/artifact.html: the same page as a
//        fragment (no doctype/html/head/body tags) for publishing as a Claude Artifact, whose host wraps it
// A single file works from file:// (host Playwright) and from any static server.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { build } from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const flag = (n) => argv.includes(n);
const val = (n, d) => { const i = argv.indexOf(n); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };

execFileSync(process.execPath, [path.join(root, 'scripts/gen-registry.mjs')], { stdio: 'inherit' });

const dev = flag('--dev');
const template = fs.readFileSync(path.join(root, 'index.template.html'), 'utf8');

async function one(entry, outFile, title) {
  const t0 = Date.now();
  const res = await build({
    entryPoints: [path.join(root, entry)],
    bundle: true,
    write: false,
    format: 'iife',
    target: 'es2020',
    platform: 'browser',
    minify: !dev,
    sourcemap: dev ? 'inline' : false,
    legalComments: 'none',
    logLevel: 'warning',
    define: { 'process.env.NODE_ENV': JSON.stringify(dev ? 'development' : 'production') },
  });
  const js = res.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
  const html = template.replace('<!--TITLE-->', title).replace('<!--SCRIPT-->', () => js);
  const abs = path.join(root, outFile);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, html);
  console.log(`[build] ${entry} -> ${outFile}  ${(html.length / 1024).toFixed(0)} KB  (${Date.now() - t0} ms)`);
}

// Fragment for the Artifact host (it adds its own doctype/head/body skeleton around what we publish).
function toFragment(html) {
  const title = /<title>[\s\S]*?<\/title>/.exec(html)[0];
  const style = /<style>[\s\S]*?<\/style>/.exec(html)[0];
  const body = /<body>([\s\S]*)<\/body>/.exec(html)[1].trim();
  return `${title}\n<meta name="claude:viewport-fit-sides" content="cover">\n${style}\n${body}\n`;
}

try {
  if (flag('--all-dev')) {
    const dir = path.join(root, 'src/dev');
    const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.js')) : [];
    for (const f of files) await one(`src/dev/${f}`, `dist/dev/${f.replace(/\.js$/, '.html')}`, `dev: ${f}`);
  } else {
    const out = val('--out', 'dist/index.html');
    await one(val('--entry', 'src/main.js'), out, val('--title', 'Bellhaven Days'));
    if (flag('--artifact')) {
      const frag = toFragment(fs.readFileSync(path.join(root, out), 'utf8'));
      const ap = path.join(root, 'dist/artifact.html');
      fs.writeFileSync(ap, frag);
      console.log(`[build] artifact fragment -> dist/artifact.html  ${(frag.length / 1024).toFixed(0)} KB`);
    }
  }
} catch (e) {
  console.error(e.message || e);
  process.exit(1);
}
