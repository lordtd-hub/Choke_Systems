# sbra_blueprint.schema.md

## Purpose
Define reasoning blueprint from a problem

## Structure
```yaml
sbra_blueprint:
  blueprint_id: ""
  problem: ""

  classification:
    topic: ""
    type: ""
    difficulty: ""

  strategy:
    summary: ""
    methods: []

  steps:
    - step_no: 1
      goal: ""
      prompt: ""
      options:
        - option_id: ""
          value: ""
          is_correct: false
          error_type: ""
      correct_option_id: ""
      explanation: ""

  full_solution:
    - ""

  misconception_map:
    - error_type: ""
      description: ""

  scoring:
    step_based: true
```

## Rules
- each step must have 1 correct answer
- distractors must reflect real mistakes
- no UI in this layer
