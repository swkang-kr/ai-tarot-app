'use client'

import { motion } from 'framer-motion'
import { ScoreCircle, ScoreBar } from '@/components/ScoreChart'

interface CompatibilityScores {
  overall: number
  personality: number
  communication: number
  values: number
  growth: number
}

interface CompatibilityReading {
  scores: CompatibilityScores
  summary: string
  personality: string
  communication: string
  values: string
  advice: string
  bestAspect: string
  challengeAspect: string
}

interface CompatibilityCardProps {
  reading: CompatibilityReading
  relationshipType: string
}


const relationLabels: Record<string, string> = {
  lover: '연인',
  friend: '친구',
  colleague: '직장동료',
  family: '가족',
}

export default function CompatibilityCard({ reading, relationshipType }: CompatibilityCardProps) {
  const sections = [
    { icon: '😊', title: '성격 궁합', content: reading.personality, color: 'from-pink-500/20 to-rose-500/20', border: 'border-pink-500/20' },
    { icon: '💬', title: '소통 궁합', content: reading.communication, color: 'from-purple-500/20 to-indigo-500/20', border: 'border-purple-500/20' },
    { icon: '💎', title: '가치관 궁합', content: reading.values, color: 'from-amber-500/20 to-yellow-500/20', border: 'border-amber-500/20' },
  ]

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden">
      {/* 헤더 */}
      <div className="relative p-8 text-center bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-indigo-500/20">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative"
        >
          <div className="text-5xl mb-3">💕</div>
          <h2 className="text-xl font-bold text-white mb-1">
            {relationLabels[relationshipType] || '연인'} 궁합
          </h2>
          <p className="text-purple-200 text-sm">{reading.summary}</p>
        </motion.div>
      </div>

      {/* 종합 점수 + 카테고리 점수 */}
      <div className="mx-6 -mt-6 relative z-10">
        <div className="bg-white/5 backdrop-blur rounded-2xl p-5 border border-white/10">
          <div className="flex items-center gap-5">
            <div className="flex flex-col items-center shrink-0">
              <p className="text-xs text-purple-300 mb-1">종합 궁합</p>
              <ScoreCircle
                score={reading.scores.overall}
                size={120}
                strokeWidth={6}
                textClass="text-3xl"
                transitionDelay={0.8}
                colorScheme="pink"
              />
            </div>
            <div className="flex-1 space-y-2">
              <ScoreBar label="😊 성격" score={reading.scores.personality} color="#f472b6" delay={0.3} />
              <ScoreBar label="💬 소통" score={reading.scores.communication} color="#a78bfa" delay={0.4} />
              <ScoreBar label="💎 가치관" score={reading.scores.values} color="#fbbf24" delay={0.5} />
              <ScoreBar label="🌱 성장" score={reading.scores.growth} color="#34d399" delay={0.6} />
            </div>
          </div>
        </div>
      </div>

      {/* 분석 섹션 */}
      <div className="p-6 space-y-3">
        {sections.map((section, idx) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + idx * 0.1 }}
            className={`p-4 rounded-2xl bg-gradient-to-br ${section.color} border ${section.border}`}
          >
            <h3 className="text-sm font-bold text-white mb-1.5 flex items-center gap-1.5">
              <span>{section.icon}</span> {section.title}
            </h3>
            <p className="text-white/80 text-sm leading-relaxed">{section.content}</p>
          </motion.div>
        ))}

        {/* 장점 / 주의점 */}
        <div className="flex gap-3 pt-2">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex-1 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-center"
          >
            <p className="text-green-300 text-[10px] mb-1">최고의 장점</p>
            <p className="text-white text-xs leading-relaxed">{reading.bestAspect}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex-1 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center"
          >
            <p className="text-amber-300 text-[10px] mb-1">주의할 점</p>
            <p className="text-white text-xs leading-relaxed">{reading.challengeAspect}</p>
          </motion.div>
        </div>

        {/* 관계 개선 조언 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="bg-gradient-to-r from-purple-600/80 to-indigo-600/80 backdrop-blur rounded-2xl p-4 text-center border border-purple-400/20"
        >
          <p className="text-purple-200 text-xs mb-1">관계 개선 조언</p>
          <p className="text-white font-medium text-sm leading-relaxed">
            &ldquo;{reading.advice}&rdquo;
          </p>
        </motion.div>
      </div>
    </div>
  )
}
