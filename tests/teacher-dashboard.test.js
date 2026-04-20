'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { runDemoWeekWorkflow } = require('../tools/run-demo-week-workflow');

const tempParent = path.join(__dirname, '.tmp');
fs.mkdirSync(tempParent, { recursive: true });
const tempRoot = fs.mkdtempSync(path.join(tempParent, 'teacher-dashboard-'));

try {
  const outputRoot = path.join(tempRoot, 'outputs');
  const storageRoot = path.join(tempRoot, 'storage');
  const summary = runDemoWeekWorkflow({
    coursePath: path.join(__dirname, '..', 'calculus1_course.yaml'),
    weeklyPlanPath: path.join(__dirname, '..', 'calculus1_weekly_plan.yaml'),
    week: 3,
    outputRoot,
    storageRoot
  });

  const dashboardHtml = fs.readFileSync(summary.files.dashboard_html, 'utf8');

  assert.match(dashboardHtml, /แดชบอร์ดภาพรวมรายสัปดาห์/);
  assert.match(dashboardHtml, /ทางเข้าหลัก/);
  assert.match(dashboardHtml, /เปิดหน้าบทเรียน/);
  assert.match(dashboardHtml, /เปิดรายงาน CQI/);
  assert.match(dashboardHtml, /เปิดข้อมูล dashboard/);
  assert.match(dashboardHtml, /backend read-model/);
  assert.match(dashboardHtml, /dashboard-data\.json/);
  assert.match(dashboardHtml, /workflow-summary\.md/);
  assert.match(dashboardHtml, /สัปดาห์ที่ 3/);
}
finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

console.log('teacher dashboard tests passed');
