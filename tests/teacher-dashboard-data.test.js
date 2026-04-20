'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { runDemoWeekWorkflow } = require('../tools/run-demo-week-workflow');
const { buildTeacherDashboardData } = require('../tools/teacher-dashboard-data');

const tempParent = path.join(__dirname, '.tmp');
fs.mkdirSync(tempParent, { recursive: true });
const tempRoot = fs.mkdtempSync(path.join(tempParent, 'teacher-dashboard-data-'));

try {
  const outputRoot = path.join(tempRoot, 'outputs');
  const storageRoot = path.join(tempRoot, 'storage');
  runDemoWeekWorkflow({
    coursePath: path.join(__dirname, '..', 'calculus1_course.yaml'),
    weeklyPlanPath: path.join(__dirname, '..', 'calculus1_weekly_plan.yaml'),
    week: 3,
    outputRoot,
    storageRoot
  });

  const dashboardData = buildTeacherDashboardData(
    { course_id: 'SMAC001', module_id: 'SMAC001_w03', week: 3 },
    { outputRoot, storageRoot }
  );

  assert.equal(dashboardData.dashboard_type, 'teacher_week_dashboard_v1');
  assert.equal(dashboardData.context.course_id, 'SMAC001');
  assert.equal(dashboardData.context.module_id, 'SMAC001_w03');
  assert.equal(dashboardData.context.week, 3);
  assert.equal(dashboardData.runtime_summary.progress_percent, 100);
  assert.equal(dashboardData.module.activity_count, 3);
  assert.equal(dashboardData.module.sbra_payload_count, 1);
  assert.equal(dashboardData.cqi_summary.total_clos >= 5, true);
  assert.equal(dashboardData.artifact_counts.analytics_events >= 1, true);
  assert.equal(fs.existsSync(dashboardData.files.week_bundle_json), true);
  assert.equal(fs.existsSync(dashboardData.files.runtime_state_json), true);
}
finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

console.log('teacher dashboard data tests passed');
