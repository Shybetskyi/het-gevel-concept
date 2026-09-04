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

const WALL_STYLE = `Professional macro architectural photograph of a brick wall, shot with strong raking/grazing side-light from the left so that surface relief casts clear shadows, realistic, high detail, no text, no watermark, no logos, no people, intact clean red-orange brick, sharp focus across 3-4 rows of brick.`;

const IMAGES = [
  {
    name: 'wall-voeg-verdiept',
    aspect_ratio: '1:1',
    prompt: `${WALL_STYLE} The horizontal mortar joints are clearly RECESSED about 1 centimeter behind the face of the bricks, so each brick edge casts a visible dark shadow line directly below it onto the recessed grey mortar — a strong, unmistakable stepped-back shadow-joint profile (schaduwvoeg).`,
  },
  {
    name: 'wall-voeg-vol',
    aspect_ratio: '1:1',
    prompt: `${WALL_STYLE} The mortar joints are perfectly FLUSH with the face of the bricks — completely smooth and level, no step, no shadow line, no protrusion, a single continuous flat plane across brick and mortar (platvolle voeg).`,
  },
  {
    name: 'wall-voeg-uitstekend',
    aspect_ratio: '1:1',
    prompt: `${WALL_STYLE} The mortar joints clearly PROTRUDE outward past the face of the bricks by several millimeters, forming a rounded convex ridge of mortar that sticks out beyond the brick surface — the mortar bulges out further than the bricks themselves (knipvoeg), catching bright highlights along the top of each ridge.`,
  },
  {
    name: 'home-hero',
    aspect_ratio: '4:3',
    prompt: `Professional documentary-style photograph, realistic, high detail, natural overcast Dutch daylight, no text, no watermark, no logos. Rear view: we see the BACK of a mason working on a brick facade, facing away from the camera toward the wall. He wears a spotless, clean, well-fitted work coverall/jumpsuit in the company's brand colors — dark charcoal-anthracite (a deep near-black grey) as the main color, with terracotta-orange accent panels on the shoulders and a side stripe down the back, like professional branded workwear, no visible logos or text on it, no dirt or stains. He is mid-action, one arm reaching up applying fresh mortar to a joint with a small trowel. The brick wall in front of him: the left two-thirds (from the camera's point of view) already has clean, crisp, freshly finished mortar joints; the right third still has the old, weathered, unfinished joints — a clear, visible line where his finished work meets the remaining section. Dutch brick row houses in the background, shallow depth of field.`,
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
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const res = await fetch(`${API_BASE}/recordInfo?taskId=${taskId}`, { headers: { Authorization: `Bearer ${API_KEY}` } });
    const json = await res.json();
    const state = json.data?.state;
    if (state === 'success') return JSON.parse(json.data.resultJson).resultUrls[0];
    if (state === 'fail') throw new Error(`Task failed for ${name}: ${json.data.failMsg}`);
  }
  throw new Error(`Timed out waiting for ${name}`);
}

async function processImage(image, outDir) {
  console.log(`start: ${image.name}`);
  try {
    const taskId = await createTask(image);
    const url = await pollTask(taskId, image.name);
    const res = await fetch(url);
    const buffer = Buffer.from(await res.arrayBuffer());
    writeFileSync(path.join(outDir, `${image.name}.jpg`), buffer);
    console.log(`done: ${image.name}`);
  } catch (err) {
    console.error(`FAILED: ${image.name} —`, err.message);
  }
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
