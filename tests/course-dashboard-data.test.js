'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { runDemoWeekWorkflow } = require('../tools/run-demo-week-workflow');
const { buildCourseDashboardData, listIndexedWeekContexts } = require('../tools/course-dashboard-data');

const tempParent = path.join(__dirname, '.tmp');
fs.mkdirSync(tempParent, { recursive: true });
const tempRoot = fs.mkdtempSync(path.join(tempParent, 'course-dashboard-data-'));

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

  const contexts = listIndexedWeekContexts('SMAC001', { outputRoot });
  const courseDashboard = buildCourseDashboardData('SMAC001', { outputRoot, storageRoot });

  assert.equal(contexts.length, 2);
  assert.deepEqual(contexts.map((item) => item.week), [1, 3]);

  assert.equal(courseDashboard.dashboard_type, 'teacher_course_dashboard_v1');
  assert.equal(courseDashboard.context.course_id, 'SMAC001');
  assert.equal(courseDashboard.overview.indexed_weeks, 2);
  assert.equal(courseDashboard.overview.completed_weeks, 2);
  assert.equal(courseDashboard.overview.average_progress_percent, 100);
  assert.equal(courseDashboard.weeks.length, 2);
  assert.equal(courseDashboard.weeks[0].context.week, 1);
  assert.equal(courseDashboard.weeks[1].context.week, 3);
  assert.equal(courseDashboard.weeks[1].module.sbra_payload_count, 1);
  assert.equal(courseDashboard.weeks[0].artifact_counts.analytics_events >= 1, true);
  assert.equal(fs.existsSync(courseDashboard.weeks[0].files.dashboard_html), true);
  assert.equal(fs.existsSync(courseDashboard.weeks[1].files.dashboard_data_json), true);
}
finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

console.log('course dashboard data tests passed');
