# AI Tarot App Design Document

> **Summary**: AI 기반 개인화 타로 운세 생성 웹앱의 기술 설계
>
> **Project**: ai-tarot-app
> **Version**: 0.1.0
> **Author**: snixk
> **Date**: 2026-02-14
> **Status**: Draft
> **Planning Doc**: [ai-tarot-app.plan.md](../01-plan/features/ai-tarot-app.plan.md)

### Pipeline References

| Phase | Document | Status |
|-------|----------|--------|
| Phase 1 | Schema Definition | N/A (Supabase SQL 직접 관리) |
| Phase 2 | Coding Conventions | Section 10 참조 |
| Phase 3 | Mockup | N/A (가이드 문서 코드 참조) |
| Phase 4 | API Spec | Section 4 참조 |

---

## 1. Overview

### 1.1 Design Goals

- Next.js 14 App Router 기반의 풀스택 PWA 아키텍처 구현
- Supabase BaaS를 활용한 인증/DB/스토리지 통합
- Claude API + Fal.ai 이미지 생성의 파이프라인 처리
- 비용 최적화를 위한 캐싱 및 일일 제한 시스템
- 모바일 퍼스트 반응형 UI (인스타그램 공유 최적화 1080x1080)

### 1.2 Design Principles

- **관심사 분리**: UI 컴포넌트 / API Routes / AI 서비스 / DB 클라이언트 명확 분리
- **폴백 패턴**: Fal.ai 실패 시 Replicate 자동 전환
- **비용 우선**: 동일 날짜+생년월일 캐싱으로 중복 API 호출 방지
- **보안 우선**: API 키 서버사이드 전용, Supabase RLS 정책 적용
- **점진적 향상**: PWA로 시작, 추후 네이티브 앱 래핑 가능

---

## 2. Architecture

### 2.1 System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         Client (Browser/PWA)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │  Login   │  │  Main    │  │  Result  │  │  Admin Dashboard │ │
│  │  Page    │  │  Page    │  │  Page    │  │  (Stats/Users)   │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┬─────────┘ │
└───────┼──────────────┼──────────────┼─────────────────┼──────────┘
        │              │              │                 │
        ▼              ▼              ▼                 ▼
┌──────────────────────────────────────────────────────────────────┐
│                    Next.js API Routes (Vercel)                    │
│  ┌──────────────┐  ┌────────────────┐  ┌───────────────────────┐│
│  │ /api/generate │  │/api/check-limit│  │  /api/admin/stats    ││
│  │              │  │                │  │  /api/admin/users    ││
│  └──────┬───────┘  └───────┬────────┘  └──────────┬────────────┘│
└─────────┼──────────────────┼───────────────────────┼────────────┘
          │                  │                       │
    ┌─────┼──────────────────┼───────────────────────┼─────┐
    │     ▼                  ▼                       ▼     │
    │  ┌─────────────────────────────────────────────────┐ │
    │  │              Supabase (BaaS)                     │ │
    │  │  ┌─────────┐  ┌──────────┐  ┌───────────────┐  │ │
    │  │  │  Auth   │  │PostgreSQL│  │   Storage      │  │ │
    │  │  │(OAuth)  │  │  (RLS)   │  │(tarot-images) │  │ │
    │  │  └─────────┘  └──────────┘  └───────────────┘  │ │
    │  └─────────────────────────────────────────────────┘ │
    │                                                       │
    │  ┌──────────────────┐  ┌────────────────────────┐    │
    │  │  Claude API      │  │  Fal.ai / Replicate    │    │
    │  │  (Text Gen)      │  │  (Image Gen)           │    │
    │  └──────────────────┘  └────────────────────────┘    │
    └───────────────────────────────────────────────────────┘
```

### 2.2 Core Data Flow: 운세 생성

```
1. User Input (birthDate)
       │
       ▼
2. POST /api/generate
       │
       ├─── Auth Check (Supabase getUser)
       │
       ├─── Cache Check (같은 날짜 + 생년월일 조합)
       │         │
       │    [HIT] └──→ Return cached readingId
       │
       ├─── Limit Check (free: 1/day, premium: unlimited)
       │
       ├─── Claude API → JSON (keywords, overall, love, wealth, luckyColor, luckyNumber, imagePrompt)
       │
       ├─── Fal.ai Image Gen (imagePrompt → 1024x1024 PNG)
       │         │
       │    [FAIL] └──→ Replicate Fallback
       │
       ├─── Save to Supabase Storage (permanent URL)
       │
       ├─── Insert to readings table
       │
       └──→ Return { readingId }
                  │
                  ▼
