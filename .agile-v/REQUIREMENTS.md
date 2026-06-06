# Requirements (Blueprint)

<!-- project: storybook-journal | version: C1-bootstrap-2026-06-01-r2 | Gate 1: GATE-0001 + GATE-0003 + CR-0002 -->

Traceability source of truth. Status: `approved [C1]` = accepted at Gate 1. `implemented` = code present. `planned` = backlog via CR.

---

## Stage 1 — Implemented baseline (REQ-0001–0012)

### REQ-0001 — User authentication

- **Status:** implemented · `approved [C1]`
- **Requirement:** Users SHALL register and sign in with email/password; sessions SHALL use secure HttpOnly cookies via NextAuth v5.
- **Constraint:** Passwords hashed (bcrypt); server-side validation (Zod).
- **Verification Criteria:** TC-0001, TC-0002 — register, login, protected route redirect.
- **Done Criteria:** `/login`, `/register`, session on dashboard, sign-out clears TanStack cache.
- **Artifacts:** ART-0001 AuthBookShell, ART-0002 LoginForm, ART-0003 RegisterForm, ART-0004 `/api/auth/*`, ART-0024 auth.ts

### REQ-0002 — Journal book (shelf) management

- **Status:** implemented · `approved [C1]`
- **Requirement:** Authenticated users SHALL create, list, open, update, and delete journal books.
- **Constraint:** Row-level ownership (`userId`); slug uniqueness per book.
- **Verification Criteria:** TC-0003 — CRUD via `/api/books` and BookShelf UI.
- **Done Criteria:** Dashboard shelf shows books; navigation to `/journal/[bookId]`.
- **Artifacts:** ART-0005 BookShelf, ART-0006 `/api/books`

### REQ-0003 — Journal entry CRUD

- **Status:** implemented · `approved [C1]`
- **Requirement:** Users SHALL create, read, update entries within owned books; entries SHALL store mood, weather, tags, content, dates.
- **Constraint:** `bookId` ownership verified on every mutation.
- **Verification Criteria:** TC-0004, TC-0005 — entry POST/PATCH, spread navigation.
- **Done Criteria:** BookSpread read/write/save; new entry with page flip.
- **Artifacts:** ART-0007 BookSpread, ART-0008 LeftPage, ART-0009 RightPage, ART-0010 `/api/entries`, ART-0027 journal page

### REQ-0004 — Immersive book spread UX

- **Status:** implemented · `approved [C1]`
- **Requirement:** Reader SHALL present two-page spread with 3-D page-flip animation, spine on outer left, ruled paper aesthetic.
- **Constraint:** 60fps target; `prefers-reduced-motion` respected; no layout shift on nav.
- **Verification Criteria:** TC-0006 — flip fwd/bwd, pointer-events on forms.
- **Done Criteria:** BookSpread + PageFlipOverlay + usePageFlip; auth spread parity.
- **Artifacts:** ART-0007, ART-0011 PageFlip, ART-0012 auth layout, ART-0026 usePageFlip

### REQ-0005 — Landing / cover experience

- **Status:** implemented · `approved [C1]`
- **Requirement:** Marketing landing SHALL show animated leather book cover opening into product narrative.
- **Verification Criteria:** TC-0007 — cover hinge animation, CTA to auth.
- **Done Criteria:** BookCover on `/`.
- **Artifacts:** ART-0013 BookCover, ART-0014 Landing page

### REQ-0006 — Dashboard navigation & profile

- **Status:** implemented · `approved [C1]`
- **Requirement:** Authenticated shell SHALL provide brand nav, profile dropdown (email, name, API links, sign-out), book-close logout animation.
- **Constraint:** Dropdown portal (`modal={false}`); Lucide icons; no layout shift.
- **Verification Criteria:** TC-0008 — menu open, sign-out, `/dairy-1.svg` logo.
- **Done Criteria:** DashboardNav + dropdown-menu primitive.
- **Artifacts:** ART-0015 DashboardNav, ART-0016 dropdown-menu, ART-0017 `/api/health`

