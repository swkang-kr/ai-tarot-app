import { getAllCards, drawCards as tarotapDraw } from 'tarotap'

export interface TarotCard {
  id: string
  name: string
  nameEn: string
  symbol: string
  /** 역방향 여부 (true = 역방향, false = 정방향) */
  isReversed: boolean
  /** 오행 원소: 목(木)·화(火)·토(土)·금(金)·수(水) */
  element: string
  /** 역방향 시 고유 해석 키워드 */
  reversedMeaning: string
}

// Major Arcana symbol mapping
const MAJOR_SYMBOLS: Record<string, string> = {
  'the-fool': '🃏',
  'the-magician': '✨',
  'the-high-priestess': '🌙',
  'the-empress': '👑',
  'the-emperor': '🏛️',
  'the-hierophant': '📿',
  'the-lovers': '💕',
  'the-chariot': '⚡',
  'strength': '🦁',
  'the-hermit': '🕯️',
  'wheel-of-fortune': '🎡',
  'justice': '⚖️',
  'the-hanged-man': '🔄',
  'death': '🦋',
  'temperance': '⏳',
  'the-devil': '⛓️',
  'the-tower': '🗼',
  'the-star': '⭐',
  'the-moon': '🌕',
  'the-sun': '☀️',
  'judgement': '📯',
  'the-world': '🌍',
}

// Minor Arcana suit symbols
const SUIT_SYMBOLS: Record<string, string> = {
  'wands': '🪄',
  'cups': '🏆',
  'swords': '⚔️',
  'pentacles': '🪙',
}

// Major Arcana 오행 원소 매핑 (전통 점성술 기반 사주 오행 대응)
// Fire→화(火), Water→수(水), Earth→토(土), Air→금(金), Aether→목(木)
const MAJOR_ELEMENT: Record<string, string> = {
  'the-fool': '목(木)',          // 바람·시작·자유
  'the-magician': '화(火)',      // 의지·창조·열정
  'the-high-priestess': '수(水)', // 직관·신비·내면
  'the-empress': '목(木)',        // 생명·풍요·성장
  'the-emperor': '토(土)',        // 권위·안정·지배
  'the-hierophant': '토(土)',     // 전통·제도·신앙
  'the-lovers': '화(火)',         // 사랑·선택·결합
  'the-chariot': '수(水)',        // 의지·이동·정복
  'strength': '화(火)',           // 용기·생명력·열정
  'the-hermit': '토(土)',         // 은둔·성찰·지혜
  'wheel-of-fortune': '금(金)',   // 순환·운명·변화
  'justice': '금(金)',            // 균형·공정·결단
  'the-hanged-man': '수(水)',     // 희생·수용·통찰
  'death': '수(水)',              // 변환·종결·재생
  'temperance': '화(火)',         // 조화·절제·연금술
  'the-devil': '토(土)',          // 물질·속박·욕망
  'the-tower': '화(火)',          // 파괴·각성·혁명
  'the-star': '수(水)',           // 희망·치유·영감
  'the-moon': '수(水)',           // 환상·직관·무의식
  'the-sun': '화(火)',            // 기쁨·성공·생명
  'judgement': '화(火)',          // 부활·심판·각성
  'the-world': '토(土)',          // 완성·통합·성취
}

// Minor Arcana 수트별 오행 매핑
const SUIT_ELEMENT: Record<string, string> = {
  'wands': '화(火)',      // Fire — 열정·창조·의지
  'cups': '수(水)',       // Water — 감정·직관·관계
  'swords': '금(金)',     // Air → 금(金) — 이성·갈등·결단
  'pentacles': '토(土)',  // Earth — 물질·재물·현실
}

