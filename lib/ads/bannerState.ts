/**
 * AdMob 배너 높이 상태 공유 모듈
 * admob.ts → bannerState → BottomNav (구독 패턴)
 */

type Listener = (height: number) => void
const listeners: Set<Listener> = new Set()
let currentHeight = 0

export function getBannerHeight(): number {
  return currentHeight
}

export function setBannerHeight(height: number): void {
  currentHeight = height
  listeners.forEach(l => l(height))
}

export function subscribeBannerHeight(listener: Listener): () => void {
  listeners.add(listener)
  // 즉시 현재 값 전달
  listener(currentHeight)
  return () => listeners.delete(listener)
}
