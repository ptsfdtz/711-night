import * as THREE from 'three';

export function createToonGradient(steps = 3) {
  const data = new Uint8Array(steps * 4);
  for (let i = 0; i < steps; i++) {
    const v = Math.round((i / (steps - 1)) * 255);
    data[i * 4] = v; data[i * 4 + 1] = v; data[i * 4 + 2] = v; data[i * 4 + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, steps, 1, THREE.RGBAFormat);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.needsUpdate = true;
  return tex;
}

export function createWetGroundTexture(size = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, size);
  grad.addColorStop(0, '#1a1e2e');
  grad.addColorStop(0.5, '#151825');
  grad.addColorStop(1, '#0e1018');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 200; i++) {
    const x = Math.random() * size, y = Math.random() * size;
    const r = Math.random() * 2 + 0.5;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(120,160,220,${Math.random() * 0.15})`;
    ctx.fill();
  }
  for (let i = 0; i < 30; i++) {
    const x = Math.random() * size, y = Math.random() * size;
    const w = Math.random() * 40 + 10, h = Math.random() * 2 + 0.5;
    ctx.beginPath(); ctx.roundRect(x, y, w, h, h);
    ctx.fillStyle = `rgba(180,210,255,${Math.random() * 0.08})`;
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

export function createPavementTexture(size = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#2a2a32';
  ctx.fillRect(0, 0, size, size);
  const tileW = size / 8, tileH = size / 8;
  ctx.strokeStyle = '#3a3a44'; ctx.lineWidth = 2;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      ctx.strokeRect(c * tileW + 1, r * tileH + 1, tileW - 2, tileH - 2);
      if ((r + c) % 2 === 0) {
        ctx.fillStyle = '#2e2e38'; ctx.fillRect(c * tileW + 3, r * tileH + 3, tileW - 6, tileH - 6);
      }
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  return tex;
}

export function createSignTexture(text, bgColor, textColor, w = 256, h = 128) {
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = textColor;
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, w / 2, h / 2);
  return new THREE.CanvasTexture(canvas);
}

export function createCanvasTextureFromCanvas(canvas) {
  return new THREE.CanvasTexture(canvas);
}
