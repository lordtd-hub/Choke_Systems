# NEXT_TASK.md

## Current Locked Task

- `Phase`: `P5-PRODUCT`
- `Process`: `PROC-DOC`
- `Task ID`: `P5-PLAN-013`

## Task

Define the first adapter-swap rollout plan behind the current repository ports.

## Scope

In scope:

- define the execution order for introducing a second repository adapter behind the current ports
- define the rollout boundary between preserved baseline behavior and future adapter activation
- define the validation checkpoints required before the future adapter may become active
- update control docs so the repo lock is unambiguous

Out of scope:

- database implementation
- API implementation
- auth/user implementation
- learner runtime UI changes
- changes to source-of-truth YAML or schemas

## Done Criteria

- the adapter-swap rollout sequence is explicit
- the activation boundary for the future adapter is explicit
- the next controlled task after this planning slice is explicit
- control docs are consistent
- work is committed and pushed

## Why This Task

The conformance rules are now defined, and the smallest safe next step is to define exactly how a future adapter would be introduced without combining rollout work with broader database or API implementation.
