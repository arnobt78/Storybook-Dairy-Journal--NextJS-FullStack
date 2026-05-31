# Risk Register (append-only, cycle-tagged)

| RISK-ID | Cycle | Category | Description | L | I | Severity | Mitigation | Owner | Status |
|---------|-------|----------|-------------|---|---|----------|------------|-------|--------|
| RISK-0001 | C1 | Security | API keys in client bundle | L | H | Medium | Server-only AI route; POLICY.yaml | Build Agent | open |
| RISK-0002 | C1 | Technical | Hydration mismatch from browser extensions | M | L | Low | suppressHydrationWarning on html/body | Build Agent JS | mitigated |
| RISK-0003 | C1 | Technical | Empty journal on new book (no entries) | M | M | Medium | Starter entry transaction REQ-0008 | Build Agent | mitigated |
| RISK-0004 | C1 | Process | Retroactive REQs without Gate 1 sign-off | M | M | Medium | GATE-0001 approved 2026-03-16 | Product Owner | **mitigated** |
| RISK-0005 | C1 | Technical | Missing automated regression (TC not run) | H | M | High | Stage 4 + Vitest/Playwright REQ-0021 | Test Designer | open |
