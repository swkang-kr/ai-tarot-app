// 바이오리듬 계산 유틸리티
// 공식: sin(2π × 생일로부터_경과일 / 주기) × 100

export interface BiorhythmScores {
  physical: number    // 신체 (-100 ~ 100)
  emotional: number   // 감성 (-100 ~ 100)
  intellectual: number // 지성 (-100 ~ 100)
}

export interface BiorhythmDataPoint {
  day: number         // 오늘 기준 offset (-15 ~ +14)
  date: string        // YYYY-MM-DD
  label: string       // 날짜 표시 (예: "2/20")
  physical: number
  emotional: number
  intellectual: number
  isToday: boolean
}

const CYCLE = {
  physical: 23,
  emotional: 28,
  intellectual: 33,
}

function getDaysDiff(birthDate: Date, targetDate: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24
  const birth = Date.UTC(birthDate.getFullYear(), birthDate.getMonth(), birthDate.getDate())
  const target = Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate())
  return Math.floor((target - birth) / msPerDay)
}

function calcValue(days: number, cycle: number): number {
  return Math.round(Math.sin((2 * Math.PI * days) / cycle) * 100)
}

export function calculateBiorhythmToday(birthDate: Date, today: Date = new Date()): BiorhythmScores {
  const days = getDaysDiff(birthDate, today)
  return {
    physical: calcValue(days, CYCLE.physical),
    emotional: calcValue(days, CYCLE.emotional),
    intellectual: calcValue(days, CYCLE.intellectual),
  }
}

export function calculateBiorhythmChart(birthDate: Date, today: Date = new Date()): BiorhythmDataPoint[] {
  const points: BiorhythmDataPoint[] = []
  const todayUTC = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())

  for (let offset = -15; offset <= 14; offset++) {
    const targetMs = todayUTC + offset * 24 * 60 * 60 * 1000
    const targetDate = new Date(targetMs)
    const days = getDaysDiff(birthDate, targetDate)
    const month = targetDate.getUTCMonth() + 1
    const day = targetDate.getUTCDate()

    points.push({
      day: offset,
      date: targetDate.toISOString().split('T')[0],
      label: `${month}/${day}`,
      physical: calcValue(days, CYCLE.physical),
      emotional: calcValue(days, CYCLE.emotional),
      intellectual: calcValue(days, CYCLE.intellectual),
      isToday: offset === 0,
    })
  }
  return points
}

export function getBiorhythmStatus(score: number): { text: string; color: string } {
  if (score >= 70) return { text: '최고조', color: '#4ade80' }
  if (score >= 30) return { text: '상승', color: '#60a5fa' }
  if (score >= -30) return { text: '안정', color: '#a78bfa' }
  if (score >= -70) return { text: '하강', color: '#fb923c' }
  return { text: '저조', color: '#f87171' }
}
