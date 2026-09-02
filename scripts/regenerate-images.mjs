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

const STYLE = `Professional documentary-style photograph, realistic, high detail, shot on a full-frame camera with a natural lens, shallow depth of field, natural overcast Dutch daylight, no text, no watermark, no logos, no visible brand names. Workwear is only lightly dusted with mortar or plaster, NOT heavily soiled or filthy — the person looks tidy and professional. The brickwork itself is clean and structurally intact everywhere in the frame: no cracks, no missing or broken bricks, no peeling paint, no rotten wood, no damaged windows. The ONLY sign of wear anywhere in the image is in the mortar joints between the bricks (old joints are grey, receded and slightly crumbling; new joints are crisp and fresh) — never damage to the bricks themselves. Setting: Dutch brick row houses in the Netherlands.`;

const IMAGES = [
  {
    name: 'home-hero',
    aspect_ratio: '4:3',
    prompt: `${STYLE} Subject: a mason in his 30s-40s pressing fresh grey mortar into a horizontal joint line with a small pointing trowel, mid-action, multiple courses of intact brick clearly visible, focused expression, shot from a slight low angle.`,
  },
  {
    name: 'opdrachtgevers-team',
    aspect_ratio: '4:3',
    prompt: `${STYLE} Subject: two tidy construction workers in dark workwear consulting near an intact brick facade with visible old mortar joints, one pointing at the joints, scaffolding partially visible, collaborative moment, no damaged elements anywhere.`,
  },
  {
    name: 'overons-gevel',
    aspect_ratio: '4:3',
    prompt: `${STYLE} Subject: a close-medium shot of ONE continuous intact brick wall, split down the middle: the left half has old grey, receded, weathered mortar joints, the right half has crisp fresh light-grey mortar joints — the brick color and condition is identical and undamaged on both sides, only the joints differ, no people.`,
  },
  {
    name: 'voegwerk-closeup',
    aspect_ratio: '21:9',
    prompt: `${STYLE} Subject: an extreme close-up macro shot filling the frame with several rows of clearly visible intact red-orange brick. A hand holds a small pointing trowel loaded with fresh grey mortar, actively pressing and smoothing the mortar into a horizontal gap between two rows of brick. The brick texture and mortar joint must be the dominant, unmistakable subject of the image.`,
  },
  {
    name: 'gevelreiniging-voor',
    aspect_ratio: '4:3',
    prompt: `${STYLE} Subject: a section of intact, structurally sound brick wall with dark grime, black soot streaks and moss staining on the surface of the brick and in the joints, weathered dirty look, no people, no cracked or broken bricks, no damaged windows or wood — purely surface dirt.`,
  },
  {
    name: 'gevelreiniging-na',
    aspect_ratio: '4:3',
    prompt: `${STYLE} Subject: the same style intact brick wall section but freshly cleaned, vivid natural brick-red color, crisp clean mortar joints, no grime or moss, no people.`,
  },
  {
    name: 'impregneren',
    aspect_ratio: '4:3',
    prompt: `${STYLE} Subject: a tidy worker in dark workwear spraying a clear impregnation water-repellent treatment onto an intact brick wall with a low-pressure sprayer, fine mist visible near the nozzle, side view, calm professional posture.`,
  },
  {
    name: 'offerte-voltooid',
    aspect_ratio: '3:4',
    prompt: `${STYLE} Subject: a beautifully finished, fully renovated brick facade of a Dutch row house, crisp fresh mortar joints throughout, clean brick, no people, no scaffolding, golden-hour soft light, a proud finished-project feel.`,
  },
  {
    name: 'voegtype-snijvoeg',
    aspect_ratio: '1:1',
    prompt: `${STYLE} Subject: an extreme close-up macro shot of a "snijvoeg" mortar joint profile: the mortar is cut back flush and flat with the brick surface, creating a clean minimal seam, sharp crisp lines, 3-4 rows of intact brick visible, no people, studio-like product-photo clarity.`,
  },
  {
    name: 'voegtype-platvol',
    aspect_ratio: '1:1',
    prompt: `${STYLE} Subject: an extreme close-up macro shot of a "platvolle voeg" mortar joint profile: the mortar fills the joint completely flush with the face of the brick, traditional robust look, 3-4 rows of intact brick visible, no people, studio-like product-photo clarity.`,
  },
  {
    name: 'voegtype-schaduwvoeg',
    aspect_ratio: '1:1',
    prompt: `${STYLE} Subject: an extreme close-up macro shot of a "schaduwvoeg" mortar joint profile: the mortar is recessed a few millimeters behind the brick face, creating a visible shadow line along each joint, crisp geometric look, 3-4 rows of intact brick visible, no people, studio-like product-photo clarity.`,
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
  await Promise.all(IMAGES.map((image) => processImage(image, outDir)));
  console.log('ALL DONE');
}

main();
