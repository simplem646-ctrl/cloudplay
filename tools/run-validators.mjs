// Runs tools/validate-content.mjs and tools/validate-world.mjs when present (added by other workstreams).
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
let failed = false;
for (const name of ['validate-content.mjs', 'validate-world.mjs']) {
  const file = path.join(dir, name);
  if (!fs.existsSync(file)) {
    console.log(`SKIP ${name} (not present)`);
    continue;
  }
  console.log(`RUN  ${name}`);
  const r = spawnSync(process.execPath, [file], { stdio: 'inherit' });
  if (r.status !== 0) {
    console.log(`FAIL ${name} (exit ${r.status})`);
    failed = true;
  }
}
process.exit(failed ? 1 : 0);
