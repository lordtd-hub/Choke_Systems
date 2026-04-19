'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const YAML = require('yaml');
const { createBlueprintScaffold } = require('../tools/new-sbra-blueprint');
const { validateRegistryAndBlueprints } = require('../tools/sbra-blueprints');

const tempParent = path.join(__dirname, '.tmp');
fs.mkdirSync(tempParent, { recursive: true });
const tempRoot = fs.mkdtempSync(path.join(tempParent, 'sbra-authoring-'));
const blueprintDir = path.join(tempRoot, 'sbra_blueprints');
const registryPath = path.join(blueprintDir, 'registry.json');

fs.mkdirSync(blueprintDir, { recursive: true });
fs.writeFileSync(
  registryPath,
  `${JSON.stringify({ registry_version: 'sbra-blueprint-registry-v1', items: [] }, null, 2)}\n`,
  'utf8'
);

try {
  {
    const preview = createBlueprintScaffold({
      activityId: 'W8-A1',
      blueprintId: 'sbra_related_rates_w8',
      topic: 'differentiation',
      type: 'related_rates',
      difficulty: 'intermediate',
      blueprintDir,
      registryPath,
      dryRun: true
    });

    assert.equal(preview.dry_run, true);
    assert.equal(preview.file, 'w8-a1-related-rates.yaml');
    assert.equal(YAML.parse(preview.preview).sbra_blueprint.blueprint_id, 'sbra_related_rates_w8');
    assert.equal(fs.existsSync(path.join(blueprintDir, preview.file)), false, 'dry-run should not write the blueprint file');
  }

  {
    const created = createBlueprintScaffold({
      activityId: 'W8-A1',
      blueprintId: 'sbra_related_rates_w8',
      topic: 'differentiation',
      type: 'related_rates',
      difficulty: 'intermediate',
      blueprintDir,
      registryPath
    });

    assert.equal(created.dry_run, false);
    assert.equal(fs.existsSync(created.blueprint_path), true, 'scaffold should write the blueprint file');

    const { issues, registry } = validateRegistryAndBlueprints(registryPath);
    assert.equal(
      issues.filter((issue) => issue.severity === 'error').length,
      0,
      'scaffolded blueprint should validate cleanly'
    );
    assert.equal(registry.items.length, 1);
    assert.equal(registry.items[0].activity_id, 'W8-A1');
    assert.equal(registry.items[0].blueprint_id, 'sbra_related_rates_w8');
  }

  {
    assert.throws(
      () =>
        createBlueprintScaffold({
          activityId: 'W8-A1',
          blueprintId: 'sbra_related_rates_duplicate',
          topic: 'differentiation',
          type: 'related_rates',
          blueprintDir,
          registryPath
        }),
      /already contains activity_id "W8-A1"/
    );
  }
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

console.log('sbra authoring tests passed');
