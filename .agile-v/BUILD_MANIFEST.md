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
| ART-0020 | C1 | seed | `prisma/seed.ts`, register route seed | REQ-0009 | implemented |
| ART-0021 | C1 | api | `src/app/api/ai/assist/route.ts` | REQ-0010 | implemented |
| ART-0022 | C1 | styles | `src/app/globals.css` | REQ-0011 | implemented |
| ART-0023 | C1 | lib | `src/lib/validations.ts` | REQ-0012 | implemented |
| ART-0024 | C1 | lib | `src/lib/auth.ts` | REQ-0012 | implemented |
| ART-0025 | C1 | layout | `src/app/layout.tsx` | REQ-0022, REQ-0023 | implemented |
| ART-0026 | C1 | hook | `src/hooks/usePageFlip.ts` | REQ-0004 | implemented |
| ART-0027 | C1 | page | `src/app/(dashboard)/journal/[bookId]/page.tsx` | REQ-0003 | implemented |
| ART-0028 | C1 | process | `.agile-v/` | REQ-0024 | implemented |

## Planned artifacts (REQ-0013+)

| ART-ID | Linked REQ | Notes |
|--------|------------|-------|
| ART-0100 | REQ-0013 | TipTap editor module |
| ART-0101 | REQ-0014 | Realtime sync service |
| ART-0102 | REQ-0015 | Offline sync queue |
| ART-0103 | REQ-0016 | Search API + UI |
