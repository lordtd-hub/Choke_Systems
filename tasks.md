# tasks.md

## Purpose

This file is the working backlog and roadmap for implementation.

Use it to choose work without inventing a new direction.

Status values:

- `todo`
- `doing`
- `done`
- `blocked`

## Current Priority

Current working area:

- `Phase`: `P5-PRODUCT`
- `Process`: `PROC-DOC`

Rule:

- choose the next task from this file unless `NEXT_TASK.md` explicitly narrows the scope further

## Backlog By Phase

### P1-SPEC

Status: `done`

Tasks:

- `done` validate course and weekly plan contracts
- `done` enforce schema-backed source-of-truth layer
- `done` keep cross-file validation working

### P2-GEN

Status: `partial`

Tasks:

- `done` build interactive modules from weekly plan
- `done` build week bundles with SBRA/material assets
- `todo` add real AI-assisted content generation pipeline
- `todo` add generated quiz authoring workflow

Dependencies:

- depends on `P1-SPEC`

### P3-RUNTIME

Status: `partial`

Tasks:

- `done` runtime state prototype
- `done` assessment scoring prototype
- `done` analytics and CQI prototype
- `todo` add richer persistence model beyond current artifact saving
- `todo` add multi-user runtime/session model

Dependencies:

- depends on `P1-SPEC`
- depends on `P2-GEN`

### P4-OUTPUT

Status: `done`

Tasks:

- `done` publish week outputs
- `done` publish course outputs
- `done` publish catalog outputs
- `done` publish instructor build control outputs
- `done` add course output registry
- `done` add system output registry
- `done` add course action queue backend
- `done` render recommended actions from backend queue on the control page
- `done` add one normalized top-level control summary for current phase/status/next action
- `done` tighten output/control docs so they reflect current backend artifacts only
- `done` review `P4-OUTPUT` exit criteria and decide whether the phase should remain open or move to `P5-PRODUCT`

Dependencies:

- depends on `P1-SPEC`
- depends on `P2-GEN`
- depends on `P3-RUNTIME`

### P5-PRODUCT

Status: `doing`

Tasks:

- `done` define the first product-transition planning slice for persistent application state
- `todo` define canonical state entities and repository boundary for the `Learning Record Store`
- `todo` design persistent application state layer
- `todo` design authenticated multi-user system
- `todo` design production API/service layer
- `todo` build real learner-facing app shell

Dependencies:

- depends on `P4-OUTPUT` reaching stable control/output backbone

## Selection Rule

When choosing the next task:

1. obey `NEXT_TASK.md` first
2. stay inside the current phase unless `ARCHITECTURE_PHASE_NOTE.md` says exit criteria are met
3. prefer the smallest task that strengthens the current phase boundary
4. do not jump into `P5-PRODUCT` implementation without a written transition-planning task
