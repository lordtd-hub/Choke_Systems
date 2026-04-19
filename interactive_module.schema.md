# interactive_module.schema.md

## Purpose
Define weekly module structure

## Structure
```yaml
interactive_module:
  module_id: ""
  course_id: ""
  week: 1
  title: ""

  clo_focus:
    primary: ""
    secondary: []

  learning_flow:
    - section_id: ""
      section_type: "intro | content | example | practice | sbra | quiz | reflection"
      block_refs: []
      activity_refs: []

  content_blocks:
    - block_id: ""
      type: "text | example | note"
      content: ""
      clo_link: ""

  activities:
    - activity_id: ""
      type: "quiz | sbra | practice"
      clo_mapping:
        primary: ""
        secondary: []

  progress_hooks:
    required_sections: []
    required_activities: []

  assessment_hooks:
    graded_activities: []

  evidence_hooks:
    types:
      - completion
      - score
      - reflection
```

## Rules
- 1 module = 1 week
- all refs must exist
- no hardcoded UI logic
