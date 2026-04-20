# NEXT_TASK.md

## Current Locked Task

- `Phase`: `P5-PRODUCT`
- `Process`: `PROC-STATE`
- `Task ID`: `P5-IMPL-002`

## Task

Implement the second package for the `Learning Record Store`.

## Scope

In scope:

- implement mutation services over repository ports
- implement shared service-command helpers
- add service-level tests for write ordering and append-only rules

Out of scope:

- query/projection services
- projection rewiring
- database implementation
- API implementation
- auth/user implementation
- learner runtime UI changes
- changes to source-of-truth YAML or schemas

## Done Criteria

- mutation services exist behind repository ports
- service-command helpers exist
- service-level tests exist
- append-only and mutable write rules are enforced in tests
- `npm run verify:machine` passes
- work is committed and pushed

## Why This Task

The first package is complete, and this is the smallest next slice that introduces canonical write coordination without changing output contracts or opening query/projection, database, API, or auth work.
