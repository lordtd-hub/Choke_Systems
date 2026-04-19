# IMPLEMENTATION_PLAN.md

## Restated Objective
Build a modular AI-assisted learning platform that uses source-of-truth YAML specs, generates weekly interactive modules, produces SBRA reasoning blueprints, and keeps runtime, assessment, analytics, and frontend concerns separated.

## Planning Basis
This plan is derived from:
- `AGENTS.md`
- `RULES.md`
- `main.md`
- `interactive_module.schema.md`
- `sbra_blueprint.schema.md`

## Architectural Reading
- The repository is currently specification-first and does not yet contain implementation files.
- `main.md` defines the end-to-end system flow and priority order.
- `RULES.md` defines non-negotiable boundaries between data, generation, runtime, assessment, and UI.
- `interactive_module.schema.md` defines the weekly module contract.
- `sbra_blueprint.schema.md` defines the SBRA reasoning contract.
- `AGENTS.md` requires Codex to preserve architecture, schemas, and source-of-truth files while planning and integrating work.

## Project State
Current state:
- design constraints exist
- schemas exist as Markdown specs
- example YAML specs now exist in this workspace as:
  - `calculus1_course.yaml`
  - `calculus1_weekly_plan.yaml`
- implementation modules do not yet exist

This means the next work should begin with contract materialization, validation, and only then implementation.

## YAML Contract Reading
The newly added YAML examples clarify the intended source-of-truth split:

### `course.yaml` role
`course.yaml` is the course-level blueprint (`โครงระดับรายวิชา`).

It currently carries:
- course metadata
- philosophy and design principles
- PLO alignment
- CLO definitions and passing criteria
- strategy catalog
- activity type catalog
- assessment catalog and CLO assessment maps
- rubric catalog
- learning evidence guidance
- rules for linking to weekly planning
- export hints for future outputs such as OBE/CLO mapping and `มคอ.3` / `มคอ.5`

Design implication:
- this file should remain stable, canonical, and reusable across generators, runtime, analytics, and export pipelines

### `weekly_plan.yaml` role
`weekly_plan.yaml` is the week-level plan derived from `course.yaml` (`แผนระดับสัปดาห์ที่อิงจาก course.yaml`).

It currently carries:
- course reference metadata
- semester and week structure
- per-week topics
- primary and secondary CLO mapping
- strategy mapping
- activity instances
- assessment links
- expected evidence
- plan-level summary maps
- implementation notes for analytics and evidence collection

Design implication:
- this file should contain weekly instantiation, sequencing, and delivery detail
- it should reference course catalogs rather than duplicate course-level definitions

## YAML Design Principles
Based on the examples and your notes, all future schema work should optimize for:
- readable structure
- easy manual editing
- AI/Codex-friendly field naming and layout
- future support for OBE
- future support for CLO mapping
- future support for `มคอ.3`
- future support for `มคอ.5`

Practical interpretation:
- prefer explicit field names over compressed structures
- prefer reusable ID catalogs at course level
- prefer week-level references over duplicated definitions
- keep cross-file references predictable and machine-validatable
- keep export-oriented metadata in the spec layer rather than scattering it into runtime code

## OBE and AUN-QA Interpretation
The system should treat OBE and AUN-QA as architecture-level requirements, not as reporting add-ons.

### OBE implications
The user clarification sharpens these core rules:
- start with intended learning outcomes first
- use backward design
- make assessment evidence explicit
- ensure teaching activities support the intended outcomes
- use assessment for learning, not only grading

System interpretation:
- `course.yaml` should define the stable outcome framework
- `weekly_plan.yaml` should operationalize that framework week by week
- generated modules must preserve alignment among outcomes, activities, assessments, and evidence
- analytics must be able to show whether outcomes were attained, not only whether activities were completed

### Constructive alignment rule
Constructive alignment should become a first-class validation concept.

Minimum alignment chain:
- PLOs -> CLOs
- CLOs -> weekly topics
- CLOs -> learning activities
- CLOs -> assessment methods
- assessments -> evidence artifacts
- evidence -> analytics and improvement decisions

Validation implication:
- the system should be able to detect missing links or weak links in this chain
- every activity should have a stated learning purpose, not just a task description
- every assessment should map to intended outcomes and expected evidence

