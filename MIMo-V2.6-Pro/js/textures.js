import * as THREE from 'three'

function canvasTexture(w, h, draw) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  draw(ctx, w, h)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}

export function storeSignTexture() {
  return canvasTexture(1024, 256, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h)
    g.addColorStop(0, '#fff8e8')
    g.addColorStop(0.45, '#ffe8a0')
    g.addColorStop(0.5, '#ffffff')
    g.addColorStop(1, '#fff4d0')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#1f6f4a'
    ctx.fillRect(0, 0, w, 28)
    ctx.fillStyle = '#e85a3c'
    ctx.fillRect(0, h - 28, w, 28)
    ctx.font = 'bold 110px "Segoe UI", "Yu Gothic", sans-serif'
    ctx.fillStyle = '#174a32'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('KONBINI  MART', w / 2, h / 2 + 8)
    ctx.font = '36px "Segoe UI", sans-serif'
    ctx.fillStyle = '#e85a3c'
    ctx.fillText('24H  コンビニ', w / 2, h / 2 + 82)
  })
}

export function bannerTexture() {
  return canvasTexture(512, 1024, (ctx, w, h) => {
    ctx.fillStyle = '#fffaf0'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#1f6f4a'
    ctx.fillRect(0, 0, w, 120)
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 64px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('SALE', w / 2, 80)
    ctx.fillStyle = '#e85a3c'
    ctx.font = 'bold 90px sans-serif'
    ctx.fillText('冷たい', w / 2, 280)
    ctx.fillText('ドリンク', w / 2, 390)
    ctx.fillStyle = '#333'
    ctx.font = 'bold 120px sans-serif'
    ctx.fillText('98円', w / 2, 560)
    ctx.fillStyle = '#f5c542'
    ctx.beginPath()
    ctx.arc(w / 2, 740, 110, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 70px sans-serif'
    ctx.fillText('NEW', w / 2, 755)
  })
}

export function posterTexture(kind = 0) {
  const palettes = [
    ['#2b3a67', '#f5c542', '#fff', 'おすすめ'],
    ['#6b2d5c', '#f0e6d2', '#fff', 'おにぎり'],
    ['#1f4d3a', '#ff8f66', '#fff', 'ホット'],
    ['#3d2b1f', '#e8d5a3', '#fff', '雑誌'],
  ]
  const [bg, accent, fg, label] = palettes[kind % palettes.length]
  return canvasTexture(256, 384, (ctx, w, h) => {
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = accent
    ctx.fillRect(16, 16, w - 32, h * 0.45)
    ctx.fillStyle = bg
    ctx.font = 'bold 42px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(label, w / 2, h * 0.25)
    ctx.fillStyle = fg
    ctx.font = 'bold 28px sans-serif'
    ctx.fillText('FEATURE', w / 2, h * 0.62)
    ctx.fillStyle = accent
    ctx.fillRect(w * 0.2, h * 0.7, w * 0.6, 18)
    ctx.fillRect(w * 0.25, h * 0.78, w * 0.5, 12)
  })
}

export function magazineTexture(i = 0) {
  const hues = [12, 200, 320, 45, 160, 280]
  const c = `hsl(${hues[i % hues.length]}, 65%, 55%)`
  return canvasTexture(128, 176, (ctx, w, h) => {
    ctx.fillStyle = c
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#fff'
    ctx.fillRect(10, 10, w - 20, 36)
    ctx.fillStyle = '#222'
    ctx.font = 'bold 16px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('MAG', w / 2, 34)
    ctx.fillStyle = 'rgba(255,255,255,0.35)'
    ctx.beginPath()
    ctx.arc(w / 2, h * 0.55, 36, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 14px sans-serif'
    ctx.fillText('NEW', w / 2, h * 0.55 + 5)
  })
}

export function floorGuideTexture() {
  return canvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#e8e2d6'
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = '#d0c8b8'
    ctx.lineWidth = 2
    for (let i = 0; i <= 8; i++) {
      ctx.beginPath()
      ctx.moveTo((i * w) / 8, 0)
      ctx.lineTo((i * w) / 8, h)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, (i * h) / 8)
      ctx.lineTo(w, (i * h) / 8)
      ctx.stroke()
    }
    ctx.fillStyle = '#f5c542'
    ctx.fillRect(40, h / 2 - 30, w - 80, 60)
    ctx.fillStyle = '#333'
    ctx.font = 'bold 28px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('ごゆっくりどうぞ', w / 2, h / 2 + 10)
    ctx.fillStyle = '#2a9d8f'
    ctx.beginPath()
    ctx.arc(120, 120, 40, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 20px sans-serif'
    ctx.fillText('入口', 120, 127)
    ctx.fillStyle = '#e85a3c'
    ctx.beginPath()
    ctx.arc(w - 120, 120, 40, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.fillText('出口', w - 120, 127)
  })
}

export function menuBoardTexture() {
  return canvasTexture(512, 256, (ctx, w, h) => {
    ctx.fillStyle = '#2c1810'
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = '#f5c542'
    ctx.lineWidth = 6
    ctx.strokeRect(12, 12, w - 24, h - 24)
    ctx.fillStyle = '#f5c542'
    ctx.font = 'bold 44px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('HOT COFFEE', w / 2, 70)
    ctx.fillStyle = '#fff'
    ctx.font = '28px sans-serif'
    ctx.fillText('ブレンド  ¥120', w / 2, 130)
    ctx.fillText('カフェラテ  ¥180', w / 2, 175)
    ctx.fillText('アメリカーノ  ¥150', w / 2, 215)
  })
}

export function roadTexture() {
  return canvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#2a2c33'
    ctx.fillRect(0, 0, w, h)
    for (let i = 0; i < 900; i++) {
      const x = Math.random() * w
      const y = Math.random() * h
      const a = 0.04 + Math.random() * 0.08
      ctx.fillStyle = `rgba(255,255,255,${a})`
      ctx.fillRect(x, y, 1.5, 1.5)
    }
  })
}

