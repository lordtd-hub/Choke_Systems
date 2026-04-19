# Adding SBRA Problems

This project no longer uses the old mission-bank structure. SBRA problems now live as standalone blueprint files under [sbra_blueprints](</C:/Users/User/Documents/Choke_Systems/SBRA+interactive material/sbra_blueprints>).

Current source of truth:
- registry: [sbra_blueprints/registry.json](</C:/Users/User/Documents/Choke_Systems/SBRA+interactive material/sbra_blueprints/registry.json>)
- schema validator: [tools/sbra-blueprints.js](/C:/Users/User/Documents/Choke_Systems/tools/sbra-blueprints.js)
- authoring helper: [tools/new-sbra-blueprint.js](/C:/Users/User/Documents/Choke_Systems/tools/new-sbra-blueprint.js)

## Current Model

Each SBRA activity is connected by `activity_id` through the registry.

The workflow is:
1. scaffold a new blueprint file
2. fill in the real problem, steps, misconceptions, and solution
3. validate the registry and blueprints
4. rebuild a week bundle to confirm the blueprint attaches to the right `ACT-SBRA` activity

## Scaffold Command

```bash
node tools/new-sbra-blueprint.js W8-A1 sbra_related_rates_w8 differentiation related_rates intermediate
```

Preview without writing:

```bash
node tools/new-sbra-blueprint.js W8-A1 sbra_related_rates_w8 differentiation related_rates intermediate --dry-run
```

Replace an existing scaffold intentionally:

```bash
node tools/new-sbra-blueprint.js W8-A1 sbra_related_rates_w8 differentiation related_rates intermediate --force
```

## Required Inputs

- `activity_id`: must match the weekly activity you want to support, for example `W8-A1`
- `blueprint_id`: unique machine-readable id, for example `sbra_related_rates_w8`
- `topic`: use the course topic family, for example `limits`, `continuity`, `differentiation`, `integration`
- `type`: short pattern label such as `continuity_check`, `derivative_rules`, `related_rates`
- `difficulty`: optional, defaults to `foundational`

## What The Scaffold Creates

- a new YAML file in `sbra_blueprints/`
- a registry entry that maps `activity_id -> blueprint_id -> file`
- placeholder `TODO` text for:
  - problem statement
  - strategy summary
  - three reasoning steps
  - misconception map
  - worked solution

## Authoring Rules

- keep one blueprint per SBRA activity unless there is a strong reason to bundle several together
- make distractors plausible, not obviously wrong
- each step should represent one reasoning move, not several mixed together
- the explanation should justify why the correct option is correct
- keep the strategy aligned with the actual CLO and weekly activity intent

## Validation

Run:

```bash
cmd /c npm.cmd run validate:sbra
cmd /c npm.cmd run test:sbra
cmd /c npm.cmd run test:authoring
```

To confirm bundle integration for an SBRA week:

```bash
node tools/build-week-bundle.js calculus1_course.yaml calculus1_weekly_plan.yaml 3
```

## Integration Notes

- the helper does not edit `weekly_plan.yaml`
- the bundle layer attaches blueprints by matching `activity_id`
- if an interactive module includes an SBRA activity, the corresponding week bundle should include exactly one matching `sbra_payload`

## Common Mistakes

- using an `activity_id` that does not exist in the weekly plan
- reusing an existing `blueprint_id` for a different activity
- leaving `TODO` placeholders in a blueprint that is supposed to be production-ready
- using a weak distractor that makes the answer obvious
