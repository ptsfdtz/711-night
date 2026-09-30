// Capture 1280x800 preview screenshots for every scene into docs/previews/.
//
// Usage:
//   1. Serve the repo root on a local port, e.g.
//        python -m http.server 18990 --bind 127.0.0.1
//   2. Run:
//        node tools/capture-previews.cjs [--port 18990] [dir ...]
//
// Requires Playwright. It is resolved from a local node_modules if present,
// otherwise from the copy bundled inside gpt-6-astra/.
//
// Each scene directory must expose an HTML entry. Previews are written
// to docs/previews/<directory-name>.png.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'docs', 'previews');

function loadPlaywright() {
  try {
    return require('playwright');
  } catch (_) {
    const bundled = path.join(ROOT, 'gpt-6-astra', 'node_modules', 'playwright');
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
  { name: 'GPT 5.6 Terra', dir: 'gpt-5.6-terra' },
  { name: 'GPT 5.6 Luna', dir: 'gpt-5.6-luna' },
  { name: 'GPT 5.6 Sol', dir: 'gpt-5.6-sol' },
  { name: 'GPT 6 Astra', dir: 'gpt-6-astra' },
  { name: 'GPT 6 Luna', dir: 'gpt-6-luna' },
  { name: 'GPT 6 Sol', dir: 'gpt-6-sol' },
  { name: 'GPT 6.1 Sol', dir: 'gpt-6.1-sol', entry: 'Rainy-Corner.html' },
  { name: 'DeepSeek V4.1 Flash', dir: 'deepseek-v4.1-flash' },
  { name: 'DeepSeek V4 Pro', dir: 'deepseek-v4-pro' },
  { name: 'Qwen 3.6 Flash', dir: 'qwen-3.6-flash' },
  { name: 'Qwen 3.8 Flash', dir: 'qwen-3.8-flash' },
  { name: 'Qwen 3.8 27B', dir: 'qwen-3.8-27b' },
  { name: 'Qwen 3.8 Max', dir: 'qwen-3.8-max' },
  { name: 'MiMo V2.6 Flash', dir: 'mimo-v2.6-flash' },
  { name: 'MiMo V2.6 Pro', dir: 'mimo-v2.6-pro' },
  { name: 'Doubao 2.1', dir: 'doubao-2.1' },
  { name: 'GLM 5.1', dir: 'glm-5.1' },
  { name: 'GLM 5.3 Flash', dir: 'glm-5.3-flash' },
  { name: 'Gemini 3.8 Flash', dir: 'gemini-3.8-flash' },
  { name: 'Grok 4.7', dir: 'grok-4.7' },
  { name: 'Hy4 Preview', dir: 'hy4-preview' },
  { name: 'Kimi K3', dir: 'kimi-k3' },
  { name: 'Ling 3.0 Flash', dir: 'ling-3.0-flash' },
  { name: 'LongCat 2.0', dir: 'longcat-2.0' },
  { name: 'MiniMax M3', dir: 'minimax-m3' },
  { name: 'Muse Spark 1.3', dir: 'muse-spark-1.3' },
  { name: 'Nemotron 3.5 Lightning', dir: 'nemotron-3.5-lightning' }
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
    channel: process.platform === 'win32' ? 'chrome' : undefined,
    args: ['--enable-webgl', '--ignore-gpu-blocklist', '--use-gl=angle', '--use-angle=swiftshader', '--disable-dev-shm-usage']
  });

  let failures = 0;
  for (const scene of scenes) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    const url = `${base}/${scene.dir}/${scene.entry || 'index.html'}`;
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
