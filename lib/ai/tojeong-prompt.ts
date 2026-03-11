import { anthropic } from '@/lib/ai/client'
import type { SajuInfo } from '@/lib/utils/saju'
import { getSamjae, getYearJi } from '@/lib/utils/saju'
import { calculateTojeongGwe, getKoreanAge, getGweName, getGweNameShort } from '@/lib/utils/tojeong'

export interface TojeongResponse {
  gwe: string             // 괘명 (예: "천지비괘")
  gweNumber: number       // 괘 번호 1-144
  gweEmoji: string        // 대표 이모지
  gweDescription: string  // 괘 한줄 의미 (30-50자)
  yearFortune: string     // 올해 종합 (100-150자)
  quarterFortune: {
    q: number             // 1-4
    theme: string         // 테마
    fortune: string       // 운세 (40-60자)
    score: number         // 0-100
  }[]
  loveAdvice: string      // 60-80자
  wealthAdvice: string    // 60-80자
  healthAdvice: string    // 60-80자
  caution: string         // 주의사항 (40-60자)
  keywords: string[]
}

const SYSTEM_PROMPT = `당신은 토정비결(土亭秘訣) 전문가입니다. 이이(李珥) 선생의 토정비결 원리에 따라 분석합니다.

토정비결은 태세(太歲)·월건(月建)·일진(日辰)의 상수(象數)로 144괘(卦)를 산출합니다.

다음 JSON 형식으로만 응답하세요 (마크다운 코드 블록 없이):

{
  "gwe": "천지비괘",
  "gweNumber": 42,
  "gweEmoji": "🌥️",
  "gweDescription": "하늘과 땅이 서로 막혀 소통이 어려운 시기 (30-50자)",
  "yearFortune": "올해 전체 운세 종합 (100-150자). 괘의 상징과 연결하여 구체적으로.",
  "quarterFortune": [
    { "q": 1, "theme": "봄의 시작", "fortune": "1~3월 운세 (40-60자)", "score": 72 },
    { "q": 2, "theme": "여름의 성장", "fortune": "4~6월 운세 (40-60자)", "score": 80 },
    { "q": 3, "theme": "가을의 결실", "fortune": "7~9월 운세 (40-60자)", "score": 68 },
    { "q": 4, "theme": "겨울의 준비", "fortune": "10~12월 운세 (40-60자)", "score": 75 }
  ],
  "loveAdvice": "올해 인연운 조언 (60-80자)",
  "wealthAdvice": "올해 재물운 조언 (60-80자)",
  "healthAdvice": "올해 건강운 조언 (60-80자)",
  "caution": "올해 가장 주의할 사항 (40-60자)",
  "keywords": ["이모지 키워드1", "이모지 키워드2", "이모지 키워드3"]
}

중요:
- quarterFortune 정확히 4개
- score 0-100 정수
- 전통 토정비결 원리에 기반하되 현대적 언어로 해석
- 괘 번호는 1-144 범위`

export async function generateTojeong(
  birthDate: string,
  saju: SajuInfo,
  targetYear: number,
  lunarBirth: { year: number; month: number; day: number }
): Promise<TojeongResponse> {
  // 코드로 괘를 미리 계산하여 AI에게 전달 (AI의 수학 오류 방지)
  // 일진상수는 음력 생월 초하루 일진 기준으로 자동 계산됨
  const birthYear = parseInt(birthDate.split('-')[0])
  const age = getKoreanAge(birthYear, targetYear)
  const gweResult = calculateTojeongGwe(targetYear, lunarBirth.month, lunarBirth.day, age)

  const birthYearJi = saju.yearPillar[1]
  const targetYearJi = getYearJi(targetYear)
  const samjae = getSamjae(birthYearJi, targetYearJi)

  const userPrompt = `${birthDate}생 사용자의 ${targetYear}년 토정비결을 풀이해주세요.

사주팔자:
- 년주: ${saju.yearPillar} (${saju.yearPillarHanja})
- 월주: ${saju.monthPillar} (${saju.monthPillarHanja})
- 일주: ${saju.dayPillar} (${saju.dayPillarHanja})${saju.hourPillar ? `\n- 시주: ${saju.hourPillar} (${saju.hourPillarHanja})` : ''}

음력 생년월일: ${lunarBirth.year}년 ${lunarBirth.month}월 ${lunarBirth.day}일
세는나이: ${age}세

[이미 계산된 괘 - 이 값을 그대로 사용하세요]
- 상괘(上卦): ${gweResult.upperGwe} (1~8 중 ${gweResult.upperGwe}번째 괘상)
- 중괘(中卦): ${gweResult.middleGwe} (1~6 중 ${gweResult.middleGwe}번째 괘상)
- 하괘(下卦): ${gweResult.lowerGwe} (1~3 중 ${gweResult.lowerGwe}번째 괘상)
- 괘 코드: ${gweResult.gweCode}

삼재(三災) 여부: ${samjae.isSamjae ? `${samjae.type} — ${samjae.description}` : '해당 없음'}

괘 이름 참고: ${getGweName(gweResult.upperGwe, gweResult.middleGwe, gweResult.lowerGwe)} (${getGweNameShort(gweResult.upperGwe, gweResult.middleGwe)})
gweNumber는 (상괘-1)*18 + (중괘-1)*3 + 하괘 = ${(gweResult.upperGwe - 1) * 18 + (gweResult.middleGwe - 1) * 3 + gweResult.lowerGwe}으로 설정하세요.
위 괘의 전통 토정비결 의미를 바탕으로 해석해주세요.
삼재에 해당하는 경우 yearFortune과 caution에 반드시 반영하세요.`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2500,
    system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: userPrompt }],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')

  let jsonText = content.text.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '')

  try {
    return JSON.parse(jsonText) as TojeongResponse
  } catch {
    console.error('[Tojeong] JSON parse failed:', jsonText.slice(0, 300))
    throw new Error('AI 응답 파싱 실패')
  }
}
