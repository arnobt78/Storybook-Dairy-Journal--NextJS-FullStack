# Storybook Journal — Project walkthrough

This document is a **persistent map** of the repository: what the product is, how requests flow, where data lives, and how that lines up with deployment (including a Hetzner-style VPS PostgreSQL setup). It is meant to be read months later without re-auditing the whole tree.

---

## 1. What this project is

**Storybook Journal** is a Next.js 16 web app that presents a **leather-bound, two-page “book spread”** journal. Users:

- Register (email + password) or use optional **Google OAuth** (when env vars are set).
- Land on a **dashboard** showing journal “books” on a shelf.
- Open a book at `/journal/[bookId]` and flip through **entries** (TipTap-style rich HTML content, moods, weather, tags).
- Create books and entries via **REST Route Handlers** under `src/app/api/**`, backed by **Prisma** and **PostgreSQL**.

Deployment target is **Vercel** for the app; `docker-compose.yml` is an optional local Postgres helper only.

---

## 2. Tech stack (authoritative)

| Area | Choice |
|------|--------|
| Framework | Next.js 16 App Router (`src/app`) |
| UI | React 19, Tailwind 3, heavy **inline styles** for the book aesthetic |
| Auth | **NextAuth v5** — JWT sessions, Credentials + optional **Google OAuth** |
| ORM / DB | **Prisma 6** + **PostgreSQL** (`DATABASE_URL` + `DIRECT_URL`) |
| Validation | **Zod** (`src/lib/validations.ts`) |
| Client data fetching | **TanStack Query** — `queryKeys.journalSubtree()` invalidation on all journal CRUD + auth flows |
| Animations | Custom page-flip hook + overlay (`usePageFlip`, `PageFlip`) |
| Toasts | **Sonner** via `appToast` (icon + title + subtitle, bottom-right) |
| AI | Groq → OpenRouter → Anthropic legacy; `/api/ai/assist` + `/stream`; Upstash Redis rate limit (in-memory fallback) |
| Realtime | Upstash Redis pub/sub + `GET /api/journal/events` SSE; `useJournalRealtime` invalidates `journalSubtree` |
| Editor | **TipTap** `JournalEditor` (dynamic `ssr:false` in RightPage) |
| Search | `GET /api/search` — Prisma scoped; wired to ⌘K `CommandPalette` |
| Themes | `BOOK_THEMES` + `useBookTheme` — page CSS vars per `JournalBook.theme` |
| UX | `RippleButton` global click effect; `DashboardCommandProvider` (palette + realtime bridge) |
| Images | `SafeImage` for remote avatars; `next.config` `remotePatterns` (Google, GitHub, Robohash) |
| Offline | IndexedDB drafts + sync queue (`patchEntry`, `postEntry`, `patchBook`, `postBook`); `OfflineSyncContext`; optimistic cache + `notifyJournalCacheUpdated`; shelf hover prefetch |
| Production guardrails | `next.config` + `vercel.json` security/cache headers; `robots.ts`; dashboard `noindex`; `force-dynamic` on dashboard/journal pages |
| SEO | `src/lib/site-metadata.ts` — OG/Twitter/keywords; author Arnob Mahmud |
| Production | **Vercel** — https://storybook-journal.vercel.app |

---

## 3. Repository layout (high signal)

