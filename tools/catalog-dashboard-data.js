'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { buildCourseDashboardData, DEFAULT_OUTPUT_ROOT, getCourseOutputFilePath } = require('./course-dashboard-data');

function listIndexedCourses(options = {}) {
  const outputRoot = options.outputRoot || DEFAULT_OUTPUT_ROOT;

  if (!fs.existsSync(outputRoot)) {
    return [];
  }

  return fs.readdirSync(outputRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((courseId) => fs.existsSync(getCourseOutputFilePath(courseId, 'course-dashboard-data.json', outputRoot)))
    .sort();
}

function roundToTwoDecimals(value) {
  return Math.round(value * 100) / 100;
}

function summarizeCatalogCourses(courseItems) {
  if (courseItems.length === 0) {
    return {
      indexed_courses: 0,
      indexed_weeks: 0,
      completed_weeks: 0,
      average_course_progress_percent: 0,
      total_assessment_results: 0,
      total_analytics_events: 0
    };
  }

  const totals = courseItems.reduce((accumulator, item) => {
    accumulator.indexed_weeks += Number(item.overview.indexed_weeks || 0);
    accumulator.completed_weeks += Number(item.overview.completed_weeks || 0);
    accumulator.average_course_progress_percent += Number(item.overview.average_progress_percent || 0);
    accumulator.total_assessment_results += Number(item.overview.total_assessment_results || 0);
    accumulator.total_analytics_events += Number(item.overview.total_analytics_events || 0);
    return accumulator;
  }, {
    indexed_weeks: 0,
    completed_weeks: 0,
    average_course_progress_percent: 0,
    total_assessment_results: 0,
    total_analytics_events: 0
  });

  return {
    indexed_courses: courseItems.length,
    indexed_weeks: totals.indexed_weeks,
    completed_weeks: totals.completed_weeks,
    average_course_progress_percent: roundToTwoDecimals(totals.average_course_progress_percent / courseItems.length),
    total_assessment_results: totals.total_assessment_results,
    total_analytics_events: totals.total_analytics_events
  };
}

function buildCatalogDashboardData(options = {}) {
  const outputRoot = options.outputRoot || DEFAULT_OUTPUT_ROOT;
  const storageRoot = options.storageRoot;
  const courseIds = options.courseIds || listIndexedCourses({ outputRoot });
  const courses = courseIds
    .map((courseId) => buildCourseDashboardData(courseId, { outputRoot, storageRoot }))
    .map((courseDashboard) => ({
      context: courseDashboard.context,
      overview: courseDashboard.overview,
      files: {
        course_dashboard_html: getCourseOutputFilePath(courseDashboard.context.course_id, 'course-dashboard.html', outputRoot),
        course_dashboard_data_json: getCourseOutputFilePath(courseDashboard.context.course_id, 'course-dashboard-data.json', outputRoot)
      }
    }));

  return {
    dashboard_type: 'teacher_catalog_dashboard_v1',
    overview: summarizeCatalogCourses(courses),
    courses
  };
}

function getCatalogOutputFilePath(fileName, outputRoot = DEFAULT_OUTPUT_ROOT) {
  return path.join(outputRoot, fileName);
}

module.exports = {
  buildCatalogDashboardData,
  getCatalogOutputFilePath,
  listIndexedCourses,
  summarizeCatalogCourses
};
