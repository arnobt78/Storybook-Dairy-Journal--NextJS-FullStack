# 📖 StoryBook Journal

A premium immersive journaling app with realistic 3D page-flip animations, leather book aesthetic, AI writing assistance, and full auth.

---

## ✨ What was fixed in this release

| Issue | Fix |
|-------|-----|
| Auth page links not working | Removed leftover agent-debug `fetch()` calls that blocked navigation handlers |
| Book opens but then blank flash | Route push now fires **after** flip animation completes (inside `onComplete` callback) |
| Page turn shows blank then UI appears | Stagger classes (`page-stagger-fwd/bwd`) animate content in after the 650ms flip |
| Buttons on landing page broken | Plain `<button>` with `onClick` instead of `<Link>` wrapping conflicting with `e.preventDefault` |
| Book fixed size, cut off on screen | All pages sized via CSS `clamp()` custom properties (`--page-w`, `--page-h`) |
| No sign-out animation | Book-close animation overlay plays before `signOut()` is called |
| AI key exposed in browser | AI Assist proxied through `/api/ai/assist` server route |

---

## 🚀 Setup (3 commands)

```bash
cd storybook-journal
npm install
cp .env.example .env   # set DATABASE_URL + DIRECT_URL (PostgreSQL)
npx prisma generate && npm run db:push
npm run dev
```

Open **http://localhost:3000**

**Test credentials (pre-filled via dropdown on login page):**
- Email: `test@user.com`
- Password: `12345678`

The test account is created automatically when the first real user registers (idempotent seed in the register API route).

---

## 🤖 AI Writing Assist

Add your Anthropic API key to `.env.local`:
```env
ANTHROPIC_API_KEY="sk-ant-..."
```

Without a key the button still works — it returns a poetic placeholder sentence so you can test the UI flow.

---

## 🗄️ Database (PostgreSQL)

Prisma needs `DATABASE_URL` and `DIRECT_URL` in `.env` (copy from `.env.example`).

| Environment | How to run the app | Database |
|-------------|-------------------|----------|
| **Local dev** | `npm run dev` | Your `.env` URL (remote Postgres or optional local Docker DB) |
| **Production** | Vercel (no Docker) | Same vars in Vercel project settings |

**Default workflow:** set both URLs in `.env`, then:

```bash
npx prisma generate && npm run db:push && npm run db:seed
```

**Optional — local Postgres only** (not required for Vercel):

```bash
docker compose up -d db
# uncomment the docker lines in .env.example, then db:push + db:seed as above
```

There is no app `Dockerfile`; deployment is Vercel-native.

---

## 📁 Key files changed

```
src/hooks/usePageFlip.ts          — removed agent logs, clean re-entrancy guard
src/components/auth/AuthBookShell.tsx — push AFTER flip, no agent logs
src/components/journal/BookCover.tsx  — shine sweep, fixed nav timing
src/components/journal/RightPage.tsx  — stagger animation after flip
src/components/journal/LeftPage.tsx   — entry list stagger
src/components/journal/BookSpread.tsx — AI via server route, flipDir forwarded
src/components/journal/PageFlip.tsx   — CSS var sizing
src/components/layout/DashboardNav.tsx — robohash avatar, book-close logout
src/components/forms/LoginForm.tsx    — test credentials dropdown
src/app/api/ai/assist/route.ts        — NEW: server-side Anthropic proxy
src/app/globals.css                   — all animations, CSS vars, responsive sizing
```

---

## 🎨 Features

- **Leather book cover** with continuous gold shine sweep, hover 3D tilt
- **Animated cover open** — inner pages hinge apart before navigating
- **3D CSS page flip** — preserve-3d, front/back ruled-paper faces
- **Content stagger** — each line of a new entry slides in after the flip (GSAP-style without GSAP)
- **Book-close logout** — cover slams shut animation before sign-out
- **Test credentials dropdown** on login
- **Robohash avatar** in nav (deterministic robot from your email)
- **AI writing assist** via Anthropic Claude (server-proxied)
- **Auto query invalidation** — saves/creates/deletes update the shelf count without refresh
- **Responsive book** — 85% viewport fill via CSS clamp()
- **Multiple journals** — custom cover color + emoji
