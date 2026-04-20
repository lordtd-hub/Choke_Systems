# ARCHITECTURE_PHASE_NOTE.md

## Purpose

This file locks the current architecture phase so implementation does not drift.

## Current Phase

- `Phase`: `P5-PRODUCT`
- `Process`: `PROC-DOC`
- `Position`: `transition planning`

## What This Phase Means

The repository has finished the current output/control hardening pass and is now defining the first product-layer planning slice:

- define the first persistent application state boundary
- define what the service/API layer must own next
- preserve the existing output/control backbone as the stable prototype base

This phase is about planning the product transition carefully before implementation starts.

## Why The Phase Changed

`P4-OUTPUT` exit criteria were reviewed and are satisfied strongly enough to move on:

- output publishing path is centralized and stable
- control layer shows current state and recommended next actions
- course/system registries are present and trusted
- docs clearly show current phase and next work
- backend output/control foundation no longer needs a new feature every small step

## Allowed Work

- product-transition planning docs
- persistent state boundary planning
- service/API boundary planning
- bug fixes that protect the existing output/control backbone
- tests or doc updates needed to keep the current backbone trustworthy

## Do Not Do Yet

- do not implement database storage yet
- do not implement authenticated user/account flows yet
- do not build the production API layer yet
- do not build a full learner/product app shell yet
- do not reopen `P4-OUTPUT` with new feature work unless a concrete blocker appears

## Immediate Focus

The next locked task in this phase should define the first `P5-PRODUCT` planning slice without starting implementation:

- choose the first product boundary to design
- state what is in scope and out of scope
- keep the current prototype outputs as the baseline to preserve
