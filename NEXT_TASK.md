# NEXT_TASK.md

## Current Locked Task

- `Phase`: `P5-PRODUCT`
- `Process`: `PROC-DOC`
- `Task ID`: `P5-PLAN-002`

## Task

Define canonical state entities and the repository boundary for the `Learning Record Store` without choosing database or API implementation details.

## Scope

In scope:

- define the canonical records that belong in the `Learning Record Store`
- define which modules own writes and reads across that boundary
- define which current artifacts are canonical versus derived
- update control docs if needed so the task is unambiguous

Out of scope:

- database implementation
- API implementation
- auth/user implementation
- learner runtime UI changes
- changes to source-of-truth YAML or schemas

## Done Criteria

- canonical records are named clearly
- canonical versus derived state is explicit
- control docs are consistent with the new phase lock
- work is committed and pushed

## Why This Task

This is the smallest next step after choosing the first product boundary, and it keeps the repository from jumping into implementation before the canonical state contract is written.
