/**
 * 토정비결(土亭秘訣) 괘(卦) 산출 유틸리티
 *
 * 원리: 상괘(上卦)·중괘(中卦)·하괘(下卦)를 각각 구하여
 *       3자리 수 (상·중·하)로 144가지 괘 중 하나를 결정합니다.
 *
 * 계산법 (이이 선생 토정비결 원서 기준):
 *  - 상괘: (태세상수 + 나이) % 8, 0이면 8
 *  - 중괘: (월건상수 + 생월) % 6, 0이면 6
 *  - 하괘: (일진상수 + 생일) % 3, 0이면 3
 *
 * 태세상수(太歲象數): 해당 년도 천간의 상수
 *   甲1 乙2 丙3 丁4 戊5 己6 庚7 辛8 壬9 癸10 → 이후 반복
 *
 * 일진상수(日辰象數): 해당 음력 생월(生月) 초하루(1일)의 60갑자 일련번호(1~60)
 *   오늘 날짜와 무관 — 음력 초하루의 일진이 기준
 */

import { lunarToSolar, calculateSaju } from '@fullstackfamily/manseryeok'

// 천간 상수 (1~10 순환)
const TAESEESANGSU: Record<string, number> = {
  '갑': 1, '을': 2, '병': 3, '정': 4, '무': 5,
  '기': 6, '경': 7, '신': 8, '임': 9, '계': 10,
}

// 60갑자 순서 (천간 기준)
const CHEONGAN_ORDER = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계']

// 60갑자 지지 순서
const JIJI_ORDER_60 = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해']

// 월건상수(月建象數): 해당 년도 천간 기준 — 인월(寅月) 천간의 오행 상수
// 五虎遁年法: 甲/己년→丙寅=3, 乙/庚년→戊寅=5, 丙/辛년→庚寅=7, 丁/壬년→壬寅=9, 戊/癸년→甲寅=1
const WOLGEON_SANGSU_BY_GAN: Record<string, number> = {
  '갑': 3, '기': 3,  // 甲/己년: 인월 천간=丙(3)
  '을': 5, '경': 5,  // 乙/庚년: 인월 천간=戊(5)
  '병': 7, '신': 7,  // 丙/辛년: 인월 천간=庚(7)
  '정': 9, '임': 9,  // 丁/壬년: 인월 천간=壬(9)
  '무': 1, '계': 1,  // 戊/癸년: 인월 천간=甲(1)
}

/**
 * 간지(干支) → 60갑자 일련번호(1~60) 반환
 * 갑자=1, 을축=2, ..., 계해=60
 */
function getGapjaNum60(gan: string, ji: string): number {
  const ganIdx = CHEONGAN_ORDER.indexOf(gan)
  const jiIdx  = JIJI_ORDER_60.indexOf(ji)
  if (ganIdx === -1 || jiIdx === -1) return 1
  for (let i = 0; i < 60; i++) {
    if (i % 10 === ganIdx && i % 12 === jiIdx) return i + 1
  }
  return 1
}

/**
 * 일진상수(日辰象數): 해당 음력 생월 초하루의 60갑자 일련번호(1~60)
 * @param targetYear  풀이 연도
 * @param lunarMonth  음력 생월 (1~12)
 */
function getIljinSangsu(targetYear: number, lunarMonth: number): number {
  try {
    // 음력 초하루(1일)를 양력으로 변환
    const result = lunarToSolar(targetYear, lunarMonth, 1)
    const { year, month, day } = result.solar
    // 해당 양력 날짜의 일진(日辰) 계산
    const saju = calculateSaju(year, month, day)
    return getGapjaNum60(saju.dayPillar[0], saju.dayPillar[1])
  } catch (e) {
    console.error(`[Tojeong] 일진상수 계산 실패 — targetYear=${targetYear}, lunarMonth=${lunarMonth}:`, e)
    return 1  // 지원 범위 외 날짜 등 오류 시 기본값
  }
}

/**
 * 해당 년도의 천간을 구합니다.
 * 갑자년(1984)=甲, 을축년(1985)=乙, ...
 */
function getYearGan(year: number): string {
  // 갑자년 기준: 1984년이 甲子年
  const idx = ((year - 1984) % 10 + 10) % 10
  return CHEONGAN_ORDER[idx]
}

