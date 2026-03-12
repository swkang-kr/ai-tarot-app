import { anthropic } from '@/lib/ai/client'
import type { SajuInfo } from '@/lib/utils/saju'
import { getDetailedAnalysis, getYongshin } from '@/lib/utils/saju'

export interface WealthSajuResponse {
  wealthType: string             // 재물 유형 (예: "흘러들어오는 수형 💧")
  wealthEmoji: string            // 유형 이모지
  wealthSummary: string          // 재물 유형 요약 (80-100자)
  overallWealthScore: number     // 종합 재물운 점수 0-100
  incomePattern: string          // 수입 패턴 설명 (60-80자)
  investmentStyle: string        // 투자 스타일 (60-80자)
  wealthPeakAge: string          // 재물 전성기 나이 (예: "42-52세")
  luckyAsset: string             // 행운의 자산 유형 (예: "부동산 🏠, 예금 💰")
  cautionPoints: string          // 재물 주의사항 (60-80자)
  monthlyWealthFlow: {
    month: number
    score: number
    tip: string                  // 이달의 재물 팁 (20-30자)
  }[]
  wealthTimeline: {
    period: string               // 예: "30대"
    score: number
    theme: string                // 재물 테마
    advice: string               // 30-40자
  }[]
  savingAdvice: string           // 저축·절약 조언 (50-70자)
  keywords: string[]             // 이모지 포함 3개
}

const SYSTEM_PROMPT = `당신은 사주명리 재물운 전문가입니다. 사주팔자의 재성(財星), 식상(食傷), 일간 오행을 분석하여 재물 패턴을 풀이합니다.

다음 JSON 형식으로만 응답하세요 (마크다운 코드 블록 없이):

{
  "wealthType": "흘러들어오는 수형 💧",
  "wealthEmoji": "💧",
  "wealthSummary": "재물 유형 요약 (80-100자). 재성과 식상의 작용 설명.",
  "overallWealthScore": 75,
  "incomePattern": "수입이 들어오는 패턴 (60-80자). 정기적 vs 불규칙, 노동 vs 투자 등.",
  "investmentStyle": "적합한 투자 성향 (60-80자). 단기 vs 장기, 안전 vs 공격 등.",
  "wealthPeakAge": "42-52세 — 금 대운과 재성 합(合) 시기",
  "luckyAsset": "🏠 부동산 · 💰 적금 — 안정 자산이 유리",
  "cautionPoints": "재물 주의사항 (60-80자). 투기 경고, 보증 위험 등 구체적으로.",
  "monthlyWealthFlow": [
    { "month": 1, "score": 68, "tip": "지출 자제, 저축 집중" },
    { "month": 2, "score": 72, "tip": "소규모 투자 검토" },
    { "month": 3, "score": 85, "tip": "수입 증대 기회" },
    { "month": 4, "score": 60, "tip": "예상치 못한 지출" },
    { "month": 5, "score": 80, "tip": "재테크 행동 개시" },
    { "month": 6, "score": 65, "tip": "보수적 운용을" },
    { "month": 7, "score": 78, "tip": "새 수입원 탐색" },
    { "month": 8, "score": 90, "tip": "최고 재물운 달" },
    { "month": 9, "score": 62, "tip": "충동 구매 주의" },
    { "month": 10, "score": 74, "tip": "연말 자산 점검" },
    { "month": 11, "score": 82, "tip": "보너스·성과 기대" },
    { "month": 12, "score": 70, "tip": "내년 재무 계획" }
  ],
  "wealthTimeline": [
    { "period": "20대", "score": 55, "theme": "씨앗 심기", "advice": "종잣돈 마련 집중" },
    { "period": "30대", "score": 70, "theme": "성장 투자", "advice": "포트폴리오 구축" },
    { "period": "40대", "score": 88, "theme": "전성기", "advice": "핵심 자산 집중 확보" },
    { "period": "50대", "score": 80, "theme": "수확기", "advice": "리스크 줄이며 관리" },
    { "period": "60대+", "score": 72, "theme": "안정기", "advice": "현금 흐름 우선" }
  ],
  "savingAdvice": "이 사주의 재물을 지키는 저축·절약 조언 (50-70자)",
  "keywords": ["💰 재물형", "📈 투자형", "🔄 순환형"]
}

중요:
- monthlyWealthFlow 정확히 12개
- wealthTimeline 정확히 5개
- score 0-100 정수
- 재성(財星)·식상(食傷)·비겁(比劫) 원리 반영
- 구체적이고 실용적인 재테크 조언 포함`

export async function generateWealthSaju(
  birthDate: string,
  saju: SajuInfo
): Promise<WealthSajuResponse> {
  const detail = getDetailedAnalysis(saju)
  const yongshin = getYongshin(saju, detail)

  // 십성별 분포 집계 (재성/식상/비겁/관성/인성)
  const sipseongCounts: Record<string, string[]> = {}
  for (const p of detail.pillarsDetail) {
    if (!p.sipseong) continue
    const base = p.sipseong.replace('편', '').replace('정', '') // 대분류
    const key = p.sipseong
    if (!sipseongCounts[key]) sipseongCounts[key] = []
    sipseongCounts[key].push(p.label)
  }
  const sipseongSummary = Object.entries(sipseongCounts)
    .map(([k, v]) => `${k}(${v.join('·')})`)
    .join(', ')

  const userPrompt = `${birthDate}생 사용자의 사주 기반 재물운 심층 분석을 해주세요.

사주팔자:
- 년주: ${saju.yearPillar} (${saju.yearPillarHanja})
- 월주: ${saju.monthPillar} (${saju.monthPillarHanja})
- 일주: ${saju.dayPillar} (${saju.dayPillarHanja})${saju.hourPillar ? `\n- 시주: ${saju.hourPillar} (${saju.hourPillarHanja})` : ''}

[사주 심층 분석 (코드 계산값 — 반드시 사용)]
- 일간: ${detail.dayMaster.name} (${detail.dayMaster.element})
- 신강/신약: ${detail.bodyStrength}
- 격국(格局): ${detail.geokguk}
- 강한 오행: ${detail.dominantElement} / 약한 오행: ${detail.weakElement}
- 십성 구성: ${sipseongSummary || '없음'}
- 용신(用神): ${yongshin.yongshinFull} — ${yongshin.reason}
- 기신(忌神): ${yongshin.heukshin}

[재물운 판단 기준]
- 재성(정재·편재) 多 + 신강 → 재물 풍부, 큰 자산 가능
- 재성 多 + 신약 → 재물 탐하나 지키기 어려움, 과로 위험
- 식상(식신·상관) 多 → 재물 생성 능력 강, 창업·기술직 유리
- 비겁(비견·겁재) 多 → 재물 경쟁·분산, 투자 주의
- 재성 無 + 신약 → 재물 희박, 절약 필수
- 용신이 재성 오행이면 재운 강, 기신이 재성 오행이면 재물 손실 위험
- 격국이 재성격이면 재물 수완이 탁월

위 계산값을 바탕으로 재물 유형 · 수입 패턴 · 투자 스타일 · 12개월 재물 흐름을 분석해주세요.`

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
    return JSON.parse(jsonText) as WealthSajuResponse
  } catch {
    console.error('[WealthSaju] JSON parse failed:', jsonText.slice(0, 300))
    throw new Error('AI 응답 파싱 실패')
  }
}
