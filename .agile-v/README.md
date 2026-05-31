# Agile V — StoryBook Journal

<!-- Cycle: C1 | Standard: Agile V 1.4 | Project: storybook-journal -->

Living **Autonomous Quality Management System (AQMS)** for this repository. All agents load **agile-v-core** first, then domain skills on demand.

## Quick start

1. Read **`STATE.md`** — current cycle, stage, gate, resume token (if any).
2. Read **`REQUIREMENTS.md`** — REQ-XXXX source of truth; halt if parent REQ missing.
3. On Human Gate pause, read **`CHECKPOINTS.md`** + **`APPROVALS.md`** before resuming.
4. Append only to **`DECISION_LOG.md`**, **`TRACE_LOG.md`**, **`CHANGE_LOG.md`**.

## File map

| File | Purpose |
|------|---------|
| `STATE.md` | Current phase/stage/status |
| `REQUIREMENTS.md` | Traceable REQs (Gate 1 artifact) |
| `BUILD_MANIFEST.md` | ART-XXXX artifact registry |
| `TEST_SPEC.md` | TC-XXXX test cases |
| `VALIDATION_SUMMARY.md` | Red Team / cycle validation rollup |
| `DECISION_LOG.md` | Append-only decisions (Principle #9) |
| `ATM.md` | Audit traceability matrix |
| `CHANGE_LOG.md` | CR-XXXX change requests |
| `RISK_REGISTER.md` | RISK-XXXX register |
| `CAPA_LOG.md` | CAPA-XXXX nonconformance |
| `APPROVALS.md` | GATE-XXXX human signatures |
| `REVALIDATION_LOG.md` | REVAL-XXXX periodic review |
| `EVAL_RESULTS.md` | Eval flywheel + Gate 2 `eval_gate_status` |
| `CHECKPOINTS.md` | Durable HITL interrupts |
| `TRACE_LOG.md` | Policy/tool spans |
| `POLICY.yaml` | Policy-as-code |
| `config.json` | Project + LLM registry |
| `skills/` | 24 agent skill manifests |
| `phases/` | Stage PLAN / SUMMARY / CONTEXT |
| `cycles/C1/` | Frozen snapshot on Gate 2 accept |

## Pipeline (5 stages)

```
Stage 1 Requirements → Stage 2 Validation → [Gate 1] →
Stage 3 Synthesis (Build ∥ Test Design) → Stage 4 Verification → [Gate 2] → Stage 5 Acceptance
```

Compliance Auditor observes all stages.

## Traceability rule

**Never create an artifact without a parent REQ-XXXX.**