### AUN-QA implications
AUN-QA v4.0 suggests the platform should eventually support evidence across four connected layers:

1. Programme design
- outcome definitions
- curriculum structure
- stakeholder-informed alignment

2. Programme implementation
- learner-centered strategies
- active learning
- assessment transparency
- rubric-supported judgement

3. People and resources
- instructor constraints
- student support assumptions
- facilities and delivery-mode context

4. Quality enhancement
- evidence aggregation
- attainment analysis
- feedback loops
- continuous quality improvement

Design implication:
- the platform should preserve enough structured evidence to support both teaching operations and quality assurance review
- CQI should be designed into the data model early, even if the reporting layer comes later

## Quality Evidence Model
Based on OBE and AUN-QA, the platform should distinguish between several evidence layers:
- planned alignment evidence
- learning process evidence
- assessment result evidence
- reflection and feedback evidence
- programme improvement evidence

Recommended interpretation:
- `course.yaml` stores planned alignment evidence
- `weekly_plan.yaml` stores planned delivery and evidence collection points
- `interactive_module` stores runtime-ready weekly structure
- runtime and assessment layers store actual learner evidence
- analytics stores attainment summaries and trend signals for CQI

## CQI and Closing-The-Loop Requirements
The system should be able to support "closing the loop" later, so the data model should retain:
- what outcomes were intended
- what was taught
- what was assessed
- what evidence was collected
- what results were observed
- what issues were found
- what improvements were decided for the next cycle

This means future schema design should reserve room for:
- attainment summaries by CLO and course
- assessment quality notes
- teaching reflection
- action items for next offering
- versioned course and weekly plan revisions

## Evidence Intelligence Requirements
The user explanation highlights that AUN-QA is moving from document checking to evidence intelligence.

System requirement:
- reports should be derivable from structured operational data rather than manually rewritten narrative alone

Practical implication:
- avoid storing key academic quality logic only in prose blocks
- store mappings, identifiers, attainment fields, and evidence types explicitly
- allow narrative reflection, but anchor it to structured references

## Contract Implications From The Examples
- the course-level spec is not only descriptive; it also acts as a catalog for strategies, activity types, assessments, rubrics, and evidence models
- the weekly plan is not raw prose; it is already close to a machine-usable planning contract
- CLO-centered mapping is the main backbone of both files
- SBRA should be treated as one activity type and one rubric/scoring path, not as a frontend feature
- the system should support constructive alignment as a traceable chain, not only as documentation text
- formative and summative evidence should both be represented in the contract model
- reflection is not optional decoration; it is part of evidence and CQI support
- analytics should be designed around fields already present in the weekly plan, especially:
  - `primary_clo`
  - `secondary_clos`
  - `activity_type_id`
  - `assessment_links`
  - `evidence_tags`

## Cross-File Validation Priorities
The examples suggest the validator layer should check at least:
- `course_ref.course_id` matches the course spec
- weekly `primary_clo` and `secondary_clos` exist in the course CLO catalog
- all CLOs map to valid PLO references where required by course policy
- weekly strategies exist in the course strategy catalog
- weekly `activity_type_id` values exist in the activity type catalog
- weekly `assessment_links` exist in the course assessment catalog
- weekly `rubric_id` values, when present, exist in the course rubric catalog
- plan-level maps remain consistent with weekly unit data
- every week has at least one primary CLO
- every activity has a primary CLO
- each weekly assessment focus is supported by actual activities and assessment links
- evidence expectations use normalized evidence vocabularies
- week count and assessment weeks match plan metadata

## Naming and File Strategy
Current examples use concrete sample filenames:
- `calculus1_course.yaml`
- `calculus1_weekly_plan.yaml`

Recommended rule:
- keep canonical schema concepts named `course.yaml` and `weekly_plan.yaml`
- allow course-specific instance files such as `<course_slug>_course.yaml` and `<course_slug>_weekly_plan.yaml`

This gives:
- human clarity
- multi-course scalability
- easier automation
- simpler validation and export tooling

## Revised First Recommended Build Slice
Recommended first slice now:
1. formalize the shared contract between `course.yaml` and `weekly_plan.yaml`
2. create machine-readable schema files for both source specs
3. implement cross-file validators using the current Calculus 1 examples as fixtures
4. add fixture-based tests for:
   - valid course spec
   - valid weekly plan
   - broken CLO reference
   - broken strategy reference
   - broken assessment reference
