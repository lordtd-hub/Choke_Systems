'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const YAML = require('yaml');
const { loadManifest } = require('../tools/material-library');
const { validateRegistryAndBlueprints, DEFAULT_REGISTRY_PATH } = require('../tools/sbra-blueprints');
const { buildWeekBundle } = require('../tools/build-week-bundle');
const { createAttemptRecord } = require('../state/records/attempt-record');
const { createFileBackedLearningRecordStore } = require('../state/repositories/file-backed-learning-record-store');
const { AnalyticsEventService } = require('../state/services/analytics-event-service');
const { LearningProgressService } = require('../state/services/learning-progress-service');
const { AttemptCaptureService } = require('../state/services/attempt-capture-service');
const { AssessmentResultService } = require('../state/services/assessment-result-service');

function readYaml(filePath) {
  return YAML.parse(fs.readFileSync(filePath, 'utf8'));
}

const tempParent = path.join(__dirname, '.tmp');
fs.mkdirSync(tempParent, { recursive: true });
const tempRoot = fs.mkdtempSync(path.join(tempParent, 'learning-record-services-'));

const course = readYaml(path.join(__dirname, '..', 'calculus1_course.yaml'));
const weeklyPlan = readYaml(path.join(__dirname, '..', 'calculus1_weekly_plan.yaml'));
const manifest = loadManifest();
const { blueprintsByActivityId } = validateRegistryAndBlueprints(DEFAULT_REGISTRY_PATH);

try {
  const bundle = buildWeekBundle(course, weeklyPlan, 3, manifest, blueprintsByActivityId);
  const learnerIdentity = {
    learner_key: 'learner-01',
    course_id: 'SMAC001',
    module_id: 'SMAC001_w03',
    week: 3
  };

  const store = createFileBackedLearningRecordStore({ storageRoot: tempRoot });
  const analyticsEventService = new AnalyticsEventService({
    analyticsEventRepository: store.analyticsEvents
  });
  const learningProgressService = new LearningProgressService({
    learnerModuleStateRepository: store.learnerModuleStates,
    analyticsEventService
  });
  const attemptCaptureService = new AttemptCaptureService({
    attemptRecordRepository: store.attempts,
    learnerModuleStateRepository: store.learnerModuleStates
  });
  const assessmentResultService = new AssessmentResultService({
    attemptRecordRepository: store.attempts,
    assessmentResultRepository: store.assessmentResults,
    learnerModuleStateRepository: store.learnerModuleStates,
    analyticsEventService
  });

  const initialState = learningProgressService.initializeModuleState({
    learner_key: learnerIdentity.learner_key,
    interactiveModule: { interactive_module: bundle.interactive_module },
    now: '2026-04-20T10:00:00.000Z'
  });

  assert.equal(initialState.status, 'not_started');
  assert.equal(initialState.progress.progress_percent, 0);

  const sectionCompletion = learningProgressService.completeSection({
    ...learnerIdentity,
    section_id: 'SMAC001_w03_intro_section',
    completed_at: '2026-04-20T10:05:00.000Z',
    clo_ids: ['CLO1']
  });

  assert.equal(sectionCompletion.learner_module_state.status, 'in_progress');
  assert.equal(sectionCompletion.learner_module_state.progress.required_sections_completed, 1);
  assert.equal(sectionCompletion.analytics_event_record.event_type, 'completion');

  const firstAttempt = attemptCaptureService.recordAttempt({
    ...learnerIdentity,
    activity_id: 'W3-A1',
    submitted_at: '2026-04-20T10:10:00.000Z',
    response: {
      steps: [
        { step_no: 1, selected_option_id: 'opt_factor', attempt_count: 1 },
        { step_no: 2, selected_option_id: 'opt_x_plus_1', attempt_count: 1 },
        { step_no: 3, selected_option_id: 'opt_limit_vs_value', attempt_count: 1 }
      ]
    },
    notes: 'First canonical attempt',
    evidence: ['activity_artifact']
  });

  assert.equal(firstAttempt.attempt_record.attempt_no, 1);
  assert.equal(firstAttempt.learner_module_state.activity_state[0].latest_attempt_id, firstAttempt.attempt_record.attempt_id);
  assert.equal(firstAttempt.learner_module_state.activity_state[0].status, 'in_progress');
  assert.equal(attemptCaptureService.listAttempts({
    ...learnerIdentity,
    activity_id: 'W3-A1'
  }).length, 1);

  const directAppend = store.attempts.append(
    createAttemptRecord({
      ...learnerIdentity,
      activity_id: 'W3-A2',
      attempt_id: 'W3-A2_attempt_99',
      attempt_no: 99,
      submitted_at: '2026-04-20T10:11:00.000Z',
      response: { answer: 'x^2' }
    })
  );

  assert.equal(directAppend.attempt_id, 'W3-A2_attempt_99');
  const stateAfterDirectAppend = store.learnerModuleStates.getByLearnerModule(learnerIdentity);
  const quizActivity = stateAfterDirectAppend.activity_state.find((activity) => activity.activity_id === 'W3-A2');
  assert.equal(quizActivity.latest_attempt_id, null);

  const secondAttempt = attemptCaptureService.recordAttempt({
    ...learnerIdentity,
    activity_id: 'W3-A1',
    submitted_at: '2026-04-20T10:12:00.000Z',
    response: {
      steps: [
        { step_no: 1, selected_option_id: 'opt_factor', attempt_count: 1 },
        { step_no: 2, selected_option_id: 'opt_x_plus_1', attempt_count: 1 },
        { step_no: 3, selected_option_id: 'opt_limit_vs_value', attempt_count: 1 }
      ]
    },
    notes: 'Second canonical attempt',
    evidence: ['activity_artifact']
  });

  assert.equal(secondAttempt.attempt_record.attempt_no, 2);
  assert.equal(attemptCaptureService.listAttempts({
    ...learnerIdentity,
    activity_id: 'W3-A1'
  }).length, 2);

  const scoreResult = assessmentResultService.scoreAttempt({
    attempt_id: secondAttempt.attempt_record.attempt_id,
    bundle,
    scored_at: '2026-04-20T10:13:00.000Z'
  });

  assert.equal(scoreResult.assessment_result_record.passed, true);
  assert.equal(scoreResult.learner_module_state.activity_state[0].status, 'completed');
  assert.equal(scoreResult.analytics_event_record.event_type, 'score');
  assert.equal(
    assessmentResultService.listAssessmentResults({
      ...learnerIdentity,
      activity_id: 'W3-A1'
    }).length,
    1
  );

  const reflectionEvent = analyticsEventService.recordReflectionEvent({
    ...learnerIdentity,
    source_id: 'W3-A3',
    timestamp: '2026-04-20T10:14:00.000Z',
    reflection_text: 'Learner reflection saved through the canonical event service.',
    evidence_tags: ['reflection']
  });

  assert.equal(reflectionEvent.event_type, 'reflection');
  assert.equal(analyticsEventService.listEvents(learnerIdentity).length, 3);

  assert.throws(() => {
    assessmentResultService.scoreAttempt({
      attempt_id: 'missing_attempt',
      bundle,
      scored_at: '2026-04-20T10:15:00.000Z'
    });
  }, /does not exist/);
}
finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

console.log('learning record services tests passed');
