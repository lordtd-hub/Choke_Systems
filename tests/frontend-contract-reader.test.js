'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const YAML = require('yaml');
const { loadManifest } = require('../tools/material-library');
const { validateRegistryAndBlueprints, DEFAULT_REGISTRY_PATH } = require('../tools/sbra-blueprints');
const { buildWeekBundle } = require('../tools/build-week-bundle');
const { createRuntimeState, getRuntimeSummary, markActivityCompleted, markSectionCompleted } = require('../tools/runtime-state');
const { renderWeekBundlePage } = require('../frontend/week-bundle-view');

function readYaml(filePath) {
  return YAML.parse(fs.readFileSync(filePath, 'utf8'));
}

const course = readYaml(path.join(__dirname, '..', 'calculus1_course.yaml'));
const weeklyPlan = readYaml(path.join(__dirname, '..', 'calculus1_weekly_plan.yaml'));
const manifest = loadManifest();
const { blueprintsByActivityId } = validateRegistryAndBlueprints(DEFAULT_REGISTRY_PATH);

{
  const bundle = buildWeekBundle(course, weeklyPlan, 3, manifest, blueprintsByActivityId);
  let runtimeState = createRuntimeState(bundle, { now: '2026-04-19T10:00:00.000Z' });
  runtimeState = markSectionCompleted(runtimeState, 'SMAC001_w03_intro_section', {
    completedAt: '2026-04-19T10:05:00.000Z'
  });
  runtimeState = markActivityCompleted(runtimeState, 'W3-A1', {
    completedAt: '2026-04-19T10:10:00.000Z',
    attemptId: 'preview_attempt'
  });
  const runtimeSummary = getRuntimeSummary(runtimeState);
  const html = renderWeekBundlePage(bundle, runtimeSummary);

  assert.match(html, /Continuity and Algebraic Techniques for Limits/);
  assert.match(html, /Module SMAC001_w03 for course SMAC001/);
  assert.match(html, /Progress/);
  assert.match(html, /25%/);
  assert.match(html, /SBRA Worksheet: Continuity Check/);
  assert.match(html, /Limit Intuition Note/);
  assert.match(html, /sbra_continuity_check_w3/);

  const introIndex = html.indexOf('SMAC001_w03_intro_section');
  const contentIndex = html.indexOf('SMAC001_w03_content_section');
  const sbraIndex = html.indexOf('SMAC001_w03_sbra_01');
  assert.ok(introIndex >= 0 && contentIndex > introIndex && sbraIndex > contentIndex, 'section order should follow bundle contract order');
}

{
  const bundle = buildWeekBundle(course, weeklyPlan, 1, manifest, blueprintsByActivityId);
  const html = renderWeekBundlePage(bundle, getRuntimeSummary(createRuntimeState(bundle, { now: '2026-04-19T10:00:00.000Z' })));

  assert.match(html, /No SBRA payloads for this week/);
  assert.match(html, /Diagnostic Check: Function Readiness/);
}

console.log('frontend contract reader tests passed');
