# Decision Log (append-only)

<!-- Principle #9 — never overwrite; cycle-tag entries -->

| Timestamp | ID | Cycle | Agent | Decision | Rationale | Linked REQ |
|-----------|-----|-------|-------|----------|-----------|------------|
| 2026-03-16T00:00:00Z | DEC-0001 | C1 | bootstrap-agent | Initialize `.agile-v/` C1 living AQMS | User requested Agile V Infinity Loop bootstrap with REQ traceability for in-flight StoryBook Journal | REQ-0024 |
| 2026-03-16T00:00:01Z | DEC-0002 | C1 | bootstrap-agent | Tag REQs 0001–0012 as `implemented` retroactive baseline | Codebase already contains auth, shelf, spread, nav, query invalidation | REQ-0001–0012 |
| 2026-03-16T00:00:02Z | DEC-0003 | C1 | bootstrap-agent | Gate 1 deferred — blueprint pending human approval | Per agile-v-core HITL; STATE.md marks Gate 1 PENDING | REQ-0024 |
| 2026-03-16T00:00:03Z | DEC-0004 | C1 | bootstrap-agent | Use TanStack `journalSubtree()` as standard CRUD invalidation | Matches existing src/lib/query-keys.ts; POLICY.yaml enforces | REQ-0007 |
| 2026-03-16T00:00:05Z | DEC-0006 | C1 | bootstrap-agent | Gitignore Hetzner migration guide; remove from remote tracking | User request; ops doc stays local only | REQ-0020 |
| 2026-03-16T12:00:00Z | DEC-0007 | C1 | logic-gatekeeper | Stage 2 PASS with 4 FLAGS | GATE-0001 approved blueprint | REQ-0024 |
| 2026-03-16T12:00:01Z | DEC-0008 | C1 | red-team-verifier | Stage 4 static PASS; e2e NOT RUN | REQ-0021 blocks Gate 2 | REQ-0021 |
