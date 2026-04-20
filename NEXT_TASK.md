# NEXT_TASK.md

## Current Locked Task

- `Phase`: `P5-PRODUCT`
- `Process`: `PROC-DOC`
- `Task ID`: `P5-PLAN-011`

## Task

Define the swap-ready repository implementation boundary for product persistence.

## Scope

In scope:

- define the repository-implementation boundary that a future non-file-backed store must satisfy
- define what the current file-backed adapter preserves and what a future adapter may replace
- define the stability rules for services, projections, and output contracts during a future adapter swap
- update control docs so the repo lock is unambiguous

Out of scope:

- database implementation
- API implementation
- auth/user implementation
- learner runtime UI changes
- changes to source-of-truth YAML or schemas

## Done Criteria

- the swap-ready repository boundary is explicit
- preserved versus replaceable seams are explicit
- the next controlled task after this planning slice is explicit
- control docs are consistent
- work is committed and pushed

## Why This Task

The first `Learning Record Store` migration is complete enough to move on, and the smallest safe next step is to plan the future storage-adapter swap boundary before any concrete backend implementation starts.