3. Redirect to /result/[readingId]
       │
       ├─── Fetch reading from Supabase
       ├─── Increment view_count
       └──→ Render TarotCard + ShareButtons
```

### 2.3 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| Login Page | Supabase Auth | 카카오/구글 OAuth |
| Main Page | Supabase Auth, /api/check-limit | 인증 확인, 생성 가능 여부 |
| /api/generate | Claude API, Fal.ai, Replicate, Supabase DB/Storage | 운세 생성 파이프라인 |
| /api/check-limit | Supabase DB | 구독 정보 + 일일 생성 수 확인 |
| Result Page | Supabase DB | 운세 결과 조회 |
| ShareButtons | Web Share API, Kakao SDK | SNS 공유 |
| Admin Dashboard | Supabase DB (RLS admin policy) | 통계 및 사용자 관리 |

---

## 3. Data Model

### 3.1 Entity Definitions

```typescript
// types/index.ts

export interface TarotReading {
  id: string
  userId: string
  birthDate: string              // YYYY-MM-DD
  keywords: string[]             // ["✨ 행운", "💫 변화", "🌸 만남"]
  overall: string                // 전체운 (50-70자)
  love: string                   // 애정운 (50-70자)
  wealth: string                 // 재물운 (50-70자)
  health?: string                // 건강운 (optional)
  career?: string                // 직장운 (optional)
  luckyColor: string             // HEX code (#667eea)
  luckyNumber: number            // 1-99
  imageUrl: string               // Supabase Storage URL
  imagePrompt?: string           // Fal.ai에 전달한 프롬프트
  shareCount: number
  viewCount: number
  generationTimeMs?: number      // 생성 소요 시간
  aiModelVersion?: string        // claude-sonnet-4-20250514
  createdAt: string
}

export interface Subscription {
  id: string
  userId: string
  tier: 'free' | 'premium'
  premiumUntil?: string
  dailyLimit: number             // free: 1
  totalGenerated: number
  lastGeneratedAt?: string
  referralCode: string           // 8자리 고유 코드
  referredBy?: string
  referralRewards: number
  createdAt: string
  updatedAt: string
}

export interface Share {
  id: string
  readingId: string
  userId: string
  platform: 'instagram' | 'kakao' | 'facebook' | 'twitter' | 'link'
  createdAt: string
}

export interface DailyStat {
  id: string
  statDate: string               // YYYY-MM-DD
  totalUsers: number
  newUsers: number
  activeUsers: number
  premiumUsers: number
  totalReadings: number
  cachedReadings: number
  totalShares: number
  instagramShares: number
  kakaoShares: number
  claudeApiCalls: number
  imageGenerations: number
  estimatedCostUsd: number
  newSubscriptions: number
  revenueKrw: number
}

// Claude API 응답 구조
export interface ClaudeResponse {
  keywords: string[]
  overall: string
  love: string
  wealth: string
  luckyColor: string
  luckyNumber: number
  imagePrompt: string
}
```

### 3.2 Entity Relationships

```
[auth.users] 1 ──── 1 [subscriptions]     (자동 생성: handle_new_user 트리거)
     │
     └──── 1 ──── N [readings]
                       │
                       └── 1 ──── N [shares]

