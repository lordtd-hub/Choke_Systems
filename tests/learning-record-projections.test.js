'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const YAML = require('yaml');
const { loadManifest } = require('../tools/material-library');
const { validateRegistryAndBlueprints, DEFAULT_REGISTRY_PATH } = require('../tools/sbra-blueprints');
const { buildWeekBundle } = require('../tools/build-week-bundle');
const { createFileBackedLearningRecordStore } = require('../state/repositories/file-backed-learning-record-store');
const { AnalyticsEventService } = require('../state/services/analytics-event-service');
const { LearningProgressService } = require('../state/services/learning-progress-service');
const { AttemptCaptureService } = require('../state/services/attempt-capture-service');
const { AssessmentResultService } = require('../state/services/assessment-result-service');
const { LearningRecordQueryService } = require('../state/services/learning-record-query-service');
const { ProjectionAssemblyService } = require('../state/services/projection-assembly-service');

function readYaml(filePath) {
  return YAML.parse(fs.readFileSync(filePath, 'utf8'));
}

const tempParent = path.join(__dirname, '.tmp');
fs.mkdirSync(tempParent, { recursive: true });
const tempRoot = fs.mkdtempSync(path.join(tempParent, 'learning-record-projections-'));

const course = readYaml(path.join(__dirname, '..', 'calculus1_course.yaml'));
const weeklyPlan = readYaml(path.join(__dirname, '..', 'calculus1_weekly_plan.yaml'));
const manifest = loadManifest();
const { blueprintsByActivityId } = validateRegistryAndBlueprints(DEFAULT_REGISTRY_PATH);

try {
  const bundleWeek2 = buildWeekBundle(course, weeklyPlan, 2, manifest, blueprintsByActivityId);
  const bundleWeek3 = buildWeekBundle(course, weeklyPlan, 3, manifest, blueprintsByActivityId);
  const learnerKey = 'learner-01';

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
  const queryService = new LearningRecordQueryService({
    learnerModuleStateRepository: store.learnerModuleStates,
    attemptRecordRepository: store.attempts,
    assessmentResultRepository: store.assessmentResults,
    analyticsEventRepository: store.analyticsEvents
  });
  const projectionAssemblyService = new ProjectionAssemblyService({
    learningRecordQueryService: queryService
  });

  const week2Identity = {
    learner_key: learnerKey,
    course_id: 'SMAC001',
    module_id: 'SMAC001_w02',
    week: 2
  };
  const week3Identity = {
    learner_key: learnerKey,
    course_id: 'SMAC001',
    module_id: 'SMAC001_w03',
    week: 3
  };

  learningProgressService.initializeModuleState({
    learner_key: learnerKey,
    interactiveModule: { interactive_module: bundleWeek2.interactive_module },
    now: '2026-04-20T11:00:00.000Z'
  });
  learningProgressService.initializeModuleState({
    learner_key: learnerKey,
    interactiveModule: { interactive_module: bundleWeek3.interactive_module },
    now: '2026-04-20T12:00:00.000Z'
  });

  learningProgressService.completeSection({
    ...week3Identity,
    section_id: 'SMAC001_w03_intro_section',
    completed_at: '2026-04-20T12:05:00.000Z',
    clo_ids: ['CLO1']
  });

  const attemptResult = attemptCaptureService.recordAttempt({
    ...week3Identity,
    activity_id: 'W3-A1',
    submitted_at: '2026-04-20T12:10:00.000Z',
    response: {
      steps: [
        { step_no: 1, selected_option_id: 'opt_factor', attempt_count: 1 },
        { step_no: 2, selected_option_id: 'opt_x_plus_1', attempt_count: 1 },
        { step_no: 3, selected_option_id: 'opt_limit_vs_value', attempt_count: 1 }
      ]
    },
    notes: 'Projection test attempt',
    evidence: ['activity_artifact']
  });

  assessmentResultService.scoreAttempt({
    attempt_id: attemptResult.attempt_record.attempt_id,
    bundle: bundleWeek3,
    scored_at: '2026-04-20T12:12:00.000Z'
  });

  analyticsEventService.recordReflectionEvent({
    ...week3Identity,
    source_id: 'W3-A3',
    timestamp: '2026-04-20T12:15:00.000Z',
    reflection_text: 'Projection test reflection.',
    evidence_tags: ['reflection']
  });

  const learnerWeekSnapshot = queryService.getLearnerWeekSnapshot(week3Identity);
  assert.equal(learnerWeekSnapshot.learner_module_state.status, 'in_progress');

  const assessmentEvidence = queryService.getAssessmentEvidence({
    ...week3Identity,
    activity_id: 'W3-A1'
  });
  assert.equal(assessmentEvidence.attempts.length, 1);
  assert.equal(assessmentEvidence.assessment_results.length, 1);
  assert.equal(assessmentEvidence.latest_assessment_result.passed, true);

  const analyticsTimeline = queryService.getAnalyticsTimeline(week3Identity);
  assert.equal(analyticsTimeline.analytics_events.length, 3);
  assert.equal(analyticsTimeline.analytics_events[0].event_type, 'completion');
  assert.equal(analyticsTimeline.analytics_events[2].event_type, 'reflection');

  const projectionInputs = queryService.getProjectionInputs(week3Identity);
  assert.equal(projectionInputs.attempt_records.length, 1);
  assert.equal(projectionInputs.assessment_result_records.length, 1);
  assert.equal(projectionInputs.analytics_event_records.length, 3);

  const cqiProjection = projectionAssemblyService.buildCqiProjection({
    identity: week3Identity,
    course
  });
  assert.equal(cqiProjection.projection_type, 'cqi_projection_v1');
  assert.equal(cqiProjection.overview.total_clos > 0, true);

  const teacherWeekProjection = projectionAssemblyService.buildTeacherWeekProjection({
    identity: week3Identity,
    course,
    bundle: bundleWeek3
  });
  assert.equal(teacherWeekProjection.projection_type, 'teacher_week_projection_v1');
  assert.equal(teacherWeekProjection.module.title, bundleWeek3.interactive_module.title);
  assert.equal(teacherWeekProjection.assessment_summary.assessment_result_count, 1);
  assert.equal(teacherWeekProjection.analytics_summary.total_events, 3);

  const courseProjection = projectionAssemblyService.buildCourseProjection({
    course,
    weeks: [
      { identity: week2Identity, bundle: bundleWeek2 },
      { identity: week3Identity, bundle: bundleWeek3 }
    ]
  });
  assert.equal(courseProjection.projection_type, 'teacher_course_projection_v1');
  assert.equal(courseProjection.overview.indexed_weeks, 2);
  assert.equal(courseProjection.weeks.length, 2);
  assert.equal(courseProjection.weeks[0].context.week, 2);
  assert.equal(courseProjection.weeks[1].context.week, 3);
}
finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

console.log('learning record projections tests passed');
