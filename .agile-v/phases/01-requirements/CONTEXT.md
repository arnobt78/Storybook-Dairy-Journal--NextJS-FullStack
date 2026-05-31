# Phase 01 — Context

## Product

**StoryBook Journal** — premium immersive journaling SaaS (Next.js 16, React 19, Prisma, TanStack Query).

## User intent (C1 bootstrap)

- Establish Agile V AQMS with full traceability
- Document in-flight implementation
- Plan extension: TipTap, realtime, offline, search, deploy

## Constraints

- No hydration regressions; query invalidation on all CRUD
- Server-only secrets; POLICY.yaml enforced
- Human gates before synthesis changes to approved REQs

## References

- `CLAUDE.md` — architecture vision
- `docs/HETZNER_VPS_MIGRATION_GUIDE.md` — REQ-0020
- `src/lib/query-keys.ts` — REQ-0007
