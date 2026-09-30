import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
let html = await readFile(resolve(root, 'dist/index.html'), 'utf8');
const jsTag = html.match(/<script type="module" crossorigin src="([^"]+)"><\/script>/);
const cssTag = html.match(/<link rel="stylesheet" crossorigin href="([^"]+)">/);
if (!jsTag || !cssTag) throw new Error('Build output is missing its script or stylesheet.');
const js = await readFile(resolve(root, 'dist', jsTag[1].replace(/^\//, '')), 'utf8');
const css = await readFile(resolve(root, 'dist', cssTag[1].replace(/^\//, '')), 'utf8');
html = html.replace(jsTag[0], () => `<script type="module">${js.replace(/<\/script/gi, '<\\/script')}</script>`);
html = html.replace(cssTag[0], () => `<style>${css}</style>`);
await writeFile(resolve(root, 'Rainy-Corner.html'), html);
console.log('Standalone scene saved: Rainy-Corner.html');
