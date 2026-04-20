# Learning Record Second Package

## Planning Slice

- `Phase`: `P5-PRODUCT`
- `Process`: `PROC-DOC`
- `Task ID`: `P5-PLAN-008`

## Purpose

This document defines the second implementation task package for the `Learning Record Store`.

It packages the mutation-service slice that should follow the first package without expanding into database or API implementation.

## Package Goal

Implement the first business-flow layer on top of the new repository ports so canonical writes no longer depend directly on prototype utility modules.

## Package Scope

This second package includes only:

- mutation services over repository ports
- service-level commands for runtime progression, attempt capture, assessment result writing, and analytics event writing
- tests that lock write ordering and append-only rules

This package does not include:

- query/projection services
- dashboard rewiring
- CQI rewiring
- database implementation
- API implementation
- auth implementation

## Package Files And Modules

The second package should create or extend the state-layer service area such as:

- `state/services/`

Minimum module set:

- `state/services/learning-progress-service.js`
- `state/services/attempt-capture-service.js`
- `state/services/assessment-result-service.js`
- `state/services/analytics-event-service.js`
- `state/services/service-commands.js`

Names may vary slightly at implementation time, but the package must keep the same service boundaries.

## Required Deliverables

### 1. `LearningProgressService`

Must provide:

- module-state initialization
- section completion flow
- activity completion flow
- progress recalculation flow

Must use:

- `LearnerModuleStateRepository`
- `AnalyticsEventService` where completion evidence must be emitted

Must not:

- read or write output/dashboard artifacts
- depend on API/auth assumptions

### 2. `AttemptCaptureService`

Must provide:

- attempt recording
- latest-attempt synchronization into module state
- activity-scope attempt listing

Must use:

- `AttemptRecordRepository`
- `LearnerModuleStateRepository`

Must not:

- score attempts directly
- bypass repository ports

### 3. `AssessmentResultService`

Must provide:

- scoring flow over an existing attempt
- canonical assessment-result append flow
- optional module-state update when scoring changes progress/completion state

Must use:

- `AttemptRecordRepository`
- `AssessmentResultRepository`
- `LearnerModuleStateRepository`
- `AnalyticsEventService`

Must not:

- access persistence directly
- assemble dashboard/CQI outputs

### 4. `AnalyticsEventService`

Must provide:

- completion-event append flow
- score-event append flow
- reflection-event append flow

Must use:

- `AnalyticsEventRepository`

Must not:

- own dashboard or CQI rendering logic
- redefine analytics event contracts

### 5. Shared Service Commands

Must define:

- command input shapes for mutation services
- preconditions for each command
- minimal validation of required fields before repository writes

## Acceptance Criteria

The second package is done only if all of these are true:

- mutation services exist behind repository ports
- write ordering follows [LEARNING_RECORD_MUTATION_FLOW.md](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/LEARNING_RECORD_MUTATION_FLOW.md)
- append-only records remain append-only
- mutable snapshot writes are isolated to module-state updates
- service-level tests exist for core write flows
- `npm run verify:machine` still passes
- no output JSON/HTML contract changes are introduced

## Must Not Change During This Package

- source-of-truth YAML files
- schemas
- output filenames and output paths
- published dashboard/control JSON structures
- CQI markdown output shape
- current top-level workflow commands
- repository port contracts from the first package

## Test Expectations

This package should add new tests for:

- module-state initialization and update flow
- attempt capture through repository ports
- scoring flow with repository-backed result creation
- analytics event append flow after canonical writes
- ordering rules between attempt, assessment result, module state, and analytics events

It should keep all existing tests green.

## Recommended Implementation Order Inside The Package

1. add shared service-command helpers
2. implement `AnalyticsEventService`
3. implement `LearningProgressService`
4. implement `AttemptCaptureService`
5. implement `AssessmentResultService`
6. add service-level tests
7. rerun full verification

## Risks To Avoid

- do not introduce query/projection services in the same slice
- do not rewire dashboard/CQI builders in the same slice
- do not change repository contracts while building mutation services
- do not change current output/control artifacts
- do not mix service introduction with database design

## Exit Signal

When this package is finished, the repo should be ready for the next implementation slice:

- query and projection services over canonical records

## Result Of This Slice

After `P5-PLAN-008`, the repo now has:

- one explicit second implementation package
- one explicit service/module list for mutation coordination
- one explicit acceptance checklist for the second build slice

The third implementation package for that sequence is now documented in [LEARNING_RECORD_THIRD_PACKAGE.md](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/LEARNING_RECORD_THIRD_PACKAGE.md).

## Next Planning Step

The next task should define the fourth implementation package for rewiring current dashboard and CQI builders onto query/projection services without expanding into database or API implementation.
