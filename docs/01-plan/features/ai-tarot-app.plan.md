# AI Tarot App Planning Document

> **Summary**: AI 기반 개인화 타로 운세 생성 및 SNS 공유 웹앱
>
> **Project**: ai-tarot-app
> **Version**: 0.1.0
> **Author**: snixk
> **Date**: 2026-02-14
> **Status**: Draft

---

## 1. Overview

### 1.1 Purpose

생년월일 기반으로 AI(Claude)가 개인화된 타로 운세 텍스트를 생성하고, AI(Fal.ai)가 맞춤 타로 카드 이미지를 생성하여 SNS(인스타그램, 카카오톡) 공유가 가능한 웹앱 서비스를 개발한다.

### 1.2 Background

- 타로/운세 콘텐츠는 MZ세대에서 높은 관심도를 보이며 SNS 공유가 활발함
- AI 이미지 생성 기술을 활용하여 매번 새로운 카드 이미지를 제공하는 차별화된 경험
- PWA 기반으로 앱 설치 없이 사용 가능하며, 추후 네이티브 앱 래핑 가능
- Freemium 수익 모델 (무료 1회/일 + 프리미엄 무제한 월 5,000원)

### 1.3 Related Documents

- 초기 기획서: `docs/AI-Tarot-App-Guide.md`

---

## 2. Scope

### 2.1 In Scope (MVP)

- [ ] 소셜 로그인 (카카오, 구글)
- [ ] 생년월일 입력 UI
- [ ] AI 운세 텍스트 생성 (Claude API)
- [ ] AI 타로 카드 이미지 생성 (Fal.ai + Replicate 폴백)
- [ ] 운세 결과 페이지 (전체운, 애정운, 재물운, 행운 요소)
- [ ] SNS 공유 (인스타그램, 카카오톡, 링크 복사)
- [ ] 무료/프리미엄 구독 구분 (일일 생성 제한)
- [ ] 관리자 대시보드 (통계, 사용자 관리)
- [ ] PWA 설정 (오프라인 접근, 앱 설치)
- [ ] Vercel 배포

### 2.2 Out of Scope (Post-MVP)

- 결제 시스템 (포트원 연동)
- 과거 운세 히스토리 조회
- 사주 풀이 / 꿈해몽 / 별자리 운세
- A/B 테스팅
- 네이티브 앱 래핑 (Expo WebView)
- 인플루언서 마케팅 연동
- 다국어 지원

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | 카카오/구글 소셜 로그인 | High | Pending |
| FR-02 | 생년월일 입력 폼 (DatePicker) | High | Pending |
| FR-03 | Claude API로 운세 텍스트 생성 (JSON 응답) | High | Pending |
| FR-04 | Fal.ai로 타로 카드 이미지 생성 (1024x1024) | High | Pending |
| FR-05 | Replicate 이미지 생성 폴백 | Medium | Pending |
| FR-06 | 운세 결과 페이지 (키워드, 전체운, 애정운, 재물운, 행운색/숫자) | High | Pending |
| FR-07 | Supabase Storage에 이미지 영구 저장 | High | Pending |
| FR-08 | 동일 날짜+생년월일 캐싱 (비용 절감) | Medium | Pending |
| FR-09 | 무료 사용자 일일 1회 생성 제한 | High | Pending |
| FR-10 | 프리미엄 사용자 무제한 생성 | Medium | Pending |
| FR-11 | 인스타그램 공유 (Web Share API + 이미지 다운로드 폴백) | High | Pending |
| FR-12 | 카카오톡 공유 (Kakao SDK) | High | Pending |
| FR-13 | 링크 복사 공유 | Medium | Pending |
| FR-14 | 관리자 대시보드 (총 사용자, 운세 생성 수, 공유 수, 프리미엄 수) | Medium | Pending |
| FR-15 | 관리자 사용자 목록 및 관리 | Medium | Pending |
| FR-16 | 관리자 일별 통계 차트 (recharts) | Low | Pending |
| FR-17 | 공유 시 카운트 추적 | Low | Pending |
| FR-18 | 추천인 코드 시스템 (referral_code) | Low | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Performance | 운세 생성 전체 소요 시간 < 15초 | API 응답 시간 로깅 (generation_time_ms) |
| Performance | 페이지 초기 로드 < 3초 | Lighthouse, Vercel Analytics |
| Security | Supabase RLS 정책 적용 (사용자별 데이터 격리) | RLS 정책 검증 |
| Security | API 키 서버사이드 전용 (클라이언트 노출 방지) | 환경변수 분리 확인 |
| Scalability | DAU 1,000명 기준 안정 동작 | 비용 예측 및 모니터링 |
| UX | 모바일 최적화 (반응형 디자인) | iOS Safari, Android Chrome 테스트 |
| UX | PWA 설치 가능 | Lighthouse PWA 점수 |
| Availability | Vercel 99.9% SLA | Vercel 모니터링 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] 모든 FR-01 ~ FR-15 (High/Medium) 기능 구현 완료
- [ ] 소셜 로그인 플로우 정상 동작
- [ ] 운세 생성 → 이미지 생성 → 결과 표시 전체 플로우 동작
- [ ] 공유 기능 (인스타그램, 카카오톡) 정상 동작
- [ ] 관리자 대시보드 접근 및 통계 확인 가능
- [ ] PWA 매니페스트 및 서비스워커 설정 완료
- [ ] Vercel 프로덕션 배포 성공

