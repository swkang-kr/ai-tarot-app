'use client'

import { motion } from 'framer-motion'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts'
import type { CareerSajuResponse } from '@/lib/ai/career-saju-prompt'

interface CareerSajuCardProps {
  analysis: CareerSajuResponse
  birthDate: string
}

const TIMELINE_COLOR = (score: number) => {
  if (score >= 85) return '#4ade80'
  if (score >= 70) return '#60a5fa'
  if (score >= 55) return '#facc15'
  return '#f87171'
}

function TimelineTooltip({ active, payload }: any) {
  if (!active || !payload?.[0]) return null
  const d = payload[0].payload
  return (
    <div className="bg-[#1e1b4b] border border-blue-500/30 rounded-lg p-2 text-xs max-w-[140px]">
      <p className="text-blue-300 font-bold">{d.period}</p>
      <p className="text-white font-semibold">{d.theme}</p>
      <p className="text-white/60 mt-0.5">{d.advice}</p>
      <p className="text-blue-200 font-bold mt-0.5">{d.score}점</p>
    </div>
  )
}

export default function CareerSajuCard({ analysis, birthDate }: CareerSajuCardProps) {
  const timelineData = analysis.careerTimeline.map((t) => ({
    ...t,
    fill: TIMELINE_COLOR(t.score),
  }))

  return (
    <div className="space-y-4">
      {/* 헤더 — 적성 유형 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-blue-500/20 via-sky-500/15 to-cyan-500/10 border border-blue-500/20 rounded-2xl p-6 text-center"
      >
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
          className="text-5xl mb-2"
        >
          {analysis.aptitudeEmoji}
        </motion.div>
        <p className="text-blue-300 text-xs font-medium mb-1">사주 적성 유형</p>
        <h3 className="text-white font-bold text-xl mb-2">{analysis.aptitudeType}</h3>
        <p className="text-white/75 text-sm leading-relaxed mb-3">{analysis.aptitudeSummary}</p>
        <div className="flex justify-center gap-2 flex-wrap">
          {analysis.keywords.map((kw, i) => (
            <span key={i} className="text-xs px-3 py-1 bg-blue-500/20 text-blue-200 rounded-full">
              {kw}
            </span>
          ))}
        </div>
      </motion.div>

      {/* 추천 직군 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/10 backdrop-blur rounded-2xl p-5"
      >
        <h4 className="text-white font-semibold text-sm mb-3">✅ 추천 직군 TOP 5</h4>
        <div className="space-y-2">
          {analysis.recommendedFields.map((field, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.07 }}
              className="flex items-center gap-3 p-2.5 bg-blue-500/10 border border-blue-500/15 rounded-xl"
            >
              <span className="text-blue-300 text-xs font-bold w-5 text-center">{i + 1}</span>
              <span className="text-white/80 text-sm">{field}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* 업무 특성 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="space-y-2"
      >
        {[
          { icon: '💪', label: '직장에서의 강점', content: analysis.strengthInWork, color: 'border-green-500/20 bg-green-500/10' },
          { icon: '🎯', label: '업무 스타일', content: analysis.workStyle, color: 'border-sky-500/20 bg-sky-500/10' },
          { icon: '👔', label: '잘 맞는 상사 유형', content: analysis.bossCompatibility, color: 'border-purple-500/20 bg-purple-500/10' },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.08 }}
            className={`p-4 rounded-xl border ${item.color}`}
          >
            <p className="text-white/50 text-xs font-medium mb-1">{item.icon} {item.label}</p>
            <p className="text-white/80 text-sm leading-relaxed">{item.content}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* 커리어 전성기 + 부업 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-2 gap-3"
      >
        <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/15 border border-amber-400/20 rounded-2xl p-4 text-center">
          <p className="text-amber-300 text-[10px] font-medium mb-1">⭐ 커리어 전성기</p>
          <p className="text-white font-semibold text-sm leading-snug">{analysis.bestCareerPeriod}</p>
        </div>
        <div className="bg-gradient-to-br from-teal-500/20 to-cyan-500/15 border border-teal-400/20 rounded-2xl p-4 text-center">
          <p className="text-teal-300 text-[10px] font-medium mb-1">💼 부업·N잡 적성</p>
          <p className="text-white/80 text-xs leading-snug">{analysis.sideJobAdvice}</p>
        </div>
      </motion.div>

      {/* 커리어 타임라인 차트 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white/10 backdrop-blur rounded-2xl p-5"
      >
        <h4 className="text-white font-semibold text-sm mb-4">커리어 타임라인</h4>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={timelineData} barCategoryGap="20%">
              <XAxis dataKey="period" tick={{ fill: '#93c5fd', fontSize: 8 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: '#93c5fd', fontSize: 9 }} axisLine={false} tickLine={false} width={20} />
              <Tooltip content={<TimelineTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
              <ReferenceLine y={70} stroke="#ffffff15" strokeDasharray="3 3" />
              <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                {timelineData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* 피해야 할 분야 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.75 }}
        className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4"
      >
        <p className="text-red-300 text-xs font-medium mb-2">⚠️ 피해야 할 분야</p>
        <div className="space-y-1.5">
          {analysis.avoidFields.map((f, i) => (
            <p key={i} className="text-white/70 text-xs">{f}</p>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
