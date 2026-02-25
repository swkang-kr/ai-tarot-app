import { calculateSaju, solarToLunar, type SajuResult } from '@fullstackfamily/manseryeok'

export interface SajuInfo {
  yearPillar: string
  yearPillarHanja: string
  monthPillar: string
  monthPillarHanja: string
  dayPillar: string
  dayPillarHanja: string
  hourPillar: string | null
  hourPillarHanja: string | null
  lunarYear: number
  lunarMonth: number
  lunarDay: number
  isLeapMonth: boolean
}

export interface SajuDetailedAnalysis {
  dayMaster: { name: string; element: string; trait: string; description: string }
  elementBalance: { name: string; count: number; emoji: string }[]
  dominantElement: string
  weakElement: string
  pillarsDetail: {
    label: string
    hangul: string | null
    hanja: string | null
    cheonganMeaning: string
    jijiMeaning: string
    element: string
  }[]
  relationships: string[]
  summary: string
}

export function getSajuInfo(
  birthDate: string,
  birthHour?: number
): SajuInfo {
  const date = new Date(birthDate)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()

  const saju: SajuResult = calculateSaju(year, month, day, birthHour)
  const lunar = solarToLunar(year, month, day)

  return {
    yearPillar: saju.yearPillar,
    yearPillarHanja: saju.yearPillarHanja,
    monthPillar: saju.monthPillar,
    monthPillarHanja: saju.monthPillarHanja,
    dayPillar: saju.dayPillar,
    dayPillarHanja: saju.dayPillarHanja,
    hourPillar: saju.hourPillar,
    hourPillarHanja: saju.hourPillarHanja,
    lunarYear: lunar.lunar.year,
    lunarMonth: lunar.lunar.month,
    lunarDay: lunar.lunar.day,
    isLeapMonth: lunar.lunar.isLeapMonth,
  }
}

// 천간 → 오행
const CHEONGAN_ELEMENT: Record<string, string> = {
  '갑': '목(木)', '을': '목(木)',
  '병': '화(火)', '정': '화(火)',
  '무': '토(土)', '기': '토(土)',
  '경': '금(金)', '신': '금(金)',
  '임': '수(水)', '계': '수(水)',
}

// 지지 → 오행
const JIJI_ELEMENT: Record<string, string> = {
  '자': '수(水)', '축': '토(土)',
  '인': '목(木)', '묘': '목(木)',
  '진': '토(土)', '사': '화(火)',
  '오': '화(火)', '미': '토(土)',
  '신': '금(金)', '유': '금(金)',
  '술': '토(土)', '해': '수(水)',
}

// 천간 상세 의미
const CHEONGAN_MEANING: Record<string, string> = {
  '갑': '큰 나무 - 곧고 강직한 기운, 시작과 성장',
  '을': '풀과 꽃 - 유연하고 적응력 강한 기운',
  '병': '태양 - 밝고 뜨거운 에너지, 열정',
  '정': '촛불 - 따뜻하고 은은한 빛, 배려',
  '무': '큰 산 - 넓고 든든한 대지, 안정',
  '기': '정원 - 비옥한 땅, 포용과 생산',
  '경': '쇠와 바위 - 강인하고 날카로운 기운',
  '신': '보석과 귀금속 - 정교하고 빛나는 기운',
  '임': '큰 바다 - 넓고 깊은 지혜, 포용',
  '계': '비와 이슬 - 섬세하고 촉촉한 감성',
}

// 지지 상세 의미
const JIJI_MEANING: Record<string, string> = {
  '자': '쥐 - 지혜, 민첩함, 새로운 시작',
  '축': '소 - 성실, 끈기, 재물 축적',
  '인': '호랑이 - 용맹, 리더십, 모험',
  '묘': '토끼 - 온화, 예술성, 감수성',
  '진': '용 - 권위, 변화, 강한 에너지',
  '사': '뱀 - 지혜, 직관, 신비로움',
  '오': '말 - 활동적, 자유, 열정',
  '미': '양 - 온순, 예술, 평화',
  '신': '원숭이 - 재치, 영리함, 적응력',
  '유': '닭 - 정확성, 아름다움, 자신감',
  '술': '개 - 충성, 정의, 신뢰',
  '해': '돼지 - 복, 풍요, 순수함',
}

