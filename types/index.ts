export interface TarotReading {
  id: string
  userId: string
  birthDate: string
  keywords: string[]
  overall: string
  love: string
  wealth: string
  health?: string
  career?: string
  luckyColor: string
  luckyNumber: number
  advice?: string
  imageUrl?: string | null
  shareCount: number
  viewCount: number
  generationTimeMs?: number
  aiModelVersion?: string
  createdAt: string
}

export interface Share {
  id: string
  readingId: string
  userId: string
  platform: 'instagram' | 'kakao' | 'facebook' | 'twitter' | 'link'
  createdAt: string
}

export interface ClaudeResponse {
  keywords: string[]
  scores: {
    overall: number    // 0-100
    love: number
    wealth: number
    health: number
    career: number
  }
  overall: string
  love: string
  wealth: string
  health: string
  career: string
  timeOfDay: {
    morning: string    // 오전 운세
    afternoon: string  // 오후 운세
    evening: string    // 저녁 운세
  }
  luckyItems: {
    color: string      // HEX 코드
    colorName: string  // 한글 색상명
    number: number
    food: string       // 행운의 음식
    direction: string  // 행운의 방위
    activity: string   // 추천 활동
  }
  warning: string      // 오늘의 주의사항
  advice: string
  sajuAnalysis: string
}
