/**
 * Canvas 공유 이미지 생성 (1080×1920 고정, 내용에 따라 자동 페이지 추가)
 * 순서: 운세 페이지(들) → 요약 페이지
 * 렌더링 중 실시간 overflow 감지 → 새 페이지 자동 생성
 */

interface ReadingData {
  keywords: string[]
  overall: string
  love: string
  wealth: string
  lucky_number: number
  lucky_color: string
  scores?: { overall: number; love: number; wealth: number; health: number; career: number } | null
  time_of_day?: { morning: string; afternoon: string; evening: string } | null
  lucky_items?: { color: string; colorName: string; number: number; food: string; direction: string; activity: string } | null
}

const W = 1080
const PAGE_H = 1920
const PAD = 80
const CONTENT_W = W - PAD * 2
const FOOTER_H = 120   // 하단 예약 (footer 영역)
const SAFE_PAD = 40    // 추가 안전 여유

interface Block {
  height: number
  draw: (ctx: CanvasRenderingContext2D, y: number) => void
}

// ─────────────────────────────────────────
// Public API
// ─────────────────────────────────────────

export async function generateShareImages(reading: ReadingData): Promise<File[]> {
  const fortuneCanvases = await buildFortuneCanvases(reading)
  const totalPages = fortuneCanvases.length + 1

  // 운세 캔버스에 페이지 번호 추가 후 파일 변환
  const fortuneFiles = await Promise.all(
    fortuneCanvases.map((canvas, i) => {
      const ctx = canvas.getContext('2d')!
      drawPageFooter(ctx, i + 1, totalPages)
      return canvasToFile(canvas, `ai-tarot-share-${i + 1}.png`)
    })
  )

  const summaryFile = await drawSummaryPage(reading, totalPages, totalPages)
  return [...fortuneFiles, summaryFile]
}

export async function generateShareImage(reading: ReadingData): Promise<File> {
  const [first] = await generateShareImages(reading)
  return first
}

// ─────────────────────────────────────────
// 운세 블록 빌더
// ─────────────────────────────────────────

function getMeasureCtx(): CanvasRenderingContext2D {
  const c = document.createElement('canvas')
  c.width = W
  c.height = 100
  return c.getContext('2d')!
}

function buildFortuneBlocks(reading: ReadingData): Block[] {
  const m = getMeasureCtx()
  const blocks: Block[] = []

  // ── 시간대별 슬롯 ──
  if (reading.time_of_day) {
    const slots = [
      { icon: '🌅', label: '오전', text: reading.time_of_day.morning },
      { icon: '☀️', label: '오후', text: reading.time_of_day.afternoon },
      { icon: '🌙', label: '저녁', text: reading.time_of_day.evening },
    ]
    for (const slot of slots) {
      m.font = '23px sans-serif'
      const lines = wrapText(m, slot.text, CONTENT_W - 24)
      const h = 8 + lines.length * 30 + 26
      const s = { ...slot }
      const l = [...lines]
      blocks.push({
        height: h,
        draw(ctx, y) {
          ctx.font = 'bold 26px sans-serif'
          ctx.fillStyle = '#e9d5ff'
          ctx.textAlign = 'left'
          ctx.fillText(`${s.icon} ${s.label}`, PAD, y)
          ctx.font = '23px sans-serif'
          ctx.fillStyle = '#d4d4d8'
          let ly = y + 8
          for (const line of l) {
            ly += 30
            ctx.fillText(line, PAD + 20, ly)
          }
        },
      })
    }
    // 시간대 구분선
    blocks.push({
      height: 50,
      draw(ctx, y) { drawDivider(ctx, y + 25) },
    })
  }

  // ── 운세 섹션 3개 ──
  const sections = [
    { title: '✨ 전체운', text: reading.overall, bg: 'rgba(147,51,234,0.15)', border: 'rgba(147,51,234,0.3)' },
    { title: '💖 애정운', text: reading.love,    bg: 'rgba(236,72,153,0.15)',  border: 'rgba(236,72,153,0.3)' },
    { title: '💰 재물운', text: reading.wealth,  bg: 'rgba(245,158,11,0.15)',  border: 'rgba(245,158,11,0.3)' },
  ]
  for (const sec of sections) {
    m.font = '24px sans-serif'
    const lines = wrapText(m, sec.text, CONTENT_W - 40)
    const boxH = 48 + lines.length * 32 + 16
    const ss = { ...sec }
    const ll = [...lines]
    const bH = boxH
    blocks.push({
      height: boxH + 20,
      draw(ctx, y) {
        ctx.fillStyle = ss.bg
        roundRect(ctx, PAD, y, CONTENT_W, bH, 16)
        ctx.fill()
        ctx.strokeStyle = ss.border
        ctx.lineWidth = 1
        roundRect(ctx, PAD, y, CONTENT_W, bH, 16)
        ctx.stroke()
        ctx.font = 'bold 28px sans-serif'
        ctx.fillStyle = '#ffffff'
        ctx.textAlign = 'left'
        ctx.fillText(ss.title, PAD + 20, y + 36)
        ctx.font = '24px sans-serif'
        ctx.fillStyle = '#d4d4d8'
        let ty = y + 68
        for (const line of ll) {
          ctx.fillText(line, PAD + 20, ty)
          ty += 32
        }
      },
    })
  }

  return blocks
}

