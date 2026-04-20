# NEXT_TASK.md

## Current Locked Task

- `Phase`: `P5-PRODUCT`
- `Process`: `PROC-DOC`
- `Task ID`: `P5-PLAN-010`

## Task

Define the fourth implementation package for rewiring dashboard and CQI builders onto query/projection services without choosing database or API implementation details.

## Scope

In scope:

- define the files/modules that belong to the fourth build slice
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

- fourth implementation package is explicit
- fourth-slice acceptance criteria are explicit
- control docs are consistent with the new phase lock
- work is committed and pushed

## Why This Task

This is the smallest next step after defining the third slice, and it keeps the repository from jumping into wider implementation before the next slice is packaged clearly.
