'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {
  DEFAULT_STORAGE_ROOT,
  buildArtifactContext,
  getArtifactDirectory
} = require('./persistence');
const {
  buildLearningRecordIdentity,
  createLearningRecordProjectionServices,
  loadCourseDefinition
} = require('./learning-record-read-layer');

const DEFAULT_OUTPUT_ROOT = path.join(__dirname, '..', 'outputs');

function readJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function getWeekOutputDirectory(context, outputRoot = DEFAULT_OUTPUT_ROOT) {
  const normalized = buildArtifactContext({
    courseId: context.course_id || context.courseId,
    moduleId: context.module_id || context.moduleId,
    week: context.week
  });

  return path.join(
    outputRoot,
    normalized.course_id,
    normalized.module_id,
    `week-${String(normalized.week).padStart(2, '0')}`
  );
}

function getWeekOutputFilePath(context, fileName, outputRoot = DEFAULT_OUTPUT_ROOT) {
  return path.join(getWeekOutputDirectory(context, outputRoot), fileName);
}

function loadWeekBundle(context, options = {}) {
  return readJsonFile(getWeekOutputFilePath(context, 'week-bundle.json', options.outputRoot));
}

function loadWorkflowSummary(context, options = {}) {
  return readJsonFile(getWeekOutputFilePath(context, 'workflow-summary.json', options.outputRoot));
}

function buildTeacherDashboardData(context, options = {}) {
  const normalized = buildArtifactContext({
    courseId: context.course_id || context.courseId,
    moduleId: context.module_id || context.moduleId,
    week: context.week
  });
  const outputRoot = options.outputRoot || DEFAULT_OUTPUT_ROOT;
  const storageRoot = options.storageRoot || DEFAULT_STORAGE_ROOT;
  const learnerKey = options.learnerKey;
  const { course } = loadCourseDefinition(options);
  const { projectionAssemblyService } = createLearningRecordProjectionServices({ storageRoot });
  const bundle = loadWeekBundle(normalized, { outputRoot });
  const workflowSummary = loadWorkflowSummary(normalized, { outputRoot });
  const identity = buildLearningRecordIdentity(normalized, learnerKey);
  const teacherWeekProjection = projectionAssemblyService.buildTeacherWeekProjection({
    identity,
    course,
    bundle
  });

  return {
    dashboard_type: 'teacher_week_dashboard_v1',
    context: normalized,
    module: teacherWeekProjection.module,
    runtime_summary: teacherWeekProjection.runtime_summary,
    cqi_summary: {
      total_clos: teacherWeekProjection.cqi_summary.total_clos ?? 0,
      attained_clos: teacherWeekProjection.cqi_summary.attained_clos ?? 0,
      attainment_rate_percent: teacherWeekProjection.cqi_summary.attainment_rate_percent ?? 0,
      clos_requiring_action: teacherWeekProjection.cqi_summary.clos_requiring_action ?? 0
    },
    artifact_counts: {
      assessment_results: teacherWeekProjection.canonical_counts.assessment_result_records,
      analytics_events: teacherWeekProjection.canonical_counts.analytics_event_records,
      cqi_clo_reports: teacherWeekProjection.cqi_summary.total_clos
    },
    files: {
      dashboard_html: getWeekOutputFilePath(normalized, 'dashboard.html', outputRoot),
      dashboard_data_json: getWeekOutputFilePath(normalized, 'dashboard-data.json', outputRoot),
      week_bundle_html: getWeekOutputFilePath(normalized, 'week-bundle.html', outputRoot),
      week_bundle_json: getWeekOutputFilePath(normalized, 'week-bundle.json', outputRoot),
      cqi_report_markdown: getWeekOutputFilePath(normalized, 'cqi-report.md', outputRoot),
      workflow_summary_markdown: getWeekOutputFilePath(normalized, 'workflow-summary.md', outputRoot),
      workflow_summary_json: getWeekOutputFilePath(normalized, 'workflow-summary.json', outputRoot),
      runtime_state_json: path.join(getArtifactDirectory(normalized, storageRoot), 'runtime-state.json'),
      assessment_results_json: path.join(getArtifactDirectory(normalized, storageRoot), 'assessment-results.json'),
      analytics_events_json: path.join(getArtifactDirectory(normalized, storageRoot), 'analytics-events.json'),
      cqi_report_json: path.join(getArtifactDirectory(normalized, storageRoot), 'cqi-report.json')
    },
    storage: {
      output_directory: getWeekOutputDirectory(normalized, outputRoot),
      artifact_directory: getArtifactDirectory(normalized, storageRoot)
    },
    workflow_summary: workflowSummary
  };
}

module.exports = {
  DEFAULT_OUTPUT_ROOT,
  buildTeacherDashboardData,
  getWeekOutputDirectory,
  getWeekOutputFilePath,
  loadWeekBundle,
  loadWorkflowSummary
};