```
src/app/
  page.tsx                    # Landing → redirect if logged in
  layout.tsx, providers.tsx   # SessionProvider, QueryClient, OfflineSyncProvider, Toaster
  robots.ts                   # disallow /api, /dashboard, /journal; block AI scrapers
  (auth)/login, register      # Auth pages + forms
  (dashboard)/
    layout.tsx                # Shell + nav
    dashboard/page.tsx        # SSR: list books, render BookShelf
    journal/[bookId]/page.tsx # SSR: load book + entries, render BookSpread
  api/
    auth/[...nextauth]/       # NextAuth GET/POST
    auth/register/            # Email registration + seed book/entry
    books/, books/[bookId]/   # Journal CRUD (+ afterJournalMutation publish)
    entries/, entries/[entryId]/
    search/                   # Scoped entry search (GET)
    journal/events/           # SSE realtime stream (force-dynamic)

src/lib/
  db.ts                       # PrismaClient singleton (dev HMR guard)
  auth.ts                     # NextAuth + Google signIn → provisionOAuthUser
  auth/provision-oauth-user.ts # Google user + welcome journal transaction
  auth/is-google-enabled.ts   # Server-only OAuth env check
  auth/google-oauth-env.ts    # GOOGLE_CLIENT_* + legacy GOOGLE_ID/SECRET aliases
  auth/get-auth-page-config.ts # SSR flags for login/register (force-dynamic)
  query-keys.ts               # journalSubtree() — single invalidation root
  journal-slug.ts             # resolveUniqueBookSlug / resolveUniqueEntrySlug on PATCH title change
  journal-cache-optimistic.ts # optimistic shelf/reader patches for offline writes
  journal-cache-notify.ts     # notifyJournalCacheUpdated (invalidate subtree; refetchType none when offline)
  journal-pubsub.ts           # Redis publish + list buffer for SSE poll
  journal-mutation.ts         # afterJournalMutation — called post-Prisma write
  redis.ts                    # Upstash singleton (null when env missing)
  ai-provider.ts              # Groq → OpenRouter → Anthropic
  app-toast.tsx               # Unified Sonner presets
  search.ts                   # Search query Zod + SearchHit type
  offline/                    # IndexedDB drafts + sync queue + offline-journal-actions
  site-metadata.ts            # Central SEO metadata for root layout
  ai-assist.ts, ai-rate-limit.ts
  validations.ts              # Zod schemas shared by API routes
  utils.ts                    # slugify, tags JSON, word counts, dates

src/context/
  OfflineSyncContext.tsx      # pendingCount badge + sync processor

src/constants/
  offline.ts                  # temp id prefixes + sync browser events

src/hooks/
  useOfflineSyncQueue.ts      # FIFO drain, id remap, defer until postEntry/postBook syncs
  useOfflineEntryDraft.ts     # IndexedDB draft persist/restore
  useOfflineIdRemap.ts        # temp entry/book id → server cuid after sync
  useJournalPrefetch.ts       # shelf hover → prefetch route + bookDetail query
  useJournalRealtime.ts       # EventSource → notifyJournalCacheUpdated (multi-tab)
  useBookTheme.ts             # CSS vars from JournalBook.theme

src/components/ui/
  safe-image.tsx              # next/image + fallbackSrc (Robohash) + native img fallback
  ripple-button.tsx           # Global click ripple + optional cta-shine
  command.tsx                 # cmdk primitives for palette

src/components/editor/
  JournalEditor.tsx           # TipTap — StarterKit, Placeholder, Typography

src/components/journal/
  CommandPalette.tsx          # ⌘K search + navigate + actions
src/components/layout/
  DashboardCommandProvider.tsx # Mounts palette + JournalRealtimeBridge

src/components/auth/
  AuthOAuthSection.tsx        # "or" + Google below primary CTA (login + register)
  GoogleSignInButton.tsx      # OAuth redirect + localStorage anti-flicker flags
  OAuthReturnSync.tsx         # Post-OAuth journalSubtree invalidation
  AuthOrSeparator.tsx         # "or" divider
  AuthBookShell.tsx           # Book spread; prefetches /login ↔ /register

prisma/schema.prisma          # User, JournalBook, JournalEntry (+ relations)
```

There **is** a `prisma/migrations/` directory (init migration committed). Local/prod may use `db push` or `migrate deploy`.

---

## 4. Data model and integrity

Prisma models (`prisma/schema.prisma`):

- **User** — `id` (cuid), `email` unique, `passwordHash` (null if OAuth-only path were added later), profile fields, `books` / `entries` relations.
- **JournalBook** — belongs to `User`; `@@unique([userId, slug])`; cascade delete from user.
- **JournalEntry** — belongs to `User` and `JournalBook`; `@@unique([bookId, slug])`; indexes on `userId`, `bookId`, `createdAt`; `tags` stored as a **string** (JSON array serialized in app code, not a native SQL array type).

**Foreign keys:** Expressed as Prisma `@relation` with `onDelete: Cascade`. On **PostgreSQL**, Prisma generates real FK constraints. On **SQLite**, Prisma also enforces referential behavior via the schema it manages. **You do not need to hand-wire “foreign key connections”** beyond keeping this schema; switching the datasource to `postgresql` preserves the same relation semantics.

---

## 5. Authentication and authorization

