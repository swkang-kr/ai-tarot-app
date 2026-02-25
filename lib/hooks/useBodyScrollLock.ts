import { useEffect } from 'react'

/**
 * 모달이 열렸을 때 배경 스크롤을 막는 훅.
 * iOS Safari까지 대응 (position: fixed + scroll 위치 복원).
 */
export function useBodyScrollLock(isOpen: boolean) {
  useEffect(() => {
    if (!isOpen) return

    const scrollY = window.scrollY
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'
    document.body.style.overflowY = 'scroll' // 스크롤바 레이아웃 시프트 방지

    return () => {
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.style.overflowY = ''
      window.scrollTo(0, scrollY)
    }
  }, [isOpen])
}
