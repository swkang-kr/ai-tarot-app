import { Capacitor } from '@capacitor/core'
import {
  AdMob,
  BannerAdSize,
  BannerAdPosition,
  BannerAdPluginEvents,
  InterstitialAdPluginEvents,
  AdLoadInfo,
  AdMobError,
} from '@capacitor-community/admob'

// ─────────────────────────────────────────────
// Ad Unit IDs
// ─────────────────────────────────────────────
const AD_IDS = {
  banner: {
    android: 'ca-app-pub-6554444153753287/7938403293',
    ios: 'ca-app-pub-6554444153753287/4849205523',
  },
  interstitial: {
    android: 'ca-app-pub-6554444153753287/4811519417',
    ios: 'ca-app-pub-6554444153753287/8596878843',
  },
}

function getAdId(type: 'banner' | 'interstitial'): string {
  const platform = Capacitor.getPlatform()
  if (platform === 'ios') return AD_IDS[type].ios
  return AD_IDS[type].android
}

// ─────────────────────────────────────────────
// 상태 관리
// ─────────────────────────────────────────────
let initialized = false
let bannerVisible = false
let interstitialLoaded = false

// ─────────────────────────────────────────────
// 초기화
// ─────────────────────────────────────────────

/** AdMob 초기화 + 이벤트 리스너 등록 (앱 시작 시 1회) */
export async function initAdMob(): Promise<void> {
  if (!Capacitor.isNativePlatform() || initialized) return

  try {
    await AdMob.initialize({
      initializeForTesting: false,
    })
    initialized = true
    console.log('[AdMob] 초기화 완료')

    // 배너 이벤트 리스너
    AdMob.addListener(BannerAdPluginEvents.Loaded, () => {
      console.log('[AdMob] 배너 로드 완료')
      document.documentElement.style.setProperty('--ad-banner-height', '60px')
    })

    AdMob.addListener(BannerAdPluginEvents.FailedToLoad, (error: AdMobError) => {
      console.warn('[AdMob] 배너 로드 실패:', error.message)
      bannerVisible = false
      document.documentElement.style.setProperty('--ad-banner-height', '0px')
    })

    AdMob.addListener(BannerAdPluginEvents.Opened, () => {
      console.log('[AdMob] 배너 클릭됨')
    })

    AdMob.addListener(BannerAdPluginEvents.SizeChanged, (size: any) => {
      console.log('[AdMob] 배너 크기 변경:', size)
      if (size?.height) {
        document.documentElement.style.setProperty('--ad-banner-height', `${size.height}px`)
      }
    })

    // 전면 광고 이벤트 리스너
    AdMob.addListener(InterstitialAdPluginEvents.Loaded, (info: AdLoadInfo) => {
      console.log('[AdMob] 전면 광고 로드 완료:', info.adUnitId)
      interstitialLoaded = true
    })

    AdMob.addListener(InterstitialAdPluginEvents.FailedToLoad, (error: AdMobError) => {
      console.warn('[AdMob] 전면 광고 로드 실패:', error.message)
      interstitialLoaded = false
    })

    AdMob.addListener(InterstitialAdPluginEvents.Showed, () => {
      console.log('[AdMob] 전면 광고 표시됨')
    })

    AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {
      console.log('[AdMob] 전면 광고 닫힘')
      interstitialLoaded = false
      // 다음 전면 광고 미리 로드
      preloadInterstitial()
    })

    AdMob.addListener(InterstitialAdPluginEvents.FailedToShow, (error: AdMobError) => {
      console.warn('[AdMob] 전면 광고 표시 실패:', error.message)
      interstitialLoaded = false
    })

    // 전면 광고 미리 로드
    preloadInterstitial()
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
      adId: getAdId('banner'),
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
    document.documentElement.style.setProperty('--ad-banner-height', '0px')
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
    document.documentElement.style.setProperty('--ad-banner-height', '0px')
  } catch (err) {
    console.warn('[AdMob] 배너 제거 실패:', err)
  }
}

// ─────────────────────────────────────────────
// 전면 광고 (Interstitial)
// ─────────────────────────────────────────────

/** 전면 광고 미리 로드 (백그라운드) */
async function preloadInterstitial(): Promise<void> {
  if (!initialized || interstitialLoaded) return

  try {
    await AdMob.prepareInterstitial({
      adId: getAdId('interstitial'),
    })
  } catch (err) {
    console.warn('[AdMob] 전면 광고 프리로드 실패:', err)
  }
}

/**
 * 전면 광고 표시 (콘텐츠 확인 전 호출)
 *
 * - 광고가 미리 로드되어 있으면 즉시 표시
 * - 로드 안 되어 있으면 로드 후 표시 시도
 * - 실패해도 true 반환 (콘텐츠 접근 차단하지 않음)
 *
 * @example
 * ```ts
 * const handleSubmit = async () => {
 *   setStep('loading')
 *   await showInterstitial()  // 전면 광고 → 닫은 후 계속 진행
 *   const res = await fetch('/api/generate', { ... })
 * }
 * ```
 */
export async function showInterstitial(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return true

  try {
    // 미리 로드되지 않았으면 지금 로드
    if (!interstitialLoaded) {
      await AdMob.prepareInterstitial({
        adId: getAdId('interstitial'),
      })
    }

    await AdMob.showInterstitial()
    interstitialLoaded = false
    return true
  } catch (err) {
    console.warn('[AdMob] 전면 광고 실패:', err)
    return true // 광고 실패 시에도 콘텐츠 허용
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
