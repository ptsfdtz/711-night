import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';

const file = new URL('./index.html', import.meta.url);
const port = Number(process.env.YORU_PORT ?? 4173);

createServer(async (request, response) => {
  if (!['/', '/index.html'].includes(new URL(request.url, 'http://localhost').pathname)) {
    response.writeHead(404).end();
    return;
  }
  try {
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    response.end(await readFile(file));
  } catch (error) {
    response.destroy(error);
  }
}).listen(port, '127.0.0.1', () => console.log(`http://127.0.0.1:${port}/`));
