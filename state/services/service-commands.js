'use strict';

const {
  clone,
  createIdentityEnvelope,
  ensureIsoTimestamp,
  ensureNonEmptyString,
  normalizeLearningIdentity
} = require('../identity/learning-identity');

function ensureBoolean(value, fieldName) {
  if (typeof value !== 'boolean') {
    throw new Error(`${fieldName} must be a boolean.`);
  }
  return value;
}

function ensureArray(value, fieldName) {
  if (!Array.isArray(value)) {
    throw new Error(`${fieldName} must be an array.`);
  }
  return value;
}

function resolveTimestamp(value, fieldName) {
  return ensureIsoTimestamp(value || new Date().toISOString(), fieldName);
}

function summarizeProgress(stateRecord) {
  const sectionItems = (stateRecord.section_state || []).filter((section) => section.required);
  const activityItems = (stateRecord.activity_state || []).filter((activity) => activity.required);
  const requiredSectionsCompleted = sectionItems.filter((section) => section.status === 'completed').length;
  const requiredActivitiesCompleted = activityItems.filter((activity) => activity.status === 'completed').length;
  const totalRequiredItems = sectionItems.length + activityItems.length;
  const totalCompletedItems = requiredSectionsCompleted + requiredActivitiesCompleted;
  const progressPercent = totalRequiredItems === 0 ? 100 : Math.round((totalCompletedItems / totalRequiredItems) * 100);

  return {
    required_sections_total: sectionItems.length,
    required_sections_completed: requiredSectionsCompleted,
    required_activities_total: activityItems.length,
    required_activities_completed: requiredActivitiesCompleted,
    progress_percent: progressPercent
  };
}

function inferRuntimeStatus(progress) {
  const totalRequiredItems = progress.required_sections_total + progress.required_activities_total;
  const totalCompletedItems = progress.required_sections_completed + progress.required_activities_completed;

  if (totalCompletedItems === 0) {
    return 'not_started';
  }

  if (totalRequiredItems > 0 && totalCompletedItems >= totalRequiredItems) {
    return 'completed';
  }

  return 'in_progress';
}

function applyDerivedState(stateRecord, timestamp) {
  const nextState = clone(stateRecord);
  const progress = summarizeProgress(nextState);
  const status = inferRuntimeStatus(progress);

  nextState.progress = progress;
  nextState.status = status;
  nextState.updated_at = resolveTimestamp(timestamp, 'updated_at');
  nextState.completed_at = status === 'completed'
    ? nextState.completed_at || nextState.updated_at
    : null;

  return nextState;
}

function findSectionState(stateRecord, sectionId) {
  const section = (stateRecord.section_state || []).find((item) => item.section_id === sectionId);
  if (!section) {
    throw new Error(`Unknown section "${sectionId}".`);
  }
  return section;
}

function findActivityState(stateRecord, activityId) {
  const activity = (stateRecord.activity_state || []).find((item) => item.activity_id === activityId);
  if (!activity) {
    throw new Error(`Unknown activity "${activityId}".`);
  }
  return activity;
}

function normalizeModuleInitializationCommand(input = {}) {
  const learnerKey = ensureNonEmptyString(input.learner_key || input.learnerKey, 'learner_key');
  const interactiveModule = input.interactiveModule || input.interactive_module || input.module;

  if (!interactiveModule?.interactive_module) {
    throw new Error('interactive_module payload is required.');
  }

  return {
    learner_key: learnerKey,
    interactive_module: clone(interactiveModule),
    now: resolveTimestamp(input.now, 'now')
  };
}

function normalizeSectionCompletionCommand(input = {}) {
  return {
    ...normalizeLearningIdentity(input),
    section_id: ensureNonEmptyString(input.section_id || input.sectionId, 'section_id'),
    completed_at: resolveTimestamp(input.completed_at || input.completedAt || input.now, 'completed_at'),
    clo_ids: Array.isArray(input.clo_ids) ? clone(input.clo_ids) : []
  };
}

function normalizeActivityCompletionCommand(input = {}) {
  return {
    ...normalizeLearningIdentity(input),
    activity_id: ensureNonEmptyString(input.activity_id || input.activityId, 'activity_id'),
    completed_at: resolveTimestamp(input.completed_at || input.completedAt || input.now, 'completed_at'),
    attempt_id: input.attempt_id || input.attemptId || null,
    clo_ids: Array.isArray(input.clo_ids) ? clone(input.clo_ids) : []
  };
}

function normalizeAttemptCommand(input = {}) {
  return {
    ...normalizeLearningIdentity(input),
    activity_id: ensureNonEmptyString(input.activity_id || input.activityId, 'activity_id'),
    submitted_at: resolveTimestamp(input.submitted_at || input.submittedAt || input.now, 'submitted_at'),
    status: ensureNonEmptyString(input.status || 'submitted', 'status'),
    response: input.response ?? null,
    notes: input.notes ?? null,
    evidence: Array.isArray(input.evidence) ? clone(input.evidence) : [],
    source_kind: input.source_kind || input.sourceKind || null,
    mark_complete: input.mark_complete === undefined ? false : ensureBoolean(input.mark_complete, 'mark_complete')
  };
}

