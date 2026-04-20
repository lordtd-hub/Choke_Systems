# Learning Record Implementation Plan

## Planning Slice

- `Phase`: `P5-PRODUCT`
- `Process`: `PROC-DOC`
- `Task ID`: `P5-PLAN-006`

## Purpose

This document defines the safest implementation sequence for the `Learning Record Store` state layer.

It does not choose a database backend, API delivery model, or auth implementation.

## Goal

Move from planning artifacts to implementation without destabilizing the working prototype.

The plan must preserve:

- source-of-truth YAML flow
- existing week/course/catalog/control outputs
- current verification suite
- current prototype persistence behavior until each replacement seam is ready

## Implementation Principles

- build behind stable seams already defined in planning docs
- replace direct file-shape assumptions gradually
- keep output/control artifacts derived, never canonical
- preserve current machine-verifiable behavior while changing internals
- introduce one state-layer seam at a time

## Safe Implementation Sequence

### Slice 1. Create State Identity And Record Contracts

Objective:

- introduce the smallest shared module for canonical identity and record definitions

What to build:

- `state-identity`
- `state-records`

What remains unchanged:

- `tools/runtime-state.js`
- `tools/assessment-engine.js`
- `tools/analytics.js`
- `tools/persistence.js`
- all output builders

Acceptance focus:

- the repo gains reusable canonical contracts without changing behavior

### Slice 2. Introduce Repository Ports Over Current Persistence

Objective:

- wrap current file-based persistence behind repository ports

What to build:

- repository interfaces matching [LEARNING_RECORD_PORTS_AND_SERVICES.md](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/LEARNING_RECORD_PORTS_AND_SERVICES.md)
- file-backed adapter over current [tools/persistence.js](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/tools/persistence.js)

What remains unchanged:

- database choice
- output publishing flow
- dashboard/control artifact formats

Acceptance focus:

- current persistence behavior still works, but callers can target repository seams instead of raw files

### Slice 3. Introduce Mutation Services

Objective:

- move canonical write coordination out of ad hoc prototype utilities and into state-layer services

What to build:

- `LearningProgressService`
- `AttemptCaptureService`
- `AssessmentResultService`
- `AnalyticsEventService`

What remains unchanged:

- projection builders
- HTML rendering
- build-control layer

Acceptance focus:

- write ordering is enforced through services
- append-only vs mutable rules are preserved

### Slice 4. Introduce Query And Projection Assembly Services

Objective:

- formalize read access for downstream projections

What to build:

- `LearningRecordQueryService`
- `ProjectionAssemblyService`

What remains unchanged:

- current rendered output file structure
- current top-level workflow commands

Acceptance focus:

- week/course/CQI builders can read through projection seams rather than mixing storage and presentation logic

### Slice 5. Rewire Existing Projections To New State Layer

Objective:

- make current output builders consumers of the new state layer

What to rewire:

- teacher week dashboard builder
- course dashboard builder
- CQI report builder

What remains unchanged:

- output filenames
- current published output contracts
- top-level orchestration commands

Acceptance focus:

- current outputs stay behaviorally consistent
- internal read path becomes state-layer based

### Slice 6. Prepare For Product Persistence Implementation

Objective:

- finish the seam work so a real storage implementation can replace the file-backed adapter later

What to prepare:

- swap-ready repository implementations
- dependency boundaries between repositories and services
- test coverage at repository and service boundaries

What remains unchanged:

- no database implementation yet
- no API implementation yet
- no auth implementation yet

Acceptance focus:

- the repo is ready for a future storage adapter swap without rewriting mutation or projection logic

## First Concrete Build Slice

The first concrete build slice should be:

- implement `state-identity`
- implement `state-records`
- add file-backed repository ports that delegate to the existing persistence layer

Why this first:

- lowest risk
- no user-facing output changes
- highest leverage for later slices

## Must Remain Unchanged During The First Slice

- source-of-truth YAML and schemas
- output file names and locations
- published dashboard/control JSON structures
- CQI markdown output contract
- current `npm run verify:machine` coverage
- current file-based persistence payload semantics

## Risk Controls

- do not migrate projections and mutations in the same slice
- do not replace file persistence and introduce database design in the same slice
- do not change control/output contracts while building state seams
- keep every slice verifiable through existing tests first, then add seam-level tests

## Minimal Dependency Order

Build in this order:

1. `state-identity`
2. `state-records`
3. file-backed repository ports
4. mutation services
5. query/projection services
6. projection rewiring
7. storage-adapter swap planning

## Definition Of Success

This planning phase is successful if the repo can start implementation with:

- one clear first slice
- one explicit build order
- one explicit preservation list of what must not break

## Out Of Scope

- SQL/NoSQL selection
- API route design
- auth/session model
- deployment design
- UI implementation work

## Result Of This Slice

After `P5-PLAN-006`, the repo now has:

- an explicit implementation sequence for the `Learning Record Store`
- a safe first build slice
- a preservation list that protects the current prototype while implementation begins

The first implementation package for that sequence is now documented in [LEARNING_RECORD_FIRST_PACKAGE.md](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/LEARNING_RECORD_FIRST_PACKAGE.md).

## Next Planning Step

The next task should define the second implementation package for mutation services over the new repository ports without expanding into database or API implementation.
