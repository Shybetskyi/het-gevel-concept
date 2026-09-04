// Standalone Nano Banana (kie.ai) image generator.
//
// 1. Edit scripts/image-jobs.json — one entry per photo you want, e.g.:
//      {
//        "name": "hero-optie-a",        // used in the output filename
//        "prompt": "...",                // full English prompt, be specific
//        "aspectRatio": "4:3",            // "1:1" | "4:3" | "3:4" | "16:9" | "21:9" | ...
//        "variants": 3                    // how many versions to generate for this job
//      }
//    Add as many jobs as you like in the array.
//
// 2. Run:  node scripts/generate-nano-banana.mjs
//    (needs KIE_AI_API_KEY in .env — already set up in this project)
//
// 3. Results land in scripts/candidates/<name>-1.jpg, -2.jpg, ...
//    Look through them and copy your favorite into src/assets/generated/
//    (overwrite the existing file with the same name used elsewhere in the
//    code, or update the import path in the .astro page if you rename it).

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const envText = readFileSync(path.join(root, '.env'), 'utf8');
const env = Object.fromEntries(
  envText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i), l.slice(i + 1)];
    }),
);
const API_KEY = env.KIE_AI_API_KEY;
if (!API_KEY) {
  console.error('KIE_AI_API_KEY ontbreekt in .env');
  process.exit(1);
}

const jobs = JSON.parse(readFileSync(path.join(root, 'scripts', 'image-jobs.json'), 'utf8'));
const API_BASE = 'https://api.kie.ai/api/v1/jobs';

async function createTask(prompt, aspectRatio) {
  const res = await fetch(`${API_BASE}/createTask`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'nano-banana-2',
      input: { prompt, aspect_ratio: aspectRatio, resolution: '2K', output_format: 'jpg' },
    }),
  });
  const json = await res.json();
  if (json.code !== 200) throw new Error(`createTask failed: ${JSON.stringify(json)}`);
  return json.data.taskId;
}

// The kie.ai API occasionally drops an individual fetch — this tolerates a
// handful of transient errors mid-poll instead of giving up immediately.
async function pollTask(taskId, label) {
  let consecutiveErrors = 0;
  for (let i = 0; i < 90; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    try {
      const res = await fetch(`${API_BASE}/recordInfo?taskId=${taskId}`, {
        headers: { Authorization: `Bearer ${API_KEY}` },
      });
      const json = await res.json();
      const state = json.data?.state;
      console.log(`  [${label}] ${state} (${i + 1})`);
      consecutiveErrors = 0;
      if (state === 'success') return JSON.parse(json.data.resultJson).resultUrls[0];
      if (state === 'fail') throw new Error(`Mislukt: ${json.data.failMsg}`);
    } catch (err) {
      consecutiveErrors++;
      console.log(`  [${label}] netwerkfout (${consecutiveErrors}): ${err.message}`);
      if (consecutiveErrors >= 8) throw new Error('Te veel netwerkfouten op rij');
    }
  }
  throw new Error('Timeout');
}

async function generateOne(job, variantIndex, outDir) {
  const label = `${job.name}-${variantIndex}`;
  console.log(`start: ${label}`);
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const taskId = await createTask(job.prompt, job.aspectRatio || '4:3');
      const url = await pollTask(taskId, label);
      const res = await fetch(url);
      const buffer = Buffer.from(await res.arrayBuffer());
      writeFileSync(path.join(outDir, `${label}.jpg`), buffer);
      console.log(`klaar: ${label}.jpg`);
      return;
    } catch (err) {
      console.error(`poging ${attempt}/3 mislukt voor ${label} — ${err.message}`);
      if (attempt < 3) await new Promise((r) => setTimeout(r, 3000));
    }
  }
  console.error(`OPGEGEVEN: ${label}`);
}

async function main() {
  const outDir = path.join(root, 'scripts', 'candidates');
  mkdirSync(outDir, { recursive: true });

  for (const job of jobs) {
    const count = job.variants ?? 3;
    for (let v = 1; v <= count; v++) {
      // Sequential on purpose: parallel requests to this API are unreliable.
      await generateOne(job, v, outDir);
    }
  }
  console.log(`\nAlle varianten staan in: ${outDir}`);
}

main();
