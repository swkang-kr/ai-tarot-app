'use client'

import { motion } from 'framer-motion'
import type { DailyJinjin } from '@/lib/utils/daily-jinjin'

interface DailyJinjinCardProps {
  data: DailyJinjin
}

const DIRECTION_ARROW: Record<string, string> = {
  '동쪽': '→',
  '서쪽': '←',
  '남쪽': '↓',
  '북쪽': '↑',
  '중앙': '✦',
}

export default function DailyJinjinCard({ data }: DailyJinjinCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/10 backdrop-blur-lg border border-white/15 rounded-2xl p-5"
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-white/40 text-[10px] uppercase tracking-wider mb-0.5">오늘의 일진</p>
          <p className="text-white font-bold text-base">{data.todayGanji}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{data.color.emoji}</span>
          <div className="text-right">
            <p className="text-white/50 text-[10px]">오행</p>
            <p className="text-white font-semibold text-sm">{data.todayElement}</p>
          </div>
        </div>
      </div>

      {/* 오늘의 메시지 */}
      <p className="text-white/70 text-xs leading-relaxed mb-4 border-l-2 pl-3" style={{ borderColor: data.color.hex }}>
        {data.dailyMessage}
      </p>

      {/* 행운 정보 그리드 */}
      <div className="grid grid-cols-3 gap-2">
        {[
          {
            icon: data.color.emoji,
            label: '행운 색',
            value: data.color.name,
            sub: '',
          },
          {
            icon: '🧭',
            label: '길한 방위',
            value: DIRECTION_ARROW[data.luckyDirection] ?? '→',
            sub: data.luckyDirection,
          },
          {
            icon: '⏰',
            label: '행운 시간',
            value: '',
            sub: data.luckyHour,
          },
        ].map(({ icon, label, value, sub }) => (
          <div
            key={label}
            className="bg-white/5 rounded-xl p-2.5 text-center"
          >
            <span className="text-xl">{icon}</span>
            <p className="text-white/40 text-[9px] mt-1 mb-0.5">{label}</p>
            {value && <p className="text-white font-bold text-sm">{value}</p>}
            {sub && <p className="text-white/60 text-[10px]">{sub}</p>}
          </div>
        ))}
      </div>

      {/* 피할 방위 */}
      <div className="mt-3 flex items-center gap-2 text-[10px] text-white/40">
        <span>⚠️</span>
        <span>오늘 피할 방위: <span className="text-red-400/80">{data.avoidDirection}</span></span>
        <span className="ml-auto text-white/30">{data.dateLabel}</span>
      </div>
    </motion.div>
  )
}