- **Proxy** (`src/proxy.ts`, Next.js 16+): uses `auth()` from NextAuth at the edge boundary. Protects `/dashboard` and `/journal`; sends unauthenticated users to `/login` with `callbackUrl`. Matcher **excludes** `api`, `_next/static`, `_next/image`, `favicon.ico` so API routes handle their own auth.
- **Session strategy:** JWT (`session: { strategy: "jwt" }`). User id is copied from DB user into the token and then into `session.user.id` via callbacks.
- **Credentials login:** `authorize` loads user by email, bcrypt compare, updates `lastLoginAt`.
- **Google OAuth:** When `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` (or legacy `GOOGLE_ID` / `GOOGLE_SECRET`) are set, **login and register** show Gmail **below** the primary button (`Open My Journal` / `Begin My Story`) via `AuthOAuthSection`. `signIn` callback → `provisionOAuthUser()` (Prisma user + welcome book on first login). Redirect `/dashboard`; `OAuthReturnSync` invalidates `journalSubtree()`.
- **Auth layout:** `(auth)/layout.tsx` uses `.auth-book-viewport` — book spread ≈ **85vw × 85vh** (scoped `--page-w` / `--page-h`; dashboard journal keeps `:root` defaults). Both auth pages use `export const dynamic = "force-dynamic"` + `getAuthPageConfig()`.

API routes consistently call `await auth()` and check `session?.user?.id` before Prisma calls, and use `userId` / `findFirst({ where: { id, userId }})` patterns to avoid cross-user access.

---

## 6. Request and UI workflow

### 6.1 Registration

1. `POST /api/auth/register` validates body with `registerSchema`.
2. If email exists → 409.
3. Creates `User`, default `JournalBook` (“My Journal”), and a welcome `JournalEntry` in one flow.

### 6.2 Dashboard

1. `dashboard/page.tsx` is a **Server Component**: `auth()` then `prisma.journalBook.findMany` for the session user.
2. `BookShelf` (client) uses TanStack Query with SSR `initialData`; hover prefetches `/journal/[bookId]` + `bookDetail` cache via `useJournalPrefetch`.
3. Offline book CREATE enqueues `postBook`, optimistic shelf seed, navigates to temp book id until sync remaps URL.

### 6.3 Journal reader

1. `journal/[bookId]/page.tsx` is a **Server Component**: loads book + non-archived entries ordered by `createdAt` asc; maps `tags` from stored string via `parseTags`.
2. `BookSpread` (client) holds **entries**, current index, write mode, draft, save state. It:
   - **Patches** the current entry via `PATCH /api/entries/[entryId]` on explicit save.
   - **Posts** new entries via `POST /api/entries` with client-supplied `entryDate` / `weekday` (API overwrites with `formatEntryDate()` anyway — minor redundancy).
3. `useAutoSave` debounces PATCH; offline path uses optimistic cache + sync queue + `notifyJournalCacheUpdated`. `useOfflineEntryDraft` persists/restores drafts.
4. Offline entry CREATE/PATCH/BOOK PATCH/BOOK CREATE all enqueue to IndexedDB; `DashboardNav` shows `{n} offline` badge; drain on `online` invalidates `journalSubtree`.
5. Temp ids (`offline-entry-*`, `offline-book-*`) remap to server cuids via `useOfflineIdRemap` + sync events — reader focus preserved after sync.
6. **DELETE UI** — `ConfirmDialog` + `journalSubtree` invalidation.
7. **PATCH book UI** — `BookEditorModal` on shelf + reader; slug sync on title change (`journal-slug.ts`).
8. **AI assist** — Groq primary; SSE stream + sync fallback; `assistSessionId` dedupes; Redis rate limit (10/min) with in-memory dev fallback.
9. **TipTap** — write mode uses `JournalEditor`; read mode `.journal-prose` HTML.
10. **Realtime** — other tabs receive SSE events → `notifyJournalCacheUpdated` (debounced toast).
11. **Themes** — `BookEditorModal` theme picker; `useBookTheme` on spread wrapper.
12. **⌘K** — `CommandPalette` search + journal navigation.

### 6.4 API summary

| Method | Path | Role |
|--------|------|------|
| GET/POST | `/api/auth/[...nextauth]` | NextAuth |
| POST | `/api/auth/register` | Register + seed data |
| GET, POST | `/api/books` | List / create books |
| GET, PATCH, DELETE | `/api/books/[bookId]` | Book + entries payload, update, delete |
| POST | `/api/entries` | Create entry (checks book ownership) |
| POST | `/api/ai/assist` | Sync AI assist (rate limited) |
| POST | `/api/ai/assist/stream` | SSE AI assist stream |
| GET | `/api/search` | Entry search (title/content, scoped) |
| GET | `/api/journal/events` | SSE journal mutation stream |
| GET | `/api/health` | Health check |

