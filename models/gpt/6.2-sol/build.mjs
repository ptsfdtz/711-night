import { build } from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';

const result = await build({
  entryPoints: ['main.js'],
  bundle: true,
  format: 'iife',
  minify: true,
  legalComments: 'inline',
  target: 'es2022',
  write: false,
});

const script = result.outputFiles[0].text.replaceAll('</script', '<\\/script');
const threeLicense = await readFile(new URL('./node_modules/three/LICENSE', import.meta.url), 'utf8');
await writeFile('index.html', `<!doctype html>
<!-- Bundled Three.js license
${threeLicense}
-->
<html lang="zh-CN">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#0c1426">
<title>夜雨 · ヨルマート</title>
<style>
  * { box-sizing: border-box; }
  html, body { width: 100%; height: 100%; margin: 0; overflow: hidden; overscroll-behavior: none; }
  body { display: grid; place-items: stretch; background: #0c1426; color: #e3e9f3; }
  canvas { display: block; width: 100%; height: 100%; cursor: grab; touch-action: none; }
  canvas:active { cursor: grabbing; }
  .fallback { place-self: center; padding: 24px; font: 16px/1.6 system-ui, sans-serif; text-align: center; }
</style>
<body>
<script>${script}</script>
</body>
</html>\n`);