[admin_logs]  N ──── 1 [auth.users] (admin_id)
[daily_stats] (독립 - 일별 집계)
```

### 3.3 Database Schema (Supabase PostgreSQL)

**5개 테이블 + 3개 트리거 + 2개 유틸리티 함수**

| Table | Purpose | RLS Policy |
|-------|---------|-----------|
| `subscriptions` | 사용자 구독 정보 | 본인 데이터만 SELECT/UPDATE |
| `readings` | 타로 운세 기록 | 본인 데이터만 SELECT/INSERT |
| `shares` | 공유 추적 | 본인 데이터만 SELECT/INSERT |
| `admin_logs` | 관리자 활동 로그 | admin 이메일만 SELECT |
| `daily_stats` | 일별 집계 통계 | admin 이메일만 SELECT |

**Triggers:**

| Trigger | Event | Action |
|---------|-------|--------|
| `on_auth_user_created` | User signup | subscriptions 레코드 자동 생성 + referral_code 발급 |
| `on_reading_created` | Reading insert | subscription.total_generated + 1, last_generated_at 갱신 |
| `on_share_created` | Share insert | reading.share_count + 1 |

**Utility Functions:**

| Function | Purpose |
|----------|---------|
| `update_daily_stats()` | 오늘 통계 집계 (cron 또는 수동) |
| `can_generate_reading(user_id)` | 생성 가능 여부 확인 (premium/free 분기) |

**Indexes:**

| Index | Table | Column(s) |
|-------|-------|-----------|
| `idx_readings_user_id` | readings | user_id |
| `idx_readings_created_at` | readings | created_at DESC |
| `idx_subscriptions_user_id` | subscriptions | user_id |
| `idx_subscriptions_tier` | subscriptions | tier |
| `idx_shares_reading_id` | shares | reading_id |
| `idx_shares_platform` | shares | platform |
| `idx_daily_stats_date` | daily_stats | stat_date DESC |

**Unique Constraint:**
- `readings(user_id, birth_date, DATE(created_at))` - 같은 날 동일 생년월일 중복 방지 (캐싱)

**Storage Bucket:**
- Name: `tarot-images`
- Public: Yes
- File size limit: 5MB
- Allowed MIME: `image/png`, `image/jpeg`, `image/webp`

---

## 4. API Specification

### 4.1 Endpoint List

| Method | Path | Description | Auth | Rate Limit |
|--------|------|-------------|------|-----------|
| POST | `/api/generate` | 운세 생성 (텍스트 + 이미지) | Required | Free: 1/day |
| GET | `/api/check-limit` | 생성 가능 여부 확인 | Required | - |
| GET | `/api/admin/stats` | 일별 통계 (최근 30일) | Admin only | - |
| GET | `/api/admin/users` | 사용자 목록 | Admin only | - |

### 4.2 `POST /api/generate`

**Request:**
```json
{
  "birthDate": "1990-05-15"
}
```

**Response (200 OK):**
```json
{
  "readingId": "uuid-string",
  "cached": false
}
```

**Response (200 OK, Cached):**
```json
{
  "readingId": "uuid-string",
  "cached": true
}
```

**Error Responses:**

| Status | Body | Condition |
|--------|------|-----------|
| 400 | `{ "error": "생년월일을 입력해주세요" }` | birthDate 누락 |
| 401 | `{ "error": "로그인이 필요합니다" }` | 미인증 |
| 404 | `{ "error": "구독 정보를 찾을 수 없습니다" }` | subscription 없음 |
| 429 | `{ "error": "오늘의 무료 생성 횟수를 모두 사용했습니다" }` | 일일 제한 초과 |
| 500 | `{ "error": "운세 생성 중 오류가 발생했습니다" }` | 서버 에러 |

**Internal Processing Pipeline:**
```
1. Auth check → 2. Parse birthDate → 3. Cache lookup
→ 4. Limit check → 5. Claude text gen → 6. Fal.ai image gen (→ Replicate fallback)
→ 7. Storage save → 8. DB insert → 9. Return readingId
```

### 4.3 `GET /api/check-limit`

**Response (200 OK):**
```json
{
  "canGenerate": true,
  "isPremium": false,
  "remainingToday": 1
}
```

### 4.4 `GET /api/admin/stats`

**Response (200 OK):**
```json
[
  {
    "stat_date": "2026-02-14",
    "total_users": 150,
    "new_users": 12,
    "active_users": 45,
    "premium_users": 8,
    "total_readings": 52,
    "total_shares": 18,
    "instagram_shares": 10,
    "kakao_shares": 8
  }
]
```

---

## 5. UI/UX Design

### 5.1 Screen Map

```
┌─────────────────────────────────────────────────────────┐
│                     App Route Structure                   │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  (auth)/                                                  │
│  ├── /login              소셜 로그인 페이지              │
│  └── /callback           OAuth 콜백 처리                  │
│                                                           │
│  (main)/                                                  │
│  ├── /                   메인 (생년월일 입력)             │
│  ├── /loading            로딩 애니메이션                   │
│  └── /result/[id]        운세 결과 + 공유 버튼            │
│                                                           │
│  admin/                                                   │
│  ├── /admin              대시보드 (통계 카드 + 최근 활동)  │
│  ├── /admin/users        사용자 관리 테이블               │
│  └── /admin/stats        통계 차트 (recharts)             │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### 5.2 User Flow

