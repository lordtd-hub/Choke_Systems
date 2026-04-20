# Adapter Selection Seam

## Planning Slice

- `Phase`: `P5-PRODUCT`
- `Process`: `PROC-DOC`
- `Task ID`: `P5-PLAN-014`

## Purpose

This document defines the narrow composition seam that will eventually choose the active repository adapter behind the current `Learning Record Store` ports.

It does not implement adapter selection, database storage, API behavior, or production activation.

## Design Goal

The first adapter selection seam must let the repo:

- preserve the current file-backed adapter as the baseline
- make a future adapter available without exposing storage details to services
- keep selection logic in one composition point instead of scattering it through the state layer

## Seam Decision

The active adapter must be selected in one repository-composition module only.

That module sits below services and above concrete adapter implementations.

This means:

- services keep receiving repository ports, not adapter types
- projections keep calling services, not adapter factories
- output builders remain unaware of adapter selection

## Required Composition Boundary

The selection seam must produce one repository bundle that satisfies the existing repository ports:

- `LearnerModuleStateRepository`
- `AttemptRecordRepository`
- `AssessmentResultRepository`
- `AnalyticsEventRepository`

The seam must not return mixed surfaces where some callers receive file-backed repositories and others receive adapter-specific implementations directly.

## Allowed Selection Inputs

The first selection seam may use only narrow, explicit inputs such as:

- a repository adapter name
- a controlled runtime mode
- a test-only override

These inputs are allowed because they stay inside composition and do not alter the port contracts.

## Forbidden Selection Inputs

The first selection seam must not depend on:

- learner-facing request branching
- output-builder branching
- service-level conditionals by adapter type
- schema or source-of-truth file changes

If adapter choice requires branching above the repository-composition seam, the seam is defined incorrectly.

## Active Versus Inactive Boundary

The seam must distinguish clearly between:

- available adapters
- the active adapter

Available means an adapter can be constructed and tested.

Active means that adapter becomes the repository bundle used by the current workflows.

The future adapter may be available before it is active.

## Activation Guard Conditions

The selection seam may allow a future adapter to become active only when all of these are true:

- the future adapter passes repository conformance checks
- the future adapter passes service regression checks
- the future adapter passes projection regression checks
- the future adapter passes output regression checks
- the file-backed adapter remains selectable as the fallback path
- no service, projection, or output contract change is required for activation

If any one of these is false, the seam must resolve to the file-backed adapter.

## Fallback Rule

The file-backed adapter remains the default resolution path for the first selection seam.

That means:

- normal workflows continue to resolve to the file-backed adapter until activation is explicitly approved
- the future adapter can be present without becoming the default
- rollback is a seam-level resolution choice, not a service rewrite

## Placement Rule

The selection seam should live with repository composition, not with domain logic.

The future implementation should therefore keep the seam close to repository construction and away from:

- mutation services
- query services
- projection modules
- output builders

## What This Seam Does Not Decide

This planning slice does not decide:

- which future adapter will exist
- the storage engine behind that future adapter
- environment-specific rollout policy
- production infrastructure or deployment

## Next Controlled Task

The next controlled task after this planning slice should be:

- define the first inactive-adapter package behind the selection seam

That is the smallest safe next move because the composition boundary is now explicit, and the next missing piece is the bounded package that would let a future adapter exist as an inactive implementation without changing the active baseline.
