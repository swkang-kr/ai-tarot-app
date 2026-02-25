'use client'

import { motion } from 'framer-motion'

type ColorScheme = 'purple' | 'pink'

const colorMaps: Record<ColorScheme, (s: number) => string> = {
  purple: (s) => (s >= 80 ? '#a78bfa' : s >= 60 ? '#818cf8' : s >= 40 ? '#60a5fa' : '#f472b6'),
  pink: (s) => (s >= 80 ? '#f472b6' : s >= 60 ? '#a78bfa' : s >= 40 ? '#60a5fa' : '#94a3b8'),
}

interface ScoreCircleProps {
  score: number
  size?: number
  strokeWidth?: number
  textClass?: string
  transitionDelay?: number
  colorScheme?: ColorScheme
}

export function ScoreCircle({
  score,
  size = 100,
  strokeWidth = 5,
  textClass = 'text-2xl',
  transitionDelay = 0.5,
  colorScheme = 'purple',
}: ScoreCircleProps) {
  const radius = (size - strokeWidth * 2) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = colorMaps[colorScheme](score)

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className={`${textClass} font-bold text-white`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: transitionDelay }}
        >
          {score}
        </motion.span>
        <span className="text-xs text-purple-300">점</span>
      </div>
    </div>
  )
}

interface ScoreBarProps {
  label: string
  score: number
  color: string
  delay: number
}

export function ScoreBar({ label, score, color, delay }: ScoreBarProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-white/70 w-14 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, delay, ease: 'easeOut' }}
        />
      </div>
      <span className="text-xs text-white/70 w-8 text-right">{score}</span>
    </div>
  )
}
