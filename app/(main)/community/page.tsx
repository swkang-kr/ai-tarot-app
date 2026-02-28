'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import FortunePostCard, { FortunePost } from '@/components/FortunePostCard'
import ShareFortuneModal from '@/components/ShareFortuneModal'
import { motion, AnimatePresence } from 'framer-motion'
import { useBodyScrollLock } from '@/lib/hooks/useBodyScrollLock'

const KEYWORDS = ['전체', '사랑', '연애', '직업', '재물', '건강', '인연', '이사', '시험', '가족', '금전']

type ReactionResult = {
  heartCount: number
  empathyCount: number
  sameCount: number
  myReaction: 'heart' | 'empathy' | 'same' | null
}

export default function CommunityPage() {
  const [posts, setPosts] = useState<FortunePost[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [activeKeyword, setActiveKeyword] = useState('전체')
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  useBodyScrollLock(showLoginPrompt)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setIsLoggedIn(!!session?.user)
    })
    return () => subscription.unsubscribe()
  }, [])

  const fetchPosts = useCallback(async (keyword: string, pageNum: number, replace: boolean) => {
    if (replace) setIsLoading(true)
    else setIsLoadingMore(true)

    try {
      const params = new URLSearchParams({ page: String(pageNum) })
      if (keyword !== '전체') params.set('keyword', keyword)

      const res = await fetch(`/api/community/posts?${params}`)
      if (!res.ok) {
        console.error('Community feed fetch failed:', res.status)
        setFetchError('피드를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.')
        return
      }
      const data = await res.json()

      setFetchError(null)
      if (replace) {
        setPosts(data.posts ?? [])
      } else {
        setPosts((prev) => [...prev, ...(data.posts ?? [])])
      }
      setHasMore(data.hasMore ?? false)
    } catch (err) {
      console.error('Community feed error:', err)
      setFetchError('피드를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [])

  useEffect(() => {
    setPage(0)
    fetchPosts(activeKeyword, 0, true)
  }, [activeKeyword, fetchPosts])

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchPosts(activeKeyword, nextPage, false)
  }

  // M1 수정: 서버 결과를 반환해 FortunePostCard가 동기화/롤백할 수 있도록
  const handleReact = async (
    postId: string,
    reactionType: 'heart' | 'empathy' | 'same'
  ): Promise<ReactionResult | null> => {
    try {
      const res = await fetch(`/api/community/posts/${postId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reactionType }),
      })
      if (!res.ok) return null
      const data = await res.json()
      return {
        heartCount: data.heartCount,
        empathyCount: data.empathyCount,
        sameCount: data.sameCount,
        myReaction: data.myReaction,
      }
    } catch {
      return null
    }
  }

  const handleDelete = async (postId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/community/posts/${postId}`, { method: 'DELETE' })
      if (!res.ok) return false
      setPosts((prev) => prev.filter((p) => p.id !== postId))
      return true
    } catch {
      return false
    }
  }

  const handleShareSuccess = (newPost: FortunePost) => {
    setShowShareModal(false)
    setPosts((prev) => [newPost, ...prev])
  }

  return (
    <div className="min-h-screen pb-24">
      {/* 헤더 */}
      <div className="sticky top-0 z-30 bg-gradient-to-b from-[#1a1744] to-[#1a1744]/95 backdrop-blur-xl border-b border-white/8 px-4 pt-12 pb-3">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-white font-bold text-xl">천기누설</h1>
              <p className="text-white/40 text-xs mt-0.5">오늘의 운세를 나눠보세요</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => isLoggedIn ? setShowShareModal(true) : setShowLoginPrompt(true)}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-purple-500/25"
            >
              ✨ 공유하기
            </motion.button>
          </div>

          {/* 키워드 필터 */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {KEYWORDS.map((kw) => (
              <button
                key={kw}
                onClick={() => setActiveKeyword(kw)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeKeyword === kw
                    ? 'bg-purple-500/40 border border-purple-400/50 text-purple-200'
                    : 'bg-white/5 border border-white/10 text-white/50 hover:bg-white/10'
                }`}
              >
                {kw === '전체' ? kw : `#${kw}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 피드 */}
      <div className="max-w-md mx-auto px-4 pt-4 space-y-3">
        {fetchError ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-3xl mb-3">😔</span>
            <p className="text-white/50 text-sm">{fetchError}</p>
            <button
              onClick={() => fetchPosts(activeKeyword, 0, true)}
              className="mt-4 px-5 py-2 bg-white/10 border border-white/15 text-white/60 text-sm rounded-xl hover:bg-white/15 transition"
            >
              다시 시도
            </button>
          </div>
        ) : isLoading ? (
          <div className="space-y-3 pt-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white/5 rounded-2xl p-4 animate-pulse space-y-3">
                <div className="flex gap-2">
                  <div className="w-6 h-6 bg-white/10 rounded-full" />
                  <div className="w-20 h-3 bg-white/10 rounded" />
                </div>
                <div className="space-y-2">
                  <div className="w-full h-3 bg-white/10 rounded" />
                  <div className="w-3/4 h-3 bg-white/10 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-4xl mb-3">🔮</span>
            <p className="text-white/50 text-sm">아직 공유된 운세가 없어요</p>
            <p className="text-white/30 text-xs mt-1">첫 번째로 운세를 공유해보세요!</p>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => isLoggedIn ? setShowShareModal(true) : setShowLoginPrompt(true)}
              className="mt-6 px-6 py-2.5 bg-purple-500/30 border border-purple-400/40 text-purple-200 text-sm rounded-xl"
            >
              ✨ 운세 공유하기
            </motion.button>
          </div>
        ) : (
          <>
            <AnimatePresence initial={false}>
              {posts.map((post) => (
                <FortunePostCard
                  key={post.id}
                  post={post}
                  isLoggedIn={isLoggedIn}
                  onReact={handleReact}
                  onDelete={handleDelete}
                  onRequireLogin={() => setShowLoginPrompt(true)}
                />
              ))}
            </AnimatePresence>

            {hasMore && (
              <div className="pt-2 pb-4">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="w-full py-3 bg-white/5 border border-white/10 text-white/50 text-sm rounded-xl hover:bg-white/8 transition disabled:opacity-50"
                >
                  {isLoadingMore ? '불러오는 중...' : '더 보기'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* 로그인 필요 안내 */}
      <AnimatePresence>
        {showLoginPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center"
            onClick={() => setShowLoginPrompt(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="w-full max-w-md bg-gradient-to-b from-indigo-900/98 to-purple-900/98 backdrop-blur-xl rounded-t-3xl p-6 border-t border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-center mb-4">
                <div className="w-10 h-1 bg-white/20 rounded-full" />
              </div>
              <div className="text-center py-4">
                <p className="text-3xl mb-3">🔑</p>
                <h3 className="text-white font-bold text-lg mb-2">로그인이 필요해요</h3>
                <p className="text-white/50 text-sm mb-6">운세 공유와 반응은 로그인 후 이용 가능해요</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowLoginPrompt(false)}
                    className="flex-1 py-3 bg-white/10 border border-white/15 text-white/70 rounded-xl text-sm"
                  >
                    취소
                  </button>
                  <a
                    href="/login?redirect=/community"
                    className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl text-sm font-semibold text-center"
                  >
                    로그인하기
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 운세 공유 모달 */}
      <ShareFortuneModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        onSuccess={handleShareSuccess}
      />
    </div>
  )
}