// 일간 상세 성향
const ILGAN_TRAIT: Record<string, string> = {
  '갑': '리더십과 추진력이 강한 성격',
  '을': '유연하고 섬세한 성격',
  '병': '밝고 열정적인 성격',
  '정': '따뜻하고 배려심 깊은 성격',
  '무': '든든하고 신뢰감 있는 성격',
  '기': '포용력이 크고 섬세한 성격',
  '경': '결단력 있고 의지가 강한 성격',
  '신': '정교하고 예리한 성격',
  '임': '지혜롭고 자유로운 성격',
  '계': '직관적이고 감성적인 성격',
}

const ILGAN_DESCRIPTION: Record<string, string> = {
  '갑': '갑목(甲木)은 큰 나무와 같습니다. 곧게 뻗어 자라는 성질로, 리더십이 강하고 정의감이 있으며, 독립적이고 진취적입니다. 다만 고집이 세고 융통성이 부족할 수 있습니다.',
  '을': '을목(乙木)은 풀이나 덩굴과 같습니다. 유연하게 환경에 적응하며, 섬세하고 인내심이 강합니다. 외유내강의 성격으로 부드럽지만 끈질긴 생명력을 가집니다.',
  '병': '병화(丙火)는 태양과 같습니다. 밝고 따뜻하며 에너지가 넘칩니다. 사교적이고 낙천적이며, 주변을 환하게 밝히는 존재입니다. 다만 성급하거나 감정 기복이 있을 수 있습니다.',
  '정': '정화(丁火)는 촛불과 같습니다. 은은하지만 꺼지지 않는 빛으로, 섬세하고 따뜻한 마음을 가졌습니다. 내면이 풍부하고 예술적 감각이 뛰어납니다.',
  '무': '무토(戊土)는 큰 산과 같습니다. 넓고 든든하며 사람들에게 안정감을 줍니다. 신뢰감이 있고 중재자 역할을 잘하지만, 변화에 느릴 수 있습니다.',
  '기': '기토(己土)는 기름진 밭과 같습니다. 만물을 키우는 포용력이 있으며, 세심하고 현실적입니다. 겸손하지만 내면에 큰 그릇을 지닙니다.',
  '경': '경금(庚金)은 바위나 쇠와 같습니다. 강인하고 의지가 굳으며, 정의롭고 결단력이 있습니다. 무게감이 있지만 직설적이어서 갈등을 빚을 수 있습니다.',
  '신': '신금(辛金)은 보석이나 귀금속과 같습니다. 정교하고 예리하며, 아름다움을 추구합니다. 감수성이 풍부하고 자존심이 강합니다.',
  '임': '임수(壬水)는 큰 바다와 같습니다. 넓고 깊은 지혜를 가지며, 자유롭고 포용력이 큽니다. 진취적이고 모험심이 강하지만 방향을 잃기 쉽습니다.',
  '계': '계수(癸水)는 비나 이슬과 같습니다. 섬세하고 직관적이며, 감성이 풍부합니다. 조용하지만 깊은 내면 세계를 가지며, 타인의 마음을 잘 읽습니다.',
}

// 오행 상생/상극
const ELEMENT_SHORT: Record<string, string> = {
  '목(木)': '목', '화(火)': '화', '토(土)': '토', '금(金)': '금', '수(水)': '수',
}
const SANGSAENG: Record<string, string> = {
  '목': '화', '화': '토', '토': '금', '금': '수', '수': '목',
}
const SANGGEUK: Record<string, string> = {
  '목': '토', '화': '금', '토': '수', '금': '목', '수': '화',
}

const ELEMENT_EMOJI: Record<string, string> = {
  '목(木)': '🌳', '화(火)': '🔥', '토(土)': '🏔️', '금(金)': '⚙️', '수(水)': '💧',
}

export function getElement(pillar: string): string {
  return CHEONGAN_ELEMENT[pillar[0]] || ''
}

export function getDayMasterTrait(dayPillar: string): string {
  return ILGAN_TRAIT[dayPillar[0]] || ''
}

