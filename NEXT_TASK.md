# NEXT_TASK.md

## Current Locked Task

- `Phase`: `P5-PRODUCT`
- `Process`: `PROC-DOC`
- `Task ID`: `P5-PLAN-015`

## Task

Define the first inactive-adapter package behind the selection seam.

## Scope

In scope:

- define the smallest package that allows a future adapter to exist behind the seam without becoming active
- define the deliverables and preserved baseline for that inactive-adapter package
- define the validation expectations for that package without broadening into database or API implementation
- update control docs so the repo lock is unambiguous

Out of scope:

- database implementation
- API implementation
- auth/user implementation
- learner runtime UI changes
- changes to source-of-truth YAML or schemas

## Done Criteria

- the inactive-adapter package boundary is explicit
- the package deliverables and validation expectations are explicit
- the next controlled task after this planning slice is explicit
- control docs are consistent
- work is committed and pushed

## Why This Task

The selection seam is now defined, and the smallest safe next step is to define the bounded package that would let a future adapter exist behind that seam without changing the active baseline.