### REQ-0007 — Client cache coherence (TanStack Query)

- **Status:** implemented · `approved [C1]`
- **Requirement:** All journal CRUD SHALL invalidate `queryKeys.journalSubtree()` so shelf + open book refresh without full page reload.
- **Constraint:** No stale cross-session data after sign-out (`queryClient.clear()`).
- **Verification Criteria:** TC-0009 — create book → shelf updates; save entry → spread updates.
- **Done Criteria:** query-keys.ts pattern in forms, BookSpread, BookShelf, useAutoSave.
- **Artifacts:** ART-0018 query-keys, ART-0019 journal-api

### REQ-0008 — New book starter entry

- **Status:** implemented · `approved [C1]`
- **Requirement:** POST `/api/books` SHALL atomically create book + first "New Entry" page so BookSpread never renders empty `entries[]`.
- **Verification Criteria:** TC-0010 — open newly created journal shows spread.
- **Done Criteria:** Transaction in `api/books/route.ts`; empty-state fallback in BookSpread.
- **Artifacts:** ART-0006, ART-0007

### REQ-0009 — Demo / test account

- **Status:** partial · `approved [C1]` (dev ✅; prod gate 📋)
- **Requirement:** Login SHALL offer demo credential picker; seed ensures `test@user.com` exists for local/demo.
- **Constraint:** Demo picker MUST be disabled or removed in production deploy (CR before Vercel prod).
- **Verification Criteria:** TC-0011 — dropdown fill/clear, successful login (dev).
- **Done Criteria:** LoginForm portal menu; prisma seed + register ensureTestUser.
- **Artifacts:** ART-0002, ART-0020 seed/register routes
- **Risk:** RISK-0006

### REQ-0010 — AI writing assist (optional)

- **Status:** implemented · `approved [C1]`
- **Requirement:** Editor MAY request AI continuation via server proxy `/api/ai/assist` + SSE `/api/ai/assist/stream` (no client API keys).
- **Constraint:** Anthropic key server-only; rate limit 10/min; `assistSessionId` dedupes stream+sync; graceful placeholder when unset.
- **Verification Criteria:** TC-0012 — assist returns text; TC-0028 — rate limit 429.
- **Done Criteria:** BookSpread stream assist; ai-rate-limit.ts; ai-assist.ts.
- **Artifacts:** ART-0021, ART-0037–0038

### REQ-0011 — Responsive book sizing

- **Status:** implemented · `approved [C1]`
- **Requirement:** Page dimensions SHALL use CSS tokens `--page-w`, `--page-h`, `--spine-w` for consistent scaling.
- **Verification Criteria:** TC-0013 — viewport resize without broken spread.
- **Done Criteria:** globals.css `:root` tokens.
- **Artifacts:** ART-0022 globals.css tokens

### REQ-0012 — Security & validation baseline

- **Status:** implemented · `approved [C1]`
- **Requirement:** All API inputs SHALL validate with Zod; auth required on mutating routes; no internal errors exposed.
- **Verification Criteria:** TC-0014 — 401 unauthorized, 400 invalid body.
- **Done Criteria:** validations.ts + `auth()` on protected routes + proxy.ts route guard.
- **Artifacts:** ART-0023 validations, ART-0024 auth, ART-0032 proxy.ts

---

## Stage 1 — Platform backlog (REQ-0013–0018)

### REQ-0013 — Rich text editor (TipTap)

- **Status:** implemented · `approved [C2]` (CR-0003)
- **Requirement:** Entry content SHALL support rich markdown editing (TipTap) per product vision.
- **Verification Criteria:** TC-0015 — static PASS (JournalEditor + dynamic import ssr:false).
- **Artifacts:** ART-0055

### REQ-0014 — Realtime multi-tab sync

- **Status:** implemented · `approved [C2]` (CR-0003)
- **Requirement:** Entry changes SHALL propagate across tabs/devices via Redis pub/sub or SSE.
- **Verification Criteria:** TC-0016 — static PASS (journal-pubsub, SSE route, useJournalRealtime).
- **Artifacts:** ART-0056–0058

