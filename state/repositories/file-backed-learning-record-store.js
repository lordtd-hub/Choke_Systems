'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {
  DEFAULT_STORAGE_ROOT,
  getArtifactFilePath,
  loadAnalyticsEvents,
  loadAssessmentResults,
  loadRuntimeState,
  saveAnalyticsEvents,
  saveAssessmentResults,
  saveRuntimeState
} = require('../../tools/persistence');
const { normalizeLearningIdentity } = require('../identity/learning-identity');
const {
  createLearnerModuleStateRecord,
  fromRuntimeStatePayload,
  toRuntimeStatePayload,
  validateLearnerModuleStateRecord
} = require('../records/learner-module-state');
const {
  fromRuntimeActivityAttempt,
  toRuntimeActivityAttempt,
  validateAttemptRecord
} = require('../records/attempt-record');
const {
  fromStoredAssessmentResult,
  toStoredAssessmentResult,
  validateAssessmentResultRecord
} = require('../records/assessment-result-record');
const {
  fromStoredAnalyticsEvent,
  toStoredAnalyticsEvent,
  validateAnalyticsEventRecord
} = require('../records/analytics-event-record');
const {
  LearnerModuleStateRepository,
  assertLearnerModuleStateRepository
} = require('./learner-module-state-repository');
const {
  AttemptRecordRepository,
  assertAttemptRecordRepository
} = require('./attempt-record-repository');
const {
  AssessmentResultRepository,
  assertAssessmentResultRepository
} = require('./assessment-result-repository');
const {
  AnalyticsEventRepository,
  assertAnalyticsEventRepository
} = require('./analytics-event-repository');

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function buildStorageContext(identity) {
  const normalized = normalizeLearningIdentity(identity);
  return {
    course_id: normalized.course_id,
    module_id: normalized.module_id,
    week: normalized.week
  };
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function hasArtifact(context, fileName, storageRoot) {
  return fs.existsSync(getArtifactFilePath(context, fileName, storageRoot));
}

function loadRuntimeStateIfExists(context, storageRoot) {
  if (!hasArtifact(context, 'runtime-state.json', storageRoot)) {
    return null;
  }

  return loadRuntimeState(context, { storageRoot });
}

function loadAssessmentResultsIfExists(context, storageRoot) {
  if (!hasArtifact(context, 'assessment-results.json', storageRoot)) {
    return [];
  }

  return loadAssessmentResults(context, { storageRoot }).assessment_results || [];
}

function loadAnalyticsEventsIfExists(context, storageRoot) {
  if (!hasArtifact(context, 'analytics-events.json', storageRoot)) {
    return [];
  }

  return loadAnalyticsEvents(context, { storageRoot }).events || [];
}

function walkFiles(dirPath, fileName, results = []) {
  if (!fs.existsSync(dirPath)) {
    return results;
  }

  fs.readdirSync(dirPath, { withFileTypes: true }).forEach((entry) => {
    const entryPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walkFiles(entryPath, fileName, results);
      return;
    }

    if (entry.isFile() && entry.name === fileName) {
      results.push(entryPath);
    }
  });

  return results;
}

function findActivity(runtimeStatePayload, activityId) {
  const activity = runtimeStatePayload?.runtime_state?.activities?.find((item) => item.activity_id === activityId);
  if (!activity) {
    throw new Error(`Activity "${activityId}" was not found in runtime state.`);
  }
  return activity;
}

function listCanonicalAttemptsFromRuntime(runtimeStatePayload, learnerKey) {
  const runtimeStateRecord = fromRuntimeStatePayload(runtimeStatePayload, { learner_key: learnerKey });

  return runtimeStateRecord.activity_state.flatMap((activity) =>
    (activity.attempts || []).map((attempt, index) =>
      fromRuntimeActivityAttempt(attempt, runtimeStateRecord, activity.activity_id, index)
    )
  );
}

class FileBackedLearnerModuleStateRepository extends LearnerModuleStateRepository {
  constructor({ storageRoot }) {
    super();
    this.storageRoot = storageRoot;
  }

  getByLearnerModule(identity) {
    const normalized = normalizeLearningIdentity(identity);
    const context = buildStorageContext(normalized);
    const payload = loadRuntimeStateIfExists(context, this.storageRoot);
    return payload ? fromRuntimeStatePayload(payload, normalized) : null;
  }

