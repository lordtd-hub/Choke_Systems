# Learning Record Third Package

## Planning Slice

- `Phase`: `P5-PRODUCT`
- `Process`: `PROC-DOC`
- `Task ID`: `P5-PLAN-009`

## Purpose

This document defines the third implementation task package for the `Learning Record Store`.

It packages the query and projection service slice that should follow mutation services without expanding into database or API implementation.

## Package Goal

Implement the first read-model layer on top of canonical records so dashboards, CQI logic, and future product read flows can consume stable query and projection seams.

## Package Scope

This third package includes only:

- query services over canonical records
- projection assembly services over canonical records plus source contracts
- service-level tests for projection inputs and read assembly

This package does not include:

- dashboard rewiring
- CQI renderer rewiring
- HTML/output contract changes
- database implementation
- API implementation
- auth implementation

## Package Files And Modules

The third package should create or extend the state-layer read area such as:

- `state/services/`
- `state/projections/`

Minimum module set:

- `state/services/learning-record-query-service.js`
- `state/services/projection-assembly-service.js`
- `state/projections/teacher-week-projection.js`
- `state/projections/course-projection.js`
- `state/projections/cqi-projection.js`

Names may vary slightly at implementation time, but the package must keep the same query/projection boundaries.

## Required Deliverables

### 1. `LearningRecordQueryService`

Must provide:

- learner-week snapshot lookup
- assessment evidence lookup
- analytics timeline lookup
- combined projection input loading for one learner/module context

Must use:

- repository read ports only

Must not:

- mutate canonical records
- read output artifact files directly as system truth

### 2. `ProjectionAssemblyService`

Must provide:

- teacher-week projection assembly
- course-level projection assembly inputs
- CQI/CLO projection assembly inputs

Must use:

- `LearningRecordQueryService`
- source contracts and bundle metadata

Must not:

- render HTML
- render markdown output
- publish output files directly

### 3. Projection Input Modules

Must define:

- normalized read-model inputs for:
  - teacher week projection
  - course projection
  - CQI projection

Must keep:

- projection input contracts downstream from canonical records

Must not:

- become canonical storage
- redefine canonical record contracts

## Acceptance Criteria

The third package is done only if all of these are true:

- query services exist over canonical repository ports
- projection assembly services exist over canonical query inputs
- teacher-week, course, and CQI projection inputs are explicit
- canonical records remain the only source of learner-state truth
- service-level tests exist for read assembly and projection inputs
- `npm run verify:machine` still passes
- no output JSON/HTML/markdown contract changes are introduced

## Must Not Change During This Package

- source-of-truth YAML files
- schemas
- output filenames and output paths
- published dashboard/control JSON structures
- CQI markdown output shape
- repository contracts
- mutation service contracts
- current top-level workflow commands

## Test Expectations

This package should add new tests for:

- learner-week snapshot query flow
- assessment evidence aggregation
- analytics timeline lookup
- teacher-week projection input assembly
- course projection input assembly
- CQI projection input assembly

It should keep all existing tests green.

## Recommended Implementation Order Inside The Package

1. implement `LearningRecordQueryService`
2. add normalized projection input modules
3. implement `ProjectionAssemblyService`
4. add query/projection service tests
5. rerun full verification

## Risks To Avoid

- do not rewire existing dashboard builders in the same slice
- do not rewire CQI markdown rendering in the same slice
- do not change output contracts while introducing projection services
- do not bypass repository ports for read assembly
- do not mix projection services with database design

## Exit Signal

When this package is finished, the repo should be ready for the next implementation slice:

- rewiring current dashboard and CQI builders onto the new query/projection services

## Result Of This Slice

After `P5-PLAN-009`, the repo now has:

- one explicit third implementation package
- one explicit query/projection service module list
- one explicit acceptance checklist for the third build slice

The fourth implementation package for that sequence is now documented in [LEARNING_RECORD_FOURTH_PACKAGE.md](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/LEARNING_RECORD_FOURTH_PACKAGE.md).

## Next Planning Step

The next task should decide whether the remaining work stays in planning or whether the repo is ready to start implementing the first package (`state-identity`, `state-records`, file-backed repository ports).
