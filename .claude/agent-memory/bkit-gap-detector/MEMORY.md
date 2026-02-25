# Gap Detector Memory - ai-tarot-app

## Project Structure
- Next.js 14 App Router + Supabase + Claude API + Fal.ai/Replicate + Capacitor + AdMob
- Architecture: Dynamic Level (4-layer: Presentation/Application/Domain/Infrastructure)
- Design doc: `docs/02-design/features/ai-tarot-app.design.md`
- Analysis docs: `docs/03-analysis/ai-tarot-app.analysis.md` (v0.7), `ai-tarot-app.analysis.v0.5.md`

## Latest Analysis (2026-02-24, v0.7 Optional Login Conversion)
- Plan: bubbly-mixing-metcalfe.md (mandatory -> optional login)
- Overall Match Rate: 98% (100% plan items, -2% for out-of-scope login redirects)
- Change 1 (13 feature pages): 100% -- zero login redirects in submit handlers
- Change 2 (13 API routes): 100% -- all allow anonymous, conditional DB save with `if (user)`
- Change 3 (Main page inline result): 100% -- dual response (readingId vs reading), TarotCard+SajuCard inline
- Change 4 (History login prompt): 100% -- needsLogin state, no redirect
- Change 5 (Result not-found UI): 100% -- friendly UI with login+home buttons
- Change 6 (BottomNav logout): 100% -- router.push('/') not '/login'
- Auth-required routes intact: 100% -- history/analyze, community POST, community react still 401
- Architecture compliance: 95% (getSajuInfo pure-calc imports remain)
- Convention compliance: 96% (recharts any, Kakao casts, inlineResult any)

## Gaps Found (v0.7)
- **biorhythm page** (`app/(main)/biorhythm/page.tsx:38`): still has `router.replace('/login')` -- plan said "no change" but contradicts optional-login principle
- **premium hub page** (`app/(main)/premium/page.tsx:122`): still has `router.replace('/login')` -- not mentioned in plan, blocks anonymous feature discovery

## Architecture Violations (ongoing)
- 8 pages import `getSajuInfo` from `lib/utils/saju.ts` (pure calculation, no DB/API)
- 1 page imports `calculateDailyJinjin` from `lib/utils/daily-jinjin.ts` (pure calculation)
- 1 page imports `calculateLucky` from `lib/utils/lucky.ts` (pure calculation)
- Type-only imports from lib/ai/*-prompt.ts are NOT violations

## Remaining Items
- Dead types in types/index.ts: Payment interface (PortOne), Subscription premium fields, DailyStat payment fields
- recharts CustomTooltip `any` types (14 instances across 10 files)
- Kakao SDK `(window as any).Kakao` (2 files)
- `inlineResult` typed as `any` in main page (line 37)
- **Design doc update needed -- MAJOR rewrite required (HIGH priority)**

## Key Patterns (v0.7 -- optional login)
- Auth model: Optional login -- all features work without login
- Logged-in users: results saved to DB, cache checked, history available
- Anonymous users: results returned inline (no DB save, no cache)
- API pattern: `if (user) { cache check + DB save }` -- consistent across all 13 routes
- Generate API: dual response -- `{ readingId, cached }` for logged-in, `{ reading: {...}, cached }` for anonymous
- History/Result pages: show login-prompt UI, not hard redirect
- BottomNav: shows login/logout toggle, logout goes to '/'
- Still auth-required: history/analyze (GET 401), community POST (401), community react (401)
- Biorhythm: pure client-side but still has unnecessary login gate (GAP)
- Premium hub: navigation page but still has unnecessary login gate (GAP)
