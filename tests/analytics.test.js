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
const { buildCqiSignals, createAnalyticsEvents, summarizeCloEvents } = require('../tools/analytics');

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

  bundle.interactive_module.progress_hooks.required_sections.forEach((sectionId, index) => {
    runtimeState = markSectionCompleted(runtimeState, sectionId, {
      completedAt: `2026-04-19T10:${String(index + 1).padStart(2, '0')}:00.000Z`
    });
  });

  runtimeState = markActivityCompleted(runtimeState, 'W3-A1', {
    completedAt: '2026-04-19T11:00:00.000Z',
    attemptId: 'sbra_submission_01'
  });
  runtimeState = markActivityCompleted(runtimeState, 'W3-A2', {
    completedAt: '2026-04-19T11:05:00.000Z',
    attemptId: 'quiz_submission_01'
  });
  runtimeState = markActivityCompleted(runtimeState, 'W3-A3', {
    completedAt: '2026-04-19T11:10:00.000Z'
  });

  const assessmentResults = [
    scoreActivitySubmission(bundle, 'W3-A1', {
      steps: [
        { step_no: 1, selected_option_id: 'opt_factor', attempt_count: 1 },
        { step_no: 2, selected_option_id: 'opt_x_plus_1', attempt_count: 2 },
        { step_no: 3, selected_option_id: 'opt_limit_vs_value', attempt_count: 1 }
      ]
    }),
    scoreActivitySubmission(bundle, 'W3-A2', {
      items: [
        { item_id: 'Q1', learner_answer: 'A', correct_answer: 'A', max_points: 1 },
        { item_id: 'Q2', learner_answer: 'B', correct_answer: 'C', max_points: 1 },
        { item_id: 'Q3', is_correct: true, max_points: 2 }
      ]
    })
  ];

  const events = createAnalyticsEvents({
    bundle,
    runtimeState,
    assessmentResults,
    reflections: [
      {
        activity_id: 'W3-A3',
        timestamp: '2026-04-19T11:15:00.000Z',
        text: 'I still confuse one-sided limits with continuity checks.',
        evidence_tags: ['metacognition', 'error_awareness']
      }
    ]
  });

  const cloSummaries = summarizeCloEvents(course, events);
  const clo1Summary = cloSummaries.find((summary) => summary.clo_id === 'CLO1');
  const clo5Summary = cloSummaries.find((summary) => summary.clo_id === 'CLO5');

  assert.ok(events.some((event) => event.event_type === 'completion' && event.source_id === 'W3-A1'));
  assert.ok(events.some((event) => event.event_type === 'score' && event.source_id === 'W3-A2'));
  assert.ok(events.some((event) => event.event_type === 'reflection' && event.source_id === 'W3-A3'));

  assert.equal(clo1Summary.completion_event_count, 3);
  assert.equal(clo1Summary.score_event_count, 2);
  assert.equal(clo1Summary.reflection_event_count, 1);
  assert.equal(clo1Summary.average_score_percent, 80.84);
  assert.equal(clo1Summary.attained, true);
  assert.ok(clo1Summary.evidence_types_seen.includes('completion'));
  assert.ok(clo1Summary.evidence_types_seen.includes('score'));

  assert.equal(clo5Summary.completion_event_count, 2);
  assert.equal(clo5Summary.score_event_count, 1);
  assert.equal(clo5Summary.reflection_event_count, 1);
  assert.equal(clo5Summary.average_score_percent, 86.67);
  assert.equal(clo5Summary.attained, true);
}

{
  const sparseSummaries = summarizeCloEvents(course, []);
  const signals = buildCqiSignals(sparseSummaries);
  const clo1Signal = signals.find((signal) => signal.clo_id === 'CLO1');

  assert.equal(clo1Signal.status, 'action_needed');
  assert.ok(clo1Signal.issues.includes('missing_direct_score_evidence'));
  assert.ok(clo1Signal.issues.includes('missing_completion_evidence'));
  assert.ok(clo1Signal.issues.includes('missing_reflection_evidence'));
}

console.log('analytics tests passed');
