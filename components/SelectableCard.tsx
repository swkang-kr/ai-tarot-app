'use client'

import { motion } from 'framer-motion'
import type { TarotCard } from '@/lib/data/tarot-cards'

interface SelectableCardProps {
  card: TarotCard
  isSelected: boolean
  selectionOrder: number | null
  isRevealed: boolean
  isHidden: boolean
  onClick: () => void
}

export default function SelectableCard({
  card,
  isSelected,
  selectionOrder,
  isRevealed,
  isHidden,
  onClick,
}: SelectableCardProps) {
  if (isHidden) {
    return (
      <motion.div
        initial={{ opacity: 1, scale: 1 }}
        animate={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.4 }}
        className="w-[100px] h-[150px] sm:w-[110px] sm:h-[165px]"
      />
    )
  }

  return (
    <motion.div
      whileHover={!isRevealed ? { y: -12, scale: 1.05 } : undefined}
      whileTap={!isRevealed ? { scale: 0.95 } : undefined}
      onClick={onClick}
      className={`relative w-[100px] h-[150px] sm:w-[110px] sm:h-[165px] cursor-pointer select-none ${
        isSelected && !isRevealed ? 'card-selected-glow' : ''
      }`}
      style={{ perspective: 800 }}
    >
      <motion.div
        animate={{ rotateY: isRevealed ? 180 : 0 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 200, damping: 20 }}
        className="relative w-full h-full"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Back */}
        <div
          className="absolute inset-0 rounded-xl card-back-pattern border-2 flex items-center justify-center backface-hidden"
          style={{
            backfaceVisibility: 'hidden',
            borderColor: isSelected
              ? 'rgba(250, 204, 21, 0.8)'
              : 'rgba(255, 255, 255, 0.2)',
          }}
        >
          <span className="text-3xl opacity-60">✦</span>

          {/* Selection order badge */}
          {selectionOrder !== null && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-2 -right-2 w-7 h-7 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center text-sm font-bold text-purple-900 shadow-lg z-10"
            >
              {selectionOrder}
            </motion.div>
          )}
        </div>

        {/* Front */}
        <div
          className="absolute inset-0 rounded-xl border-2 border-yellow-400/80 bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 flex flex-col items-center justify-center gap-2 backface-hidden"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <div className="absolute inset-[3px] rounded-lg border border-yellow-500/30" />
          <span className="text-4xl">{card.symbol}</span>
          <span className="text-white text-xs font-medium text-center px-2">
            {card.name}
          </span>
        </div>
      </motion.div>
    </motion.div>
  )
}
