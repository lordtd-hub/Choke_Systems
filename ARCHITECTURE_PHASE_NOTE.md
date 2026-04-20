# ARCHITECTURE_PHASE_NOTE.md

## Purpose

This file locks the current architecture phase so implementation does not drift.

## Current Phase

- `Phase`: `P5-PRODUCT`
- `Process`: `PROC-STATE`
- `Position`: `second package implementation`

## What This Phase Means

The repository has finished the current output/control hardening pass and the first product-layer planning pass.

The current work is now the second bounded implementation slice for the `Learning Record Store`:

- implement mutation services over repository ports
- keep canonical write ordering inside services
- preserve the first package repository seams as the stable base
- preserve the existing output/control backbone as the stable prototype base

This phase is about extending the state layer carefully without opening database, API, auth, query/projection, or frontend product work yet.

## Why The Phase Changed

`P4-OUTPUT` exit criteria were reviewed and are satisfied strongly enough to move on:

- output publishing path is centralized and stable
- control layer shows current state and recommended next actions
- course/system registries are present and trusted
- docs clearly show current phase and next work
- backend output/control foundation no longer needs a new feature every small step

The first chosen product boundary is now documented in [PERSISTENT_STATE_BOUNDARY.md](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/PERSISTENT_STATE_BOUNDARY.md).

The canonical entity and repository contract for that boundary is now documented in [LEARNING_RECORD_STORE_CONTRACT.md](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/LEARNING_RECORD_STORE_CONTRACT.md).

The mutation flow for that boundary is now documented in [LEARNING_RECORD_MUTATION_FLOW.md](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/LEARNING_RECORD_MUTATION_FLOW.md).

The persistent application state layer shape for that boundary is now documented in [LEARNING_RECORD_STATE_LAYER.md](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/LEARNING_RECORD_STATE_LAYER.md).

The repository ports and service interfaces for that boundary are now documented in [LEARNING_RECORD_PORTS_AND_SERVICES.md](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/LEARNING_RECORD_PORTS_AND_SERVICES.md).

The implementation sequence for that boundary is now documented in [LEARNING_RECORD_IMPLEMENTATION_PLAN.md](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/LEARNING_RECORD_IMPLEMENTATION_PLAN.md).

The first implementation package for that boundary is now documented in [LEARNING_RECORD_FIRST_PACKAGE.md](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/LEARNING_RECORD_FIRST_PACKAGE.md).

The second implementation package for that boundary is now documented in [LEARNING_RECORD_SECOND_PACKAGE.md](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/LEARNING_RECORD_SECOND_PACKAGE.md).

The third implementation package for that boundary is now documented in [LEARNING_RECORD_THIRD_PACKAGE.md](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/LEARNING_RECORD_THIRD_PACKAGE.md).

The fourth implementation package for that boundary is now documented in [LEARNING_RECORD_FOURTH_PACKAGE.md](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/LEARNING_RECORD_FOURTH_PACKAGE.md).

The implementation-readiness decision for that boundary is now documented in [LEARNING_RECORD_IMPLEMENTATION_READINESS.md](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/LEARNING_RECORD_IMPLEMENTATION_READINESS.md).

The first implementation package for that boundary is now implemented in the repository under [`state/`](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/state).

## Allowed Work

- `state-identity` implementation
- canonical record module implementation
- file-backed repository port implementation
- mutation-service implementation over repository ports
- service-level command and write-order tests
- bug fixes that protect the existing output/control backbone
- tests or doc updates needed to keep the current backbone trustworthy

## Do Not Do Yet

- do not implement database storage yet
- do not implement authenticated user/account flows yet
- do not build the production API layer yet
- do not build a full learner/product app shell yet
- do not reopen `P4-OUTPUT` with new feature work unless a concrete blocker appears
- do not implement query/projection services or projection rewiring in the second package

## Immediate Focus

The next locked task in this phase should implement the second package for the chosen `Learning Record Store` state layer:

- keep the chosen boundary explicit
- build only mutation services and service-command helpers over the current repository ports
- keep the current prototype outputs as the baseline to preserve
