# Architecture Map

## Objective

This repository is a contract-first prototype for an OBE-aligned learning platform.

The implemented flow is:

`course.yaml` -> `weekly_plan.yaml` -> validation -> interactive module -> week bundle -> runtime -> assessment -> analytics -> CQI/frontend output

## Source Of Truth Layer

Primary source files:

- [calculus1_course.yaml](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/calculus1_course.yaml)
- [calculus1_weekly_plan.yaml](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/calculus1_weekly_plan.yaml)
- [AGENTS.md](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/AGENTS.md)
- [RULES.md](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/RULES.md)
- [main.md](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/main.md)

Responsibilities:

- `course.yaml` defines stable course catalogs and academic intent
- `weekly_plan.yaml` defines week-by-week instantiation and alignment
- docs define architecture boundaries and workflow rules

## Contract Layer

JSON Schemas in [`schemas/`](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/schemas):

- `course.schema.json`
- `weekly_plan.schema.json`
- `interactive_module.schema.json`
- `week_bundle.schema.json`
- `sbra_blueprint.schema.json`
- `sbra_blueprint_registry.schema.json`
- `content_manifest.schema.json`

Markdown contract summaries:

- [interactive_module.schema.md](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/interactive_module.schema.md)
- [sbra_blueprint.schema.md](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/sbra_blueprint.schema.md)

Responsibilities:

- enforce payload shape
- keep runtime, scoring, and UI dependent on contracts rather than raw prose
- provide machine-checkable interfaces between modules

## Validation Layer

Main validator:

- [tools/validate-contracts.js](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/tools/validate-contracts.js)

Responsibilities:

- validate course and weekly plan against schemas
- validate cross-file references
- validate alignment maps, activity types, strategies, assessments, rubrics, and evidence references

Inputs:

- `course.yaml`
- `weekly_plan.yaml`

Outputs:

- errors and warnings only

## Generation Layer

Interactive module builder:

- [tools/build-interactive-module.js](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/tools/build-interactive-module.js)

Responsibilities:

- transform one weekly unit into an `interactive_module`
- derive learning flow sections
- derive content blocks from topics, activities, assessments, and CLO context
- define progress hooks, assessment hooks, and evidence hooks

Week bundle builder:

- [tools/build-week-bundle.js](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/tools/build-week-bundle.js)

Responsibilities:

- combine `interactive_module`
- attach supplementary materials
- attach SBRA payloads with rubric and blueprint

Bundle dependencies:

- [tools/material-library.js](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/tools/material-library.js)
- [tools/sbra-blueprints.js](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/tools/sbra-blueprints.js)

## Content And SBRA Asset Layer

Supplementary content:

- [`SBRA+interactive material/content/manifest.json`](</Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/SBRA+interactive material/content/manifest.json>)

SBRA registry and blueprints:

- [`SBRA+interactive material/sbra_blueprints/registry.json`](</Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/SBRA+interactive material/sbra_blueprints/registry.json>)
- blueprint YAML files in [`SBRA+interactive material/sbra_blueprints/`](</Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/SBRA+interactive material/sbra_blueprints>)

Responsibilities:

- hold reusable supplementary content metadata
- map `activity_id` to exactly one SBRA blueprint file
- keep reasoning content outside runtime and UI code

Authoring helpers:

- [tools/new-material-entry.js](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/tools/new-material-entry.js)
- [tools/new-sbra-blueprint.js](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/tools/new-sbra-blueprint.js)

## Runtime Layer

Runtime state engine:

- [tools/runtime-state.js](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/tools/runtime-state.js)

Responsibilities:

- create `runtime_state` from `interactive_module`
- track section completion
- track activity completion
- record attempts
- summarize learner progress

Important boundary:

- runtime tracks progression state only
- runtime does not define scoring rules

## Assessment Layer

Assessment engine:

- [tools/assessment-engine.js](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/tools/assessment-engine.js)

