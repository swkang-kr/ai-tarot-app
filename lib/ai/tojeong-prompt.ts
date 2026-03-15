import { anthropic } from '@/lib/ai/client'
import type { SajuInfo } from '@/lib/utils/saju'
import { getSamjae, getYearJi, getDetailedAnalysis, getYongshin } from '@/lib/utils/saju'
import { calculateTojeongGwe, getKoreanAge, getGweName, getGweNameShort } from '@/lib/utils/tojeong'

// 팔괘(八卦) 오행 매핑 — 상괘 번호 기준
// 건(乾/1)=金, 태(兌/2)=金, 이(離/3)=火, 진(震/4)=木, 손(巽/5)=木, 감(坎/6)=水, 간(艮/7)=土, 곤(坤/8)=土
const UPPER_GWE_ELEMENT: Record<number, string> = {
  1: '금', 2: '금', 3: '화', 4: '목', 5: '목', 6: '수', 7: '토', 8: '토',
}

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

// 상괘(上卦) 1~8번 — 팔괘(八卦) 대응
const UPPER_GWE_NAMES: Record<number, { hanja: string; name: string; symbol: string; nature: string }> = {
  1: { hanja: '乾', name: '건(乾)', symbol: '☰', nature: '하늘·강건·창조·부·지도자' },
  2: { hanja: '兌', name: '태(兌)', symbol: '☱', nature: '연못·기쁨·소통·구설·구변' },
  3: { hanja: '離', name: '이(離)', symbol: '☲', nature: '불·밝음·문명·명예·인재' },
  4: { hanja: '震', name: '진(震)', symbol: '☳', nature: '우레·진동·진취·갑작스런 변화' },
  5: { hanja: '巽', name: '손(巽)', symbol: '☴', nature: '바람·유순·침투·여행·무역' },
  6: { hanja: '坎', name: '감(坎)', symbol: '☵', nature: '물·위험·지혜·고난 후 성공' },
  7: { hanja: '艮', name: '간(艮)', symbol: '☶', nature: '산·멈춤·신중·단계적 성취' },
  8: { hanja: '坤', name: '곤(坤)', symbol: '☷', nature: '땅·포용·순응·조력·모성' },
}

// 중괘(中卦) 1~6 의미 — 월건 상수: 전개 방식·시기 흐름을 나타냄
const MIDDLE_GWE_MEANING: Record<number, string> = {
  1: '초기 기운이 강함 — 상반기에 에너지 집중, 서두름 주의',
  2: '점진적 성장 — 봄에서 여름으로 서서히 발전, 꾸준함이 핵심',
  3: '중반 전환점 — 여름 무렵 결정적 기회 또는 시련, 판단력 중요',
  4: '후반 주력 — 가을에 주요 사건 집중, 준비한 자가 수확',
  5: '연말 수렴 — 겨울로 에너지 모임, 내실 다지는 시기',
  6: '전 계절 균형 — 특정 시기 없이 고른 흐름, 일상적 꾸준함이 핵심',
}

// 하괘(下卦) 1~3 의미 — 일진 상수: 결말·결실의 기운을 나타냄
const LOWER_GWE_MEANING: Record<number, string> = {
  1: '완성과 성취 — 한 해의 노력이 결실로 이어지는 마무리, 긍정적 결말',
  2: '변화와 전환 — 한 해 끝에 새로운 방향 설정, 이별·시작의 기운',
  3: '보류와 준비 — 결말이 미완성, 다음 해를 위한 씨앗을 품고 마무리',
}

