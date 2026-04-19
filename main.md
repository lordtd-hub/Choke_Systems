# main.md

## Objective
Build a modular AI-assisted learning platform using YAML + interactive modules + SBRA.

## System Flow
course.yaml
→ weekly_plan.yaml
→ content generation
→ module builder
→ runtime
→ assessment
→ analytics

## Core Modules

### 1. Spec Core
- course.yaml
- weekly_plan.yaml
- schemas

### 2. Content Generation
- generate lesson content
- generate quiz
- generate SBRA blueprint

### 3. Interactive Module Builder
- assemble weekly module
- bind content to template
- output structured module

### 4. SBRA Design Engine
- problem → reasoning steps
- generate distractors
- generate explanation

### 5. Learning Engine
- progression
- state
- retry/hint

### 6. Assessment Engine
- scoring
- rubric
- pass/fail

### 7. Data & Analytics
- store progress
- aggregate results
- CLO metrics

### 8. Frontend
- render module
- render activities
- show progress

## Key Constraints
- data separate from code
- generation separate from runtime
- assessment separate from UI
- support multi-course

## Priority
1. schema
2. module builder
3. SBRA engine
4. runtime
