# Learning Record First Package

## Planning Slice

- `Phase`: `P5-PRODUCT`
- `Process`: `PROC-DOC`
- `Task ID`: `P5-PLAN-007`

## Purpose

This document defines the first implementation task package for the `Learning Record Store`.

It packages the safest initial build slice without choosing a database or API implementation.

## Package Goal

Implement the smallest state-layer slice that:

- introduces reusable canonical contracts
- introduces repository seams over existing file persistence
- does not change current output behavior

## Package Scope

This first package includes only:

- `state-identity`
- `state-records`
- file-backed repository ports

This package does not include:

- mutation services
- query/projection services
- projection rewiring
- database implementation
- API implementation
- auth implementation

## Package Files And Modules

The first package should create a new narrow state-layer area such as:

- `state/identity/`
- `state/records/`
- `state/repositories/`

Minimum module set:

- `state/identity/learning-identity.js`
- `state/records/learner-module-state.js`
- `state/records/attempt-record.js`
- `state/records/assessment-result-record.js`
- `state/records/analytics-event-record.js`
- `state/repositories/learner-module-state-repository.js`
- `state/repositories/attempt-record-repository.js`
- `state/repositories/assessment-result-repository.js`
- `state/repositories/analytics-event-repository.js`
- `state/repositories/file-backed-learning-record-store.js`

Names may vary slightly at implementation time, but the package must keep the same module boundaries.

## Required Deliverables

### 1. Identity Contract Module

Must define:

- learner/module identity normalization
- helper for shared identity envelope
- helper for stable record ids where needed

Must not:

- depend on dashboard/output logic
- depend on API/auth assumptions

### 2. Record Contract Modules

Must define:

- canonical shapes for:
  - `learner_module_state`
  - `attempt_record`
  - `assessment_result_record`
  - `analytics_event_record`
- validation helpers or invariant checks for required fields
- append-only vs mutable classification

Must not:

- perform storage access
- perform scoring or runtime mutation

### 3. Repository Port Modules

Must define explicit repository interfaces for:

- `LearnerModuleStateRepository`
- `AttemptRecordRepository`
- `AssessmentResultRepository`
- `AnalyticsEventRepository`

Must expose:

- read/write method names already defined in [LEARNING_RECORD_PORTS_AND_SERVICES.md](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/LEARNING_RECORD_PORTS_AND_SERVICES.md)

Must not:

- encode business logic
- expose file paths as the public contract

### 4. File-Backed Adapter

Must provide:

- one adapter implementation that delegates to current [tools/persistence.js](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/tools/persistence.js)
- a compatibility layer from new repository ports to current file-backed storage behavior

Must not:

- change current artifact file names
- change current storage directory layout
- introduce database assumptions

## Acceptance Criteria

The first package is done only if all of these are true:

- canonical identity helpers exist
- canonical record modules exist
- repository ports exist
- one file-backed adapter exists
- existing persistence behavior is still reachable through the adapter
- `npm run verify:machine` still passes
- no output JSON/HTML contract changes are introduced

## Must Not Change During This Package

- source-of-truth YAML files
- schemas
- output file names and output paths
- current dashboard/control JSON shapes
- CQI markdown output shape
- current `.data/` artifact layout
- top-level workflow commands

## Test Expectations

This package should add new tests for:

- identity normalization
- record invariant validation
- repository-port behavior over the file-backed adapter

It should keep all existing tests green.

## Recommended Implementation Order Inside The Package

1. add `state-identity`
2. add record contract modules
3. add repository port definitions
4. add file-backed adapter using current persistence helpers
5. add seam-level tests
6. rerun full verification

## Risks To Avoid

- do not refactor runtime mutation logic yet
- do not refactor assessment or analytics flow yet
- do not rewire projections yet
- do not rename current persistence artifacts
- do not mix repository introduction with service introduction

## Exit Signal

When this package is finished, the repo should be ready for the next implementation slice:

- mutation services using the new repository ports

## Result Of This Slice

After `P5-PLAN-007`, the repo now has:

- one explicit first implementation package
- one explicit file/module list for that package
- one explicit acceptance checklist for the first build slice

## Next Planning Step

The next task should define the second implementation package for mutation services over the new repository ports without expanding into database or API implementation.
