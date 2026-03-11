import { calculateSaju, solarToLunar, getSolarTermsByYear, type SajuResult } from '@fullstackfamily/manseryeok'

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

export interface HyeongChungResult {
  type: '충(冲)' | '합(合)' | '형(刑)' | '해(害)' | '파(破)'
  chars: [string, string]
  meaning: string
}

export interface SinsalInfo {
  name: string
  meaning: string
  pillars: string[]
}

export interface SamjaeInfo {
  isSamjae: boolean
  type: '들삼재' | '눌삼재' | '날삼재' | null
  description: string
}

export interface SajuDetailedAnalysis {
  dayMaster: { name: string; element: string; trait: string; description: string }
  elementBalance: { name: string; count: number; emoji: string }[]
  /** 지장간 포함 정밀 오행 분포 */
  elementBalanceWithJijanggan: { name: string; count: number; emoji: string }[]
  dominantElement: string
  weakElement: string
  /** 신강(身强) / 신약(身弱) */
  bodyStrength: '신강(身强)' | '신약(身弱)' | '중화(中和)'
  pillarsDetail: {
    label: string
    hangul: string | null
    hanja: string | null
    cheonganMeaning: string
    jijiMeaning: string
    element: string
    /** 십성 (일주 천간은 '일간(日干)') */
    sipseong: string
    /** 십이운성 (일간 기준 지지의 운성) */
    sipiunsung: string
  }[]
  relationships: string[]
  /** 삼합·반합·육합·천간합·충·형·해·파 */
  specialRelations: HyeongChungResult[]
  /** 신살 목록 */
  sinsal: SinsalInfo[]
  /** 공망(空亡) 지지 2개 — 일주(日柱) 기준 */
  gongmang: [string, string]
  /** 공망 지지가 실제로 존재하는 주 및 위치별 해석 */
  gongmangPillars: { label: string; ji: string; meaning: string }[]
  /** 격국(格局) — 월지 지장간 투간(透干) 우선, 없으면 본기(本氣) 기준 */
  geokguk: string
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
const JIJI_ELEMENT_FIXED: Record<string, string> = {
  '자': '수(水)', '축': '토(土)',
  '인': '목(木)', '묘': '목(木)',
  '진': '토(土)', '사': '화(火)',
  '오': '화(火)', '미': '토(土)',
  '신': '금(金)', '유': '금(金)',
  '술': '토(土)', '해': '수(水)',
}

// 오행 단축명
const ELEMENT_SHORT: Record<string, string> = {
  '목(木)': '목', '화(火)': '화', '토(土)': '토', '금(金)': '금', '수(水)': '수',
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

// 오행 상생/상극 (단축명 기준)
const SANGSAENG: Record<string, string> = {
  '목': '화', '화': '토', '토': '금', '금': '수', '수': '목',
}
const SANGGEUK: Record<string, string> = {
  '목': '토', '화': '금', '토': '수', '금': '목', '수': '화',
}

const ELEMENT_EMOJI: Record<string, string> = {
  '목(木)': '🌳', '화(火)': '🔥', '토(土)': '🏔️', '금(金)': '⚙️', '수(水)': '💧',
}

// ────────────────────────────────────────────────────────────
// 십성(十星) 계산
// ────────────────────────────────────────────────────────────
/** 양간(陽干) 집합 */
const YANG_GAN = new Set(['갑', '병', '무', '경', '임'])

/** 천간 → 오행 단축명 */
function getElShort(gan: string): string {
  return ELEMENT_SHORT[CHEONGAN_ELEMENT[gan] || ''] || ''
}

/**
 * 일간(dayGan) 기준 대상 천간(targetGan)의 십성을 반환합니다.
 * 일주 천간 자신은 '일간(日干)' 반환.
 */
export function getSipseong(dayGan: string, targetGan: string): string {
  if (dayGan === targetGan) return '일간(日干)'
  const dayEl = getElShort(dayGan)
  const targetEl = getElShort(targetGan)
  if (!dayEl || !targetEl) return ''

  const sameYinYang = YANG_GAN.has(dayGan) === YANG_GAN.has(targetGan)

  if (dayEl === targetEl) return sameYinYang ? '비견(比肩)' : '겁재(劫財)'
  if (SANGSAENG[dayEl] === targetEl) return sameYinYang ? '식신(食神)' : '상관(傷官)'
  if (SANGGEUK[dayEl] === targetEl) return sameYinYang ? '편재(偏財)' : '정재(正財)'
  if (SANGGEUK[targetEl] === dayEl) return sameYinYang ? '편관(偏官)' : '정관(正官)'
  if (SANGSAENG[targetEl] === dayEl) return sameYinYang ? '편인(偏印)' : '정인(正印)'
  return ''
}

// ────────────────────────────────────────────────────────────
// 공망(空亡) 계산 — 일주(日柱) 기준
// ────────────────────────────────────────────────────────────
/** 60갑자 순(旬)별 공망 지지 쌍 (순번 0~5 × 10) */
const GAPJA_GONGMANG: [string, string][] = [
  ['술', '해'], // 0~9:  갑자~계유
  ['신', '유'], // 10~19: 갑술~계미
  ['오', '미'], // 20~29: 갑신~계사
  ['진', '사'], // 30~39: 갑오~계묘
  ['인', '묘'], // 40~49: 갑진~계축
  ['자', '축'], // 50~59: 갑인~계해
]

const CHEONGAN_ORDER_60 = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계']
const JIJI_ORDER_60 = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해']

/** 간지 → 60갑자 순번(0~59) 반환 */
function getGapjaNum(gan: string, ji: string): number {
  const ganIdx = CHEONGAN_ORDER_60.indexOf(gan)
  const jiIdx = JIJI_ORDER_60.indexOf(ji)
  if (ganIdx === -1 || jiIdx === -1) return -1
  for (let i = 0; i < 60; i++) {
    if (i % 10 === ganIdx && i % 12 === jiIdx) return i
  }
  return -1
}

/** 일주(日柱) 기준 공망(空亡) 지지 2개 반환 */
export function getGongmang(dayPillar: string): [string, string] {
  const num = getGapjaNum(dayPillar[0], dayPillar[1])
  if (num === -1) return ['없음', '없음']
  return GAPJA_GONGMANG[Math.floor(num / 10)]
}

// ────────────────────────────────────────────────────────────
// 지장간(地藏干) 테이블  (여기·중기·본기 순서)
// ────────────────────────────────────────────────────────────
const JIJANGGAN: Record<string, string[]> = {
  '자': ['임', '계'],           // 水(중기)·水(본기)
  '축': ['계', '신', '기'],     // 水(여기)·金(중기)·土(본기)
  '인': ['무', '병', '갑'],     // 土(여기)·火(중기)·木(본기)
  '묘': ['갑', '을'],           // 木(여기)·木(본기)
  '진': ['을', '계', '무'],     // 木(여기)·水(중기)·土(본기)
  '사': ['무', '경', '병'],     // 土(여기)·金(중기)·火(본기)
  '오': ['기', '정'],           // 土(중기)·火(본기)
  '미': ['정', '을', '기'],     // 火(여기)·木(중기)·土(본기)
  '신': ['무', '임', '경'],     // 土(여기)·水(중기)·金(본기)
  '유': ['경', '신'],           // 金(여기)·金(본기)
  '술': ['신', '정', '무'],     // 金(여기)·火(중기)·土(본기)
  '해': ['무', '갑', '임'],     // 土(여기)·木(중기)·水(본기)
}

// ────────────────────────────────────────────────────────────
// 지장간(地藏干) 가중치 테이블 — 여기=1, 중기=2, 본기=3
// 전통 명리학: 본기(本氣) > 중기(中氣) > 여기(餘氣)
// ────────────────────────────────────────────────────────────
const JIJANGGAN_WEIGHTED: Record<string, { gan: string; weight: number }[]> = {
  '자': [{ gan: '임', weight: 2 }, { gan: '계', weight: 3 }],
  '축': [{ gan: '계', weight: 1 }, { gan: '신', weight: 2 }, { gan: '기', weight: 3 }],
  '인': [{ gan: '무', weight: 1 }, { gan: '병', weight: 2 }, { gan: '갑', weight: 3 }],
  '묘': [{ gan: '갑', weight: 1 }, { gan: '을', weight: 3 }],
  '진': [{ gan: '을', weight: 1 }, { gan: '계', weight: 2 }, { gan: '무', weight: 3 }],
  '사': [{ gan: '무', weight: 1 }, { gan: '경', weight: 2 }, { gan: '병', weight: 3 }],
  '오': [{ gan: '기', weight: 2 }, { gan: '정', weight: 3 }],
  '미': [{ gan: '정', weight: 1 }, { gan: '을', weight: 2 }, { gan: '기', weight: 3 }],
  '신': [{ gan: '무', weight: 1 }, { gan: '임', weight: 2 }, { gan: '경', weight: 3 }],
  '유': [{ gan: '경', weight: 1 }, { gan: '신', weight: 3 }],
  '술': [{ gan: '신', weight: 1 }, { gan: '정', weight: 2 }, { gan: '무', weight: 3 }],
  '해': [{ gan: '무', weight: 1 }, { gan: '갑', weight: 2 }, { gan: '임', weight: 3 }],
}

// ────────────────────────────────────────────────────────────
// 형·충·합·해·파 테이블
// ────────────────────────────────────────────────────────────
// 육충(六冲)
const YUKCHUNG: [string, string, string][] = [
  ['자', '오', '子午충 - 감정·이동·갈등의 기운'],
  ['축', '미', '丑未충 - 고집 충돌, 재물 변동'],
  ['인', '신', '寅申충 - 사고·수술·큰 변화'],
  ['묘', '유', '卯酉충 - 이별·구설·직업 변동'],
  ['진', '술', '辰戌충 - 이동·변화·고생 후 성취'],
  ['사', '해', '巳亥충 - 건강 주의, 사상적 갈등'],
]

// 지지 육합(六合)
const YUKHAP: [string, string, string][] = [
  ['자', '축', '子丑합 - 안정과 결합의 기운(土)'],
  ['인', '해', '寅亥합 - 새 인연·도약의 기운(木)'],
  ['묘', '술', '卯戌합 - 끌림·예술적 조화(火)'],
  ['진', '유', '辰酉합 - 재물·결실의 기운(金)'],
  ['사', '신', '巳申합 - 변화·합의의 기운(水)'],
  ['오', '미', '午未합 - 화합·따뜻함의 기운(火)'],
]

// 천간합(天干合)
const CHEONGANHAP: [string, string, string][] = [
  ['갑', '기', '甲己합(土) - 포용과 결실'],
  ['을', '경', '乙庚합(金) - 과감한 결단'],
  ['병', '신', '丙辛합(水) - 지혜와 변화'],
  ['정', '임', '丁壬합(木) - 열정과 도약'],
  ['무', '계', '戊癸합(火) - 열정적 결합'],
]

// 삼형(三刑) — [지지 목록, 의미, 성립에 필요한 최소 개수]
const SAMHYEONG: [string[], string, number][] = [
  [['인', '사', '신'], '寅巳申 삼형 - 관재·사고 주의', 3],   // 3개 모두 있어야 성립
  [['축', '술', '미'], '丑戌未 삼형 - 재물 손실·분쟁', 3],  // 3개 모두 있어야 성립
  [['자', '묘'], '子卯 상형 - 법적 문제·구설', 2],           // 2개로 성립
]

// 육해(六害)
const YUKHAE: [string, string, string][] = [
  ['자', '미', '子未해 - 감정 상처·이별'],
  ['축', '오', '丑午해 - 재물 손실·건강'],
  ['인', '사', '寅巳해 - 관계 손상·갈등'],
  ['묘', '진', '卯辰해 - 실패·오해'],
  ['신', '해', '申亥해 - 변동·이동'],
  ['유', '술', '酉戌해 - 구설·반목'],
]

// 육파(六破)
const YUKPA: [string, string, string][] = [
  ['자', '유', '子酉파 - 계획 무산·이별'],
  ['오', '묘', '午卯파 - 감정 파탄'],
  ['축', '진', '丑辰파 - 재물 손실'],
  ['술', '미', '戌未파 - 관계 손상'],
  ['인', '사', '寅巳파 - 계획 방해·갈등'],
  ['신', '해', '申亥파 - 변동·이동 방해'],
]

// 삼합(三合) — [지지 3개, 의미]
const SAMHAP: [string[], string][] = [
  [['인', '오', '술'], '寅午戌 삼합(三合) - 火局, 열정·역동의 에너지 결집'],
  [['신', '자', '진'], '申子辰 삼합(三合) - 水局, 지혜·유연의 에너지 결집'],
  [['해', '묘', '미'], '亥卯未 삼합(三合) - 木局, 성장·도약의 에너지 결집'],
  [['사', '유', '축'], '巳酉丑 삼합(三合) - 金局, 결실·완성의 에너지 결집'],
]

// ────────────────────────────────────────────────────────────
// 십이운성(十二運星) — 일간 × 지지 매핑
// ────────────────────────────────────────────────────────────
const SIPIU_UNSUNG: Record<string, Record<string, string>> = {
  '갑': { '해': '장생(長生)', '자': '목욕(沐浴)', '축': '관대(冠帶)', '인': '임관(臨官)', '묘': '제왕(帝旺)', '진': '쇠(衰)', '사': '병(病)', '오': '사(死)', '미': '묘(墓)', '신': '절(絶)', '유': '태(胎)', '술': '양(養)' },
  '을': { '오': '장생(長生)', '사': '목욕(沐浴)', '진': '관대(冠帶)', '묘': '임관(臨官)', '인': '제왕(帝旺)', '축': '쇠(衰)', '자': '병(病)', '해': '사(死)', '술': '묘(墓)', '유': '절(絶)', '신': '태(胎)', '미': '양(養)' },
  '병': { '인': '장생(長生)', '묘': '목욕(沐浴)', '진': '관대(冠帶)', '사': '임관(臨官)', '오': '제왕(帝旺)', '미': '쇠(衰)', '신': '병(病)', '유': '사(死)', '술': '묘(墓)', '해': '절(絶)', '자': '태(胎)', '축': '양(養)' },
  '무': { '인': '장생(長生)', '묘': '목욕(沐浴)', '진': '관대(冠帶)', '사': '임관(臨官)', '오': '제왕(帝旺)', '미': '쇠(衰)', '신': '병(病)', '유': '사(死)', '술': '묘(墓)', '해': '절(絶)', '자': '태(胎)', '축': '양(養)' },
  '정': { '유': '장생(長生)', '신': '목욕(沐浴)', '미': '관대(冠帶)', '오': '임관(臨官)', '사': '제왕(帝旺)', '진': '쇠(衰)', '묘': '병(病)', '인': '사(死)', '축': '묘(墓)', '자': '절(絶)', '해': '태(胎)', '술': '양(養)' },
  '기': { '유': '장생(長生)', '신': '목욕(沐浴)', '미': '관대(冠帶)', '오': '임관(臨官)', '사': '제왕(帝旺)', '진': '쇠(衰)', '묘': '병(病)', '인': '사(死)', '축': '묘(墓)', '자': '절(絶)', '해': '태(胎)', '술': '양(養)' },
  '경': { '사': '장생(長生)', '오': '목욕(沐浴)', '미': '관대(冠帶)', '신': '임관(臨官)', '유': '제왕(帝旺)', '술': '쇠(衰)', '해': '병(病)', '자': '사(死)', '축': '묘(墓)', '인': '절(絶)', '묘': '태(胎)', '진': '양(養)' },
  '신': { '자': '장생(長生)', '해': '목욕(沐浴)', '술': '관대(冠帶)', '유': '임관(臨官)', '신': '제왕(帝旺)', '미': '쇠(衰)', '오': '병(病)', '사': '사(死)', '진': '묘(墓)', '묘': '절(絶)', '인': '태(胎)', '축': '양(養)' },
  '임': { '신': '장생(長生)', '유': '목욕(沐浴)', '술': '관대(冠帶)', '해': '임관(臨官)', '자': '제왕(帝旺)', '축': '쇠(衰)', '인': '병(病)', '묘': '사(死)', '진': '묘(墓)', '사': '절(絶)', '오': '태(胎)', '미': '양(養)' },
  '계': { '묘': '장생(長生)', '인': '목욕(沐浴)', '축': '관대(冠帶)', '자': '임관(臨官)', '해': '제왕(帝旺)', '술': '쇠(衰)', '유': '병(病)', '신': '사(死)', '미': '묘(墓)', '오': '절(絶)', '사': '태(胎)', '진': '양(養)' },
}

// ────────────────────────────────────────────────────────────
// 격국(格局) 계산 — 월지 지장간 본기(本氣) 기준
// ────────────────────────────────────────────────────────────
/** 월지 → 지장간 본기(本氣) 천간 */
const JIJANGGAN_BONGI: Record<string, string> = {
  '자': '계', '축': '기', '인': '갑', '묘': '을',
  '진': '무', '사': '병', '오': '정', '미': '기',
  '신': '경', '유': '신', '술': '무', '해': '임',
}

/** 일간·월지 기준 격국(格局) 반환 */
export function getGeokguk(dayGan: string, monthJi: string): string {
  const bongi = JIJANGGAN_BONGI[monthJi]
  if (!bongi) return '미상(未詳)'

  // 건록격: 일간 오행 = 월지 본기 오행 (비견 동일 간)
  if (bongi === dayGan) return '건록격(建祿格)'

  // 양인격: 월지가 일간의 양인 지지
  const YANGIN_MAP: Record<string, string> = {
    '갑': '묘', '병': '오', '무': '오', '경': '유', '임': '자',
  }
  if (YANGIN_MAP[dayGan] === monthJi) return '양인격(羊刃格)'

  const sipseong = getSipseong(dayGan, bongi)
  const SIPSEONG_GEOKGUK: Record<string, string> = {
    '정인(正印)': '정인격(正印格)',
    '편인(偏印)': '편인격(偏印格)',
    '식신(食神)': '식신격(食神格)',
    '상관(傷官)': '상관격(傷官格)',
    '정재(正財)': '정재격(正財格)',
    '편재(偏財)': '편재격(偏財格)',
    '정관(正官)': '정관격(正官格)',
    '편관(偏官)': '편관격(偏官格)',
  }
  return SIPSEONG_GEOKGUK[sipseong] || '잡격(雜格)'
}

// ────────────────────────────────────────────────────────────
// 납음오행(納音五行) — 60갑자 쌍별 오행
// 30쌍(pair 0~29): 갑자·을축=0, 병인·정묘=1, ...
// ────────────────────────────────────────────────────────────
const NAPUM_ELEMENTS: string[] = [
  '금', '화', '목', '토', '금', '화', '수', '토', '금', '목',
  '수', '토', '화', '목', '수', '금', '화', '목', '토', '금',
  '화', '수', '토', '금', '목', '수', '토', '화', '목', '수',
]
const NAPUM_NAMES: string[] = [
  '해중금(海中金)', '노중화(爐中火)', '대림목(大林木)', '노방토(路傍土)', '검봉금(劍鋒金)',
  '산두화(山頭火)', '간하수(澗下水)', '성두토(城頭土)', '백랍금(白蠟金)', '양류목(楊柳木)',
  '천중수(泉中水)', '옥상토(屋上土)', '벽력화(霹靂火)', '송백목(松柏木)', '장류수(長流水)',
  '사중금(沙中金)', '산하화(山下火)', '평지목(平地木)', '벽상토(壁上土)', '금박금(金箔金)',
  '복등화(覆燈火)', '천하수(天河水)', '대역토(大驛土)', '차천금(釵釧金)', '상자목(桑柘木)',
  '대계수(大溪水)', '사중토(沙中土)', '천상화(天上火)', '석류목(石榴木)', '대해수(大海水)',
]

/**
 * 납음오행(納音五行) 반환: 60갑자 쌍의 오행과 이름
 * @param pillar 간지 2글자 (예: '갑자', '경오')
 */
export function getNapumOhaeng(pillar: string): { element: string; name: string } {
  const gapjaNum = getGapjaNum(pillar[0], pillar[1])
  if (gapjaNum === -1) return { element: '토', name: '미상' }
  const pairIdx = Math.floor(gapjaNum / 2)
  return {
    element: NAPUM_ELEMENTS[pairIdx] || '토',
    name: NAPUM_NAMES[pairIdx] || '미상',
  }
}

// ────────────────────────────────────────────────────────────
// 신살(神煞) 테이블
// ────────────────────────────────────────────────────────────
// 도화살: 생년 지지 기준 → 도화 지지
const DOHWASAL_MAP: Record<string, string> = {
  '인': '묘', '오': '묘', '술': '묘',
  '신': '유', '자': '유', '진': '유',
  '해': '자', '묘': '자', '미': '자',
  '사': '오', '유': '오', '축': '오',
}

// 역마살: 생년 지지 기준 → 역마 지지
const YEOKMASAL_MAP: Record<string, string> = {
  '인': '신', '오': '신', '술': '신',
  '해': '사', '묘': '사', '미': '사',
  '신': '인', '자': '인', '진': '인',
  '사': '해', '유': '해', '축': '해',
}

// 화개살: 생년 지지 기준 → 화개 지지
const HWAGAESAL_MAP: Record<string, string> = {
  '인': '술', '오': '술', '술': '술',
  '신': '진', '자': '진', '진': '진',
  '해': '미', '묘': '미', '미': '미',
  '사': '축', '유': '축', '축': '축',
}

// 천을귀인: 일간 기준 → 귀인 지지 목록
const CHEONULGWIIN_MAP: Record<string, string[]> = {
  '갑': ['축', '미'], '무': ['축', '미'], '경': ['축', '미'],
  '을': ['자', '신'], '기': ['자', '신'],
  '병': ['해', '유'], '정': ['해', '유'],
  '임': ['묘', '사'], '계': ['묘', '사'],
  '신': ['인', '오'],
}

// 양인살: 일간 기준 → 양인 지지
const YANGINSAL_MAP: Record<string, string> = {
  '갑': '묘', '병': '오', '무': '오', '경': '유', '임': '자',
}

// 괴강살(魁罡煞): 해당 일주 집합
const GWAEGANG_PILLARS = new Set(['경진', '경술', '임진', '무술'])

// 백호대살(白虎大煞): 해당 일주 집합
const BAEKHO_PILLARS = new Set(['갑진', '을미', '병술', '정축', '무진', '기미', '경술', '신축', '임진', '계미'])

// 원진살(怨嗔煞): 생년 지지 → 원진 지지
const WONJIN_MAP: Record<string, string> = {
  '자': '미', '미': '자',
  '축': '오', '오': '축',
  '인': '유', '유': '인',
  '묘': '신', '신': '묘',
  '진': '해', '해': '진',
  '사': '술', '술': '사',
}

// 귀문관살(鬼門關煞): 사주 내 이 지지 쌍이 동시에 있을 때
const GWIMUN_PAIRS: [string, string][] = [
  ['자', '유'], ['축', '오'], ['인', '미'], ['묘', '신'], ['진', '해'], ['사', '술'],
]

// ── 길신(吉神) 테이블 ──────────────────────────────────────────

// 학당귀인(學堂貴人): 일간의 장생(長生)위 지지 — 학문·재능·지식 귀인
const HAKDANG_MAP: Record<string, string> = {
  '갑': '해', '을': '오', '병': '인', '무': '인',
  '정': '유', '기': '유', '경': '사', '신': '자',
  '임': '신', '계': '묘',
}

// 금여록(金輿祿): 일간 기준 배필·안락 지지 — 배우자 복, 풍요로운 삶
const GEUMYEO_MAP: Record<string, string> = {
  '갑': '진', '을': '사', '병': '미', '정': '신',
  '무': '미', '기': '신', '경': '술', '신': '해',
  '임': '축', '계': '인',
}

// ── 흉살(凶殺) 추가 테이블 ────────────────────────────────────

// 홍염살(紅艶殺): 일간 기준 이성 매력·예술 기질 지지 — 이성 문제·감성 기질
const HONGYEOM_MAP: Record<string, string> = {
  '갑': '오', '을': '신', '병': '인', '정': '미',
  '무': '진', '기': '진', '경': '술', '신': '유',
  '임': '자', '계': '신',
}

// ── 추가 길신(吉神) ────────────────────────────────────────────

// 천덕귀인(天德貴人) — 월지 기준
// 천간(gan) 또는 지지(ji)가 사주에 있을 때 성립
const CHEONDUK_MAP: Record<string, { type: 'gan' | 'ji'; value: string }> = {
  '자': { type: 'ji',  value: '사' },   // 子月 → 巳지지
  '축': { type: 'gan', value: '경' },   // 丑月 → 庚천간
  '인': { type: 'gan', value: '정' },   // 寅月 → 丁천간
  '묘': { type: 'ji',  value: '신' },   // 卯月 → 申지지
  '진': { type: 'gan', value: '임' },   // 辰月 → 壬천간
  '사': { type: 'gan', value: '신' },   // 巳月 → 辛천간
  '오': { type: 'ji',  value: '해' },   // 午月 → 亥지지
  '미': { type: 'gan', value: '갑' },   // 未月 → 甲천간
  '신': { type: 'gan', value: '계' },   // 申月 → 癸천간
  '유': { type: 'ji',  value: '인' },   // 酉月 → 寅지지
  '술': { type: 'gan', value: '병' },   // 戌月 → 丙천간
  '해': { type: 'gan', value: '을' },   // 亥月 → 乙천간
}

// 월덕귀인(月德貴人) — 월지 기준, 특정 천간이 사주 천간에 있을 때
const WOLDUK_MAP: Record<string, string> = {
  '인': '병', '오': '병', '술': '병',   // 寅午戌月 → 丙
  '신': '임', '자': '임', '진': '임',   // 申子辰月 → 壬
  '해': '갑', '묘': '갑', '미': '갑',   // 亥卯未月 → 甲
  '사': '경', '유': '경', '축': '경',   // 巳酉丑月 → 庚
}

// 문창귀인(文昌貴人) — 일간 기준, 특정 지지가 사주에 있을 때
const MUNCHANG_MAP: Record<string, string> = {
  '갑': '사', '을': '오', '병': '신', '정': '유',
  '무': '신', '기': '유', '경': '해', '신': '자',
  '임': '인', '계': '묘',
}

/**
 * 사주 원국에서 신살 목록을 반환합니다.
 */
export function getSinsalList(saju: SajuInfo): SinsalInfo[] {
  const result: SinsalInfo[] = []
  const dayGan = saju.dayPillar[0]
  const monthJi = saju.monthPillar[1]
  const birthYearJi = saju.yearPillar[1]

  const pillarData = [
    { label: '년주', ji: saju.yearPillar[1] },
    { label: '월주', ji: saju.monthPillar[1] },
    { label: '일주', ji: saju.dayPillar[1] },
    ...(saju.hourPillar ? [{ label: '시주', ji: saju.hourPillar[1] }] : []),
  ]

  // 도화살
  const dohwaJi = DOHWASAL_MAP[birthYearJi]
  if (dohwaJi) {
    const matching = pillarData.filter(p => p.ji === dohwaJi)
    if (matching.length > 0) {
      result.push({
        name: '도화살(桃花煞)',
        meaning: '이성에게 매력적이며 인기가 많습니다. 과도하면 이성 문제에 주의가 필요합니다.',
        pillars: matching.map(p => p.label),
      })
    }
  }

  // 역마살
  const yeokmaJi = YEOKMASAL_MAP[birthYearJi]
  if (yeokmaJi) {
    const matching = pillarData.filter(p => p.ji === yeokmaJi)
    if (matching.length > 0) {
      result.push({
        name: '역마살(驛馬煞)',
        meaning: '이동·이사·출장·여행이 많습니다. 활동적이며 해외 인연도 있을 수 있습니다.',
        pillars: matching.map(p => p.label),
      })
    }
  }

  // 화개살
  const hwagaeJi = HWAGAESAL_MAP[birthYearJi]
  if (hwagaeJi) {
    const matching = pillarData.filter(p => p.ji === hwagaeJi)
    if (matching.length > 0) {
      result.push({
        name: '화개살(華蓋煞)',
        meaning: '예술·종교·학문적 기질이 강합니다. 고독함과 함께 탁월한 집중력을 가집니다.',
        pillars: matching.map(p => p.label),
      })
    }
  }

  // 천을귀인
  const gwiiinJiList = CHEONULGWIIN_MAP[dayGan] || []
  const gwiiinMatching = pillarData.filter(p => gwiiinJiList.includes(p.ji))
  if (gwiiinMatching.length > 0) {
    result.push({
      name: '천을귀인(天乙貴人)',
      meaning: '하늘의 도움을 받는 귀인이 있어 위기에서 구원받는 복이 있습니다.',
      pillars: gwiiinMatching.map(p => p.label),
    })
  }

  // 양인살 — 년·월·일·시주 모두 체크 (월지 양인이 가장 강하게 작용)
  const yanginJi = YANGINSAL_MAP[dayGan]
  if (yanginJi) {
    const yanginMatching = pillarData.filter(p => p.ji === yanginJi)
    if (yanginMatching.length > 0) {
      result.push({
        name: '양인살(羊刃煞)',
        meaning: '강한 의지와 결단력, 경쟁심이 있습니다. 직업으로 승화하면 큰 성취를 이룹니다.',
        pillars: yanginMatching.map(p => p.label),
      })
    }
  }

  // 괴강살 (일주 기준)
  const dayPillarStr = saju.dayPillar[0] + saju.dayPillar[1]
  if (GWAEGANG_PILLARS.has(dayPillarStr)) {
    result.push({
      name: '괴강살(魁罡煞)',
      meaning: '강렬한 카리스마와 권위, 고집이 강합니다. 지도력이 뛰어나며 극단적인 성향이 있어 길흉이 강하게 나타납니다.',
      pillars: ['일주'],
    })
  }

  // 백호대살 (일주 기준)
  if (BAEKHO_PILLARS.has(dayPillarStr)) {
    result.push({
      name: '백호대살(白虎大煞)',
      meaning: '강한 생명력과 도전적 기질이 있습니다. 몸에 관련된 변화(수술·사고)를 조심하고, 의료·법조 분야에서 능력을 발휘합니다.',
      pillars: ['일주'],
    })
  }

  // 원진살 — 사주 내 모든 지지 쌍 체크 (년·월·일·시주 간 임의 조합)
  const wonjinFound: string[] = []
  for (let i = 0; i < pillarData.length; i++) {
    for (let j = i + 1; j < pillarData.length; j++) {
      const jiA = pillarData[i].ji
      const jiB = pillarData[j].ji
      if (WONJIN_MAP[jiA] === jiB) {
        if (!wonjinFound.includes(pillarData[i].label)) wonjinFound.push(pillarData[i].label)
        if (!wonjinFound.includes(pillarData[j].label)) wonjinFound.push(pillarData[j].label)
      }
    }
  }
  if (wonjinFound.length > 0) {
    result.push({
      name: '원진살(怨嗔煞)',
      meaning: '인간관계에서 오해와 갈등이 생기기 쉽습니다. 자신도 모르게 척을 지는 경향이 있어 언행에 주의가 필요합니다.',
      pillars: wonjinFound,
    })
  }

  // 귀문관살 (사주 내 특정 지지 쌍)
  const jijiSet = new Set(pillarData.map(p => p.ji))
  for (const [a, b] of GWIMUN_PAIRS) {
    if (jijiSet.has(a) && jijiSet.has(b)) {
      const matchingPillars = pillarData.filter(p => p.ji === a || p.ji === b).map(p => p.label)
      result.push({
        name: '귀문관살(鬼門關煞)',
        meaning: '직관력과 감수성이 뛰어나며 영적·예술적 소질이 있습니다. 신경이 예민하거나 강박적 성향이 나타날 수 있어 정신 건강에 주의하세요.',
        pillars: matchingPillars,
      })
      break
    }
  }

  // ── 길신(吉神) ──────────────────────────────────────────────

  // 학당귀인(學堂貴人) — 일간의 장생위 지지
  const hakdangJi = HAKDANG_MAP[dayGan]
  if (hakdangJi) {
    const matching = pillarData.filter(p => p.ji === hakdangJi)
    if (matching.length > 0) {
      result.push({
        name: '학당귀인(學堂貴人)',
        meaning: '학문·재능·기술 분야에 귀인의 도움이 있습니다. 지식·연구·교육 관련 분야에서 빛을 발하며 학습 능력이 탁월합니다.',
        pillars: matching.map(p => p.label),
      })
    }
  }

  // 금여록(金輿祿) — 배필·풍요 귀인
  const geumyeoJi = GEUMYEO_MAP[dayGan]
  if (geumyeoJi) {
    const matching = pillarData.filter(p => p.ji === geumyeoJi)
    if (matching.length > 0) {
      result.push({
        name: '금여록(金輿祿)',
        meaning: '배우자 복이 있고 풍요로운 삶을 누릴 기운입니다. 이성 인연이 좋고 안락한 생활을 영위할 능력이 있습니다.',
        pillars: matching.map(p => p.label),
      })
    }
  }

  // ── 흉살 추가 ────────────────────────────────────────────────

  // 홍염살(紅艶殺) — 이성 매력·예술 기질
  const hongyeomJi = HONGYEOM_MAP[dayGan]
  if (hongyeomJi) {
    const matching = pillarData.filter(p => p.ji === hongyeomJi)
    if (matching.length > 0) {
      result.push({
        name: '홍염살(紅艶殺)',
        meaning: '이성에게 강한 매력을 발산하며 예술·감성적 기질이 풍부합니다. 이성 관계가 복잡해질 수 있어 감정 관리에 주의가 필요합니다.',
        pillars: matching.map(p => p.label),
      })
    }
  }

  // 현침살(懸針殺) — 甲·乙·辛·壬·癸 천간 1개 이상 보유 시 성립
  // 전통 명리학: 획이 날카롭고 뾰족한 천간 (현대 명리학 주류 유파 기준)
  // 甲(세로획)·乙(구부러짐)·辛(날카로움)·壬(물처럼 흐름)·癸(水기운) 포함
  const ganList = [
    saju.yearPillar[0], saju.monthPillar[0], saju.dayPillar[0],
    ...(saju.hourPillar ? [saju.hourPillar[0]] : []),
  ]
  const HYEONCHIM_GANS = new Set(['갑', '을', '신', '임', '계'])
  const hyeonchimGans = ganList.filter(g => HYEONCHIM_GANS.has(g))
  if (hyeonchimGans.length >= 1) {
    const matchingPillars: string[] = []
    const ganPillarLabels = ['년주', '월주', '일주', '시주']
    ganList.forEach((g, i) => {
      if (HYEONCHIM_GANS.has(g)) matchingPillars.push(ganPillarLabels[i])
    })
    result.push({
      name: '현침살(懸針殺)',
      meaning: '날카롭고 세밀한 감각을 가지며 의료·법률·공예·조각 등 섬세한 직종에 인연이 있습니다. 신경과 예민함이 강해 스트레스 관리가 필요합니다.',
      pillars: matchingPillars,
    })
  }

  // 급각살(急脚殺) — 사주 내 寅申충 또는 巳亥충이 있는 경우
  const GEUPGAK_CHUNG: [string, string][] = [['인', '신'], ['사', '해']]
  for (const [a, b] of GEUPGAK_CHUNG) {
    if (jijiSet.has(a) && jijiSet.has(b)) {
      const matchingPillars = pillarData.filter(p => p.ji === a || p.ji === b).map(p => p.label)
      result.push({
        name: '급각살(急脚殺)',
        meaning: '갑작스러운 사고·부상 가능성이 있습니다. 이동 중 주의가 필요하며 과격한 운동이나 위험한 활동 시 각별히 조심하세요.',
        pillars: matchingPillars,
      })
      break
    }
  }

  // ── 일지(日支) 기준 도화살·역마살·화개살 추가 체크 ──
  // 년지 기준에서 감지되지 않은 경우에만 추가 (일지 도화는 성격·배우자 인연에 강하게 작용)
  const dayJi = saju.dayPillar[1]

  // 일지 기준 도화·역마·화개는 년지 기준과 별개 개념으로 별도 명칭 사용
  // 일지도화(日支桃花): 배우자 인연·성격에 작용 / 년지 기준 도화는 사회적 인기에 작용
  const dayDohwaJi = DOHWASAL_MAP[dayJi]
  if (dayDohwaJi) {
    const matching = pillarData.filter(p => p.ji === dayDohwaJi && p.label !== '일주')
    if (matching.length > 0) {
      result.push({
        name: '일지도화(日支桃花)',
        meaning: '배우자 인연이 강하고 이성에게 자연스러운 매력을 발산합니다. 성격 자체에 도화 기운이 내재되어 있습니다.',
        pillars: matching.map(p => p.label),
      })
    }
  }

  const dayYeokmaJi = YEOKMASAL_MAP[dayJi]
  if (dayYeokmaJi) {
    const matching = pillarData.filter(p => p.ji === dayYeokmaJi && p.label !== '일주')
    if (matching.length > 0) {
      result.push({
        name: '일지역마(日支驛馬)',
        meaning: '배우자와의 관계에서 이동·변화가 많거나 원거리 인연이 생깁니다. 부부 사이 활동적 에너지를 나타냅니다.',
        pillars: matching.map(p => p.label),
      })
    }
  }

  const dayHwagaeJi = HWAGAESAL_MAP[dayJi]
  if (dayHwagaeJi) {
    const matching = pillarData.filter(p => p.ji === dayHwagaeJi && p.label !== '일주')
    if (matching.length > 0) {
      result.push({
        name: '일지화개(日支華蓋)',
        meaning: '내면 세계와 정신적 추구가 강한 배우자 인연입니다. 예술·철학·종교적 감수성이 결혼 생활에 깊이 반영됩니다.',
        pillars: matching.map(p => p.label),
      })
    }
  }

  // ── 추가 길신(吉神) ───────────────────────────────────────────

  // 천덕귀인(天德貴人) — 월지 기준
  const cheonduk = CHEONDUK_MAP[monthJi]
  if (cheonduk) {
    const found = cheonduk.type === 'gan'
      ? ganList.includes(cheonduk.value)
      : pillarData.some(p => p.ji === cheonduk.value)
    if (found) {
      result.push({
        name: '천덕귀인(天德貴人)',
        meaning: '하늘의 덕(德)을 받아 재난·관재·질병 등 큰 위기에서 보호받습니다. 평생 숨은 후원자가 있고 선행이 복으로 돌아옵니다.',
        pillars: ['월주 기준'],
      })
    }
  }

  // 월덕귀인(月德貴人) — 월지 기준, 특정 천간이 사주 천간에 있을 때
  const woldukGan = WOLDUK_MAP[monthJi]
  if (woldukGan && ganList.includes(woldukGan)) {
    result.push({
      name: '월덕귀인(月德貴人)',
      meaning: '달의 덕(德)이 있어 관재·질병·사고를 예방하는 보호막이 됩니다. 인복이 좋고 주변의 도움으로 위기를 넘기는 힘이 있습니다.',
      pillars: ['월주 기준'],
    })
  }

  // 문창귀인(文昌貴人) — 일간 기준, 특정 지지가 사주에 있을 때
  const munchangJi = MUNCHANG_MAP[dayGan]
  if (munchangJi) {
    const matching = pillarData.filter(p => p.ji === munchangJi)
    if (matching.length > 0) {
      result.push({
        name: '문창귀인(文昌貴人)',
        meaning: '학문·문서·예술·창작 분야에 특별한 재능과 기회가 있습니다. 글쓰기·연구·교육 분야에서 두각을 나타내며 시험 운이 좋습니다.',
        pillars: matching.map(p => p.label),
      })
    }
  }

  return result
}

// ────────────────────────────────────────────────────────────
// 궁합(宮合) 크로스 관계 분석
// ────────────────────────────────────────────────────────────
/** 두 사람의 일지·월지·일간 간 형충합 관계 (궁합 프롬프트용) */
export function getCrossCompatibilityRelations(saju1: SajuInfo, saju2: SajuInfo): string[] {
  const notes: string[] = []
  const [gan1, ji1] = [saju1.dayPillar[0], saju1.dayPillar[1]]
  const [gan2, ji2] = [saju2.dayPillar[0], saju2.dayPillar[1]]
  const [mji1, mji2] = [saju1.monthPillar[1], saju2.monthPillar[1]]
  const [yji1, yji2] = [saju1.yearPillar[1], saju2.yearPillar[1]]

  // 일지 충합
  for (const [a, b, meaning] of YUKCHUNG) {
    if ((ji1 === a && ji2 === b) || (ji1 === b && ji2 === a)) {
      notes.push(`일지 충(冲): ${a}↔${b} — ${meaning}`)
    }
  }
  for (const [a, b, meaning] of YUKHAP) {
    if ((ji1 === a && ji2 === b) || (ji1 === b && ji2 === a)) {
      notes.push(`일지 합(合): ${a}↔${b} — ${meaning}`)
    }
  }

  // 월지 충합
  for (const [a, b, meaning] of YUKCHUNG) {
    if ((mji1 === a && mji2 === b) || (mji1 === b && mji2 === a)) {
      notes.push(`월지 충(冲): ${a}↔${b} — ${meaning}`)
    }
  }
  for (const [a, b, meaning] of YUKHAP) {
    if ((mji1 === a && mji2 === b) || (mji1 === b && mji2 === a)) {
      notes.push(`월지 합(合): ${a}↔${b} — ${meaning}`)
    }
  }

  // 일간 천간합
  for (const [a, b, meaning] of CHEONGANHAP) {
    if ((gan1 === a && gan2 === b) || (gan1 === b && gan2 === a)) {
      notes.push(`일간 합(合): ${a}↔${b} — ${meaning}`)
    }
  }

  // 일지·월지 형(刑) 관계 — 갈등·마찰 요인
  const checkHyeong = (jiA: string, jiB: string, label: string) => {
    for (const [group, meaning, required] of SAMHYEONG) {
      if (required === 2 && ((jiA === group[0] && jiB === group[1]) || (jiA === group[1] && jiB === group[0]))) {
        notes.push(`${label} 형(刑): ${jiA}↔${jiB} — ${meaning}`)
      } else if (required === 3 && group.includes(jiA) && group.includes(jiB) && jiA !== jiB) {
        notes.push(`${label} 삼형(三刑): ${jiA}↔${jiB} — ${meaning}`)
      }
    }
  }
  checkHyeong(ji1, ji2, '일지')
  checkHyeong(mji1, mji2, '월지')

  // 연지 삼합 (두 사람 연지가 같은 삼합 그룹)
  const SAMHAP_GROUPS: [string[], string][] = [
    [['인', '오', '술'], '火局 삼합 — 열정적 결합'],
    [['신', '자', '진'], '水局 삼합 — 지혜로운 결합'],
    [['해', '묘', '미'], '木局 삼합 — 성장하는 결합'],
    [['사', '유', '축'], '金局 삼합 — 안정적 결합'],
  ]
  for (const [group, meaning] of SAMHAP_GROUPS) {
    if (group.includes(yji1) && group.includes(yji2) && yji1 !== yji2) {
      notes.push(`연지 삼합(三合): ${yji1}↔${yji2} — ${meaning}`)
    }
  }

  return notes
}

// ────────────────────────────────────────────────────────────
// 삼재(三災) 계산
// ────────────────────────────────────────────────────────────
const SAMJAE_BIRTH_GROUP: Record<string, string> = {
  '인': '인오술', '오': '인오술', '술': '인오술',
  '해': '해묘미', '묘': '해묘미', '미': '해묘미',
  '신': '신자진', '자': '신자진', '진': '신자진',
  '사': '사유축', '유': '사유축', '축': '사유축',
}

// 각 그룹의 삼재 연도 지지 (순서: 들삼재, 눌삼재, 날삼재)
const SAMJAE_GROUPS: Record<string, string[]> = {
  '인오술': ['신', '유', '술'],
  '해묘미': ['사', '오', '미'],
  '신자진': ['인', '묘', '진'],
  '사유축': ['해', '자', '축'],
}

/**
 * 삼재 여부를 반환합니다.
 * @param birthYearJi - 생년 지지
 * @param targetYearJi - 대상 연도 지지
 */
export function getSamjae(birthYearJi: string, targetYearJi: string): SamjaeInfo {
  const group = SAMJAE_BIRTH_GROUP[birthYearJi]
  if (!group) return { isSamjae: false, type: null, description: '삼재가 없는 해입니다.' }

  const samjaeYears = SAMJAE_GROUPS[group]
  const idx = samjaeYears.indexOf(targetYearJi)

  if (idx === -1) return { isSamjae: false, type: null, description: '삼재가 없는 해입니다.' }

  const types: ('들삼재' | '눌삼재' | '날삼재')[] = ['들삼재', '눌삼재', '날삼재']
  const descriptions = [
    '삼재가 시작되는 해(들삼재)입니다. 큰 변화와 도전에 신중히 대처하세요.',
    '삼재 중반(눌삼재)으로 안정을 찾아가는 해입니다. 인내와 절제가 필요합니다.',
    '삼재가 끝나가는 해(날삼재)입니다. 마무리를 잘하면 새로운 출발이 기다립니다.',
  ]

  return { isSamjae: true, type: types[idx], description: descriptions[idx] }
}

/**
 * 대운(大運) 시작 나이를 절기 기준으로 계산합니다.
 * 순행(順行): 출생일 이후 첫 절기(節氣)까지 날수 ÷ 3
 * 역행(逆行): 출생일 이전 가장 가까운 절기까지 날수 ÷ 3
 */
export function calculateDaeunStartAge(
  birthDate: string,
  birthYearGan: string,
  gender: string | null | undefined
): number {
  const [year, month, day] = birthDate.split('-').map(Number)
  const birthTime = new Date(year, month - 1, day).getTime()
  const isYangYear = ['갑', '병', '무', '경', '임'].includes(birthYearGan)
  const isForward = (gender === 'male' && isYangYear) || (gender === 'female' && !isYangYear)

  try {
    const terms = [
      ...getSolarTermsByYear(year),
      ...getSolarTermsByYear(year + 1),
    ]
    const jeolgiTerms = terms.filter(t => t.type === 'jeolgi')

    if (isForward) {
      const next = jeolgiTerms.find(t =>
        new Date(t.year, t.month - 1, t.day).getTime() > birthTime
      )
      if (!next) return 5
      const diffDays = Math.round(
        (new Date(next.year, next.month - 1, next.day).getTime() - birthTime) / 86400000
      )
      return Math.max(1, Math.min(10, Math.round(diffDays / 3)))
    } else {
      const prev = [...jeolgiTerms].reverse().find(t =>
        new Date(t.year, t.month - 1, t.day).getTime() <= birthTime
      )
      if (!prev) return 5
      const diffDays = Math.round(
        (birthTime - new Date(prev.year, prev.month - 1, prev.day).getTime()) / 86400000
      )
      return Math.max(1, Math.min(10, Math.round(diffDays / 3)))
    }
  } catch {
    return 5
  }
}

// ────────────────────────────────────────────────────────────
// 대운(大運) 천간지지 계산
// ────────────────────────────────────────────────────────────
const GAN_HANJA_DAEUN: Record<string, string> = {
  '갑': '甲', '을': '乙', '병': '丙', '정': '丁', '무': '戊',
  '기': '己', '경': '庚', '신': '辛', '임': '壬', '계': '癸',
}
const JI_HANJA_DAEUN: Record<string, string> = {
  '자': '子', '축': '丑', '인': '寅', '묘': '卯', '진': '辰', '사': '巳',
  '오': '午', '미': '未', '신': '申', '유': '酉', '술': '戌', '해': '亥',
}

export interface DaeunPillar {
  age: number
  pillar: string
  hanja: string
}

/**
 * 대운(大運) 천간지지를 계산합니다.
 * 순행: 월주부터 60갑자 순서로 10년씩 진행
 * 역행: 월주부터 60갑자 역순으로 10년씩 진행
 */
export function calculateDaeunPillars(
  monthPillar: string,
  direction: 'forward' | 'reverse',
  daeunStartAge: number,
  count: number = 8
): DaeunPillar[] {
  const baseIdx = getGapjaNum(monthPillar[0], monthPillar[1])
  if (baseIdx === -1) return []

  const results: DaeunPillar[] = []
  for (let i = 1; i <= count; i++) {
    let idx = direction === 'forward' ? baseIdx + i : baseIdx - i
    idx = ((idx % 60) + 60) % 60

    const ganIdx = idx % 10
    const jiIdx = idx % 12
    const gan = CHEONGAN_ORDER_60[ganIdx]
    const ji = JIJI_ORDER_60[jiIdx]

    results.push({
      age: daeunStartAge + (i - 1) * 10,
      pillar: `${gan}${ji}`,
      hanja: `${GAN_HANJA_DAEUN[gan] || ''}${JI_HANJA_DAEUN[ji] || ''}`,
    })
  }
  return results
}

/** 특정 연도의 지지를 반환합니다 (갑자년=1984 기준). */
export function getYearJi(year: number): string {
  const JIJI_ORDER = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해']
  const idx = ((year - 1984) % 12 + 12) % 12
  return JIJI_ORDER[idx]
}

export function getElement(pillar: string): string {
  return CHEONGAN_ELEMENT[pillar[0]] || ''
}

export function getDayMasterTrait(dayPillar: string): string {
  return ILGAN_TRAIT[dayPillar[0]] || ''
}

export function getDetailedAnalysis(saju: SajuInfo): SajuDetailedAnalysis {
  const dayGan = saju.dayPillar[0]
  const dayJi  = saju.dayPillar[1]
  const dayElement = CHEONGAN_ELEMENT[dayGan] || ''

  const pillars = [saju.yearPillar, saju.monthPillar, saju.dayPillar]
  if (saju.hourPillar) pillars.push(saju.hourPillar)

  // ── 1. 기본 오행 (천간+지지 본기만) ─────────────────────────
  const allElements: string[] = []
  for (const p of pillars) {
    const ganEl = CHEONGAN_ELEMENT[p[0]]
    const jiEl  = JIJI_ELEMENT_FIXED[p[1]]
    if (ganEl) allElements.push(ganEl)
    if (jiEl)  allElements.push(jiEl)
  }

  const mkCount = (): Record<string, number> => ({
    '목(木)': 0, '화(火)': 0, '토(土)': 0, '금(金)': 0, '수(水)': 0,
  })

  const elementCount = mkCount()
  for (const el of allElements) {
    if (el in elementCount) elementCount[el] = (elementCount[el] || 0) + 1
  }

  const elementBalance = Object.entries(elementCount).map(([name, count]) => ({
    name, count, emoji: ELEMENT_EMOJI[name] || '',
  }))

  // ── 2. 지장간 포함 정밀 오행 (가중치 적용: 천간=1, 여기=1, 중기=2, 본기=3) ──
  // 전통 명리학: 본기(本氣) > 중기(中氣) > 여기(餘氣) 순으로 세력 강함
  const jijangCount = mkCount()
  for (const p of pillars) {
    const ganEl = CHEONGAN_ELEMENT[p[0]]
    if (ganEl && ganEl in jijangCount) jijangCount[ganEl] = (jijangCount[ganEl] || 0) + 1
    const jjgW = JIJANGGAN_WEIGHTED[p[1]] || []
    for (const { gan, weight } of jjgW) {
      const el = CHEONGAN_ELEMENT[gan]
      if (el && el in jijangCount) jijangCount[el] = (jijangCount[el] || 0) + weight
    }
  }
  const elementBalanceWithJijanggan = Object.entries(jijangCount).map(([name, count]) => ({
    name, count, emoji: ELEMENT_EMOJI[name] || '',
  }))

  const sorted = [...elementBalance].sort((a, b) => b.count - a.count)
  const dominantElement = sorted[0].name
  const weakElement = sorted.filter(e => e.count === 0)[0]?.name
    || sorted[sorted.length - 1].name

  // ── 3. 신강/신약 판단 (버그 수정: 인성 오행 풀명 조회) ─────
  const monthJi = saju.monthPillar[1]
  const monthJiElement = JIJI_ELEMENT_FIXED[monthJi] || ''
  const dayShort = ELEMENT_SHORT[dayElement] || ''
  const monthShort = ELEMENT_SHORT[monthJiElement] || ''

  const helpDayEl = Object.entries(SANGSAENG).find(([, v]) => v === dayShort)?.[0] || ''
  const gotRyeong = monthShort === dayShort || monthShort === helpDayEl

  const dayJiElement = JIJI_ELEMENT_FIXED[dayJi] || ''
  const dayJiShort = ELEMENT_SHORT[dayJiElement] || ''
  const gotJi = dayJiShort === dayShort || dayJiShort === helpDayEl

  // 인성 오행 풀명 올바르게 조회
  const inseongShort = Object.entries(SANGSAENG).find(([, v]) => v === dayShort)?.[0] || ''
  const inseongFull = Object.entries(ELEMENT_SHORT).find(([, v]) => v === inseongShort)?.[0] || ''
  const helpingCount = (jijangCount[dayElement] || 0) + (inseongFull ? (jijangCount[inseongFull] || 0) : 0)
  const totalJijang = Object.values(jijangCount).reduce((a, b) => a + b, 0)
  const helpingRatio = totalJijang > 0 ? helpingCount / totalJijang : 0

  let bodyStrength: '신강(身强)' | '신약(身弱)' | '중화(中和)'
  // 월령(月令) 가중치 3점: 전통 명리학에서 월령 득실이 신강/신약 판단의 50% 이상을 차지
  // 일지(日支) 가중치 1점, 지장간 비율 가중치 0~2점 (총 6점 만점)
  const strengthScore = (gotRyeong ? 3 : 0) + (gotJi ? 1 : 0) + (helpingRatio > 0.5 ? 2 : helpingRatio > 0.35 ? 1 : 0)
  if (strengthScore >= 4) bodyStrength = '신강(身强)'
  else if (strengthScore <= 1) bodyStrength = '신약(身弱)'
  else bodyStrength = '중화(中和)'

  // ── 4. 사주 각 주 상세 (십성 + 십이운성 포함) ────────────
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
    sipseong: p.hangul ? getSipseong(dayGan, p.hangul[0]) : '',
    sipiunsung: p.hangul ? (SIPIU_UNSUNG[dayGan]?.[p.hangul[1]] || '') : '',
  }))

  // ── 5. 상생/상극 관계 ────────────────────────────────────────
  const relationships: string[] = []
  if (dayShort) {
    const helpMe = Object.entries(SANGSAENG).find(([, v]) => v === dayShort)?.[0]
    const iHelp  = SANGSAENG[dayShort]
    const hurtMe = Object.entries(SANGGEUK).find(([, v]) => v === dayShort)?.[0]
    const iHurt  = SANGGEUK[dayShort]
    if (helpMe) relationships.push(`${helpMe} → ${dayShort} (상생: 나를 도와주는 기운)`)
    if (iHelp)  relationships.push(`${dayShort} → ${iHelp} (상생: 내가 키우는 기운)`)
    if (hurtMe) relationships.push(`${hurtMe} → ${dayShort} (상극: 나를 제약하는 기운)`)
    if (iHurt)  relationships.push(`${dayShort} → ${iHurt} (상극: 내가 극하는 기운)`)
  }

  // ── 6. 형·충·합·해·파 + 삼합·반합 분석 ──────────────────────
  // 우선순위: 삼합 > 육합·천간합 > 충 > 형 > 해 > 파
  const specialRelations: HyeongChungResult[] = []
  const jijiList = pillars.map(p => p[1])
  const ganList  = pillars.map(p => p[0])

  // 0순위: 삼합(三合) / 반합(半合) — 전통 명리학에서 가장 강력한 지지 결합
  for (const [group, meaning] of SAMHAP) {
    const matchCount = group.filter(c => jijiList.includes(c)).length
    if (matchCount === 3) {
      specialRelations.push({ type: '합(合)', chars: [group[0], group[2]], meaning })
    } else if (matchCount === 2) {
      const pair = group.filter(c => jijiList.includes(c)) as [string, string]
      specialRelations.push({ type: '합(合)', chars: pair, meaning: meaning.replace('삼합(三合)', '반합(半合)') })
    }
  }
  // 1순위: 합(合) — 지지 육합
  for (const [a, b, meaning] of YUKHAP) {
    if (jijiList.includes(a) && jijiList.includes(b)) {
      specialRelations.push({ type: '합(合)', chars: [a, b], meaning })
    }
  }
  // 2순위: 합(合) — 천간합
  for (const [a, b, meaning] of CHEONGANHAP) {
    if (ganList.includes(a) && ganList.includes(b)) {
      specialRelations.push({ type: '합(合)', chars: [a, b], meaning })
    }
  }
  // 3순위: 충(冲) — 합이 있는 지지 쌍과 충이 겹칠 경우 합이 더 강하게 작용
  for (const [a, b, meaning] of YUKCHUNG) {
    if (jijiList.includes(a) && jijiList.includes(b)) {
      specialRelations.push({ type: '충(冲)', chars: [a, b], meaning })
    }
  }
  // 4순위: 형(刑)
  for (const [group, meaning, required] of SAMHYEONG) {
    const matchCount = group.filter(c => jijiList.includes(c)).length
    if (matchCount >= required) {
      specialRelations.push({ type: '형(刑)', chars: [group[0], group[1]], meaning })
    }
  }
  // 5순위: 해(害)
  for (const [a, b, meaning] of YUKHAE) {
    if (jijiList.includes(a) && jijiList.includes(b)) {
      specialRelations.push({ type: '해(害)', chars: [a, b], meaning })
    }
  }
  // 자형(自刑): 오·진·유·해 지지가 사주 내 2개 이상일 때
  const JAHYEONG_MEANINGS: Record<string, string> = {
    '오': '午午 자형(自刑) - 과도한 열정·자기 소모 경향',
    '진': '辰辰 자형(自刑) - 완고함·고집으로 인한 반복 갈등',
    '유': '酉酉 자형(自刑) - 자존심 상처·예민함과 날카로운 기운',
    '해': '亥亥 자형(自刑) - 내면 갈등·심리적 불안 경향',
  }
  for (const [ji, meaning] of Object.entries(JAHYEONG_MEANINGS)) {
    if (jijiList.filter(j => j === ji).length >= 2) {
      specialRelations.push({ type: '형(刑)', chars: [ji, ji] as [string, string], meaning })
    }
  }

  // 6순위: 파(破)
  for (const [a, b, meaning] of YUKPA) {
    if (jijiList.includes(a) && jijiList.includes(b)) {
      specialRelations.push({ type: '파(破)', chars: [a, b], meaning })
    }
  }

  // ── 7. 신살 ─────────────────────────────────────────────────
  const sinsal = getSinsalList(saju)

  // ── 8. 공망 + 위치별 해석 ─────────────────────────────────────
  const gongmang = getGongmang(saju.dayPillar)
  const GONGMANG_PILLAR_MEANING: Record<string, string> = {
    '년주': '조상·부모 덕이 약하거나 어린 시절 결핍이 있습니다.',
    '월주': '부모·형제 인연이 약하고 청년기 부침이 있습니다.',
    '일주': '배우자 인연이 가볍거나 결혼 후 변화가 따릅니다.',
    '시주': '자녀 인연이 약하거나 말년 운기가 기복이 있습니다.',
  }
  const gongmangSet = new Set(gongmang)
  const pillarLabelsFull = ['년주', '월주', '일주', '시주']
  const gongmangPillars: { label: string; ji: string; meaning: string }[] = []
  pillars.forEach((p, i) => {
    const ji = p[1]
    if (gongmangSet.has(ji)) {
      gongmangPillars.push({
        label: pillarLabelsFull[i],
        ji,
        meaning: GONGMANG_PILLAR_MEANING[pillarLabelsFull[i]] || '',
      })
    }
  })

  // ── 9. 격국(格局) — 투간(透干) 우선, 내격 + 종격(從格) 판정 ─────
  // 투간 원칙: 월지 지장간 중 사주 천간에 나타난(透出) 것이 있으면 그것으로 격국을 정함
  // 투간이 없으면 본기(本氣) 기준 (getGeokguk 기존 로직)
  const monthJjg = JIJANGGAN[monthJi] || []
  const allGans = pillars.map(p => p[0])
  // 본기(배열 뒤)→중기→여기 순으로 강한 것부터 투간 체크 (역순)
  const touganGan = [...monthJjg].reverse().find(jg => allGans.includes(jg))
  let geokguk: string
  if (touganGan) {
    if (touganGan === dayGan) {
      geokguk = '건록격(建祿格)'
    } else {
      const YANGIN_TG: Record<string, string> = {
        '갑': '묘', '병': '오', '무': '오', '경': '유', '임': '자',
      }
      if (YANGIN_TG[dayGan] === monthJi) {
        geokguk = '양인격(羊刃格)'
      } else {
        const ss = getSipseong(dayGan, touganGan)
        const TG_GEOKGUK: Record<string, string> = {
          '정인(正印)': '정인격(正印格)', '편인(偏印)': '편인격(偏印格)',
          '식신(食神)': '식신격(食神格)', '상관(傷官)': '상관격(傷官格)',
          '정재(正財)': '정재격(正財格)', '편재(偏財)': '편재격(偏財格)',
          '정관(正官)': '정관격(正官格)', '편관(偏官)': '편관격(偏官格)',
        }
        geokguk = TG_GEOKGUK[ss] || '잡격(雜格)'
      }
    }
  } else {
    geokguk = getGeokguk(dayGan, monthJi)
  }

  // 종격: 일간이 극도로 고립 (월령 미득 + 일지 미득 + 지장간 도움 비율 < 20%)
  // → 억부용신 적용 불가, 가장 강한 오행을 따라가는 외격
  if (!gotRyeong && !gotJi && helpingRatio < 0.20) {
    // 지장간 기준 가장 강한 오행 파악 (일간 오행 제외)
    const elEntries = Object.entries(jijangCount)
      .map(([fullEl, cnt]) => ({ el: ELEMENT_SHORT[fullEl] || '', cnt }))
      .filter(e => e.el && e.el !== dayShort)
      .sort((a, b) => b.cnt - a.cnt)
    const strongest = elEntries[0]?.el || ''
    if (strongest) {
      if (SANGSAENG[dayShort] === strongest)       geokguk = '종아격(從兒格)'  // 식상 강함
      else if (SANGGEUK[dayShort] === strongest)   geokguk = '종재격(從財格)'  // 재성 강함
      else if (SANGGEUK[strongest] === dayShort)   geokguk = '종살격(從殺格)'  // 관성 강함
      else if (SANGSAENG[strongest] === dayShort)  geokguk = '종인격(從印格)'  // 인성 강함
    }
  }

  // ── 10. 종합 요약 ────────────────────────────────────────────
  const missingElements = elementBalance.filter(e => e.count === 0).map(e => e.name)
  let summary = `일간 ${dayGan}(${dayElement}), ${bodyStrength}, ${geokguk}. `
  summary += `${dominantElement}이(가) ${sorted[0].count}개로 가장 강합니다. `
  if (missingElements.length > 0) {
    summary += `${missingElements.join(', ')}이(가) 부족하여 이를 보충하면 좋습니다.`
  } else {
    summary += `오행이 고르게 분포된 균형 잡힌 사주입니다.`
  }
  if (specialRelations.length > 0) {
    summary += ` 특수 관계: ${specialRelations.map(r => r.type.slice(0, 1)).join('·')}.`
  }
  if (sinsal.length > 0) {
    summary += ` 신살: ${sinsal.map(s => s.name.split('(')[0]).join('·')}.`
  }

  return {
    dayMaster: {
      name: dayGan,
      element: dayElement,
      trait: ILGAN_TRAIT[dayGan] || '',
      description: ILGAN_DESCRIPTION[dayGan] || '',
    },
    elementBalance,
    elementBalanceWithJijanggan,
    dominantElement,
    weakElement,
    bodyStrength,
    pillarsDetail,
    relationships,
    specialRelations,
    sinsal,
    gongmang,
    gongmangPillars,
    geokguk,
    summary,
  }
}
