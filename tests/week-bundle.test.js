'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const YAML = require('yaml');
const { loadManifest } = require('../tools/material-library');
const { DEFAULT_REGISTRY_PATH, validateRegistryAndBlueprints } = require('../tools/sbra-blueprints');
const { buildWeekBundle, validateWeekBundle, validateWeekBundleIntegrity } = require('../tools/build-week-bundle');

function readYaml(filePath) {
  return YAML.parse(fs.readFileSync(filePath, 'utf8'));
}

const course = readYaml(path.join(__dirname, '..', 'calculus1_course.yaml'));
const weeklyPlan = readYaml(path.join(__dirname, '..', 'calculus1_weekly_plan.yaml'));
const manifest = loadManifest();
const { blueprintsByActivityId } = validateRegistryAndBlueprints(DEFAULT_REGISTRY_PATH);

{
  const bundle = buildWeekBundle(course, weeklyPlan, 1, manifest, blueprintsByActivityId);
  const schemaResult = validateWeekBundle(bundle);
  const integrityErrors = validateWeekBundleIntegrity(bundle);

  assert.equal(schemaResult.isValid, true, 'week 1 bundle should satisfy the week bundle schema');
  assert.deepEqual(schemaResult.errors, [], 'week 1 bundle should not produce schema errors');
  assert.deepEqual(integrityErrors, [], 'week 1 bundle should satisfy integrity rules');
  assert.equal(bundle.sbra_payloads.length, 0, 'week 1 should not include SBRA payloads');
}

{
  const bundle = buildWeekBundle(course, weeklyPlan, 3, manifest, blueprintsByActivityId);
  const schemaResult = validateWeekBundle(bundle);
  const integrityErrors = validateWeekBundleIntegrity(bundle);

  assert.equal(schemaResult.isValid, true, 'week 3 bundle should satisfy the week bundle schema');
  assert.deepEqual(schemaResult.errors, [], 'week 3 bundle should not produce schema errors');
  assert.deepEqual(integrityErrors, [], 'week 3 bundle should satisfy integrity rules');
  assert.equal(bundle.interactive_module.module_id, 'SMAC001_w03');
  assert.equal(bundle.sbra_payloads.length, 1);
  assert.equal(bundle.sbra_payloads[0].activity_id, 'W3-A1');
  assert.equal(bundle.sbra_payloads[0].blueprint.blueprint_id, 'sbra_continuity_check_w3');
  assert.equal(bundle.sbra_payloads[0].rubric.rubric_id, 'RUBRIC-SBRA');
}

console.log('week bundle tests passed');
