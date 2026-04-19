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
