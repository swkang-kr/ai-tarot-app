'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { FortunePost } from './FortunePostCard'
import { useBodyScrollLock } from '@/lib/hooks/useBodyScrollLock'

const KEYWORDS = ['사랑', '연애', '직업', '재물', '건강', '인연', '이사', '시험', '가족', '금전']

const FORTUNE_TYPES = [
  { value: 'tarot', label: '🔮 타로' },
  { value: 'saju', label: '🏯 사주' },
  { value: 'lucky', label: '🍀 행운' },
  { value: 'dream', label: '💭 꿈해몽' },
  { value: 'general', label: '🌙 운세' },
]

interface ShareFortuneModalProps {
  isOpen: boolean
  onClose: () => void
  // m2 수정: object → FortunePost 타입
  onSuccess: (post: FortunePost) => void
  initialContent?: string
  initialFortuneType?: string
}

export default function ShareFortuneModal({
  isOpen,
  onClose,
  onSuccess,
  initialContent = '',
  initialFortuneType = 'general',
}: ShareFortuneModalProps) {
  const [content, setContent] = useState(initialContent)
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([])
  const [fortuneType, setFortuneType] = useState(initialFortuneType)
  const [isAnonymous, setIsAnonymous] = useState(true)
  const [displayName, setDisplayName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  useBodyScrollLock(isOpen)

  const toggleKeyword = (kw: string) => {
    setSelectedKeywords((prev) =>
      prev.includes(kw) ? prev.filter((k) => k !== kw) : prev.length < 5 ? [...prev, kw] : prev
    )
  }

  const handleSubmit = async () => {
    if (!content.trim()) { setError('내용을 입력해주세요'); return }
    setError(null)
    setIsLoading(true)

    try {
      const res = await fetch('/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          keywords: selectedKeywords,
          fortuneType,
          isAnonymous,
          displayName: isAnonymous ? null : displayName.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      onSuccess(data.post)
      setContent('')
      setSelectedKeywords([])
      setFortuneType('general')
      setIsAnonymous(true)
      setDisplayName('')
    } catch (err) {
      setError(err instanceof Error ? err.message : '공유 중 오류가 발생했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-md max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-b from-indigo-900/98 to-purple-900/98 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden">
              <div className="p-6 space-y-5">
                {/* 헤더 */}
                <div className="flex items-center justify-between">
                  <h2 className="text-white font-bold text-lg">운세 공유하기</h2>
                  <button onClick={onClose} className="text-white/50 hover:text-white/80 transition text-xl w-8 h-8 flex items-center justify-center">✕</button>
                </div>

                {/* 운세 유형 */}
                <div>
                  <p className="text-white/60 text-xs mb-2">어떤 운세인가요?</p>
                  <div className="flex flex-wrap gap-2">
                    {FORTUNE_TYPES.map((t) => (
                      <button
                        key={t.value}
                        onClick={() => setFortuneType(t.value)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                          fortuneType === t.value
                            ? 'bg-purple-500/50 border border-purple-400/50 text-white'
                            : 'bg-white/5 border border-white/10 text-white/50 hover:bg-white/10'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 내용 입력 */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-white/60 text-xs">오늘 운세를 나눠보세요</p>
                    <span className={`text-[10px] ${content.length > 180 ? 'text-red-400' : 'text-white/30'}`}>
                      {content.length}/200
                    </span>
                  </div>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value.slice(0, 200))}
                    placeholder="오늘 운세 내용을 자유롭게 적어보세요..."
                    rows={4}
                    className="w-full bg-white/10 border border-white/15 text-white placeholder-white/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400 resize-none"
                  />
                </div>

                {/* 키워드 선택 */}
                <div>
                  <p className="text-white/60 text-xs mb-2">키워드 선택 (최대 5개)</p>
                  <div className="flex flex-wrap gap-2">
                    {KEYWORDS.map((kw) => (
                      <button
                        key={kw}
                        onClick={() => toggleKeyword(kw)}
                        className={`px-3 py-1 rounded-full text-xs transition ${
                          selectedKeywords.includes(kw)
                            ? 'bg-purple-500/40 border border-purple-400/50 text-purple-200'
                            : 'bg-white/5 border border-white/10 text-white/50 hover:bg-white/10'
                        }`}
                      >
                        #{kw}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 공개 방식 */}
                <div>
                  <p className="text-white/60 text-xs mb-2">공개 방식</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsAnonymous(true)}
                      className={`flex-1 py-2 rounded-xl text-sm transition ${
                        isAnonymous
                          ? 'bg-purple-500/30 border border-purple-400/40 text-white'
                          : 'bg-white/5 border border-white/10 text-white/50'
                      }`}
                    >
                      🎭 익명
                    </button>
                    <button
                      onClick={() => setIsAnonymous(false)}
                      className={`flex-1 py-2 rounded-xl text-sm transition ${
                        !isAnonymous
                          ? 'bg-purple-500/30 border border-purple-400/40 text-white'
                          : 'bg-white/5 border border-white/10 text-white/50'
                      }`}
                    >
                      😊 닉네임
                    </button>
                  </div>
                  {!isAnonymous && (
                    <input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value.slice(0, 10))}
                      placeholder="닉네임 입력 (최대 10자)"
                      className="mt-2 w-full bg-white/10 border border-white/15 text-white placeholder-white/30 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-purple-400"
                    />
                  )}
                </div>

                {error && (
                  <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-xl text-red-200 text-sm">
                    {error}
                  </div>
                )}

                {/* 공유 버튼 */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmit}
                  disabled={isLoading || !content.trim()}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-xl font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? '공유 중...' : '✨ 천기누설하기'}
                </motion.button>

                <p className="text-center text-white/30 text-[10px]">
                  오늘 최대 3회 공유 가능 · 부적절한 내용은 삭제될 수 있습니다
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
