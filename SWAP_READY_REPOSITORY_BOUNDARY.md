# Swap-Ready Repository Boundary

## Planning Slice

- `Phase`: `P5-PRODUCT`
- `Process`: `PROC-DOC`
- `Task ID`: `P5-PLAN-011`

## Purpose

This document defines the repository-implementation boundary that a future non-file-backed persistence layer must satisfy.

It does not choose a database engine, API transport, auth model, or deployment architecture.

## Goal

Prepare the current `Learning Record Store` seams for a future storage-adapter replacement without forcing rewrites in:

- mutation services
- query services
- projection assembly services
- current output builders

## Boundary Decision

The adapter-swap boundary sits exactly at the repository port layer already defined in [LEARNING_RECORD_PORTS_AND_SERVICES.md](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/LEARNING_RECORD_PORTS_AND_SERVICES.md).

This means:

- service interfaces stay stable
- projection interfaces stay stable
- canonical record contracts stay stable
- only repository implementations are allowed to change during the first storage swap

## Preserved Seams

The following seams must remain stable during a future adapter swap:

### 1. Canonical Record Contracts

These record shapes remain unchanged:

- `learner_module_state`
- `attempt_record`
- `assessment_result_record`
- `analytics_event_record`

No storage adapter may redefine those contracts.

### 2. Repository Port Contracts

These repository interfaces remain unchanged:

- `LearnerModuleStateRepository`
- `AttemptRecordRepository`
- `AssessmentResultRepository`
- `AnalyticsEventRepository`

The first real storage swap must satisfy the existing method names and semantics before any port expansion is considered.

### 3. Service Contracts

These services must continue to call repository ports only:

- `LearningProgressService`
- `AttemptCaptureService`
- `AssessmentResultService`
- `AnalyticsEventService`
- `LearningRecordQueryService`
- `ProjectionAssemblyService`

The adapter swap must not push storage-specific concerns up into those services.

### 4. Output Contracts

These outputs remain preserved while the storage implementation changes:

- week dashboard JSON
- course dashboard JSON
- CQI report JSON
- CQI markdown
- existing published output paths

## Replaceable Seams

The following parts may be replaced in a future persistence step:

### 1. File-Backed Repository Implementations

The current adapter in [state/repositories/file-backed-learning-record-store.js](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/state/repositories/file-backed-learning-record-store.js) is replaceable.

It is now the reference implementation, not the long-term product implementation.

### 2. Storage-Specific Mapping Internals

These may change inside a future adapter:

- file layout assumptions
- read/write batching strategy
- record lookup strategy
- storage transaction behavior
- concurrency handling

Those changes must stay below the repository ports.

### 3. Adapter Construction

The repo may later introduce a composition point that chooses between:

- file-backed adapter
- future product-backed adapter

That selection seam must still return the same repository port surface to services.

## Required Compatibility Rules

A future non-file-backed adapter must satisfy all of these:

### 1. Record Compatibility

It must read and write canonical records that validate against the current record modules.

### 2. Mutation Compatibility

It must preserve:

- append-only behavior for attempts, assessment results, and analytics events
- mutable current-state behavior for learner module state
- current write-order expectations from [LEARNING_RECORD_MUTATION_FLOW.md](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/LEARNING_RECORD_MUTATION_FLOW.md)

### 3. Query Compatibility

It must support the current query/projection service expectations without exposing storage-specific details.

### 4. Output Compatibility

It must allow current teacher dashboard, course dashboard, and CQI outputs to remain behaviorally stable.

## File-Backed Adapter Baseline

The current file-backed adapter is preserved as the baseline reference for:

- repository behavior
- record retrieval semantics
- service integration expectations
- regression testing

This means the first real storage swap should be measured against the current adapter, not against ad hoc assumptions.

## First Swap Constraint

The first storage swap must be one-adapter-at-a-time.

Do not combine in the same slice:

- repository implementation replacement
- service contract changes
- projection contract changes
- output contract changes

## Test Boundary Requirement

The repo will need adapter-level conformance tests before a future storage swap starts.

Those tests should prove that any repository implementation:

- satisfies port semantics
- preserves canonical record behavior
- keeps current service and projection flows green

## Explicit Non-Goals

This boundary definition does not decide:

- SQL vs NoSQL
- table or collection design
- migration tooling
- API routes
- auth/session modeling
- deployment/runtime topology

## Next Controlled Task

The next controlled task after this planning slice should be:

- define repository adapter conformance tests and swap-readiness criteria for a future non-file-backed implementation

That is the smallest safe next step because it strengthens the storage boundary without starting database or API work.