5. only after that, generate `interactive_module` payloads from weekly units

Reason:
- your YAML examples are already rich enough to serve as the real contract baseline
- this keeps the system editable by humans while still strongly typed by validation
- it sets up future OBE and `มคอ` exports from structured data instead of retrofitting them later

## Module Map

### 1. Spec Core
Purpose:
- establish source-of-truth course data
- establish weekly plan data
- formalize schema contracts into machine-validatable artifacts
- preserve alignment data needed for OBE and future AUN-QA review

Inputs:
- `course.yaml`
- `weekly_plan.yaml`
- schema definitions

Outputs:
- validated course spec
- validated week-by-week plan
- machine-checked schema layer

Acceptance criteria:
- source-of-truth files exist and validate
- naming is snake_case
- weekly plan can map 1 week to 1 interactive module
- no rendering or UI logic appears in the data layer
- outcome and evidence mappings are machine-traceable

### 2. Content Generation
Purpose:
- generate lesson content, quiz content, and SBRA raw inputs from the source specs

Inputs:
- course spec
- weekly plan
- CLO mappings

Outputs:
- content blocks
- activity payloads
- draft SBRA inputs

Acceptance criteria:
- generation consumes specs rather than hardcoded values
- outputs are structured for downstream assembly
- generation remains separate from runtime and frontend

### 3. Interactive Module Builder
Purpose:
- assemble one weekly module from generated content and schema contracts

Inputs:
- weekly plan entry
- content generation outputs
- interactive module schema

Outputs:
- one `interactive_module` payload per week

Acceptance criteria:
- exactly 1 module per week
- all `block_refs` and `activity_refs` resolve
- required sections and activities populate hooks correctly
- no hardcoded UI logic exists in the assembled module

### 4. SBRA Design Engine
Purpose:
- transform a problem into a structured SBRA blueprint

Inputs:
- problem statement
- topic/type/difficulty context

Outputs:
- `sbra_blueprint` payload

Acceptance criteria:
- each step has exactly 1 correct option
- distractors correspond to realistic misconception types
- explanations exist for each step
- no UI logic appears in the SBRA layer

### 5. Learning Engine
Purpose:
- manage learner progression, state, hints, retries, and section completion

Inputs:
- interactive module payload
- learner actions

Outputs:
- progress state
- attempt history
- completion signals

Acceptance criteria:
- runtime operates on module contracts, not generation prompts
- required sections and required activities are trackable
- retry and hint behavior do not alter assessment rules directly

### 6. Assessment Engine
Purpose:
- score activities and apply rubrics independently of presentation

Inputs:
- learner submissions
- assessment hooks
- SBRA scoring rules

Outputs:
- scores
- pass/fail decisions
- rubric-aligned results

Acceptance criteria:
- scoring is isolated from UI
- graded activities come only from assessment hooks
- SBRA supports step-based scoring as defined by schema
- formative and summative evidence can both feed attainment analysis

### 7. Data and Analytics
Purpose:
- store evidence, progress, scores, and CLO-level aggregates

Inputs:
- runtime events
- assessment results
- evidence hooks

Outputs:
- learner progress records
- completion evidence
- score summaries
- CLO metrics

Acceptance criteria:
- analytics consumes normalized events rather than UI state
- evidence includes completion, score, and reflection where applicable
- data model supports multi-course usage
- analytics can support CQI and closing-the-loop review later

### 8. Frontend
Purpose:
- render structured modules and learner progress without owning business logic

Inputs:
- interactive module payload
- runtime state
- assessment outputs

Outputs:
- module views
- activity views
- progress views

Acceptance criteria:
- frontend reads contracts only
- frontend does not implement scoring or SBRA logic
- rendering stays portable and machine-agnostic

## Execution Plan

### Phase 0. Lock Contracts
Scope:
- preserve protected files unchanged
- convert Markdown schemas into implementation-ready validation targets later
- identify missing source-of-truth data files

Deliverables:
- implementation plan
- backlog for schema materialization

Exit criteria:
- all architecture rules are captured in implementation tasks
- no protected files are changed

