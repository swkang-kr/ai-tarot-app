import sharp from 'sharp'
import { writeFileSync } from 'fs'
import { mkdirSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

// 별빛 운세 아이콘 SVG (1024x1024)
// 컨셉: 짙은 보라+남색 그라디언트 배경, 중앙 큰 별, 주변 작은 별들, 달
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <radialGradient id="bg" cx="50%" cy="40%" r="65%">
      <stop offset="0%" stop-color="#3b1f6e"/>
      <stop offset="50%" stop-color="#1a0a3e"/>
      <stop offset="100%" stop-color="#0a0520"/>
    </radialGradient>
    <radialGradient id="starGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffe066" stop-opacity="1"/>
      <stop offset="40%" stop-color="#ffd700" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#ffaa00" stop-opacity="0"/>
    </radialGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <filter id="softGlow">
      <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- 배경 -->
  <rect width="1024" height="1024" rx="200" fill="url(#bg)"/>

  <!-- 배경 별빛 산란 효과 -->
  <circle cx="512" cy="420" r="280" fill="url(#starGlow)" opacity="0.15"/>

  <!-- 초승달 -->
  <g filter="url(#softGlow)" opacity="0.9">
    <path d="M 680 200
             A 100 100 0 1 1 680 380
             A 65 65 0 1 0 680 200 Z"
          fill="#f0e0ff" opacity="0.85"/>
  </g>

  <!-- 작은 배경 별들 -->
  <g fill="#ffffff" opacity="0.5">
    <circle cx="160" cy="150" r="3"/>
    <circle cx="240" cy="280" r="2"/>
    <circle cx="120" cy="380" r="2.5"/>
    <circle cx="300" cy="180" r="2"/>
    <circle cx="820" cy="160" r="3"/>
    <circle cx="880" cy="300" r="2"/>
    <circle cx="750" cy="440" r="2.5"/>
    <circle cx="900" cy="460" r="2"/>
    <circle cx="180" cy="600" r="2"/>
    <circle cx="840" cy="580" r="2.5"/>
    <circle cx="140" cy="720" r="2"/>
    <circle cx="860" cy="700" r="2"/>
    <circle cx="200" cy="820" r="1.5"/>
    <circle cx="780" cy="820" r="2"/>
    <circle cx="350" cy="130" r="1.5"/>
    <circle cx="650" cy="120" r="2"/>
  </g>

  <!-- 중간 크기 별들 -->
  <g filter="url(#softGlow)">
    <!-- 좌상단 별 -->
    <polygon points="220,240 230,270 260,270 237,288 246,318 220,300 194,318 203,288 180,270 210,270"
             fill="#e8d0ff" opacity="0.7" transform="scale(0.6) translate(147,133)"/>
    <!-- 우하단 별 -->
    <polygon points="780,700 790,730 820,730 797,748 806,778 780,760 754,778 763,748 740,730 770,730"
             fill="#c8b0ff" opacity="0.6"/>
  </g>

  <!-- 중앙 큰 별 (8각 별) -->
  <g filter="url(#glow)" transform="translate(512, 490)">
    <!-- 별 광채 -->
    <circle cx="0" cy="0" r="160" fill="#ffe066" opacity="0.08"/>
    <circle cx="0" cy="0" r="120" fill="#ffe066" opacity="0.1"/>
    <!-- 8각 별 -->
    <polygon points="
      0,-155  18,-55  75,-75  55,-18  155,0  55,18  75,75  18,55
      0,155  -18,55  -75,75  -55,18  -155,0  -55,-18  -75,-75  -18,-55"
      fill="#ffe066"/>
    <!-- 별 중심 밝은 점 -->
    <circle cx="0" cy="0" r="28" fill="#fff8dc"/>
    <circle cx="0" cy="0" r="14" fill="#ffffff"/>
  </g>

  <!-- 하단 작은 반짝이는 별 3개 -->
  <g filter="url(#softGlow)" fill="#c8aaff">
    <!-- 좌 -->
    <polygon points="320,700 326,720 346,720 330,732 336,752 320,740 304,752 310,732 294,720 314,720"
             opacity="0.8" transform="scale(0.7) translate(137,300)"/>
    <!-- 중 -->
    <polygon points="512,730 518,750 538,750 522,762 528,782 512,770 496,782 502,762 486,750 506,750"
             opacity="0.9"/>
    <!-- 우 -->
    <polygon points="700,700 706,720 726,720 710,732 716,752 700,740 684,752 690,732 674,720 694,720"
             opacity="0.8" transform="scale(0.7) translate(300,300)"/>
  </g>
</svg>`

async function generateIcons() {
  const svgBuffer = Buffer.from(svg)

  // 아이콘 사이즈 정의
  const androidSizes = [
    { dir: 'mipmap-mdpi',    size: 48 },
    { dir: 'mipmap-hdpi',    size: 72 },
    { dir: 'mipmap-xhdpi',   size: 96 },
    { dir: 'mipmap-xxhdpi',  size: 144 },
    { dir: 'mipmap-xxxhdpi', size: 192 },
  ]

  const androidBase = path.join(root, 'android/app/src/main/res')

  for (const { dir, size } of androidSizes) {
    const outPath = path.join(androidBase, dir, 'ic_launcher.png')
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outPath)
    console.log(`✓ ${dir}/ic_launcher.png (${size}x${size})`)

    // round 아이콘도 동일하게 (원형 마스크)
    const roundPath = path.join(androidBase, dir, 'ic_launcher_round.png')
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(roundPath)
    console.log(`✓ ${dir}/ic_launcher_round.png (${size}x${size})`)
  }

  // foreground (같은 이미지, 배경 투명하게 처리 - 별 아이콘만)
  const fgSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <filter id="glow">
      <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
      <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="softGlow">
      <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
      <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <g filter="url(#glow)" transform="translate(512, 490)">
    <circle cx="0" cy="0" r="160" fill="#ffe066" opacity="0.08"/>
    <polygon points="0,-155 18,-55 75,-75 55,-18 155,0 55,18 75,75 18,55 0,155 -18,55 -75,75 -55,18 -155,0 -55,-18 -75,-75 -18,-55"
      fill="#ffe066"/>
    <circle cx="0" cy="0" r="28" fill="#fff8dc"/>
    <circle cx="0" cy="0" r="14" fill="#ffffff"/>
  </g>
  <g filter="url(#softGlow)" fill="#c8aaff">
    <polygon points="512,730 518,750 538,750 522,762 528,782 512,770 496,782 502,762 486,750 506,750" opacity="0.9"/>
  </g>
</svg>`

  const fgBuffer = Buffer.from(fgSvg)
  for (const { dir, size } of androidSizes) {
    const fgPath = path.join(androidBase, dir, 'ic_launcher_foreground.png')
    await sharp(fgBuffer)
      .resize(size, size)
      .png()
      .toFile(fgPath)
    console.log(`✓ ${dir}/ic_launcher_foreground.png (${size}x${size})`)
  }

  // PWA 아이콘 (public/)
  const publicBase = path.join(root, 'public')
  await sharp(svgBuffer).resize(192, 192).png().toFile(path.join(publicBase, 'icon-192.png'))
  console.log('✓ public/icon-192.png')
  await sharp(svgBuffer).resize(512, 512).png().toFile(path.join(publicBase, 'icon-512.png'))
  console.log('✓ public/icon-512.png')

  console.log('\n🌟 별빛 운세 아이콘 생성 완료!')
}

generateIcons().catch(console.error)
