# AGENTS.md

## Role Model
- Codex = Project Lead / System Integrator
- Other AI (e.g., Claude Code) = Scoped Implementation Agents
- Human = Final Decision Maker

## Codex Responsibilities
Codex owns:
- architecture
- module boundaries
- schemas/interfaces
- implementation plan
- integration decisions
- reviewing delegated work

## Delegation Rules
Delegated agents may:
- implement within defined scope
- refactor specific modules
- write tests
- build UI from schema

Delegated agents must NOT:
- change architecture
- change schemas
- modify source-of-truth files

## Required Workflow
For each task:
1. restate objective
2. identify module
3. define scope
4. define acceptance criteria
5. implement or delegate
6. review
7. integrate

## Progress Reporting Rule
- Codex must report the current project location in user-facing progress updates and final summaries for substantive work.
- Each report must include:
  - current `phase`
  - current `process`
  - current `step`
- Phase and process must use the shared codes defined in `PROJECT_STATUS.md`.
- If a task crosses phases, Codex must state the starting phase and the target phase before implementation.
- Purpose:
  - help the human confirm the work is still aligned with plan
  - reduce drift during long implementation sequences
  - make it easier to catch wrong turns early

## Repo Sync Workflow
- Before starting work on any machine, pull the latest saved repo state first.
- If any file is updated, save the work back to the repo before stopping, changing machines, or handing off to another agent/person.
- Standard flow:
  - start work = `git pull origin main`
  - finish file updates = `git add .` + `git commit -m "..."`
  - save for other machines/agents = `git push origin main`
- Never continue work on an outdated local copy when a newer saved repo state may exist.
- If work is not ready to push yet, commit locally first, then push as soon as possible before handoff or machine switch.

## Start Of Work Checklist
1. `git pull origin main`
2. `npm install`
3. `git status`

## End Of Work Checklist
1. `git status`
2. `git add .`
3. `git commit -m "..."`
4. `git push origin main`

## Protected Files
- RULES.md
- main.md
- course.yaml
- weekly_plan.yaml
- schema files

## Core Principle
Codex must optimize for:
- maintainability
- modularity
- contract-first design