  saveCurrent(stateRecord) {
    const normalized = validateLearnerModuleStateRecord(stateRecord);
    saveRuntimeState(toRuntimeStatePayload(normalized), { storageRoot: this.storageRoot });
    return normalized;
  }

  exists(identity) {
    return hasArtifact(buildStorageContext(identity), 'runtime-state.json', this.storageRoot);
  }

  listByLearner(learnerScope) {
    const learnerKey = normalizeLearningIdentity({
      learner_key: learnerScope.learner_key || learnerScope.learnerKey,
      course_id: learnerScope.course_id || learnerScope.courseId || 'placeholder',
      module_id: learnerScope.module_id || learnerScope.moduleId || 'placeholder',
      week: learnerScope.week || 1
    }).learner_key;

    return walkFiles(this.storageRoot, 'runtime-state.json')
      .map((filePath) => readJson(filePath))
      .map((payload) => fromRuntimeStatePayload(payload, { learner_key: learnerKey }))
      .filter((record) => record.learner_key === learnerKey);
  }
}

class FileBackedAttemptRecordRepository extends AttemptRecordRepository {
  constructor({ storageRoot }) {
    super();
    this.storageRoot = storageRoot;
  }

  append(attemptRecord) {
    const normalized = validateAttemptRecord(attemptRecord);
    const context = buildStorageContext(normalized);
    const payload = loadRuntimeStateIfExists(context, this.storageRoot);

    if (!payload) {
      throw new Error('Cannot append attempt without an existing runtime-state artifact.');
    }

    const nextPayload = clone(payload);
    const activity = findActivity(nextPayload, normalized.activity_id);
    activity.attempts = Array.isArray(activity.attempts) ? activity.attempts : [];
    activity.attempts.push(toRuntimeActivityAttempt(normalized));

    saveRuntimeState(nextPayload, { storageRoot: this.storageRoot });
    return normalized;
  }

  getById(attemptId) {
    return walkFiles(this.storageRoot, 'runtime-state.json')
      .map((filePath) => readJson(filePath))
      .flatMap((payload) => listCanonicalAttemptsFromRuntime(payload, payload.runtime_state?.learner_key || 'anonymous'))
      .find((record) => record.attempt_id === attemptId) || null;
  }

  listByLearnerModule(identity) {
    const normalized = normalizeLearningIdentity(identity);
    const payload = loadRuntimeStateIfExists(buildStorageContext(normalized), this.storageRoot);
    return payload ? listCanonicalAttemptsFromRuntime(payload, normalized.learner_key) : [];
  }

  listByActivity(activityScope) {
    const activityId = activityScope.activity_id || activityScope.activityId;
    return this.listByLearnerModule(activityScope).filter((record) => record.activity_id === activityId);
  }

  exists(attemptId) {
    return Boolean(this.getById(attemptId));
  }
}

class FileBackedAssessmentResultRepository extends AssessmentResultRepository {
  constructor({ storageRoot }) {
    super();
    this.storageRoot = storageRoot;
  }

  append(resultRecord) {
    const normalized = validateAssessmentResultRecord(resultRecord);
    const context = buildStorageContext(normalized);
    const current = loadAssessmentResultsIfExists(context, this.storageRoot);
    current.push(toStoredAssessmentResult(normalized));
    saveAssessmentResults(current, { storageRoot: this.storageRoot, context });
    return normalized;
  }

  getById(assessmentResultId) {
    return walkFiles(this.storageRoot, 'assessment-results.json')
      .map((filePath) => readJson(filePath))
      .flatMap((payload) =>
        (payload.assessment_results || []).map((result, index) =>
          fromStoredAssessmentResult(result, {
            learner_key: payload.context?.learner_key || result.learner_key || 'anonymous',
            course_id: payload.context?.course_id || result.course_id,
            module_id: payload.context?.module_id || result.module_id,
            week: payload.context?.week || result.week
          }, index)
        )
      )
      .find((record) => record.assessment_result_id === assessmentResultId) || null;
  }

  listByLearnerModule(identity) {
    const normalized = normalizeLearningIdentity(identity);
    return loadAssessmentResultsIfExists(buildStorageContext(normalized), this.storageRoot)
      .map((result, index) => fromStoredAssessmentResult(result, normalized, index));
  }

