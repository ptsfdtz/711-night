import { canvasTex, JP_FONT } from './core.js';

export const storeSignTex = canvasTex((ctx, w, h) => {
  ctx.fillStyle = '#f7fbf7';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#1f8a78';
  ctx.fillRect(0, 0, w, 14);
  ctx.fillRect(0, h - 14, w, 14);
  ctx.fillStyle = '#1f8a78';
  ctx.font = `bold 72px ${JP_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('AOBA STORE', w * 0.42, h * 0.42);
  ctx.font = `bold 34px ${JP_FONT}`;
  ctx.fillStyle = '#2a9d8f';
  ctx.fillText('青葉ストア', w * 0.42, h * 0.72);
  ctx.fillStyle = '#ff7a3c';
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(w * 0.76, h * 0.2, w * 0.2, h * 0.6, 16);
  else ctx.rect(w * 0.76, h * 0.2, w * 0.2, h * 0.6);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = `bold 40px ${JP_FONT}`;
  ctx.fillText('24h', w * 0.86, h * 0.42);
  ctx.font = `bold 20px ${JP_FONT}`;
  ctx.fillText('営業中', w * 0.86, h * 0.68);
}, 1024, 256);

export const sideSignTex = canvasTex((ctx, w, h) => {
  ctx.fillStyle = '#1f8a78';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#fff';
  ctx.font = `bold 56px ${JP_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('青葉ストア', w / 2, h * 0.38);
  ctx.font = `bold 28px ${JP_FONT}`;
  ctx.fillStyle = '#ffd27a';
  ctx.fillText('24時間営業 · 雨の夜も', w / 2, h * 0.72);
}, 512, 160);

export const openSignTex = canvasTex((ctx, w, h) => {
  ctx.fillStyle = '#102018';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#5dffa0';
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, w - 16, h - 16);
  ctx.fillStyle = '#7dffbc';
  ctx.font = `bold 64px ${JP_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('OPEN', w / 2, h / 2);
}, 256, 128);

export const posterTex1 = canvasTex((ctx, w, h) => {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#ff8a5c');
  g.addColorStop(1, '#ffd27a');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#fff';
  ctx.font = `bold 48px ${JP_FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText('新発売', w / 2, 70);
  ctx.font = `bold 36px ${JP_FONT}`;
  ctx.fillText('熱いオデン', w / 2, 130);
  ctx.fillStyle = '#5a3a20';
  ctx.beginPath();
  ctx.arc(w / 2, h - 70, 45, 0, Math.PI * 2);
  ctx.fill();
}, 256, 320);

export const posterTex2 = canvasTex((ctx, w, h) => {
  ctx.fillStyle = '#1a3a6a';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#8ad4ff';
  ctx.font = `bold 40px ${JP_FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText('雨の日', w / 2, 70);
  ctx.fillText('割引', w / 2, 130);
  ctx.fillStyle = '#fff';
  ctx.font = `bold 56px ${JP_FONT}`;
  ctx.fillText('-20%', w / 2, h - 60);
}, 256, 320);

export const coffeeTex = canvasTex((ctx, w, h) => {
  ctx.fillStyle = '#3a2418';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#e8c49a';
  ctx.font = `bold 42px ${JP_FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText('コーヒー', w / 2, h * 0.4);
  ctx.fillStyle = '#ff9a4a';
  ctx.fillText('100円', w / 2, h * 0.72);
}, 256, 128);

export const matTex = canvasTex((ctx, w, h) => {
  ctx.fillStyle = '#1a5c48';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#2a8a6a';
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, w - 12, h - 12);
  ctx.fillStyle = '#e8fff4';
  ctx.font = `bold 40px ${JP_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('いらっしゃいませ', w / 2, h / 2);
}, 256, 128);

export const streetSignTex = canvasTex((ctx, w, h) => {
  ctx.fillStyle = '#2a6fd0';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 5;
  ctx.strokeRect(6, 6, w - 12, h - 12);
  ctx.fillStyle = '#fff';
  ctx.font = `bold 36px ${JP_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('青葉町 3丁目', w / 2, h / 2);
}, 512, 128);

export const floorArrowTex = canvasTex((ctx, w, h) => {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#2a9d8f';
  ctx.beginPath();
  ctx.moveTo(w * 0.5, h * 0.1);
  ctx.lineTo(w * 0.85, h * 0.55);
  ctx.lineTo(w * 0.62, h * 0.55);
  ctx.lineTo(w * 0.62, h * 0.9);
  ctx.lineTo(w * 0.38, h * 0.9);
  ctx.lineTo(w * 0.38, h * 0.55);
  ctx.lineTo(w * 0.15, h * 0.55);
  ctx.closePath();
  ctx.fill();
}, 128, 256);

export const vendingFaceTex = (title, c1, c2) => canvasTex((ctx, w, h) => {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, c1);
  g.addColorStop(1, c2);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.fillRect(16, 16, w - 32, 56);
  ctx.fillStyle = '#223';
  ctx.font = `bold 36px ${JP_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, w / 2, 44);
  const colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff9ff3', '#48dbfb', '#f368e0', '#ff9f43'];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 4; c++) {
      const x = 30 + c * 52;
      const y = 100 + r * 78;
      ctx.fillStyle = colors[(r * 4 + c) % colors.length];
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, y, 40, 56, 6);
      else ctx.rect(x, y, 40, 56);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(x + 6, y + 6, 10, 40);
      ctx.fillStyle = '#ffe66d';
      ctx.fillRect(x + 4, y + 60, 32, 12);
    }
  }
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(16, h - 70, w - 32, 54);
  ctx.fillStyle = '#9ef7ff';
  ctx.font = `bold 24px ${JP_FONT}`;
  ctx.fillText('つめた〜い', w / 2, h - 42);
}, 256, 384);
