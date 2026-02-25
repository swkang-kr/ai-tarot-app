'use client'

import { motion } from 'framer-motion'
import type { PsychologyResponse } from '@/lib/ai/psychology-prompt'

interface PsychologyCardProps {
  analysis: PsychologyResponse
  birthDate: string
}

export default function PsychologyCard({ analysis, birthDate }: PsychologyCardProps) {
  return (
    <div className="space-y-4">
      {/* 헤더 - 심리 유형 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-violet-500/20 via-purple-500/15 to-fuchsia-500/10 border border-violet-500/20 rounded-2xl p-6 text-center"
      >
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          className="text-5xl mb-3"
        >
          {analysis.typeEmoji}
        </motion.div>
        <h3 className="text-white font-bold text-xl mb-1">{analysis.coreType}</h3>
        <p className="text-violet-300 text-xs mb-3">{birthDate} 생 · 사주 심리 유형</p>
        <p className="text-white/80 text-sm leading-relaxed">{analysis.summary}</p>
        <div className="flex justify-center gap-2 mt-3 flex-wrap">
          {analysis.keywords.map((kw, i) => (
            <span key={i} className="text-xs px-3 py-1 bg-violet-500/20 text-violet-200 rounded-full">
              {kw}
            </span>
          ))}
        </div>
      </motion.div>

      {/* 오늘의 심리 상태 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-r from-fuchsia-500/20 to-violet-500/20 border border-fuchsia-400/20 rounded-2xl p-5"
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">🌙</span>
          <p className="text-fuchsia-300 text-xs font-semibold">오늘의 심리 상태</p>
        </div>
        <p className="text-white/85 text-sm leading-relaxed">{analysis.todayMood}</p>
      </motion.div>

      {/* 강점 / 약점 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 gap-3"
      >
        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <span className="text-lg">✨</span>
            <h4 className="text-green-300 text-xs font-semibold">강점</h4>
          </div>
          <ul className="space-y-1.5">
            {analysis.strengths.map((s, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + i * 0.07 }}
                className="flex items-start gap-1.5 text-xs text-white/75 leading-relaxed"
              >
                <span className="text-green-400 mt-0.5 flex-shrink-0">▸</span>
                {s}
              </motion.li>
            ))}
          </ul>
        </div>

        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <span className="text-lg">🔍</span>
            <h4 className="text-red-300 text-xs font-semibold">약점</h4>
          </div>
          <ul className="space-y-1.5">
            {analysis.weaknesses.map((w, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + i * 0.07 }}
                className="flex items-start gap-1.5 text-xs text-white/75 leading-relaxed"
              >
                <span className="text-red-400 mt-0.5 flex-shrink-0">▸</span>
                {w}
              </motion.li>
            ))}
          </ul>
        </div>
      </motion.div>

      {/* 소통·스트레스·성장 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-3"
      >
        {[
          { icon: '💬', label: '소통 방식', text: analysis.communicationStyle, color: 'from-sky-500/15 border-sky-400/20' },
          { icon: '⚡', label: '스트레스 패턴', text: analysis.stressPattern, color: 'from-orange-500/15 border-orange-400/20' },
          { icon: '🌱', label: '성장 방향', text: analysis.growthDirection, color: 'from-emerald-500/15 border-emerald-400/20' },
        ].map(({ icon, label, text, color }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 + i * 0.08 }}
            className={`bg-gradient-to-br ${color} to-white/5 border rounded-2xl p-4`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{icon}</span>
              <h4 className="text-white/80 text-xs font-semibold">{label}</h4>
            </div>
            <p className="text-white/70 text-xs leading-relaxed">{text}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* 잘 맞는 유형 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="bg-white/10 backdrop-blur rounded-2xl p-5"
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">🤝</span>
          <h4 className="text-white font-semibold text-sm">잘 맞는 유형</h4>
        </div>
        <div className="flex gap-3">
          {analysis.compatibleTypes.map((type, i) => (
            <div
              key={i}
              className="flex-1 bg-violet-500/20 border border-violet-400/20 rounded-xl p-3 text-center"
            >
              <p className="text-violet-200 text-xs font-medium">{type}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
