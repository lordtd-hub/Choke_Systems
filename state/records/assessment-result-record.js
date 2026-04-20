'use strict';

const {
  clone,
  createIdentityEnvelope,
  createStableRecordId,
  ensureIsoTimestamp,
  ensureNonEmptyString
} = require('../identity/learning-identity');

const RECORD_TYPE = 'assessment_result_record';
const RECORD_MUTABILITY = 'append_only';

function ensureBoolean(value, fieldName) {
  if (typeof value !== 'boolean') {
    throw new Error(`${fieldName} must be a boolean.`);
  }
  return value;
}

function ensureNumber(value, fieldName) {
  const normalized = Number(value);
  if (!Number.isFinite(normalized)) {
    throw new Error(`${fieldName} must be a finite number.`);
  }
  return normalized;
}

function createAssessmentResultRecord(input = {}) {
  const identity = createIdentityEnvelope(input);
  const attemptId = ensureNonEmptyString(input.attempt_id || input.attemptId, 'attempt_id');
  const activityId = ensureNonEmptyString(input.activity_id || input.activityId, 'activity_id');
  const activityType = ensureNonEmptyString(input.activity_type || input.activityType, 'activity_type');
  const scoredAt = ensureIsoTimestamp(input.scored_at || input.scoredAt, 'scored_at');
  const assessmentResultId = input.assessment_result_id || input.assessmentResultId || createStableRecordId('assessment_result', {
    ...identity,
    attempt_id: attemptId,
    activity_id: activityId,
    scored_at: scoredAt
  });

  return {
    record_type: RECORD_TYPE,
    mutability: RECORD_MUTABILITY,
    ...identity,
    assessment_result_id: ensureNonEmptyString(assessmentResultId, 'assessment_result_id'),
    attempt_id: attemptId,
    activity_id: activityId,
    activity_type: activityType,
    score_ratio: ensureNumber(input.score_ratio, 'score_ratio'),
    score_percent: ensureNumber(input.score_percent, 'score_percent'),
    passed: ensureBoolean(input.passed, 'passed'),
    scored_at: scoredAt,
    clo_mapping: clone(input.clo_mapping || {}),
    assessment_links: Array.isArray(input.assessment_links) ? clone(input.assessment_links) : [],
    evidence_tags: Array.isArray(input.evidence_tags) ? clone(input.evidence_tags) : [],
    breakdown: Array.isArray(input.breakdown) ? clone(input.breakdown) : [],
    summary: input.summary || '',
    scoring_context: clone(input.scoring_context || {})
  };
}

function validateAssessmentResultRecord(record) {
  return createAssessmentResultRecord(record);
}

function isAssessmentResultRecord(record) {
  return Boolean(record && record.record_type === RECORD_TYPE);
}

function fromStoredAssessmentResult(result, context, index = 0) {
  return createAssessmentResultRecord({
    ...context,
    assessment_result_id: result?.assessment_result_id || createStableRecordId('assessment_result', {
      ...context,
      activity_id: result?.activity_id || `activity_${index + 1}`,
      attempt_id: result?.attempt_id || `attempt_${index + 1}`,
      scored_at: result?.scored_at || `1970-01-01T00:00:00.000Z`
    }),
    attempt_id: result?.attempt_id || `attempt_${index + 1}`,
    activity_id: result?.activity_id || `activity_${index + 1}`,
    activity_type: result?.activity_type || 'unknown',
    score_ratio: result?.score_ratio ?? 0,
    score_percent: result?.score_percent ?? 0,
    passed: Boolean(result?.passed),
    scored_at: result?.scored_at || '1970-01-01T00:00:00.000Z',
    clo_mapping: result?.clo_mapping || {},
    assessment_links: result?.assessment_links || [],
    evidence_tags: result?.evidence_tags || [],
    breakdown: result?.breakdown || [],
    summary: result?.summary || '',
    scoring_context: result?.scoring_context || {}
  });
}

function toStoredAssessmentResult(record) {
  return clone(validateAssessmentResultRecord(record));
}

module.exports = {
  RECORD_MUTABILITY,
  RECORD_TYPE,
  createAssessmentResultRecord,
  fromStoredAssessmentResult,
  isAssessmentResultRecord,
  toStoredAssessmentResult,
  validateAssessmentResultRecord
};