### Phase 1. Build Spec Core
Scope:
- create `course.yaml`
- create `weekly_plan.yaml`
- define machine-readable schema representations for module and SBRA contracts
- add validators
- define normalized alignment and evidence vocabularies where needed

Deliverables:
- source specs
- schema validation utilities
- sample valid data

Exit criteria:
- sample course and weekly plan validate successfully
- 1 week cleanly maps to 1 module
- the alignment chain from CLO to activity to assessment to evidence is traceable

### Phase 2. Build SBRA Engine First
Scope:
- implement the SBRA blueprint generator and validator before broader runtime work

Why now:
- `main.md` prioritizes schema, then module builder, then SBRA, then runtime
- however, SBRA has a well-bounded contract and can be validated early

Deliverables:
- SBRA generator interface
- SBRA validator
- misconception and distractor mapping rules

Exit criteria:
- one sample problem produces a valid blueprint
- invalid step structures are rejected

### Phase 3. Build Content Generation Layer
Scope:
- generate structured lesson blocks, practice items, quizzes, and SBRA prompts from course and weekly specs

Deliverables:
- generation interfaces
- content payload formats aligned to module builder needs

Exit criteria:
- generation outputs can populate schema-required module sections
- outputs are independent from any UI format

### Phase 4. Build Interactive Module Builder
Scope:
- assemble weekly content into the `interactive_module` contract
- enforce ref integrity and hooks

Deliverables:
- module assembler
- contract validation tests

Exit criteria:
- each weekly plan entry produces one valid module
- broken references fail validation clearly

### Phase 5. Build Learning Engine
Scope:
- implement progression, state, retries, and hints

Deliverables:
- learner state model
- progress tracking services

Exit criteria:
- required sections and activities can be completed and tracked
- runtime depends only on structured module data

### Phase 6. Build Assessment Engine
Scope:
- implement scoring for quiz and SBRA activities using assessment hooks

Deliverables:
- scoring services
- rubric adapters

Exit criteria:
- assessment runs without frontend coupling
- step-based SBRA scoring is supported

### Phase 7. Build Data and Analytics
Scope:
- persist progress and assessment outputs
- aggregate evidence and CLO metrics
- prepare for CQI-style review outputs

Deliverables:
- event model
- persistence layer
- analytics summaries

Exit criteria:
- completion, score, and reflection evidence are queryable
- course-level analytics work across more than one course
- attainment and evidence summaries can support improvement decisions for a future course cycle

### Phase 8. Build Frontend Last
Scope:
- render modules, activities, and progress from stable contracts

Deliverables:
- UI components
- contract adapters if needed

Exit criteria:
- frontend renders without embedding scoring or generation logic
- UI can swap implementations without changing contracts

## Delegation Plan
Codex-owned:
- architecture
- schemas and interfaces
- module boundaries
- integration decisions
- review of delegated output

Safe delegation targets:
- validator implementation within a fixed contract
- SBRA engine implementation within schema constraints
- module builder implementation against locked schemas
- tests for validators, builders, and scoring
- frontend rendering from finalized module schema

Not delegable:
- changes to protected files
- changes to architecture rules
- schema redesign without explicit human approval

## First Recommended Build Slice
Recommended first slice:
1. lock the course-level and weekly-plan YAML contracts
2. define machine-readable schema files from the YAML examples and the two Markdown schema docs
3. add cross-file validation tests
4. add one happy-path weekly module fixture and one happy-path SBRA blueprint fixture

Reason:
- this follows the repo priority order
- it establishes contracts before implementation
- it reduces downstream rework

## Review Checklist
- does the implementation keep data, generation, runtime, assessment, and UI separate?
- does the implementation support backward design rather than content-first design?
- is constructive alignment traceable from outcomes to evidence?
- does 1 week always map to exactly 1 module?
- do all module references resolve?
- does SBRA contain one correct answer per step?
- are distractors tied to real misconception types?
- can assessment results feed attainment analysis and CQI later?
- can the repo run on a new machine without machine-specific paths?
- are protected source-of-truth files unchanged?

## Integration Rule
No implementation should be integrated unless it:
- validates against locked contracts
- respects protected source-of-truth files
- preserves separation of concerns from `RULES.md`
- is portable across machines

