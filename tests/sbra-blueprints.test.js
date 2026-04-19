'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const YAML = require('yaml');
const fs = require('node:fs');
const { buildWeekBundle } = require('../tools/build-week-bundle');
const { loadManifest } = require('../tools/material-library');
const { DEFAULT_REGISTRY_PATH, resolveBlueprintForActivity, validateRegistryAndBlueprints } = require('../tools/sbra-blueprints');

function readYaml(filePath) {
  return YAML.parse(fs.readFileSync(filePath, 'utf8'));
}

const course = readYaml(path.join(__dirname, '..', 'calculus1_course.yaml'));
const weeklyPlan = readYaml(path.join(__dirname, '..', 'calculus1_weekly_plan.yaml'));
const manifest = loadManifest();

{
  const { issues } = validateRegistryAndBlueprints(DEFAULT_REGISTRY_PATH);
  assert.equal(
    issues.filter((issue) => issue.severity === 'error').length,
    0,
    'sample SBRA blueprints should validate cleanly'
  );
}

{
  const blueprintDoc = resolveBlueprintForActivity('W3-A1', DEFAULT_REGISTRY_PATH);
  assert.ok(blueprintDoc, 'W3-A1 should resolve to a blueprint');
  assert.equal(blueprintDoc.sbra_blueprint.blueprint_id, 'sbra_continuity_check_w3');
}

{
  const { blueprintsByActivityId } = validateRegistryAndBlueprints(DEFAULT_REGISTRY_PATH);
  const bundle = buildWeekBundle(course, weeklyPlan, 3, manifest, blueprintsByActivityId);
  assert.ok(Array.isArray(bundle.sbra_payloads));
  assert.equal(bundle.sbra_payloads.length, 1);
  assert.equal(bundle.sbra_payloads[0].activity_id, 'W3-A1');
  assert.equal(bundle.sbra_payloads[0].blueprint.blueprint_id, 'sbra_continuity_check_w3');
  assert.equal(bundle.sbra_payloads[0].rubric.rubric_id, 'RUBRIC-SBRA');
  assert.equal(bundle.sbra_payloads[0].rubric.scoring_model.type, 'step_based');
  assert.equal(bundle.sbra_payloads[0].rubric.scoring_model.pass_threshold_percent, 70);
}

{
  const { blueprintsByActivityId } = validateRegistryAndBlueprints(DEFAULT_REGISTRY_PATH);
  const bundle = buildWeekBundle(course, weeklyPlan, 14, manifest, blueprintsByActivityId);
  assert.equal(bundle.sbra_payloads.length, 1);
  assert.equal(bundle.sbra_payloads[0].activity_id, 'W14-A1');
  assert.equal(bundle.sbra_payloads[0].blueprint.blueprint_id, 'sbra_mixed_review_w14');
}

console.log('sbra blueprint tests passed');
