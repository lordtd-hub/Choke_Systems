'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { runDemoWeekWorkflow } = require('../tools/run-demo-week-workflow');
const { getCatalogOutputFilePath } = require('../tools/catalog-dashboard-data');

const tempParent = path.join(__dirname, '.tmp');
fs.mkdirSync(tempParent, { recursive: true });
const tempRoot = fs.mkdtempSync(path.join(tempParent, 'catalog-dashboard-view-'));

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

  const catalogDashboardHtmlPath = getCatalogOutputFilePath('catalog-dashboard.html', outputRoot);
  const catalogDashboardDataPath = getCatalogOutputFilePath('catalog-dashboard-data.json', outputRoot);
  const html = fs.readFileSync(catalogDashboardHtmlPath, 'utf8');

  assert.equal(fs.existsSync(catalogDashboardHtmlPath), true);
  assert.equal(fs.existsSync(catalogDashboardDataPath), true);
  assert.match(html, /แคตตาล็อกแดชบอร์ดระบบ/);
  assert.match(html, /ภาพรวมทั้งระบบ/);
  assert.match(html, /รายการรายวิชาที่มีข้อมูล/);
  assert.match(html, /SMAC001/);
  assert.match(html, /catalog-dashboard-data\.json/);
  assert.match(html, /build-control\.html/);
  assert.match(html, /system-output-registry\.json/);
  assert.match(html, /course-dashboard\.html/);
  assert.match(html, /course-output-registry\.json/);
  assert.match(html, /course-action-queue\.json/);
}
finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

console.log('catalog dashboard view tests passed');
