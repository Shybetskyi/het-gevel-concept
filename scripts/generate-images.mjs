import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

// Minimal .env reader (avoid adding a dependency just for this one-off script).
const envPath = path.join(root, '.env');
const envText = existsSync(envPath) ? readFileSync(envPath, 'utf8') : '';
const env = Object.fromEntries(
  envText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => {
      const idx = l.indexOf('=');
      return [l.slice(0, idx), l.slice(idx + 1)];
    }),
);

const API_KEY = env.KIE_AI_API_KEY;
if (!API_KEY) {
  console.error('KIE_AI_API_KEY ontbreekt in .env');
  process.exit(1);
}

const STYLE = `Professional documentary-style photograph, realistic, high detail, shot on a full-frame camera with a natural lens, shallow depth of field, natural overcast Dutch daylight, no text, no watermark, no logos, no visible brand names on clothing or vehicles, plain dark workwear, muted realistic color grading (not oversaturated). Setting: a facade renovation site with Dutch brick row houses in the Netherlands.`;

const IMAGES = [
  {
    name: 'home-hero',
    aspect_ratio: '4:3',
    prompt: `${STYLE} Subject: a mason in his 30s-40s carefully repointing a brick wall with a small pointing trowel, mortar joints visible, focused expression, mid-action, shot from a slight low angle.`,
  },
  {
    name: 'opdrachtgevers-team',
    aspect_ratio: '4:3',
    prompt: `${STYLE} Subject: two construction workers in dark workwear consulting near a brick facade under renovation, one pointing at the wall, scaffolding partially visible, collaborative moment.`,
  },
  {
    name: 'overons-gevel',
    aspect_ratio: '4:3',
    prompt: `${STYLE} Subject: a close-medium shot of a brick facade mid-renovation, half with fresh clean mortar joints and half with old weathered mortar, clear contrast, no people.`,
  },
  {
    name: 'voegwerk-closeup',
    aspect_ratio: '21:9',
    prompt: `${STYLE} Subject: extreme close-up of hands using a pointing trowel to apply fresh mortar between bricks, mortar joint tool visible, high texture detail on brick and mortar.`,
  },
  {
    name: 'gevelreiniging-voor',
    aspect_ratio: '4:3',
    prompt: `${STYLE} Subject: a brick facade section that is dirty, with dark grime, moss and algae staining, weathered look, no people, documentary product-style shot.`,
  },
  {
    name: 'gevelreiniging-na',
    aspect_ratio: '4:3',
    prompt: `${STYLE} Subject: the same style brick facade section but clean, freshly cleaned brick with vivid natural brick-red color, no grime or moss, crisp mortar joints, no people.`,
  },
  {
    name: 'impregneren',
    aspect_ratio: '4:3',
    prompt: `${STYLE} Subject: a worker in dark workwear spraying a clear impregnation/water-repellent treatment onto a brick wall with a low-pressure sprayer, visible fine mist near the nozzle, side view.`,
  },
];

const API_BASE = 'https://api.kie.ai/api/v1/jobs';

async function createTask(image) {
  const res = await fetch(`${API_BASE}/createTask`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'nano-banana-2',
      input: {
        prompt: image.prompt,
        aspect_ratio: image.aspect_ratio,
        resolution: '2K',
        output_format: 'jpg',
      },
    }),
  });
  const json = await res.json();
  if (json.code !== 200) {
    throw new Error(`createTask failed for ${image.name}: ${JSON.stringify(json)}`);
  }
  return json.data.taskId;
}

async function pollTask(taskId, name) {
  const maxAttempts = 40;
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const res = await fetch(`${API_BASE}/recordInfo?taskId=${taskId}`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });
    const json = await res.json();
    const state = json.data?.state;
    process.stdout.write(`  [${name}] ${state} (${i + 1}/${maxAttempts})\r\n`);
    if (state === 'success') {
      const result = JSON.parse(json.data.resultJson);
      return result.resultUrls[0];
    }
    if (state === 'fail') {
      throw new Error(`Task failed for ${name}: ${json.data.failMsg}`);
    }
  }
  throw new Error(`Timed out waiting for ${name}`);
}

async function downloadImage(url, destPath) {
  const res = await fetch(url);
  const buffer = Buffer.from(await res.arrayBuffer());
  writeFileSync(destPath, buffer);
}

async function main() {
  const outDir = path.join(root, 'src', 'assets', 'generated');
  mkdirSync(outDir, { recursive: true });

  for (const image of IMAGES) {
    console.log(`Genereren: ${image.name}...`);
    try {
      const taskId = await createTask(image);
      const url = await pollTask(taskId, image.name);
      const dest = path.join(outDir, `${image.name}.jpg`);
      await downloadImage(url, dest);
      console.log(`  opgeslagen: ${dest}`);
    } catch (err) {
      console.error(`  MISLUKT: ${image.name} —`, err.message);
    }
  }
}

main();