export interface TojeongGwe {
  /** 상괘 1-8 */
  upperGwe: number
  /** 중괘 1-6 */
  middleGwe: number
  /** 하괘 1-3 */
  lowerGwe: number
  /** 괘 번호 표시용 (예: "3-5-2") */
  gweCode: string
}

/**
 * 토정비결 괘를 계산합니다.
 * @param targetYear      풀이할 연도
 * @param lunarBirthMonth 음력 생월 (1~12)
 * @param lunarBirthDay   음력 생일 (1~30)
 * @param age             세는나이 (만나이 + 1)
 */
export function calculateTojeongGwe(
  targetYear: number,
  lunarBirthMonth: number,
  lunarBirthDay: number,
  age: number,
): TojeongGwe {
  // 태세상수 — 풀이 연도 천간 기준
  const yearGan = getYearGan(targetYear)
  const taeseeSangsu = TAESEESANGSU[yearGan] || 1

  // 월건상수 — 풀이 연도 천간 기준 (오호둔년법: 연도 천간→인월 천간 상수)
  const wolgeonSangsu = WOLGEON_SANGSU_BY_GAN[yearGan] || 3

  // 일진상수 — 음력 생월 초하루(1일)의 60갑자 일련번호 (원서 기준)
  const iljinSangsu = getIljinSangsu(targetYear, lunarBirthMonth)

  // 괘 계산
  let upper = (taeseeSangsu + age) % 8
  if (upper === 0) upper = 8

  let middle = (wolgeonSangsu + lunarBirthMonth) % 6
  if (middle === 0) middle = 6

  let lower = (iljinSangsu + lunarBirthDay) % 3
  if (lower === 0) lower = 3

  return {
    upperGwe: upper,
    middleGwe: middle,
    lowerGwe: lower,
    gweCode: `${upper}-${middle}-${lower}`,
  }
}

/**
 * 세는나이 계산 (한국식)
 */
export function getKoreanAge(birthYear: number, currentYear: number): number {
  return currentYear - birthYear + 1
}

// ────────────────────────────────────────────────────────────
// 토정비결 괘명(卦名) 생성
// 상괘(1-8): 팔괘(八卦) 기반 자연 상징
// 중괘(1-6): 음양 6기(六氣) 기반
// 하괘(1-3): 천지인(天地人) 기반
// ────────────────────────────────────────────────────────────

/** 상괘(1-8) → 팔괘 자연 상징 */
const UPPER_GWE_SYMBOL: Record<number, string> = {
  1: '천(天)', 2: '택(澤)', 3: '화(火)', 4: '뇌(雷)',
  5: '풍(風)', 6: '수(水)', 7: '산(山)', 8: '지(地)',
}

/** 중괘(1-6) → 자연 상징 */
const MIDDLE_GWE_SYMBOL: Record<number, string> = {
  1: '일(日)', 2: '월(月)', 3: '성(星)', 4: '운(雲)', 5: '우(雨)', 6: '풍(風)',
}

/** 하괘(1-3) → 천지인 */
const LOWER_GWE_SYMBOL: Record<number, string> = {
  1: '천(天)', 2: '지(地)', 3: '인(人)',
}

/**
 * 상괘·중괘·하괘로 토정비결 괘명을 생성합니다.
 * 예: upperGwe=1, middleGwe=2, lowerGwe=3 → "천일인괘"
 */
export function getGweName(upperGwe: number, middleGwe: number, lowerGwe: number): string {
  const upper = UPPER_GWE_SYMBOL[upperGwe] || `${upperGwe}괘`
  const middle = MIDDLE_GWE_SYMBOL[middleGwe] || `${middleGwe}효`
  const lower = LOWER_GWE_SYMBOL[lowerGwe] || `${lowerGwe}위`
  return `${upper}${middle}${lower}괘`
}

/** 상괘·중괘·하괘의 한자 기반 간략 괘명 (2자형) */
export function getGweNameShort(upperGwe: number, middleGwe: number): string {
  const UPPER_SHORT: Record<number, string> = {
    1: '천', 2: '택', 3: '화', 4: '뇌', 5: '풍', 6: '수', 7: '산', 8: '지',
  }
  const MIDDLE_SHORT: Record<number, string> = {
    1: '일', 2: '월', 3: '성', 4: '운', 5: '우', 6: '풍',
  }
  return `${UPPER_SHORT[upperGwe] || upperGwe}${MIDDLE_SHORT[middleGwe] || middleGwe}괘`
}
