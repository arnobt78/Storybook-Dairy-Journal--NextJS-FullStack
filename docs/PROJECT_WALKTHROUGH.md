# Storybook Journal — Project walkthrough

This document is a **persistent map** of the repository: what the product is, how requests flow, where data lives, and how that lines up with deployment (including a Hetzner-style VPS PostgreSQL setup). It is meant to be read months later without re-auditing the whole tree.

---

## 1. What this project is

**Storybook Journal** is a Next.js 15 web app that presents a **leather-bound, two-page “book spread”** journal. Users:

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
| Global client store | **Zustand** (`src/stores/journalStore.ts`) — defined but unused (see §8) |
| Animations | Custom page-flip hook + overlay (`usePageFlip`, `PageFlip`) |
| Toasts | **Sonner** |
| AI | Server proxy `/api/ai/assist` (Anthropic key server-only) |
| Production | **Vercel** — https://storybook-journal.vercel.app |

---

## 3. Repository layout (high signal)

```
src/app/
  page.tsx                    # Landing → redirect if logged in
  layout.tsx, providers.tsx   # fonts, SessionProvider, QueryClient, Toaster
  (auth)/login, register      # Auth pages + forms
  (dashboard)/
    layout.tsx                # Shell + nav
    dashboard/page.tsx        # SSR: list books, render BookShelf
    journal/[bookId]/page.tsx # SSR: load book + entries, render BookSpread
  api/
    auth/[...nextauth]/       # NextAuth GET/POST
    auth/register/            # Email registration + seed book/entry
    books/, books/[bookId]/   # Journal CRUD
    entries/, entries/[entryId]/

src/lib/
  db.ts                       # PrismaClient singleton (dev HMR guard)
  auth.ts                     # NextAuth + Google signIn → provisionOAuthUser
  auth/provision-oauth-user.ts # Google user + welcome journal transaction
  auth/is-google-enabled.ts   # Server-only OAuth env check
  auth/google-oauth-env.ts    # GOOGLE_CLIENT_* + legacy GOOGLE_ID/SECRET aliases
  auth/get-auth-page-config.ts # SSR flags for login/register (force-dynamic)
  query-keys.ts               # journalSubtree() — single invalidation root
  validations.ts              # Zod schemas shared by API routes
  utils.ts                    # slugify, tags JSON, word counts, dates

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
2. `BookShelf` (client) keeps a copy of books in state; creating a book calls `POST /api/books` and prepends the result.

### 6.3 Journal reader

1. `journal/[bookId]/page.tsx` is a **Server Component**: loads book + non-archived entries ordered by `createdAt` asc; maps `tags` from stored string via `parseTags`.
2. `BookSpread` (client) holds **entries**, current index, write mode, draft, save state. It:
   - **Patches** the current entry via `PATCH /api/entries/[entryId]` on explicit save.
   - **Posts** new entries via `POST /api/entries` with client-supplied `entryDate` / `weekday` (API overwrites with `formatEntryDate()` anyway — minor redundancy).
3. `useAutoSave` exists for debounced PATCH to `/api/entries/[id]`; confirm it is mounted where needed if you rely on autosave (it is not central to `BookSpread`’s main save path in the audited flow).

### 6.4 API summary

| Method | Path | Role |
|--------|------|------|
| GET/POST | `/api/auth/[...nextauth]` | NextAuth |
| POST | `/api/auth/register` | Register + seed data |
| GET, POST | `/api/books` | List / create books |
| GET, PATCH, DELETE | `/api/books/[bookId]` | Book + entries payload, update, delete |
| POST | `/api/entries` | Create entry (checks book ownership) |
| PATCH, DELETE | `/api/entries/[entryId]` | Update / delete (scoped by userId) |

---

## 7. Deployment shape (conceptual)

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

## 8. Audit notes (risks / cleanup candidates)

1. **`useJournalStore` unused** — journal UI uses React state + TanStack Query; store optional cleanup.
2. **Demo account on production** — `test@user.com` picker visible on login; gate behind `NODE_ENV` before wide public launch (`.agile-v` RISK-0006).
3. **Automated tests** — Vitest/Playwright not yet wired (REQ-0021 / Gate 2 pending).
4. **`useAutoSave` not mounted** — hook exists with `journalSubtree` invalidation but `BookSpread` uses explicit save only.
5. **Future phases not implemented** — Redis, BullMQ, SSE/pub-sub, offline IndexedDB (architecture doc only).
6. **Google Console** — origins + redirect URIs must include Vercel URL and `http://localhost:3000`.

---

## 9. SQLite vs PostgreSQL on the VPS (recommendation)

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

## 10. Short answer: creating the database on the VPS (terminal)

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

## 11. Related docs

- `README.md` — setup, PostgreSQL, Vercel deploy notes.
- `docs/AUTH_UI_IMPLEMENTATION_GUIDE.md` — OAuth flicker, avatar, session patterns.
- `docs/DROPDOWN_TEST_CREDENTIALS_DOCS.md` — demo account + NextAuth reference.
- `docker-compose.yml` — optional local Postgres only (not used for Vercel deploy).
- `.agile-v/` — Agile V C1 traceability (REQ-0001–0027).

---

*Last reviewed against the repository layout and key source files as part of a structured codebase audit.*
