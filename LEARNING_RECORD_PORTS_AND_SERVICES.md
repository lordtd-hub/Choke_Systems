# Learning Record Ports And Services

## Planning Slice

- `Phase`: `P5-PRODUCT`
- `Process`: `PROC-DOC`
- `Task ID`: `P5-PLAN-005`

## Purpose

This document defines repository ports and service interfaces for the `Learning Record Store`.

It does not choose a database implementation, API surface, or transport protocol.

## Design Goal

The product needs stable internal interfaces before implementation begins.

Those interfaces should:

- keep storage concerns behind repository ports
- keep business write flow inside service interfaces
- keep projections downstream from canonical state

## Repository Ports

Repository ports are the storage-facing seams for canonical records.

They should be implementation-agnostic and work with the state-layer modules defined in [LEARNING_RECORD_STATE_LAYER.md](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/LEARNING_RECORD_STATE_LAYER.md).

### 1. `LearnerModuleStateRepository`

Owns:

- `learner_module_state`

Required operations:

- `getByLearnerModule(identity)`
- `saveCurrent(stateRecord)`
- `exists(identity)`

Optional operations:

- `deleteForTesting(identity)`
- `listByLearner(learnerScope)`

Notes:

- this is the only repository that updates a mutable canonical record
- save semantics are current-state replacement or version-checked update, not append-only

### 2. `AttemptRecordRepository`

Owns:

- `attempt_record`

Required operations:

- `append(attemptRecord)`
- `getById(attemptId)`
- `listByLearnerModule(identity)`
- `listByActivity(activityScope)`

Optional operations:

- `exists(attemptId)`

Notes:

- append-only
- no update operation is defined in this planning slice

### 3. `AssessmentResultRepository`

Owns:

- `assessment_result_record`

Required operations:

- `append(resultRecord)`
- `getById(assessmentResultId)`
- `listByLearnerModule(identity)`
- `listByAttempt(attemptId)`
- `listByActivity(activityScope)`

Optional operations:

- `exists(assessmentResultId)`

Notes:

- append-only
- must not accept a result that is detached from its source attempt

### 4. `AnalyticsEventRepository`

Owns:

- `analytics_event_record`

Required operations:

- `append(eventRecord)`
- `appendMany(eventRecords)`
- `getById(eventId)`
- `listByLearnerModule(identity)`
- `listByLearnerWeek(identity)`
- `listBySource(sourceScope)`

Optional operations:

- `exists(eventId)`

Notes:

- append-only
- batch append is useful because analytics may emit more than one event for a completed flow

## Shared Repository Input Shapes

### `identity`

Used by all repositories:

- `learner_key`
- `course_id`
- `module_id`
- `week`

### `activityScope`

Used for attempt/result queries:

- `learner_key`
- `course_id`
- `module_id`
- `week`
- `activity_id`

### `sourceScope`

Used for analytics-event queries:

- `learner_key`
- `course_id`
- `module_id`
- `week`
- `source_type`
- `source_id`

## Service Interfaces

Service interfaces are business-facing seams that coordinate repositories and enforce mutation flow from [LEARNING_RECORD_MUTATION_FLOW.md](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/LEARNING_RECORD_MUTATION_FLOW.md).

### 1. `LearningProgressService`

Purpose:

- own learner progress snapshot lifecycle

Required operations:

- `initializeModuleState(moduleContext)`
- `getCurrentModuleState(identity)`
- `completeSection(sectionCommand)`
- `completeActivity(activityCommand)`
- `recalculateProgress(identity)`

Uses:

- `LearnerModuleStateRepository`
- `AnalyticsEventService` when completion evidence must be emitted

Maps from current prototype logic:

- [tools/runtime-state.js](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/tools/runtime-state.js)

### 2. `AttemptCaptureService`

Purpose:

- capture learner attempts and synchronize latest-attempt state

Required operations:

- `recordAttempt(attemptCommand)`
- `getAttempt(attemptId)`
- `listAttempts(activityScope)`

Uses:

