# NEXT_TASK.md

## Current Locked Task

- `Phase`: `P5-PRODUCT`
- `Process`: `PROC-STATE`
- `Task ID`: `P5-IMPL-004`

## Task

Implement the fourth package for the `Learning Record Store`.

## Scope

In scope:

- rewire teacher week dashboard data through query/projection services
- rewire course dashboard data through query/projection services
- rewire CQI inputs through query/projection services
- add regression tests for unchanged output contracts

Out of scope:

- database implementation
- API implementation
- auth/user implementation
- learner runtime UI changes
- changes to source-of-truth YAML or schemas

## Done Criteria

- teacher week dashboard data is produced through query/projection services
- course dashboard data is produced through query/projection services
- CQI inputs are produced through query/projection services
- regression tests confirm unchanged output contracts
- `npm run verify:machine` passes
- work is committed and pushed

## Why This Task

The third package is complete, and this is the smallest next slice that rewires current dashboard and CQI builders onto the new read seams without changing output contracts or opening database, API, or auth work.
