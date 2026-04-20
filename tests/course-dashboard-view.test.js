'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { runDemoWeekWorkflow } = require('../tools/run-demo-week-workflow');
const { getCourseOutputFilePath } = require('../tools/course-dashboard-data');

const tempParent = path.join(__dirname, '.tmp');
fs.mkdirSync(tempParent, { recursive: true });
const tempRoot = fs.mkdtempSync(path.join(tempParent, 'course-dashboard-view-'));

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

  const courseDashboardHtmlPath = getCourseOutputFilePath('SMAC001', 'course-dashboard.html', outputRoot);
  const courseDashboardDataPath = getCourseOutputFilePath('SMAC001', 'course-dashboard-data.json', outputRoot);
  const html = fs.readFileSync(courseDashboardHtmlPath, 'utf8');

  assert.equal(fs.existsSync(courseDashboardHtmlPath), true);
  assert.equal(fs.existsSync(courseDashboardDataPath), true);
  assert.match(html, /แดชบอร์ดภาพรวมรายวิชา/);
  assert.match(html, /ภาพรวมทั้งรายวิชา/);
  assert.match(html, /รายการสัปดาห์ที่มีข้อมูล/);
  assert.match(html, /สัปดาห์ที่ 1/);
  assert.match(html, /สัปดาห์ที่ 3/);
  assert.match(html, /course-dashboard-data\.json/);
}
finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

console.log('course dashboard view tests passed');
