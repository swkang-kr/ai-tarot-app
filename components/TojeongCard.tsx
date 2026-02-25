'use client'

import { motion } from 'framer-motion'
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from 'recharts'
import type { TojeongResponse } from '@/lib/ai/tojeong-prompt'

interface TojeongCardProps {
  analysis: TojeongResponse
  targetYear: number
}

const QUARTER_LABELS: Record<number, { season: string; emoji: string; color: string }> = {
  1: { season: '봄', emoji: '🌸', color: 'from-pink-500/20 border-pink-400/30' },
  2: { season: '여름', emoji: '☀️', color: 'from-orange-500/20 border-orange-400/30' },
  3: { season: '가을', emoji: '🍂', color: 'from-amber-500/20 border-amber-400/30' },
  4: { season: '겨울', emoji: '❄️', color: 'from-sky-500/20 border-sky-400/30' },
}

function ScoreArc({ score, color }: { score: number; color: string }) {
  const r = 18
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" className="transform -rotate-90">
      <circle cx="22" cy="22" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
      <motion.circle
        cx="22" cy="22" r={r}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - dash }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
      <text
        x="22" y="22"
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-white font-bold"
        style={{ fontSize: 9, transform: 'rotate(90deg)', transformOrigin: '22px 22px' }}
      >
        {score}
      </text>
    </svg>
  )
}

const ADVICE_ITEMS = [
  { key: 'loveAdvice' as const, icon: '❤️', label: '인연운', color: '#f472b6' },
  { key: 'wealthAdvice' as const, icon: '💰', label: '재물운', color: '#fbbf24' },
  { key: 'healthAdvice' as const, icon: '🌿', label: '건강운', color: '#4ade80' },
  { key: 'caution' as const, icon: '⚠️', label: '주의사항', color: '#f87171' },
]

export default function TojeongCard({ analysis, targetYear }: TojeongCardProps) {
  const radarData = analysis.quarterFortune.map((q) => ({
    subject: `${q.q}분기`,
    score: q.score,
  }))

  return (
    <div className="space-y-4">
      {/* 괘 헤더 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-orange-500/20 via-amber-500/15 to-yellow-500/10 border border-orange-500/20 rounded-2xl p-6 text-center"
      >
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          className="text-5xl mb-2"
        >
          {analysis.gweEmoji}
        </motion.div>
        <p className="text-orange-300 text-xs font-medium mb-1">제 {analysis.gweNumber}괘</p>
        <h3 className="text-white font-bold text-xl mb-1">{analysis.gwe}</h3>
        <p className="text-amber-200/70 text-sm mb-3">{analysis.gweDescription}</p>
        <p className="text-white/80 text-sm leading-relaxed">{analysis.yearFortune}</p>
        <div className="flex justify-center gap-2 mt-3 flex-wrap">
          {analysis.keywords.map((kw, i) => (
            <span key={i} className="text-xs px-3 py-1 bg-orange-500/20 text-orange-200 rounded-full">
              {kw}
            </span>
          ))}
        </div>
      </motion.div>

      {/* 분기별 운세 + 레이더 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/10 backdrop-blur rounded-2xl p-5"
      >
        <h4 className="text-white font-semibold text-sm mb-4">분기별 운세</h4>
        <div className="flex gap-4 items-start">
          {/* 분기 카드 */}
          <div className="flex-1 space-y-2">
            {analysis.quarterFortune.map((q, i) => {
              const meta = QUARTER_LABELS[q.q]
              return (
                <motion.div
                  key={q.q}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.08 }}
                  className={`bg-gradient-to-r ${meta.color} to-white/5 border rounded-xl p-3 flex items-start gap-3`}
                >
                  <ScoreArc score={q.score} color={i < 2 ? '#fb923c' : '#f59e0b'} />
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-sm">{meta.emoji}</span>
                      <span className="text-white font-semibold text-xs">{q.theme}</span>
                    </div>
                    <p className="text-white/60 text-[10px] leading-relaxed">{q.fortune}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* 레이더 차트 */}
          <div className="w-28 h-28 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#fdba74', fontSize: 8 }} />
                <Radar
                  dataKey="score"
                  stroke="#f97316"
                  fill="#f97316"
                  fillOpacity={0.25}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* 분야별 조언 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-2"
      >
        {ADVICE_ITEMS.map((item, i) => (
          <motion.div
            key={item.key}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.45 + i * 0.08 }}
            className="bg-white/5 border border-white/10 rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-base">{item.icon}</span>
              <span className="text-white/60 text-xs font-medium">{item.label}</span>
            </div>
            <p className="text-white/80 text-sm leading-relaxed">{analysis[item.key]}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* 핵심 메시지 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-400/20 rounded-2xl p-5 text-center"
      >
        <p className="text-orange-300 text-xs font-medium mb-2">
          {analysis.gweEmoji} {targetYear}년 토정비결 요약
        </p>
        <p className="text-white text-sm leading-relaxed font-medium">
          {analysis.gwe} — {analysis.gweDescription}
        </p>
      </motion.div>
    </div>
  )
}