---

## 7. Cache & invalidation (verified)

| Event | Mechanism |
|-------|-----------|
| Online CRUD | `invalidateQueries({ queryKey: queryKeys.journalSubtree() })` |
| Offline write | Optimistic `setQueryData` + `notifyJournalCacheUpdated` (`refetchType: "none"` offline) |
| Sync drain | `useOfflineSyncQueue` → API → id remap events → `notifyJournalCacheUpdated` |
| Auth login/register/OAuth | `journalSubtree` invalidation |
| Sign-out | `queryClient.clear()` before `signOut()` |
| Shelf hover | `useJournalPrefetch` — route + `bookDetail` prefetch |
| Other-tab mutation | SSE → `useJournalRealtime` → `notifyJournalCacheUpdated` |
| Server write | `afterJournalMutation` → Redis publish (fire-and-forget) |
| All client CRUD | **Only** `notifyJournalCacheUpdated` in `journal-cache-notify.ts` |

SSR: dashboard/journal pages fetch server-side; client `useQuery` uses SSR `initialData` with `staleTime: 60_000`.

---

## 8. Deployment shape (conceptual)

```mermaid
flowchart LR
  Browser[Browser]
  Next[Next.js app]
  Prisma[Prisma Client]
  DB[(PostgreSQL)]

  Browser --> Next
  Next --> Prisma
  Prisma --> DB
```

- **Local:** PostgreSQL via `.env` (`DATABASE_URL` + `DIRECT_URL`). Optional: `docker compose up -d db` for a throwaway local instance (see `docker-compose.yml`).
- **Production:** Next.js on **Vercel**; database on hosted/self-managed Postgres (not Docker in this repo).

---

## 9. Audit notes (2026-06-01 — C2)

### Verified passing

- `npm run lint` / `typecheck` / `test` / `build` — pass (stop `dev` before build, or `rm -rf .next`)
- `npm run test:e2e` — pass with `dev` on :3000 + `test:e2e:install` (2 pass, 1 skip w/o seed)
- C2 waves 1–8: Redis, AI provider, toasts, ripple, TipTap, SSE realtime, search, ⌘K palette, themes
- Server `afterJournalMutation` on all books/entries routes
- Client `journalSubtree` invalidation on CRUD + auth + offline + SSE
- `force-dynamic` on dashboard/auth/journal pages + search/events APIs
- `.agile-v/` CR-0003; REQ-0013–0018 → implemented

### C3 hardening (2026-06-01)

1. **Invalidation** — all client paths use `notifyJournalCacheUpdated` / `AndRefetch` (no raw `journalSubtree` elsewhere).
2. **⌘K theme** — `Cycle page theme` in CommandPalette when on `/journal/[bookId]`.
3. **SSE** — adaptive 500ms poll, `?since=` reconnect, stream `cancel()` cleanup, hidden-tab pause.
4. **Tests** — Vitest 12 unit; Playwright 3 e2e smoke (`npm run test:e2e:install` once, dev on :3000); theme-cycle skips if shelf empty; CI has no e2e.
5. **Demo login** — on by default; `SHOW_DEMO_LOGIN=false` for prod.

### UI polish (2026-06-01)

1. **Landing** — `--cover-w/h` 80% viewport; scaled cover typography; `TypewriterText` CTA; Lucide icons on CTAs; fixed `RippleButton` shine wrap.
2. **Auth** — `.book-viewport-80`; unified `auth-form-styles`; demo robohash avatar; Clear Section disabled when fields empty; Google button matches primary shape.
3. **Journal** — `JournalWriteFooter` / `JournalReadFooter`; readable AI Assist; nav icons; welcome toast `HandMetal` + Sonner gap.

### Leather glass polish — wave 2 (2026-06-01)

1. **Tokens** — `leather-glass-styles.ts` + `.leather-glass-*` utilities in `globals.css` (amber/leather glassmorphism from `UI_STYLING_GUIDE`).
2. **Landing** — closed cover **70%** viewport with vertical padding; CTA icons inline with labels (no `display:inline-block` override); glass primary/outline buttons.
3. **Auth** — `AvatarRing` + `DemoAccountMenuRow` (inline name · email, equal row heights); glass panel/inputs on login/register/Google.
4. **Nav + toast** — `DashboardNav` circular `AvatarRing`; `RippleButton` skips default radius unless shine; `.journal-toast` centers Sonner icon vertically.
5. **Journal chrome** — `.leather-glass-nav-pill` on spread nav; `.leather-glass-action-btn` on footers; paper pages stay flat (no blur).
6. **Dev** — `next.config.ts` immutable `Cache-Control` on `/_next/static` production-only (fixes lucide HMR stale chunk in dev).

