# SBRA Blueprints

Store future SBRA blueprint source files here.

Recommended direction:
- one file per problem or one file per weekly set
- machine-readable YAML or JSON
- each blueprint should align with [sbra_blueprint.schema.md](/C:/Users/User/Documents/Choke_Systems/sbra_blueprint.schema.md)

This folder is reserved for the next integration slice:
- validate SBRA blueprints
- attach them to `ACT-SBRA` weekly activities
- generate richer SBRA activity payloads for interactive modules

Authoring helper:
- scaffold a new starter blueprint and registry entry with `node tools/new-sbra-blueprint.js <activity_id> <blueprint_id> <topic> <type> [difficulty] [slug]`
- preview without writing by adding `--dry-run`
- replace an existing entry intentionally by adding `--force`

Recommended workflow:
- run the scaffold helper
- replace all `TODO` placeholders in the generated YAML
- run `cmd /c npm.cmd run validate:sbra`
- run `cmd /c npm.cmd run test:authoring`
