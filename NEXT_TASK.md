# NEXT_TASK.md

## Current Locked Task

- `Phase`: `P5-PRODUCT`
- `Process`: `PROC-DOC`
- `Task ID`: `P5-PLAN-014`

## Task

Define the adapter selection and activation seam behind the current repository ports.

## Scope

In scope:

- define where the active repository adapter will be selected
- define the boundary between inactive adapter availability and active adapter use
- define the guard conditions for future adapter activation without changing current contracts
- update control docs so the repo lock is unambiguous

Out of scope:

- database implementation
- API implementation
- auth/user implementation
- learner runtime UI changes
- changes to source-of-truth YAML or schemas

## Done Criteria

- the adapter selection seam is explicit
- the activation guard conditions are explicit
- the next controlled task after this planning slice is explicit
- control docs are consistent
- work is committed and pushed

## Why This Task

The rollout sequence is now defined, and the smallest safe next step is to define the narrow composition seam that would eventually choose between the preserved file-backed adapter and a future inactive adapter.
