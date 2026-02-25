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
import { ScoreCircle } from '@/components/ScoreChart'
import { getBiorhythmStatus, type BiorhythmDataPoint } from '@/lib/utils/biorhythm'

interface BiorhythmCardProps {
  physical: number
  emotional: number
  intellectual: number
  chartData: BiorhythmDataPoint[]
  birthDate: string
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1e1b4b] border border-purple-500/30 rounded-lg p-2 text-xs">
      <p className="text-purple-300 font-bold mb-1">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: p.stroke }} />
          <span className="text-white/70">{p.name}:</span>
          <span className="text-white font-semibold">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

const SCORES = [
  { key: 'physical' as const, label: '신체', emoji: '💪', color: '#f87171' },
  { key: 'emotional' as const, label: '감성', emoji: '💜', color: '#a78bfa' },
  { key: 'intellectual' as const, label: '지성', emoji: '🧠', color: '#60a5fa' },
]

export default function BiorhythmCard({
  physical,
  emotional,
  intellectual,
  chartData,
  birthDate,
}: BiorhythmCardProps) {
  const scores = { physical, emotional, intellectual }

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-indigo-500/20 via-purple-500/15 to-pink-500/10 border border-indigo-500/20 rounded-2xl p-6 text-center"
      >
        <div className="text-4xl mb-2">〰️</div>
        <h3 className="text-white font-bold text-lg mb-1">바이오리듬</h3>
        <p className="text-indigo-300 text-xs">{birthDate} 생 · 오늘의 생체 리듬</p>
      </motion.div>

      {/* 오늘 점수 3개 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-3"
      >
        {SCORES.map(({ key, label, emoji, color }, i) => {
          const score = scores[key]
          const normalized = Math.round((score + 100) / 2) // -100~+100 → 0~100
          const status = getBiorhythmStatus(score)
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 + i * 0.08 }}
              className="bg-white/10 backdrop-blur rounded-2xl p-4 flex flex-col items-center gap-2"
            >
              <span className="text-xl">{emoji}</span>
              <ScoreCircle
                score={normalized}
                size={72}
                strokeWidth={4}
                textClass="text-base"
                transitionDelay={0.3 + i * 0.1}
              />
              <p className="text-white/80 text-xs font-medium">{label}</p>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ color, backgroundColor: `${color}20` }}>
                {status.text}
              </span>
            </motion.div>
          )
        })}
      </motion.div>

      {/* 30일 LineChart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white/10 backdrop-blur rounded-2xl p-5"
      >
        <h4 className="text-white font-semibold text-sm mb-4">30일 바이오리듬 흐름</h4>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis
                dataKey="label"
                tick={{ fill: '#a78bfa', fontSize: 8 }}
                axisLine={false}
                tickLine={false}
                interval={4}
              />
              <YAxis
                domain={[-100, 100]}
                tick={{ fill: '#a78bfa', fontSize: 8 }}
                axisLine={false}
                tickLine={false}
                width={24}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" strokeDasharray="3 3" />
              {/* 오늘 세로선 */}
              {(() => {
                const todayPoint = chartData.find(d => d.isToday)
                return todayPoint ? (
                  <ReferenceLine
                    x={todayPoint.label}
                    stroke="rgba(255,255,255,0.3)"
                    strokeDasharray="4 2"
                    label={{ value: '오늘', position: 'top', fill: 'rgba(255,255,255,0.5)', fontSize: 9 }}
                  />
                ) : null
              })()}
              <Line
                type="monotone"
                dataKey="physical"
                name="신체"
                stroke="#f87171"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="emotional"
                name="감성"
                stroke="#a78bfa"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="intellectual"
                name="지성"
                stroke="#60a5fa"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {/* 범례 */}
        <div className="flex justify-center gap-4 mt-2">
          {SCORES.map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1 text-[10px] text-white/50">
              <span className="w-4 h-0.5 rounded inline-block" style={{ backgroundColor: color }} />
              {label}
            </div>
          ))}
        </div>
      </motion.div>

      {/* 내일 예고 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-400/20 rounded-2xl p-5"
      >
        <p className="text-indigo-300 text-xs font-medium mb-3">🔮 내일의 바이오리듬</p>
        <div className="grid grid-cols-3 gap-3">
          {SCORES.map(({ key, label, emoji, color }) => {
            const tomorrow = chartData.find(d => d.day === 1)
            if (!tomorrow) return null
            const tScore = tomorrow[key]
            const status = getBiorhythmStatus(tScore)
            return (
              <div key={key} className="text-center">
                <span className="text-base">{emoji}</span>
                <p className="text-white text-xs font-semibold mt-0.5">{label}</p>
                <p className="text-[11px] font-bold" style={{ color }}>
                  {tScore > 0 ? '+' : ''}{tScore}
                </p>
                <p className="text-[10px] text-white/50">{status.text}</p>
              </div>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}
