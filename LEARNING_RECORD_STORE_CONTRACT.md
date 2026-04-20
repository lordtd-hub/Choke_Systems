# Learning Record Store Contract

## Planning Slice

- `Phase`: `P5-PRODUCT`
- `Process`: `PROC-DOC`
- `Task ID`: `P5-PLAN-002`

## Purpose

This document defines the canonical state entities and repository boundary for the `Learning Record Store`.

It does not choose a database engine, API style, or auth model.

## Boundary

The `Learning Record Store` is the first product-layer repository boundary.

It owns canonical learner records for one learning experience and separates them from generated outputs, reports, and dashboards.

## Repository Scope

The repository boundary owns:

- learner progress state
- immutable learner attempts
- immutable assessment results
- append-only analytics events

The repository boundary does not own:

- YAML source-of-truth files
- generated bundles
- dashboard JSON outputs
- CQI reports
- HTML outputs
- output registries or build-control artifacts

## Identity Scope

All canonical records in this boundary must be addressable by:

- `learner_key`
- `course_id`
- `module_id`
- `week`

Additional entity-specific identifiers exist below.

`learner_key` stays abstract in this planning slice and must not be treated as an auth decision.

## Canonical Entities

### 1. `learner_module_state`

Purpose:

- current progression snapshot for one learner in one module/week

Required fields:

- `learner_key`
- `course_id`
- `module_id`
- `week`
- `status`
- `progress`
- `section_state`
- `activity_state`
- `created_at`
- `updated_at`

Recommended fields:

- `completed_at`
- `evidence_hooks`
- `version`

Notes:

- this is the only mutable canonical entity in the first planning slice
- it represents current state, not a history log

### 2. `attempt_record`

Purpose:

- immutable learner submission/attempt evidence for one activity interaction

Required fields:

- `attempt_id`
- `learner_key`
- `course_id`
- `module_id`
- `week`
- `activity_id`
- `submitted_at`
- `status`

Recommended fields:

- `attempt_no`
- `response`
- `notes`
- `evidence`
- `source_kind`

Notes:

- derived from current runtime attempt capture
- append-only once written

### 3. `assessment_result_record`

Purpose:

- immutable normalized scoring output tied to one learner attempt

Required fields:

- `assessment_result_id`
- `attempt_id`
- `learner_key`
- `course_id`
- `module_id`
- `week`
- `activity_id`
- `activity_type`
- `score_ratio`
- `score_percent`
- `passed`
- `scored_at`

Recommended fields:

- `clo_mapping`
- `assessment_links`
- `evidence_tags`
- `breakdown`
- `summary`
- `scoring_context`

Notes:

- append-only once written
- must remain reproducible from scoring logic + attempt evidence

### 4. `analytics_event_record`

Purpose:

- append-only event stream for learner activity and evidence generation

Required fields:

- `event_id`
- `learner_key`
- `course_id`
- `module_id`
- `week`
- `event_type`
- `source_type`
- `source_id`
- `timestamp`

Recommended fields:

- `clo_ids`
- `evidence_type`
- `payload`

Notes:

- event payload remains typed by `event_type`
- this entity is append-only

## Canonical Versus Derived

Canonical records inside this repository:

- `learner_module_state`
- `attempt_record`
- `assessment_result_record`
- `analytics_event_record`

Derived records outside this repository:

- `runtime-state.json` as a prototype storage shape
- `cqi-report.json`
- `dashboard-data.json`
- `course-dashboard-data.json`
- `catalog-dashboard-data.json`
- `build-control-data.json`
- `control-status-summary.json`
- HTML outputs
- output registries
- action queues

## Repository Interface Boundary

The first repository boundary should support these responsibilities conceptually:

- load current `learner_module_state` by learner/module identity
- save current `learner_module_state`
- append `attempt_record`
- append `assessment_result_record`
- append `analytics_event_record`
- list attempts for a learner/module/activity context
- list assessment results for a learner/module/activity context
- list analytics events for a learner/module/week context

This is still a contract boundary, not an implementation contract.

## Write Ownership

Runtime layer writes:

- `learner_module_state`
- `attempt_record`

Assessment layer writes:

- `assessment_result_record`

Analytics layer writes:

- `analytics_event_record`

Output/control/reporting layers:

- do not write canonical records directly
- consume projections or queries derived from canonical records

## Read Ownership

Future product layers will read from this repository boundary:

- service/API layer for learner/instructor workflows
- projection builders for dashboards and control outputs
- CQI/reporting pipelines

Current prototype output layers should remain downstream consumers, not record owners.

## Mapping From Current Prototype Shapes

Current code already provides transitional shapes that map into this contract:

- [tools/runtime-state.js](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/tools/runtime-state.js)
  - maps to `learner_module_state` and `attempt_record`
- [tools/assessment-engine.js](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/tools/assessment-engine.js)
  - maps to `assessment_result_record`
- [tools/analytics.js](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/tools/analytics.js)
  - maps to `analytics_event_record`
- [tools/persistence.js](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/tools/persistence.js)
  - acts as the prototype storage baseline, but not the final repository design

## Invariants

- canonical records must carry learner/module identity
- attempts, assessment results, and analytics events are append-only
- derived dashboards and reports must be rebuildable from canonical records plus source contracts
- the repository boundary must stay usable before auth and database choices are finalized

## Out Of Scope

- SQL/NoSQL choice
- table or collection design
- API route design
- background job design
- auth/account implementation
- projection implementation

## Result Of This Slice

After `P5-PLAN-002`, the repo now has:

- named canonical entities
- an explicit repository ownership boundary
- a clean split between mutable snapshot state and append-only evidence

## Next Planning Step

The next task should define mutation flow, write ordering, and projection inputs for the `Learning Record Store` without choosing database or API implementation details.
