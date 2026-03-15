import { anthropic } from '@/lib/ai/client'
import { calculateSaju } from '@fullstackfamily/manseryeok'
import type { SajuInfo } from '@/lib/utils/saju'
import { getDetailedAnalysis, getYongshin, getSipseong, getNapumOhaeng, getSamjae, getYearJi } from '@/lib/utils/saju'

export interface NewYearResponse {
  zodiacSign: string           // 예: "병오(丙午)년 말띠"
  yearGodBless: string         // 올해의 수호신 또는 길성
  overallScore: number         // 0-100
  yearSummary: string          // 100-150자 종합 요약
  monthHighlights: {
    month: number              // 1-12
    event: string              // 이달의 핵심 이벤트 (20-30자)
    action: string             // 권장 행동 (20-30자)
    score: number              // 0-100
  }[]
  fourPillarsAdvice: {
    love: string               // 애정운 조언 60-80자
    wealth: string             // 재물운 조언 60-80자
    career: string             // 직업·학업운 조언 60-80자
    health: string             // 건강운 조언 60-80자
  }
  luckyItems: {
    color: string              // 올해 길한 색상 (이모지 포함)
    number: number             // 올해 행운 숫자
    direction: string          // 올해 길한 방위
    food: string               // 올해 기운 보충 음식
  }
  yearMantra: string           // 올해의 슬로건/좌우명 (10-20자)
  keywords: string[]           // 이모지 포함 3개
}

const SYSTEM_PROMPT = `당신은 신년운세 전문가입니다. 사주팔자와 신년 간지의 상호작용을 분석하여 운세를 풀이합니다.

다음 JSON 형식으로만 응답하세요 (마크다운 코드 블록 없이):

{
  "zodiacSign": "병오(丙午)년 말띠",
  "yearGodBless": "문창성(文昌星) — 학문과 명예의 기운",
  "overallScore": 78,
  "yearSummary": "올해 종합 운세 (100-150자). 간지 오행과 사주 일간의 관계를 중심으로 구체적으로.",
  "monthHighlights": [
    { "month": 1, "event": "새로운 인연 시작", "action": "적극적 소통을", "score": 72 },
    { "month": 2, "event": "재물 기회 포착", "action": "투자보다 저축을", "score": 68 },
    { "month": 3, "event": "직업운 상승", "action": "역량 어필하기", "score": 85 },
    { "month": 4, "event": "건강 주의 시기", "action": "무리한 일정 자제", "score": 60 },
    { "month": 5, "event": "사교 활동 활발", "action": "인맥 넓히기", "score": 80 },
    { "month": 6, "event": "결정의 기로", "action": "신중한 판단을", "score": 70 },
    { "month": 7, "event": "여행·변화 운", "action": "새 경험 도전", "score": 75 },
    { "month": 8, "event": "성과 수확 시기", "action": "마무리에 집중", "score": 88 },
    { "month": 9, "event": "감정 기복 주의", "action": "마음 챙김 필요", "score": 62 },
    { "month": 10, "event": "재물운 회복", "action": "계획적 지출을", "score": 76 },
    { "month": 11, "event": "귀인 만남 운", "action": "인연에 열린 마음", "score": 82 },
    { "month": 12, "event": "한 해 정리·성찰", "action": "감사와 계획으로", "score": 74 }
  ],
  "fourPillarsAdvice": {
    "love": "올해 애정운 조언 (60-80자)",
    "wealth": "올해 재물운 조언 (60-80자)",
    "career": "올해 직업·학업운 조언 (60-80자)",
    "health": "올해 건강운 조언 (60-80자)"
  },
  "luckyItems": {
    "color": "🔴 빨강 — 활력과 열정",
    "number": 7,
    "direction": "남쪽",
    "food": "🍖 붉은 고기류"
  },
  "yearMantra": "🌟 도전이 곧 성장",
  "keywords": ["🔥 열정", "💡 변화", "🌱 성장"]
}

중요:
- monthHighlights 정확히 12개
- score는 0-100 정수
- 사주 일간과 연도 간지의 생극(生剋) 관계 반영
- luckyItems는 용신(用神) 오행에 기반한 구체적인 아이템:
  · 목(木) 용신 → 색상: 청색·녹색, 방위: 동쪽, 음식: 신맛(식초·레몬·풋채소), 숫자: 3·8
  · 화(火) 용신 → 색상: 적색·주황, 방위: 남쪽, 음식: 쓴맛(쑥·커피·녹차), 숫자: 2·7
  · 토(土) 용신 → 색상: 황색·갈색, 방위: 중앙·북동·남서, 음식: 단맛(고구마·꿀·잡곡), 숫자: 5·10
  · 금(金) 용신 → 색상: 백색·금색·회색, 방위: 서쪽, 음식: 매운맛(마늘·고추·파), 숫자: 4·9
  · 수(水) 용신 → 색상: 흑색·남색·군청, 방위: 북쪽, 음식: 짠맛(해산물·된장·소금), 숫자: 1·6
- yearGodBless는 연도 천간지지의 특성 기반 길성: 예) 문창성(학업), 천을귀인(귀인), 태백성(변화), 복성(복록)

[입춘(立春) 기준 안내]
전통 명리학에서 한 해의 진짜 시작은 양력 1월 1일이 아닌 입춘(立春, 매년 2월 4일경)입니다.
- 입춘 전(1월 1일~2월 3일경) 출생자는 전년도 년주(年柱)를 사용합니다
- yearSummary에 이 사실을 자연스럽게 반영하되 설명 투로 쓰지 말 것
- 1월 생 사용자에게는 "입춘(2월 4일경) 이후부터 새 기운이 본격화됩니다"는 맥락 포함
- 세운(歲運) 분석에서 1~3월은 전년 대운의 여운이 남아있음을 반영`

