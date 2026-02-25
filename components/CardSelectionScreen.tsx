'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SelectableCard from './SelectableCard'
import type { TarotCard } from '@/lib/data/tarot-cards'
import { getRandomCards } from '@/lib/data/tarot-cards'

const MAX_SELECTION = 3
const CARD_COUNT = 7
const REVEAL_INTERVAL = 800

interface CardSelectionScreenProps {
  onComplete: (cards: TarotCard[]) => void
  onBack: () => void
}

export default function CardSelectionScreen({
  onComplete,
  onBack,
}: CardSelectionScreenProps) {
  const [cards] = useState<TarotCard[]>(() => getRandomCards(CARD_COUNT))
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [phase, setPhase] = useState<'selecting' | 'revealing' | 'done'>(
    'selecting'
  )
  const [revealedCount, setRevealedCount] = useState(0)

  const handleCardClick = useCallback(
    (cardId: string) => {
      if (phase !== 'selecting') return

      setSelectedIds((prev) => {
        if (prev.includes(cardId)) {
          return prev.filter((id) => id !== cardId)
        }
        if (prev.length >= MAX_SELECTION) return prev
        return [...prev, cardId]
      })
    },
    [phase]
  )

  const handleReveal = useCallback(() => {
    if (selectedIds.length !== MAX_SELECTION) return
    setPhase('revealing')
  }, [selectedIds])

  // Reveal animation sequence
  useEffect(() => {
    if (phase !== 'revealing') return

    if (revealedCount < MAX_SELECTION) {
      const timer = setTimeout(() => {
        setRevealedCount((c) => c + 1)
      }, REVEAL_INTERVAL)
      return () => clearTimeout(timer)
    }

    // All revealed → done
    const doneTimer = setTimeout(() => {
      setPhase('done')
    }, 1000)
    return () => clearTimeout(doneTimer)
  }, [phase, revealedCount])

  // Done → callback
  useEffect(() => {
    if (phase !== 'done') return
    const selected = selectedIds.map(
      (id) => cards.find((c) => c.id === id)!
    )
    onComplete(selected)
  }, [phase, selectedIds, cards, onComplete])

  const selectedCards = selectedIds.map((id) => cards.find((c) => c.id === id)!)
  const isRevealing = phase === 'revealing' || phase === 'done'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full"
    >
      <div className="text-center mb-6">
        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold text-white mb-2"
        >
          {phase === 'selecting' ? '카드를 선택하세요' : '카드를 공개합니다'}
        </motion.h2>
        <p className="text-purple-200 text-sm">
          {phase === 'selecting'
            ? `${selectedIds.length}/${MAX_SELECTION}장 선택됨`
            : `${revealedCount}/${MAX_SELECTION}장 공개됨`}
        </p>
      </div>

      {/* Card display area */}
      <div className="flex justify-center mb-8">
        {!isRevealing ? (
          /* Fan layout during selection */
          <div className="relative h-[200px] sm:h-[220px] w-full flex items-end justify-center">
            {cards.map((card, i) => {
              const totalCards = cards.length
              const middleIndex = (totalCards - 1) / 2
              const offset = i - middleIndex
              const angle = offset * 6
              const translateY = Math.abs(offset) * 8

              return (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, type: 'spring', stiffness: 300 }}
                  style={{
                    transform: `rotate(${angle}deg) translateY(${translateY}px)`,
                    marginLeft: i === 0 ? 0 : -20,
                    zIndex: selectedIds.includes(card.id) ? 20 : i,
                  }}
                >
                  <SelectableCard
                    card={card}
                    isSelected={selectedIds.includes(card.id)}
                    selectionOrder={
                      selectedIds.includes(card.id)
                        ? selectedIds.indexOf(card.id) + 1
                        : null
                    }
                    isRevealed={false}
                    isHidden={false}
                    onClick={() => handleCardClick(card.id)}
                  />
                </motion.div>
              )
            })}
          </div>
        ) : (
          /* Center layout during reveal */
          <div className="flex items-center justify-center gap-3 sm:gap-4 h-[200px] sm:h-[220px]">
            <AnimatePresence>
              {selectedCards.map((card, i) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.15 }}
                >
                  <SelectableCard
                    card={card}
                    isSelected={true}
                    selectionOrder={i + 1}
                    isRevealed={i < revealedCount}
                    isHidden={false}
                    onClick={() => {}}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Action buttons */}
      {phase === 'selecting' && (
        <div className="flex flex-col gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleReveal}
            disabled={selectedIds.length !== MAX_SELECTION}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-xl font-semibold text-lg shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {selectedIds.length === MAX_SELECTION
              ? '✨ 카드 공개하기'
              : `카드를 ${MAX_SELECTION - selectedIds.length}장 더 선택하세요`}
          </motion.button>
          <button
            onClick={onBack}
            className="text-purple-300 text-sm hover:text-white transition"
          >
            ← 돌아가기
          </button>
        </div>
      )}

      {/* Reveal phase labels */}
      {isRevealing && revealedCount > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center gap-3 sm:gap-4 mt-2"
        >
          {['과거/현재', '도전', '미래'].slice(0, revealedCount).map((label, i) => (
            <motion.span
              key={label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-xs text-purple-300 w-[100px] sm:w-[110px] text-center"
            >
              {label}
            </motion.span>
          ))}
        </motion.div>
      )}
    </motion.div>
  )
}
