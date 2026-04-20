'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { runDemoWeekWorkflow } = require('../tools/run-demo-week-workflow');
const { buildCatalogDashboardData, getCatalogOutputFilePath, listIndexedCourses } = require('../tools/catalog-dashboard-data');

const tempParent = path.join(__dirname, '.tmp');
fs.mkdirSync(tempParent, { recursive: true });
const tempRoot = fs.mkdtempSync(path.join(tempParent, 'catalog-dashboard-data-'));

try {
  const outputRoot = path.join(tempRoot, 'outputs');
  const storageRoot = path.join(tempRoot, 'storage');

  runDemoWeekWorkflow({
    coursePath: path.join(__dirname, '..', 'calculus1_course.yaml'),
    weeklyPlanPath: path.join(__dirname, '..', 'calculus1_weekly_plan.yaml'),
    week: 1,
    outputRoot,
    storageRoot
  });

  runDemoWeekWorkflow({
    coursePath: path.join(__dirname, '..', 'calculus1_course.yaml'),
    weeklyPlanPath: path.join(__dirname, '..', 'calculus1_weekly_plan.yaml'),
    week: 3,
    outputRoot,
    storageRoot
  });

  const courseIds = listIndexedCourses({ outputRoot });
  const catalogDashboard = buildCatalogDashboardData({ outputRoot, storageRoot });

  assert.deepEqual(courseIds, ['SMAC001']);
  assert.equal(catalogDashboard.dashboard_type, 'teacher_catalog_dashboard_v1');
  assert.equal(catalogDashboard.overview.indexed_courses, 1);
  assert.equal(catalogDashboard.overview.indexed_weeks, 2);
  assert.equal(catalogDashboard.overview.completed_weeks, 2);
  assert.equal(catalogDashboard.courses.length, 1);
  assert.equal(catalogDashboard.courses[0].context.course_id, 'SMAC001');
  assert.equal(fs.existsSync(catalogDashboard.courses[0].files.course_dashboard_html), true);
  assert.equal(fs.existsSync(catalogDashboard.courses[0].files.course_dashboard_data_json), true);
  assert.equal(fs.existsSync(catalogDashboard.courses[0].files.course_output_registry_json), true);
  assert.equal(catalogDashboard.courses[0].files.build_history_json.endsWith('build-history.json'), true);
  assert.equal(fs.existsSync(catalogDashboard.files.build_control_data_json), true);
  assert.equal(fs.existsSync(catalogDashboard.files.build_control_html), true);
  assert.equal(fs.existsSync(catalogDashboard.files.system_output_registry_json), true);
  assert.equal(fs.existsSync(getCatalogOutputFilePath('catalog-dashboard-data.json', outputRoot)), true);
}
finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

console.log('catalog dashboard data tests passed');
