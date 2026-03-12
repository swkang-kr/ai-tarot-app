import { anthropic } from '@/lib/ai/client'
import type { SajuInfo, SajuDetailedAnalysis } from '@/lib/utils/saju'
import { getYongshin } from '@/lib/utils/saju'

export interface PsychologyResponse {
  coreType: string           // 심리 유형명 (예: "불꽃 개척형")
  typeEmoji: string          // 유형 이모지
  summary: string            // 2-3문장 요약
  strengths: string[]        // 강점 3개
  weaknesses: string[]       // 약점 3개
  communicationStyle: string // 소통 방식
  stressPattern: string      // 스트레스 패턴
  growthDirection: string    // 성장 방향
  compatibleTypes: string[]  // 잘 맞는 유형 2개
  todayMood: string          // 오늘의 심리 상태
  keywords: string[]         // 키워드 태그
}

const SYSTEM_PROMPT = `당신은 사주명리학과 심리학을 결합한 성격 분석 전문가입니다. 사주 원국의 격국(格局)·용신(喜神)·일간 오행을 기반으로 이 사람의 심리 유형과 성격을 심층 분석해주세요.

격국(格局)은 월지(月支)의 지장간 본기와 천간의 관계로 결정됩니다:
- 정관격·편관격: 관직운, 규범, 리더십 성향
- 정인격·편인격: 학문운, 보수적 또는 창의적 성향
- 식신격·상관격: 표현욕, 창의성, 비판적 사고
- 정재격·편재격: 현실감각, 재물운
- 비겁격: 독립심, 경쟁심

분석 시 격국에서 드러나는 심리 특성을 중심으로 설명하세요. MBTI 용어 대신 사주 명리학 고유의 표현을 사용하세요.

다음 JSON 형식으로만 응답해주세요 (마크다운 코드 블록 없이):

{
  "coreType": "심리 유형명 (예: 불꽃 개척형, 물처럼 유연한 조화형, 바위처럼 단단한 수호형 등 창의적 유형명 5-10자)",
  "typeEmoji": "유형을 대표하는 이모지 1개",
  "summary": "이 유형의 핵심 특성 요약 (2-3문장, 80-120자). 사주 일간의 오행에서 드러나는 근본적 성격.",
  "strengths": ["강점1 (20-30자)", "강점2 (20-30자)", "강점3 (20-30자)"],
  "weaknesses": ["약점1 (20-30자)", "약점2 (20-30자)", "약점3 (20-30자)"],
  "communicationStyle": "소통 방식 설명 (60-80자). 타인과 어떻게 소통하고 관계를 맺는지.",
  "stressPattern": "스트레스 패턴 설명 (60-80자). 어떤 상황에서 스트레스를 받고 어떻게 반응하는지.",
  "growthDirection": "성장 방향 (60-80자). 이 유형이 더 성장하기 위해 집중해야 할 방향.",
  "compatibleTypes": ["잘 맞는 유형1 (10-15자)", "잘 맞는 유형2 (10-15자)"],
  "todayMood": "오늘의 심리 상태 (40-60자). 오늘 날짜의 일진과 사주 원국을 결합한 현재 심리 상태.",
  "keywords": ["이모지키워드1", "이모지키워드2", "이모지키워드3", "이모지키워드4"]
}

중요:
- coreType은 MBTI 유형이 아닌 사주 기반의 창의적 유형명
- strengths/weaknesses는 정확히 3개
- compatibleTypes는 정확히 2개
- keywords는 정확히 4개
- 오행(木火土金水)의 특성을 심리학적으로 해석`

export async function generatePsychologyReading(
  birthDate: string,
  today: string,
  saju: SajuInfo,
  detail: SajuDetailedAnalysis
): Promise<PsychologyResponse> {
  const yongshin = getYongshin(saju, detail)

  const sipseongList = detail.pillarsDetail
    .filter(p => p.sipseong)
    .map(p => `${p.label}: ${p.sipseong}(${p.sipiunsung || ''})`)
    .join(', ')

  const userPrompt = `${birthDate}생 사용자의 사주 심리 분석을 해주세요. 오늘 날짜는 ${today}입니다.

사주 원국:
- 년주: ${saju.yearPillar} (${saju.yearPillarHanja})
- 월주: ${saju.monthPillar} (${saju.monthPillarHanja})
- 일주: ${saju.dayPillar} (${saju.dayPillarHanja})${saju.hourPillar ? `\n- 시주: ${saju.hourPillar} (${saju.hourPillarHanja})` : ''}

[사주 심층 분석 (코드 계산값)]
- 일간: ${detail.dayMaster.name} (${detail.dayMaster.element}) — ${detail.dayMaster.trait}
- 신강/신약: ${detail.bodyStrength}
- 격국(格局): ${detail.geokguk}
- 강한 오행: ${detail.dominantElement} / 약한 오행: ${detail.weakElement}
- 십성·십이운성 구성: ${sipseongList || '없음'}
- 용신(用神): ${yongshin.yongshinFull} — ${yongshin.reason}
- 기신(忌神): ${yongshin.heukshin}
- 신살: ${detail.sinsal.length > 0 ? detail.sinsal.map(s => s.name).join(', ') : '없음'}

오행 균형 (지장간 포함):
${detail.elementBalanceWithJijanggan.map((e) => `- ${e.name}: ${e.count}개 ${e.emoji}`).join('\n')}

오행 관계: ${detail.relationships.join(', ')}

[심리 분석 핵심 기준]
- 격국이 심리 유형의 핵심: 관성격→통제·책임형, 식상격→표현·창의형, 재성격→현실·성취형, 인성격→수용·탐구형, 비겁격→독립·경쟁형
- 신강+관성 多: 자기 주도적이나 통제 욕구 강
- 신약+인성 多: 의존적이나 공감 능력 탁월
- 상관 有: 비판적 사고, 반항적 성향, 창의성
- 도화살: 매력적이나 감정 기복
- 역마살: 변화 추구, 안정보다 자유 선호

이 사주를 바탕으로 MBTI를 대체하는 사주 심리 유형을 분석해주세요.`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    system: [
      {
        type: 'text',
        text: SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' }
      }
    ],
    messages: [{ role: 'user', content: userPrompt }]
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')

  let jsonText = content.text.trim()
  jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '')

  try {
    const parsed = JSON.parse(jsonText)
    if (
      typeof parsed.coreType !== 'string' ||
      typeof parsed.typeEmoji !== 'string' ||
      typeof parsed.summary !== 'string' ||
      !Array.isArray(parsed.strengths) ||
      !Array.isArray(parsed.weaknesses) ||
      !Array.isArray(parsed.compatibleTypes) ||
      !Array.isArray(parsed.keywords) ||
      typeof parsed.communicationStyle !== 'string' ||
      typeof parsed.stressPattern !== 'string' ||
      typeof parsed.growthDirection !== 'string' ||
      typeof parsed.todayMood !== 'string'
    ) {
      throw new Error('AI 응답 구조가 올바르지 않습니다')
    }
    return parsed as PsychologyResponse
  } catch (e) {
    console.error('[Psychology] JSON parse failed. Raw:', jsonText.slice(0, 500))
    throw new Error('AI 응답 파싱 실패')
  }
}
