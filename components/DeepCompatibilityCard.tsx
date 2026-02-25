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
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
} from 'recharts'
import { ScoreCircle, ScoreBar } from '@/components/ScoreChart'
import type { DeepCompatibilityResponse } from '@/lib/ai/deep-compatibility-prompt'

interface DeepCompatibilityCardProps {
  reading: DeepCompatibilityResponse
  relationshipType: string
}

const MONTH_NAMES = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']

const RELATION_EMOJI: Record<string, string> = {
  lover: '💕', spouse: '💍', friend: '🤝', business: '💼', colleague: '💼',
}

function MonthTooltip({ active, payload }: any) {
  if (!active || !payload?.[0]) return null
  const d = payload[0].payload
  return (
    <div className="bg-[#1e1b4b] border border-pink-500/30 rounded-lg p-2 text-xs max-w-[140px]">
      <p className="text-pink-300 font-bold">{MONTH_NAMES[d.month - 1]}</p>
      <p className="text-white font-bold">{d.score}점</p>
      <p className="text-white/60 mt-0.5">{d.theme}</p>
    </div>
  )
}

export default function DeepCompatibilityCard({ reading, relationshipType }: DeepCompatibilityCardProps) {
  const emoji = RELATION_EMOJI[relationshipType] ?? '💕'
  const currentMonth = new Date().getMonth() + 1

  const chartData = reading.monthlyCompatibility.map((m) => ({
    ...m,
    name: `${m.month}`,
    fill: m.month === currentMonth ? '#f472b6' : '#9333ea',
  }))

  const radarData = [
    { subject: '성격', score: reading.scores.personality },
    { subject: '소통', score: reading.scores.communication },
    { subject: '가치관', score: reading.scores.values },
    { subject: '성장', score: reading.scores.growth },
    { subject: '신체', score: reading.scores.physical },
    { subject: '장기', score: reading.scores.longterm },
  ]

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-pink-500/20 via-purple-500/15 to-indigo-500/10 border border-pink-500/20 rounded-2xl p-6 text-center"
      >
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          className="text-4xl mb-2"
        >
          {emoji}
        </motion.div>
        <p className="text-pink-300 text-xs font-medium mb-1">{reading.relationshipType} 심층 궁합</p>
        <p className="text-white/80 text-sm leading-relaxed mb-3">{reading.summary}</p>
        <div className="flex justify-center gap-2 mt-2 flex-wrap">
          {reading.keywords.map((kw, i) => (
            <span key={i} className="text-xs px-3 py-1 bg-pink-500/20 text-pink-200 rounded-full">
              {kw}
            </span>
          ))}
        </div>
      </motion.div>

      {/* 점수 — 원형 + 레이더 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/10 backdrop-blur rounded-2xl p-5"
      >
        <h4 className="text-white font-semibold text-sm mb-4">궁합 점수 분석</h4>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center flex-shrink-0">
            <p className="text-pink-300 text-[10px] mb-1">종합 궁합</p>
            <ScoreCircle
              score={reading.scores.overall}
              size={110}
              strokeWidth={6}
              textClass="text-2xl"
              transitionDelay={0.3}
              colorScheme="pink"
            />
          </div>
          <div className="flex-1 h-36">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#f9a8d4', fontSize: 9 }} />
                <Radar dataKey="score" stroke="#ec4899" fill="#ec4899" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="mt-3 space-y-1.5">
          <ScoreBar label="😊 성격" score={reading.scores.personality} color="#f472b6" delay={0.3} />
          <ScoreBar label="💬 소통" score={reading.scores.communication} color="#a78bfa" delay={0.35} />
          <ScoreBar label="💎 가치관" score={reading.scores.values} color="#fbbf24" delay={0.4} />
          <ScoreBar label="🌱 성장" score={reading.scores.growth} color="#34d399" delay={0.45} />
          <ScoreBar label="⚡ 에너지" score={reading.scores.physical} color="#f87171" delay={0.5} />
          <ScoreBar label="🕐 장기" score={reading.scores.longterm} color="#60a5fa" delay={0.55} />
        </div>
      </motion.div>

      {/* 오행 분석 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-400/20 rounded-2xl p-4"
      >
        <p className="text-purple-300 text-xs font-medium mb-1.5">☯️ 오행 관계 분석</p>
        <p className="text-white/80 text-sm leading-relaxed">{reading.fiveElementAnalysis}</p>
      </motion.div>

      {/* 조화 / 갈등 포인트 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-2 gap-3"
      >
        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4">
          <p className="text-green-300 text-xs font-medium mb-2">✨ 조화 포인트</p>
          <div className="space-y-1.5">
            {reading.harmonyPoints.map((p, i) => (
              <p key={i} className="text-white/70 text-[11px] leading-relaxed">• {p}</p>
            ))}
          </div>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
          <p className="text-red-300 text-xs font-medium mb-2">⚡ 갈등 포인트</p>
          <div className="space-y-1.5">
            {reading.conflictPoints.map((p, i) => (
              <p key={i} className="text-white/70 text-[11px] leading-relaxed">• {p}</p>
            ))}
          </div>
        </div>
      </motion.div>

      {/* 분석 섹션 */}
      {[
        { icon: '😊', title: '성격 궁합', content: reading.personality, color: 'from-pink-500/20 border-pink-500/20' },
        { icon: '💬', title: '소통 궁합', content: reading.communication, color: 'from-purple-500/20 border-purple-500/20' },
        { icon: '💎', title: '가치관 궁합', content: reading.values, color: 'from-amber-500/20 border-amber-500/20' },
      ].map((s, i) => (
        <motion.div
          key={s.title}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 + i * 0.08 }}
          className={`bg-gradient-to-br ${s.color} to-white/5 border rounded-2xl p-4`}
        >
          <p className="text-white/60 text-xs font-medium mb-1">{s.icon} {s.title}</p>
          <p className="text-white/80 text-sm leading-relaxed">{s.content}</p>
        </motion.div>
      ))}

      {/* 소통 팁 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white/5 border border-white/10 rounded-2xl p-4"
      >
        <p className="text-pink-300 text-xs font-medium mb-1.5">💡 소통 팁</p>
        <p className="text-white/80 text-sm leading-relaxed">{reading.communicationTips}</p>
      </motion.div>

      {/* 12개월 궁합 차트 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-white/10 backdrop-blur rounded-2xl p-5"
      >
        <h4 className="text-white font-semibold text-sm mb-4">12개월 궁합 흐름</h4>
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barCategoryGap="15%">
              <XAxis dataKey="name" tick={{ fill: '#f9a8d4', fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: '#f9a8d4', fontSize: 9 }} axisLine={false} tickLine={false} width={20} />
              <Tooltip content={<MonthTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
              <ReferenceLine y={70} stroke="#ffffff15" strokeDasharray="3 3" />
              <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* 장점 / 주의점 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="grid grid-cols-2 gap-3"
      >
        <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
          <p className="text-green-300 text-[10px] mb-1">최고의 장점</p>
          <p className="text-white text-xs leading-relaxed">{reading.bestAspect}</p>
        </div>
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
          <p className="text-amber-300 text-[10px] mb-1">주의할 점</p>
          <p className="text-white text-xs leading-relaxed">{reading.challengeAspect}</p>
        </div>
      </motion.div>

      {/* 5년 전망 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="bg-gradient-to-r from-purple-600/70 to-indigo-600/70 border border-purple-400/20 rounded-2xl p-5 text-center"
      >
        <p className="text-purple-200 text-xs mb-2">🔭 5년 후 전망</p>
        <p className="text-white font-medium text-sm leading-relaxed">&ldquo;{reading.fiveyearOutlook}&rdquo;</p>
      </motion.div>
    </div>
  )
}