// ─────────────────────────────────────────
// 운세 캔버스 빌더 (실시간 overflow 감지)
// ─────────────────────────────────────────

async function buildFortuneCanvases(reading: ReadingData): Promise<HTMLCanvasElement[]> {
  const blocks = buildFortuneBlocks(reading)
  const canvases: HTMLCanvasElement[] = []

  let canvas = makeCanvas()
  let ctx = canvas.getContext('2d')!
  let seed = 0

  // 첫 페이지 헤더
  drawBackground(ctx, seed)
  drawFullHeader(ctx)
  let curY = 242  // 헤더 이후 시작 Y

  for (const block of blocks) {
    // overflow 감지: 이 블록을 그리면 footer 영역 침범 여부
    if (curY + block.height + FOOTER_H + SAFE_PAD > PAGE_H) {
      // 현재 캔버스 저장 (footer는 나중에 추가)
      canvases.push(canvas)
      seed += 37

      // 새 캔버스 + 연속 헤더
      canvas = makeCanvas()
      ctx = canvas.getContext('2d')!
      drawBackground(ctx, seed)
      drawContinuationHeader(ctx)
      curY = 140  // 연속 헤더 이후 시작 Y
    }

    block.draw(ctx, curY)
    curY += block.height
  }

  // 마지막 캔버스 추가
  canvases.push(canvas)
  return canvases
}

// ── 첫 페이지 헤더 ──
function drawFullHeader(ctx: CanvasRenderingContext2D) {
  ctx.textAlign = 'center'
  ctx.font = '70px sans-serif'
  ctx.fillText('🔮', W / 2, 105)
  ctx.font = 'bold 38px sans-serif'
  ctx.fillStyle = '#ffffff'
  ctx.fillText('오늘의 AI 타로 운세', W / 2, 160)
  drawDivider(ctx, 196)
}

// ── 연속 페이지 헤더 ──
function drawContinuationHeader(ctx: CanvasRenderingContext2D) {
  ctx.textAlign = 'center'
  ctx.font = '50px sans-serif'
  ctx.fillText('🔮', W / 2, 65)
  ctx.font = 'bold 32px sans-serif'
  ctx.fillStyle = '#c4b5fd'
  ctx.fillText('AI 타로 운세 (계속)', W / 2, 110)
  drawDivider(ctx, 130)
}

// ─────────────────────────────────────────
// 요약 페이지
// ─────────────────────────────────────────

