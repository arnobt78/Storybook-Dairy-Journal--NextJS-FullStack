# Requirements (Blueprint)

<!-- project: storybook-journal | version: C1-gate1-approved | Gate 1: APPROVED GATE-0001 | Revision: C1 -->

Traceability source of truth. Status: `approved [C1]` = accepted at Gate 1 (2026-03-16). `implemented` = code present. `planned` = backlog via CR.

---

## REQ-0001 — User authentication

- **Status:** implemented · `approved [C1]`
- **Requirement:** Users SHALL register and sign in with email/password; sessions SHALL use secure HttpOnly cookies via NextAuth.
- **Constraint:** Passwords hashed (bcrypt); server-side validation (Zod).
- **Verification Criteria:** TC-0001, TC-0002 — register, login, protected route redirect.
- **Done Criteria:** `/login`, `/register`, session on dashboard, sign-out clears cache.
- **Artifacts:** ART-0001 AuthBookShell, ART-0002 LoginForm, ART-0003 RegisterForm, ART-0004 `/api/auth/*`

## REQ-0002 — Journal book (shelf) management

- **Status:** implemented · `approved [C1]`
- **Requirement:** Authenticated users SHALL create, list, open, update, and delete journal books.
- **Constraint:** Row-level ownership (`userId`); slug uniqueness per book.
- **Verification Criteria:** TC-0003 — CRUD via `/api/books` and BookShelf UI.
- **Done Criteria:** Dashboard shelf shows books; navigation to `/journal/[bookId]`.
- **Artifacts:** ART-0005 BookShelf, ART-0006 `/api/books`

## REQ-0003 — Journal entry CRUD

- **Status:** implemented · `approved [C1]`
- **Requirement:** Users SHALL create, read, update entries within owned books; entries SHALL store mood, weather, tags, content, dates.
- **Constraint:** `bookId` ownership verified on every mutation.
- **Verification Criteria:** TC-0004, TC-0005 — entry POST/PATCH, spread navigation.
- **Done Criteria:** BookSpread read/write/save; new entry with page flip.
- **Artifacts:** ART-0007 BookSpread, ART-0008 LeftPage, ART-0009 RightPage, ART-0010 `/api/entries`

## REQ-0004 — Immersive book spread UX

- **Status:** implemented · `approved [C1]`
- **Requirement:** Reader SHALL present two-page spread with 3-D page-flip animation, spine on outer left, ruled paper aesthetic.
- **Constraint:** 60fps target; `prefers-reduced-motion` respected; no layout shift on nav.
- **Verification Criteria:** TC-0006 — flip fwd/bwd, pointer-events on forms.
- **Done Criteria:** BookSpread + PageFlipOverlay + usePageFlip; auth spread parity.
- **Artifacts:** ART-0007, ART-0011 PageFlip, ART-0012 AuthBookShell

## REQ-0005 — Landing / cover experience

- **Status:** implemented · `approved [C1]`
- **Requirement:** Marketing landing SHALL show animated leather book cover opening into product narrative.
- **Verification Criteria:** TC-0007 — cover hinge animation, CTA to auth.
- **Done Criteria:** BookCover on `/`.
- **Artifacts:** ART-0013 BookCover, ART-0014 Landing page

## REQ-0006 — Dashboard navigation & profile

- **Status:** implemented · `approved [C1]`
- **Requirement:** Authenticated shell SHALL provide brand nav, profile dropdown (email, name, API links, sign-out), book-close logout animation.
- **Constraint:** Dropdown portal (`modal={false}`) — no layout shift; Lucide icons on menu rows.
- **Verification Criteria:** TC-0008 — menu open, sign-out, `/dairy-1.svg` logo.
- **Done Criteria:** DashboardNav + dropdown-menu primitive.
- **Artifacts:** ART-0015 DashboardNav, ART-0016 dropdown-menu, ART-0017 `/api/health`

## REQ-0007 — Client cache coherence (TanStack Query)

- **Status:** implemented · `approved [C1]`
- **Requirement:** All journal CRUD SHALL invalidate `queryKeys.journalSubtree()` so shelf + open book refresh without full page reload.
- **Constraint:** No stale cross-session data after sign-out (`queryClient.clear()`).
- **Verification Criteria:** TC-0009 — create book → shelf updates; save entry → spread updates.
- **Done Criteria:** query-keys.ts pattern used in forms, BookSpread, BookShelf.
- **Artifacts:** ART-0018 query-keys, ART-0019 journal-api

## REQ-0008 — New book starter entry

- **Status:** implemented · `approved [C1]`
- **Requirement:** POST `/api/books` SHALL atomically create book + first "New Entry" page so BookSpread never renders empty `entries[]`.
- **Verification Criteria:** TC-0010 — open newly created journal shows spread.
- **Done Criteria:** Transaction in `api/books/route.ts`; empty-state fallback in BookSpread.
- **Artifacts:** ART-0006, ART-0007

## REQ-0009 — Demo / test account

- **Status:** implemented · `approved [C1]`
- **Requirement:** Login SHALL offer demo credential picker; seed ensures `test@user.com` exists.
- **Verification Criteria:** TC-0011 — dropdown fill/clear, successful login.
- **Done Criteria:** LoginForm portal menu; register seed + prisma seed.
- **Artifacts:** ART-0002, ART-0020 seed/register routes

## REQ-0010 — AI writing assist (optional)

- **Status:** implemented · `approved [C1]` (basic)
- **Requirement:** Editor MAY request AI continuation via server proxy `/api/ai/assist` (no client API keys).
- **Constraint:** Anthropic/env key server-only; graceful failure toast.
- **Verification Criteria:** TC-0012 — assist returns text append.
- **Done Criteria:** BookSpread aiAssist + route handler.
- **Artifacts:** ART-0021 `/api/ai/assist`

