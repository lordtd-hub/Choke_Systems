'use strict';

const crypto = require('node:crypto');

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function ensureNonEmptyString(value, fieldName) {
  const normalized = String(value || '').trim();
  if (!normalized) {
    throw new Error(`${fieldName} is required.`);
  }
  return normalized;
}

function ensurePositiveInteger(value, fieldName) {
  const normalized = Number(value);
  if (!Number.isInteger(normalized) || normalized < 1) {
    throw new Error(`${fieldName} must be a positive integer.`);
  }
  return normalized;
}

function ensureIsoTimestamp(value, fieldName) {
  const normalized = ensureNonEmptyString(value, fieldName);
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`${fieldName} must be a valid ISO timestamp.`);
  }
  return date.toISOString();
}

function ensurePlainObject(value, fieldName) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${fieldName} must be an object.`);
  }
  return value;
}

function normalizeLearningIdentity(input = {}) {
  return {
    learner_key: ensureNonEmptyString(input.learner_key || input.learnerKey, 'learner_key'),
    course_id: ensureNonEmptyString(input.course_id || input.courseId, 'course_id'),
    module_id: ensureNonEmptyString(input.module_id || input.moduleId, 'module_id'),
    week: ensurePositiveInteger(input.week, 'week')
  };
}

function createIdentityEnvelope(input = {}, extra = {}) {
  return {
    ...normalizeLearningIdentity(input),
    ...clone(extra)
  };
}

function stableCopy(value) {
  if (Array.isArray(value)) {
    return value.map(stableCopy);
  }

  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce((result, key) => {
        result[key] = stableCopy(value[key]);
        return result;
      }, {});
  }

  return value;
}

function createStableRecordId(prefix, payload) {
  const normalizedPrefix = ensureNonEmptyString(prefix, 'prefix');
  const serialized = JSON.stringify(stableCopy(payload));
  const hash = crypto.createHash('sha1').update(serialized).digest('hex').slice(0, 16);
  return `${normalizedPrefix}_${hash}`;
}

module.exports = {
  clone,
  createIdentityEnvelope,
  createStableRecordId,
  ensureIsoTimestamp,
  ensureNonEmptyString,
  ensurePlainObject,
  ensurePositiveInteger,
  normalizeLearningIdentity
};