## Immediate Next Task Options
If execution starts next, the recommended order is:
1. normalize the contract for course-level and weekly-plan YAML
2. create machine-readable schema files
3. add cross-file validators
4. add sample fixtures
5. build SBRA engine
6. build module builder

## Current Completion Snapshot
Planning and architecture are now close to complete.

Completed or effectively locked:
- implementation direction and module boundaries
- OBE / AUN-QA / CQI interpretation
- course and weekly-plan contract direction
- machine-readable schema baseline
- contract validation layer
- interactive module assembly baseline
- material library baseline
- SBRA blueprint contract, registry, validator, and scaffold helper
- week bundle contract and bundle integrity checks

Still open at the project level:
- richer content generation beyond structural placeholders
- runtime / learner state engine
- assessment execution engine
- persistence and analytics outputs
- CQI-ready reporting views
- frontend application
- export pipeline for future `มคอ.3` / `มคอ.5`
- new-course onboarding flow hardening

Practical interpretation:
- the contract-first foundation is established
- the remaining work is now mostly productization and operationalization rather than core architectural discovery

## Main Plan Closeout
The main plan should now be treated as complete enough for parallel implementation handoff.

Definition of "plan complete" for this repo:
- architecture is stable
- protected contracts are identified
- implementation phases are ordered
- module boundaries are explicit
- acceptance criteria exist at phase level
- safe delegation boundaries are known

That threshold is now met.

## Delivery Strategy While Codex Is Paused
While Codex is unavailable, parallel agents such as Claude Code should work only inside bounded implementation packages.

Rules for all delegated work:
- do not change architecture
- do not redesign schemas
- do not edit protected source-of-truth files
- do not merge work that changes cross-module contracts without human review
- prefer adding tests together with implementation
- keep outputs machine-portable and contract-driven

Codex review remains required before integrating:
- schema-affecting code
- cross-module orchestration changes
- assessment logic that changes meaning of scores
- analytics logic that changes evidence semantics

## Recommended Parallel Work Order
Best order for delegated work:

1. content enrichment layer
Reason:
- highest value gap in current system
- low risk to locked contracts if kept behind generators

2. learner runtime state engine
Reason:
- can consume existing bundle/module contracts
- should not need schema changes if scoped correctly

3. assessment execution engine
Reason:
- depends on runtime event and submission shape decisions
- still separable from frontend if contract-disciplined

4. analytics event model and CQI summaries
Reason:
- should be built after runtime and assessment outputs are clearer

5. frontend rendering shell
Reason:
- should consume stable contracts and services rather than invent them

## Parallelization Matrix
Can run in parallel safely:
- content enrichment
- frontend rendering shell
- analytics read-model prototypes
- authoring helpers and docs

Should not run in parallel without careful coordination:
- runtime state engine and assessment submission model
- analytics persistence model and runtime event schema
- any task that tries to redefine `interactive_module`, `sbra_blueprint`, or source YAML semantics

## Handoff Artifact
The operational task breakdown for Claude Code lives in:
- `CLAUDE_CODE_WORKPACKAGES.md`

That file should be used as the execution queue while keeping this document as the architectural source for sequencing and review.

## Plan Status
Main plan status: complete enough for execution and delegation.

What "plan complete" means here:
- architecture is locked at a practical level
- module boundaries are defined
- contracts are identified
- execution phases are sequenced
- delegation boundaries are defined
- acceptance criteria exist at phase level and work-package level

What is not "complete" yet:
- the product itself
- runtime behavior
- assessment execution
- analytics and CQI outputs
- frontend application

Short answer:
- `plan`: yes, complete enough
- `implementation`: not complete

## Remaining Project Work
The main remaining implementation work is:

1. enrich generated content
2. build learner runtime state
3. build assessment execution
4. build analytics and CQI summaries
5. build frontend rendering shell
6. harden authoring workflows
7. later add export paths for `มคอ.3` and `มคอ.5`

Practical interpretation:
- the difficult architecture/planning uncertainty is mostly behind us
- the remaining work is mostly execution inside the locked direction

## Unified Delegation Pack
This section replaces the separate Claude work-package file so that everything lives in this one document.

### Global Rules For Delegated Agents
Delegated agents may:
- implement within one assigned package
- add tests for that package
- refactor only inside the owned module
- add internal helper files
- improve docs related to the package