**Audit (2026-06-01):** Plan phases W1–W6 complete. No invalidation/SSR/query regressions. `lint` · `typecheck` · 12 vitest · `build` pass (`rm -rf .next` if dev server holds lock). Optional cosmetic: demo row could add `·` between name/email. Commit `859de14`.

---

## 10. SQLite vs PostgreSQL on the VPS (recommendation)

| Concern | SQLite on VPS | PostgreSQL on VPS |
|--------|----------------|-------------------|
| Multiple Next.js instances / horizontal scale | Poor fit (single writer, file locking) | Good |
| App and DB on different machines (e.g. Vercel → DB) | Awkward (network file or sync pain) | **Natural fit** (your guide’s pattern) |
| Concurrent writes (autosave, many users) | Weaker | **Stronger** |
| Prisma FKs / relations | Supported | **Supported** with mature tooling |
| Ops / backups | File copy | **pg_dump**, volume snapshots, Coolify backups as in guide |

**Recommendation for this project:** Use **PostgreSQL everywhere** (local `.env` and production). The app deploys on **Vercel**; optional `docker-compose.yml` runs **only Postgres** for devs who do not use a remote database.

**Foreign keys:** Keep defining relationships in `schema.prisma` as today. After switching `provider = "postgresql"`, run `prisma generate` and apply schema with **`prisma db push`** (as your guide stresses for permission/shadow-DB issues) or `migrate deploy` once you have a clean migration story.

Optional: add `directUrl` in `schema.prisma` if you use connection poolers (PgBouncer); your migration guide mentions `DATABASE_URL` and `DIRECT_URL` for Prisma.

---

## 11. Short answer: creating the database on the VPS (terminal)

Aligned with **`docs/HETZNER_VPS_MIGRATION_GUIDE.md`** (generic project names — substitute your container name if yours differs):

1. **SSH** to the server (`ssh deploy@YOUR_VPS_IP`).
2. **Open psql inside the Postgres container:**  
   `sudo docker exec -it YOUR_POSTGRES_CONTAINER_NAME psql -U postgres`
3. **Run SQL** (naming convention from the guide, e.g. `storybook_journal_db` / `storybook_journal_user`):
   - `CREATE DATABASE storybook_journal_db;`
   - `CREATE USER storybook_journal_user WITH PASSWORD 'strong_password';`
   - `GRANT ALL PRIVILEGES ON DATABASE storybook_journal_db TO storybook_journal_user;`
   - `\c storybook_journal_db`
   - Grant **schema** privileges on `public` (critical for Prisma):  
     `GRANT ALL ON SCHEMA public TO storybook_journal_user;`  
     plus the `ALL TABLES` / `ALL SEQUENCES` / `ALTER DEFAULT PRIVILEGES` statements as in the guide’s Step 2 block.
4. **Point the app** at `postgresql://storybook_journal_user:...@HOST:PORT/storybook_journal_db` (internal `5432` vs exposed `25432` per your setup).
5. **Locally or in CI:** set `provider = "postgresql"` in `schema.prisma`, set `DATABASE_URL`, then `npx prisma generate` and **`npx prisma db push`** (per guide preference over `migrate dev` on restricted users).

That is the full loop: **terminal → Postgres in Docker → DB + user + schema grants → connection string → Prisma generate + db push.**

---

## 12. Related docs

- `README.md` — setup, env vars, API, learning walkthrough, stack badges.
- `CLAUDE.md` — compact agent instructions (gitignored locally).
- `docs/AUTH_UI_IMPLEMENTATION_GUIDE.md` — OAuth flicker, avatar, session patterns.
- `docs/DROPDOWN_TEST_CREDENTIALS_DOCS.md` — demo account + NextAuth reference.
- `docker-compose.yml` — optional local Postgres only (not used for Vercel deploy).
- `.agile-v/` — Agile V traceability (C2: CR-0003, REQ-0013–0018, ART-0049–0062).

---

*Last reviewed: 2026-06-01 — leather glass wave 2; lint/typecheck/test/build pass.*
