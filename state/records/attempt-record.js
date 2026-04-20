'use strict';

const {
  clone,
  createIdentityEnvelope,
  createStableRecordId,
  ensureIsoTimestamp,
  ensureNonEmptyString,
  ensurePositiveInteger
} = require('../identity/learning-identity');

const RECORD_TYPE = 'attempt_record';
const RECORD_MUTABILITY = 'append_only';

function createAttemptRecord(input = {}) {
  const identity = createIdentityEnvelope(input);
  const activityId = ensureNonEmptyString(input.activity_id || input.activityId, 'activity_id');
  const submittedAt = ensureIsoTimestamp(input.submitted_at || input.submittedAt, 'submitted_at');
  const status = ensureNonEmptyString(input.status || 'submitted', 'status');
  const attemptNumber = input.attempt_no === undefined ? null : ensurePositiveInteger(input.attempt_no, 'attempt_no');
  const attemptId = input.attempt_id || input.attemptId || createStableRecordId('attempt', {
    ...identity,
    activity_id: activityId,
    submitted_at: submittedAt,
    attempt_no: attemptNumber
  });

  return {
    record_type: RECORD_TYPE,
    mutability: RECORD_MUTABILITY,
    ...identity,
    attempt_id: ensureNonEmptyString(attemptId, 'attempt_id'),
    activity_id: activityId,
    submitted_at: submittedAt,
    status,
    attempt_no: attemptNumber,
    response: input.response ?? null,
    notes: input.notes ?? null,
    evidence: Array.isArray(input.evidence) ? clone(input.evidence) : [],
    source_kind: input.source_kind || input.sourceKind || null
  };
}

function validateAttemptRecord(record) {
  return createAttemptRecord(record);
}

function isAttemptRecord(record) {
  return Boolean(record && record.record_type === RECORD_TYPE);
}

function fromRuntimeActivityAttempt(attempt, context, activityId, index = 0) {
  return createAttemptRecord({
    ...context,
    attempt_id: attempt?.attempt_id,
    activity_id: activityId,
    submitted_at: attempt?.submitted_at,
    status: attempt?.status || 'submitted',
    attempt_no: attempt?.attempt_no || index + 1,
    response: attempt?.response ?? null,
    notes: attempt?.notes ?? null,
    evidence: attempt?.evidence || [],
    source_kind: attempt?.source_kind || null
  });
}

function toRuntimeActivityAttempt(record) {
  const normalized = validateAttemptRecord(record);

  return {
    attempt_id: normalized.attempt_id,
    submitted_at: normalized.submitted_at,
    status: normalized.status,
    attempt_no: normalized.attempt_no,
    response: clone(normalized.response),
    notes: normalized.notes,
    evidence: clone(normalized.evidence),
    source_kind: normalized.source_kind
  };
}

module.exports = {
  RECORD_MUTABILITY,
  RECORD_TYPE,
  createAttemptRecord,
  fromRuntimeActivityAttempt,
  isAttemptRecord,
  toRuntimeActivityAttempt,
  validateAttemptRecord
};
