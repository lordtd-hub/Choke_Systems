# Adding Content

This folder stores supplementary learning materials that can be attached to weekly bundles.

Current source of truth:
- manifest file: [content/manifest.json](</C:/Users/User/Documents/Choke_Systems/SBRA+interactive material/content/manifest.json>)
- validator: [tools/material-library.js](/C:/Users/User/Documents/Choke_Systems/tools/material-library.js)
- authoring helper: [tools/new-material-entry.js](/C:/Users/User/Documents/Choke_Systems/tools/new-material-entry.js)

## Quick Workflow

1. Add the file under `SBRA+interactive material/content/` if the material is local.
2. Add the manifest entry with the helper.
3. Validate the manifest.
4. Rebuild or render a week bundle if you want to see the material in context.

## Recommended Commands

Add a local PDF:

```bash
node tools/new-material-entry.js ^
  --id diff-rules-cheatsheet ^
  --topic differentiation ^
  --type pdf ^
  --title "Derivative Rules Cheatsheet" ^
  --description "One-page reference for product, quotient, and chain rule." ^
  --path "differentiation/handouts/diff-rules.pdf" ^
  --addedDate 2026-04-19
```

Add an external link:

```bash
node tools/new-material-entry.js ^
  --id ftc-overview-video ^
  --topic integration ^
  --type link ^
  --title "FTC Overview Video" ^
  --description "Short external video for connecting accumulation and evaluation." ^
  --url "https://example.com/ftc-overview" ^
  --addedDate 2026-04-19 ^
  --tags integration,video
```

Add a note-only entry:

```bash
node tools/new-material-entry.js ^
  --id limits-intuition-note ^
  --topic limits ^
  --type note ^
  --title "Limits Intuition Note" ^
  --description "Short concept bridge before symbolic limit work." ^
  --body "Ask what value the graph approaches from both sides before computing anything." ^
  --addedDate 2026-04-19
```

Preview without writing:

```bash
node tools/new-material-entry.js --id sample-note --topic shared --type note --title "Sample" --description "Preview only." --body "Preview only." --dry-run
```

Replace an existing entry intentionally:

```bash
node tools/new-material-entry.js --id shared-study-routine --topic shared --type note --title "Shared Study Routine" --description "Updated version." --body "New body." --force
```

## Manifest Rules

- `id` must be unique kebab-case.
- `topic` must be one of `limits`, `continuity`, `differentiation`, `integration`, `shared`.
- `type` must be one of `pdf`, `md`, `html`, `image`, `video`, `link`, `note`.
- `description` must stay within 160 characters.
- `addedDate` must use `YYYY-MM-DD`.
- non-note entries must provide exactly one of `path` or `url`.
- note entries must provide `body` and must not provide `path` or `url`.

## Validation

Run:

```bash
cmd /c npm.cmd run validate:materials
cmd /c npm.cmd run test:materials
cmd /c npm.cmd run test:material-authoring
```

Notes:
- a missing local file path is currently reported as a warning, not an error
- the helper validates manifest shape before it finishes writing

## Good Practices

- keep file names ASCII and kebab-case when possible
- use `shared` only for materials that genuinely support multiple weeks
- prefer `link` for large external videos instead of storing them locally
- include short tags so future filtering stays useful

## Current Scope

This workflow only manages the manifest entry layer. It does not upload files, render markdown, or generate week-specific content automatically.
