# RULES.md

## Core Philosophy
- structure > prose
- contract > implementation
- clarity > flexibility

## Language
- English = logic/spec
- Thai = student-facing content

## Architecture Rules
Separate:
- data (YAML)
- generation (AI)
- runtime (learning engine)
- assessment
- UI

Do NOT couple:
- UI with scoring
- YAML with rendering
- AI with frontend directly

## Source of Truth
- course.yaml
- weekly_plan.yaml
- AGENTS.md
- RULES.md
- main.md

Implementation must follow these.

## Interactive Module Rule
1 week = 1 module

Module must include:
- content
- activities
- SBRA
- quiz
- reflection
- scoring hooks
- evidence hooks

## SBRA Rule
Input:
- problem

Output:
- steps
- options
- distractors
- explanations
- solution

No UI rendering inside SBRA engine.

## Portability Rule
- no machine-specific paths
- use .env.example
- repo must run on new machine

## Naming
- snake_case for data
- consistent terms only