// Major Arcana 역방향 고유 의미
const MAJOR_REVERSED: Record<string, string> = {
  'the-fool':          '경솔한 결정, 무모한 행동, 방향 상실, 새 시작의 두려움',
  'the-magician':      '능력 낭비, 조작·기만, 잠재력 미활용, 집중력 분산',
  'the-high-priestess':'비밀 드러남, 직관 무시, 내면 목소리 억압, 감추어진 진실',
  'the-empress':       '창의성 억압, 과잉 의존, 성장 정체, 불필요한 집착',
  'the-emperor':       '권위 남용, 완고한 고집, 통제 상실, 부성적 갈등',
  'the-hierophant':    '관습 거부, 기존 체계와 충돌, 독자적 신념 추구',
  'the-lovers':        '불화·이별, 잘못된 선택, 가치관 충돌, 관계 재고',
  'the-chariot':       '방향 상실, 충동적 행동, 의지력 약화, 목표 분산',
  'strength':          '나약함, 자기 의심, 내면 갈등, 야성적 충동 억압',
  'the-hermit':        '고립 심화, 소통 단절, 자기 성찰 거부, 세상과 단절',
  'wheel-of-fortune':  '불운, 변화 저항, 사이클 방해, 외부 상황 의존',
  'justice':           '불공평, 책임 회피, 법적 문제, 자기 합리화',
  'the-hanged-man':    '희생 거부, 현상 유지 집착, 내면 저항, 순교적 집착',
  'death':             '변화 거부, 낡은 것 집착, 전환점 회피, 정체와 반복',
  'temperance':        '불균형, 과잉·극단적 행동, 조화 깨짐, 인내 부족',
  'the-devil':         '속박 해방, 의존성 극복, 두려움 직면, 변화의 씨앗',
  'the-tower':         '재난 회피, 변화 두려움, 위기 지연, 내면의 각성',
  'the-star':          '희망 상실, 낙담, 믿음 약화, 영감 고갈, 자기 불신',
  'the-moon':          '혼란 해소, 진실 드러남, 두려움 직면, 무의식 정화',
  'the-sun':           '활기 저하, 자신감 약화, 지나친 낙관, 어두운 면 직시',
  'judgement':         '자기 비판 과잉, 변화 거부, 후회 집착, 과거 미련',
  'the-world':         '미완성, 완성 지연, 목표 재조정 필요, 부분적 성취',
}

