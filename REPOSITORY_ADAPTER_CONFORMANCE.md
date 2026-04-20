# Repository Adapter Conformance

## Planning Slice

- `Phase`: `P5-PRODUCT`
- `Process`: `PROC-DOC`
- `Task ID`: `P5-PLAN-012`

## Purpose

This document defines how a future non-file-backed repository adapter proves compatibility with the existing `Learning Record Store` seams before it is allowed to replace the current file-backed adapter.

It does not approve database implementation, API implementation, auth design, or adapter rollout work.

## Inputs

This conformance definition builds directly on:

- [SWAP_READY_REPOSITORY_BOUNDARY.md](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/SWAP_READY_REPOSITORY_BOUNDARY.md)
- [LEARNING_RECORD_STORE_CONTRACT.md](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/LEARNING_RECORD_STORE_CONTRACT.md)
- [LEARNING_RECORD_MUTATION_FLOW.md](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/LEARNING_RECORD_MUTATION_FLOW.md)
- [LEARNING_RECORD_PORTS_AND_SERVICES.md](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/LEARNING_RECORD_PORTS_AND_SERVICES.md)
- [LEARNING_RECORD_MIGRATION_REVIEW.md](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/LEARNING_RECORD_MIGRATION_REVIEW.md)

## Conformance Goal

A future adapter is conformant only if it can replace the current file-backed adapter behind the repository ports without forcing changes in:

- canonical record contracts
- mutation service contracts
- query and projection service contracts
- dashboard and CQI output contracts

## Required Conformance Checks

### 1. Port-Surface Conformance

The adapter must implement the same repository port surface currently used by the state layer:

- `LearnerModuleStateRepository`
- `AttemptRecordRepository`
- `AssessmentResultRepository`
- `AnalyticsEventRepository`

Conformance here means:

- the same method names are satisfied
- the same method inputs are accepted
- the same method result shapes are returned
- the same record identity rules continue to hold

No adapter qualifies if it requires service-layer branching by adapter type.

### 2. Canonical Record Conformance

The adapter must read and write canonical records that remain valid against the current record modules under [`state/records/`](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/state/records).

Conformance here means:

- no record family is renamed
- no canonical field is removed
- no storage-specific metadata leaks into canonical records returned to services
- current normalization and validation rules stay true

### 3. Mutation Semantics Conformance

The adapter must preserve the mutation semantics defined in [LEARNING_RECORD_MUTATION_FLOW.md](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/LEARNING_RECORD_MUTATION_FLOW.md).

Conformance here means:

- learner module state remains mutable current state
- attempts remain append-only
- assessment results remain append-only
- analytics events remain append-only
- write ordering expectations used by mutation services remain behaviorally stable

### 4. Query Semantics Conformance

The adapter must preserve the read semantics needed by:

- [state/services/learning-record-query-service.js](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/state/services/learning-record-query-service.js)
- [state/services/projection-assembly-service.js](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/state/services/projection-assembly-service.js)

Conformance here means:

- the same records can be retrieved by identity
- current latest-state expectations still resolve correctly
- append-only histories remain available for projection assembly
- no storage-specific query contract leaks into the service layer

### 5. Output Regression Conformance

The adapter must preserve the currently published product-facing outputs built from the read layer.

Conformance here means:

- teacher dashboard data remains contract-compatible
- course dashboard data remains contract-compatible
- CQI report input behavior remains contract-compatible
- output file paths and workflow entrypoints remain unchanged during the adapter swap

## Required Validation Layers

Any future adapter swap must be validated through four layers, in this order:

### 1. Repository Conformance Tests

Run seam-level tests against repository port behavior.

These tests must prove:

- canonical records round-trip correctly
- mutable versus append-only behavior is preserved
- missing-record behavior matches the current baseline
- identity lookup behavior matches the current baseline

### 2. Service Regression Tests

Run mutation-service tests and read-service tests against the future adapter.

These tests must prove:

- write ordering remains valid
- service commands still produce the same canonical side effects
- query services still assemble the same read inputs

### 3. Projection Regression Tests

Run projection-assembly tests against the future adapter.

These tests must prove:

- teacher week projections remain equivalent
- course projections remain equivalent
- CQI projections remain equivalent

### 4. Output Builder Regression Tests

Run the existing builder/output tests through the new adapter-backed read layer.

These tests must prove:

- current dashboard builders stay green
- current CQI builder stays green
- current published output contracts do not drift

## Swap-Readiness Criteria

The repo is swap-ready for a future adapter only when all of these are true:

### 1. The File-Backed Adapter Remains The Reference Baseline

The current file-backed adapter remains the comparison baseline until the future adapter matches it through automated validation.

### 2. Conformance Coverage Exists Before Adapter Selection

The test surface must exist before a second adapter becomes the preferred implementation in any workflow path.

### 3. Service And Projection Seams Stay Frozen During The First Swap

The first adapter replacement must not be combined with:

- service API changes
- projection contract changes
- output contract changes

### 4. Output Builders Stay On The Same Public Contracts

The first swap must preserve current output paths and builder entrypoints while only changing the repository implementation beneath them.

## Explicit Non-Goals

This planning slice does not choose:

- the future storage engine
- migration tooling
- transaction model details
- API routes
- auth or tenancy model
- deployment model

## Next Controlled Task

The next controlled task after this planning slice should be:

- define the first adapter-swap rollout plan behind the current repository ports

That is the smallest safe next move because it turns the conformance rules into a controlled execution sequence without starting database or API implementation.
