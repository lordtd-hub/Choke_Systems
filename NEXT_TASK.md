# NEXT_TASK.md

## Current Locked Task

- `Phase`: `P5-PRODUCT`
- `Process`: `PROC-DOC`
- `Task ID`: `P5-PLAN-007`

## Task

Define the first implementation task package for `state-identity`, `state-records`, and file-backed repository ports without choosing database or API implementation details.

## Scope

In scope:

- define the files/modules that belong to the first build slice
- define the acceptance criteria for that slice
- define what must not change while that slice is implemented
- update control docs if needed so the task is unambiguous

Out of scope:

- database implementation
- API implementation
- auth/user implementation
- learner runtime UI changes
- changes to source-of-truth YAML or schemas

## Done Criteria

- first implementation package is explicit
- first-slice acceptance criteria are explicit
- control docs are consistent with the new phase lock
- work is committed and pushed

## Why This Task

This is the smallest next step after defining the build sequence, and it keeps the repository from jumping into implementation before the first slice is packaged clearly.
