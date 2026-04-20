'use strict';

const {
  clone,
  createIdentityEnvelope,
  createStableRecordId,
  ensureIsoTimestamp,
  ensureNonEmptyString
} = require('../identity/learning-identity');

const RECORD_TYPE = 'analytics_event_record';
const RECORD_MUTABILITY = 'append_only';

function createAnalyticsEventRecord(input = {}) {
  const identity = createIdentityEnvelope(input);
  const eventType = ensureNonEmptyString(input.event_type || input.eventType, 'event_type');
  const sourceType = ensureNonEmptyString(input.source_type || input.sourceType, 'source_type');
  const sourceId = ensureNonEmptyString(input.source_id || input.sourceId, 'source_id');
  const timestamp = ensureIsoTimestamp(input.timestamp, 'timestamp');
  const eventId = input.event_id || input.eventId || createStableRecordId('analytics_event', {
    ...identity,
    event_type: eventType,
    source_type: sourceType,
    source_id: sourceId,
    timestamp
  });

  return {
    record_type: RECORD_TYPE,
    mutability: RECORD_MUTABILITY,
    ...identity,
    event_id: ensureNonEmptyString(eventId, 'event_id'),
    event_type: eventType,
    source_type: sourceType,
    source_id: sourceId,
    timestamp,
    clo_ids: Array.isArray(input.clo_ids) ? clone(input.clo_ids) : [],
    evidence_type: input.evidence_type || input.evidenceType || null,
    payload: clone(input.payload || {}),
    score_percent: input.score_percent ?? null,
    score_ratio: input.score_ratio ?? null,
    passed: input.passed ?? null,
    completion_status: input.completion_status ?? null,
    assessment_links: Array.isArray(input.assessment_links) ? clone(input.assessment_links) : [],
    evidence_tags: Array.isArray(input.evidence_tags) ? clone(input.evidence_tags) : [],
    reflection_text: input.reflection_text ?? null
  };
}

function validateAnalyticsEventRecord(record) {
  return createAnalyticsEventRecord(record);
}

function isAnalyticsEventRecord(record) {
  return Boolean(record && record.record_type === RECORD_TYPE);
}

function fromStoredAnalyticsEvent(event, context, index = 0) {
  return createAnalyticsEventRecord({
    ...context,
    event_id: event?.event_id || createStableRecordId('analytics_event', {
      ...context,
      source_type: event?.source_type || 'unknown',
      source_id: event?.source_id || `source_${index + 1}`,
      timestamp: event?.timestamp || '1970-01-01T00:00:00.000Z'
    }),
    event_type: event?.event_type || 'unknown',
    source_type: event?.source_type || 'unknown',
    source_id: event?.source_id || `source_${index + 1}`,
    timestamp: event?.timestamp || '1970-01-01T00:00:00.000Z',
    clo_ids: event?.clo_ids || [],
    evidence_type: event?.evidence_type || null,
    payload: event?.payload || {},
    score_percent: event?.score_percent ?? null,
    score_ratio: event?.score_ratio ?? null,
    passed: event?.passed ?? null,
    completion_status: event?.completion_status ?? null,
    assessment_links: event?.assessment_links || [],
    evidence_tags: event?.evidence_tags || [],
    reflection_text: event?.reflection_text ?? null
  });
}

function toStoredAnalyticsEvent(record) {
  return clone(validateAnalyticsEventRecord(record));
}

module.exports = {
  RECORD_MUTABILITY,
  RECORD_TYPE,
  createAnalyticsEventRecord,
  fromStoredAnalyticsEvent,
  isAnalyticsEventRecord,
  toStoredAnalyticsEvent,
  validateAnalyticsEventRecord
};
