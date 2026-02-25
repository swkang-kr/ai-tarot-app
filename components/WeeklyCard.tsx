'use client'

import { motion } from 'framer-motion'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'

interface DayFortune {
  day: string
  date: string
  score: number
  summary: string
}

interface WeeklyReading {
  weekSummary: string
  days: DayFortune[]
  bestDay: string
  worstDay: string
  weeklyAdvice: string
  keywords: string[]
}

interface WeeklyCardProps {
  reading: WeeklyReading
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.[0]) return null
  const data = payload[0].payload
  return (
    <div className="bg-[#1e1b4b] border border-purple-500/30 rounded-lg p-2 text-xs">
      <p className="text-purple-300 font-medium">{data.day}요일</p>
      <p className="text-white font-bold">{data.score}점</p>
    </div>
  )
}

export default function WeeklyCard({ reading }: WeeklyCardProps) {
  const chartData = reading.days.map((d) => ({
    day: d.day,
    score: d.score,
    date: d.date,
  }))

  const avgScore = reading.days.length > 0
    ? Math.round(reading.days.reduce((sum, d) => sum + d.score, 0) / reading.days.length)
    : 0

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden">
      {/* 헤더 */}
      <div className="relative p-8 text-center bg-gradient-to-br from-blue-500/20 via-indigo-500/20 to-purple-500/20">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative"
        >
          <div className="text-5xl mb-3">📅</div>
          <h2 className="text-xl font-bold text-white mb-2">이번 주 운세</h2>
          <div className="flex gap-2 justify-center flex-wrap">
            {reading.keywords.map((keyword, idx) => (
              <motion.span
                key={idx}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + idx * 0.1 }}
                className="px-3 py-1 bg-white/15 backdrop-blur-sm text-white rounded-full text-xs font-medium border border-white/20"
              >
                {keyword}
              </motion.span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* 주간 요약 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mx-6 -mt-4 relative z-10"
      >
        <div className="bg-gradient-to-r from-purple-600/80 to-indigo-600/80 backdrop-blur rounded-2xl p-4 text-center border border-purple-400/20 shadow-lg">
          <p className="text-white text-sm leading-relaxed">{reading.weekSummary}</p>
        </div>
      </motion.div>

      {/* 차트 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mx-6 mt-4"
      >
        <div className="bg-white/5 backdrop-blur rounded-2xl p-4 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>📊</span> 요일별 운세 점수
            </h3>
            <span className="text-xs text-purple-300">평균 {avgScore}점</span>
          </div>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <XAxis
                  dataKey="day"
                  tick={{ fill: '#c4b5fd', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: '#c4b5fd', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={avgScore} stroke="#a78bfa33" strokeDasharray="3 3" />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#a78bfa"
                  strokeWidth={2.5}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props
                    const isBest = payload.day === reading.bestDay
                    const isWorst = payload.day === reading.worstDay
                    return (
                      <circle
                        key={payload.day}
                        cx={cx}
                        cy={cy}
                        r={isBest || isWorst ? 6 : 4}
                        fill={isBest ? '#34d399' : isWorst ? '#f87171' : '#a78bfa'}
                        stroke="#1e1b4b"
                        strokeWidth={2}
                      />
                    )
                  }}
                  activeDot={{ r: 6, fill: '#a78bfa', stroke: '#fff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            <span className="text-[10px] text-green-300 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> 최고: {reading.bestDay}요일
            </span>
            <span className="text-[10px] text-red-300 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> 주의: {reading.worstDay}요일
            </span>
          </div>
        </div>
      </motion.div>

      {/* 요일별 한줄 운세 */}
      <div className="p-6 space-y-2">
        {reading.days.map((day, idx) => {
          const isBest = day.day === reading.bestDay
          const isWorst = day.day === reading.worstDay

          return (
            <motion.div
              key={day.day}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + idx * 0.05 }}
              className={`flex items-center gap-3 p-3 rounded-xl ${
                isBest
                  ? 'bg-green-500/10 border border-green-500/20'
                  : isWorst
                  ? 'bg-red-500/10 border border-red-500/20'
                  : 'bg-white/5'
              }`}
            >
              <div className="w-10 text-center shrink-0">
                <p className="text-xs text-purple-300">{day.day}</p>
                <p className={`text-lg font-bold ${
                  isBest ? 'text-green-400' : isWorst ? 'text-red-400' : 'text-white'
                }`}>
                  {day.score}
                </p>
              </div>
              <p className="text-white/80 text-sm flex-1">{day.summary}</p>
              {isBest && <span className="text-green-400 text-xs shrink-0">Best</span>}
              {isWorst && <span className="text-red-400 text-xs shrink-0">주의</span>}
            </motion.div>
          )
        })}

        {/* 주간 조언 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="bg-gradient-to-r from-purple-600/80 to-indigo-600/80 backdrop-blur rounded-2xl p-4 text-center border border-purple-400/20 mt-4"
        >
          <p className="text-purple-200 text-xs mb-1">이번 주 조언</p>
          <p className="text-white font-medium text-sm leading-relaxed">
            &ldquo;{reading.weeklyAdvice}&rdquo;
          </p>
        </motion.div>
      </div>
    </div>
  )
}