function normalizeScoreCommand(input = {}) {
  if (!input.bundle) {
    throw new Error('bundle is required.');
  }

  return {
    attempt_id: ensureNonEmptyString(input.attempt_id || input.attemptId, 'attempt_id'),
    bundle: clone(input.bundle),
    scored_at: resolveTimestamp(input.scored_at || input.scoredAt || input.now, 'scored_at'),
    submission: input.submission ?? null,
    mark_activity_complete_on_pass: input.mark_activity_complete_on_pass === undefined
      ? true
      : ensureBoolean(input.mark_activity_complete_on_pass, 'mark_activity_complete_on_pass')
  };
}

function normalizeCompletionEventCommand(input = {}) {
  const identity = normalizeLearningIdentity(input);
  return {
    ...identity,
    source_type: ensureNonEmptyString(input.source_type || input.sourceType, 'source_type'),
    source_id: ensureNonEmptyString(input.source_id || input.sourceId, 'source_id'),
    timestamp: resolveTimestamp(input.timestamp, 'timestamp'),
    clo_ids: Array.isArray(input.clo_ids) ? clone(input.clo_ids) : [],
    completion_status: ensureNonEmptyString(input.completion_status || input.completionStatus || 'completed', 'completion_status'),
    payload: input.payload ? clone(input.payload) : {}
  };
}

function normalizeScoreEventCommand(input = {}) {
  const identity = normalizeLearningIdentity(input);
  return {
    ...identity,
    activity_id: ensureNonEmptyString(input.activity_id || input.activityId, 'activity_id'),
    activity_type: ensureNonEmptyString(input.activity_type || input.activityType, 'activity_type'),
    timestamp: resolveTimestamp(input.timestamp, 'timestamp'),
    clo_ids: Array.isArray(input.clo_ids) ? clone(input.clo_ids) : [],
    score_percent: Number(input.score_percent),
    score_ratio: Number(input.score_ratio),
    passed: ensureBoolean(input.passed, 'passed'),
    assessment_links: Array.isArray(input.assessment_links) ? clone(input.assessment_links) : [],
    evidence_tags: Array.isArray(input.evidence_tags) ? clone(input.evidence_tags) : [],
    payload: input.payload ? clone(input.payload) : {}
  };
}

function normalizeReflectionEventCommand(input = {}) {
  const identity = normalizeLearningIdentity(input);
  return {
    ...identity,
    source_id: ensureNonEmptyString(input.source_id || input.sourceId, 'source_id'),
    timestamp: resolveTimestamp(input.timestamp, 'timestamp'),
    clo_ids: Array.isArray(input.clo_ids) ? clone(input.clo_ids) : [],
    evidence_tags: Array.isArray(input.evidence_tags) ? clone(input.evidence_tags) : [],
    reflection_text: ensureNonEmptyString(input.reflection_text || input.reflectionText, 'reflection_text'),
    payload: input.payload ? clone(input.payload) : {}
  };
}

function touchSectionCompletion(stateRecord, command) {
  const nextState = clone(stateRecord);
  const section = findSectionState(nextState, command.section_id);

  section.status = 'completed';
  section.completed_at = section.completed_at || command.completed_at;

  return applyDerivedState(nextState, command.completed_at);
}

function touchActivityCompletion(stateRecord, command) {
  const nextState = clone(stateRecord);
  const activity = findActivityState(nextState, command.activity_id);

  activity.status = 'completed';
  activity.completed_at = activity.completed_at || command.completed_at;
  if (command.attempt_id) {
    activity.latest_attempt_id = command.attempt_id;
  }

  return applyDerivedState(nextState, command.completed_at);
}

function touchAttemptCapture(stateRecord, command, appendedAttempt) {
  const nextState = clone(stateRecord);
  const activity = findActivityState(nextState, command.activity_id);

  ensureArray(activity.attempts || [], 'activity.attempts');
  activity.latest_attempt_id = appendedAttempt.attempt_id;

  if (command.mark_complete) {
    activity.status = 'completed';
    activity.completed_at = activity.completed_at || command.submitted_at;
  } else if (activity.status === 'pending') {
    activity.status = 'in_progress';
  }

  return applyDerivedState(nextState, command.submitted_at);
}

function touchAssessmentCompletion(stateRecord, assessmentResultRecord, timestamp) {
  const nextState = clone(stateRecord);
  const activity = findActivityState(nextState, assessmentResultRecord.activity_id);

  activity.latest_attempt_id = assessmentResultRecord.attempt_id;
  activity.status = 'completed';
  activity.completed_at = activity.completed_at || timestamp;

  return applyDerivedState(nextState, timestamp);
}

function assertBundleSubmission(submission) {
  if (submission === null || submission === undefined) {
    throw new Error('A scoring submission is required.');
  }

  return clone(submission);
}

module.exports = {
  applyDerivedState,
  assertBundleSubmission,
  clone,
  createIdentityEnvelope,
  findActivityState,
  normalizeActivityCompletionCommand,
  normalizeAttemptCommand,
  normalizeCompletionEventCommand,
  normalizeModuleInitializationCommand,
  normalizeReflectionEventCommand,
  normalizeScoreCommand,
  normalizeScoreEventCommand,
  normalizeSectionCompletionCommand,
  summarizeProgress,
  touchActivityCompletion,
  touchAssessmentCompletion,
  touchAttemptCapture,
  touchSectionCompletion
};
