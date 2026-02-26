import { Capacitor } from '@capacitor/core'
import {
  AdMob,
  BannerAdSize,
  BannerAdPosition,
  BannerAdPluginEvents,
  AdMobError,
} from '@capacitor-community/admob'

function dispatchBannerHeight(height: number): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('adBannerHeight', { detail: height }))
  }
}

// ─────────────────────────────────────────────
// Ad Unit IDs
// ─────────────────────────────────────────────
const IS_TEST = process.env.NEXT_PUBLIC_ADMOB_TEST === 'true'

// 구글 공식 테스트 광고 ID (항상 광고가 채워짐)
const TEST_BANNER_ID = {
  android: 'ca-app-pub-3940256099942544/6300978111',
  ios: 'ca-app-pub-3940256099942544/2934735716',
}

const PROD_BANNER_ID = {
  android: 'ca-app-pub-6554444153753287/7938403293',
  ios: 'ca-app-pub-6554444153753287/4849205523',
}

const BANNER_ID = IS_TEST ? TEST_BANNER_ID : PROD_BANNER_ID

function getBannerId(): string {
  return Capacitor.getPlatform() === 'ios' ? BANNER_ID.ios : BANNER_ID.android
}

// ─────────────────────────────────────────────
// 상태 관리
// ─────────────────────────────────────────────
let initialized = false
let bannerVisible = false

// ─────────────────────────────────────────────
// 초기화
// ─────────────────────────────────────────────

/** AdMob 초기화 + 이벤트 리스너 등록 (앱 시작 시 1회) */
export async function initAdMob(): Promise<void> {
  if (!Capacitor.isNativePlatform() || initialized) return

  try {
    await AdMob.initialize({
      initializeForTesting: IS_TEST,
    })
    initialized = true
    console.log('[AdMob] 초기화 완료')

    AdMob.addListener(BannerAdPluginEvents.Loaded, () => {
      console.log('[AdMob] 배너 로드 완료')
      // SizeChanged가 먼저 실제 높이를 전달하므로 여기서 덮어쓰지 않음
    })

    AdMob.addListener(BannerAdPluginEvents.FailedToLoad, (error: AdMobError) => {
      console.warn('[AdMob] 배너 로드 실패:', error.message)
      bannerVisible = false
      dispatchBannerHeight(0)
    })

    AdMob.addListener(BannerAdPluginEvents.Opened, () => {
      console.log('[AdMob] 배너 클릭됨')
    })

    AdMob.addListener(BannerAdPluginEvents.SizeChanged, (size: any) => {
      console.log('[AdMob] 배너 크기 변경:', size)
      if (size?.height) {
        dispatchBannerHeight(Math.ceil(size.height))
      }
    })
  } catch (err) {
    console.warn('[AdMob] 초기화 실패:', err)
  }
}

// ─────────────────────────────────────────────
// 배너 광고
// ─────────────────────────────────────────────

/** 배너 광고 표시 (하단 고정, BottomNav 위) */
export async function showBanner(): Promise<void> {
  if (!Capacitor.isNativePlatform() || !initialized) return
  if (bannerVisible) return

  try {
    await AdMob.showBanner({
      adId: getBannerId(),
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
    })
    bannerVisible = true
  } catch (err) {
    console.warn('[AdMob] 배너 표시 실패:', err)
  }
}

/** 배너 광고 숨기기 */
export async function hideBanner(): Promise<void> {
  if (!Capacitor.isNativePlatform() || !bannerVisible) return

  try {
    await AdMob.hideBanner()
    bannerVisible = false
    dispatchBannerHeight(0)
  } catch (err) {
    console.warn('[AdMob] 배너 숨기기 실패:', err)
  }
}

/** 배너 광고 완전 제거 */
export async function removeBanner(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return

  try {
    await AdMob.removeBanner()
    bannerVisible = false
    dispatchBannerHeight(0)
  } catch (err) {
    console.warn('[AdMob] 배너 제거 실패:', err)
  }
}

// ─────────────────────────────────────────────
// 유틸
// ─────────────────────────────────────────────

/** 네이티브 플랫폼 여부 */
export function isNative(): boolean {
  return Capacitor.isNativePlatform()
}

/** AdMob 초기화 상태 */
export function isAdMobReady(): boolean {
  return initialized
}
