'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

export interface FortunePost {
  id: string
  is_mine?: boolean
  is_anonymous: boolean
  display_name: string | null
  content: string
  keywords: string[]
  fortune_type: string
  heart_count: number
  empathy_count: number
  same_count: number
  created_at: string
  my_reaction?: 'heart' | 'empathy' | 'same' | null
}

type ReactionType = 'heart' | 'empathy' | 'same'

interface ReactionResult {
  heartCount: number
  empathyCount: number
  sameCount: number
  myReaction: ReactionType | null
}

const TYPE_INFO: Record<string, { icon: string; label: string; color: string }> = {
  tarot: { icon: '🔮', label: '타로', color: 'text-purple-300' },
  saju: { icon: '🏯', label: '사주', color: 'text-amber-300' },
  lucky: { icon: '🍀', label: '행운', color: 'text-green-300' },
  dream: { icon: '💭', label: '꿈해몽', color: 'text-blue-300' },
  general: { icon: '🌙', label: '운세', color: 'text-white/60' },
}

interface FortunePostCardProps {
  post: FortunePost
  isLoggedIn: boolean
  onReact: (postId: string, reactionType: ReactionType) => Promise<ReactionResult | null>
  onDelete?: (postId: string) => Promise<boolean>
  onRequireLogin: () => void
}

export default function FortunePostCard({ post, isLoggedIn, onReact, onDelete, onRequireLogin }: FortunePostCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleted, setDeleted] = useState(false)
  const [optimistic, setOptimistic] = useState<{
    heart: number
    empathy: number
    same: number
    my: ReactionType | null
  }>({
    heart: post.heart_count,
    empathy: post.empathy_count,
    same: post.same_count,
    my: post.my_reaction ?? null,
  })

  const typeInfo = TYPE_INFO[post.fortune_type] ?? TYPE_INFO.general

  const handleReact = async (type: ReactionType) => {
    if (!isLoggedIn) { onRequireLogin(); return }

    // 롤백용 이전 상태 저장
    const prevState = optimistic

    // 낙관적 업데이트
    setOptimistic((prev) => {
      const next = { ...prev }
      const wasActive = prev.my === type

      if (prev.my && prev.my !== type) {
        if (prev.my === 'heart')   next.heart   = Math.max(0, prev.heart   - 1)
        if (prev.my === 'empathy') next.empathy = Math.max(0, prev.empathy - 1)
        if (prev.my === 'same')    next.same    = Math.max(0, prev.same    - 1)
      }

      if (wasActive) {
        if (type === 'heart')   next.heart   = Math.max(0, prev.heart   - 1)
        if (type === 'empathy') next.empathy = Math.max(0, prev.empathy - 1)
        if (type === 'same')    next.same    = Math.max(0, prev.same    - 1)
        next.my = null
      } else {
        if (type === 'heart')   next.heart   = prev.heart   + 1
        if (type === 'empathy') next.empathy = prev.empathy + 1
        if (type === 'same')    next.same    = prev.same    + 1
        next.my = type
      }

      return next
    })

    // M1 수정: 서버 결과로 상태 동기화, 실패 시 롤백
    const result = await onReact(post.id, type)
    if (result) {
      setOptimistic({
        heart: result.heartCount,
        empathy: result.empathyCount,
        same: result.sameCount,
        my: result.myReaction,
      })
    } else {
      setOptimistic(prevState)
    }
  }

  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ko })
  const authorName = post.is_anonymous ? '익명' : (post.display_name ?? '익명')

  const handleDelete = async () => {
    if (!onDelete || isDeleting) return
    setIsDeleting(true)
    const ok = await onDelete(post.id)
    if (ok) {
      setDeleted(true)
    } else {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  if (deleted) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/8 backdrop-blur-sm border border-white/10 rounded-2xl p-4 space-y-3"
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{typeInfo.icon}</span>
          <span className={`text-xs font-medium ${typeInfo.color}`}>{typeInfo.label}</span>
          <span className="text-white/20 text-xs">·</span>
          <span className="text-white/40 text-xs">{authorName}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-white/30 text-[10px]">{timeAgo}</span>
          {post.is_mine && onDelete && !showDeleteConfirm && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="text-white/20 hover:text-red-400/70 transition p-0.5 text-sm leading-none"
              aria-label="삭제"
            >
              🗑
            </button>
          )}
        </div>
      </div>

      {/* 삭제 확인 */}
      {showDeleteConfirm && (
        <div className="flex items-center justify-between px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl">
          <span className="text-red-300 text-xs">게시글을 삭제할까요?</span>
          <div className="flex gap-2">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="text-white/50 text-xs px-2.5 py-1 bg-white/5 rounded-lg"
            >
              취소
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-red-300 text-xs px-2.5 py-1 bg-red-500/20 rounded-lg disabled:opacity-50"
            >
              {isDeleting ? '삭제 중...' : '삭제'}
            </button>
          </div>
        </div>
      )}

      {/* 내용 */}
      <p className="text-white text-sm leading-relaxed">{post.content}</p>

      {/* 키워드 */}
      {post.keywords.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {post.keywords.map((kw) => (
            <span key={kw} className="text-[10px] px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-full">
              #{kw}
            </span>
          ))}
        </div>
      )}

      {/* 반응 버튼 */}
      <div className="flex items-center gap-2 pt-1">
        <ReactionButton
          emoji="❤️"
          label="좋아요"
          count={optimistic.heart}
          active={optimistic.my === 'heart'}
          onClick={() => handleReact('heart')}
        />
        <ReactionButton
          emoji="🤝"
          label="공감해"
          count={optimistic.empathy}
          active={optimistic.my === 'empathy'}
          onClick={() => handleReact('empathy')}
        />
        <ReactionButton
          emoji="✨"
          label="나도 같아"
          count={optimistic.same}
          active={optimistic.my === 'same'}
          onClick={() => handleReact('same')}
        />
      </div>
    </motion.div>
  )
}

function ReactionButton({
  emoji,
  label,
  count,
  active,
  onClick,
}: {
  emoji: string
  label: string
  count: number
  active: boolean
  onClick: () => void
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium transition ${
        active
          ? 'bg-purple-500/30 border border-purple-400/40 text-purple-200'
          : 'bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white/70'
      }`}
    >
      <span className="text-sm">{emoji}</span>
      <span>{label}</span>
      {count > 0 && <span className={active ? 'text-purple-300' : 'text-white/30'}>{count}</span>}
    </motion.button>
  )
}
