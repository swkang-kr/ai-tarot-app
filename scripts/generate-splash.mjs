import sharp from 'sharp'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const androidBase = path.join(root, 'android/app/src/main/res')

// 별빛 운세 스플래시 SVG 생성 (w x h 비율에 맞게)
function makeSplashSvg(w, h) {
  const cx = w / 2
  const cy = h / 2
  // 별 크기를 화면 짧은 변의 20%로
  const starR = Math.min(w, h) * 0.20
  const moonR = Math.min(w, h) * 0.09
  const moonOffX = cx + Math.min(w, h) * 0.28
  const moonOffY = cy - Math.min(w, h) * 0.32

  // 8각별 꼭지점 계산
  function star8(cx, cy, outer, inner) {
    const pts = []
    for (let i = 0; i < 16; i++) {
      const angle = (Math.PI / 8) * i - Math.PI / 2
      const r = i % 2 === 0 ? outer : inner
      pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`)
    }
    return pts.join(' ')
  }

  const starPts = star8(cx, cy - Math.min(w,h)*0.04, starR, starR * 0.38)

  // 텍스트 크기
  const titleSize = Math.round(Math.min(w, h) * 0.072)
  const subSize   = Math.round(Math.min(w, h) * 0.038)
  const textY     = cy + starR + Math.min(w,h) * 0.13

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <radialGradient id="bg" cx="50%" cy="38%" r="70%">
      <stop offset="0%"   stop-color="#3b1f6e"/>
      <stop offset="55%"  stop-color="#1a0a3e"/>
      <stop offset="100%" stop-color="#080318"/>
    </radialGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%"   stop-color="#ffe066" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#ffe066" stop-opacity="0"/>
    </radialGradient>
    <filter id="starGlow" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="${Math.round(starR*0.18)}" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="moonGlow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="${Math.round(moonR*0.25)}" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="textGlow" x="-10%" y="-30%" width="120%" height="160%">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <!-- 배경 -->
  <rect width="${w}" height="${h}" fill="url(#bg)"/>

  <!-- 중앙 별 글로우 배경 -->
  <ellipse cx="${cx}" cy="${cy - Math.min(w,h)*0.04}" rx="${starR*2.2}" ry="${starR*2.2}" fill="url(#glow)"/>

  <!-- 흩어진 작은 별들 -->
  ${smallStars(w, h, cx, cy).join('\n  ')}

  <!-- 초승달 -->
  <g filter="url(#moonGlow)" opacity="0.88">
    <path d="M ${moonOffX} ${moonOffY - moonR}
             A ${moonR} ${moonR} 0 1 1 ${moonOffX} ${moonOffY + moonR}
             A ${moonR*0.58} ${moonR*0.58} 0 1 0 ${moonOffX} ${moonOffY - moonR} Z"
          fill="#e8d4ff"/>
  </g>

  <!-- 중앙 8각별 -->
  <g filter="url(#starGlow)">
    <circle cx="${cx}" cy="${cy - Math.min(w,h)*0.04}" r="${starR*1.1}" fill="#ffe066" opacity="0.07"/>
    <polygon points="${starPts}" fill="#ffe066"/>
    <circle cx="${cx}" cy="${cy - Math.min(w,h)*0.04}" r="${starR*0.18}" fill="#fff8dc"/>
    <circle cx="${cx}" cy="${cy - Math.min(w,h)*0.04}" r="${starR*0.09}" fill="#ffffff"/>
  </g>

  <!-- 앱 이름 -->
  <g filter="url(#textGlow)">
    <text x="${cx}" y="${textY}"
          font-family="serif" font-size="${titleSize}" font-weight="bold"
          fill="#f0e0ff" text-anchor="middle" letter-spacing="6">별빛 운세</text>
    <text x="${cx}" y="${textY + titleSize * 1.25}"
          font-family="sans-serif" font-size="${subSize}"
          fill="#c8aaff" text-anchor="middle" letter-spacing="3" opacity="0.85">✦ 오늘의 운세 ✦</text>
  </g>
</svg>`
}

// 랜덤처럼 보이지만 고정된 작은 별 위치들
function smallStars(w, h, cx, cy) {
  const seeds = [
    [0.12, 0.10], [0.25, 0.06], [0.38, 0.14], [0.62, 0.08], [0.75, 0.12], [0.88, 0.07],
    [0.08, 0.25], [0.92, 0.22], [0.05, 0.45], [0.95, 0.40], [0.10, 0.65], [0.90, 0.60],
    [0.15, 0.82], [0.82, 0.80], [0.28, 0.92], [0.70, 0.90], [0.50, 0.96],
    [0.20, 0.35], [0.78, 0.30], [0.18, 0.55], [0.80, 0.52],
  ]
  const minD = Math.min(w, h)
  return seeds.map(([fx, fy], i) => {
    const x = fx * w
    const y = fy * h
    const r = (i % 3 === 0 ? 0.008 : i % 3 === 1 ? 0.005 : 0.003) * minD
    const op = 0.35 + (i % 5) * 0.12
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="#ffffff" opacity="${op.toFixed(2)}"/>`
  })
}

const splashFiles = [
  { dir: 'drawable',            w: 480,  h: 320  },
  { dir: 'drawable-port-mdpi',  w: 320,  h: 480  },
  { dir: 'drawable-port-hdpi',  w: 480,  h: 800  },
  { dir: 'drawable-port-xhdpi', w: 720,  h: 1280 },
  { dir: 'drawable-port-xxhdpi',w: 960,  h: 1600 },
  { dir: 'drawable-port-xxxhdpi',w:1280, h: 1920 },
  { dir: 'drawable-land-mdpi',  w: 480,  h: 320  },
  { dir: 'drawable-land-hdpi',  w: 800,  h: 480  },
  { dir: 'drawable-land-xhdpi', w: 1280, h: 720  },
  { dir: 'drawable-land-xxhdpi',w: 1600, h: 960  },
  { dir: 'drawable-land-xxxhdpi',w:1920, h: 1280 },
]

async function run() {
  for (const { dir, w, h } of splashFiles) {
    const svg = makeSplashSvg(w, h)
    const out = path.join(androidBase, dir, 'splash.png')
    await sharp(Buffer.from(svg)).resize(w, h).png().toFile(out)
    console.log(`✓ ${dir}/splash.png (${w}x${h})`)
  }
  console.log('\n🌟 별빛 운세 스플래시 생성 완료!')
}

run().catch(console.error)
