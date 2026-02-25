import { anthropic } from '@/lib/ai/client'
import { ClaudeResponse } from '@/types'
import type { SajuInfo } from '@/lib/utils/saju'
import { getElement, getDayMasterTrait } from '@/lib/utils/saju'

interface SelectedCard {
  id: string
  name: string
  nameEn: string
  symbol: string
}

const SYSTEM_PROMPT = `당신은 20년 경력의 전문 타로 리더이자 사주팔자 전문가입니다. 사용자의 오늘 운세를 감성적이고 공감되는 톤으로, 구체적이고 실용적인 조언과 함께 생성해주세요.

다음 JSON 형식으로만 응답해주세요 (마크다운 코드 블록 없이):

{
  "keywords": ["이모지포함 키워드1", "이모지포함 키워드2", "이모지포함 키워드3"],
  "scores": {
    "overall": 75,
    "love": 80,
    "wealth": 65,
    "health": 70,
    "career": 85
  },
  "overall": "전체운 (80-120자). 오늘 하루의 전반적인 흐름과 에너지를 구체적으로 설명.",
  "love": "애정운 (80-120자). 현재 연애 중인 사람과 솔로 모두에게 해당되는 조언. 구체적인 행동 가이드 포함.",
  "wealth": "재물운 (80-120자). 수입, 지출, 투자 관점에서 구체적 조언. 오늘 특히 조심하거나 기회가 될 부분 명시.",
  "health": "건강운 (60-80자). 오늘 특히 주의할 신체 부위나 컨디션, 추천 활동.",
  "career": "직장/학업운 (80-120자). 업무나 공부에서의 흐름, 대인관계 조언, 중요한 결정 타이밍.",
  "timeOfDay": {
    "morning": "오전 운세 (40-60자). 아침부터 점심까지의 흐름과 조언.",
    "afternoon": "오후 운세 (40-60자). 점심부터 저녁까지의 흐름과 조언.",
    "evening": "저녁 운세 (40-60자). 저녁 이후의 흐름과 조언."
  },
  "luckyItems": {
    "color": "#667eea",
    "colorName": "라벤더 블루",
    "number": 7,
    "food": "행운의 음식 (예: 따뜻한 우동)",
    "direction": "행운의 방위 (예: 남동쪽)",
    "activity": "추천 활동 (예: 산책, 독서)"
  },
  "warning": "오늘의 주의사항 (40-60자). 피해야 할 행동이나 주의할 상황을 구체적으로.",
  "advice": "오늘의 한마디 (40-60자). 하루를 관통하는 핵심 메시지. 따뜻하고 힘이 되는 격려 한 마디.",
  "sajuAnalysis": "사주팔자 심층 분석 (150-200자). 오행 균형 상태, 일간과 오늘 기운의 상호작용, 부족한 오행 보완법을 구체적으로 조언."
}

중요:
- keywords는 이모지와 짧은 단어 조합 (예: "✨ 행운", "💫 변화", "🌸 만남")
- scores는 각 운세 카테고리 점수, 0-100 정수. 사주와 타로 카드를 종합하여 현실적으로 산출
- timeOfDay는 시간대별 운세. 각 시간대에 맞는 구체적 조언
- luckyItems.color는 HEX 코드, colorName은 한글 색상명
- luckyItems.number는 1-99 사이
- luckyItems.food는 오늘 행운을 부르는 음식
- luckyItems.direction은 동/서/남/북/남동/남서/북동/북서 중 하나
- luckyItems.activity는 오늘 하면 좋은 활동
- warning은 오늘 특히 주의해야 할 사항. 구체적 상황/행동 언급
- 모든 운세 내용은 구체적이고 실용적이며 오늘 바로 적용할 수 있는 조언 포함
- 추상적 표현 대신 구체적 행동/상황을 묘사 (예: "오후 3시경 뜻밖의 연락" 식)
- sajuAnalysis는 사주팔자 정보가 있을 때:
  1) 오행의 강약과 균형 상태를 설명
  2) 일간의 특성이 오늘 날짜의 기운과 어떻게 상호작용하는지 분석
  3) 부족한 오행을 보완하는 구체적인 조언 (색상, 방위, 활동 등)
  4) 사주 정보가 없으면 빈 문자열로 작성
- advice는 독자의 마음에 울림을 주는 한 마디`

export async function generateTarotReading(
  birthDate: string,
  selectedCards?: SelectedCard[],
  saju?: SajuInfo
): Promise<ClaudeResponse> {
  const todayKST = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().split('T')[0]
  let userPrompt = `${birthDate}생 사용자의 오늘(${todayKST}) 운세를 생성해주세요.`

  if (saju) {
    const dayElement = getElement(saju.dayPillar)
    const dayTrait = getDayMasterTrait(saju.dayPillar)
    userPrompt += `

사주팔자 정보:
- 년주: ${saju.yearPillar} (${saju.yearPillarHanja})
- 월주: ${saju.monthPillar} (${saju.monthPillarHanja})
- 일주: ${saju.dayPillar} (${saju.dayPillarHanja})${saju.hourPillar ? `\n- 시주: ${saju.hourPillar} (${saju.hourPillarHanja})` : ''}
- 일간 오행: ${dayElement}
- 일간 성향: ${dayTrait}
- 음력: ${saju.lunarYear}년 ${saju.isLeapMonth ? '윤' : ''}${saju.lunarMonth}월 ${saju.lunarDay}일

사주팔자의 오행 균형과 일간 특성을 깊이 분석하여 운세에 반영해주세요.`
  }

  if (selectedCards && selectedCards.length === 3) {
    userPrompt += `

사용자가 직접 선택한 타로 카드 3장:
1번 카드 (과거/현재): ${selectedCards[0].symbol} ${selectedCards[0].name} (${selectedCards[0].nameEn})
2번 카드 (도전/과제): ${selectedCards[1].symbol} ${selectedCards[1].name} (${selectedCards[1].nameEn})
3번 카드 (미래/조언): ${selectedCards[2].symbol} ${selectedCards[2].name} (${selectedCards[2].nameEn})

이 3장의 카드 의미를 반영하여 운세를 해석해주세요. 각 카드의 상징과 의미가 전체운, 애정운, 재물운, 건강운, 직장/학업운에 자연스럽게 녹아들도록 해주세요.`
  }

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 2500,
    system: [
      {
        type: 'text',
        text: SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' }
      }
    ],
    messages: [
      {
        role: 'user',
        content: userPrompt
      }
    ]
  })

  const content = message.content[0]
  if (content.type !== 'text') {
    throw new Error('Unexpected response type')
  }

  console.log(
    `[Claude] Cache: read=${message.usage.cache_read_input_tokens ?? 0}, creation=${message.usage.cache_creation_input_tokens ?? 0}, input=${message.usage.input_tokens}`
  )

  let jsonText = content.text.trim()
  jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '')

  try {
    const response: ClaudeResponse = JSON.parse(jsonText)
    return response
  } catch (e) {
    console.error('[Claude] JSON parse failed. Raw response:', jsonText.slice(0, 500))
    throw new Error('AI 응답 파싱 실패')
  }
}
