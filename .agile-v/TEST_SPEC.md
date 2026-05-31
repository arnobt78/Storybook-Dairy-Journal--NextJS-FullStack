# Test Specification

<!-- TC-XXXX — Red Team updates Status after each run -->

| TC-ID | Cycle | Linked REQ | Description | Type | Status | Last run |
|-------|-------|------------|-------------|------|--------|----------|
| TC-0001 | C1 | REQ-0001 | Register new user → redirect dashboard | e2e | NOT RUN | — |
| TC-0002 | C1 | REQ-0001 | Login credentials → session cookie | e2e | NOT RUN | — |
| TC-0003 | C1 | REQ-0002 | Create book → appears on shelf | integration | NOT RUN | — |
| TC-0004 | C1 | REQ-0003 | Save entry PATCH persists content | integration | NOT RUN | — |
| TC-0005 | C1 | REQ-0003 | New entry POST + page flip | e2e | NOT RUN | — |
| TC-0006 | C1 | REQ-0004 | Page flip fwd/bwd without blank spread | e2e | NOT RUN | — |
| TC-0007 | C1 | REQ-0005 | Landing cover opens without error | e2e | NOT RUN | — |
| TC-0008 | C1 | REQ-0006 | Profile dropdown + sign-out overlay | e2e | NOT RUN | — |
| TC-0009 | C1 | REQ-0007 | CRUD invalidates shelf without reload | integration | **PASS** (static) | 2026-03-16 |
| TC-0010 | C1 | REQ-0008 | New book opens with starter entry | integration | **PASS** (static) | 2026-03-16 |
| TC-0011 | C1 | REQ-0009 | Demo account fill + login | e2e | NOT RUN | — |
| TC-0012 | C1 | REQ-0010 | AI assist appends text or graceful error | integration | NOT RUN | — |
| TC-0013 | C1 | REQ-0011 | Spread scales at 1280/1440/768 widths | manual | NOT RUN | — |
| TC-0014 | C1 | REQ-0012 | Unauthorized API returns 401 | integration | **PASS** (static) | 2026-03-16 |
| TC-0015 | C1 | REQ-0013 | TipTap formatting persists | e2e | PLANNED | — |
| TC-0016 | C1 | REQ-0014 | Two tabs receive entry update | e2e | PLANNED | — |
| TC-0017 | C1 | REQ-0015 | Draft survives offline refresh | e2e | PLANNED | — |
| TC-0018 | C1 | REQ-0016 | Search finds entry by tag | integration | PLANNED | — |
| TC-0019 | C1 | REQ-0017 | Command palette opens with ⌘K | e2e | PLANNED | — |
| TC-0020 | C1 | REQ-0018 | Theme switch updates cover color | e2e | PLANNED | — |
| TC-0021 | C1 | REQ-0019 | GET /api/health returns ok JSON | integration | **PASS** (static) | 2026-03-16 |
| TC-0022 | C1 | REQ-0020 | Docker build succeeds | ci | PLANNED | — |
| TC-0023 | C1 | REQ-0022 | axe: no critical a11y on login | a11y | FLAG | 2026-03-16 partial audit |
| TC-0024 | C1 | REQ-0023 | Root metadata title present | unit | **PASS** (static) | 2026-03-16 |

## Regression baseline (Gate 2)

TC-0001–0014 + TC-0021 + TC-0023–0024 — **5/18 runnable without e2e harness; 4 PASS static, 1 FLAG, 13 NOT RUN**
