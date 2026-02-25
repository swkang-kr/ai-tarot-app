# 타로 앱 인앱결제(IAP) 구현 가이드

## 목차
1. [Google AdMob 승인 프로세스](#google-admob-승인-프로세스)
2. [광고 네트워크 비교](#광고-네트워크-비교)
3. [RevenueCat 인앱결제 구현](#revenuecat-인앱결제-구현)
4. [수익 시뮬레이션](#수익-시뮬레이션)

---

## Google AdMob 승인 프로세스

### ⚠️ 바로 못 붙입니다 - 심사 필요!

AdMob에서 새 앱을 설정할 때는 앱이 검토 및 승인을 거쳐야 광고가 게재될 수 있으며, 검토에는 보통 2~3일이 소요되지만 경우에 따라 더 많은 시간이 필요할 수 있습니다.

### 필수 요구사항

1. ✅ 앱 개발 완료
2. ✅ **Google Play / App Store 출시** (필수!)
3. ✅ AdMob 계정 생성
4. ✅ 앱 등록 및 광고 단위 생성
5. ⏳ 승인 대기

### 심사 기간

- **최소**: 24-48시간
- **평균**: 2-3일
- **최대**: 1주일 이상 (복잡한 경우)

### 현실적인 런칭 타임라인

```
Week 1-2: 앱 개발 (클로드 코드)
  └─ 테스트 광고 ID로 개발
  
Week 3: 앱스토어 제출
  └─ Google Play: 평균 1-3일 심사
  └─ App Store: 평균 1-2일 심사
  
Week 3-4: AdMob 신청
  └─ 앱 출시 후 AdMob 등록
  └─ 2-3일 대기
  └─ 승인 받으면 테스트 ID → 실제 ID로 교체
  
Week 4: 업데이트 배포
  └─ 실제 광고 ID로 업데이트
  └─ 수익 발생 시작!
```

**총 소요 시간: 약 3-4주**

---

## 광고 네트워크 비교

### 주요 광고 네트워크 eCPM 비교 (미국 기준)

| 광고 네트워크 | eCPM (미국) | 승인 시간 | 장점 | 단점 |
|--------------|-------------|-----------|------|------|
| **Google AdMob** | $2.8-14 | 2-7일 | 최고 수익, 글로벌 커버리지 | 심사 엄격 |
| **Meta Audience Network** | $2-12 | 1-3일 | 타겟팅 우수 | Facebook 필요 |
| **Unity Ads** | $1.5-10 | 즉시 | 심사 쉬움, 빠른 승인 | 게임 위주 |
| **AppLovin** | $2-8 | 즉시 | 승인 쉬움 | 중간 수익 |
| **IronSource** | $2-9 | 1-2일 | 미디에이션 강력 | 복잡함 |

### 2024년 광고 포맷별 eCPM

- **배너 광고**: $2.80 per 1,000 views
- **전면 광고**: $4.80 per 1,000 views  
- **네이티브 광고**: $3.30 per 1,000 views
- **보상형 비디오**: $3-15 per 1,000 views (최고 수익!)

### 국가별 eCPM (전면 광고 기준)

**iOS:**
- 미국: $14.32
- 영국: $10.38
- 한국: $10.04

**Android:**
- 미국: $14.08
- 한국: $11.23
- 캐나다: $8.49

---

## 타로 앱 최적화된 TOP 5 광고 네트워크

### 🥇 1위: Meta Audience Network

**추천 이유:**
- 타로/운세 앱에 관심 있는 사용자 타겟팅 가능
- Facebook 데이터 활용한 정교한 타겟팅
- 비게임 앱에 최적화

**eCPM:** 미국 $14.08, 한국 $11.23
**승인:** 1-3일

### 🥈 2위: Unity Ads

**추천 이유:**
- **즉시 승인** (심사 없음!)
- 보상형 광고에 강함
- 타로 크레딧 지급에 최적

**eCPM:** 보상형 비디오 $3-10

### 🥉 3위: AppLovin

**추천 이유:**
- 즉시 승인
- 자동 최적화 알고리즘
- 미디에이션 내장

**eCPM:** 평균 $2-8

### 4위: IronSource (by Unity)

**추천 이유:**
- 강력한 미디에이션 플랫폼
- 여러 네트워크 통합 관리
- A/B 테스트 기능

### 5위: AdMob (기본 옵션)

가장 높은 수익이지만 심사 필요

---

## 미디에이션 전략

### 핵심 개념

앱이 여러 광고 네트워크를 통해 광고를 게재하면 수요가 증가하고 경쟁이 생겨 더 높은 eCPM을 얻을 수 있습니다.

### 미디에이션 작동 방식

```
사용자가 광고 요청
    ↓
[미디에이션 플랫폼]
    ↓
동시에 여러 네트워크에 입찰 요청
    ↓
AdMob: $3.50
Meta: $4.20  ← 최고가 선택!
Unity: $2.80
AppLovin: $3.00
    ↓
Meta 광고 표시 ($4.20 수익)
```

### 실제 수익 비교 (월 1만 MAU 기준)

**단일 네트워크 (Unity만):**
- eCPM: $3
- **월 수익: $300**

**미디에이션 (AdMob + Meta + Unity + AppLovin):**
- 평균 eCPM: $5.5 (경쟁으로 83% 증가!)
- **월 수익: $550**

**차이: $250/월 (83% 증가!)**

---

## RevenueCat 인앱결제 구현

### RevenueCat이 최고인 이유

RevenueCat은 StoreKit, Google Play Billing, RevenueCat 백엔드를 감싸는 래퍼를 제공하여 React Native에서 인앱 구매 구현을 쉽게 만드는 오픈소스 프레임워크입니다.

**기존 방식 vs RevenueCat:**

```
기존 방식:
iOS: StoreKit 코드 (Swift)
  +
Android: Google Play Billing (Kotlin)
  +
서버 영수증 검증
  +
구독 상태 추적
= 2-3주 개발 시간 💀

RevenueCat 방식:
npm install react-native-purchases
= 30분 후 완성! ✅
```

### 무료 플랜

RevenueCat는 월 거래 수익 $2,500까지 무료 (약 ₩3,300,000)

---

## 프로젝트 설정

### Step 1: 패키지 설치

```bash
# 프로젝트 생성
npx create-expo-app TarotApp --template blank-typescript
cd TarotApp

# RevenueCat 설치
npm install react-native-purchases
npm install @react-navigation/native @react-navigation/stack
npm install react-native-screens react-native-safe-area-context

# 광고 SDK
npm install react-native-google-mobile-ads
```

### Step 2: RevenueCat Provider 구현

```typescript
// src/context/RevenueCatProvider.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import Purchases, { 
  PurchasesPackage, 
  CustomerInfo,
  PurchasesOffering 
} from 'react-native-purchases';
import { Platform } from 'react-native';

const API_KEYS = {
  ios: 'appl_xxxxxxxxx',
  android: 'goog_xxxxxxxxx',
};

interface RevenueCatContextType {
  packages: PurchasesPackage[];
  purchasePackage: (pkg: PurchasesPackage) => Promise<{ success: boolean; error?: string }>;
  restorePurchases: () => Promise<void>;
  isPro: boolean;
  credits: number;
  loading: boolean;
}

const RevenueCatContext = createContext<RevenueCatContextType>({
  packages: [],
  purchasePackage: async () => ({ success: false }),
  restorePurchases: async () => {},
  isPro: false,
  credits: 0,
  loading: true,
});

export const RevenueCatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [isPro, setIsPro] = useState(false);
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeRevenueCat();
  }, []);

  const initializeRevenueCat = async () => {
    try {
      const apiKey = Platform.OS === 'ios' ? API_KEYS.ios : API_KEYS.android;
      await Purchases.configure({ apiKey });

      const customerInfo = await Purchases.getCustomerInfo();
      updateUserStatus(customerInfo);

      const offerings = await Purchases.getOfferings();
      if (offerings.current?.availablePackages) {
        setPackages(offerings.current.availablePackages);
      }

      setLoading(false);
    } catch (error) {
      console.error('RevenueCat 초기화 실패:', error);
      setLoading(false);
    }
  };

  const updateUserStatus = (customerInfo: CustomerInfo) => {
    const hasProAccess = customerInfo.entitlements.active['pro'] !== undefined;
    setIsPro(hasProAccess);

    const creditCount = customerInfo.nonSubscriptionTransactions.filter(
      t => t.productIdentifier.includes('credit')
    ).length;
    setCredits(creditCount);
  };

  const purchasePackage = async (pkg: PurchasesPackage) => {
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      updateUserStatus(customerInfo);
      return { success: true };
    } catch (error: any) {
      if (error.userCancelled) {
        return { success: false, error: '구매가 취소되었습니다.' };
      }
      return { success: false, error: '구매 실패: ' + error.message };
    }
  };

  const restorePurchases = async () => {
    try {
      const customerInfo = await Purchases.restorePurchases();
      updateUserStatus(customerInfo);
    } catch (error) {
      console.error('복원 실패:', error);
    }
  };

  return (
    <RevenueCatContext.Provider
      value={{
        packages,
        purchasePackage,
        restorePurchases,
        isPro,
        credits,
        loading,
      }}
    >
      {children}
    </RevenueCatContext.Provider>
  );
};

export const useRevenueCat = () => useContext(RevenueCatContext);
```

### Step 3: Paywall 화면

```typescript
// src/screens/PaywallScreen.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRevenueCat } from '../context/RevenueCatProvider';

export const PaywallScreen = ({ navigation }: any) => {
  const { packages, purchasePackage, restorePurchases } = useRevenueCat();
  const [purchasing, setPurchasing] = useState(false);

  const handlePurchase = async (pkg: any) => {
    setPurchasing(true);
    const result = await purchasePackage(pkg);
    setPurchasing(false);

    if (result.success) {
      Alert.alert('구매 완료! 🎉', '프리미엄 기능이 활성화되었습니다.');
      navigation.goBack();
    } else {
      Alert.alert('구매 실패', result.error || '다시 시도해주세요.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>✨ 프리미엄 업그레이드</Text>
      
      {packages.map((pkg) => (
        <TouchableOpacity
          key={pkg.identifier}
          style={styles.productCard}
          onPress={() => handlePurchase(pkg)}
          disabled={purchasing}
        >
          <Text style={styles.productTitle}>{pkg.product.title}</Text>
          <Text style={styles.productPrice}>{pkg.product.priceString}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};
```

### Step 4: 홈 화면 (AdMob + IAP 통합)

```typescript
// src/screens/HomeScreen.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react';
import { useRevenueCat } from '../context/RevenueCatProvider';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

export const HomeScreen = ({ navigation }: any) => {
  const { isPro, credits } = useRevenueCat();
  const [dailyFreeUsed, setDailyFreeUsed] = useState(false);

  const handleStartReading = () => {
    if (isPro) {
      navigation.navigate('TarotReading');
    } else if (!dailyFreeUsed) {
      setDailyFreeUsed(true);
      navigation.navigate('TarotReading');
    } else if (credits > 0) {
      navigation.navigate('TarotReading', { useCredit: true });
    } else {
      navigation.navigate('CreditShop');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔮 AI 타로</Text>
      
      <TouchableOpacity style={styles.button} onPress={handleStartReading}>
        <Text style={styles.buttonText}>타로 리딩 시작</Text>
      </TouchableOpacity>

      {!isPro && (
        <View style={styles.adContainer}>
          <BannerAd
            unitId={TestIds.BANNER}
            size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          />
        </View>
      )}
    </View>
  );
};
```

---

## 상품 설정

### App Store Connect 상품 등록

```
구독 상품:
1. Monthly Pro: $4.99/월
   Product ID: tarot_pro_monthly
   
2. Annual Pro: $39.99/년 (33% 할인)
   Product ID: tarot_pro_annual

소비성 상품 (크레딧):
3. 1 Credit: $0.99
   Product ID: tarot_credit_1

4. 5 Credits: $3.99 (20% 할인)
   Product ID: tarot_credit_5

5. 10 Credits: $6.99 (30% 할인)
   Product ID: tarot_credit_10
```

### RevenueCat 대시보드 연결

```
1. Products → Import from App Store / Google Play

2. Entitlement 설정:
   - Entitlement: "pro"
   - Products: tarot_pro_monthly, tarot_pro_annual

3. Offering 설정:
   - Default Offering
   - Monthly Package: $4.99
   - Annual Package: $39.99 (Popular)
```

---

## 수익 시뮬레이션

### 시나리오: 월 10,000 MAU

```javascript
// 무료 사용자 (7,000명, 70%)
const freeUsersRevenue = {
  count: 7000,
  adImpressions: 70000,  // 10회/유저
  eCPM: 2.5,
  revenue: 70000 * (2.5 / 1000) = $175
};

// 크레딧 구매 (2,500명, 25%)
const creditRevenue = {
  count: 2500,
  conversionRate: 0.3,  // 30% 전환
  avgPurchase: 3.99,
  revenue: 2500 * 0.3 * 3.99 = $2,992
};

// Pro 구독 (500명, 5%)
const subscriptionRevenue = {
  monthly: 300 * 4.99 = $1,497,
  annual: 200 * 3.33 = $666,  // $39.99/12
  total: $2,163
};

// 총 월 수익
const totalRevenue = $175 + $2,992 + $2,163 = $5,330
```

**예상 월 수익: $5,330 (약 ₩7,100,000)**

### 수익 구성 비율

- 광고 수익: 3.3% ($175)
- 크레딧 판매: 56.1% ($2,992)
- 구독 수익: 40.6% ($2,163)

---

## 광고 포맷별 최적 배치

### 1. 배너 광고 (Banner Ads)

```typescript
<TarotResult>
  <CardInterpretation />
  <BannerAd /> // 리딩 결과 하단
</TarotResult>
```

- **eCPM**: $0.5-3 (낮음)
- **장점**: 항상 표시, 방해 안 함
- **단점**: 수익 낮음

### 2. 전면 광고 (Interstitial Ads) ⭐ 추천!

```typescript
function finishReading() {
  showResults();
  setTimeout(() => {
    showInterstitialAd(); // 리딩 완료 후
  }, 2000);
}
```

- **eCPM**: $2-14 (높음)
- **장점**: 높은 수익
- **단점**: 방해될 수 있음
- **타이밍**: 3번에 1번만 표시

### 3. 보상형 광고 (Rewarded Video) ⭐⭐ 강력 추천!

```typescript
<Button onClick={watchAdForCredit}>
  📺 광고 보고 크레딧 받기
</Button>
```

- **eCPM**: $3-15 (최고)
- **장점**: 사용자 선택, 높은 참여도
- **전환율**: 일반 광고 대비 3-5배

### 4. 네이티브 광고 (Native Ads)

```typescript
<RecommendedReadings>
  <Reading type="love" />
  <NativeAd /> // 자연스럽게 통합
  <Reading type="career" />
</RecommendedReadings>
```

- **eCPM**: $2-8 (중간)
- **장점**: 자연스러움
- **단점**: 구현 복잡

---

## 즉시 시작 가능한 플랜

### Phase 1: 즉시 시작 (Day 1)

```bash
npm install react-native-unity-ads
# Unity Ads는 승인 즉시!
```

**예상 수익 (1,000 MAU):**
- 광고 노출: 10,000회
- eCPM: $2.5
- **월 수익: $25**

### Phase 2: 미디에이션 (Week 2)

```javascript
// AppLovin MAX 추가
- Unity Ads (베이스)
- AppLovin (추가)
- Meta (대기 중)
```

**예상 수익:**
- eCPM: $3.5 (40% 증가)
- **월 수익: $35**

### Phase 3: AdMob 승인 (Week 4)

```javascript
// AdMob 미디에이션
- AdMob (프라이머리)
- Meta Audience Network
- Unity Ads
- AppLovin
```

**예상 수익:**
- eCPM: $5 (100% 증가)
- **월 수익: $50**

---

## 타로 앱 최적 수익화 조합

### 🎯 추천 전략

```
런칭 즉시: Unity Ads
    ↓
2주 후: Unity + AppLovin (미디에이션)
    ↓
4주 후: AdMob Mediation
        ├─ Meta Audience Network
        ├─ Unity Ads
        ├─ AppLovin
        └─ Vungle
    ↓
+ RevenueCat IAP (크레딧 + 구독)
```

### 예상 월 수익 (1만 MAU)

| 구성 | 광고 수익 | IAP 수익 | 총 수익 |
|------|----------|----------|---------|
| 광고만 | $400-600 | $0 | $400-600 |
| 광고 + 크레딧 | $400 | $800-1,100 | $1,200-1,500 |
| 광고 + IAP + 구독 | $400 | $1,600-2,100 | $2,000-2,500 |

---

## 테스트 방법

### 샌드박스 테스트 (무료)

```
iOS:
- App Store Connect → Users and Access
- Sandbox Testers 계정 생성
- 실제 돈 안 나감!

Android:
- Google Play Console → Settings
- License testing 계정 추가
- 실제 돈 안 나감!

RevenueCat은 자동으로 샌드박스 감지
```

---

## 최종 체크리스트

### 출시 전 준비

- [ ] RevenueCat 계정 생성 (무료)
- [ ] App Store Connect 상품 등록
- [ ] Google Play Console 상품 등록
- [ ] RevenueCat에서 상품 연결
- [ ] 클로드 코드로 앱 코드 생성
- [ ] 샌드박스 테스트 완료
- [ ] AdMob 계정 생성
- [ ] 앱스토어 출시
- [ ] AdMob 앱 등록 및 승인 대기
- [ ] 실제 광고/결제 활성화

### 광고 품질 관리

**타로 앱에 부적합한 광고 차단:**
```javascript
const BLOCKED_CATEGORIES = [
  'gambling',      // 도박
  'dating',        // 데이팅
  'politics',      // 정치
  'violent-games'  // 폭력적 게임
];
```

---

## 핵심 정리

### ✅ AdMob

- **장점**: 최고 수익 (eCPM $2.8-14)
- **단점**: 2-7일 승인 필요
- **대안**: Unity Ads로 즉시 시작 → AdMob 승인 후 전환

### ✅ RevenueCat IAP

- **장점**: 30분 구현, 크로스 플랫폼, 무료 ($2.5K까지)
- **개발 시간**: 30분~1시간
- **클로드 코드**: 완전 지원 가능

### ✅ 하이브리드 수익화

```
무료 사용자 (70%) → 광고 수익
크레딧 구매 (25%) → IAP 수익 (주 수익원)
Pro 구독 (5%) → 구독 수익 (안정적 수익)
```

### 💰 예상 수익 (1만 MAU)

- **1개월차**: $500-800 (광고만)
- **3개월차**: $1,500-2,000 (광고 + 크레딧)
- **6개월차**: $3,000-5,000 (광고 + IAP + 구독)

---

## 다음 단계

1. **지금 바로**: Unity Ads로 광고 시작 (승인 즉시)
2. **Week 2**: RevenueCat 인앱결제 추가
3. **Week 4**: AdMob 승인 받고 미디에이션 전환
4. **Month 2-3**: 수익 최적화 및 확장

**클로드 코드로 모두 구현 가능합니다!** 🚀

---

## 참고 자료

- RevenueCat 문서: https://docs.revenuecat.com
- AdMob 고객센터: https://support.google.com/admob
- React Native Purchases: https://github.com/RevenueCat/react-native-purchases
- Appodeal eCPM 벤치마크: https://appodeal.com/benchmarks

---

**작성일**: 2026-02-14  
**최종 수정**: 2026-02-14
