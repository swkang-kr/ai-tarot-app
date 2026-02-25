'use client'

import { motion } from 'framer-motion'

interface DreamReading {
  title: string
  traditionalMeaning: string
  psychologicalMeaning: string
  luckyIndex: number
  cautionIndex: number
  lottoNumbers: number[]
  keywords: string[]
  advice: string
  category: string
}

interface DreamCardProps {
  reading: DreamReading
}

function IndexBar({ label, value, color, icon }: { label: string; value: number; color: string; icon: string }) {
  return (
    <div className="flex-1">
      <div className="flex items-center gap-1 mb-1">
        <span className="text-sm">{icon}</span>
        <span className="text-xs text-white/70">{label}</span>
        <span className="text-xs font-bold text-white ml-auto">{value}</span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}

const categoryStyles: Record<string, { bg: string; emoji: string }> = {
  '길몽': { bg: 'bg-green-500/20', emoji: '🌟' },
  '흉몽': { bg: 'bg-red-500/20', emoji: '⚡' },
  '평몽': { bg: 'bg-blue-500/20', emoji: '☁️' },
  '태몽': { bg: 'bg-pink-500/20', emoji: '👶' },
  '예지몽': { bg: 'bg-purple-500/20', emoji: '🔮' },
}

export default function DreamCard({ reading }: DreamCardProps) {
  const catStyle = categoryStyles[reading.category] || { bg: 'bg-purple-500/20', emoji: '💭' }

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden">
      {/* 헤더 */}
      <div className="relative p-8 text-center bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-blue-500/20">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative"
        >
          <div className="text-5xl mb-3">💭</div>
          <h2 className="text-xl font-bold text-white mb-2">{reading.title}</h2>
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium text-white ${catStyle.bg}`}>
            {catStyle.emoji} {reading.category}
          </span>
        </motion.div>
      </div>

      {/* 키워드 */}
      <div className="flex gap-2 justify-center -mt-3 relative z-10 px-6">
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

      {/* 행운/주의 지수 */}
      <div className="mx-6 mt-4">
        <div className="bg-white/5 backdrop-blur rounded-2xl p-4 border border-white/10 flex gap-4">
          <IndexBar label="행운 지수" value={reading.luckyIndex} color="#34d399" icon="🍀" />
          <IndexBar label="주의 지수" value={reading.cautionIndex} color="#f87171" icon="⚡" />
        </div>
      </div>

      {/* 해몽 섹션 */}
      <div className="p-6 space-y-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/15 to-orange-500/15 border border-amber-500/20"
        >
          <h3 className="text-sm font-bold text-white mb-1.5 flex items-center gap-1.5">
            <span>📜</span> 전통 꿈해몽
          </h3>
          <p className="text-white/80 text-sm leading-relaxed">{reading.traditionalMeaning}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/15 to-cyan-500/15 border border-blue-500/20"
        >
          <h3 className="text-sm font-bold text-white mb-1.5 flex items-center gap-1.5">
            <span>🧠</span> 심리학적 해석
          </h3>
          <p className="text-white/80 text-sm leading-relaxed">{reading.psychologicalMeaning}</p>
        </motion.div>

        {/* 로또 번호 (재미) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center"
        >
          <p className="text-purple-300 text-xs mb-2">꿈에서 연상된 행운 번호</p>
          <div className="flex gap-2 justify-center">
            {reading.lottoNumbers.map((num, idx) => (
              <motion.div
                key={idx}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6 + idx * 0.1 }}
                className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center"
              >
                <span className="text-white text-sm font-bold">{num}</span>
              </motion.div>
            ))}
          </div>
          <p className="text-white/40 text-[10px] mt-2">* 재미로만 참고해주세요</p>
        </motion.div>

        {/* 조언 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="bg-gradient-to-r from-purple-600/80 to-indigo-600/80 backdrop-blur rounded-2xl p-4 text-center border border-purple-400/20"
        >
          <p className="text-white font-medium text-sm leading-relaxed">
            &ldquo;{reading.advice}&rdquo;
          </p>
        </motion.div>
      </div>
    </div>
  )
}
