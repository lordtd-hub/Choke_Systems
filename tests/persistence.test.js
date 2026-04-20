'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const YAML = require('yaml');
const { loadManifest } = require('../tools/material-library');
const { validateRegistryAndBlueprints, DEFAULT_REGISTRY_PATH } = require('../tools/sbra-blueprints');
const { buildWeekBundle } = require('../tools/build-week-bundle');
const { createRuntimeState, markActivityCompleted, markSectionCompleted } = require('../tools/runtime-state');
const { scoreActivitySubmission } = require('../tools/assessment-engine');
const { createAnalyticsEvents } = require('../tools/analytics');
const { buildCqiReport } = require('../tools/cqi-report');
const {
  getArtifactDirectory,
  loadLearningArtifacts,
  saveLearningArtifacts
} = require('../tools/persistence');

function readYaml(filePath) {
  return YAML.parse(fs.readFileSync(filePath, 'utf8'));
}

const tempParent = path.join(__dirname, '.tmp');
fs.mkdirSync(tempParent, { recursive: true });
const tempRoot = fs.mkdtempSync(path.join(tempParent, 'persistence-'));

const course = readYaml(path.join(__dirname, '..', 'calculus1_course.yaml'));
const weeklyPlan = readYaml(path.join(__dirname, '..', 'calculus1_weekly_plan.yaml'));
const manifest = loadManifest();
const { blueprintsByActivityId } = validateRegistryAndBlueprints(DEFAULT_REGISTRY_PATH);

try {
  const bundle = buildWeekBundle(course, weeklyPlan, 3, manifest, blueprintsByActivityId);
  let runtimeState = createRuntimeState(bundle, { now: '2026-04-20T12:00:00.000Z' });

  runtimeState = markSectionCompleted(runtimeState, 'SMAC001_w03_intro_section', {
    completedAt: '2026-04-20T12:05:00.000Z'
  });
  runtimeState = markSectionCompleted(runtimeState, 'SMAC001_w03_content_section', {
    completedAt: '2026-04-20T12:06:00.000Z'
  });
  runtimeState = markActivityCompleted(runtimeState, 'W3-A1', {
    completedAt: '2026-04-20T12:10:00.000Z',
    attemptId: 'persisted_sbra_attempt'
  });

  const assessmentResults = [
    scoreActivitySubmission(bundle, 'W3-A1', {
      steps: [
        { step_no: 1, selected_option_id: 'opt_factor', attempt_count: 1 },
        { step_no: 2, selected_option_id: 'opt_x_plus_1', attempt_count: 1 },
        { step_no: 3, selected_option_id: 'opt_limit_vs_value', attempt_count: 1 }
      ]
    })
  ];

  const analyticsEvents = createAnalyticsEvents({
    bundle,
    runtimeState,
    assessmentResults,
    reflections: [
      {
        activity_id: 'W3-A3',
        timestamp: '2026-04-20T12:15:00.000Z',
        text: 'Saved reflection event for persistence coverage.',
        evidence_tags: ['reflection', 'persistence-test']
      }
    ]
  });

  const cqiReport = buildCqiReport({
    course,
    bundle,
    runtimeState,
    assessmentResults,
    reflections: [
      {
        activity_id: 'W3-A3',
        timestamp: '2026-04-20T12:15:00.000Z',
        text: 'Saved reflection event for persistence coverage.',
        evidence_tags: ['reflection', 'persistence-test']
      }
    ],
    generatedAt: runtimeState.runtime_state.updated_at
  });

  const saved = saveLearningArtifacts({
    runtimeState,
    assessmentResults,
    analyticsEvents,
    cqiReport,
    storageRoot: tempRoot
  });

  assert.equal(saved.context.course_id, 'SMAC001');
  assert.equal(saved.context.module_id, 'SMAC001_w03');
  assert.equal(saved.context.week, 3);
  assert.equal(
    saved.directory,
    getArtifactDirectory({ course_id: 'SMAC001', module_id: 'SMAC001_w03', week: 3 }, tempRoot)
  );
  assert.equal(fs.existsSync(saved.runtime_state), true);
  assert.equal(fs.existsSync(saved.assessment_results), true);
  assert.equal(fs.existsSync(saved.analytics_events), true);
  assert.equal(fs.existsSync(saved.cqi_report), true);

  const loaded = loadLearningArtifacts(
    { course_id: 'SMAC001', module_id: 'SMAC001_w03', week: 3 },
    { storageRoot: tempRoot }
  );

  assert.deepEqual(loaded.runtime_state, runtimeState);
  assert.deepEqual(loaded.assessment_results.assessment_results, assessmentResults);
  assert.deepEqual(loaded.analytics_events.events, analyticsEvents);
  assert.deepEqual(loaded.cqi_report, cqiReport);
}
finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

console.log('persistence tests passed');
