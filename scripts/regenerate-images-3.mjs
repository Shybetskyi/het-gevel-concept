import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const envText = readFileSync(path.join(root, '.env'), 'utf8');
const env = Object.fromEntries(
  envText.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#') && l.includes('=')).map((l) => {
    const i = l.indexOf('=');
    return [l.slice(0, i), l.slice(i + 1)];
  }),
);
const API_KEY = env.KIE_AI_API_KEY;

// Shared realism cues so nothing reads as CGI/render: real camera imperfection,
// natural (not staged) light, true-to-life color grading.
const REALISM = `Shot on a real full-frame DSLR with a 50mm prime lens, natural soft daylight (not studio strobes), true-to-life muted color grading (not oversaturated, not HDR-looking), authentic photographic depth of field falloff, subtle natural film-like grain — this must read as an unedited real photograph, never as a 3D render, illustration or CGI. No text, no watermark, no logos, no visible brand names.`;

const WALL_STYLE = `Professional macro architectural photograph of a section of a professionally built brick wall, ${REALISM} Strong raking side-light from the left so the mortar-joint relief casts clear, legible shadows. The brickwork is immaculate: bricks are laid in perfectly straight, level courses with consistent, uniform spacing — no crooked bricks, no gaps, no chips, no cracks. The mortar in every joint is smooth, uniformly colored light-grey, cleanly tooled with no crumbling, no pitting, no rough or ragged edges — this is finished, professional-quality work, not weathered or damaged. Sharp focus across 3-4 courses of brick, no people.`;

const IMAGES = [
  {
    name: 'wall-voeg-verdiept',
    aspect_ratio: '1:1',
    prompt: `${WALL_STYLE} The horizontal mortar joints are evenly RECESSED about 1 centimeter behind the face of the bricks, a consistent, deliberate, clean-edged setback along the entire joint — so each brick's bottom edge casts one crisp, uniform shadow line onto the recessed mortar beneath it (a textbook schaduwvoeg / shadow-joint profile).`,
  },
  {
    name: 'wall-voeg-vol',
    aspect_ratio: '1:1',
    prompt: `${WALL_STYLE} The mortar joints are perfectly FLUSH with the face of the bricks — one smooth, continuous, level plane across brick and mortar with no step, no shadow line and no protrusion anywhere (a textbook platvolle voeg / flush-joint profile).`,
  },
  {
    name: 'wall-voeg-uitstekend',
    aspect_ratio: '1:1',
    prompt: `${WALL_STYLE} The mortar joints evenly PROTRUDE a consistent few millimeters past the face of the bricks, forming a neat, deliberate rounded convex ridge of mortar along every joint that sits proud of the brick surface — a clean, uniform raised-mortar profile (a textbook knipvoeg / protruding-joint profile), catching a crisp highlight along the top of each ridge.`,
  },
  {
    name: 'home-hero',
    aspect_ratio: '4:3',
    prompt: `Professional documentary-style photograph, ${REALISM} Rear three-quarter view: we see the back of a mason working on a brick facade, facing the wall, away from the camera. He wears a spotless, well-fitted work coverall in the company's brand colors — dark charcoal-anthracite as the main body color, with a terracotta-orange accent panel across the shoulders and a terracotta stripe down the side of the back, like clean professional branded workwear, no logos or text printed on it, no dirt or stains. He is mid-action, arm raised, pressing fresh mortar into a joint with a small trowel. The brick wall is professionally laid, straight and level: the left two-thirds of the wall (from the camera's point of view) already has clean, uniform, freshly finished mortar joints; the right third still has the old, weathered, unfinished joints — one clear, clean line where his completed work meets the remaining section. Dutch brick row houses softly out of focus in the background, natural overcast daylight, shallow depth of field.`,
  },
];

const API_BASE = 'https://api.kie.ai/api/v1/jobs';

async function createTask(image) {
  const res = await fetch(`${API_BASE}/createTask`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'nano-banana-2',
      input: { prompt: image.prompt, aspect_ratio: image.aspect_ratio, resolution: '2K', output_format: 'jpg' },
    }),
  });
  const json = await res.json();
  if (json.code !== 200) throw new Error(`createTask failed for ${image.name}: ${JSON.stringify(json)}`);
  return json.data.taskId;
}

async function pollTask(taskId, name) {
  let consecutiveErrors = 0;
  for (let i = 0; i < 90; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    try {
      const res = await fetch(`${API_BASE}/recordInfo?taskId=${taskId}`, { headers: { Authorization: `Bearer ${API_KEY}` } });
      const json = await res.json();
      const state = json.data?.state;
      console.log(`  [${name}] ${state} (${i + 1})`);
      consecutiveErrors = 0;
      if (state === 'success') return JSON.parse(json.data.resultJson).resultUrls[0];
      if (state === 'fail') throw new Error(`Task failed for ${name}: ${json.data.failMsg}`);
    } catch (err) {
      consecutiveErrors++;
      console.log(`  [${name}] poll error (${consecutiveErrors}): ${err.message}`);
      if (consecutiveErrors >= 8) throw new Error(`Too many consecutive poll errors for ${name}`);
    }
  }
  throw new Error(`Timed out waiting for ${name}`);
}

async function processImage(image, outDir, attempts = 4) {
  console.log(`start: ${image.name}`);
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const taskId = await createTask(image);
      const url = await pollTask(taskId, image.name);
      const res = await fetch(url);
      const buffer = Buffer.from(await res.arrayBuffer());
      writeFileSync(path.join(outDir, `${image.name}.jpg`), buffer);
      console.log(`done: ${image.name}`);
      return;
    } catch (err) {
      console.error(`attempt ${attempt}/${attempts} failed for ${image.name} —`, err.message);
      if (attempt < attempts) await new Promise((r) => setTimeout(r, 3000));
    }
  }
  console.error(`GAVE UP: ${image.name}`);
}

async function main() {
  const outDir = path.join(root, 'src', 'assets', 'generated');
  mkdirSync(outDir, { recursive: true });
  for (const image of IMAGES) {
    await processImage(image, outDir);
  }
  console.log('ALL DONE');
}

main();
