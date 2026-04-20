'use strict';

const { scoreActivitySubmission } = require('../../tools/assessment-engine');
const { createAssessmentResultRecord } = require('../records/assessment-result-record');
const { assertAttemptRecordRepository } = require('../repositories/attempt-record-repository');
const { assertAssessmentResultRepository } = require('../repositories/assessment-result-repository');
const { assertLearnerModuleStateRepository } = require('../repositories/learner-module-state-repository');
const {
  assertBundleSubmission,
  normalizeScoreCommand,
  touchAssessmentCompletion
} = require('./service-commands');
const { validateLearnerModuleStateRecord } = require('../records/learner-module-state');

class AssessmentResultService {
  constructor({
    attemptRecordRepository,
    assessmentResultRepository,
    learnerModuleStateRepository,
    analyticsEventService = null
  }) {
    this.attemptRecordRepository = assertAttemptRecordRepository(attemptRecordRepository);
    this.assessmentResultRepository = assertAssessmentResultRepository(assessmentResultRepository);
    this.learnerModuleStateRepository = assertLearnerModuleStateRepository(learnerModuleStateRepository);
    this.analyticsEventService = analyticsEventService;
  }

  scoreAttempt(command) {
    const normalized = normalizeScoreCommand(command);
    const attemptRecord = this.attemptRecordRepository.getById(normalized.attempt_id);

    if (!attemptRecord) {
      throw new Error(`Attempt "${normalized.attempt_id}" does not exist.`);
    }

    const submission = assertBundleSubmission(normalized.submission ?? attemptRecord.response);
    const scoreResult = scoreActivitySubmission(normalized.bundle, attemptRecord.activity_id, submission);
    const assessmentResultRecord = this.assessmentResultRepository.append(
      createAssessmentResultRecord({
        ...attemptRecord,
        assessment_result_id: null,
        attempt_id: attemptRecord.attempt_id,
        activity_id: attemptRecord.activity_id,
        activity_type: scoreResult.activity_type,
        score_ratio: scoreResult.score_ratio,
        score_percent: scoreResult.score_percent,
        passed: scoreResult.passed,
        scored_at: normalized.scored_at,
        clo_mapping: scoreResult.clo_mapping,
        assessment_links: scoreResult.assessment_links,
        evidence_tags: scoreResult.evidence_tags,
        breakdown: scoreResult.breakdown,
        summary: scoreResult.summary,
        scoring_context: scoreResult.scoring_context
      })
    );

    let nextState = this.learnerModuleStateRepository.getByLearnerModule(attemptRecord);
    if (normalized.mark_activity_complete_on_pass && assessmentResultRecord.passed && nextState) {
      nextState = this.learnerModuleStateRepository.saveCurrent(
        validateLearnerModuleStateRecord(
          touchAssessmentCompletion(nextState, assessmentResultRecord, normalized.scored_at)
        )
      );
    }

    let analyticsEvent = null;
    if (this.analyticsEventService) {
      analyticsEvent = this.analyticsEventService.recordScoreEvent({
        ...attemptRecord,
        activity_id: assessmentResultRecord.activity_id,
        activity_type: assessmentResultRecord.activity_type,
        timestamp: assessmentResultRecord.scored_at,
        clo_ids: [
          assessmentResultRecord.clo_mapping.primary,
          ...(assessmentResultRecord.clo_mapping.secondary || [])
        ].filter(Boolean),
        score_percent: assessmentResultRecord.score_percent,
        score_ratio: assessmentResultRecord.score_ratio,
        passed: assessmentResultRecord.passed,
        assessment_links: assessmentResultRecord.assessment_links,
        evidence_tags: assessmentResultRecord.evidence_tags,
        payload: {
          summary: assessmentResultRecord.summary,
          scoring_context: assessmentResultRecord.scoring_context
        }
      });
    }

    return {
      assessment_result_record: assessmentResultRecord,
      learner_module_state: nextState,
      analytics_event_record: analyticsEvent
    };
  }

  getAssessmentResult(assessmentResultId) {
    return this.assessmentResultRepository.getById(assessmentResultId);
  }

  listAssessmentResults(activityScope) {
    return this.assessmentResultRepository.listByActivity(activityScope);
  }
}

module.exports = {
  AssessmentResultService
};
