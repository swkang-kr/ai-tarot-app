'use client'

import { useState } from 'react'
import DreamCard from '@/components/DreamCard'
import LoadingAnimation from '@/components/LoadingAnimation'
import { motion, AnimatePresence } from 'framer-motion'
import type { DreamResponse } from '@/lib/ai/dream-prompt'
import { showInterstitial } from '@/lib/ads/admob'

const DREAM_CATEGORIES = [
  { value: '사람', label: '👤 사람' },
  { value: '동물', label: '🐾 동물' },
  { value: '장소', label: '🏠 장소' },
  { value: '상황', label: '🎭 상황' },
  { value: '자연', label: '🌿 자연' },
]

export default function DreamPage() {
  const [dreamContent, setDreamContent] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<DreamResponse | null>(null)
  const handleSubmit = async () => {
    if (dreamContent.trim().length < 10) {
      setError('꿈 내용을 10자 이상 입력해주세요')
      return
    }

    setError(null)
    setLoading(true)

    await showInterstitial()

    try {
      const response = await fetch('/api/dream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dreamContent: dreamContent.trim(),
          category: selectedCategory,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '꿈해몽에 실패했습니다')
      }

      const { reading } = await response.json()
      setResult(reading)
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4 py-8">
        <LoadingAnimation />
      </div>
    )
  }

  return (
    <div className="p-4 py-8">
      <div className="max-w-md mx-auto space-y-6">
        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl"
            >
              <div className="text-center mb-6">
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="text-5xl mb-3"
                >
                  💭
                </motion.div>
                <h1 className="text-2xl font-bold text-white mb-1">꿈해몽</h1>
                <p className="text-purple-200 text-sm">어젯밤 꿈을 이야기해주세요</p>
              </div>

              {/* 꿈 내용 입력 */}
              <div className="mb-4">
                <label className="block text-white mb-2 text-sm font-medium">꿈 내용</label>
                <textarea
                  value={dreamContent}
                  onChange={(e) => setDreamContent(e.target.value)}
                  placeholder="어젯밤 꾼 꿈을 자세히 적어주세요..."
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-white/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400 resize-none h-32"
                  maxLength={500}
                />
                <p className="text-right text-purple-300/60 text-xs mt-1">
                  {dreamContent.length}/500
                </p>
              </div>

              {/* 카테고리 태그 */}
              <div className="mb-6">
                <label className="block text-white mb-2 text-sm font-medium">
                  카테고리 <span className="text-purple-400 font-normal">(선택)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {DREAM_CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() =>
                        setSelectedCategory(selectedCategory === cat.value ? null : cat.value)
                      }
                      className={`px-3 py-1.5 rounded-full text-sm transition ${
                        selectedCategory === cat.value
                          ? 'bg-purple-500/30 border border-purple-400/50 text-white'
                          : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm"
                >
                  {error}
                </motion.div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={dreamContent.trim().length < 10}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-4 rounded-xl font-semibold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                💭 꿈 해석하기
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <DreamCard reading={result} />

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-6 text-center"
              >
                <button
                  onClick={() => {
                    setResult(null)
                    setDreamContent('')
                    setSelectedCategory(null)
                  }}
                  className="inline-block px-8 py-3 bg-white/10 backdrop-blur text-white rounded-xl hover:bg-white/20 transition"
                >
                  💭 다른 꿈 해석하기
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
