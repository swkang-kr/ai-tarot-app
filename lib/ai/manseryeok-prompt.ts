import { anthropic } from '@/lib/ai/client'
import type { SajuInfo, SajuDetailedAnalysis } from '@/lib/utils/saju'
import { calculateDaeunStartAge, calculateDaeunPillars, getYongshin } from '@/lib/utils/saju'
import { calculateSaju } from '@fullstackfamily/manseryeok'

export interface ManseryeokResponse {
  currentDaeun: {
    period: string      // 예: "35-44세"
    ganji: string       // 예: "무인"
    meaning: string     // 80-100자
    score: number       // 0-100
  }
  nextDaeun: {
    period: string
    ganji: string
    meaning: string
    score: number
  }
  currentSeun: {
    year: number
    ganji: string       // 예: "병오"
    theme: string       // 예: "도약의 해"
    score: number
    advice: string      // 60-80자
  }
  monthlyFlow: {
    month: number       // 1-12
    ganji: string
    score: number       // 0-100
    advice: string      // 30-50자
  }[]
  lifeTimeline: {
    decade: string      // 예: "10대"
    score: number       // 0-100 (rating × 20)
    theme: string
    ganji: string
  }[]
  keywords: string[]
}

const SYSTEM_PROMPT = `당신은 30년 경력의 사주명리 전문가입니다. 사용자의 사주팔자와 대운·세운·월운을 심층 분석합니다.

다음 JSON 형식으로만 응답하세요 (마크다운 코드 블록 없이):

{
  "currentDaeun": {
    "period": "35-44세",
    "ganji": "무인",
    "meaning": "현재 대운에서 이 사람이 겪는 운명적 흐름 (80-100자)",
    "score": 78
  },
  "nextDaeun": {
    "period": "45-54세",
    "ganji": "기묘",
    "meaning": "다음 대운의 흐름과 준비사항 (80-100자)",
    "score": 85
  },
  "currentSeun": {
    "year": 2026,
    "ganji": "병오",
    "theme": "도약과 변화",
    "score": 75,
    "advice": "올해 세운에서 주의할 점과 활용 방법 (60-80자)"
  },
  "monthlyFlow": [
    { "month": 1, "ganji": "갑자", "score": 72, "advice": "1월 한줄 조언 (30-50자)" },
    { "month": 2, "ganji": "을축", "score": 65, "advice": "2월 한줄 조언" },
    { "month": 3, "ganji": "병인", "score": 80, "advice": "3월 한줄 조언" },
    { "month": 4, "ganji": "정묘", "score": 70, "advice": "4월 한줄 조언" },
    { "month": 5, "ganji": "무진", "score": 88, "advice": "5월 한줄 조언" },
    { "month": 6, "ganji": "기사", "score": 62, "advice": "6월 한줄 조언" },
    { "month": 7, "ganji": "경오", "score": 76, "advice": "7월 한줄 조언" },
    { "month": 8, "ganji": "신미", "score": 82, "advice": "8월 한줄 조언" },
    { "month": 9, "ganji": "임신", "score": 90, "advice": "9월 한줄 조언" },
    { "month": 10, "ganji": "계유", "score": 68, "advice": "10월 한줄 조언" },
    { "month": 11, "ganji": "갑술", "score": 74, "advice": "11월 한줄 조언" },
    { "month": 12, "ganji": "을해", "score": 79, "advice": "12월 한줄 조언" }
  ],
  "lifeTimeline": [
    { "decade": "10대", "score": 60, "theme": "배움의 시기", "ganji": "갑인" },
    { "decade": "20대", "score": 75, "theme": "기반 구축", "ganji": "을묘" },
    { "decade": "30대", "score": 88, "theme": "전성기", "ganji": "병진" },
    { "decade": "40대", "score": 80, "theme": "원숙기", "ganji": "정사" },
    { "decade": "50대", "score": 70, "theme": "안정기", "ganji": "무오" },
    { "decade": "60대+", "score": 72, "theme": "결실기", "ganji": "기미" }
  ],
  "keywords": ["이모지 키워드1", "이모지 키워드2", "이모지 키워드3"]
}

중요:
- monthlyFlow는 정확히 12개 (1월~12월)
- lifeTimeline은 6개 (10대~60대+)
- score는 모두 0-100 정수
- 실제 사주 원국과 대운 계산 원리에 기반하여 분석
- 대운 분석 시 반드시 천간기(前5年)·지지기(後5年) 구분:
  예) "갑인 대운 35-39세: 甲(갑, 목) 천간기 — 인성 활성화, 학문·자격 유리 / 40-44세: 寅(인, 목) 지지기 — 실제 행동·이동 활발"`

