'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {
  DEFAULT_STORAGE_ROOT,
  buildArtifactContext,
  getArtifactDirectory,
  loadLearningArtifacts
} = require('./persistence');
const { getRuntimeSummary } = require('./runtime-state');

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
  const bundle = loadWeekBundle(normalized, { outputRoot });
  const workflowSummary = loadWorkflowSummary(normalized, { outputRoot });
  const artifacts = loadLearningArtifacts(normalized, { storageRoot });
  const runtimeSummary = getRuntimeSummary(artifacts.runtime_state);
  const moduleRoot = bundle.interactive_module;
  const cqiOverview = artifacts.cqi_report?.overview || {};

  return {
    dashboard_type: 'teacher_week_dashboard_v1',
    context: normalized,
    module: {
      title: moduleRoot.title,
      clo_focus: moduleRoot.clo_focus,
      section_count: (moduleRoot.learning_flow || []).length,
      activity_count: (moduleRoot.activities || []).length,
      supplementary_material_count: (bundle.supplementary_materials || []).length,
      sbra_payload_count: (bundle.sbra_payloads || []).length
    },
    runtime_summary: runtimeSummary,
    cqi_summary: {
      total_clos: cqiOverview.total_clos ?? 0,
      attained_clos: cqiOverview.attained_clos ?? 0,
      attainment_rate_percent: cqiOverview.attainment_rate_percent ?? 0,
      clos_requiring_action: cqiOverview.clos_requiring_action ?? 0
    },
    artifact_counts: {
      assessment_results: (artifacts.assessment_results?.assessment_results || []).length,
      analytics_events: (artifacts.analytics_events?.events || []).length,
      cqi_clo_reports: (artifacts.cqi_report?.clo_reports || []).length
    },
    files: {
      dashboard_html: getWeekOutputFilePath(normalized, 'dashboard.html', outputRoot),
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
