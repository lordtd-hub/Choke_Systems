# NEXT_TASK.md

## Current Locked Task

- `Phase`: `P4-OUTPUT`
- `Process`: `PROC-CTRL` / `PROC-FE`
- `Task ID`: `P4-CTRL-UI-001`

## Task

Render the backend-generated recommended actions on the instructor control output so the page shows what should be done next, not only what already exists.

## Scope

In scope:

- consume `course-action-queue.json` through existing control data flow
- show recommended actions in the control page
- keep display Thai
- keep action logic in backend, not in the frontend template
- add or update tests

Out of scope:

- new product/app shell
- login/auth
- database design
- learner runtime UI changes
- changes to source-of-truth YAML or schemas

## Done Criteria

- build control output includes a recommended-actions section
- action list comes from backend-generated queue data
- tests cover the new output
- `npm run verify:machine` passes
- work is committed and pushed

## Why This Task

This is the smallest next step that improves the control layer without skipping ahead into product-phase work.