const SYSTEM_PROMPT = `당신은 토정비결(土亭秘訣) 전문가입니다. 토정 이지함(李之菡) 선생의 토정비결 원리에 따라 분석합니다.

토정비결은 태세(太歲)·월건(月建)·일진(日辰)의 상수(象數)로 144괘(卦)를 산출합니다.
상괘(1~8)는 팔괘(乾兌離震巽坎艮坤) 기반, 중괘(1~6)는 월건 상수, 하괘(1~3)는 일진 상수로 결정됩니다.

괘 해석 원칙:
- 상괘의 팔괘 성질이 전체 운세의 큰 틀을 결정합니다 (가장 강한 영향)
- 중괘는 그 해의 전개 방식과 시기적 흐름을 나타냅니다:
  · 1번(상반기 집중), 2번(점진 성장), 3번(중반 전환), 4번(후반 주력), 5번(연말 수렴), 6번(전 계절 균형)
- 하괘는 결말·마무리·결실의 기운을 나타냅니다:
  · 1번(완성·성취), 2번(변화·전환), 3번(보류·준비)
- 세 괘의 조합으로 전체 괘의 의미를 종합 해석하되, 상괘 성질을 중심으로 중·하괘 흐름을 덧입히세요

전통 토정비결 해석 문체:
- 한시(漢詩) 풍의 상징적 표현을 현대 한국어로 풀어 해석
- "봄에 씨앗을 뿌리면 가을에 수확하리라" 식의 비유적 표현 사용
- 구체적인 시기(상반기/하반기, 봄/여름/가을/겨울)별 흐름 명시
- 주의 사항과 길한 방위/색상/시기를 포함
- 삼재 연도에는 해당 괘의 위험·주의 요소를 강화하여 서술

다음 JSON 형식으로만 응답하세요 (마크다운 코드 블록 없이):

{
  "gwe": "천지비괘",
  "gweNumber": 42,
  "gweEmoji": "🌥️",
  "gweDescription": "하늘과 땅이 서로 막혀 소통이 어려운 시기 (30-50자)",
  "yearFortune": "올해 전체 운세 종합 (100-150자). 전통 토정비결 문체로 괘의 상징과 연결하여 구체적으로.",
  "quarterFortune": [
    { "q": 1, "theme": "봄의 시작", "fortune": "1~3월 운세 (40-60자)", "score": 72 },
    { "q": 2, "theme": "여름의 성장", "fortune": "4~6월 운세 (40-60자)", "score": 80 },
    { "q": 3, "theme": "가을의 결실", "fortune": "7~9월 운세 (40-60자)", "score": 68 },
    { "q": 4, "theme": "겨울의 준비", "fortune": "10~12월 운세 (40-60자)", "score": 75 }
  ],
  "loveAdvice": "올해 인연운 조언 (60-80자). 구체적인 길한 시기·방향 포함.",
  "wealthAdvice": "올해 재물운 조언 (60-80자). 이로운 직업·사업 방향 포함.",
  "healthAdvice": "올해 건강운 조언 (60-80자). 주의할 신체 부위·계절 포함.",
  "caution": "올해 가장 주의할 사항 (40-60자). 피해야 할 행동·방향 구체적으로.",
  "keywords": ["이모지 키워드1", "이모지 키워드2", "이모지 키워드3"]
}

중요:
- quarterFortune 정확히 4개
- score 0-100 정수
- 전통 토정비결 원리와 팔괘 상징에 기반하되 현대적 언어로 해석
- 괘 번호는 1-144 범위
- gweDescription은 상괘+중괘+하괘 조합의 전체 상(象)을 함축

[gweEmoji 선택 기준 — 상괘(上卦) 팔괘 기준]
- 건(乾/1) → ☀️ (하늘·태양·강건·창조)
- 태(兌/2) → 😊 (연못·기쁨·소통·구변)
- 이(離/3) → 🔥 (불·밝음·문명·명예)
- 진(震/4) → ⚡ (우레·진동·갑작스런 변화)
- 손(巽/5) → 🍃 (바람·유순·침투·여행)
- 감(坎/6) → 💧 (물·위험·고난·지혜)
- 간(艮/7) → ⛰️ (산·멈춤·신중·단계적 성취)
- 곤(坤/8) → 🌍 (땅·포용·순응·조력)
위 기준에서 상괘 번호에 맞는 이모지를 gweEmoji에 설정하세요.

[상괘별 quarterFortune 기본 점수 기준 — 삼재 보정 전 baseline]
- 건(乾/☰) 강건·창조의 기운: 전체 기본 75-85점 (활동적·도전적 운세)
- 태(兌/☱) 기쁨·소통의 기운: 전체 기본 70-80점 (관계·구설 혼재)
- 이(離/☲) 밝음·명예의 기운: 전체 기본 72-82점 (명예·재능 발휘)
- 진(震/☳) 변화·진동의 기운: 전체 기본 65-78점 (갑작스런 변화·도전 포함)
- 손(巽/☴) 유순·침투의 기운: 전체 기본 68-78점 (점진적 성과, 여행 유리)
- 감(坎/☵) 위험·고난의 기운: 전체 기본 55-68점 (어려움 후 지혜로 성공)
- 간(艮/☶) 멈춤·신중의 기운: 전체 기본 62-75점 (서두름 금물, 단계적 성취)
- 곤(坤/☷) 포용·순응의 기운: 전체 기본 65-75점 (조력자 운세, 수동적 안정)
위 baseline에 아래 중괘 분기별 조정과 하괘 마무리를 더해 각 분기 score를 산출하세요.

[중괘(中卦)별 분기(quarterFortune) score 조정]
- 중괘 1 (상반기 집중): Q1 +5, Q2 +3, Q3 -3, Q4 -5
- 중괘 2 (점진적 성장): Q1 +2, Q2 +5, Q3 +3, Q4 +0
- 중괘 3 (중반 전환점): Q1 -3, Q2 +5, Q3 +5, Q4 -3
- 중괘 4 (후반 주력):   Q1 -5, Q2 -3, Q3 +5, Q4 +3
- 중괘 5 (연말 수렴):   Q1 -3, Q2 -2, Q3 +2, Q4 +5
- 중괘 6 (전 계절 균형): Q1 0,  Q2 0,  Q3 0,  Q4 0  (편차 최소)
[하괘(下卦)별 마무리 보정]
- 하괘 1 (완성·성취): Q4 추가 +3
- 하괘 2 (변화·전환): Q4 추가 -2 (마무리 불안정, 새 시작 예고)
- 하괘 3 (보류·준비): Q4 추가 -3 (결말 미완, 다음 해로 이월)

[용신(用神)·기신(忌神) ↔ 상괘 오행 교차 보정]
- 팔괘 오행: 건/태=金, 이=火, 진/손=木, 감=水, 간/곤=土
- userPrompt에 용신오행·기신오행·상괘오행이 제공됩니다
- 상괘 오행 = 용신 오행이면 → quarterFortune 전체 score +6~8점 (수호 기운, 괘가 용신을 강화)
- 상괘 오행 = 기신 오행이면 → quarterFortune 전체 score -6~8점 (방해 기운, 괘가 기신 오행을 강화)
- 상괘 오행이 용신 오행을 상생(生)하면 → +3~5점
- 상괘 오행이 기신 오행을 상생(生)하면 → -3~5점
- 중립(관계 없음) → 보정 없음
- 이 보정을 yearFortune에 한 문장으로 명시하세요 (예: "상괘 건(金)이 용신 금(金)과 일치하여 한 해 전체에 귀인의 기운이 따릅니다")`

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

  const upperGweInfo = UPPER_GWE_NAMES[gweResult.upperGwe]
  const middleGweMeaning = MIDDLE_GWE_MEANING[gweResult.middleGwe] || '전개 방식 불명'
  const lowerGweMeaning = LOWER_GWE_MEANING[gweResult.lowerGwe] || '결말 불명'

  // 용신/기신 ↔ 상괘 오행 교차 계산
  const detail = getDetailedAnalysis(saju)
  const yongshinTJ = getYongshin(saju, detail)
  const upperGweElement = UPPER_GWE_ELEMENT[gweResult.upperGwe] || '불명'
  let yongshinGweNote = ''
  if (upperGweElement !== '불명') {
    if (upperGweElement === yongshinTJ.yongshin) {
      yongshinGweNote = `상괘 ${upperGweInfo?.name || ''}(${upperGweElement}) = 용신 오행(${yongshinTJ.yongshinFull}) 일치 → score +6~8점, yearFortune에 귀인 기운 명시`
    } else if (upperGweElement === yongshinTJ.heukshin) {
      yongshinGweNote = `상괘 ${upperGweInfo?.name || ''}(${upperGweElement}) = 기신 오행(${yongshinTJ.heukshin}) 일치 → score -6~8점, yearFortune에 장애 기운 명시`
    } else {
      // 오행 상생 체크 (상괘가 용신을 생하는가)
      const SANGSAENG_TJ: Record<string, string> = { '목': '화', '화': '토', '토': '금', '금': '수', '수': '목' }
      if (SANGSAENG_TJ[upperGweElement] === yongshinTJ.yongshin) {
        yongshinGweNote = `상괘 ${upperGweInfo?.name || ''}(${upperGweElement})가 용신 오행(${yongshinTJ.yongshinFull})을 상생 → score +3~5점`
      } else if (SANGSAENG_TJ[upperGweElement] === yongshinTJ.heukshin) {
        yongshinGweNote = `상괘 ${upperGweInfo?.name || ''}(${upperGweElement})가 기신 오행(${yongshinTJ.heukshin})을 상생 → score -3~5점`
      } else {
        yongshinGweNote = `상괘 ${upperGweInfo?.name || ''}(${upperGweElement})와 용신/기신 오행 중립 → score 보정 없음`
      }
    }
  }

  const userPrompt = `${birthDate}생 사용자의 ${targetYear}년 토정비결을 풀이해주세요.

사주팔자:
- 년주: ${saju.yearPillar} (${saju.yearPillarHanja})
- 월주: ${saju.monthPillar} (${saju.monthPillarHanja})
- 일주: ${saju.dayPillar} (${saju.dayPillarHanja})${saju.hourPillar ? `\n- 시주: ${saju.hourPillar} (${saju.hourPillarHanja})` : ''}

음력 생년월일: ${lunarBirth.year}년 ${lunarBirth.month}월 ${lunarBirth.day}일
세는나이: ${age}세

[이미 계산된 괘 - 이 값을 그대로 사용하세요]
- 상괘(上卦): ${gweResult.upperGwe}번 — ${upperGweInfo ? `${upperGweInfo.symbol} ${upperGweInfo.name} (${upperGweInfo.nature})` : '불명'}
- 중괘(中卦): ${gweResult.middleGwe}번 — ${middleGweMeaning}
- 하괘(下卦): ${gweResult.lowerGwe}번 — ${lowerGweMeaning}
- 괘 코드: ${gweResult.gweCode}

사주 용신/기신:
- 용신: ${yongshinTJ.yongshinFull} (${yongshinTJ.reason})
- 희신: ${yongshinTJ.heungshin}
- 기신: ${yongshinTJ.heukshin}
- 상괘 오행: ${upperGweElement}
[용신↔상괘 오행 교차 판정]: ${yongshinGweNote}

삼재(三災) 여부: ${samjae.isSamjae ? `${samjae.type} — ${samjae.description}` : '해당 없음'}${samjae.isSamjae ? `\n⚠️ 삼재 해당: yearFortune·caution에 삼재 종류(${samjae.type})를 명시하고, quarterFortune score를 -5~10점 하향하세요.` : ''}

괘 이름 참고: ${getGweName(gweResult.upperGwe, gweResult.middleGwe, gweResult.lowerGwe)} (${getGweNameShort(gweResult.upperGwe, gweResult.middleGwe)})
gweNumber는 (상괘-1)*18 + (중괘-1)*3 + 하괘 = ${(gweResult.upperGwe - 1) * 18 + (gweResult.middleGwe - 1) * 3 + gweResult.lowerGwe}으로 설정하세요.

위 괘의 팔괘 성질(상괘: ${upperGweInfo?.name || '불명'} — ${upperGweInfo?.nature || ''})을 큰 틀로,
중괘(${gweResult.middleGwe}번: ${middleGweMeaning})의 시기 흐름을 덧입혀,
하괘(${gweResult.lowerGwe}번: ${lowerGweMeaning})로 마무리를 완성하여 전통 토정비결 원리에 따라 풀이하세요.
quarterFortune의 theme과 score도 중괘 시기 흐름에 맞게 배분하세요.`

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