async function drawSummaryPage(reading: ReadingData, pageNum: number, totalPages: number): Promise<File> {
  const canvas = makeCanvas()
  const ctx = canvas.getContext('2d')!
  drawBackground(ctx, 0)

  const luckyColor = reading.lucky_items?.color || reading.lucky_color || '#667eea'

  ctx.fillStyle = `${luckyColor}22`
  ctx.beginPath()
  ctx.arc(W / 2, 260, 220, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = `${luckyColor}12`
  ctx.beginPath()
  ctx.arc(W / 2, 260, 290, 0, Math.PI * 2)
  ctx.fill()

  ctx.font = '110px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('🔮', W / 2, 300)
  ctx.font = 'bold 46px sans-serif'
  ctx.fillStyle = '#ffffff'
  ctx.fillText('오늘의 AI 타로 운세', W / 2, 390)

  let curY = 490

  if (reading.scores) {
    ctx.font = 'bold 100px sans-serif'
    ctx.fillStyle = '#a78bfa'
    ctx.fillText(`${reading.scores.overall}`, W / 2, curY)
    ctx.font = '28px sans-serif'
    ctx.fillStyle = '#c4b5fd'
    ctx.fillText('/ 100  종합 점수', W / 2, curY + 44)
    curY += 110

    const categories = [
      { label: '💖 애정운', score: reading.scores.love,   color: '#f472b6' },
      { label: '💰 재물운', score: reading.scores.wealth, color: '#fbbf24' },
      { label: '💪 건강운', score: reading.scores.health, color: '#34d399' },
      { label: '💼 직장운', score: reading.scores.career, color: '#60a5fa' },
    ]
    ctx.textAlign = 'left'
    for (const cat of categories) {
      curY += 54
      ctx.font = '26px sans-serif'
      ctx.fillStyle = '#d4d4d8'
      ctx.fillText(cat.label, PAD, curY)
      const barX = PAD + 164
      const barW = CONTENT_W - 224
      ctx.fillStyle = 'rgba(255,255,255,0.1)'
      roundRect(ctx, barX, curY - 18, barW, 24, 12)
      ctx.fill()
      ctx.fillStyle = cat.color
      roundRect(ctx, barX, curY - 18, barW * (cat.score / 100), 24, 12)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 24px sans-serif'
      ctx.fillText(`${cat.score}`, barX + barW + 14, curY)
    }
  } else {
    ctx.font = '28px sans-serif'
    ctx.fillStyle = '#d4d4d8'
    ctx.textAlign = 'left'
    const lines = wrapText(ctx, reading.overall, CONTENT_W)
    for (const line of lines.slice(0, 5)) {
      ctx.fillText(line, PAD, curY)
      curY += 36
    }
  }

  curY += 64
  drawDivider(ctx, curY)
  curY += 56

  // 키워드 배지
  ctx.font = 'bold 32px sans-serif'
  const badges = reading.keywords.map(kw => ({ text: kw, width: ctx.measureText(kw).width + 48 }))
  const totalBadgeW = badges.reduce((s, b) => s + b.width, 0) + (badges.length - 1) * 14
  let badgeX = (W - totalBadgeW) / 2
  ctx.textAlign = 'left'
  for (const badge of badges) {
    ctx.fillStyle = 'rgba(168,85,247,0.35)'
    roundRect(ctx, badgeX, curY - 32, badge.width, 54, 27)
    ctx.fill()
    ctx.fillStyle = '#e9d5ff'
    ctx.fillText(badge.text, badgeX + 24, curY)
    badgeX += badge.width + 14
  }

  // 행운 아이템
  curY += 80
  const itemNumber = reading.lucky_items?.number ?? reading.lucky_number
  const itemColor  = reading.lucky_items?.color || reading.lucky_color
  ctx.textAlign = 'center'
  ctx.fillStyle = itemColor
  ctx.beginPath()
  ctx.arc(W / 2 - 130, curY, 20, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.font = 'bold 30px sans-serif'
  ctx.fillStyle = '#fbbf24'
  ctx.fillText(`행운의 숫자  ${itemNumber}`, W / 2 + 20, curY + 10)

  if (reading.lucky_items) {
    curY += 46
    ctx.font = '26px sans-serif'
    ctx.fillStyle = '#c4b5fd'
    ctx.fillText(
      [`🍽️ ${reading.lucky_items.food}`, `🧭 ${reading.lucky_items.direction}`].join('   ·   '),
      W / 2, curY
    )
    curY += 40
    ctx.fillText(`⚡ ${reading.lucky_items.activity}`, W / 2, curY)
  }

  drawPageFooter(ctx, pageNum, totalPages)
  return canvasToFile(canvas, `ai-tarot-share-${pageNum}.png`)
}

// ─────────────────────────────────────────
// 공통 헬퍼
// ─────────────────────────────────────────

function makeCanvas(): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = W
  c.height = PAGE_H
  return c
}

function drawBackground(ctx: CanvasRenderingContext2D, seed: number) {
  const g = ctx.createLinearGradient(0, 0, W, PAGE_H)
  g.addColorStop(0, '#581c87')
  g.addColorStop(0.5, '#312e81')
  g.addColorStop(1, '#1e1b4b')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, PAGE_H)

  ctx.fillStyle = 'rgba(255,255,255,0.04)'
  for (let i = 0; i < 80; i++) {
    const sx = (Math.sin((i + seed) * 137.508) * 0.5 + 0.5) * W
    const sy = (Math.cos((i + seed) * 97.344) * 0.5 + 0.5) * PAGE_H
    const r  = (Math.sin((i + seed) * 43.758)  * 0.5 + 0.5) * 3 + 1
    ctx.beginPath()
    ctx.arc(sx, sy, r, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawDivider(ctx: CanvasRenderingContext2D, y: number) {
  const g = ctx.createLinearGradient(PAD, 0, W - PAD, 0)
  g.addColorStop(0,   'rgba(168,85,247,0)')
  g.addColorStop(0.5, 'rgba(168,85,247,0.4)')
  g.addColorStop(1,   'rgba(168,85,247,0)')
  ctx.strokeStyle = g
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(PAD, y)
  ctx.lineTo(W - PAD, y)
  ctx.stroke()
}

function drawPageFooter(ctx: CanvasRenderingContext2D, page: number, total: number) {
  ctx.textAlign = 'center'
  ctx.font = '24px sans-serif'
  ctx.fillStyle = 'rgba(196,181,253,0.4)'
  ctx.fillText('🔮 AI 타로 — 오늘의 운세', W / 2, PAGE_H - 72)
  ctx.font = '20px sans-serif'
  ctx.fillStyle = 'rgba(196,181,253,0.25)'
  ctx.fillText(`${page} / ${total}`, W / 2, PAGE_H - 36)
}

async function canvasToFile(canvas: HTMLCanvasElement, name: string): Promise<File> {
  const blob = await new Promise<Blob>(resolve => canvas.toBlob(b => resolve(b!), 'image/png'))
  return new File([blob], name, { type: 'image/png' })
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const lines: string[] = []
  let cur = ''
  for (const char of text) {
    const test = cur + char
    if (ctx.measureText(test).width > maxW) {
      lines.push(cur)
      cur = char
    } else {
      cur = test
    }
  }
  if (cur) lines.push(cur)
  return lines
}
