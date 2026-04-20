# Learning Record State Layer

## Planning Slice

- `Phase`: `P5-PRODUCT`
- `Process`: `PROC-DOC`
- `Task ID`: `P5-PLAN-004`

## Purpose

This document defines the persistent application state layer shape for the `Learning Record Store`.

It does not choose a database engine, API surface, or implementation language pattern beyond the current repository structure.

## Design Goal

The state layer should sit between:

- domain mutation logic for runtime, assessment, and analytics
- downstream projections, dashboards, and reporting

It should give the product a stable internal seam before database and API work begins.

## State Layer Modules

The `Learning Record Store` state layer is composed of six modules.

### 1. `state-identity`

Purpose:

- define the stable identity context used across all canonical records

Responsibilities:

- normalize `learner_key`
- normalize `course_id`
- normalize `module_id`
- normalize `week`
- define entity identifiers such as `attempt_id`, `assessment_result_id`, and `event_id`

Output:

- shared identity envelope used by all other state-layer modules

### 2. `state-records`

Purpose:

- define canonical record shapes and invariants

Responsibilities:

- own record contracts for:
  - `learner_module_state`
  - `attempt_record`
  - `assessment_result_record`
  - `analytics_event_record`
- enforce mutable vs append-only rules
- define record-level invariants

Output:

- canonical data contracts used by repositories and mutation services

### 3. `state-repositories`

Purpose:

- define persistence-facing ports for canonical records

Responsibilities:

- load/save current `learner_module_state`
- append/list `attempt_record`
- append/list `assessment_result_record`
- append/list `analytics_event_record`
- keep storage concerns behind repository boundaries

Output:

- repository ports only

Notes:

- this module defines storage seams, not storage implementation

### 4. `state-mutations`

Purpose:

- coordinate write flows across canonical records

Responsibilities:

- apply runtime state mutations
- capture attempts
- commit assessment results after attempts exist
- append analytics events after source writes succeed
- enforce write ordering from [LEARNING_RECORD_MUTATION_FLOW.md](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/LEARNING_RECORD_MUTATION_FLOW.md)

Output:

- mutation services that use repository ports

### 5. `state-projections`

Purpose:

- provide projection-facing read seams from canonical records

Responsibilities:

- expose canonical records to dashboard, CQI, and reporting builders
- define which projections consume which records
- keep projections downstream from state ownership

Output:

- projection input contracts

### 6. `state-mapping`

Purpose:

- map current prototype modules into the new state layer

Responsibilities:

- align current runtime, assessment, analytics, and file-based persistence modules with state-layer seams
- document migration path from prototype artifact saving to product state ownership

Output:

- explicit mapping from current repo modules to state-layer modules

## Module Seams

The allowed dependencies should be:

1. `state-identity` -> shared by all state-layer modules
2. `state-records` -> depends on `state-identity`
3. `state-repositories` -> depends on `state-identity` and `state-records`
4. `state-mutations` -> depends on `state-records` and `state-repositories`
5. `state-projections` -> depends on `state-records` and repository read ports
6. `state-mapping` -> references all of the above as documentation glue

Disallowed direction:

- projections must not own mutation logic
- dashboards/control outputs must not bypass the state layer to become canonical owners
- repository implementations must not redefine record contracts

## Responsibility Boundaries

### Inside The State Layer

- canonical record identity
- canonical record contracts
- persistence ports
- write coordination
- projection input seams

### Outside The State Layer

- source-of-truth YAML
- bundle generation
- HTML rendering
- CQI markdown rendering
- output registries
- build-control orchestration
- API delivery
- auth/account implementation

## Mapping From Current Prototype Modules

### `state-identity`

Maps from current concerns in:

- [tools/persistence.js](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/tools/persistence.js)
- [tools/runtime-state.js](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/tools/runtime-state.js)

### `state-records`

Maps from current canonical-shape planning in:

- [LEARNING_RECORD_STORE_CONTRACT.md](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/LEARNING_RECORD_STORE_CONTRACT.md)

### `state-repositories`

Prototype baseline today:

- [tools/persistence.js](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/tools/persistence.js)

Future role:

- replace direct file-shape assumptions with repository ports

### `state-mutations`

Prototype mutation logic today:

- [tools/runtime-state.js](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/tools/runtime-state.js)
- [tools/assessment-engine.js](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/tools/assessment-engine.js)
- [tools/analytics.js](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/tools/analytics.js)

### `state-projections`

Prototype projection consumers today:

- [tools/teacher-dashboard-data.js](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/tools/teacher-dashboard-data.js)
- [tools/course-dashboard-data.js](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/tools/course-dashboard-data.js)
- [tools/cqi-report.js](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/tools/cqi-report.js)
- [tools/instructor-build-control-data.js](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/tools/instructor-build-control-data.js)

### `state-mapping`

This planning document itself is the first mapping layer.

## Minimal Internal Shape

Before implementation, the state layer should be thought of as:

- `state-identity`
- `state-records`
- `state-repositories`
- `state-mutations`
- `state-projections`
- `state-mapping`

Nothing else is required yet.

This keeps the shape narrow enough to avoid premature architecture.

## Invariants

- all canonical writes go through `state-mutations`
- all storage access goes through `state-repositories`
- all canonical contracts come from `state-records`
- all learner/module identity normalization comes from `state-identity`
- all product read models stay downstream through `state-projections`

## Out Of Scope

- repository implementation code
- database schema design
- API contract design
- authentication design
- queue or worker topology
- frontend state architecture

## Result Of This Slice

After `P5-PLAN-004`, the repo now has:

- an explicit internal module shape for persistent application state
- named seams between record contracts, repositories, mutations, and projections
- a concrete bridge from current prototype modules into a future product state layer

## Next Planning Step

The next task should define repository ports and service interfaces for the `Learning Record Store` state layer without choosing database or API implementation details.
