# NEXT_TASK.md

## Current Locked Task

- `Phase`: `P5-PRODUCT`
- `Process`: `PROC-STATE`
- `Task ID`: `P5-IMPL-003`

## Task

Implement the third package for the `Learning Record Store`.

## Scope

In scope:

- implement query services over canonical repository ports
- implement projection assembly services and normalized projection inputs
- add service-level tests for read assembly and projection inputs

Out of scope:

- projection rewiring
- database implementation
- API implementation
- auth/user implementation
- learner runtime UI changes
- changes to source-of-truth YAML or schemas

## Done Criteria

- query services exist over repository ports
- projection assembly services and projection input modules exist
- service-level tests exist
- canonical records remain the only source of learner-state truth in tests
- `npm run verify:machine` passes
- work is committed and pushed

## Why This Task

The second package is complete, and this is the smallest next slice that introduces canonical read and projection seams without changing output contracts or opening rewiring, database, API, or auth work.
