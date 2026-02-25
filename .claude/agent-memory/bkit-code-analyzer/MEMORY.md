# Code Analyzer Memory - AI Tarot App

## Project Overview
- Next.js 14 app with Supabase auth/DB, Claude AI (Anthropic SDK), Tailwind CSS, Framer Motion
- Korean-language tarot/fortune-telling app with 4 features: daily tarot, compatibility, dream interpretation, weekly fortune
- Uses `@supabase/auth-helpers-nextjs` (createRouteHandlerClient for API, createClientComponentClient for client)
- Saju (Four Pillars) calculation via `@fullstackfamily/manseryeok`

## Key Architecture Patterns
- API routes: `app/api/{feature}/route.ts` - all use POST, auth via supabase.auth.getUser()
- AI prompts: `lib/ai/{feature}-prompt.ts` - each creates its own Anthropic client (duplication issue)
- Components: `components/{Feature}Card.tsx` - display results with Framer Motion animations
- Pages: `app/(main)/{feature}/page.tsx` - client components with useState for form/result

## Known Issues (Phase 1+2 - 2026-02-15)
- 4x duplicated Anthropic client instantiation across prompt files
- No JSON parse error handling for Claude responses
- Error messages leaked to client in all API routes
- Missing input validation (birthDate format, relationshipType allowlist, dream content max length)
- `TarotReading` type in types/index.ts NOT updated for new fields (scores, time_of_day, lucky_items, warning)
- ScoreCircle/ScoreBar components duplicated between TarotCard and CompatibilityCard
- Missing DB indexes on new tables (compatibility_readings, dream_readings, weekly_readings)
- Math.random() in TarotCard.tsx render causes non-deterministic output
- `any` types used for result state in 3 pages

## File Structure
- `types/index.ts` - shared types (TarotReading, ClaudeResponse, etc.)
- `lib/ai/claude.ts` - main tarot prompt + Anthropic client
- `lib/ai/compatibility-prompt.ts`, `dream-prompt.ts`, `weekly-prompt.ts` - feature prompts
- `lib/utils/cache.ts` - reading cache check
- `lib/utils/saju.ts` - Four Pillars calculation
- `supabase-migration-phase1-2.sql` - DB migration for new tables/columns