```
[앱 접속] → [로그인 확인]
               │
          [미로그인] → /login → [카카오/구글 OAuth] → /callback → /
               │
          [로그인됨] → / (메인)
               │
          [생년월일 입력] → [생성 가능?]
               │                  │
          [불가] ← 에러 메시지    [가능]
               │                  │
               │            POST /api/generate
               │                  │
               │            /loading (애니메이션)
               │                  │
               │            /result/[id]
               │                  │
               │            ┌─────┼─────┐
               │      [인스타] [카카오] [링크복사]
               │                  │
               └──── [처음으로] ←──┘
```

### 5.3 Component List

| Component | File | Layer | Responsibility |
|-----------|------|-------|----------------|
| `DatePicker` | `components/DatePicker.tsx` | Presentation | 생년월일 선택 (HTML date input + Calendar 아이콘) |
| `TarotCard` | `components/TarotCard.tsx` | Presentation | 운세 결과 카드 (이미지 + 키워드 + 운세 텍스트 + 행운 요소) |
| `ShareButtons` | `components/ShareButtons.tsx` | Presentation | 인스타/카카오/링크 공유 버튼 그룹 |
| `LoadingAnimation` | `components/LoadingAnimation.tsx` | Presentation | 카드 뒤집기 애니메이션 + 메시지 로테이션 + 프로그레스 바 |
| `AdminSidebar` | `components/AdminSidebar.tsx` | Presentation | 관리자 사이드 내비게이션 |
| `Button` | `components/ui/Button.tsx` | UI Primitive | 공통 버튼 |
| `Input` | `components/ui/Input.tsx` | UI Primitive | 공통 입력 필드 |
| `Card` | `components/ui/Card.tsx` | UI Primitive | 공통 카드 컨테이너 |
| `LoadingSpinner` | `components/ui/LoadingSpinner.tsx` | UI Primitive | 공통 로딩 스피너 |

### 5.4 Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| Primary Gradient | `from-purple-900 via-indigo-900 to-blue-900` | 메인 배경 |
| CTA Gradient | `from-purple-500 to-pink-500` | 생성 버튼, 인스타 공유 |
| Card Background | `white/10 backdrop-blur-lg` | 글래스모피즘 카드 |
| Text Primary | `text-white` | 메인 페이지 텍스트 |
| Text Secondary | `text-purple-200` | 보조 텍스트 |
| Error | `bg-red-500/20 border-red-500/50 text-red-200` | 에러 메시지 |
| Border Radius | `rounded-3xl` (카드), `rounded-xl` (버튼/입력) | 모서리 |

---

## 6. Error Handling

### 6.1 Error Code Definition

| Code | Location | Message | Handling |
|------|----------|---------|----------|
| 400 | /api/generate | 생년월일을 입력해주세요 | 클라이언트 입력 검증 |
| 401 | /api/generate, /api/check-limit | 로그인이 필요합니다 | /login 리다이렉트 |
| 404 | /api/generate | 구독 정보를 찾을 수 없습니다 | 에러 메시지 표시 |
| 429 | /api/generate | 오늘의 무료 생성 횟수를 모두 사용했습니다 | 프리미엄 안내 메시지 |
| 500 | All APIs | 운세 생성 중 오류가 발생했습니다 | 에러 메시지 + console.error |

### 6.2 AI Service Error Handling

