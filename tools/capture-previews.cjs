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
const SCENES = require(path.join(ROOT, 'scenes.json'));

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
    const entry = (scene.entry || 'index.html').split(/[\\/]/).map(encodeURIComponent).join('/');
    const url = `${base}/${encodeURIComponent(scene.dir)}/${entry}`;
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