### 4.2 Quality Criteria

- [ ] TypeScript strict mode 적용
- [ ] Lint 에러 0건
- [ ] 빌드 성공
- [ ] 모바일 브라우저 호환성 테스트 통과 (iOS Safari, Android Chrome)
- [ ] Lighthouse Performance > 80

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| AI API 비용 초과 (Claude + Fal.ai) | High | Medium | 캐싱 전략 (동일 날짜+생년월일), 일일 생성 제한 |
| Fal.ai 이미지 생성 실패/지연 | Medium | Medium | Replicate 폴백 구현 (FR-05) |
| 소셜 로그인 OAuth 설정 복잡성 | Medium | High | Supabase Auth 기본 제공 기능 활용 |
| 카카오 SDK 인스타그램 공유 제약 | Medium | Medium | Web Share API 우선, 이미지 다운로드 폴백 |
| Supabase 무료 플랜 한도 초과 | Medium | Low | Storage 5MB 제한 설정, 이미지 최적화 |
| Claude JSON 파싱 실패 | Low | Medium | JSON 클리닝 로직, 재시도 메커니즘 |

---

## 6. Architecture Considerations

### 6.1 Project Level Selection

| Level | Characteristics | Recommended For | Selected |
|-------|-----------------|-----------------|:--------:|
| **Starter** | Simple structure | Static sites, portfolios | |
| **Dynamic** | Feature-based modules, BaaS integration | Web apps with backend, SaaS MVPs | **V** |
| **Enterprise** | Strict layer separation, microservices | High-traffic systems | |

**선택 근거**: Supabase BaaS를 활용한 풀스택 웹앱으로 Dynamic 레벨이 적합. 소셜 로그인, DB, Storage, RLS 등 BaaS 기능을 핵심으로 사용.

### 6.2 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| Framework | Next.js / React / Vue | **Next.js 14 (App Router)** | SSR/SSG, API Routes, 이미지 최적화 |
| Language | TypeScript / JavaScript | **TypeScript** | 타입 안전성, IDE 지원 |
| Styling | Tailwind / CSS Modules / styled-components | **Tailwind CSS** | 빠른 개발 속도, 유틸리티 클래스 |
| Animation | Framer Motion / CSS | **Framer Motion** | 선언적 애니메이션, React 통합 |
| State | Context / Zustand / Redux | **React Hooks + Context API** | 복잡도 낮음, 별도 라이브러리 불필요 |
| Backend | Supabase / Firebase / Custom | **Supabase** | Auth, DB, Storage 통합, RLS, PostgreSQL |
| AI Text | Claude / GPT-4 | **Claude Sonnet** | 한국어 품질 우수, JSON 응답 안정 |
| AI Image | Fal.ai / Replicate / DALL-E | **Fal.ai (Primary) + Replicate (Fallback)** | Flux Pro 모델 품질, 폴백 안전성 |
| Hosting | Vercel / AWS / Netlify | **Vercel** | Next.js 최적화, 무료 플랜, 빠른 배포 |
| Charts | recharts / Chart.js / D3 | **recharts** | React 네이티브, 관리자 대시보드 전용 |

### 6.3 Clean Architecture Approach

```
Selected Level: Dynamic

ai-tarot-app/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # 인증 그룹
│   │   ├── login/page.tsx
│   │   └── callback/route.ts
│   ├── (main)/                   # 메인 그룹
│   │   ├── page.tsx              # 메인 (생년월일 입력)
│   │   ├── loading/page.tsx      # 로딩 애니메이션
│   │   └── result/[id]/page.tsx  # 결과 페이지
│   ├── admin/                    # 관리자 페이지
│   │   ├── layout.tsx            # 관리자 인증 레이아웃
│   │   ├── page.tsx              # 대시보드
│   │   ├── users/page.tsx
│   │   └── stats/page.tsx
│   ├── api/                      # API Routes
│   │   ├── generate/route.ts     # 운세 생성
│   │   ├── check-limit/route.ts  # 생성 제한 확인
│   │   └── admin/                # 관리자 API
│   ├── layout.tsx                # 루트 레이아웃
│   └── globals.css
├── components/                   # 공유 컴포넌트
│   ├── ui/                       # 기본 UI 컴포넌트
│   ├── TarotCard.tsx
│   ├── ShareButtons.tsx
│   ├── DatePicker.tsx
│   ├── LoadingAnimation.tsx
│   └── AdminSidebar.tsx
├── lib/                          # 유틸리티 및 서비스
│   ├── supabase/                 # Supabase 클라이언트
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── admin.ts
│   ├── ai/                       # AI 서비스
│   │   ├── claude.ts
│   │   ├── fal.ts
│   │   └── replicate.ts
│   └── utils/                    # 유틸리티
│       ├── cache.ts
│       ├── storage.ts
│       └── validators.ts
├── types/                        # 타입 정의
│   └── index.ts
└── public/                       # 정적 리소스
    ├── manifest.json
    └── icons/
```