Responsibilities:

- score SBRA submissions against blueprint + rubric scoring model
- score quiz submissions
- produce normalized assessment result payloads

Important boundary:

- scoring uses bundle-attached rubric and blueprint context
- no rendering logic exists here

## Analytics Layer

Analytics engine:

- [tools/analytics.js](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/tools/analytics.js)

Responsibilities:

- convert runtime, assessment, and reflection data into events
- summarize evidence by CLO
- generate CQI action signals

Event types currently supported:

- `completion`
- `score`
- `reflection`

## CQI Reporting Layer

CQI report builder:

- [tools/cqi-report.js](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/tools/cqi-report.js)
- [tools/render-demo-cqi-report.js](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/tools/render-demo-cqi-report.js)

Responsibilities:

- aggregate CLO summaries into a course-quality report
- expose report context, overview, CLO detail, and source events
- render report markdown for review/demo use

## Frontend Read Model

Frontend renderer:

- [frontend/week-bundle-view.js](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/frontend/week-bundle-view.js)
- [tools/render-week-bundle-html.js](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/tools/render-week-bundle-html.js)

Responsibilities:

- render a week bundle and runtime summary into static HTML
- treat the bundle as a read model
- keep presentation separate from scoring and runtime mutation

Important boundary:

- frontend consumes bundle contracts
- frontend does not generate contracts

## Output Publication And Control Layer

Published output/control backend:

- [tools/publish-system-outputs.js](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/tools/publish-system-outputs.js)
- [tools/output-registry.js](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/tools/output-registry.js)
- [tools/system-output-registry.js](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/tools/system-output-registry.js)
- [tools/course-action-queue.js](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/tools/course-action-queue.js)
- [tools/control-status-summary.js](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/tools/control-status-summary.js)
- [tools/instructor-build-control-data.js](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/tools/instructor-build-control-data.js)

Responsibilities:

- publish course, catalog, and control artifacts through one backend path
- expose course-level output completeness and file availability
- expose system-level output availability
- generate recommended next actions from backend state
- generate a normalized top-level control summary from repo control docs plus backend output state

Important boundary:

- control/task selection data is generated in backend tools
- frontend control pages consume those published artifacts rather than inventing workflow logic

## Test Layer

Test files in [`tests/`](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/tests):

- contract validation
- interactive module generation
- week bundle generation
- runtime state transitions
- assessment scoring
- analytics summaries
- CQI reporting
- frontend rendering
- material validation and authoring
- SBRA validation and authoring

The tests show the intended integration path for the system.

## Actual Data Flow

1. Validate `course.yaml` and `weekly_plan.yaml`
2. Build `interactive_module` for a week
3. Resolve supplementary materials from the manifest
4. Resolve SBRA blueprints from the registry
5. Build `week_bundle`
6. Create `runtime_state`
7. Record completion and attempts
8. Score graded submissions
9. Generate analytics events and CLO summaries
10. Produce CQI report or render frontend HTML

## Current State

What exists now:

- source-of-truth YAML for one sample course
- implemented validation and generation pipeline
- implemented runtime, assessment, analytics, CQI, and HTML preview tools
- implemented output publication/control backend for week, course, catalog, and instructor control outputs
- implemented output registries, action queue, and control status summary artifacts
- implemented authoring helpers for materials and SBRA blueprints
- broad test coverage for the prototype pipeline

What does not yet exist:

- persistent database layer
- real learner-facing web app state management
- authenticated multi-user runtime
- production deployment packaging

## Known Documentation Drift

- [IMPLEMENTATION_PLAN.md](/Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/IMPLEMENTATION_PLAN.md) still describes the repo as pre-implementation, which is no longer true.
- Some docs under [`SBRA+interactive material/`](</Users/sittichoke/Desktop/Choke_Systems/Choke_Systems/SBRA+interactive material>) still contain old Windows-specific absolute links and should be cleaned up for portability.
