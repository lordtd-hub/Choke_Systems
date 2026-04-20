# ARCHITECTURE_PHASE_NOTE.md

## Purpose

This file locks the current architecture phase so implementation does not drift.

## Current Phase

- `Phase`: `P5-PRODUCT`
- `Process`: `PROC-DOC`
- `Position`: `adapter-rollout planning`

## What This Phase Means

The repository has finished the current output/control hardening pass and the first product-layer planning pass.

The current work is now the next narrow planning step after defining adapter conformance and swap-readiness criteria for the `Learning Record Store`:

- define the first adapter-swap rollout plan behind the current repository ports
- preserve the finished state-layer seams and current published output contracts
- keep the current file-backed adapter as the preserved reference implementation
- preserve the existing output/control backbone as the stable prototype base

This phase is about planning the next persistence step carefully without opening database, API, auth, or frontend product work yet.

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

The second implementation package for that boundary is now implemented in the repository under [`state/services/`](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/state/services).

The third implementation package for that boundary is now implemented in the repository under [`state/services/`](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/state/services) and [`state/projections/`](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/state/projections).

The fourth implementation package for that boundary is now implemented in the repository through the current dashboard/CQI builders in [`tools/teacher-dashboard-data.js`](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/tools/teacher-dashboard-data.js), [`tools/course-dashboard-data.js`](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/tools/course-dashboard-data.js), and [`tools/cqi-report.js`](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/tools/cqi-report.js).

The migration review for that boundary is now documented in [LEARNING_RECORD_MIGRATION_REVIEW.md](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/LEARNING_RECORD_MIGRATION_REVIEW.md).

The swap-ready repository boundary for that future adapter step is now documented in [SWAP_READY_REPOSITORY_BOUNDARY.md](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/SWAP_READY_REPOSITORY_BOUNDARY.md).

The repository adapter conformance rules for that future adapter step are now documented in [REPOSITORY_ADAPTER_CONFORMANCE.md](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/REPOSITORY_ADAPTER_CONFORMANCE.md).

## Allowed Work

- `state-identity` implementation
- canonical record module implementation
- file-backed repository port implementation
- mutation-service implementation over repository ports
- service-level command and write-order tests
- query-service implementation over repository ports
- projection assembly service implementation and projection-input modules
- dashboard/CQI rewiring onto query/projection services
- planning and doc updates needed to define the future storage-adapter swap boundary
- planning and doc updates needed to define adapter conformance and swap-readiness criteria
- planning and doc updates needed to define the first adapter-swap rollout plan
- bug fixes that protect the existing output/control backbone
- tests or doc updates needed to keep the current backbone trustworthy

## Do Not Do Yet

- do not implement database storage yet
- do not implement authenticated user/account flows yet
- do not build the production API layer yet
- do not build a full learner/product app shell yet
- do not reopen `P4-OUTPUT` with new feature work unless a concrete blocker appears
- do not reopen package-four rewiring with new feature work unless a concrete regression is found
- do not broaden this planning step into database, API, auth, or app-shell implementation

## Immediate Focus

The next locked task in this phase should define the first adapter-swap rollout plan behind the current repository ports:

- keep the chosen boundary explicit
- keep the file-backed adapter as the preserved baseline
- define the execution sequence for introducing a second adapter without breaking current seams
- keep the current prototype outputs as the baseline to preserve
