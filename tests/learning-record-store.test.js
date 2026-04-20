'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  createIdentityEnvelope,
  createStableRecordId,
  normalizeLearningIdentity
} = require('../state/identity/learning-identity');
const {
  createLearnerModuleStateRecord
} = require('../state/records/learner-module-state');
const {
  createAttemptRecord
} = require('../state/records/attempt-record');
const {
  createAssessmentResultRecord
} = require('../state/records/assessment-result-record');
const {
  createAnalyticsEventRecord
} = require('../state/records/analytics-event-record');
const {
  createFileBackedLearningRecordStore
} = require('../state/repositories/file-backed-learning-record-store');
const {
  loadAnalyticsEvents,
  loadAssessmentResults,
  loadRuntimeState
} = require('../tools/persistence');

const tempParent = path.join(__dirname, '.tmp');
fs.mkdirSync(tempParent, { recursive: true });
const tempRoot = fs.mkdtempSync(path.join(tempParent, 'learning-record-store-'));

try {
  const normalizedIdentity = normalizeLearningIdentity({
    learnerKey: ' learner-01 ',
    courseId: 'SMAC001',
    moduleId: 'SMAC001_w03',
    week: '3'
  });

  assert.deepEqual(normalizedIdentity, {
    learner_key: 'learner-01',
    course_id: 'SMAC001',
    module_id: 'SMAC001_w03',
    week: 3
  });

  const envelope = createIdentityEnvelope(normalizedIdentity, { activity_id: 'W3-A1' });
  assert.equal(envelope.activity_id, 'W3-A1');
  assert.equal(createStableRecordId('attempt', envelope), createStableRecordId('attempt', envelope));

  const learnerModuleState = createLearnerModuleStateRecord({
    ...normalizedIdentity,
    status: 'in_progress',
    progress: {
      required_sections_total: 1,
      required_sections_completed: 1,
      required_activities_total: 1,
      required_activities_completed: 0,
      progress_percent: 50
    },
    section_state: [
      {
        section_id: 'SMAC001_w03_intro_section',
        status: 'completed',
        completed_at: '2026-04-20T09:05:00.000Z'
      }
    ],
    activity_state: [
      {
        activity_id: 'W3-A1',
        status: 'pending',
        completed_at: null,
        latest_attempt_id: null,
        attempts: []
      }
    ],
    created_at: '2026-04-20T09:00:00.000Z',
    updated_at: '2026-04-20T09:10:00.000Z',
    evidence_hooks: {
      clo_ids: ['CLO1']
    },
    version: 1
  });

  const attemptRecord = createAttemptRecord({
    ...normalizedIdentity,
    activity_id: 'W3-A1',
    attempt_id: 'W3-A1_attempt_01',
    attempt_no: 1,
    submitted_at: '2026-04-20T09:15:00.000Z',
    status: 'submitted',
    response: {
      selected_options: ['opt_factor']
    },
    notes: 'First saved attempt',
    evidence: ['activity_artifact'],
    source_kind: 'interactive_submission'
  });

  const assessmentResultRecord = createAssessmentResultRecord({
    ...normalizedIdentity,
    assessment_result_id: 'assessment_result_01',
    attempt_id: attemptRecord.attempt_id,
    activity_id: 'W3-A1',
    activity_type: 'sbra',
    score_ratio: 1,
    score_percent: 100,
    passed: true,
    scored_at: '2026-04-20T09:16:00.000Z',
    clo_mapping: {
      primary: 'CLO1',
      secondary: []
    },
    assessment_links: ['A1'],
    evidence_tags: ['direct'],
    breakdown: [],
    summary: 'Perfect score',
    scoring_context: {
      rubric_id: 'rubric_01'
    }
  });

  const analyticsEventRecord = createAnalyticsEventRecord({
    ...normalizedIdentity,
    event_id: 'analytics_event_01',
    event_type: 'score',
    source_type: 'sbra',
    source_id: 'W3-A1',
    timestamp: '2026-04-20T09:17:00.000Z',
    clo_ids: ['CLO1'],
    evidence_type: 'score',
    payload: {
      score_percent: 100
    }
  });

  const store = createFileBackedLearningRecordStore({ storageRoot: tempRoot });

  store.learnerModuleStates.saveCurrent(learnerModuleState);
  assert.equal(store.learnerModuleStates.exists(normalizedIdentity), true);
  assert.deepEqual(store.learnerModuleStates.getByLearnerModule(normalizedIdentity), learnerModuleState);

  store.attempts.append(attemptRecord);
  assert.equal(store.attempts.exists(attemptRecord.attempt_id), true);
  assert.deepEqual(store.attempts.getById(attemptRecord.attempt_id), attemptRecord);
  assert.deepEqual(store.attempts.listByLearnerModule(normalizedIdentity), [attemptRecord]);
  assert.deepEqual(store.attempts.listByActivity({
    ...normalizedIdentity,
    activity_id: 'W3-A1'
  }), [attemptRecord]);

  store.assessmentResults.append(assessmentResultRecord);
  assert.equal(store.assessmentResults.exists(assessmentResultRecord.assessment_result_id), true);
  assert.deepEqual(
    store.assessmentResults.getById(assessmentResultRecord.assessment_result_id),
    assessmentResultRecord
  );
  assert.deepEqual(store.assessmentResults.listByLearnerModule(normalizedIdentity), [assessmentResultRecord]);
  assert.deepEqual(store.assessmentResults.listByAttempt(attemptRecord.attempt_id), [assessmentResultRecord]);

  store.analyticsEvents.appendMany([analyticsEventRecord]);
  assert.equal(store.analyticsEvents.exists(analyticsEventRecord.event_id), true);
  assert.deepEqual(store.analyticsEvents.getById(analyticsEventRecord.event_id), analyticsEventRecord);
  assert.deepEqual(store.analyticsEvents.listByLearnerModule(normalizedIdentity), [analyticsEventRecord]);
  assert.deepEqual(store.analyticsEvents.listByLearnerWeek(normalizedIdentity), [analyticsEventRecord]);
  assert.deepEqual(store.analyticsEvents.listBySource({
    ...normalizedIdentity,
    source_type: 'sbra',
    source_id: 'W3-A1'
  }), [analyticsEventRecord]);

  const persistedRuntimeState = loadRuntimeState({
    course_id: normalizedIdentity.course_id,
    module_id: normalizedIdentity.module_id,
    week: normalizedIdentity.week
  }, { storageRoot: tempRoot });
  const persistedAssessmentResults = loadAssessmentResults({
    course_id: normalizedIdentity.course_id,
    module_id: normalizedIdentity.module_id,
    week: normalizedIdentity.week
  }, { storageRoot: tempRoot });
  const persistedAnalyticsEvents = loadAnalyticsEvents({
    course_id: normalizedIdentity.course_id,
    module_id: normalizedIdentity.module_id,
    week: normalizedIdentity.week
  }, { storageRoot: tempRoot });

  assert.equal(persistedRuntimeState.runtime_state.activities[0].attempts.length, 1);
  assert.equal(persistedAssessmentResults.assessment_results.length, 1);
  assert.equal(persistedAnalyticsEvents.events.length, 1);
}
finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

console.log('learning record store tests passed');