Delegated agents must not:
- change architecture
- redesign schemas
- modify protected files
- change source-of-truth semantics
- mix unrelated cleanup into the assigned package

Protected files and surfaces:
- `RULES.md`
- `main.md`
- canonical `course.yaml`
- canonical `weekly_plan.yaml`
- all files under `schemas/`

Current stable contracts to preserve:
- `course.schema.json`
- `weekly_plan.schema.json`
- `interactive_module.schema.json`
- `sbra_blueprint.schema.json`
- `sbra_blueprint_registry.schema.json`
- `content_manifest.schema.json`
- `week_bundle.schema.json`

Core invariant:
- implementation must adapt to contracts
- contracts must not be adapted to implementation

### Current Baseline For Delegation
Already implemented:
- contract validation
- module generation baseline
- material library baseline
- SBRA blueprint validation and registry
- SBRA scaffold helper
- week bundle generation and validation

Main remaining product gaps:
- richer generated content
- runtime state engine
- assessment execution
- analytics and CQI outputs
- frontend shell

### Package Selection Guidance
If only one package is assigned first, start with `WP-01`.

If multiple parallel sessions are available, recommended order is:
1. `WP-01`
2. `WP-02`
3. `WP-03`
4. `WP-04`
5. `WP-05`
6. `WP-06`

Safe parallel combinations:
- `WP-01` + `WP-05`
- `WP-01` + `WP-06`
- `WP-02` + `WP-05`

Avoid parallel execution without extra coordination:
- `WP-02` + `WP-03`
- `WP-03` + `WP-04`

## Work Packages

### WP-01 Content Block Enrichment
Restated objective:
- replace current structural placeholder `content_blocks` with richer generated instructional content while preserving the existing `interactive_module` contract

Module:
- content generation

Scope:
- improve generation logic behind `tools/build-interactive-module.js`
- derive richer intro/content/activity notes from weekly topics, strategy mappings, and linked materials
- keep output inside the current `interactive_module` schema

Acceptance criteria:
- generated `content_blocks` are more descriptive than simple topic echoes
- each week still validates against `interactive_module.schema.json`
- `learning_flow`, `block_refs`, and `activity_refs` remain valid
- no schema changes are introduced

Allowed files:
- `tools/build-interactive-module.js`
- `tools/build-week-bundle.js`
- `tests/interactive-module.test.js`
- `tests/week-bundle.test.js`
- helper files under `tools/` if needed

Forbidden changes:
- `schemas/interactive_module.schema.json`
- source YAML meaning
- SBRA blueprint schema

Suggested verification:
- `cmd /c npm.cmd run test:module`
- `cmd /c npm.cmd run test:bundle`
- `cmd /c npm.cmd run validate:contracts`

Integration notes:
- prioritize maintainable heuristics over clever prompt-like logic
- explain any non-obvious enrichment rule with brief comments only when needed

### WP-02 Learner Runtime State Engine
Restated objective:
- create a runtime state module that tracks weekly progress against the existing module contract

Module:
- learning engine

Scope:
- define a local runtime state model for section completion, activity attempts, and overall progress
- do not build UI
- do not implement grading semantics beyond storing attempt state

Acceptance criteria:
- runtime state can ingest one `interactive_module`
- required sections and required activities can be marked and queried
- attempt history can be stored per activity
- output is isolated from frontend concerns

Allowed files:
- new files under `tools/` or `src/` for runtime state
- new tests under `tests/`

Forbidden changes:
- all schema files
- source YAML files
- assessment meaning or score calculation rules

Suggested verification:
- add and run focused runtime tests
- keep existing tests green

Integration notes:
- define interfaces in plain data structures first
- avoid framework-specific state code

### WP-03 Assessment Execution Engine
Restated objective:
- implement contract-driven scoring logic for quiz and SBRA activity submissions

Module:
- assessment engine

Scope:
- accept submission-shaped inputs
- resolve rubric metadata from course-derived context
- support step-based SBRA scoring using existing rubric and blueprint data

Acceptance criteria:
- SBRA step-based scoring works against current sample blueprints
- quiz scoring path is structurally supported
- scoring result format is frontend-agnostic
- no schema change is required

