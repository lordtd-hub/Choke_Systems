# NEXT_TASK.md

## Current Locked Task

- `Phase`: `P5-PRODUCT`
- `Process`: `PROC-DOC`
- `Task ID`: `P5-PLAN-004`

## Task

Define the persistent application state layer shape for the `Learning Record Store` without choosing database or API implementation details.

## Scope

In scope:

- define the modules that make up the state layer
- define the responsibilities at each module seam
- define which existing prototype modules map into that state layer
- update control docs if needed so the task is unambiguous

Out of scope:

- database implementation
- API implementation
- auth/user implementation
- learner runtime UI changes
- changes to source-of-truth YAML or schemas

## Done Criteria

- state-layer modules are explicit
- responsibility boundaries are explicit
- control docs are consistent with the new phase lock
- work is committed and pushed

## Why This Task

This is the smallest next step after defining mutation flow, and it keeps the repository from jumping into implementation before the state layer shape is written down.
