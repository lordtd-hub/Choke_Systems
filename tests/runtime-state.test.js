'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const YAML = require('yaml');
const { buildInteractiveModule } = require('../tools/build-interactive-module');
const {
  createRuntimeState,
  getRuntimeSummary,
  markActivityCompleted,
  markSectionCompleted,
  recordActivityAttempt
} = require('../tools/runtime-state');

function readYaml(filePath) {
  return YAML.parse(fs.readFileSync(filePath, 'utf8'));
}

const course = readYaml(path.join(__dirname, '..', 'calculus1_course.yaml'));
const weeklyPlan = readYaml(path.join(__dirname, '..', 'calculus1_weekly_plan.yaml'));
const moduleWeek3 = buildInteractiveModule(course, weeklyPlan, 3);

{
  const runtimeState = createRuntimeState(moduleWeek3, { now: '2026-04-19T10:00:00.000Z' });
  const summary = getRuntimeSummary(runtimeState);

  assert.equal(summary.module_id, 'SMAC001_w03');
  assert.equal(summary.status, 'not_started');
  assert.equal(summary.progress_percent, 0);
  assert.equal(summary.required_sections_total, 5);
  assert.equal(summary.required_activities_total, 3);
  assert.equal(runtimeState.runtime_state.sections.length, 5);
  assert.equal(runtimeState.runtime_state.activities.length, 3);
}

{
  const runtimeState = createRuntimeState(moduleWeek3, { now: '2026-04-19T10:00:00.000Z' });
  const afterSection = markSectionCompleted(runtimeState, 'SMAC001_w03_intro_section', {
    completedAt: '2026-04-19T10:05:00.000Z'
  });
  const summary = getRuntimeSummary(afterSection);

  assert.equal(summary.status, 'in_progress');
  assert.equal(summary.required_sections_completed, 1);
  assert.equal(summary.required_activities_completed, 0);
  assert.equal(summary.progress_percent, 13);
}

{
  const runtimeState = createRuntimeState(moduleWeek3, { now: '2026-04-19T10:00:00.000Z' });
  const afterAttempt = recordActivityAttempt(runtimeState, 'W3-A1', {
    now: '2026-04-19T10:10:00.000Z',
    response: {
      selected_options: ['opt_factor', 'opt_x_plus_1']
    },
    notes: 'First guided attempt',
    evidence: ['activity_artifact']
  });

  assert.equal(afterAttempt.runtime_state.activities[0].status, 'in_progress');
  assert.equal(afterAttempt.runtime_state.activities[0].latest_attempt_id, 'W3-A1_attempt_01');
  assert.equal(afterAttempt.runtime_state.activities[0].attempts.length, 1);
  assert.deepEqual(afterAttempt.runtime_state.activities[0].attempts[0].evidence, ['activity_artifact']);
}

{
  let runtimeState = createRuntimeState(moduleWeek3, { now: '2026-04-19T10:00:00.000Z' });
  const requiredSectionIds = runtimeState.runtime_state.sections.filter((section) => section.required).map((section) => section.section_id);
  const requiredActivityIds = runtimeState.runtime_state.activities.filter((activity) => activity.required).map((activity) => activity.activity_id);

  requiredSectionIds.forEach((sectionId, index) => {
    runtimeState = markSectionCompleted(runtimeState, sectionId, {
      completedAt: `2026-04-19T10:${String(index + 1).padStart(2, '0')}:00.000Z`
    });
  });

  requiredActivityIds.forEach((activityId, index) => {
    runtimeState = recordActivityAttempt(runtimeState, activityId, {
      now: `2026-04-19T11:${String(index + 1).padStart(2, '0')}:00.000Z`,
      markComplete: true,
      response: {
        completed: true
      }
    });
  });

  const summary = getRuntimeSummary(runtimeState);

  assert.equal(summary.status, 'completed');
  assert.equal(summary.progress_percent, 100);
  assert.equal(summary.required_sections_completed, summary.required_sections_total);
  assert.equal(summary.required_activities_completed, summary.required_activities_total);
  assert.ok(runtimeState.runtime_state.completed_at, 'completed runtime state should record completed_at');
}

{
  const runtimeState = createRuntimeState(moduleWeek3, { now: '2026-04-19T10:00:00.000Z' });
  const afterCompletion = markActivityCompleted(runtimeState, 'W3-A2', {
    completedAt: '2026-04-19T10:20:00.000Z',
    attemptId: 'manual_quiz_submission'
  });

  assert.equal(afterCompletion.runtime_state.activities[1].status, 'completed');
  assert.equal(afterCompletion.runtime_state.activities[1].latest_attempt_id, 'manual_quiz_submission');
}

console.log('runtime state tests passed');
