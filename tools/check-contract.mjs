// Verifies every module exposes the API_SURFACE names (dotted paths allowed). Exit 1 on any failure.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { API_SURFACE } from '../src/core/registry.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MODULES = {
  world: 'src/world/index.js',
  chars: 'src/characters/index.js',
  portraits: 'src/portraits/index.js',
  ui: 'src/ui/index.js',
  audio: 'src/audio/index.js',
  systems: 'src/systems/index.js',
  data: 'src/data/index.js',
};
const OPTIONAL = new Set(['portraits', 'audio']);

let failed = false;
for (const [key, names] of Object.entries(API_SURFACE)) {
  const rel = MODULES[key];
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) {
    if (OPTIONAL.has(key)) console.log(`SKIP ${key} (not present): ${rel}`);
    else {
      console.log(`FAIL ${key}: missing module file ${rel}`);
      failed = true;
    }
    continue;
  }
  let mod;
  try {
    mod = await import(pathToFileURL(file).href);
  } catch (err) {
    console.log(`FAIL ${key}: import error: ${err && err.message}`);
    failed = true;
    continue;
  }
  const target = key === 'data' ? mod.Data : mod;
  if (!target) {
    console.log(`FAIL ${key}: no export "Data"`);
    failed = true;
    continue;
  }
  const problems = [];
  for (const name of names) {
    let v = target;
    for (const part of name.split('.')) v = v == null ? undefined : v[part];
    if (v === undefined) problems.push(`${name} (missing)`);
    else if (key !== 'data' && !['tracks', 'sfxList'].includes(name) && typeof v !== 'function') problems.push(`${name} (not a function)`);
  }
  if (problems.length) {
    console.log(`FAIL ${key}: ${problems.join(', ')}`);
    failed = true;
  } else console.log(`OK   ${key}: ${names.length} names`);
}
process.exit(failed ? 1 : 0);
