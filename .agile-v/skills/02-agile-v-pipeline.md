# Skill manifest: agile-v-pipeline

<!-- C1 | See SKILLS_INDEX.md | Cursor skill: ~/.cursor/skills/agile-v-pipeline/SKILL.md -->

| Field | Value |
|-------|-------|
| **Skill** | `agile-v-pipeline` |
| **V-Position** | Orchestrator |
| **SCOPE-V phases** | Orchestrate |
| **Cycle** | C1 |

## Primary outputs

- Stage transitions, wave plan, CHECKPOINTS

## Linked REQs (storybook-journal)

REQ-0024

## Handoffs

Req Architect → Gatekeeper → Build∥Test → Red Team → Gate 2

## Load when

Multi-agent pipeline runs

## Project notes

- Read `.agile-v/STATE.md` before acting.
- Append decisions to `DECISION_LOG.md`; never overwrite.
- Honor `POLICY.yaml` (query invalidation, no self-verify, traceability).
