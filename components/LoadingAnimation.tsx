'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'

const loadingMessages = [
  '✨ 카드를 섞고 있어요...',
  '🔮 별들의 배열을 읽고 있어요...',
  '🌙 운명의 실타래를 풀고 있어요...',
  '💫 신비로운 메시지를 받고 있어요...',
  '🎴 당신만의 이미지를 그리고 있어요...'
]

export default function LoadingAnimation() {
  const [messageIndex, setMessageIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length)
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <motion.div
        className="relative w-40 h-56 mb-8"
        animate={{
          rotateY: [0, 180, 360],
          scale: [1, 1.1, 1]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-2xl flex items-center justify-center">
          <span className="text-6xl">🃏</span>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.p
          key={messageIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="text-white text-xl font-medium text-center"
        >
          {loadingMessages[messageIndex]}
        </motion.p>
      </AnimatePresence>

      <div className="w-64 h-2 bg-white/10 rounded-full mt-8 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{
            duration: 10,
            ease: 'easeInOut'
          }}
        />
      </div>
    </div>
  )
}
