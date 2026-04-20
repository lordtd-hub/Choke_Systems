'use strict';

const { createAnalyticsEventRecord } = require('../records/analytics-event-record');
const { assertAnalyticsEventRepository } = require('../repositories/analytics-event-repository');
const {
  normalizeCompletionEventCommand,
  normalizeReflectionEventCommand,
  normalizeScoreEventCommand
} = require('./service-commands');

class AnalyticsEventService {
  constructor({ analyticsEventRepository }) {
    this.analyticsEventRepository = assertAnalyticsEventRepository(analyticsEventRepository);
  }

  recordCompletionEvent(command) {
    const normalized = normalizeCompletionEventCommand(command);
    const eventRecord = createAnalyticsEventRecord({
      ...normalized,
      event_type: 'completion',
      evidence_type: 'completion',
      payload: normalized.payload,
      completion_status: normalized.completion_status
    });

    return this.analyticsEventRepository.append(eventRecord);
  }

  recordScoreEvent(command) {
    const normalized = normalizeScoreEventCommand(command);
    const eventRecord = createAnalyticsEventRecord({
      ...normalized,
      event_type: 'score',
      source_type: normalized.activity_type,
      source_id: normalized.activity_id,
      evidence_type: 'score',
      assessment_links: normalized.assessment_links,
      evidence_tags: normalized.evidence_tags,
      score_percent: normalized.score_percent,
      score_ratio: normalized.score_ratio,
      passed: normalized.passed,
      payload: normalized.payload
    });

    return this.analyticsEventRepository.append(eventRecord);
  }

  recordReflectionEvent(command) {
    const normalized = normalizeReflectionEventCommand(command);
    const eventRecord = createAnalyticsEventRecord({
      ...normalized,
      event_type: 'reflection',
      source_type: 'reflection',
      evidence_type: 'reflection',
      payload: normalized.payload,
      reflection_text: normalized.reflection_text,
      evidence_tags: normalized.evidence_tags
    });

    return this.analyticsEventRepository.append(eventRecord);
  }

  listEvents(identity) {
    return this.analyticsEventRepository.listByLearnerModule(identity);
  }
}

module.exports = {
  AnalyticsEventService
};