const GAN_HANJA_NY: Record<string, string> = {
  '갑': '甲', '을': '乙', '병': '丙', '정': '丁', '무': '戊',
  '기': '己', '경': '庚', '신': '辛', '임': '壬', '계': '癸',
}
const JI_HANJA_NY: Record<string, string> = {
  '자': '子', '축': '丑', '인': '寅', '묘': '卯', '진': '辰', '사': '巳',
  '오': '午', '미': '未', '신': '申', '유': '酉', '술': '戌', '해': '亥',
}

export async function generateNewYearReading(
  birthDate: string,
  saju: SajuInfo,
  targetYear: number
): Promise<NewYearResponse> {
  const detail = getDetailedAnalysis(saju)
  const yongshin = getYongshin(saju, detail)
  const napum = getNapumOhaeng(saju.yearPillar)
  const birthYearJiNY = saju.yearPillar[1]
  const targetYearJiNY = getYearJi(targetYear)
  const samjaeNY = getSamjae(birthYearJiNY, targetYearJiNY)

  // 세운(歲運) 간지 사전 계산 (AI 역법 계산 오류 방지)
  const seunSaju = calculateSaju(targetYear, 6, 15)
  const seunPillar = seunSaju.yearPillar
  const seunPillarHanja = seunSaju.yearPillarHanja

  // 충합 사전 계산용 상수
  const CHUNG_PAIRS_NY: [string, string][] = [
    ['자', '오'], ['축', '미'], ['인', '신'], ['묘', '유'], ['진', '술'], ['사', '해'],
  ]
  const YUKHAP_PAIRS_NY: [string, string][] = [
    ['자', '축'], ['인', '해'], ['묘', '술'], ['진', '유'], ['사', '신'], ['오', '미'],
  ]
  const userDayJi = saju.dayPillar[1]
  const userYearJi = saju.yearPillar[1]
  const userMonthJi = saju.monthPillar[1]

  // 세운 지지↔사주 지지 충합 사전 계산
  const seunJi = seunPillar[1]
  const seunChungHapLines: string[] = []
  if (CHUNG_PAIRS_NY.some(([a, b]) => (seunJi === a && userDayJi === b) || (seunJi === b && userDayJi === a)))
    seunChungHapLines.push(`  · 세운 지지(${seunJi})↔일지(${userDayJi}): 충(冲) → overallScore -5~8점, yearSummary에 갈등·변화 반영`)
  if (YUKHAP_PAIRS_NY.some(([a, b]) => (seunJi === a && userDayJi === b) || (seunJi === b && userDayJi === a)))
    seunChungHapLines.push(`  · 세운 지지(${seunJi})↔일지(${userDayJi}): 합(合) → overallScore +5~8점, yearSummary에 좋은 인연·기회 반영`)
  if (CHUNG_PAIRS_NY.some(([a, b]) => (seunJi === a && userYearJi === b) || (seunJi === b && userYearJi === a)))
    seunChungHapLines.push(`  · 세운 지지(${seunJi})↔년지(${userYearJi}): 충(冲) → yearSummary에 뿌리 흔들림·환경 변화 반영`)
  if (YUKHAP_PAIRS_NY.some(([a, b]) => (seunJi === a && userYearJi === b) || (seunJi === b && userYearJi === a)))
    seunChungHapLines.push(`  · 세운 지지(${seunJi})↔년지(${userYearJi}): 합(合) → yearSummary에 출발점 기운 강화 반영`)
  if (CHUNG_PAIRS_NY.some(([a, b]) => (seunJi === a && userMonthJi === b) || (seunJi === b && userMonthJi === a)))
    seunChungHapLines.push(`  · 세운 지지(${seunJi})↔월지(${userMonthJi}): 충(冲) → 직업·사회운 변동 반영`)
  if (YUKHAP_PAIRS_NY.some(([a, b]) => (seunJi === a && userMonthJi === b) || (seunJi === b && userMonthJi === a)))
    seunChungHapLines.push(`  · 세운 지지(${seunJi})↔월지(${userMonthJi}): 합(合) → 직업·사회운 활성화 반영`)
  const seunChungHapNote = seunChungHapLines.length > 0
    ? `[세운 지지 충합 — 코드 계산값]\n${seunChungHapLines.join('\n')}`
    : `[세운 지지 충합 — 코드 계산값]\n  · 세운 지지(${seunJi})와 사주 지지(일지·년지·월지) 간 특별한 충합 없음`

  // 12개월 월운(月運) 천간지지 + 월간십성 + 월지↔일지/년지 충합 사전 계산 — 각 달 20일 기준 (절기 중반)
  const dayGanForSipseongNY = saju.dayPillar[0]
  const monthPillarsNY = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1
    const ms = calculateSaju(targetYear, m, 20)
    const mp = ms.monthPillar
    const sipseong = getSipseong(dayGanForSipseongNY, mp[0])
    const mJi = mp[1]
    const adjNotes: string[] = []
    if (CHUNG_PAIRS_NY.some(([a, b]) => (mJi === a && userDayJi === b) || (mJi === b && userDayJi === a)))
      adjNotes.push('일지충(-8점)')
    if (YUKHAP_PAIRS_NY.some(([a, b]) => (mJi === a && userDayJi === b) || (mJi === b && userDayJi === a)))
      adjNotes.push('일지합(+6점)')
    if (CHUNG_PAIRS_NY.some(([a, b]) => (mJi === a && userYearJi === b) || (mJi === b && userYearJi === a)))
      adjNotes.push('년지충(-4점)')
    if (YUKHAP_PAIRS_NY.some(([a, b]) => (mJi === a && userYearJi === b) || (mJi === b && userYearJi === a)))
      adjNotes.push('년지합(+3점)')
    const adjStr = adjNotes.length > 0 ? ` [${adjNotes.join(' ')}]` : ''
    return `  · ${m}월: ${mp}(${GAN_HANJA_NY[mp[0]] || ''}${JI_HANJA_NY[mp[1]] || ''}) 월간십성: ${sipseong}${adjStr}`
  })

  const userPrompt = `${birthDate}생 사용자의 ${targetYear}년 신년운세를 분석해주세요.

사주팔자:
- 년주: ${saju.yearPillar} (${saju.yearPillarHanja})
- 월주: ${saju.monthPillar} (${saju.monthPillarHanja})
- 일주: ${saju.dayPillar} (${saju.dayPillarHanja})${saju.hourPillar ? `\n- 시주: ${saju.hourPillar} (${saju.hourPillarHanja})` : ''}

일간(日干): ${saju.dayPillar[0]} — ${detail.bodyStrength}, ${detail.geokguk}
납음오행(納音五行): ${napum.name}(${napum.element}) — 생년 기반 근본 기운, yearSummary에 자연스럽게 반영
용신(用神): ${yongshin.yongshinFull} — ${yongshin.reason}
기신(忌神): ${yongshin.heukshin}

[용신 오행별 luckyItems 매핑 — 다음 표를 정확히 사용하세요]
- 목(木) 용신 → color: 청색·녹색, direction: 동쪽, food: 신맛(식초·레몬·풋채소), number: 3 또는 8
- 화(火) 용신 → color: 적색·주황, direction: 남쪽, food: 쓴맛(쑥·커피·녹차·씀바귀), number: 2 또는 7
- 토(土) 용신 → color: 황색·갈색, direction: 중앙(또는 북동·남서), food: 단맛(고구마·꿀·잡곡), number: 5 또는 10
- 금(金) 용신 → color: 백색·금색·회색, direction: 서쪽, food: 매운맛(마늘·고추·생강), number: 4 또는 9
- 수(水) 용신 → color: 흑색·남색·군청, direction: 북쪽, food: 짠맛(해산물·된장·미역국), number: 1 또는 6
이 사주의 용신은 ${yongshin.yongshinFull}(${yongshin.yongshin}) — 위 매핑 중 "${yongshin.yongshin}" 행을 luckyItems에 적용하세요.

[${targetYear}년 세운(歲運) 간지 — 코드 계산값, 이 값을 사용하세요]
- ${targetYear}년 세운 간지: ${seunPillar}(${seunPillarHanja})
- 세운 천간 십성: 일간 ${saju.dayPillar[0]} 기준 세운 천간 ${seunPillar[0]}는 → ${getSipseong(saju.dayPillar[0], seunPillar[0])}
  · 세운 십성 의미를 yearSummary·fourPillarsAdvice에 반영하세요 (예: 편재년=재물 기회·변화, 정관년=안정·승진)
${seunChungHapNote}

[${targetYear}년 월운(月運) 천간지지 — 각 달 절기 기준 사전 계산]
※ 이 값을 기준으로 monthHighlights score를 산출하세요 (AI 계산 불필요):
${monthPillarsNY.join('\n')}
- 월운 천간·지지 오행이 용신(${yongshin.yongshin}) 오행이면 해당 월 score +5~10점
- 월운 오행이 기신(${yongshin.heukshin}) 오행이면 해당 월 score -5~10점
- [일지충] 표시된 달: score에서 추가 -8점 적용
- [일지합] 표시된 달: score에 추가 +6점 적용
- [년지충] 표시된 달: score에서 추가 -4점 적용
- [년지합] 표시된 달: score에 추가 +3점 적용

삼재(三災): ${samjaeNY.isSamjae ? `⚠️ ${samjaeNY.type} — ${samjaeNY.description}` : '해당 없음'}${samjaeNY.isSamjae ? `
- 삼재 해당: yearSummary·annualAdvice·monthHighlights에 반드시 반영하세요
- ${samjaeNY.type === '들삼재' ? '1분기 score -6~9, 2분기 -5~8, 3분기 -3~5, 4분기 -2~3점 하향' : samjaeNY.type === '눌삼재' ? '1분기 -4~6, 2분기 -5~8, 3분기 -3~5, 4분기 -2~3점 하향' : '1분기 -4~6, 2분기 -3~5, 3분기 -1~3, 4분기 정상 (삼재 걷힘)'}` : ''}

위 세운·월운 간지와 사주 원국의 조화·충극(沖剋) 관계를 분석하고,
신년운세를 12개월 흐름과 4대 분야(애정·재물·직업·건강)로 풀이해주세요.`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 3000,
    system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: userPrompt }],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')

  const jsonText = content.text.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '')

  try {
    return JSON.parse(jsonText) as NewYearResponse
  } catch {
    console.error('[NewYear] JSON parse failed:', jsonText.slice(0, 300))
    throw new Error('AI 응답 파싱 실패')
  }
}
