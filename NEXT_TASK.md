# NEXT_TASK.md

## Current Locked Task

- `Phase`: `P5-PRODUCT`
- `Process`: `PROC-STATE`
- `Task ID`: `P5-IMPL-001`

## Task

Implement the first package for the `Learning Record Store`.

## Scope

In scope:

- implement `state-identity`
- implement canonical record modules
- implement repository port definitions
- implement one file-backed adapter over the current persistence layer
- add seam-level tests for the first package

Out of scope:

- mutation services
- query/projection services
- projection rewiring
- database implementation
- API implementation
- auth/user implementation
- learner runtime UI changes
- changes to source-of-truth YAML or schemas

## Done Criteria

- `state-identity` modules exist
- canonical record modules exist
- repository ports and one file-backed adapter exist
- seam-level tests exist
- `npm run verify:machine` passes
- work is committed and pushed

## Why This Task

The readiness review is complete, and this is the smallest implementation slice that introduces the state layer without changing output contracts or opening database/API/auth work.
