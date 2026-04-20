# Learning Record Fourth Package

## Planning Slice

- `Phase`: `P5-PRODUCT`
- `Process`: `PROC-DOC`
- `Task ID`: `P5-PLAN-010`

## Purpose

This document defines the fourth implementation task package for the `Learning Record Store`.

It packages the first rewiring slice that moves current dashboard and CQI builders onto the new query/projection services without changing product-facing output contracts.

## Package Goal

Replace direct prototype read paths in current read-model builders with state-layer query/projection services while preserving the existing output behavior.

## Package Scope

This fourth package includes only:

- rewiring the teacher week dashboard builder
- rewiring the course dashboard builder
- rewiring the CQI report builder
- tests that lock output equivalence and state-layer read usage

This package does not include:

- build-control/dashboard HTML redesign
- catalog/control-layer rewiring beyond what is required by the affected builders
- API implementation
- database implementation
- auth implementation

## Package Files And Modules

The fourth package should update existing builders and introduce only the minimal glue needed:

- [tools/teacher-dashboard-data.js](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/tools/teacher-dashboard-data.js)
- [tools/course-dashboard-data.js](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/tools/course-dashboard-data.js)
- [tools/cqi-report.js](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/tools/cqi-report.js)

Expected supporting inputs:

- `state/services/learning-record-query-service.js`
- `state/services/projection-assembly-service.js`
- projection input modules from the third package

## Required Deliverables

### 1. Teacher Week Dashboard Rewire

Must do:

- source learner/module data through the new query/projection services
- preserve current `dashboard-data.json` contract
- preserve current teacher dashboard HTML expectations

Must not:

- change published file paths
- change Thai output wording unexpectedly

### 2. Course Dashboard Rewire

Must do:

- source week summaries through the new projection path
- preserve current `course-dashboard-data.json` contract
- preserve current course dashboard HTML expectations

Must not:

- change course-level output filenames
- redefine course aggregation rules unless required by the new seam

### 3. CQI Report Rewire

Must do:

- source CQI/CLO inputs through the new query/projection path
- preserve current CQI report contract and markdown shape

Must not:

- change current report headings or high-level structure
- move CQI rendering into storage or mutation layers

## Acceptance Criteria

The fourth package is done only if all of these are true:

- teacher week dashboard data is produced through state-layer query/projection services
- course dashboard data is produced through state-layer query/projection services
- CQI report inputs are produced through state-layer query/projection services
- output JSON and markdown contracts remain unchanged
- existing frontend/dashboard/CQI tests still pass
- `npm run verify:machine` still passes

## Must Not Change During This Package

- output filenames and output paths
- published JSON contracts for week/course dashboards
- CQI markdown contract
- build-control output contracts
- catalog output contracts
- top-level workflow commands
- repository contracts and mutation-service contracts

## Test Expectations

This package should add or update tests for:

- teacher dashboard data via query/projection services
- course dashboard data via query/projection services
- CQI report generation via query/projection services
- regression coverage for unchanged output shapes

It should keep all existing tests green.

## Recommended Implementation Order Inside The Package

1. wire teacher week dashboard data through the new projection service
2. wire course dashboard data through the same seam
3. wire CQI report inputs through the projection service
4. update/add regression tests
5. rerun full verification

## Risks To Avoid

- do not change output contracts while rewiring internals
- do not mix rewiring with HTML redesign
- do not introduce build-control rewiring in the same slice unless a direct dependency forces it
- do not bypass query/projection services once the seam exists
- do not mix this slice with database or API work

## Exit Signal

When this package is finished, the repo should be ready for the next implementation slice:

- rewiring remaining operational outputs, or beginning controlled implementation of product persistence behind the established seams

## Result Of This Slice

After `P5-PLAN-010`, the repo now has:

- one explicit fourth implementation package
- one explicit rewire target list for current read-model builders
- one explicit acceptance checklist for preserving current outputs while changing internal read seams

## Next Planning Step

The next task should decide whether the remaining work stays in planning or whether the repo is ready to start implementing the first package (`state-identity`, `state-records`, file-backed repository ports).
