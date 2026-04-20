'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { buildCourseDashboardData, getCourseOutputFilePath } = require('./course-dashboard-data');
const { buildCatalogDashboardData, getCatalogOutputFilePath } = require('./catalog-dashboard-data');
const { refreshInstructorOutputs } = require('./refresh-instructor-outputs');
const { renderCourseDashboardPage } = require('../frontend/course-dashboard-view');
const { renderCatalogDashboardPage } = require('../frontend/catalog-dashboard-view');

function ensureDirectory(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeJsonFile(filePath, payload) {
  ensureDirectory(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

function writeTextFile(filePath, content) {
  ensureDirectory(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf8');
}

function publishSystemOutputs({
  courseId,
  coursePath,
  weeklyPlanPath,
  outputRoot,
  storageRoot
}) {
  const courseDashboardDataPath = getCourseOutputFilePath(courseId, 'course-dashboard-data.json', outputRoot);
  const courseDashboardHtmlPath = getCourseOutputFilePath(courseId, 'course-dashboard.html', outputRoot);
  const courseDashboardData = buildCourseDashboardData(courseId, {
    outputRoot,
    storageRoot
  });
  writeJsonFile(courseDashboardDataPath, courseDashboardData);
  writeTextFile(courseDashboardHtmlPath, renderCourseDashboardPage(courseDashboardData));

  const catalogDashboardDataPath = getCatalogOutputFilePath('catalog-dashboard-data.json', outputRoot);
  const catalogDashboardHtmlPath = getCatalogOutputFilePath('catalog-dashboard.html', outputRoot);
  const catalogDashboardData = buildCatalogDashboardData({
    outputRoot,
    storageRoot
  });
  writeJsonFile(catalogDashboardDataPath, catalogDashboardData);
  writeTextFile(catalogDashboardHtmlPath, renderCatalogDashboardPage(catalogDashboardData));

  const instructorOutputs = refreshInstructorOutputs({
    coursePath,
    weeklyPlanPath,
    outputRoot
  });

  return {
    course_dashboard_data_json: courseDashboardDataPath,
    course_dashboard_html: courseDashboardHtmlPath,
    catalog_dashboard_data_json: catalogDashboardDataPath,
    catalog_dashboard_html: catalogDashboardHtmlPath,
    course_output_registry_json: instructorOutputs.files.course_output_registry_json,
    build_control_data_json: instructorOutputs.files.build_control_data_json,
    build_control_html: instructorOutputs.files.build_control_html
  };
}

module.exports = {
  publishSystemOutputs
};
