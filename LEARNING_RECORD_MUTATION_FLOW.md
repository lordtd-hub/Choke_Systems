# Learning Record Mutation Flow

## Planning Slice

- `Phase`: `P5-PRODUCT`
- `Process`: `PROC-DOC`
- `Task ID`: `P5-PLAN-003`

## Purpose

This document defines mutation flow, write ordering, and projection inputs for the `Learning Record Store`.

It does not choose database transactions, API endpoints, or queue infrastructure.

## Canonical Write Model

Canonical records in scope:

- `learner_module_state`
- `attempt_record`
- `assessment_result_record`
- `analytics_event_record`

Write categories:

- mutable snapshot:
  - `learner_module_state`
- append-only evidence:
  - `attempt_record`
  - `assessment_result_record`
  - `analytics_event_record`

## Write Ownership

- runtime layer owns mutation of `learner_module_state`
- runtime layer appends `attempt_record`
- assessment layer appends `assessment_result_record`
- analytics layer appends `analytics_event_record`
- projections and output layers do not write canonical records

## Ordering Rules

The write order for one learner interaction should follow this sequence:

1. load current `learner_module_state`
2. write or update `learner_module_state` for the new runtime position
3. append `attempt_record` if the interaction creates a learner attempt
4. append `assessment_result_record` only after its source `attempt_record` exists
5. update `learner_module_state` again if scoring changes completion or latest-attempt pointers
6. append `analytics_event_record` only after canonical source writes succeed
7. refresh projections from canonical records, never the other way around

## Flow By Mutation Type

### A. Module Start Or Resume

Intent:

- create or load the current learner snapshot for one module/week

Writes:

- create `learner_module_state` if missing
- otherwise update `updated_at` only when state actually changes

Append-only writes:

- none required

### B. Section Completion

Intent:

- mark a required or optional section complete

Writes:

- mutate `learner_module_state.section_state`
- recompute `progress`
- update `status`, `updated_at`, and `completed_at` when applicable

Append-only writes after mutation:

- append one `analytics_event_record` of completion evidence

### C. Activity Attempt Submission

Intent:

- capture a learner response for a quiz, SBRA, or other activity attempt

Writes:

- append `attempt_record`
- mutate `learner_module_state.activity_state`:
  - latest attempt reference
  - in-progress/completed status if applicable
  - timestamps

Append-only writes after mutation:

- append one or more `analytics_event_record` items only after the attempt and snapshot are consistent

### D. Assessment Scoring

Intent:

- score an existing learner attempt

Precondition:

- source `attempt_record` already exists

Writes:

- append `assessment_result_record`
- optionally mutate `learner_module_state.activity_state` if scoring causes completion or pass/fail progress state changes

Append-only writes after mutation:

- append score-related `analytics_event_record`

### E. Reflection Capture

Intent:

- capture reflection evidence tied to the learning flow

Writes:

- no new mutable snapshot field is required in the first slice unless the runtime view needs it

Append-only writes:

- append reflection-style `analytics_event_record`

## Mutation Invariants

- append-only records are never edited in place
- `assessment_result_record` must reference an existing `attempt_record`
- `analytics_event_record` must reflect already-committed canonical state
- projections must tolerate replay from canonical records
- mutable snapshot state must be derivable from the latest canonical writes for one learner/module context

## Projection Inputs

### 1. Learner Progress Projection

Purpose:

- summarize current learner progress for one module/week

Consumes:

- `learner_module_state`

May enrich from:

- source contracts and bundle metadata

### 2. Assessment Evidence Projection

Purpose:

- show learner scoring breakdowns and activity result history

Consumes:

- `assessment_result_record`
- `attempt_record`

May enrich from:

- bundle/activity metadata

### 3. Analytics Event Projection

Purpose:

- present evidence timeline and activity-level learning signals

Consumes:

- `analytics_event_record`

### 4. CQI / CLO Projection

Purpose:

- produce CLO summaries and action signals

Consumes:

- `analytics_event_record`

May enrich from:

- course source contract
- bundle/module metadata
- `assessment_result_record` for drilldown when needed

### 5. Teacher Week Dashboard Projection

Purpose:

- show module summary, artifact counts, and week-level instructional status

Consumes:

- `learner_module_state`
- `assessment_result_record`
- `analytics_event_record`

May enrich from:

- derived CQI projection
- bundle metadata
- workflow metadata

Current prototype reference:

- [tools/teacher-dashboard-data.js](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/tools/teacher-dashboard-data.js)

### 6. Course Dashboard Projection

Purpose:

- aggregate week-level instructional status across a course

Consumes:

- teacher week dashboard projections

Current prototype reference:

- [tools/course-dashboard-data.js](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/tools/course-dashboard-data.js)

### 7. Control / Registry Projections

Purpose:

- expose build status, output coverage, and recommended operator actions

Consumes directly:

- output registries and workflow artifacts

Does not consume canonical learner records directly in the first product slice.

Current prototype reference:

- [tools/instructor-build-control-data.js](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/tools/instructor-build-control-data.js)

## Projection Boundary Rules

- projections are rebuildable from canonical records plus source contracts and workflow metadata
- projections do not own truth for learner state
- control/build projections remain operational outputs, not learner-state repositories
- course and catalog dashboards stay downstream of week-level projections

## Mapping To Current Prototype

Current code already implies the following write sequence:

- [tools/runtime-state.js](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/tools/runtime-state.js)
  - creates and mutates snapshot progression state
  - captures attempts
- [tools/assessment-engine.js](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/tools/assessment-engine.js)
  - produces normalized assessment results after a submission exists
- [tools/analytics.js](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/tools/analytics.js)
  - produces completion, score, and reflection events after source state exists
- [tools/cqi-report.js](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/tools/cqi-report.js)
  - consumes learning evidence to render CQI summaries

## Out Of Scope

- transaction isolation strategy
- retry/idempotency mechanics
- background projection refresh mechanics
- event bus design
- API mutation contract
- database schema implementation

## Result Of This Slice

After `P5-PLAN-003`, the repo now has:

- explicit write ordering for canonical learner records
- explicit mutable-versus-append-only rules
- explicit projection inputs for current and future product views

## Next Planning Step

The next task should define the persistent application state layer shape for the `Learning Record Store` without choosing a database or API implementation.
