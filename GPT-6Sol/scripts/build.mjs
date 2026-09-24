import { build } from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const result = await build({
  entryPoints: [resolve(root, 'src/main.js')],
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: 'es2020',
  minify: true,
  write: false,
});
const template = await readFile(resolve(root, 'src/template.html'), 'utf8');
const bundle = new TextDecoder().decode(result.outputFiles[0].contents).replaceAll('</script', '<\\/script');
const html = template.replace('<script type="module" src="/src/main.js"></script>', () => `<script>${bundle}</script>`);
if (html === template) throw new Error('Script placeholder missing from template');
await writeFile(resolve(root, 'index.html'), html);
console.log(`Standalone index.html ready (${(Buffer.byteLength(html) / 1024).toFixed(1)} KiB)`);