// Minor Arcana 카드별 개별 역방향 의미 (56장)
const MINOR_REVERSED: Record<string, string> = {
  // ── Wands (완드) ───────────────────────────────────────────
  'ace-of-wands':    '창의성 억압, 새 시작 지연, 에너지 낭비, 계획 좌절',
  'two-of-wands':    '결정 회피, 계획 지연, 두려움에 발목 잡힘, 모험 포기',
  'three-of-wands':  '기대 실망, 진행 방해, 해외 인연 지연, 비전 퇴색',
  'four-of-wands':   '화합 깨짐, 가정 불안, 잔치 뒤 갈등, 기반 흔들림',
  'five-of-wands':   '갈등 회피, 경쟁 포기, 내부 분열, 의사소통 단절',
  'six-of-wands':    '성공 지연, 인정 욕구 과잉, 교만 경계, 실패 두려움',
  'seven-of-wands':  '방어 포기, 자신감 상실, 위협에 무너짐, 포기 유혹',
  'eight-of-wands':  '급브레이크, 소식 지연, 충돌 임박, 일정 혼란',
  'nine-of-wands':   '경계심 과잉, 편집증, 방어막 포기, 지침과 소진',
  'ten-of-wands':    '과부하 해소, 짐 내려놓기, 역할 재분배, 포기의 결단',
  'page-of-wands':   '흥분 후 포기, 계획만 있고 실행 없음, 방황하는 에너지',
  'knight-of-wands': '무모한 돌진, 충동 행동, 분노 폭발, 일관성 부족',
  'queen-of-wands':  '질투·이기심, 자신감 과잉, 독선, 에너지 오용',
  'king-of-wands':   '독재적 리더십, 충동적 결정, 권위 남용, 거만함',
  // ── Cups (컵) ─────────────────────────────────────────────
  'ace-of-cups':    '감정 억압, 사랑 두려움, 내면 공허, 기회 거부',
  'two-of-cups':    '관계 균열, 약속 파기, 소통 단절, 파트너십 해체',
  'three-of-cups':  '과도한 방종, 삼각관계 주의, 우정 갈등, 과음·과식',
  'four-of-cups':   '무관심 탈피, 새 기회 인식, 권태 극복, 재각성의 시작',
  'five-of-cups':   '슬픔 극복 시작, 회복 전환점, 과거 집착 이제 그만',
  'six-of-cups':    '과거 집착, 성장 거부, 순진함 오남용, 현실 회피',
  'seven-of-cups':  '환상 깨짐, 결단력 발휘, 꿈과 현실 구분, 선택의 혼란',
  'eight-of-cups':  '포기 거부, 머무름 선택, 미련과 집착, 재고 필요',
  'nine-of-cups':   '자기만족 과잉, 탐욕·사치, 표면적 행복, 내면 공허',
  'ten-of-cups':    '가정 불화, 행복의 균열, 이상과 현실 괴리, 관계 갈등',
  'page-of-cups':   '감수성 과잉, 현실감 부족, 공상에 빠짐, 감정 미성숙',
  'knight-of-cups': '감정 변덕, 낭만적 집착, 비현실적 이상, 기분파',
  'queen-of-cups':  '감정 불안정, 의존성 과잉, 직관 오판, 자기 기만',
  'king-of-cups':   '감정 조작, 내면 억압, 겉으로만 침착, 의존 조장',
  // ── Swords (검) ───────────────────────────────────────────
  'ace-of-swords':    '혼란·불명확, 잘못된 판단, 의사소통 실패, 진실 회피',
  'two-of-swords':    '결정 장애, 정보 회피, 균형 깨짐, 갈등 회피 반복',
  'three-of-swords':  '상처 치유 시작, 슬픔 극복, 용서 과정, 고통 완화',
  'four-of-swords':   '강제 활성화, 불안한 휴식, 복귀 준비, 회복 지연',
  'five-of-swords':   '갈등 악화, 패배 수용 어려움, 복수심, 반목 지속',
  'six-of-swords':    '이동 불가, 과거에서 못 벗어남, 문제 해결 지연, 저항',
  'seven-of-swords':  '기만 폭로, 비밀 드러남, 양심 회복, 사기 발각',
  'eight-of-swords':  '자유 회복 시작, 자기 제약 인식, 탈출 용기 필요',
  'nine-of-swords':   '공황·악몽 심화, 자기 학대, 불필요한 죄책감, 우울 심화',
  'ten-of-swords':    '최저점 탈출 시작, 회복 신호, 상처 직면, 재기의 시작',
  'page-of-swords':   '가십·험담, 경솔한 언행, 무분별한 정보 공유, 미성숙',
  'knight-of-swords': '무모한 돌진, 충동적 발언, 논쟁 중독, 방향 없는 행동',
  'queen-of-swords':  '냉혹함·비정함, 차가운 판단, 고독과 고립, 잔인한 언어',
  'king-of-swords':   '권위 오용, 지적 오만, 냉정함 과잉, 독단적 결정',
  // ── Pentacles (펜타클) ────────────────────────────────────
  'ace-of-pentacles':    '기회 상실, 물질적 불안, 계획 실패, 시작 타이밍 놓침',
  'two-of-pentacles':    '균형 상실, 재정 관리 실패, 과부하, 우선순위 혼란',
  'three-of-pentacles':  '팀워크 붕괴, 기술 과시, 협력 거부, 품질 저하',
  'four-of-pentacles':   '인색함·집착, 변화 거부, 재물 독점, 재정 불안',
  'five-of-pentacles':   '회복 시작, 도움 수용, 빈곤 탈출, 재기의 희망',
  'six-of-pentacles':    '불공정 거래, 자선 오남용, 의존 관계, 재정 불균형',
  'seven-of-pentacles':  '성급한 포기, 인내 부족, 투자 실패, 장기 비전 결여',
  'eight-of-pentacles':  '완벽주의 함정, 기술 정체, 단순 반복, 발전 없는 노력',
  'nine-of-pentacles':   '물질 과잉 집착, 자립심 결여, 성과 과장, 외로운 성공',
  'ten-of-pentacles':    '가족 갈등, 재산 분쟁, 전통 붕괴, 세대 단절',
  'page-of-pentacles':   '현실감 부족, 계획만 있고 실행 없음, 배움 중단, 게으름',
  'knight-of-pentacles': '지나친 신중함, 완고함, 변화 거부, 답보 상태',
  'queen-of-pentacles':  '물질 집착, 과잉 보호, 독립심 결여, 지나친 현실주의',
  'king-of-pentacles':   '탐욕·부패, 물질에 영혼 팔기, 냉혹한 사업, 도덕 상실',
}

