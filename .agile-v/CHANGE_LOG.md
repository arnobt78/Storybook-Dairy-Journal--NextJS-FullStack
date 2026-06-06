# Change Log (append-only)

<!-- CR-XXXX — Requirement Architect creates; Gate approves before REQUIREMENTS.md edit -->

| CR-ID | Cycle | Affected REQ | Change | Rationale | Impact (ART/TC) | Requested by | Approval |
|-------|-------|--------------|--------|-----------|-----------------|--------------|----------|
| CR-0001 | C1 | REQ-0020, REQ-0025–0027 | Infrastructure pivot: PostgreSQL, Vercel deploy, secrets hygiene, docker-compose db-only | SQLite removed; fresh GitHub; user security audit | ART-0029–0036; TC-0022, TC-0025–0027 | Project Owner | **APPROVED** GATE-0003 |
| CR-0002 | C1 | REQ-0015, REQ-0010, REQ-0023, REQ-0028 | Offline MVP + AI stream + SEO site-metadata + production guardrails | C1 synthesis completion per architectural plan | ART-0037–0048; TC-0017, TC-0028–0030 | Project Owner | **APPROVED** (bootstrap r2) |
| CR-0003 | C2 | REQ-0013–0014, REQ-0016–0018, REQ-0010 | C2 Platform Upgrade: Upstash Redis rate-limit + SSE realtime, Groq/OpenRouter AI, Sonner toasts, RippleButton, TipTap, search, command palette, book themes | Multi-wave platform upgrade per C2 plan; preserves SSR-in-page + journalSubtree invalidation | ART-0049–0062; TC-0015–0020 static audit | Project Owner | **APPROVED** (implementation complete) |