- `AttemptRecordRepository`
- `LearnerModuleStateRepository`

Maps from current prototype logic:

- [tools/runtime-state.js](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/tools/runtime-state.js)

### 3. `AssessmentResultService`

Purpose:

- create canonical assessment results from existing attempts

Required operations:

- `scoreAttempt(scoreCommand)`
- `getAssessmentResult(assessmentResultId)`
- `listAssessmentResults(activityScope)`

Uses:

- `AttemptRecordRepository`
- `AssessmentResultRepository`
- `LearnerModuleStateRepository`
- `AnalyticsEventService`

Maps from current prototype logic:

- [tools/assessment-engine.js](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/tools/assessment-engine.js)

### 4. `AnalyticsEventService`

Purpose:

- emit canonical event records from committed learner state changes

Required operations:

- `recordCompletionEvent(eventCommand)`
- `recordScoreEvent(eventCommand)`
- `recordReflectionEvent(eventCommand)`
- `listEvents(identity)`

Uses:

- `AnalyticsEventRepository`

Maps from current prototype logic:

- [tools/analytics.js](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/tools/analytics.js)

### 5. `LearningRecordQueryService`

Purpose:

- provide projection-facing read access without exposing raw storage details

Required operations:

- `getLearnerWeekSnapshot(identity)`
- `getAssessmentEvidence(activityScope)`
- `getAnalyticsTimeline(identity)`
- `getProjectionInputs(identity)`

Uses:

- all four repositories as read ports

Consumers:

- CQI/report builders
- dashboard builders
- future product read models

### 6. `ProjectionAssemblyService`

Purpose:

- assemble projection input packages from canonical records plus source contracts

Required operations:

- `buildTeacherWeekProjection(identity)`
- `buildCourseProjection(courseScope)`
- `buildCqiProjection(identity)`

Uses:

- `LearningRecordQueryService`
- source contracts and bundle metadata

Notes:

- this service still sits below HTML/output rendering
- it prepares product-ready read inputs, not final presentation output

## Interface Boundaries

### Repositories Must Not

- implement business progress rules
- calculate scores
- emit CQI recommendations
- own projection assembly

### Services Must Not

- bypass repository ports
- redefine canonical record contracts
- turn output artifacts into canonical storage

## Mapping From Current Prototype

### Current `tools/persistence.js`

Maps most closely to future repository implementations for:

- `LearnerModuleStateRepository`
- `AttemptRecordRepository`
- `AssessmentResultRepository`
- `AnalyticsEventRepository`

### Current `tools/runtime-state.js`

Maps most closely to:

- `LearningProgressService`
- `AttemptCaptureService`

### Current `tools/assessment-engine.js`

Maps most closely to:

- `AssessmentResultService`

### Current `tools/analytics.js`

Maps most closely to:

- `AnalyticsEventService`

### Current projection builders

- [tools/teacher-dashboard-data.js](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/tools/teacher-dashboard-data.js)
- [tools/course-dashboard-data.js](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/tools/course-dashboard-data.js)
- [tools/cqi-report.js](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/tools/cqi-report.js)

Map most closely to:

- `LearningRecordQueryService`
- `ProjectionAssemblyService`

## Minimal Interface Set

Before implementation, the smallest useful interface set is:

- four repository ports
- four mutation/query services
- one projection assembly service

Nothing broader is needed yet.

## Invariants

- repositories own storage access only
- services own coordination and business flow
- query and projection services stay downstream from canonical records
- current output/control artifacts remain derived outputs, not service-owned truth

## Out Of Scope

- repository implementation classes
- dependency injection patterns
- HTTP/RPC method design
- auth/session services
- queue consumers or background workers

## Result Of This Slice

After `P5-PLAN-005`, the repo now has:

- explicit repository ports for canonical records
- explicit service interfaces for mutation and projection access
- a clear seam between storage, business flow, and read assembly

## Next Planning Step

The next task should define the persistent application state layer implementation plan for the `Learning Record Store` without choosing a database or API implementation.
