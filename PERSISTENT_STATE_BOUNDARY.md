# Persistent State Boundary

## Planning Slice

- `Phase`: `P5-PRODUCT`
- `Process`: `PROC-DOC`
- `Task ID`: `P5-PLAN-001`

## Decision

The first product-layer boundary is the `Learning Record Store`.

This boundary sits between the current prototype engines and any future database or API layer.

## Why This Boundary Comes First

The repository already has:

- runtime progression logic
- assessment scoring logic
- analytics event generation
- file-based artifact saving in [tools/persistence.js](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/tools/persistence.js)

What it does not yet have is a clear distinction between:

- canonical product state that the application must preserve
- derived artifacts and reports that can be rebuilt from canonical state

Without that boundary, database and API planning would drift too early.

## Objective

Define the first persistent application-state boundary before any database, auth, or API implementation begins.

## Module Boundary

Name:

- `Learning Record Store`

Responsibility:

- own canonical learner progression records for a course module/week
- preserve immutable attempt and assessment evidence
- preserve append-only analytics events tied to learning activity

Non-responsibility:

- authoring source-of-truth YAML
- generated week/course/system output files
- CQI markdown or dashboard HTML files
- build-control registries and other published output artifacts

## Canonical State In Scope

The first planning slice treats these as canonical product records:

- `learner_module_state`
  - current learner progress for one `course_id` + `module_id` + `week`
- `attempt_record`
  - immutable learner attempt for an activity, quiz, or SBRA step flow
- `assessment_result_record`
  - normalized scoring result linked to an attempt
- `analytics_event_record`
  - append-only events emitted from runtime, assessment, and reflection flows

## Derived State Outside The Boundary

These remain derived or publishable artifacts, not canonical product records:

- `week-bundle.json`
- `dashboard-data.json`
- `course-dashboard-data.json`
- `catalog-dashboard-data.json`
- `build-control-data.json`
- `control-status-summary.json`
- CQI reports
- HTML output files
- output registries and action queues

## Transitional Baseline

The current file-based persistence in [tools/persistence.js](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/tools/persistence.js) is the prototype baseline for this boundary.

For planning purposes:

- `runtime-state.json` is transitional evidence for `learner_module_state`
- `assessment-results.json` is transitional evidence for `assessment_result_record`
- `analytics-events.json` is transitional evidence for `analytics_event_record`
- `cqi-report.json` remains derived reporting output, not canonical state

## Required Keys

This boundary requires stable identifiers before implementation:

- `course_id`
- `module_id`
- `week`
- `learner_key`
- `activity_id`
- `attempt_id`
- timestamps for state changes and event creation

`learner_key` is intentionally abstract in this slice. It does not imply that auth or account design is done.

## Write Ownership

- runtime logic writes `learner_module_state` and `attempt_record`
- assessment logic writes `assessment_result_record`
- analytics logic writes `analytics_event_record`

## Read Ownership

- future service/API layers read canonical records and expose product behavior
- output/dashboard/control layers consume projections derived from canonical records
- CQI and reporting stay downstream from canonical records

## Out Of Scope

- database engine choice
- database schema implementation
- API endpoint design
- auth/account model
- learner UI implementation
- instructor workflow redesign

## Result Of This Slice

After `P5-PLAN-001`, the repo now has:

- one named persistent-state boundary
- one explicit canonical-vs-derived split
- one safe starting point for the next planning task

The canonical entity and repository contract for that boundary is now documented in [LEARNING_RECORD_STORE_CONTRACT.md](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/LEARNING_RECORD_STORE_CONTRACT.md).

## Next Planning Step

The next task should define mutation flow, write ordering, and projection inputs for the `Learning Record Store` without choosing database or API implementation details.
