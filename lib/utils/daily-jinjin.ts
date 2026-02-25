import { calculateSaju } from '@fullstackfamily/manseryeok'

// 천간 → 오행
const GAN_ELEMENT: Record<string, string> = {
  '갑': '목', '을': '목',
  '병': '화', '정': '화',
  '무': '토', '기': '토',
  '경': '금', '신': '금',
  '임': '수', '계': '수',
}

// 지지 → 한글 이름
const JI_NAME: Record<string, string> = {
  '자': '자(鼠)', '축': '축(牛)', '인': '인(虎)', '묘': '묘(兎)',
  '진': '진(龍)', '사': '사(蛇)', '오': '오(馬)', '미': '미(羊)',
  '신': '신(猴)', '유': '유(鷄)', '술': '술(狗)', '해': '해(豬)',
}

// 오행 → 색상
const ELEMENT_COLOR: Record<string, { name: string; hex: string; emoji: string }> = {
  '목': { name: '초록', hex: '#22c55e', emoji: '🌿' },
  '화': { name: '빨강', hex: '#ef4444', emoji: '🔴' },
  '토': { name: '황금', hex: '#eab308', emoji: '🟡' },
  '금': { name: '흰색', hex: '#e2e8f0', emoji: '⚪' },
  '수': { name: '파랑', hex: '#3b82f6', emoji: '🔵' },
}

// 오행 → 길한 방위
const ELEMENT_LUCKY_DIR: Record<string, string> = {
  '목': '동쪽', '화': '남쪽', '토': '중앙', '금': '서쪽', '수': '북쪽',
}

// 오행 상극 (목극토, 화극금, 토극수, 금극목, 수극화) → 흉 방위
const ELEMENT_AVOID_DIR: Record<string, string> = {
  '목': '중앙', '화': '서쪽', '토': '북쪽', '금': '동쪽', '수': '남쪽',
}

// 오행 → 길한 시간대
const ELEMENT_LUCKY_HOUR: Record<string, string> = {
  '목': '오전 6-8시', '화': '오전 9-11시', '토': '오후 12-2시',
  '금': '오후 3-5시', '수': '저녁 6-8시',
}

// 오행 × 날짜 기반 다양한 메시지
const ELEMENT_MESSAGES: Record<string, string[]> = {
  '목': [
    '성장과 발전의 에너지가 넘치는 날. 새로운 일을 시작하기에 좋습니다.',
    '창의력이 샘솟는 날입니다. 아이디어를 적극적으로 표현하세요.',
    '인간관계에서 좋은 소식이 들려올 수 있는 날입니다.',
  ],
  '화': [
    '열정적인 행동이 빛을 발하는 날. 결단력 있게 나아가세요.',
    '사교적 활동에 유리한 날입니다. 적극적으로 소통하세요.',
    '도전과 경쟁에서 좋은 결과를 기대할 수 있는 날입니다.',
  ],
  '토': [
    '신중한 판단이 필요한 날. 안정을 추구하면 좋은 결과가 있습니다.',
    '착실한 노력이 인정받는 날입니다. 꾸준함을 유지하세요.',
    '실용적인 접근이 효과적인 날. 현실적인 계획을 세우세요.',
  ],
  '금': [
    '명확한 소통이 중요한 날. 계획을 정리하고 결단을 내리세요.',
    '재물운이 활발한 날입니다. 금전 거래에 집중하세요.',
    '정확하고 체계적인 행동이 성과를 가져오는 날입니다.',
  ],
  '수': [
    '직관과 지혜가 빛나는 날. 깊은 생각이 좋은 답을 줍니다.',
    '학습과 연구에 집중력이 높아지는 날입니다.',
    '내면의 목소리에 귀 기울이면 중요한 통찰을 얻을 수 있습니다.',
  ],
}

export interface DailyJinjin {
  todayGanji: string       // 오늘 간지 (예: 갑자)
  todayElement: string     // 오늘 오행
  color: { name: string; hex: string; emoji: string }
  luckyHour: string
  avoidDirection: string
  luckyDirection: string
  dailyMessage: string
  dateLabel: string        // 표시용 날짜
}

export function calculateDailyJinjin(today: Date = new Date()): DailyJinjin {
  const saju = calculateSaju(today.getFullYear(), today.getMonth() + 1, today.getDate())
  const ganji = saju.dayPillar           // e.g. "갑자"
  const gan = ganji[0]                   // 천간
  const ji = ganji[1]                    // 지지

  const element = GAN_ELEMENT[gan] ?? '목'
  const color = ELEMENT_COLOR[element] ?? ELEMENT_COLOR['목']
  const luckyHour = ELEMENT_LUCKY_HOUR[element] ?? '오전 9-11시'
  const luckyDirection = ELEMENT_LUCKY_DIR[element] ?? '동쪽'
  const avoidDirection = ELEMENT_AVOID_DIR[element] ?? '중앙'

  // 날짜 기반으로 메시지 선택 (매일 변동)
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
  )
  const messages = ELEMENT_MESSAGES[element] ?? ELEMENT_MESSAGES['목']
  const dailyMessage = messages[dayOfYear % messages.length]

  const jiName = JI_NAME[ji] ?? ji
  const todayGanji = `${gan}${ji} (${jiName}일)`

  const dateLabel = `${today.getMonth() + 1}월 ${today.getDate()}일`

  return {
    todayGanji,
    todayElement: element,
    color,
    luckyHour,
    avoidDirection,
    luckyDirection,
    dailyMessage,
    dateLabel,
  }
}
