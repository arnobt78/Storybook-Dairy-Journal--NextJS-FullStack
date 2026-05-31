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
| Framework | Next.js 15 App Router (`src/app`) |
| UI | React 19, Tailwind 3, heavy **inline styles** for the book aesthetic |
| Auth | **NextAuth v5** (`next-auth@5 beta`) — JWT sessions, Credentials + optional Google |
| ORM / DB | **Prisma 6** + SQLite (`file:./dev.db`) by default |
| Validation | **Zod** (`src/lib/validations.ts`) |
| Client data fetching | **TanStack Query** wired in `providers.tsx` (available app-wide; journal UI mostly uses `fetch` + local React state) |
| Global client store | **Zustand** (`src/stores/journalStore.ts`) — **defined but not imported** elsewhere (see §8) |
| Animations | Custom page-flip hook + overlay (`usePageFlip`, `PageFlip`) |
| Toasts | **Sonner** |
| Optional AI | `BookSpread` calls **Anthropic Messages API** from the **browser** (see §8) |

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
  auth.ts                     # NextAuth config + prisma in authorize
  validations.ts              # Zod schemas shared by API routes
  utils.ts                    # slugify, tags JSON, word counts, dates

prisma/schema.prisma          # User, JournalBook, JournalEntry (+ relations)
```

There is **no `prisma/migrations/`** directory in the repo at audit time; local setup may rely on `prisma migrate dev` (creates migrations) or `prisma db push` (schema sync without migration files). `package.json` includes `db:migrate`, `db:push`, and a `setup` script that runs `migrate dev --name init`.

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
- **Credentials login:** `authorize` loads user by email, compares `bcryptjs` hash, updates `lastLoginAt`.
- **Google:** Optional; if `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` are unset, the Google provider array is empty. **Note:** There is no `signIn` callback linking Google accounts to `User` rows in Prisma in the audited `auth.ts`; Google sign-in may succeed at the OAuth layer but **account linking / user creation in DB** may need verification if you enable Google for real users.

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
  DB[(SQLite file OR PostgreSQL)]

  Browser --> Next
  Next --> Prisma
  Prisma --> DB
```

- **Local:** PostgreSQL via `.env` (`DATABASE_URL` + `DIRECT_URL`). Optional: `docker compose up -d db` for a throwaway local instance (see `docker-compose.yml`).
- **Production:** Next.js on **Vercel**; database on hosted/self-managed Postgres (not Docker in this repo).

---

## 8. Audit notes (risks / cleanup candidates)

1. **`useJournalStore` unused** — Only referenced in `journalStore.ts`. Journal UI uses local `useState` inside `BookSpread` / `BookShelf`. Either wire the store or remove it to avoid confusion.
2. **Anthropic from the client** — `BookSpread` posts to `https://api.anthropic.com/v1/messages` without an `x-api-key` in the audited snippet; in practice the key cannot live safely in the browser. Production should use a **server Route Handler** that reads `ANTHROPIC_API_KEY` from env and proxies the request.
3. **`.env.example`** — Contains illustrative OAuth values; treat as non-secret placeholders and rotate anything that was ever real.
4. **Google OAuth + DB** — If you need Google users in Prisma, add an adapter or `signIn`/`events` flow to create/link `User` records.
5. **No migration folder** — For production discipline, commit `prisma/migrations` or document a single source of truth (`db push` vs `migrate deploy`).

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

- `README.md` — setup, structure, PostgreSQL switch instructions.
- `docs/HETZNER_VPS_MIGRATION_GUIDE.md` — VPS, Coolify, Prisma vs Drizzle, `db push`, privileges, connection strings.
- `docker-compose.yml` — optional local Postgres only (not used for Vercel deploy).

---

*Last reviewed against the repository layout and key source files as part of a structured codebase audit.*
