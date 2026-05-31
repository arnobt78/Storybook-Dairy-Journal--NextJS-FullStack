# Checkpoints (durable HITL)

<!-- INTERRUPT-ID | resume_token | status -->

| INT-ID | Cycle | Gate | Status | due_at | resume_token | Scope | Created |
|--------|-------|------|--------|--------|--------------|-------|---------|
| — | — | — | — | — | — | No pending interrupts | — |

## Resume protocol

1. Find row with `status=PENDING`.
2. Human action recorded in APPROVALS.md with matching `resume_token`.
3. Agent reads STATE.md + checkpoint; continues from documented stage only.
