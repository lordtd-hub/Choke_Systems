'use strict';

const {
  clone,
  createIdentityEnvelope,
  ensureIsoTimestamp,
  ensureNonEmptyString,
  ensurePlainObject,
  ensurePositiveInteger
} = require('../identity/learning-identity');

const RECORD_TYPE = 'learner_module_state';
const RECORD_MUTABILITY = 'mutable';

function ensureArray(value, fieldName) {
  if (!Array.isArray(value)) {
    throw new Error(`${fieldName} must be an array.`);
  }
  return clone(value);
}

function createLearnerModuleStateRecord(input = {}) {
  const identity = createIdentityEnvelope(input);
  const status = ensureNonEmptyString(input.status, 'status');

  return {
    record_type: RECORD_TYPE,
    mutability: RECORD_MUTABILITY,
    ...identity,
    status,
    progress: clone(ensurePlainObject(input.progress, 'progress')),
    section_state: ensureArray(input.section_state, 'section_state'),
    activity_state: ensureArray(input.activity_state, 'activity_state'),
    created_at: ensureIsoTimestamp(input.created_at, 'created_at'),
    updated_at: ensureIsoTimestamp(input.updated_at, 'updated_at'),
    completed_at: input.completed_at ? ensureIsoTimestamp(input.completed_at, 'completed_at') : null,
    evidence_hooks: input.evidence_hooks ? clone(ensurePlainObject(input.evidence_hooks, 'evidence_hooks')) : {},
    version: input.version === undefined ? 1 : ensurePositiveInteger(input.version, 'version')
  };
}

function validateLearnerModuleStateRecord(record) {
  return createLearnerModuleStateRecord(record);
}

function isLearnerModuleStateRecord(record) {
  return Boolean(record && record.record_type === RECORD_TYPE);
}

function fromRuntimeStatePayload(runtimeStatePayload, options = {}) {
  const root = runtimeStatePayload?.runtime_state;
  if (!root) {
    throw new Error('runtime_state payload is required.');
  }

  return createLearnerModuleStateRecord({
    learner_key: options.learner_key || root.learner_key || options.learnerKey,
    course_id: root.course_id,
    module_id: root.module_id,
    week: root.week,
    status: root.status,
    progress: root.progress || {},
    section_state: root.sections || [],
    activity_state: root.activities || [],
    created_at: root.created_at,
    updated_at: root.updated_at,
    completed_at: root.completed_at || null,
    evidence_hooks: root.evidence_hooks || {},
    version: root.version || 1
  });
}

function toRuntimeStatePayload(record) {
  const normalized = validateLearnerModuleStateRecord(record);

  return {
    runtime_state: {
      learner_key: normalized.learner_key,
      course_id: normalized.course_id,
      module_id: normalized.module_id,
      week: normalized.week,
      status: normalized.status,
      sections: clone(normalized.section_state),
      activities: clone(normalized.activity_state),
      evidence_hooks: clone(normalized.evidence_hooks),
      progress: clone(normalized.progress),
      created_at: normalized.created_at,
      updated_at: normalized.updated_at,
      completed_at: normalized.completed_at,
      version: normalized.version
    }
  };
}

module.exports = {
  RECORD_MUTABILITY,
  RECORD_TYPE,
  createLearnerModuleStateRecord,
  fromRuntimeStatePayload,
  isLearnerModuleStateRecord,
  toRuntimeStatePayload,
  validateLearnerModuleStateRecord
};
