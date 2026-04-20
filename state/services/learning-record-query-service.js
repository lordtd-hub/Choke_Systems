'use strict';

const { assertLearnerModuleStateRepository } = require('../repositories/learner-module-state-repository');
const { assertAttemptRecordRepository } = require('../repositories/attempt-record-repository');
const { assertAssessmentResultRepository } = require('../repositories/assessment-result-repository');
const { assertAnalyticsEventRepository } = require('../repositories/analytics-event-repository');
const { normalizeLearningIdentity } = require('../identity/learning-identity');

function compareIsoTimestamps(left, right) {
  return String(left || '').localeCompare(String(right || ''));
}

function sortAttempts(attempts) {
  return [...attempts].sort((left, right) => {
    return compareIsoTimestamps(left.submitted_at, right.submitted_at)
      || String(left.attempt_id).localeCompare(String(right.attempt_id));
  });
}

function sortAssessmentResults(results) {
  return [...results].sort((left, right) => {
    return compareIsoTimestamps(left.scored_at, right.scored_at)
      || String(left.assessment_result_id).localeCompare(String(right.assessment_result_id));
  });
}

function sortAnalyticsEvents(events) {
  return [...events].sort((left, right) => {
    return compareIsoTimestamps(left.timestamp, right.timestamp)
      || String(left.event_id).localeCompare(String(right.event_id));
  });
}

class LearningRecordQueryService {
  constructor({
    learnerModuleStateRepository,
    attemptRecordRepository,
    assessmentResultRepository,
    analyticsEventRepository
  }) {
    this.learnerModuleStateRepository = assertLearnerModuleStateRepository(learnerModuleStateRepository);
    this.attemptRecordRepository = assertAttemptRecordRepository(attemptRecordRepository);
    this.assessmentResultRepository = assertAssessmentResultRepository(assessmentResultRepository);
    this.analyticsEventRepository = assertAnalyticsEventRepository(analyticsEventRepository);
  }

  getLearnerWeekSnapshot(identity) {
    const normalized = normalizeLearningIdentity(identity);
    const learnerModuleState = this.learnerModuleStateRepository.getByLearnerModule(normalized);

    return {
      context: normalized,
      learner_module_state: learnerModuleState
    };
  }

  getAssessmentEvidence(activityScope) {
    const normalized = normalizeLearningIdentity(activityScope);
    const activityId = activityScope.activity_id || activityScope.activityId;
    const attempts = sortAttempts(this.attemptRecordRepository.listByActivity({
      ...normalized,
      activity_id: activityId
    }));
    const assessmentResults = sortAssessmentResults(this.assessmentResultRepository.listByActivity({
      ...normalized,
      activity_id: activityId
    }));

    return {
      context: {
        ...normalized,
        activity_id: activityId
      },
      attempts,
      assessment_results: assessmentResults,
      latest_attempt: attempts[attempts.length - 1] || null,
      latest_assessment_result: assessmentResults[assessmentResults.length - 1] || null
    };
  }

  getAnalyticsTimeline(identity) {
    const normalized = normalizeLearningIdentity(identity);
    const analyticsEvents = sortAnalyticsEvents(this.analyticsEventRepository.listByLearnerWeek(normalized));

    return {
      context: normalized,
      analytics_events: analyticsEvents
    };
  }

  getProjectionInputs(identity) {
    const normalized = normalizeLearningIdentity(identity);
    const learnerWeekSnapshot = this.getLearnerWeekSnapshot(normalized);
    const attemptRecords = sortAttempts(this.attemptRecordRepository.listByLearnerModule(normalized));
    const assessmentResults = sortAssessmentResults(this.assessmentResultRepository.listByLearnerModule(normalized));
    const analyticsTimeline = this.getAnalyticsTimeline(normalized);

    return {
      context: normalized,
      learner_module_state: learnerWeekSnapshot.learner_module_state,
      attempt_records: attemptRecords,
      assessment_result_records: assessmentResults,
      analytics_event_records: analyticsTimeline.analytics_events
    };
  }
}

module.exports = {
  LearningRecordQueryService
};
