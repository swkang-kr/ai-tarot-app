import { anthropic } from '@/lib/ai/client'
import type { SajuInfo } from '@/lib/utils/saju'

export interface CareerSajuResponse {
  aptitudeType: string           // 적성 유형 (예: "창조적 리더형 🦁")
  aptitudeEmoji: string          // 유형 이모지
  aptitudeSummary: string        // 2-3문장 유형 요약 (80-100자)
  recommendedFields: string[]    // 추천 직군 5개 (이모지 포함)
  strengthInWork: string         // 직장에서의 강점 (60-80자)
  workStyle: string              // 업무 스타일 (60-80자)
  bossCompatibility: string      // 잘 맞는 상사 유형 (40-60자)
  bestCareerPeriod: string       // 커리어 전성기 (나이대 포함, 40-60자)
  sideJobAdvice: string          // 부업·N잡 적성 (60-80자)
  avoidFields: string[]          // 피해야 할 직군 3개
  careerTimeline: {
    period: string               // 예: "20대 초반"
    theme: string                // 커리어 테마
    advice: string               // 조언 (30-40자)
    score: number                // 커리어 운 점수 0-100
  }[]
  keywords: string[]             // 이모지 포함 3개
}

const SYSTEM_PROMPT = `당신은 사주명리 직업·적성 전문가입니다. 사주팔자의 일간(日干) 오행, 용신(喜神), 격국(格局)을 기반으로 직업 적성을 분석합니다.

다음 JSON 형식으로만 응답하세요 (마크다운 코드 블록 없이):

{
  "aptitudeType": "창조적 리더형 🦁",
  "aptitudeEmoji": "🦁",
  "aptitudeSummary": "적성 유형 2-3문장 요약 (80-100자). 일간 오행과 격국에 기반.",
  "recommendedFields": [
    "🎨 크리에이티브 · 디자인",
    "💡 기획 · 마케팅",
    "🏗️ 건축 · 엔지니어링",
    "🎓 교육 · 강의",
    "🚀 창업 · 스타트업"
  ],
  "strengthInWork": "직장에서의 핵심 강점 (60-80자). 구체적 역량 명시.",
  "workStyle": "업무 스타일 묘사 (60-80자). 혼자 vs 팀, 빠름 vs 꼼꼼 등.",
  "bossCompatibility": "잘 맞는 상사 특성 (40-60자)",
  "bestCareerPeriod": "커리어 전성기 나이대 (40-60자). 예: '35-45세, 목 대운과 겹치는 시기'",
  "sideJobAdvice": "부업·N잡 적성 조언 (60-80자). 구체적 분야 포함.",
  "avoidFields": [
    "❌ 피해야 할 분야 1",
    "❌ 피해야 할 분야 2",
    "❌ 피해야 할 분야 3"
  ],
  "careerTimeline": [
    { "period": "20대 초반", "theme": "탐색과 실험", "advice": "다양한 경험 쌓기", "score": 60 },
    { "period": "20대 후반", "theme": "전문성 구축", "advice": "핵심 역량 집중", "score": 72 },
    { "period": "30대 초반", "theme": "도약 준비", "advice": "인맥과 기회 확장", "score": 80 },
    { "period": "30대 후반", "theme": "전성기 진입", "advice": "리더십 발휘", "score": 90 },
    { "period": "40대", "theme": "정점과 안정", "advice": "후진 양성 + 확장", "score": 85 },
    { "period": "50대+", "theme": "결실과 전수", "advice": "경험의 가치화", "score": 75 }
  ],
  "keywords": ["🔥 열정형", "💡 혁신가", "🌊 유연성"]
}

중요:
- recommendedFields 정확히 5개 (이모지 포함)
- avoidFields 정확히 3개
- careerTimeline 정확히 6개
- score 0-100 정수
- 일간 오행(木/火/土/金/水)과 격국 원리에 기반한 구체적 분석`

export async function generateCareerSaju(
  birthDate: string,
  saju: SajuInfo
): Promise<CareerSajuResponse> {
  const userPrompt = `${birthDate}생 사용자의 사주 기반 직업·적성 분석을 해주세요.

사주팔자:
- 년주: ${saju.yearPillar} (${saju.yearPillarHanja})
- 월주: ${saju.monthPillar} (${saju.monthPillarHanja})
- 일주: ${saju.dayPillar} (${saju.dayPillarHanja})${saju.hourPillar ? `\n- 시주: ${saju.hourPillar} (${saju.hourPillarHanja})` : ''}

일간(日干) ${saju.dayPillar[0]}의 오행적 특성, 월지(月支)의 격국, 용신(喜神) 오행을 종합하여
적성 유형 · 추천 직군 · 업무 스타일 · 커리어 타임라인을 분석해주세요.
부업 적성과 피해야 할 분야도 포함해주세요.`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2500,
    system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: userPrompt }],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')

  const jsonText = content.text.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '')

  try {
    return JSON.parse(jsonText) as CareerSajuResponse
  } catch {
    console.error('[CareerSaju] JSON parse failed:', jsonText.slice(0, 300))
    throw new Error('AI 응답 파싱 실패')
  }
}
