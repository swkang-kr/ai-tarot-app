# AI Tarot App - 남은 작업 로드맵

> PDCA Cycle #1 완료 (Match Rate: 98%) | 2026-02-15

현재 PDCA 사이클은 완료되었지만, **실제 서비스 가동**까지는 아래 작업이 남아있습니다.

## 1단계: 인프라 설정 (필수)

| # | 작업 | 위치 | 비고 |
|---|------|------|------|
| 1 | Supabase 프로젝트 생성 | [supabase.com](https://supabase.com) | 무료 tier 가능 |
| 2 | DB 스키마 배포 (5 tables + 3 triggers + indexes) | Supabase SQL Editor | Design 문서 Section 3.3 참조 |
| 3 | Storage bucket 생성 (`tarot-images`, public) | Supabase Dashboard | 5MB, PNG/JPEG/WebP |
| 4 | RLS 정책 설정 | Supabase Dashboard | 사용자별 접근 제어 |

## 2단계: OAuth / API 키 발급 (필수)

| # | 작업 | 발급처 |
|---|------|--------|
| 5 | Kakao OAuth 앱 등록 + API 키 | [Kakao Developers](https://developers.kakao.com) |
| 6 | Google OAuth Client ID | Google Cloud Console |
| 7 | Anthropic API 키 (Claude) | [Anthropic Console](https://console.anthropic.com) |
| 8 | Fal.ai API 키 | [fal.ai](https://fal.ai) |
| 9 | Replicate API 토큰 | [replicate.com](https://replicate.com) |
| 10 | `.env.local`에 실제 값 입력 | 로컬 |

## 3단계: 로컬 테스트

| # | 작업 |
|---|------|
| 11 | `npm run dev`로 전체 플로우 테스트 (로그인 → 생성 → 결과 → 공유) |
| 12 | 캐시 히트 확인 (동일 날짜+생년월일 재요청) |
| 13 | 일일 제한 확인 (무료 사용자 2번째 생성 시 429) |
| 14 | Admin 대시보드 접근 테스트 |

## 4단계: 배포

| # | 작업 |
|---|------|
| 15 | Git 저장소 생성 + 커밋 |
| 16 | Vercel 프로젝트 연결 |
| 17 | Vercel 환경변수 설정 |
| 18 | 프로덕션 배포 (`vercel --prod`) |
| 19 | Lighthouse PWA audit |

## 5단계: 개선 (Post-MVP 백로그)

| 항목 | 우선순위 |
|------|---------|
| PWA 아이콘을 실제 디자인으로 교체 | Medium |
| OG 이미지를 실제 디자인으로 교체 | Medium |
| birthDate 형식 검증 (YYYY-MM-DD) | Low |
| Generate route 리팩토링 (127줄 분리) | Low |
| Rate limiting 미들웨어 | Low |
| Kakao SDK 타입 선언 (`.d.ts`) | Low |

---

## PDCA 문서 참조

| Phase | Document |
|-------|----------|
| Plan | [ai-tarot-app.plan.md](./01-plan/features/ai-tarot-app.plan.md) |
| Design | [ai-tarot-app.design.md](./02-design/features/ai-tarot-app.design.md) |
| Analysis | [ai-tarot-app.analysis.md](./03-analysis/ai-tarot-app.analysis.md) |
| Report | [ai-tarot-app.report.md](./04-report/features/ai-tarot-app.report.md) |