export function getDetailedAnalysis(saju: SajuInfo): SajuDetailedAnalysis {
  const dayGan = saju.dayPillar[0]
  const dayElement = CHEONGAN_ELEMENT[dayGan] || ''

  // 모든 글자의 오행 수집
  const allElements: string[] = []
  const pillars = [saju.yearPillar, saju.monthPillar, saju.dayPillar]
  if (saju.hourPillar) pillars.push(saju.hourPillar)

  for (const p of pillars) {
    const ganEl = CHEONGAN_ELEMENT[p[0]]
    const jiEl = JIJI_ELEMENT[p[1]]
    if (ganEl) allElements.push(ganEl)
    if (jiEl) allElements.push(jiEl)
  }

  // 오행 카운트
  const elementCount: Record<string, number> = {
    '목(木)': 0, '화(火)': 0, '토(土)': 0, '금(金)': 0, '수(水)': 0,
  }
  for (const el of allElements) {
    elementCount[el] = (elementCount[el] || 0) + 1
  }

  const elementBalance = Object.entries(elementCount).map(([name, count]) => ({
    name,
    count,
    emoji: ELEMENT_EMOJI[name] || '',
  }))

  const sorted = [...elementBalance].sort((a, b) => b.count - a.count)
  const dominantElement = sorted[0].name
  const weakElement = sorted.filter(e => e.count === 0)[0]?.name
    || sorted[sorted.length - 1].name

  // 사주 각 주 상세
  const pillarData = [
    { label: '년주(年柱)', hangul: saju.yearPillar, hanja: saju.yearPillarHanja },
    { label: '월주(月柱)', hangul: saju.monthPillar, hanja: saju.monthPillarHanja },
    { label: '일주(日柱)', hangul: saju.dayPillar, hanja: saju.dayPillarHanja },
    { label: '시주(時柱)', hangul: saju.hourPillar, hanja: saju.hourPillarHanja },
  ]

  const pillarsDetail = pillarData.map(p => ({
    label: p.label,
    hangul: p.hangul,
    hanja: p.hanja,
    cheonganMeaning: p.hangul ? (CHEONGAN_MEANING[p.hangul[0]] || '') : '',
    jijiMeaning: p.hangul ? (JIJI_MEANING[p.hangul[1]] || '') : '',
    element: p.hangul ? (CHEONGAN_ELEMENT[p.hangul[0]] || '') : '',
  }))

  // 상생/상극 관계 분석
  const relationships: string[] = []
  const dayShort = ELEMENT_SHORT[dayElement] || ''

  if (dayShort) {
    const helpMe = Object.entries(SANGSAENG).find(([, v]) => v === dayShort)?.[0]
    const iHelp = SANGSAENG[dayShort]
    const hurtMe = Object.entries(SANGGEUK).find(([, v]) => v === dayShort)?.[0]
    const iHurt = SANGGEUK[dayShort]

    if (helpMe) relationships.push(`${helpMe} → ${dayShort} (상생: 나를 도와주는 기운)`)
    if (iHelp) relationships.push(`${dayShort} → ${iHelp} (상생: 내가 키우는 기운)`)
    if (hurtMe) relationships.push(`${hurtMe} → ${dayShort} (상극: 나를 제약하는 기운)`)
    if (iHurt) relationships.push(`${dayShort} → ${iHurt} (상극: 내가 극하는 기운)`)
  }

  // 종합 요약
  const missingElements = elementBalance.filter(e => e.count === 0).map(e => e.name)
  let summary = `일간 ${dayGan}(${dayElement})을 중심으로, `
  summary += `${dominantElement}이(가) ${sorted[0].count}개로 가장 강합니다. `
  if (missingElements.length > 0) {
    summary += `${missingElements.join(', ')}이(가) 부족하여 이를 보충하면 좋겠습니다.`
  } else {
    summary += `오행이 고르게 분포되어 균형 잡힌 사주입니다.`
  }

  return {
    dayMaster: {
      name: dayGan,
      element: dayElement,
      trait: ILGAN_TRAIT[dayGan] || '',
      description: ILGAN_DESCRIPTION[dayGan] || '',
    },
    elementBalance,
    dominantElement,
    weakElement,
    pillarsDetail,
    relationships,
    summary,
  }
}
