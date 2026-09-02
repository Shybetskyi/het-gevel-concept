import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const envText = readFileSync(path.join(root, '.env'), 'utf8');
const env = Object.fromEntries(envText.split('\n').map(l=>l.trim()).filter(l=>l&&!l.startsWith('#')&&l.includes('=')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i), l.slice(i+1)]}));
const API_KEY = env.KIE_AI_API_KEY;

const prompt = `Professional documentary-style photograph, realistic, high detail, shot on a full-frame camera with a natural lens, shallow depth of field, natural overcast Dutch daylight, no text, no watermark, no logos. Two construction workers in CLEAN, near-spotless dark workwear (no visible plaster splatter, no paint stains, no dirt marks on clothing at all — as if at the start of the day) standing and consulting near an intact brick facade, one pointing at the mortar joints, the other holding a clipboard. Scaffolding partially visible in the background. The brickwork is clean and structurally intact: no cracks, no missing bricks, no damaged windows — only the mortar joints show slight wear. Setting: Dutch brick row houses in the Netherlands.`;

const API_BASE = 'https://api.kie.ai/api/v1/jobs';
async function run() {
  const res = await fetch(`${API_BASE}/createTask`, { method:'POST', headers:{Authorization:`Bearer ${API_KEY}`,'Content-Type':'application/json'}, body: JSON.stringify({ model:'nano-banana-2', input:{ prompt, aspect_ratio:'4:3', resolution:'2K', output_format:'jpg' } }) });
  const json = await res.json();
  if (json.code !== 200) throw new Error(JSON.stringify(json));
  const taskId = json.data.taskId;
  for (let i=0;i<60;i++) {
    await new Promise(r=>setTimeout(r,5000));
    const r2 = await fetch(`${API_BASE}/recordInfo?taskId=${taskId}`, { headers:{Authorization:`Bearer ${API_KEY}`} });
    const j2 = await r2.json();
    console.log('state:', j2.data?.state, `(${i+1}/60)`);
    if (j2.data?.state==='success') {
      const url = JSON.parse(j2.data.resultJson).resultUrls[0];
      const r3 = await fetch(url);
      writeFileSync(path.join(root,'src','assets','generated','opdrachtgevers-team.jpg'), Buffer.from(await r3.arrayBuffer()));
      console.log('saved');
      return;
    }
    if (j2.data?.state==='fail') throw new Error(j2.data.failMsg);
  }
  throw new Error('timeout');
}
run().catch(e=>{console.error(e);process.exit(1)});