### REQ-0015 — Offline-first drafts & sync queue

- **Status:** implemented · `approved [C1]` (CR-0002)
- **Requirement:** Drafts SHALL persist locally (IndexedDB); mutations SHALL enqueue when offline and drain on reconnect with temp-id remap.
- **Constraint:** Optimistic TanStack cache; `notifyJournalCacheUpdated`; FIFO queue types: patchEntry, postEntry, patchBook, postBook.
- **Verification Criteria:** TC-0017 — offline save → online sync → server id remap.
- **Done Criteria:** offline/* stores, OfflineSyncContext, useOffline* hooks, nav badge.
- **Artifacts:** ART-0039–0045

### REQ-0016 — Full-text search

- **Status:** implemented · `approved [C2]` (CR-0003)
- **Requirement:** Users SHALL search entries by title, content, tags, mood, date, book.
- **Verification Criteria:** TC-0018 — static PASS (GET /api/search + CommandPalette integration).
- **Artifacts:** ART-0059

### REQ-0017 — Command palette & keyboard UX

- **Status:** implemented · `approved [C2]` (CR-0003)
- **Requirement:** Power users SHALL navigate via command palette and shortcuts.
- **Verification Criteria:** TC-0019 — static PASS (⌘K CommandPalette + DashboardCommandProvider).
- **Artifacts:** ART-0060–0061

### REQ-0018 — Theming (journal skins)

- **Status:** implemented · `approved [C2]` (CR-0003)
- **Requirement:** Books SHALL support cover themes (warm paper, dark academia, etc.).
- **Verification Criteria:** TC-0020 — static PASS (BOOK_THEMES, useBookTheme, BookEditorModal picker).
- **Artifacts:** ART-0062

---

## Stage 1 — Ops, quality, process (REQ-0019–0027)

### REQ-0019 — Observability & health

- **Status:** partial · `approved [C1]` (health ✅; Pino/Sentry backlog)
- **Requirement:** Service SHALL expose health endpoint; production SHALL add structured logging (Pino) and error tracking (Sentry).
- **Verification Criteria:** TC-0021 — GET `/api/health` 200 JSON.
- **Artifacts:** ART-0017

### REQ-0020 — Production deployment (Vercel)

- **Status:** partial · `approved [C1]` (repo ready; Vercel project 📋)
- **Requirement:** App SHALL deploy on Vercel (native Next.js build); secrets via Vercel env vars; no app Dockerfile in repo.
- **Constraint:** `DATABASE_URL` + `DIRECT_URL` + `AUTH_SECRET` set in Vercel dashboard only.
- **Verification Criteria:** TC-0022 — `next build` succeeds; Vercel preview deploy green.
- **Reference:** `docs/VERCEL_PRODUCTION_GUARDRAILS.md`
- **Artifacts:** ART-0033 next.config.ts, ART-0034 README deploy section

### REQ-0021 — Automated test suite

- **Status:** planned 📋
- **Requirement:** Vitest + RTL + Playwright SHALL cover auth, CRUD, critical animations.
- **Verification Criteria:** TEST_SPEC.md execution at Gate 2.
- **Done Criteria:** CI pipeline green.

### REQ-0022 — Accessibility (WCAG-oriented)

- **Status:** partial · `approved [C1]`
- **Requirement:** UI SHALL support keyboard nav, focus states, ARIA on interactive controls, reduced motion.
- **Verification Criteria:** TC-0023 — axe scan on auth + spread.

### REQ-0023 — SEO & metadata

- **Status:** implemented · `approved [C1]`
- **Requirement:** App routes SHALL define metadata, OpenGraph, Twitter cards; author Arnob Mahmud; dashboard `noindex`.
- **Verification Criteria:** TC-0024 — site-metadata.ts + layout; TC-0029 — robots.ts.
- **Artifacts:** ART-0025, ART-0046–0047

### REQ-0024 — Agile V traceability (process)

- **Status:** implemented · `approved [C1]`
- **Requirement:** Project SHALL maintain `.agile-v/` living AQMS with REQ-linked artifacts, gates, and decision log.
- **Verification Criteria:** ATM links REQ→ART→TC; Gate records in APPROVALS.md.
- **Artifacts:** `.agile-v/*` (24 skill manifests, 5 phase dirs, cycles/C1)

### REQ-0025 — PostgreSQL data layer

- **Status:** implemented · `approved [C1]` (GATE-0003)
- **Requirement:** Prisma SHALL use PostgreSQL with `DATABASE_URL` and `DIRECT_URL`; schema applied via `db push` / migrations.
- **Constraint:** No SQLite in production path; remote or local Postgres only.
- **Verification Criteria:** TC-0025 — `prisma db push` syncs schema; app reads/writes entries.
- **Done Criteria:** `prisma/schema.prisma` provider postgresql; seed runs.
- **Artifacts:** ART-0029 prisma schema, ART-0030 migrations, ART-0020 seed

### REQ-0026 — Repository secrets hygiene

- **Status:** implemented · `approved [C1]` (GATE-0003)
- **Requirement:** Real secrets SHALL live in `.env` only (gitignored); `.env.example` generic placeholders; ops docs with infrastructure details gitignored.
- **Constraint:** Fresh git history on public GitHub; no VPS IP/passwords in tracked files.
- **Verification Criteria:** TC-0026 — `git ls-files` excludes `.env`, Hetzner guide; grep tracked tree for IP patterns.
- **Done Criteria:** `.gitignore` lines 11–13, 52; single clean commit on remote.
- **Artifacts:** ART-0031 .env.example, ART-0035 .gitignore
- **Risk:** RISK-0007 mitigated

### REQ-0027 — Optional local dev Postgres (Docker)

- **Status:** implemented · `approved [C1]` (GATE-0003)
- **Requirement:** Repo MAY provide docker-compose Postgres-only service for developers without remote DB.
- **Constraint:** Not used for Vercel production; documented as optional in README + compose header comments.
- **Verification Criteria:** TC-0027 — `docker compose up -d db` + local `.env` connects.
- **Artifacts:** ART-0036 docker-compose.yml

### REQ-0028 — Production guardrails & SafeImage

- **Status:** implemented · `approved [C1]` (CR-0002)
- **Requirement:** Production SHALL ship security headers, robots rules, SafeImage avatar fallbacks, slug sync on title PATCH, `force-dynamic` on private routes.
- **Constraint:** AI keys server-only; dashboard noindex; remotePatterns for Google/GitHub/Robohash.
- **Verification Criteria:** TC-0030 — next.config + vercel.json headers; SafeImage fallback chain.
- **Artifacts:** ART-0048, ART-0033, ART-0047, ART-0042 journal-slug.ts

---

## Traceability index (REQ → primary ART)

| REQ | Primary artifacts |
|-----|-------------------|
| REQ-0001 | ART-0001–0004, ART-0024 |
| REQ-0002 | ART-0005–0006 |
| REQ-0003 | ART-0007–0010, ART-0027 |
| REQ-0004 | ART-0007, ART-0011–0012, ART-0026 |
| REQ-0005 | ART-0013–0014 |
| REQ-0006 | ART-0015–0017 |
| REQ-0007 | ART-0018–0019 |
| REQ-0008 | ART-0006–0007 |
| REQ-0009 | ART-0002, ART-0020 |
| REQ-0010 | ART-0021, ART-0037–0038 |
| REQ-0015 | ART-0039–0045 |
| REQ-0023 | ART-0025, ART-0046–0047 |
| REQ-0028 | ART-0048, ART-0033, ART-0042 |
| REQ-0011 | ART-0022 |
| REQ-0012 | ART-0023–0024, ART-0032 |
| REQ-0019 | ART-0017 |
| REQ-0020 | ART-0033–0034 |
| REQ-0023 | ART-0025 |
| REQ-0024 | `.agile-v/` |
| REQ-0025 | ART-0029–0030, ART-0020 |
| REQ-0026 | ART-0031, ART-0035 |
| REQ-0027 | ART-0036 |
