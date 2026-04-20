'use strict';

const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_STORAGE_ROOT = path.join(__dirname, '..', '.data');

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

function ensureInteger(value, fieldName) {
  const normalized = Number(value);
  if (!Number.isInteger(normalized) || normalized < 1) {
    throw new Error(`${fieldName} must be a positive integer.`);
  }
  return normalized;
}

function ensureDirectory(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJsonFile(filePath, payload) {
  ensureDirectory(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  return filePath;
}

function buildArtifactContext({ courseId, moduleId, week }) {
  return {
    course_id: ensureNonEmptyString(courseId, 'courseId'),
    module_id: ensureNonEmptyString(moduleId, 'moduleId'),
    week: ensureInteger(week, 'week')
  };
}

function buildContextFromRuntimeState(runtimeState) {
  const root = runtimeState?.runtime_state;
  if (!root) {
    throw new Error('runtime_state payload is required.');
  }

  return buildArtifactContext({
    courseId: root.course_id,
    moduleId: root.module_id,
    week: root.week
  });
}

function buildContextFromCqiReport(report) {
  const context = report?.context;
  if (!context) {
    throw new Error('cqi report context is required.');
  }

  return buildArtifactContext({
    courseId: context.course_id,
    moduleId: context.module_id,
    week: context.week
  });
}

function buildContextFromAssessmentResults(assessmentResults, context = {}) {
  const first = (assessmentResults || [])[0] || {};

  return buildArtifactContext({
    courseId: context.courseId || context.course_id || first.course_id,
    moduleId: context.moduleId || context.module_id || first.module_id,
    week: context.week || first.week
  });
}

function buildContextFromAnalyticsEvents(events, context = {}) {
  const first = (events || [])[0] || {};

  return buildArtifactContext({
    courseId: context.courseId || context.course_id || first.course_id,
    moduleId: context.moduleId || context.module_id || first.module_id,
    week: context.week || first.week
  });
}

function getArtifactDirectory(context, storageRoot = DEFAULT_STORAGE_ROOT) {
  const normalized = buildArtifactContext({
    courseId: context.course_id || context.courseId,
    moduleId: context.module_id || context.moduleId,
    week: context.week
  });

  return path.join(
    storageRoot,
    normalized.course_id,
    normalized.module_id,
    `week-${String(normalized.week).padStart(2, '0')}`
  );
}

function getArtifactFilePath(context, fileName, storageRoot = DEFAULT_STORAGE_ROOT) {
  return path.join(getArtifactDirectory(context, storageRoot), fileName);
}

function saveRuntimeState(runtimeState, options = {}) {
  const context = buildContextFromRuntimeState(runtimeState);
  const filePath = getArtifactFilePath(context, 'runtime-state.json', options.storageRoot);
  writeJsonFile(filePath, runtimeState);
  return { context, file_path: filePath };
}

function loadRuntimeState(context, options = {}) {
  return readJsonFile(getArtifactFilePath(context, 'runtime-state.json', options.storageRoot));
}

function saveAssessmentResults(assessmentResults, options = {}) {
  const context = buildContextFromAssessmentResults(assessmentResults, options.context);
  const filePath = getArtifactFilePath(context, 'assessment-results.json', options.storageRoot);
  writeJsonFile(filePath, {
    context,
    assessment_results: clone(assessmentResults || [])
  });
  return { context, file_path: filePath };
}

function loadAssessmentResults(context, options = {}) {
  return readJsonFile(getArtifactFilePath(context, 'assessment-results.json', options.storageRoot));
}

function saveAnalyticsEvents(events, options = {}) {
  const context = buildContextFromAnalyticsEvents(events, options.context);
  const filePath = getArtifactFilePath(context, 'analytics-events.json', options.storageRoot);
  writeJsonFile(filePath, {
    context,
    events: clone(events || [])
  });
  return { context, file_path: filePath };
}

function loadAnalyticsEvents(context, options = {}) {
  return readJsonFile(getArtifactFilePath(context, 'analytics-events.json', options.storageRoot));
}

function saveCqiReport(report, options = {}) {
  const context = buildContextFromCqiReport(report);
  const filePath = getArtifactFilePath(context, 'cqi-report.json', options.storageRoot);
  writeJsonFile(filePath, report);
  return { context, file_path: filePath };
}

function loadCqiReport(context, options = {}) {
  return readJsonFile(getArtifactFilePath(context, 'cqi-report.json', options.storageRoot));
}

function saveLearningArtifacts({
  runtimeState,
  assessmentResults = [],
  analyticsEvents = [],
  cqiReport = null,
  storageRoot = DEFAULT_STORAGE_ROOT
}) {
  if (!runtimeState?.runtime_state) {
    throw new Error('runtime_state payload is required.');
  }

  const context = buildContextFromRuntimeState(runtimeState);
  const saved = {
    context,
    directory: getArtifactDirectory(context, storageRoot),
    runtime_state: saveRuntimeState(runtimeState, { storageRoot }).file_path,
    assessment_results: saveAssessmentResults(assessmentResults, { storageRoot, context }).file_path,
    analytics_events: saveAnalyticsEvents(analyticsEvents, { storageRoot, context }).file_path
  };

  if (cqiReport) {
    saved.cqi_report = saveCqiReport(cqiReport, { storageRoot }).file_path;
  }

  return saved;
}

function loadLearningArtifacts(context, options = {}) {
  const normalized = buildArtifactContext({
    courseId: context.course_id || context.courseId,
    moduleId: context.module_id || context.moduleId,
    week: context.week
  });
  const payload = {
    context: normalized,
    runtime_state: loadRuntimeState(normalized, options),
    assessment_results: loadAssessmentResults(normalized, options),
    analytics_events: loadAnalyticsEvents(normalized, options)
  };

  const cqiPath = getArtifactFilePath(normalized, 'cqi-report.json', options.storageRoot);
  if (fs.existsSync(cqiPath)) {
    payload.cqi_report = readJsonFile(cqiPath);
  }

  return payload;
}

module.exports = {
  DEFAULT_STORAGE_ROOT,
  buildArtifactContext,
  getArtifactDirectory,
  getArtifactFilePath,
  loadAnalyticsEvents,
  loadAssessmentResults,
  loadCqiReport,
  loadLearningArtifacts,
  loadRuntimeState,
  saveAnalyticsEvents,
  saveAssessmentResults,
  saveCqiReport,
  saveLearningArtifacts,
  saveRuntimeState
};