---

## 7. Convention Prerequisites

### 7.1 Existing Project Conventions

- [ ] `CLAUDE.md` has coding conventions section
- [ ] `docs/01-plan/conventions.md` exists (Phase 2 output)
- [ ] ESLint configuration (`.eslintrc.*`)
- [ ] Prettier configuration (`.prettierrc`)
- [x] TypeScript configuration (`tsconfig.json`) - Next.js 기본 제공

### 7.2 Conventions to Define/Verify

| Category | Current State | To Define | Priority |
|----------|---------------|-----------|:--------:|
| **Naming** | Missing | 컴포넌트: PascalCase, 유틸: camelCase, 파일: kebab-case | High |
| **Folder structure** | Missing | App Router 기반 그룹 라우팅 | High |
| **Import order** | Missing | React > Next > 외부라이브러리 > 내부모듈 > 타입 | Medium |
| **Environment variables** | Missing | NEXT_PUBLIC_ 접두사 규칙 | High |
| **Error handling** | Missing | try-catch + NextResponse 패턴 | Medium |

### 7.3 Environment Variables Needed

| Variable | Purpose | Scope | To Be Created |
|----------|---------|-------|:-------------:|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | Client | V |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 공개 키 | Client | V |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 서비스 키 | Server | V |
| `ANTHROPIC_API_KEY` | Claude API 키 | Server | V |
| `FAL_API_KEY` | Fal.ai API 키 | Server | V |
| `REPLICATE_API_TOKEN` | Replicate API 토큰 | Server | V |
| `NEXT_PUBLIC_APP_URL` | 앱 공개 URL | Client | V |
| `ADMIN_EMAIL` | 관리자 이메일 | Server | V |

---

## 8. Implementation Phases

### Phase 1: 프로젝트 초기화 (Day 1)
- Next.js 프로젝트 생성 및 패키지 설치
- Supabase 프로젝트 생성 및 DB 스키마 실행
- 환경변수 설정
- 프로젝트 구조 세팅

### Phase 2: 인증 및 핵심 UI (Day 2-3)
- Supabase Auth 소셜 로그인 (카카오, 구글)
- 메인 페이지 (생년월일 입력)
- 로딩 애니메이션 페이지
- 결과 페이지 UI

### Phase 3: AI 백엔드 (Day 4-5)
- Claude API 운세 텍스트 생성
- Fal.ai 이미지 생성 + Replicate 폴백
- Supabase Storage 이미지 저장
- 캐싱 로직 구현
- 생성 API (`/api/generate`) 통합
- 일일 제한 체크 API (`/api/check-limit`)

### Phase 4: 공유 및 관리자 (Day 6)
- 인스타그램/카카오톡/링크 공유 기능
- 관리자 레이아웃 및 인증
- 대시보드 (통계 카드 + 최근 활동)
- 사용자 관리 페이지
- 통계 차트 페이지

### Phase 5: PWA 및 배포 (Day 7)
- PWA manifest 및 서비스워커 설정
- 메타데이터 및 OG 이미지
- Vercel 배포 및 환경변수 설정
- 전체 플로우 테스트

---

## 9. Cost Estimation

### Monthly Cost (DAU 1,000 기준)

| Service | Unit Cost | Daily Usage | Monthly Cost |
|---------|-----------|-------------|-------------|
| Claude API | $0.015/요청 | 1,000 | ~$450 |
| Fal.ai | $0.025/이미지 (캐싱 50% 절감) | 500 | ~$375 |
| Supabase | Free tier | - | $0 |
| Vercel | Free tier | - | $0 |
| **Total** | | | **~$825/월** |

### Break-even Point
- 프리미엄 구독자 200명 x 5,000원 = 1,000,000원/월
- DAU 5,000명 기준 5% 전환율 달성 시 흑자

---

## 10. Next Steps

1. [ ] Plan 문서 리뷰 및 확정
2. [ ] Design 문서 작성 (`/pdca design ai-tarot-app`)
3. [ ] Supabase 프로젝트 생성 및 OAuth 설정
4. [ ] 개발 환경 구성 후 구현 시작

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-14 | Initial draft based on AI-Tarot-App-Guide.md | snixk |