| Service | Error Type | Handling |
|---------|-----------|----------|
| Claude API | Response not text type | throw Error('Unexpected response type') |
| Claude API | JSON parse failure | JSON 클리닝 (```json 제거) 후 재파싱 |
| Fal.ai | Image generation failed | Replicate 폴백 자동 전환 |
| Fal.ai | No images in response | throw Error('No image generated') |
| Replicate | Generation failed | 500 에러 반환 |
| Supabase Storage | Upload failed | throw error (상위에서 500 처리) |

### 6.3 Client-side Error Handling

```
try {
  // API 호출
} catch (err) {
  setError(err instanceof Error ? err.message : '오류가 발생했습니다')
  setLoading(false)
}
```

---

## 7. Security Considerations

- [x] **RLS 정책**: 모든 5개 테이블에 Row Level Security 활성화
  - 사용자: 본인 데이터만 접근 (auth.uid() = user_id)
  - 관리자: admin 이메일 검증으로 통계/로그 접근
- [x] **API 키 보호**: ANTHROPIC_API_KEY, FAL_API_KEY, REPLICATE_API_TOKEN, SUPABASE_SERVICE_ROLE_KEY는 Server-only
- [x] **클라이언트 노출 제한**: NEXT_PUBLIC_ 접두사만 클라이언트에 노출 (SUPABASE_URL, ANON_KEY)
- [x] **인증 검증**: 모든 API Route에서 supabase.auth.getUser() 확인
- [x] **관리자 보호**: admin 라우트에서 이메일 기반 접근 제어
- [ ] **Rate Limiting**: 추후 미들웨어로 구현 (MVP에서는 일일 제한으로 대체)
- [ ] **입력 검증**: birthDate 형식 검증 (YYYY-MM-DD, 미래 날짜 방지)
- [x] **Storage 보안**: tarot-images 버킷 5MB 제한, MIME 타입 제한

---

## 8. Test Plan

### 8.1 Test Scope

| Type | Target | Method |
|------|--------|--------|
| Manual E2E | 전체 생성 플로우 | 브라우저 수동 테스트 |
| Manual E2E | 소셜 로그인 | 카카오/구글 실제 OAuth 테스트 |
| Manual E2E | 공유 기능 | 모바일 브라우저 실제 공유 테스트 |
| Manual E2E | 관리자 대시보드 | admin 이메일 로그인 후 확인 |
| API Test | /api/generate | curl 또는 Postman |
| API Test | /api/check-limit | curl 또는 Postman |
| Performance | 전체 생성 시간 | generation_time_ms 로그 확인 |
| PWA | 설치 가능성 | Lighthouse PWA audit |

### 8.2 Key Test Cases

- [ ] **Happy Path**: 로그인 → 생년월일 입력 → 생성 → 결과 확인 → 공유
- [ ] **Cache Hit**: 동일 날짜+생년월일 재요청 시 캐시 반환 확인
- [ ] **Daily Limit**: 무료 사용자 2번째 생성 시 429 에러 확인
- [ ] **Fal.ai Fallback**: Fal.ai 실패 시 Replicate 이미지 생성 확인
- [ ] **Auth Guard**: 미로그인 상태에서 생성 시 401 + /login 리다이렉트
- [ ] **Admin Access**: 비관리자 이메일로 /admin 접근 시 / 리다이렉트
- [ ] **Mobile Responsive**: iOS Safari, Android Chrome에서 UI 확인
- [ ] **PWA Install**: 홈 화면 추가 → 앱 모드 실행 확인

---

## 9. Clean Architecture

### 9.1 Layer Structure (Dynamic Level)

| Layer | Responsibility | Location |
|-------|---------------|----------|
| **Presentation** | 페이지, UI 컴포넌트, 사용자 상호작용 | `app/`, `components/` |
| **Application** | API Routes, 비즈니스 로직 오케스트레이션 | `app/api/` |
| **Domain** | 엔티티 타입, 비즈니스 규칙 | `types/` |
| **Infrastructure** | Supabase 클라이언트, AI 서비스, 스토리지 | `lib/` |

### 9.2 Dependency Rules

```
┌─────────────────────────────────────────────────────────────┐
│                    Dependency Direction                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│   app/ (Pages)                                                │
│     └──→ components/ (UI)                                    │
│            └──→ lib/supabase/client.ts (Client-side DB)      │
│                                                               │
│   app/api/ (API Routes)                                      │
│     └──→ lib/supabase/server.ts (Server-side DB)            │
│     └──→ lib/ai/claude.ts (Text Generation)                 │
│     └──→ lib/ai/fal.ts (Image Generation)                   │
│     └──→ lib/ai/replicate.ts (Image Fallback)               │
│     └──→ lib/utils/cache.ts (Cache Logic)                   │
│     └──→ lib/utils/storage.ts (Storage)                     │
│                                                               │
│   types/ (Domain)                                             │
│     └──→ 외부 의존성 없음 (순수 타입)                         │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 9.3 File Import Rules

| From | Can Import | Cannot Import |
|------|-----------|---------------|
| `app/` (Pages) | `components/`, `lib/supabase/client.ts`, `types/` | `lib/ai/`, `lib/supabase/server.ts` |
| `app/api/` (Routes) | `lib/`, `types/` | `components/` |
| `components/` | `lib/supabase/client.ts`, `types/` | `lib/ai/`, `app/api/` |
| `lib/ai/` | `types/` | `components/`, `app/` |
| `lib/supabase/` | `types/` | `components/`, `app/`, `lib/ai/` |
| `types/` | Nothing | Everything else |

### 9.4 Feature Layer Assignment

| Component | Layer | Location |
|-----------|-------|----------|
| HomePage, ResultPage, AdminPages | Presentation | `app/` |
| TarotCard, ShareButtons, DatePicker | Presentation | `components/` |
| /api/generate, /api/check-limit | Application | `app/api/` |
| TarotReading, Subscription, ClaudeResponse | Domain | `types/index.ts` |
| createClient, createServerClient | Infrastructure | `lib/supabase/` |
| generateTarotReading | Infrastructure | `lib/ai/claude.ts` |
| generateTarotImage | Infrastructure | `lib/ai/fal.ts` |
| generateTarotImageFallback | Infrastructure | `lib/ai/replicate.ts` |
| saveImageToStorage | Infrastructure | `lib/utils/storage.ts` |
| getCachedReading | Infrastructure | `lib/utils/cache.ts` |

---

## 10. Coding Convention

### 10.1 Naming Conventions

| Target | Rule | Example |
|--------|------|---------|
| Components | PascalCase | `TarotCard`, `ShareButtons`, `DatePicker` |
| Pages | page.tsx (App Router) | `app/(main)/page.tsx` |
| API Routes | route.ts (App Router) | `app/api/generate/route.ts` |
| Hooks | camelCase, use 접두사 | `useRouter`, `useState` |
| Utility functions | camelCase | `generateTarotReading()`, `getCachedReading()` |
| Types/Interfaces | PascalCase | `TarotReading`, `ClaudeResponse` |
| Constants | UPPER_SNAKE_CASE | `ADMIN_EMAIL`, `MAX_DAILY_LIMIT` |
| CSS classes | Tailwind utility | `bg-gradient-to-br from-purple-900` |
| DB columns | snake_case | `user_id`, `birth_date`, `created_at` |
| TS properties | camelCase | `userId`, `birthDate`, `createdAt` |

### 10.2 Import Order

```typescript
// 1. React / Next.js
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'

// 2. External libraries
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

// 3. Internal modules
import { createClient } from '@/lib/supabase/client'
import TarotCard from '@/components/TarotCard'

// 4. Types
import { TarotReading } from '@/types'
```

### 10.3 Environment Variables

| Prefix | Scope | Variables |
|--------|-------|-----------|
| `NEXT_PUBLIC_` | Client | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `APP_URL` |
| (none) | Server only | `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `FAL_API_KEY`, `REPLICATE_API_TOKEN`, `ADMIN_EMAIL` |

### 10.4 Component Conventions

| Item | Convention |
|------|-----------|
| Client components | `'use client'` directive 최상단 |
| Server components | 기본값 (directive 없음) |
| State management | React Hooks + Context (별도 상태 라이브러리 X) |
| Error handling | try-catch + setError 패턴 (클라이언트), NextResponse.json (API) |
| Loading states | useState `loading` + LoadingSpinner/LoadingAnimation |
| Animation | Framer Motion (`motion.div`, `AnimatePresence`) |
| Icons | lucide-react |

---

## 11. Implementation Guide

### 11.1 File Structure (전체)

```
ai-tarot-app/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx          # 소셜 로그인 UI
│   │   └── callback/route.ts       # OAuth 콜백 핸들러
│   ├── (main)/
│   │   ├── page.tsx                # 메인 (생년월일 입력)
│   │   ├── loading/page.tsx        # 로딩 애니메이션
│   │   └── result/[id]/page.tsx    # 결과 페이지
│   ├── admin/
│   │   ├── layout.tsx              # 관리자 인증 레이아웃
│   │   ├── page.tsx                # 대시보드
│   │   ├── users/page.tsx          # 사용자 관리
│   │   └── stats/page.tsx          # 통계 차트
│   ├── api/
│   │   ├── generate/route.ts       # 운세 생성 API
│   │   ├── check-limit/route.ts    # 생성 제한 확인 API
│   │   └── admin/
│   │       └── stats/route.ts      # 통계 API
│   ├── layout.tsx                  # 루트 레이아웃 (메타데이터, PWA)
│   └── globals.css                 # 글로벌 스타일
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   └── LoadingSpinner.tsx
│   ├── TarotCard.tsx
│   ├── ShareButtons.tsx
│   ├── DatePicker.tsx
│   ├── LoadingAnimation.tsx
│   └── AdminSidebar.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Browser client
│   │   ├── server.ts               # Server component client
│   │   └── admin.ts                # Service role client
│   ├── ai/
│   │   ├── claude.ts               # Claude text generation
│   │   ├── fal.ts                  # Fal.ai image generation
│   │   └── replicate.ts            # Replicate fallback
│   └── utils/
│       ├── cache.ts                # Reading cache logic
│       └── storage.ts              # Supabase Storage helper
├── types/
│   └── index.ts                    # All TypeScript interfaces
├── public/
│   ├── manifest.json               # PWA manifest
│   ├── icon-192.png
│   ├── icon-512.png
│   └── og-image.png
├── .env.local                      # Environment variables
├── next.config.js                  # Next.js + PWA config
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### 11.2 Implementation Order

```
Phase 1: Foundation (Day 1)
─────────────────────────────
1. [ ] Next.js 프로젝트 생성 (create-next-app)
2. [ ] npm 패키지 설치 (supabase, fal, framer-motion, etc.)
3. [ ] .env.local 환경변수 설정
4. [ ] types/index.ts 타입 정의
5. [ ] lib/supabase/ 클라이언트 3종 설정 (client, server, admin)
6. [ ] Supabase SQL 스키마 실행 (5 tables + triggers + functions)
7. [ ] Supabase Storage bucket 생성 (tarot-images)
8. [ ] Supabase Auth OAuth 설정 (카카오, 구글)

Phase 2: Auth + Core UI (Day 2-3)
─────────────────────────────
9. [ ] app/layout.tsx (메타데이터, PWA 설정)
10. [ ] app/globals.css (Tailwind 기본 스타일)
11. [ ] components/ui/ (Button, Input, Card, LoadingSpinner)
12. [ ] app/(auth)/login/page.tsx (소셜 로그인)
13. [ ] app/(auth)/callback/route.ts (OAuth 콜백)
14. [ ] components/DatePicker.tsx
15. [ ] app/(main)/page.tsx (메인 페이지)
16. [ ] components/LoadingAnimation.tsx

Phase 3: AI Backend (Day 4-5)
─────────────────────────────
17. [ ] lib/ai/claude.ts (Claude 운세 텍스트 생성)
18. [ ] lib/ai/fal.ts (Fal.ai 이미지 생성)
19. [ ] lib/ai/replicate.ts (Replicate 폴백)
20. [ ] lib/utils/storage.ts (Supabase Storage 저장)
21. [ ] lib/utils/cache.ts (캐싱 로직)
22. [ ] app/api/check-limit/route.ts
23. [ ] app/api/generate/route.ts (전체 파이프라인 통합)

Phase 4: Result + Sharing + Admin (Day 6)
─────────────────────────────
24. [ ] components/TarotCard.tsx (결과 카드)
25. [ ] app/(main)/result/[id]/page.tsx (결과 페이지)
26. [ ] components/ShareButtons.tsx (공유 버튼)
27. [ ] components/AdminSidebar.tsx
28. [ ] app/admin/layout.tsx (관리자 인증)
29. [ ] app/admin/page.tsx (대시보드)
30. [ ] app/admin/users/page.tsx
31. [ ] app/api/admin/stats/route.ts
32. [ ] app/admin/stats/page.tsx (차트)

Phase 5: PWA + Deploy (Day 7)
─────────────────────────────
33. [ ] next.config.js (PWA 설정)
34. [ ] public/manifest.json
35. [ ] PWA 아이콘 생성 (192x192, 512x512)
36. [ ] OG 이미지 생성
37. [ ] Vercel 프로젝트 연결 + 환경변수 설정
38. [ ] Vercel 프로덕션 배포
39. [ ] 전체 플로우 E2E 테스트
```

### 11.3 Package Dependencies

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.x",
    "@supabase/auth-helpers-nextjs": "^0.x",
    "@fal-ai/serverless-client": "^0.x",
    "@anthropic-ai/sdk": "^0.x",
    "replicate": "^0.x",
    "framer-motion": "^11.x",
    "date-fns": "^3.x",
    "lucide-react": "^0.x",
    "recharts": "^2.x",
    "@vercel/analytics": "^1.x",
    "next-pwa": "^5.x"
  },
  "devDependencies": {
    "@types/node": "^20.x",
    "prettier": "^3.x",
    "prettier-plugin-tailwindcss": "^0.x"
  }
}
```

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-14 | Initial design based on Plan document and AI-Tarot-App-Guide.md | snixk |
