// Capture 1280x800 preview screenshots for every scene into docs/previews/.
//
// Usage:
//   1. Serve the repo root on a local port, e.g.
//        python -m http.server 18990 --bind 127.0.0.1
//   2. Run:
//        node tools/capture-previews.cjs [--port 18990] [dir ...]
//
// Requires Playwright. It is resolved from a local node_modules if present,
// otherwise from the copy bundled inside GPT-6Astra/.
//
// Each scene directory must expose an index.html entry. Previews are written
// to docs/previews/<lowercased-directory-name>.png.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'docs', 'previews');

function loadPlaywright() {
  try {
    return require('playwright');
  } catch (_) {
    const bundled = path.join(ROOT, 'GPT-6Astra', 'node_modules', 'playwright');
    if (!fs.existsSync(bundled)) {
      throw new Error('Playwright not found. Run `npm i -D playwright` at the repo root first.');
    }
    return require(bundled);
  }
}

// Only scenes whose index.html actually renders belong here. Broken or
// unfinished dumps (see README "未纳入作品") stay out until they are fixed.
// Ordered by model vendor: GPT, DeepSeek, Qwen, MiMo, Doubao, GLM, then the rest.
const SCENES = [
  { name: 'GPT 5.6 Terra', dir: 'GPT-5.6Terra' },
  { name: 'GPT 5.6 Luna', dir: 'GPT-5.6Luna' },
  { name: 'GPT 5.6 Sol', dir: 'GPT-5.6Sol' },
  { name: 'GPT 6 Astra', dir: 'GPT-6Astra' },
  { name: 'GPT 6 Luna', dir: 'GPT-6Luna' },
  { name: 'GPT 6 Sol', dir: 'GPT-6Sol' },
  { name: 'DeepSeek V4.1 Flash', dir: 'DeepSeekV4.1Flash' },
  { name: 'DeepSeek V4 Pro', dir: 'DeepSeekV4Pro' },
  { name: 'Qwen 3.6 Flash', dir: 'qwen3.6-flash' },
  { name: 'Qwen 3.8 Flash', dir: 'Qwen3.8Flash' },
  { name: 'MiMo V2.6 Flash', dir: 'MiMo-V2.6-Flash' },
  { name: 'MiMo V2.6 Pro', dir: 'MIMo-V2.6-Pro' },
  { name: 'Doubao 2.1', dir: 'doubao2.1' },
  { name: 'GLM 5.1', dir: 'GLM-5.1' },
  { name: 'GLM 5.3 Flash', dir: 'GLM-5.3-Flash' },
  { name: 'Gemini 3.8 Flash', dir: 'Gemini3.8Flash' },
  { name: 'Grok 4.7', dir: 'Grok4.7' },
  { name: 'Hy4 Preview', dir: 'Hy4preview' },
  { name: 'Kimi K3', dir: 'KimiK3' },
  { name: 'Ling 3.0 Flash', dir: 'Ling3.0-flash' },
  { name: 'LongCat 2.0', dir: 'LongCat2.0' },
  { name: 'MiniMax M3', dir: 'MiniMax-M3' },
  { name: 'Muse Spark 1.3', dir: 'MuseSpark1.3' },
  { name: 'Nemotron 3.5 Lightning', dir: 'Nemotron3.5Lightning' }
];

function parseArgs(argv) {
  let port = 18990;
  const only = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--port') { port = Number(argv[++i]); continue; }
    only.push(argv[i].replace(/[\\/]+$/, ''));
  }
  return { port, only };
}

(async () => {
  const { port, only } = parseArgs(process.argv.slice(2));
  const base = `http://127.0.0.1:${port}`;
  const scenes = only.length ? SCENES.filter(s => only.includes(s.dir)) : SCENES;
  if (!scenes.length) throw new Error('No matching scenes.');

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch({
    headless: true,
    args: ['--enable-webgl', '--ignore-gpu-blocklist', '--use-gl=angle', '--use-angle=swiftshader', '--disable-dev-shm-usage']
  });

  let failures = 0;
  for (const scene of scenes) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    const url = `${base}/${scene.dir}/index.html`;
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForSelector('canvas', { timeout: 45000 });
      await page.waitForTimeout(4000);
      const shot = path.join(OUT_DIR, scene.dir.toLowerCase() + '.png');
      await page.screenshot({ path: shot });
      const size = fs.statSync(shot).size;
      console.log(`OK   ${scene.dir.padEnd(24)} -> docs/previews/${path.basename(shot)} (${size} bytes)`);
    } catch (err) {
      failures++;
      console.error(`FAIL ${scene.dir}: ${err.message}`);
    }
    if (errors.length) console.error(`     console errors: ${errors.slice(0, 3).join(' | ')}`);
    await page.close();
  }

  await browser.close();
  if (failures) {
    console.error(`\n${failures} scene(s) failed.`);
    process.exit(1);
  }
  console.log(`\nCaptured ${scenes.length} previews into docs/previews/.`);
})().catch(err => { console.error(err); process.exit(1); });
