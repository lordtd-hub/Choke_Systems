'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const {
  DEFAULT_MANIFEST_PATH,
  inferMaterialTopicsForWeek,
  loadManifest,
  resolveWeeklyMaterials,
  validateManifest
} = require('../tools/material-library');
const { buildWeekBundle } = require('../tools/build-week-bundle');
const YAML = require('yaml');
const fs = require('node:fs');

function readYaml(filePath) {
  return YAML.parse(fs.readFileSync(filePath, 'utf8'));
}

const manifest = loadManifest(DEFAULT_MANIFEST_PATH);
const course = readYaml(path.join(__dirname, '..', 'calculus1_course.yaml'));
const weeklyPlan = readYaml(path.join(__dirname, '..', 'calculus1_weekly_plan.yaml'));

{
  const issues = validateManifest(manifest, DEFAULT_MANIFEST_PATH);
  assert.equal(
    issues.filter((issue) => issue.severity === 'error').length,
    0,
    'sample manifest should pass schema validation'
  );
}

{
  const week1 = weeklyPlan.weekly_plan.weekly_units.find((unit) => unit.week === 1);
  const topics = inferMaterialTopicsForWeek(week1);
  assert.ok(topics.includes('limits'));
  assert.ok(topics.includes('continuity'));
  assert.ok(topics.includes('shared'));
}

{
  const week1 = weeklyPlan.weekly_plan.weekly_units.find((unit) => unit.week === 1);
  const materials = resolveWeeklyMaterials(week1, manifest);
  assert.ok(materials.some((item) => item.id === 'limits-intuition-note'));
  assert.ok(materials.some((item) => item.id === 'shared-study-routine'));
}

{
  const bundle = buildWeekBundle(course, weeklyPlan, 1, manifest);
  assert.equal(bundle.interactive_module.module_id, 'SMAC001_w01');
  assert.ok(Array.isArray(bundle.supplementary_materials));
  assert.ok(bundle.supplementary_materials.length >= 2);
}

console.log('material library tests passed');
