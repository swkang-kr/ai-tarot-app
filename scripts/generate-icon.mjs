import sharp from 'sharp'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

// ─── 별빛 운세 아이콘 v2 ───────────────────────────────────────────────
// 컨셉: 앱스토어급 미니멀 럭셔리
//  - 딥 퍼플 → 네이비 그라디언트 배경 (라운드 렉트)
//  - 중앙: 4각 다이아몬드 별 (골드 그라디언트 + 다층 글로우)
//  - 우상단: 초승달 (은은한 화이트)
//  - 배경: 보케 별 파티클 (작고 흐릿하게)
// ─────────────────────────────────────────────────────────────────────

const SIZE = 1024

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs>

    <!-- 배경 그라디언트: 딥 퍼플 → 다크 네이비 -->
    <linearGradient id="bgGrad" x1="30%" y1="0%" x2="70%" y2="100%">
      <stop offset="0%"   stop-color="#1e0845"/>
      <stop offset="45%"  stop-color="#160a3a"/>
      <stop offset="100%" stop-color="#07031a"/>
    </linearGradient>

    <!-- 배경 중앙 광채 -->
    <radialGradient id="centerGlow" cx="48%" cy="46%" r="42%">
      <stop offset="0%"   stop-color="#4a1d96" stop-opacity="0.7"/>
      <stop offset="100%" stop-color="#07031a" stop-opacity="0"/>
    </radialGradient>

    <!-- 별 본체 그라디언트 (골드) -->
    <linearGradient id="starGold" x1="20%" y1="0%" x2="80%" y2="100%">
      <stop offset="0%"   stop-color="#fff4b8"/>
      <stop offset="30%"  stop-color="#ffd95e"/>
      <stop offset="70%"  stop-color="#f4a800"/>
      <stop offset="100%" stop-color="#c97d00"/>
    </linearGradient>

    <!-- 별 중심 화이트 하이라이트 -->
    <radialGradient id="starCore" cx="42%" cy="38%" r="55%">
      <stop offset="0%"   stop-color="#ffffff" stop-opacity="1"/>
      <stop offset="40%"  stop-color="#fff8d0" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#ffd95e" stop-opacity="0"/>
    </radialGradient>

    <!-- 달 그라디언트 -->
    <linearGradient id="moonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="#f0e8ff"/>
      <stop offset="100%" stop-color="#c8aaee"/>
    </linearGradient>

    <!-- 글로우 필터 (별 외부 빛) -->
    <filter id="outerGlow" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="28" result="blur1"/>
      <feGaussianBlur in="SourceGraphic" stdDeviation="14" result="blur2"/>
      <feGaussianBlur in="SourceGraphic" stdDeviation="6"  result="blur3"/>
      <feMerge>
        <feMergeNode in="blur1"/>
        <feMergeNode in="blur2"/>
        <feMergeNode in="blur3"/>
      </feMerge>
    </filter>

    <!-- 중간 글로우 -->
    <filter id="midGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <!-- 달 소프트 글로우 -->
    <filter id="moonGlow" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="10" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <!-- 보케 필터 (흐릿한 배경 별) -->
    <filter id="bokeh" x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur stdDeviation="3"/>
    </filter>

    <!-- 클리핑 (라운드 렉트 - 앱 아이콘 모양) -->
    <clipPath id="roundRect">
      <rect width="${SIZE}" height="${SIZE}" rx="224" ry="224"/>
    </clipPath>

  </defs>

  <g clip-path="url(#roundRect)">

    <!-- ① 배경 -->
    <rect width="${SIZE}" height="${SIZE}" fill="url(#bgGrad)"/>
    <rect width="${SIZE}" height="${SIZE}" fill="url(#centerGlow)"/>

    <!-- ② 보케 별 파티클 (배경) -->
    <!-- 큰 보케 -->
    <circle cx="180" cy="160" r="18" fill="#7c3aed" opacity="0.18" filter="url(#bokeh)"/>
    <circle cx="820" cy="200" r="14" fill="#6d28d9" opacity="0.15" filter="url(#bokeh)"/>
    <circle cx="120" cy="600" r="20" fill="#5b21b6" opacity="0.12" filter="url(#bokeh)"/>
    <circle cx="890" cy="700" r="16" fill="#7c3aed" opacity="0.14" filter="url(#bokeh)"/>
    <circle cx="750" cy="880" r="12" fill="#6d28d9" opacity="0.12" filter="url(#bokeh)"/>
    <circle cx="200" cy="820" r="10" fill="#5b21b6" opacity="0.10" filter="url(#bokeh)"/>
    <!-- 작은 선명한 별 -->
    <circle cx="148" cy="255" r="2.5" fill="#e2d4f0" opacity="0.55"/>
    <circle cx="295" cy="142" r="2"   fill="#f0eaf8" opacity="0.50"/>
    <circle cx="440" cy="108" r="1.8" fill="#e8e0f0" opacity="0.45"/>
    <circle cx="620" cy="130" r="2.2" fill="#f0eaf8" opacity="0.50"/>
    <circle cx="790" cy="160" r="2"   fill="#e2d4f0" opacity="0.48"/>
    <circle cx="900" cy="300" r="2.5" fill="#f0eaf8" opacity="0.52"/>
    <circle cx="930" cy="480" r="2"   fill="#e2d4f0" opacity="0.45"/>
    <circle cx="880" cy="620" r="1.8" fill="#f0eaf8" opacity="0.42"/>
    <circle cx="100" cy="420" r="2.2" fill="#e8e0f0" opacity="0.48"/>
    <circle cx="130" cy="680" r="2"   fill="#f0eaf8" opacity="0.45"/>
    <circle cx="250" cy="890" r="2.5" fill="#e2d4f0" opacity="0.40"/>
    <circle cx="500" cy="930" r="2"   fill="#f0eaf8" opacity="0.38"/>
    <circle cx="730" cy="910" r="2.2" fill="#e8e0f0" opacity="0.40"/>
    <circle cx="340" cy="200" r="1.5" fill="#ffffff" opacity="0.60"/>
    <circle cx="700" cy="240" r="1.5" fill="#ffffff" opacity="0.55"/>
    <circle cx="860" cy="430" r="1.5" fill="#ffffff" opacity="0.50"/>
    <circle cx="155" cy="500" r="1.5" fill="#ffffff" opacity="0.52"/>

    <!-- ③ 초승달 (우상단) -->
    <g filter="url(#moonGlow)" opacity="0.92">
      <!-- 달 본체 -->
      <circle cx="700" cy="230" r="82" fill="url(#moonGrad)"/>
      <!-- 달 그림자 (초승달 만들기) -->
      <circle cx="734" cy="212" r="74" fill="#160a3a"/>
    </g>
    <!-- 달 하이라이트 -->
    <ellipse cx="682" cy="198" rx="14" ry="22" fill="white" opacity="0.22" transform="rotate(-20,682,198)"/>

    <!-- ④ 별 외부 글로우 레이어 (황금빛 오라) -->
    <g filter="url(#outerGlow)" opacity="0.5">
      <polygon points="
        512,240  542,452  745,422  575,512
        745,602  542,572  512,784  482,572
        279,602  449,512  279,422  482,452"
        fill="#fbbf24"/>
    </g>

    <!-- ⑤ 별 중간 글로우 -->
    <g filter="url(#midGlow)" opacity="0.75">
      <polygon points="
        512,268  538,454  722,428  568,512
        722,596  538,570  512,756  486,570
        302,596  456,512  302,428  486,454"
        fill="#fcd34d"/>
    </g>

    <!-- ⑥ 별 본체 (4각 다이아몬드 별) -->
    <!-- 별 그림자/깊이 -->
    <polygon points="
      512,286  535,456  706,432  562,512
      706,592  535,568  512,738  489,568
      318,592  462,512  318,432  489,456"
      fill="#92400e" opacity="0.3" transform="translate(6,8)"/>
    <!-- 별 본체 -->
    <polygon points="
      512,286  535,456  706,432  562,512
      706,592  535,568  512,738  489,568
      318,592  462,512  318,432  489,456"
      fill="url(#starGold)"/>
    <!-- 별 코어 하이라이트 -->
    <polygon points="
      512,286  535,456  706,432  562,512
      706,592  535,568  512,738  489,568
      318,592  462,512  318,432  489,456"
      fill="url(#starCore)" opacity="0.6"/>

    <!-- ⑦ 별 중심 광점 -->
    <circle cx="512" cy="512" r="38" fill="white" opacity="0.22"/>
    <circle cx="512" cy="512" r="20" fill="white" opacity="0.55"/>
    <circle cx="512" cy="512" r="9"  fill="white" opacity="0.95"/>

    <!-- ⑧ 별 4방향 광선 (렌즈 플레어 느낌) -->
    <line x1="512" y1="200" x2="512" y2="360" stroke="white" stroke-width="2.5" opacity="0.18"/>
    <line x1="512" y1="664" x2="512" y2="824" stroke="white" stroke-width="2.5" opacity="0.18"/>
    <line x1="200" y1="512" x2="360" y2="512" stroke="white" stroke-width="2.5" opacity="0.18"/>
    <line x1="664" y1="512" x2="824" y2="512" stroke="white" stroke-width="2.5" opacity="0.18"/>

  </g>
