# ARCHITECTURE_PHASE_NOTE.md

## Purpose

This file locks the current architecture phase so implementation does not drift.

## Current Phase

- `Phase`: `P4-OUTPUT`
- `Process`: `PROC-PUB` / `PROC-RM` / `PROC-CTRL`
- `Position`: `late prototype`

## What This Phase Means

The repository is currently strengthening the backend output/control foundation:

- publish outputs consistently
- generate stable read models
- expose system/course/control registries
- make the next action visible from backend data

This phase is about making the prototype operationally clear and internally stable.

## Allowed Work

- output publishing improvements
- control-layer backend artifacts
- read-model improvements
- dashboard/control HTML that consumes backend data
- documentation that reduces drift
- tests that lock output/control behavior

## Do Not Do Yet

- do not start production API design
- do not start authenticated user/account system
- do not build a full product app shell
- do not add database-first architecture unless the phase is explicitly changed
- do not shift effort into learner-product polish while control/output backend is still incomplete

## Exit Criteria For Next Phase

Move out of `P4-OUTPUT` only when most of these are true:

- output publishing path is centralized and stable
- control layer shows current state and recommended next actions
- course/system registries are present and trusted
- docs clearly show current phase and next work
- backend output/control foundation no longer changes every small step

## Next Phase Target

Target next phase after exit:

- `Phase`: `P5-PRODUCT`

Expected focus there:

- persistent application state
- service/API boundaries
- real multi-user/product architecture