// Minor Arcana 수트별 역방향 기본 의미 (개별 정의가 없는 경우 폴백)
const SUIT_REVERSED: Record<string, string> = {
  'wands':     '에너지 지연, 목표 불명확, 열정 낭비, 성급한 행동, 의욕 저하',
  'cups':      '감정 억압, 관계 단절, 감정적 미성숙, 자기 기만, 이별의 아픔',
  'swords':    '갈등 심화, 판단 오류, 언어 상처, 진실 회피, 혼란스러운 생각',
  'pentacles': '재물 손실, 물질 집착, 현실 부정, 안정 불안, 낭비와 손실',
}

function getReversedMeaning(id: string): string {
  if (MAJOR_REVERSED[id]) return MAJOR_REVERSED[id]
  if (MINOR_REVERSED[id]) return MINOR_REVERSED[id]
  for (const [suit, meaning] of Object.entries(SUIT_REVERSED)) {
    if (id.includes(suit)) return meaning
  }
  return '에너지 내면화, 지연, 내적 성찰 필요'
}

function getElement(id: string): string {
  if (MAJOR_ELEMENT[id]) return MAJOR_ELEMENT[id]
  for (const [suit, element] of Object.entries(SUIT_ELEMENT)) {
    if (id.includes(suit)) return element
  }
  return '목(木)'
}

function getSymbol(id: string): string {
  if (MAJOR_SYMBOLS[id]) return MAJOR_SYMBOLS[id]
  for (const [suit, symbol] of Object.entries(SUIT_SYMBOLS)) {
    if (id.includes(suit)) return symbol
  }
  return '🔮'
}

// Build merged card data (Korean name + English name + symbol)
const koCards = getAllCards('ko')
const enCards = getAllCards('en')

const enNameMap = new Map<string, string>()
enCards.forEach(c => enNameMap.set(c.id, c.name))

/** 역방향 없이 기본 카드 목록 (isReversed=false) */
export const allCards: TarotCard[] = koCards.map(c => ({
  id: c.id,
  name: c.name,
  nameEn: enNameMap.get(c.id) || c.id,
  symbol: getSymbol(c.id),
  isReversed: false,
  element: getElement(c.id),
  reversedMeaning: getReversedMeaning(c.id),
}))

export const majorArcana: TarotCard[] = allCards.filter(c => MAJOR_SYMBOLS[c.id])
export const minorArcana: TarotCard[] = allCards.filter(c => !MAJOR_SYMBOLS[c.id])

/**
 * 무작위 타로 카드 뽑기 (역방향 50% 확률 포함)
 */
export function getRandomCards(count: number): TarotCard[] {
  const drawn = tarotapDraw(count, false, 'ko')
  return drawn.map(c => {
    const base = allCards.find(a => a.id === c.id)!
    return {
      ...base,
      isReversed: Math.random() < 0.5,
    }
  })
}

/** 역방향 카드의 표시명 (역 접두사 추가) */
export function getCardDisplayName(card: TarotCard): string {
  return card.isReversed ? `${card.name} (역방향)` : card.name
}