</svg>`

async function generateIcons() {
  const svgBuf = Buffer.from(svg)

  const androidSizes = [
    { dir: 'mipmap-mdpi',     size: 48  },
    { dir: 'mipmap-hdpi',     size: 72  },
    { dir: 'mipmap-xhdpi',    size: 96  },
    { dir: 'mipmap-xxhdpi',   size: 144 },
    { dir: 'mipmap-xxxhdpi',  size: 192 },
  ]
  const androidBase = path.join(root, 'android/app/src/main/res')

  for (const { dir, size } of androidSizes) {
    await sharp(svgBuf).resize(size, size).png().toFile(path.join(androidBase, dir, 'ic_launcher.png'))
    await sharp(svgBuf).resize(size, size).png().toFile(path.join(androidBase, dir, 'ic_launcher_round.png'))
    console.log(`✓ ${dir} (${size}x${size})`)
  }

  // foreground: 별+달만 (배경 투명)
  const fgSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs>
    <linearGradient id="starGold" x1="20%" y1="0%" x2="80%" y2="100%">
      <stop offset="0%"  stop-color="#fff4b8"/>
      <stop offset="30%" stop-color="#ffd95e"/>
      <stop offset="70%" stop-color="#f4a800"/>
      <stop offset="100%" stop-color="#c97d00"/>
    </linearGradient>
    <radialGradient id="starCore" cx="42%" cy="38%" r="55%">
      <stop offset="0%"   stop-color="#ffffff" stop-opacity="1"/>
      <stop offset="100%" stop-color="#ffd95e" stop-opacity="0"/>
    </radialGradient>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="14" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <g filter="url(#glow)" opacity="0.6">
    <polygon points="512,286 535,456 706,432 562,512 706,592 535,568 512,738 489,568 318,592 462,512 318,432 489,456" fill="#fcd34d"/>
  </g>
  <polygon points="512,286 535,456 706,432 562,512 706,592 535,568 512,738 489,568 318,592 462,512 318,432 489,456" fill="url(#starGold)"/>
  <polygon points="512,286 535,456 706,432 562,512 706,592 535,568 512,738 489,568 318,592 462,512 318,432 489,456" fill="url(#starCore)" opacity="0.55"/>
  <circle cx="512" cy="512" r="20" fill="white" opacity="0.55"/>
  <circle cx="512" cy="512" r="9" fill="white" opacity="0.95"/>
</svg>`

  const fgBuf = Buffer.from(fgSvg)
  for (const { dir, size } of androidSizes) {
    await sharp(fgBuf).resize(size, size).png().toFile(path.join(androidBase, dir, 'ic_launcher_foreground.png'))
    console.log(`✓ ${dir}/foreground (${size}x${size})`)
  }

  // PWA
  const publicBase = path.join(root, 'public')
  await sharp(svgBuf).resize(192, 192).png().toFile(path.join(publicBase, 'icon-192.png'))
  await sharp(svgBuf).resize(512, 512).png().toFile(path.join(publicBase, 'icon-512.png'))
  console.log('✓ public/icon-192.png, icon-512.png')

  console.log('\n✨ 별빛 운세 아이콘 v2 생성 완료!')
}

generateIcons().catch(console.error)