  listByAttempt(attemptId) {
    return walkFiles(this.storageRoot, 'assessment-results.json')
      .map((filePath) => readJson(filePath))
      .flatMap((payload) =>
        (payload.assessment_results || []).map((result, index) =>
          fromStoredAssessmentResult(result, {
            learner_key: payload.context?.learner_key || result.learner_key || 'anonymous',
            course_id: payload.context?.course_id || result.course_id,
            module_id: payload.context?.module_id || result.module_id,
            week: payload.context?.week || result.week
          }, index)
        )
      )
      .filter((record) => record.attempt_id === attemptId);
  }

  listByActivity(activityScope) {
    const activityId = activityScope.activity_id || activityScope.activityId;
    return this.listByLearnerModule(activityScope).filter((record) => record.activity_id === activityId);
  }

  exists(assessmentResultId) {
    return Boolean(this.getById(assessmentResultId));
  }
}

class FileBackedAnalyticsEventRepository extends AnalyticsEventRepository {
  constructor({ storageRoot }) {
    super();
    this.storageRoot = storageRoot;
  }

  append(eventRecord) {
    return this.appendMany([eventRecord])[0];
  }

  appendMany(eventRecords) {
    if (!Array.isArray(eventRecords) || eventRecords.length === 0) {
      throw new Error('eventRecords must include at least one record.');
    }

    const normalizedRecords = eventRecords.map(validateAnalyticsEventRecord);
    const context = buildStorageContext(normalizedRecords[0]);
    const current = loadAnalyticsEventsIfExists(context, this.storageRoot);
    normalizedRecords.forEach((record) => {
      current.push(toStoredAnalyticsEvent(record));
    });
    saveAnalyticsEvents(current, { storageRoot: this.storageRoot, context });
    return normalizedRecords;
  }

  getById(eventId) {
    return walkFiles(this.storageRoot, 'analytics-events.json')
      .map((filePath) => readJson(filePath))
      .flatMap((payload) =>
        (payload.events || []).map((event, index) =>
          fromStoredAnalyticsEvent(event, {
            learner_key: payload.context?.learner_key || event.learner_key || 'anonymous',
            course_id: payload.context?.course_id || event.course_id,
            module_id: payload.context?.module_id || event.module_id,
            week: payload.context?.week || event.week
          }, index)
        )
      )
      .find((record) => record.event_id === eventId) || null;
  }

  listByLearnerModule(identity) {
    const normalized = normalizeLearningIdentity(identity);
    return loadAnalyticsEventsIfExists(buildStorageContext(normalized), this.storageRoot)
      .map((event, index) => fromStoredAnalyticsEvent(event, normalized, index));
  }

  listByLearnerWeek(identity) {
    return this.listByLearnerModule(identity);
  }

  listBySource(sourceScope) {
    const sourceType = sourceScope.source_type || sourceScope.sourceType;
    const sourceId = sourceScope.source_id || sourceScope.sourceId;
    return this.listByLearnerModule(sourceScope).filter((record) =>
      record.source_type === sourceType && record.source_id === sourceId
    );
  }

  exists(eventId) {
    return Boolean(this.getById(eventId));
  }
}

class FileBackedLearningRecordStore {
  constructor(options = {}) {
    this.storageRoot = options.storageRoot || DEFAULT_STORAGE_ROOT;
    this.learnerModuleStates = assertLearnerModuleStateRepository(
      new FileBackedLearnerModuleStateRepository({ storageRoot: this.storageRoot })
    );
    this.attempts = assertAttemptRecordRepository(
      new FileBackedAttemptRecordRepository({ storageRoot: this.storageRoot })
    );
    this.assessmentResults = assertAssessmentResultRepository(
      new FileBackedAssessmentResultRepository({ storageRoot: this.storageRoot })
    );
    this.analyticsEvents = assertAnalyticsEventRepository(
      new FileBackedAnalyticsEventRepository({ storageRoot: this.storageRoot })
    );
  }
}

function createFileBackedLearningRecordStore(options = {}) {
  return new FileBackedLearningRecordStore(options);
}

module.exports = {
  FileBackedLearningRecordStore,
  createFileBackedLearningRecordStore
};