Allowed files:
- new assessment engine files under `tools/` or `src/`
- tests under `tests/`
- non-schema docs if needed

Forbidden changes:
- rubric contract redesign
- changes to `schemas/`
- editing `calculus1_course.yaml` or `calculus1_weekly_plan.yaml` to make code easier

Suggested verification:
- add focused assessment tests
- run `cmd /c npm.cmd run test:sbra`
- run `cmd /c npm.cmd run test:bundle`

Integration notes:
- scoring output should be explainable and auditable
- preserve room for formative vs summative interpretation later

### WP-04 Analytics Event And CQI Summary Prototype
Restated objective:
- define a normalized event and summary layer that can support attainment and CQI outputs later

Module:
- data and analytics

Scope:
- propose and implement internal event shapes for completion, score, and reflection
- add a prototype aggregator for CLO-level summaries
- keep this as an internal implementation layer, not a schema redesign

Acceptance criteria:
- completion, score, and reflection can be aggregated into CLO-oriented summaries
- summaries reference existing CLO and activity identifiers
- output remains contract-aware and portable

Allowed files:
- new analytics files under `tools/` or `src/`
- tests under `tests/`

Forbidden changes:
- schema edits
- source YAML edits
- frontend coupling

Suggested verification:
- new analytics aggregation tests
- existing contract and module tests remain green

Integration notes:
- design around evidence semantics already present in the repo
- do not invent new academic meaning without an explicit note

### WP-05 Frontend Contract Reader Skeleton
Restated objective:
- build a minimal rendering shell that can read `interactive_module` or week bundle data without owning business logic

Module:
- frontend

Scope:
- create a very small renderer or component shell
- show sections, blocks, activities, and progress placeholders
- do not implement scoring logic
- do not implement schema changes

Acceptance criteria:
- renderer can display the structure of a generated week
- section and activity ordering come from contract data
- no business logic is embedded in the UI layer

Allowed files:
- new frontend files if a frontend folder is introduced
- view tests or snapshot tests if appropriate
- adapter utilities outside `schemas/`

Forbidden changes:
- scoring logic in UI
- schema redesign
- changes to source YAML files

Suggested verification:
- lightweight rendering test or local smoke check
- keep existing node-based test suite green

Integration notes:
- prefer plain, decoupled rendering over premature styling complexity

### WP-06 Authoring Workflow Hardening
Restated objective:
- improve repo-native authoring support for adding content, materials, and SBRA assets safely

Module:
- authoring workflow

Scope:
- strengthen helper tools and docs around adding materials and blueprints
- add checks that reduce human authoring mistakes
- keep changes outside locked schemas unless explicitly approved

Acceptance criteria:
- adding a new SBRA blueprint is easier and safer
- adding new materials is documented and validated clearly
- docs point to actual commands that work in this repo

Allowed files:
- `tools/new-sbra-blueprint.js`
- `tools/material-library.js`
- `SBRA+interactive material/ADDING_CONTENT.md`
- `SBRA+interactive material/ADDING_PROBLEMS.md`
- `SBRA+interactive material/sbra_blueprints/README.md`
- tests related to helpers

Forbidden changes:
- schema redesign
- source YAML redesign

Suggested verification:
- `cmd /c npm.cmd run test:authoring`
- `cmd /c npm.cmd run validate:materials`
- `cmd /c npm.cmd run validate:sbra`

Integration notes:
- optimize for hand-editable workflows, not heavy tooling

## Review Checklist For Delegated Work
Before integrating delegated output, confirm:
- objective was completed
- scope stayed inside the assigned package
- acceptance criteria were checked
- protected files were untouched
- schema files were untouched
- no unrelated edits were introduced
- tests were added or updated where appropriate
- existing relevant validations still pass

## Minimal Handoff Format
Delegated agents should report back in this shape:

1. objective completed
2. files changed
3. acceptance criteria status
4. commands run
5. risks or assumptions
6. anything needing Codex review before integration

## Re-Integration Queue
When Codex returns, review in this order:
1. `WP-01`
2. `WP-02`
3. `WP-03`
4. `WP-04`
5. `WP-05`
6. `WP-06`

Reason:
- this order preserves the contract-first dependency chain from generation to runtime to assessment to analytics to UI
