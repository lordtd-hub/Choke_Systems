'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { buildTeacherDashboardData, DEFAULT_OUTPUT_ROOT } = require('./teacher-dashboard-data');
const { DEFAULT_STORAGE_ROOT } = require('./persistence');

function parseWeekFromDirectoryName(name) {
  const match = /^week-(\d+)$/.exec(name);
  return match ? Number(match[1]) : null;
}

function listIndexedWeekContexts(courseId, options = {}) {
  const outputRoot = options.outputRoot || DEFAULT_OUTPUT_ROOT;
  const courseDir = path.join(outputRoot, courseId);

  if (!fs.existsSync(courseDir)) {
    return [];
  }

  return fs.readdirSync(courseDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((moduleEntry) => {
      const moduleDir = path.join(courseDir, moduleEntry.name);
      return fs.readdirSync(moduleDir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((weekEntry) => ({
          module_id: moduleEntry.name,
          week: parseWeekFromDirectoryName(weekEntry.name)
        }))
        .filter((item) => Number.isInteger(item.week))
        .map((item) => ({
          course_id: courseId,
          module_id: item.module_id,
          week: item.week
        }));
    })
    .sort((left, right) => left.week - right.week || left.module_id.localeCompare(right.module_id));
}

function roundToTwoDecimals(value) {
  return Math.round(value * 100) / 100;
}

function summarizeCourseWeeks(weekItems) {
  if (weekItems.length === 0) {
    return {
      indexed_weeks: 0,
      completed_weeks: 0,
      average_progress_percent: 0,
      total_clos: 0,
      attained_clos: 0,
      average_attainment_rate_percent: 0,
      clos_requiring_action: 0,
      total_assessment_results: 0,
      total_analytics_events: 0
    };
  }

  const totals = weekItems.reduce((accumulator, item) => {
    accumulator.completed_weeks += item.runtime_summary.status === 'completed' ? 1 : 0;
    accumulator.progress_percent += Number(item.runtime_summary.progress_percent || 0);
    accumulator.total_clos += Number(item.cqi_summary.total_clos || 0);
    accumulator.attained_clos += Number(item.cqi_summary.attained_clos || 0);
    accumulator.attainment_rate_percent += Number(item.cqi_summary.attainment_rate_percent || 0);
    accumulator.clos_requiring_action += Number(item.cqi_summary.clos_requiring_action || 0);
    accumulator.total_assessment_results += Number(item.artifact_counts.assessment_results || 0);
    accumulator.total_analytics_events += Number(item.artifact_counts.analytics_events || 0);
    return accumulator;
  }, {
    completed_weeks: 0,
    progress_percent: 0,
    total_clos: 0,
    attained_clos: 0,
    attainment_rate_percent: 0,
    clos_requiring_action: 0,
    total_assessment_results: 0,
    total_analytics_events: 0
  });

  return {
    indexed_weeks: weekItems.length,
    completed_weeks: totals.completed_weeks,
    average_progress_percent: roundToTwoDecimals(totals.progress_percent / weekItems.length),
    total_clos: totals.total_clos,
    attained_clos: totals.attained_clos,
    average_attainment_rate_percent: roundToTwoDecimals(totals.attainment_rate_percent / weekItems.length),
    clos_requiring_action: totals.clos_requiring_action,
    total_assessment_results: totals.total_assessment_results,
    total_analytics_events: totals.total_analytics_events
  };
}

function buildCourseDashboardData(courseId, options = {}) {
  const outputRoot = options.outputRoot || DEFAULT_OUTPUT_ROOT;
  const storageRoot = options.storageRoot || DEFAULT_STORAGE_ROOT;
  const contexts = options.contexts || listIndexedWeekContexts(courseId, { outputRoot });
  const weeks = contexts.map((context) => buildTeacherDashboardData(context, { outputRoot, storageRoot }))
    .map((item) => ({
      context: item.context,
      module: item.module,
      runtime_summary: item.runtime_summary,
      cqi_summary: item.cqi_summary,
      artifact_counts: item.artifact_counts,
      files: {
        dashboard_html: item.files.dashboard_html,
        dashboard_data_json: item.files.dashboard_data_json,
        week_bundle_html: item.files.week_bundle_html,
        cqi_report_markdown: item.files.cqi_report_markdown
      }
    }))
    .sort((left, right) => left.context.week - right.context.week || left.context.module_id.localeCompare(right.context.module_id));

  return {
    dashboard_type: 'teacher_course_dashboard_v1',
    context: {
      course_id: courseId
    },
    overview: summarizeCourseWeeks(weeks),
    weeks
  };
}

function getCourseOutputDirectory(courseId, outputRoot = DEFAULT_OUTPUT_ROOT) {
  return path.join(outputRoot, courseId);
}

function getCourseOutputFilePath(courseId, fileName, outputRoot = DEFAULT_OUTPUT_ROOT) {
  return path.join(getCourseOutputDirectory(courseId, outputRoot), fileName);
}

module.exports = {
  DEFAULT_OUTPUT_ROOT,
  buildCourseDashboardData,
  getCourseOutputDirectory,
  getCourseOutputFilePath,
  listIndexedWeekContexts,
  summarizeCourseWeeks
};
