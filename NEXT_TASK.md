# NEXT_TASK.md

## Current Locked Task

- `Phase`: `P5-PRODUCT`
- `Process`: `PROC-DOC`
- `Task ID`: `P5-PLAN-005`

## Task

Define repository ports and service interfaces for the `Learning Record Store` without choosing database or API implementation details.

## Scope

In scope:

- define repository ports for canonical records
- define service interfaces for mutation and projection access
- define which existing prototype modules map to those interfaces
- update control docs if needed so the task is unambiguous

Out of scope:

- database implementation
- API implementation
- auth/user implementation
- learner runtime UI changes
- changes to source-of-truth YAML or schemas

## Done Criteria

- repository ports are explicit
- service interfaces are explicit
- control docs are consistent with the new phase lock
- work is committed and pushed

## Why This Task

This is the smallest next step after defining the state layer shape, and it keeps the repository from jumping into implementation before repository and service seams are written down.