export async function generateManseryeok(
  birthDate: string,
  saju: SajuInfo,
  targetYear: number,
  currentAge: number,
  gender?: string | null,
  detail?: SajuDetailedAnalysis
): Promise<ManseryeokResponse> {
  const genderNote = gender === 'male' ? '남성' : gender === 'female' ? '여성' : '성별 미입력'
  // 대운 순행/역행: 생년 천간 음양 + 성별로 결정
  // 양년생(갑,병,무,경,임) 남성 = 순행, 여성 = 역행
  // 음년생(을,정,기,신,계) 남성 = 역행, 여성 = 순행
  const birthYearGan = saju.yearPillar[0]
  const isYangYear = ['갑', '병', '무', '경', '임'].includes(birthYearGan)
  let daeunDirection = '불명확'
  if (gender === 'male') daeunDirection = isYangYear ? '순행(順行)' : '역행(逆行)'
  else if (gender === 'female') daeunDirection = isYangYear ? '역행(逆行)' : '순행(順行)'

  // 대운 시작 나이 추정: 월주 월건(月建) 기준 절기와 출생일의 차이로 계산
  // 양년 남성·음년 여성은 순행(다음 절기까지의 날수/3 = 대운 시작 나이)
  // 음년 남성·양년 여성은 역행(이전 절기까지의 날수/3 = 대운 시작 나이)
  // 간략화: 보통 3~8세 사이에 첫 대운 시작, 10년 주기
  const birthYear = parseInt(birthDate.split('-')[0])
  // 대운 시작 나이: 절기 기준 정확 계산 (출생일↔절기 날수 ÷ 3)
  const daeunStart = calculateDaeunStartAge(birthDate, birthYearGan, gender)
  const currentDaeunIndex = Math.max(0, Math.floor((currentAge - daeunStart) / 10))
  const daeunStartAge = daeunStart + currentDaeunIndex * 10
  const daeunEndAge = daeunStartAge + 9

  // 실제 대운 간지 계산 (AI 직접 계산 오류 방지)
  const daeunDir = daeunDirection.includes('순행') ? 'forward' : 'reverse'
  const daeunPillars = daeunDirection !== '불명확'
    ? calculateDaeunPillars(saju.monthPillar, daeunDir, daeunStart, 8)
    : []

  // 용신 사전 계산 (detail이 있을 때만)
  const yongshin = detail ? getYongshin(saju, detail) : null

  const userPrompt = `${birthDate}생 (현재 ${currentAge}세, ${genderNote}) 사용자의 만세력을 분석해주세요.

사주팔자:
- 년주: ${saju.yearPillar} (${saju.yearPillarHanja})
- 월주: ${saju.monthPillar} (${saju.monthPillarHanja})
- 일주: ${saju.dayPillar} (${saju.dayPillarHanja})${saju.hourPillar ? `\n- 시주: ${saju.hourPillar} (${saju.hourPillarHanja})` : ''}

성별: ${genderNote}
대운 방향: ${daeunDirection}
대운 시작 나이 (절기 기준 계산): ${daeunStart}세 (출생일↔절기 날수÷3 정확 계산값)
${daeunPillars.length > 0 ? `
실제 대운 간지 목록 (코드 계산값 — 반드시 이 값을 사용하세요):
${daeunPillars.map(d => `  · ${d.age}세 대운: ${d.pillar}(${d.hanja})`).join('\n')}
` : ''}
분석 요청:
1. 현재 대운 및 다음 대운 (10년 주기) — 위 실제 대운 간지를 사용, 일간 오행과 대운 간지의 상호작용 분석
   ※ 대운 의미 필드에 천간기(前5年)와 지지기(後5年)를 구분하여 서술하세요
2. ${targetYear}년 세운 (年運) — 올해의 흐름과 핵심 테마
3. ${targetYear}년 월운 (月運) — 12개월 흐름
4. 전 생애 대운 타임라인 (10대~60대+)

대운 계산 기준:
- 대운 시작 나이: ${daeunStart}세 (위 대운 간지 목록 기준)
- 현재 대운 구간: ${daeunStartAge}세 ~ ${daeunEndAge}세 (현재 ${currentAge}세 기준)
- currentDaeun.ganji와 nextDaeun.ganji는 위 대운 간지 목록에서 그대로 가져오세요.
- ${daeunDirection === '불명확' ? '성별 정보 없음 — 양방향 모두 제시해주세요.' : `${daeunDirection}으로 산정된 위 대운 간지를 사용하세요.`}
${detail ? `
[사주 원국 심층 정보]
- 신강/신약: ${detail.bodyStrength}
- 격국: ${detail.geokguk}
- 강한 오행: ${detail.dominantElement} / 약한 오행: ${detail.weakElement}
- 용신(用神): ${yongshin?.yongshinFull} — ${yongshin?.reason}
- 기신(忌神): ${yongshin?.heukshin}
- 신살: ${detail.sinsal.length > 0 ? detail.sinsal.map(s => s.name).join(', ') : '없음'}
- 공망: ${detail.gongmang ? `${detail.gongmang[0]}·${detail.gongmang[1]}` : '없음'}

[십이운성(十二運星) 기반 대운 강약 판정 — 일간 ${detail.dayMaster.name} 기준]
대운 지지의 십이운성이 제왕(帝旺)·임관(臨官)이면 강운 대운, 묘(墓)·절(絶)·병(病)·사(死)이면 주의 대운:
${daeunPillars.slice(0, 6).map(d => {
  const SIPIU: Record<string, Record<string, string>> = {
    '갑': { '해': '장생', '자': '목욕', '축': '관대', '인': '임관', '묘': '제왕', '진': '쇠', '사': '병', '오': '사', '미': '묘', '신': '절', '유': '태', '술': '양' },
    '을': { '오': '장생', '사': '목욕', '진': '관대', '묘': '임관', '인': '제왕', '축': '쇠', '자': '병', '해': '사', '술': '묘', '유': '절', '신': '태', '미': '양' },
    '병': { '인': '장생', '묘': '목욕', '진': '관대', '사': '임관', '오': '제왕', '미': '쇠', '신': '병', '유': '사', '술': '묘', '해': '절', '자': '태', '축': '양' },
    '무': { '인': '장생', '묘': '목욕', '진': '관대', '사': '임관', '오': '제왕', '미': '쇠', '신': '병', '유': '사', '술': '묘', '해': '절', '자': '태', '축': '양' },
    '정': { '유': '장생', '신': '목욕', '미': '관대', '오': '임관', '사': '제왕', '진': '쇠', '묘': '병', '인': '사', '축': '묘', '자': '절', '해': '태', '술': '양' },
    '기': { '유': '장생', '신': '목욕', '미': '관대', '오': '임관', '사': '제왕', '진': '쇠', '묘': '병', '인': '사', '축': '묘', '자': '절', '해': '태', '술': '양' },
    '경': { '사': '장생', '오': '목욕', '미': '관대', '신': '임관', '유': '제왕', '술': '쇠', '해': '병', '자': '사', '축': '묘', '인': '절', '묘': '태', '진': '양' },
    '신': { '자': '장생', '해': '목욕', '술': '관대', '유': '임관', '신': '제왕', '미': '쇠', '오': '병', '사': '사', '진': '묘', '묘': '절', '인': '태', '축': '양' },
    '임': { '신': '장생', '유': '목욕', '술': '관대', '해': '임관', '자': '제왕', '축': '쇠', '인': '병', '묘': '사', '진': '묘', '사': '절', '오': '태', '미': '양' },
    '계': { '묘': '장생', '인': '목욕', '축': '관대', '자': '임관', '해': '제왕', '술': '쇠', '유': '병', '신': '사', '미': '묘', '오': '절', '사': '태', '진': '양' },
  }
  const dayGan = detail.dayMaster.name[0]
  const ji = d.pillar[1]
  const unsung = (SIPIU[dayGan] || {})[ji] || '불명'
  const mark = ['제왕', '임관'].includes(unsung) ? ' ★강운' : ['묘', '절', '병', '사'].includes(unsung) ? ' ▼주의' : ''
  return `  · ${d.age}세 대운 ${d.pillar}(${d.hanja}): 십이운성 ${unsung}${mark}`
}).join('\n')}` : ''}`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 3000,
    system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: userPrompt }],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')

  let jsonText = content.text.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '')

  try {
    return JSON.parse(jsonText) as ManseryeokResponse
  } catch {
    console.error('[Manseryeok] JSON parse failed:', jsonText.slice(0, 300))
    throw new Error('AI 응답 파싱 실패')
  }
}