## REQ-0011 — Responsive book sizing

- **Status:** implemented · `approved [C1]`
- **Requirement:** Page dimensions SHALL use CSS tokens `--page-w`, `--page-h`, `--spine-w` for consistent scaling.
- **Verification Criteria:** TC-0013 — viewport resize without broken spread.
- **Done Criteria:** globals.css `:root` tokens.
- **Artifacts:** ART-0022 globals.css tokens

## REQ-0012 — Security & validation baseline

- **Status:** implemented · `approved [C1]`
- **Requirement:** All API inputs SHALL validate with Zod; auth required on mutating routes; no internal errors exposed.
- **Verification Criteria:** TC-0014 — 401 unauthorized, 400 invalid body.
- **Done Criteria:** validations.ts + route guards.
- **Artifacts:** ART-0023 validations, ART-0024 auth middleware patterns

## REQ-0013 — Rich text editor (TipTap)

- **Status:** planned 📋
- **Requirement:** Entry content SHALL support rich markdown editing (TipTap) per product vision.
- **Verification Criteria:** TC-0015 (future).
- **Done Criteria:** Editor component integrated in RightPage write mode.
- **Parent for:** future CR

## REQ-0014 — Realtime multi-tab sync

- **Status:** planned 📋
- **Requirement:** Entry changes SHALL propagate across tabs/devices via Redis pub/sub or SSE.
- **Verification Criteria:** TC-0016 (future).
- **Done Criteria:** WebSocket/SSE worker + invalidation bridge.

## REQ-0015 — Offline-first drafts

- **Status:** planned 📋
- **Requirement:** Drafts SHALL persist locally (IndexedDB) and sync when online.
- **Verification Criteria:** TC-0017 (future).
- **Done Criteria:** useAutoSave extended + sync queue.

## REQ-0016 — Full-text search

- **Status:** planned 📋
- **Requirement:** Users SHALL search entries by title, content, tags, mood, date, book.
- **Verification Criteria:** TC-0018 (future).

## REQ-0017 — Command palette & keyboard UX

- **Status:** planned 📋
- **Requirement:** Power users SHALL navigate via command palette and shortcuts.
- **Verification Criteria:** TC-0019 (future).

## REQ-0018 — Theming (journal skins)

- **Status:** planned 📋
- **Requirement:** Books SHALL support cover themes (warm paper, dark academia, etc.).
- **Verification Criteria:** TC-0020 (future).

## REQ-0019 — Observability & health

- **Status:** partial · `approved [C1]` (health ✅; Pino/Sentry backlog)
- **Requirement:** Service SHALL expose health endpoint; production SHALL add structured logging (Pino) and error tracking (Sentry).
- **Verification Criteria:** TC-0021 — GET `/api/health` 200 JSON.
- **Done Criteria:** ART-0017; Sentry/Pino 📋
- **Artifacts:** ART-0017

## REQ-0020 — Deployment (VPS/Docker)

- **Status:** planned 📋 · `approved [C1]` (scope only)
- **Requirement:** App SHALL deploy via Docker multi-stage build, NGINX, PM2 per architecture doc.
- **Verification Criteria:** TC-0022 (future).
- **Reference:** Local ops guide `docs/HETZNER_VPS_MIGRATION_GUIDE.md` (gitignored; not in remote repo)

## REQ-0021 — Automated test suite

- **Status:** planned 📋
- **Requirement:** Vitest + RTL + Playwright SHALL cover auth, CRUD, critical animations.
- **Verification Criteria:** TEST_SPEC.md execution at Gate 2.
- **Done Criteria:** CI pipeline green.

## REQ-0022 — Accessibility (WCAG-oriented)

- **Status:** partial · `approved [C1]`
- **Requirement:** UI SHALL support keyboard nav, focus states, ARIA on interactive controls, reduced motion.
- **Verification Criteria:** TC-0023 — axe scan on auth + spread.
- **Done Criteria:** Ongoing; dropdown `aria-label` on profile trigger ✅

## REQ-0023 — SEO & metadata

- **Status:** partial · `approved [C1]`
- **Requirement:** App routes SHALL define metadata, OpenGraph, sitemap where public.
- **Verification Criteria:** TC-0024 — root layout metadata present.
- **Artifacts:** ART-0025 root layout metadata

## REQ-0024 — Agile V traceability (process)

- **Status:** implemented · `approved [C1]` (this bootstrap)
- **Requirement:** Project SHALL maintain `.agile-v/` living AQMS with REQ-linked artifacts, gates, and decision log.
- **Verification Criteria:** ATM links REQ→ART→TC; Gate 1/2 records in APPROVALS.md.
- **Done Criteria:** `.agile-v/` C1 bootstrap complete.
- **Artifacts:** `.agile-v/*`

---

## Traceability index (REQ → primary ART)

| REQ | Primary artifacts |
|-----|-------------------|
| REQ-0001 | ART-0001–0004 |
| REQ-0002 | ART-0005–0006 |
| REQ-0003 | ART-0007–0010 |
| REQ-0004 | ART-0007, ART-0011–0012 |
| REQ-0005 | ART-0013–0014 |
| REQ-0006 | ART-0015–0017 |
| REQ-0007 | ART-0018–0019 |
| REQ-0008 | ART-0006–0007 |
| REQ-0009 | ART-0002, ART-0020 |
| REQ-0010 | ART-0021 |
| REQ-0011 | ART-0022 |
| REQ-0012 | ART-0023–0024 |
| REQ-0019 | ART-0017 |
| REQ-0023 | ART-0025 |
| REQ-0024 | `.agile-v/` |
