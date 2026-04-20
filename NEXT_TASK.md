# NEXT_TASK.md

## Current Locked Task

- `Phase`: `P5-PRODUCT`
- `Process`: `PROC-DOC`
- `Task ID`: `P5-PLAN-003`

## Task

Define mutation flow, write ordering, and projection inputs for the `Learning Record Store` without choosing database or API implementation details.

## Scope

In scope:

- define the order in which runtime, assessment, and analytics write canonical records
- define which writes are mutable versus append-only
- define which projections consume which canonical records
- update control docs if needed so the task is unambiguous

Out of scope:

- database implementation
- API implementation
- auth/user implementation
- learner runtime UI changes
- changes to source-of-truth YAML or schemas

## Done Criteria

- write flow is explicit
- projection inputs are explicit
- control docs are consistent with the new phase lock
- work is committed and pushed

## Why This Task

This is the smallest next step after defining the canonical record contract, and it keeps the repository from jumping into implementation before mutation flow is written down.
