# Build Manifest

<!-- ART-XXXX registry — link every artifact to parent REQ -->

| ART-ID | Cycle | Type | Path / location | Linked REQ | Status |
|--------|-------|------|-----------------|------------|--------|
| ART-0001 | C1 | component | `src/components/auth/AuthBookShell.tsx` | REQ-0001, REQ-0004 | implemented |
| ART-0002 | C1 | component | `src/components/forms/LoginForm.tsx` | REQ-0001, REQ-0009 | implemented |
| ART-0003 | C1 | component | `src/components/forms/RegisterForm.tsx` | REQ-0001 | implemented |
| ART-0004 | C1 | api | `src/app/api/auth/` | REQ-0001 | implemented |
| ART-0005 | C1 | component | `src/components/journal/BookShelf.tsx` | REQ-0002 | implemented |
| ART-0006 | C1 | api | `src/app/api/books/route.ts` | REQ-0002, REQ-0008 | implemented |
| ART-0007 | C1 | component | `src/components/journal/BookSpread.tsx` | REQ-0003, REQ-0004, REQ-0008 | implemented |
| ART-0008 | C1 | component | `src/components/journal/LeftPage.tsx` | REQ-0003 | implemented |
| ART-0009 | C1 | component | `src/components/journal/RightPage.tsx` | REQ-0003 | implemented |
| ART-0010 | C1 | api | `src/app/api/entries/` | REQ-0003 | implemented |
| ART-0011 | C1 | component | `src/components/journal/PageFlip.tsx` | REQ-0004 | implemented |
| ART-0012 | C1 | layout | `src/app/(auth)/layout.tsx` | REQ-0001, REQ-0004 | implemented |
| ART-0013 | C1 | component | `src/components/journal/BookCover.tsx` | REQ-0005 | implemented |
| ART-0014 | C1 | page | `src/app/page.tsx` | REQ-0005 | implemented |
| ART-0015 | C1 | component | `src/components/layout/DashboardNav.tsx` | REQ-0006 | implemented |
| ART-0016 | C1 | ui | `src/components/ui/dropdown-menu.tsx` | REQ-0006 | implemented |
| ART-0017 | C1 | api | `src/app/api/health/route.ts` | REQ-0006, REQ-0019 | implemented |
| ART-0018 | C1 | lib | `src/lib/query-keys.ts` | REQ-0007 | implemented |
| ART-0019 | C1 | lib | `src/lib/journal-api.ts` | REQ-0007 | implemented |
| ART-0020 | C1 | seed | `prisma/seed.ts`, register route seed | REQ-0009, REQ-0025 | implemented |
| ART-0021 | C1 | api | `src/app/api/ai/assist/route.ts` | REQ-0010 | implemented |
| ART-0022 | C1 | styles | `src/app/globals.css` | REQ-0011 | implemented |
| ART-0023 | C1 | lib | `src/lib/validations.ts` | REQ-0012 | implemented |
| ART-0024 | C1 | lib | `src/lib/auth.ts` | REQ-0012 | implemented |
| ART-0025 | C1 | layout | `src/app/layout.tsx` | REQ-0022, REQ-0023 | implemented |
| ART-0026 | C1 | hook | `src/hooks/usePageFlip.ts` | REQ-0004 | implemented |
| ART-0027 | C1 | page | `src/app/(dashboard)/journal/[bookId]/page.tsx` | REQ-0003 | implemented |
| ART-0028 | C1 | process | `.agile-v/` | REQ-0024 | implemented |
| ART-0029 | C1 | schema | `prisma/schema.prisma` | REQ-0025 | implemented |
| ART-0030 | C1 | migration | `prisma/migrations/` | REQ-0025 | implemented |
| ART-0031 | C1 | config | `.env.example` | REQ-0026 | implemented |
| ART-0032 | C1 | middleware | `src/proxy.ts` | REQ-0012 | implemented |
| ART-0033 | C1 | config | `next.config.ts` | REQ-0020 | implemented |
| ART-0034 | C1 | docs | `README.md` | REQ-0020, REQ-0027 | implemented |
| ART-0035 | C1 | config | `.gitignore` | REQ-0026 | implemented |
| ART-0036 | C1 | infra | `docker-compose.yml` | REQ-0027 | implemented |
| ART-0037 | C1 | api | `src/app/api/ai/assist/stream/route.ts` | REQ-0010 | implemented |
| ART-0038 | C1 | lib | `src/lib/ai-rate-limit.ts`, `src/lib/ai-assist.ts` | REQ-0010 | implemented |
| ART-0039 | C1 | lib | `src/lib/offline/idb.ts` | REQ-0015 | implemented |
| ART-0040 | C1 | lib | `src/lib/offline/entry-draft-store.ts` | REQ-0015 | implemented |
| ART-0041 | C1 | lib | `src/lib/offline/sync-queue-store.ts` | REQ-0015 | implemented |
| ART-0042 | C1 | lib | `src/lib/journal-slug.ts` | REQ-0028 | implemented |
| ART-0043 | C1 | lib | `src/lib/journal-cache-optimistic.ts`, `journal-cache-notify.ts` | REQ-0015, REQ-0007 | implemented |
| ART-0044 | C1 | lib | `src/lib/offline/offline-journal-actions.ts` | REQ-0015 | implemented |
| ART-0045 | C1 | context+hooks | `OfflineSyncContext`, `useOffline*` hooks | REQ-0015 | implemented |
| ART-0046 | C1 | lib | `src/lib/site-metadata.ts` | REQ-0023 | implemented |
| ART-0047 | C1 | meta | `src/app/robots.ts` | REQ-0023, REQ-0028 | implemented |
| ART-0048 | C1 | ui+config | `src/components/ui/safe-image.tsx`, `vercel.json` | REQ-0028 | implemented |
| ART-0049 | C2 | lib | `src/lib/redis.ts` | REQ-0014, REQ-0010 | implemented |
| ART-0050 | C2 | lib | `src/lib/ai-rate-limit.ts` (Upstash) | REQ-0010 | implemented |
| ART-0051 | C2 | lib | `src/lib/ai-provider.ts` (Groq→OpenRouter) | REQ-0010 | implemented |
| ART-0052 | C2 | lib+ui | `src/lib/app-toast.tsx`, `src/types/toast.ts` | REQ-0008 | implemented |
| ART-0053 | C2 | ui | `src/components/ui/ripple-button.tsx` | REQ-0005 | implemented |
| ART-0054 | C2 | ui | `src/components/ui/command.tsx` | REQ-0017 | implemented |
| ART-0055 | C2 | ui | `src/components/editor/JournalEditor.tsx` | REQ-0013 | implemented |
| ART-0056 | C2 | lib | `src/lib/journal-pubsub.ts`, `journal-mutation.ts` | REQ-0014 | implemented |
| ART-0057 | C2 | api | `src/app/api/journal/events/route.ts` | REQ-0014 | implemented |
| ART-0058 | C2 | hook | `src/hooks/useJournalRealtime.ts`, `JournalRealtimeBridge.tsx` | REQ-0014 | implemented |
| ART-0059 | C2 | api+lib | `src/app/api/search/route.ts`, `src/lib/search.ts` | REQ-0016 | implemented |
| ART-0060 | C2 | ui | `src/components/journal/CommandPalette.tsx` | REQ-0017 | implemented |
| ART-0061 | C2 | layout | `src/components/layout/DashboardCommandProvider.tsx` | REQ-0017 | implemented |
| ART-0062 | C2 | constants+hook | `src/constants/themes.ts`, `useBookTheme.ts` | REQ-0018 | implemented |

## Planned artifacts (backlog)

| ART-ID | Linked REQ | Notes |
|--------|------------|-------|
| ART-0104 | REQ-0021 | Vitest + Playwright harness |
