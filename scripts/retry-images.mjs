import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const envText = readFileSync(path.join(root, '.env'), 'utf8');
const env = Object.fromEntries(
  envText.split('\n').map(l=>l.trim()).filter(l=>l&&!l.startsWith('#')&&l.includes('=')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i), l.slice(i+1)]})
);
const API_KEY = env.KIE_AI_API_KEY;
const STYLE = `Professional documentary-style photograph, realistic, high detail, shot on a full-frame camera with a natural lens, shallow depth of field, natural overcast Dutch daylight, no text, no watermark, no logos, no visible brand names on clothing or vehicles, plain dark workwear, muted realistic color grading (not oversaturated). Setting: a facade renovation site with Dutch brick row houses in the Netherlands.`;

const IMAGES = [
  { name: 'overons-gevel', aspect_ratio: '4:3', prompt: `${STYLE} Subject: a close-medium shot of a brick facade mid-renovation, half with fresh clean mortar joints and half with old weathered mortar, clear contrast, no people.` },
  { name: 'gevelreiniging-na', aspect_ratio: '4:3', prompt: `${STYLE} Subject: a clean brick facade section, freshly cleaned brick with vivid natural brick-red color, no grime or moss, crisp mortar joints, no people.` },
];

const API_BASE = 'https://api.kie.ai/api/v1/jobs';
async function createTask(image) {
  const res = await fetch(`${API_BASE}/createTask`, { method:'POST', headers:{Authorization:`Bearer ${API_KEY}`,'Content-Type':'application/json'}, body: JSON.stringify({ model:'nano-banana-2', input:{ prompt:image.prompt, aspect_ratio:image.aspect_ratio, resolution:'2K', output_format:'jpg' } }) });
  const json = await res.json();
  if (json.code !== 200) throw new Error(`createTask failed: ${JSON.stringify(json)}`);
  return json.data.taskId;
}
async function pollTask(taskId, name) {
  for (let i=0;i<60;i++) {
    await new Promise(r=>setTimeout(r,5000));
    const res = await fetch(`${API_BASE}/recordInfo?taskId=${taskId}`, { headers:{Authorization:`Bearer ${API_KEY}`} });
    const json = await res.json();
    const state = json.data?.state;
    process.stdout.write(`  [${name}] ${state} (${i+1}/60)\r\n`);
    if (state==='success') return JSON.parse(json.data.resultJson).resultUrls[0];
    if (state==='fail') throw new Error(`Task failed: ${json.data.failMsg}`);
  }
  throw new Error('Timed out');
}
async function main() {
  const outDir = path.join(root,'src','assets','generated');
  mkdirSync(outDir,{recursive:true});
  for (const image of IMAGES) {
    console.log(`Genereren: ${image.name}...`);
    try {
      const taskId = await createTask(image);
      const url = await pollTask(taskId, image.name);
      const res = await fetch(url);
      const buf = Buffer.from(await res.arrayBuffer());
      writeFileSync(path.join(outDir, `${image.name}.jpg`), buf);
      console.log(`  opgeslagen: ${image.name}.jpg`);
    } catch (err) {
      console.error(`  MISLUKT: ${image.name} —`, err.message);
    }
  }
}
main();