export function crosswalkTexture() {
  return canvasTexture(512, 512, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = 'rgba(240,240,235,0.82)'
    const bars = 8
    for (let i = 0; i < bars; i++) {
      ctx.fillRect(30 + i * 60, 20, 34, h - 40)
    }
  })
}

export function wetGlassTexture() {
  return canvasTexture(256, 512, (ctx, w, h) => {
    ctx.fillStyle = 'rgba(180,210,230,0)'
    ctx.fillRect(0, 0, w, h)
    for (let i = 0; i < 70; i++) {
      const x = Math.random() * w
      const y = Math.random() * h
      const len = 12 + Math.random() * 50
      const alpha = 0.15 + Math.random() * 0.35
      const grad = ctx.createLinearGradient(x, y, x, y + len)
      grad.addColorStop(0, `rgba(220,240,255,0)`)
      grad.addColorStop(0.4, `rgba(220,240,255,${alpha})`)
      grad.addColorStop(1, `rgba(220,240,255,0)`)
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.ellipse(x, y + len * 0.5, 1.2 + Math.random() * 1.5, len * 0.5, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = `rgba(255,255,255,${alpha * 0.8})`
      ctx.beginPath()
      ctx.arc(x, y, 1 + Math.random() * 2, 0, Math.PI * 2)
      ctx.fill()
    }
  })
}

export function rippleTexture() {
  return canvasTexture(128, 128, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h)
    const g = ctx.createRadialGradient(w / 2, h / 2, 8, w / 2, h / 2, w / 2)
    g.addColorStop(0.55, 'rgba(200,220,255,0)')
    g.addColorStop(0.7, 'rgba(200,220,255,0.55)')
    g.addColorStop(0.85, 'rgba(200,220,255,0.15)')
    g.addColorStop(1, 'rgba(200,220,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
  })
}

export function vendingFrontTexture() {
  return canvasTexture(256, 512, (ctx, w, h) => {
    ctx.fillStyle = '#1a1c24'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#e85a3c'
    ctx.fillRect(0, 0, w, 54)
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 30px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('DRINK', w / 2, 38)
    const colors = ['#4fc3f7', '#ff8a65', '#aed581', '#fff176', '#ba68c8', '#4dd0e1', '#f06292', '#ffd54f', '#90caf9']
    let i = 0
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 3; c++) {
        const x = 18 + c * 78
        const y = 70 + r * 72
        ctx.fillStyle = '#0d0f14'
        ctx.fillRect(x, y, 68, 58)
        ctx.fillStyle = colors[i % colors.length]
        ctx.fillRect(x + 14, y + 8, 40, 34)
        i++
      }
    }
    ctx.fillStyle = '#2a2e38'
    ctx.fillRect(12, h - 78, w - 24, 62)
    ctx.fillStyle = '#888'
    ctx.fillRect(28, h - 60, 50, 18)
  })
}

export function bulletinTexture() {
  return canvasTexture(256, 320, (ctx, w, h) => {
    ctx.fillStyle = '#c4a574'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#f7f1e3'
    ctx.fillRect(16, 16, w - 32, h - 32)
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = ['#f5c542', '#e85a3c', '#69b3a2', '#b39ddb', '#fff'][i]
      ctx.fillRect(30 + (i % 2) * 100, 30 + Math.floor(i / 2) * 80, 80, 60)
      ctx.fillStyle = '#333'
      ctx.font = '12px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('お知らせ', 70 + (i % 2) * 100, 65 + Math.floor(i / 2) * 80)
    }
  })
}

export function rainDropTexture() {
  return canvasTexture(32, 64, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h)
    g.addColorStop(0, 'rgba(180,210,255,0)')
    g.addColorStop(0.5, 'rgba(200,225,255,0.85)')
    g.addColorStop(1, 'rgba(180,210,255,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.ellipse(w / 2, h / 2, 1.4, h / 2, 0, 0, Math.PI * 2)
    ctx.fill()
  })
}

export function awningStripeTexture() {
  return canvasTexture(256, 64, (ctx, w, h) => {
    const stripes = 8
    for (let i = 0; i < stripes; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#f4f0e6' : '#1f6f4a'
      ctx.fillRect((i * w) / stripes, 0, w / stripes, h)
    }
  })
}
