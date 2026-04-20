# Adapter Swap Rollout Plan

## Planning Slice

- `Phase`: `P5-PRODUCT`
- `Process`: `PROC-DOC`
- `Task ID`: `P5-PLAN-013`

## Purpose

This document defines the first controlled rollout sequence for introducing a future non-file-backed repository adapter behind the current `Learning Record Store` ports.

It does not approve database implementation, API implementation, auth implementation, or adapter activation in production.

## Inputs

This rollout plan builds directly on:

- [SWAP_READY_REPOSITORY_BOUNDARY.md](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/SWAP_READY_REPOSITORY_BOUNDARY.md)
- [REPOSITORY_ADAPTER_CONFORMANCE.md](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/REPOSITORY_ADAPTER_CONFORMANCE.md)
- [LEARNING_RECORD_PORTS_AND_SERVICES.md](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/LEARNING_RECORD_PORTS_AND_SERVICES.md)
- [LEARNING_RECORD_MIGRATION_REVIEW.md](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/LEARNING_RECORD_MIGRATION_REVIEW.md)

## Rollout Goal

The first adapter swap must introduce a future adapter in a way that preserves:

- the current repository ports
- the current service and projection seams
- the current output contracts
- the current file-backed adapter as the rollback baseline

The rollout is successful only if the future adapter can be introduced without combining storage replacement with broader product-layer changes.

## Preserved Baseline

The following remain fixed throughout the first rollout:

- canonical record contracts
- repository port method surfaces
- mutation service contracts
- query and projection service contracts
- teacher dashboard, course dashboard, and CQI output contracts
- the current file-backed adapter as the trusted fallback path

## Rollout Sequence

### 1. Freeze The Baseline

Before a second adapter is introduced, the current file-backed adapter stays as the only active implementation.

This stage locks:

- repository port expectations
- service-level behavior
- projection behavior
- output regression expectations

No future adapter may be wired into normal workflows until those expectations are treated as the preserved baseline.

### 2. Build Conformance Coverage

Before adapter selection exists, the repo must already have the validation layers defined in [REPOSITORY_ADAPTER_CONFORMANCE.md](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/REPOSITORY_ADAPTER_CONFORMANCE.md).

This stage prepares the proof surface for:

- repository conformance
- service regression
- projection regression
- output regression

The important rule is sequence:

- first define conformance coverage
- only then allow a second adapter to be wired behind the ports

### 3. Introduce The Future Adapter Inactive

The future adapter should first be added as an inactive implementation behind the existing ports.

Inactive means:

- it is constructible
- it is testable
- it is not yet the default workflow path
- the file-backed adapter still serves all current workflow entrypoints

This stage is about adding a second compatible implementation without changing the active behavior of the repo.

### 4. Validate Against The Preserved Baseline

Once the future adapter exists in inactive form, it must pass the full conformance stack against the preserved baseline.

At minimum, that validation must prove:

- repository semantics match the current adapter
- services continue to behave the same way
- projections continue to assemble the same results
- current output builders stay contract-compatible

If any of those fail, the rollout stops here.

### 5. Approve The Activation Boundary

Only after the inactive adapter passes the full validation stack may the repo define an activation decision.

That activation boundary must be explicit:

- who chooses the active adapter
- where the active adapter is selected
- what conditions must be green before that choice may change

The first rollout plan stops at defining that boundary, not at performing the activation itself.

## Activation Boundary

The future adapter may become eligible for activation only when all of these are true:

- the file-backed adapter remains available as the fallback path
- repository conformance checks are green
- service regression checks are green
- projection regression checks are green
- output regression checks are green
- no service, projection, or output contract drift is required to make the future adapter pass

If any one of those is false, the future adapter remains inactive.

## Rollback Rule

The first adapter swap must preserve a one-step rollback path to the file-backed adapter.

That means:

- the file-backed adapter cannot be removed during the first swap slice
- the first activation path must be reversible without changing ports or output contracts
- failure in the future adapter path must revert to the current adapter, not trigger broader architectural edits

## What This Rollout Plan Does Not Decide

This planning slice does not decide:

- the database engine
- migration tooling
- tenancy or auth model
- API surface
- production rollout environment
- when a future adapter actually becomes active

## Next Controlled Task

The next controlled task after this planning slice should be:

- define the adapter selection and activation seam behind the current repository ports

That is the smallest safe next step because the rollout sequence is now defined, and the next missing piece is the narrow composition boundary that would eventually choose between the preserved baseline adapter and a future inactive adapter.
